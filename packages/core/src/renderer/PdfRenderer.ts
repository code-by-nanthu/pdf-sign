import type { ViewportInfo } from '../coords/index.js'
import { buildViewportInfo } from '../coords/index.js'

// ── Types that mirror pdf.js internals ────────────────────────────────────
// We type these as interfaces rather than importing from pdfjs-dist so that
// the renderer can be tested without a real pdf.js PDFDocumentProxy.

export interface PdfPageProxy {
  pageNumber: number
  getViewport(params: { scale: number; rotation?: number }): PdfPageViewport
  render(params: PdfRenderParams): PdfRenderTask
  cleanup(): void
}

export interface PdfPageViewport {
  width: number
  height: number
  scale: number
  rotation: number
  clone(params: { scale?: number; rotation?: number }): PdfPageViewport
}

export interface PdfRenderParams {
  canvasContext: CanvasRenderingContext2D
  viewport: PdfPageViewport
}

export interface PdfRenderTask {
  promise: Promise<void>
  cancel(): void
}

export interface PdfDocumentProxy {
  numPages: number
  getPage(pageNumber: number): Promise<PdfPageProxy> // 1-indexed
  destroy(): Promise<void>
}

// ── Zoom mode ─────────────────────────────────────────────────────────────

export type ZoomMode =
  | { type: 'scale'; value: number }        // explicit scale factor
  | { type: 'fit-page'; containerHeight: number; containerWidth: number }
  | { type: 'fit-width'; containerWidth: number }

// ── Renderer options ───────────────────────────────────────────────────────

export interface PdfRendererOptions {
  /**
   * Minimum allowed scale. Default: 0.25 (25%).
   */
  minScale?: number
  /**
   * Maximum allowed scale. Default: 5.0 (500%).
   */
  maxScale?: number
  /**
   * Device pixel ratio used for high-DPI rendering.
   * Default: window.devicePixelRatio ?? 1
   */
  devicePixelRatio?: number
}

// ── Render result ──────────────────────────────────────────────────────────

export interface RenderPageResult {
  /** 0-indexed page number rendered. */
  page: number
  /** Scale factor that was used. */
  scale: number
  /** ViewportInfo ready for the coord mapper. */
  viewport: ViewportInfo
  /** Physical pixel dimensions of the canvas after render. */
  canvasWidth: number
  canvasHeight: number
}

// ── PdfRenderer ────────────────────────────────────────────────────────────

/**
 * Wraps pdf.js v4 for use with PdfSignController.
 *
 * Responsibilities:
 *  - Load a PDF from Uint8Array bytes
 *  - Render individual pages to HTMLCanvasElement
 *  - Manage zoom / scale with fit-page and fit-width helpers
 *  - Produce ViewportInfo after each render for the coord mapper
 *  - Cancel in-flight renders when the page changes
 *  - Clean up pdf.js resources on destroy()
 *
 * Not responsible for:
 *  - Creating or querying the DOM
 *  - Managing which page is "current" (that's PdfSignController)
 *  - Scrolling or pagination UI
 */
export class PdfRenderer {
  private doc: PdfDocumentProxy | null = null
  private pageCache = new Map<number, PdfPageProxy>()
  private currentRenderTask: PdfRenderTask | null = null
  private _scale = 1.0
  private _numPages = 0

  private readonly minScale: number
  private readonly maxScale: number
  private readonly dpr: number

  constructor(options: PdfRendererOptions = {}) {
    this.minScale = options.minScale ?? 0.25
    this.maxScale = options.maxScale ?? 5.0
    this.dpr =
      options.devicePixelRatio ??
      (typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1)
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  get numPages(): number {
    return this._numPages
  }

  get scale(): number {
    return this._scale
  }

  get isLoaded(): boolean {
    return this.doc !== null
  }

  // ── Load ─────────────────────────────────────────────────────────────────

  /**
   * Load a PDF from bytes. Replaces any previously loaded document.
   * Returns the page count.
   *
   * @param bytes - The raw PDF bytes (from PdfSignController.pdfBytes)
   */
  async load(bytes: Uint8Array): Promise<number> {
    // Destroy any existing document first
    await this.destroy()

    // Dynamic import — safe for SSR, deferred until runtime
    const { getDocument } = await import('pdfjs-dist')

    // pdf.js mutates the data array internally; pass a copy so the
    // controller's copy is not corrupted
    const loadingTask = getDocument({ data: bytes.slice() })
    this.doc = await loadingTask.promise
    this._numPages = this.doc.numPages
    this.pageCache.clear()

    return this._numPages
  }

  // ── Page retrieval ───────────────────────────────────────────────────────

  /**
   * Get a pdf.js PDFPageProxy for a page.
   * Pages are 0-indexed externally; pdf.js uses 1-indexed internally.
   * Results are cached for the lifetime of the loaded document.
   */
  async getPage(pageIndex: number): Promise<PdfPageProxy> {
    if (!this.doc) throw new Error('[pdf-sign/core] No document loaded')
    if (pageIndex < 0 || pageIndex >= this._numPages) {
      throw new RangeError(
        `[pdf-sign/core] Page index ${pageIndex} out of range (0–${this._numPages - 1})`,
      )
    }

    const cached = this.pageCache.get(pageIndex)
    if (cached) return cached

    // pdf.js page numbers are 1-indexed
    const page = await this.doc.getPage(pageIndex + 1)
    this.pageCache.set(pageIndex, page)
    return page
  }

  // ── Scale helpers ────────────────────────────────────────────────────────

  /**
   * Resolve a ZoomMode to a concrete scale factor.
   * The resolved scale is clamped to [minScale, maxScale].
   */
  async resolveScale(mode: ZoomMode, pageIndex = 0): Promise<number> {
    if (mode.type === 'scale') {
      return this.clampScale(mode.value)
    }

    const page = await this.getPage(pageIndex)
    const naturalViewport = page.getViewport({ scale: 1 })

    if (mode.type === 'fit-width') {
      return this.clampScale(mode.containerWidth / naturalViewport.width)
    }

    // fit-page — scale to fit both dimensions, use the smaller
    const scaleX = mode.containerWidth / naturalViewport.width
    const scaleY = mode.containerHeight / naturalViewport.height
    return this.clampScale(Math.min(scaleX, scaleY))
  }

  /**
   * Shorthand: zoom in by one step (×1.25).
   */
  zoomIn(): number {
    return this.clampScale(this._scale * 1.25)
  }

  /**
   * Shorthand: zoom out by one step (×0.8).
   */
  zoomOut(): number {
    return this.clampScale(this._scale * 0.8)
  }

  private clampScale(value: number): number {
    return Math.max(this.minScale, Math.min(this.maxScale, value))
  }

  // ── Render ───────────────────────────────────────────────────────────────

  /**
   * Render a page to a canvas element.
   *
   * The canvas is sized to physical pixels (scale × devicePixelRatio).
   * The canvas CSS size is set to logical pixels (scale) so the overlay
   * div can be sized to match with a simple `width: canvas.style.width`.
   *
   * @param pageIndex - 0-indexed page number
   * @param canvas    - HTMLCanvasElement to render into
   * @param zoomMode  - Zoom mode; defaults to the current scale
   */
  async renderPage(
    pageIndex: number,
    canvas: HTMLCanvasElement,
    zoomMode?: ZoomMode,
  ): Promise<RenderPageResult> {
    if (!this.doc) throw new Error('[pdf-sign/core] No document loaded')

    // Cancel any in-flight render
    this.cancelCurrentRender()

    const page = await this.getPage(pageIndex)
    const naturalViewport = page.getViewport({ scale: 1 })

    // Resolve scale
    const targetScale = zoomMode
      ? await this.resolveScale(zoomMode, pageIndex)
      : this._scale
    this._scale = targetScale

    // Build the render viewport at logical scale
    const renderViewport = page.getViewport({ scale: targetScale })

    // Physical canvas dimensions account for devicePixelRatio
    const physicalWidth = Math.floor(renderViewport.width * this.dpr)
    const physicalHeight = Math.floor(renderViewport.height * this.dpr)

    // Size the canvas in physical pixels
    canvas.width = physicalWidth
    canvas.height = physicalHeight

    // CSS size in logical pixels so layout matches
    canvas.style.width = `${renderViewport.width}px`
    canvas.style.height = `${renderViewport.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('[pdf-sign/core] Cannot get 2D context from canvas')

    // Scale the context to account for devicePixelRatio
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    const renderTask = page.render({ canvasContext: ctx, viewport: renderViewport })
    this.currentRenderTask = renderTask

    try {
      await renderTask.promise
    } catch (err) {
      // RenderingCancelledException is thrown when we cancel — not an error
      if (
        err instanceof Error &&
        err.name === 'RenderingCancelledException'
      ) {
        return {
          page: pageIndex,
          scale: targetScale,
          viewport: buildViewportInfo(
            naturalViewport.width,
            naturalViewport.height,
            canvas,
          ),
          canvasWidth: physicalWidth,
          canvasHeight: physicalHeight,
        }
      }
      throw err
    } finally {
      this.currentRenderTask = null
    }

    page.cleanup()

    const viewport = buildViewportInfo(
      naturalViewport.width,
      naturalViewport.height,
      canvas,
    )

    return {
      page: pageIndex,
      scale: targetScale,
      viewport,
      canvasWidth: physicalWidth,
      canvasHeight: physicalHeight,
    }
  }

  // ── Cancel ───────────────────────────────────────────────────────────────

  /**
   * Cancel the current in-flight render, if any.
   * Safe to call when no render is in progress.
   */
  cancelCurrentRender(): void {
    if (this.currentRenderTask) {
      this.currentRenderTask.cancel()
      this.currentRenderTask = null
    }
  }

  // ── Viewport helpers ─────────────────────────────────────────────────────

  /**
   * Build a ViewportInfo for a page without rendering it.
   * Useful when the overlay needs dimensions before the first render.
   *
   * @param pageIndex  - 0-indexed page number
   * @param canvas     - The canvas element (must have CSS size already set)
   */
  async getViewportInfo(
    pageIndex: number,
    canvas: HTMLCanvasElement,
  ): Promise<ViewportInfo> {
    const page = await this.getPage(pageIndex)
    const naturalViewport = page.getViewport({ scale: 1 })
    return buildViewportInfo(naturalViewport.width, naturalViewport.height, canvas)
  }

  /**
   * Get the natural (scale=1) dimensions of a page in PDF user-space pts.
   * Does not require a canvas.
   */
  async getNaturalDimensions(
    pageIndex: number,
  ): Promise<{ width: number; height: number }> {
    const page = await this.getPage(pageIndex)
    const vp = page.getViewport({ scale: 1 })
    return { width: vp.width, height: vp.height }
  }

  // ── Destroy ───────────────────────────────────────────────────────────────

  /**
   * Release all pdf.js resources. Call when the component unmounts.
   */
  async destroy(): Promise<void> {
    this.cancelCurrentRender()
    for (const page of this.pageCache.values()) {
      page.cleanup()
    }
    this.pageCache.clear()
    if (this.doc) {
      await this.doc.destroy()
      this.doc = null
    }
    this._numPages = 0
  }
}
