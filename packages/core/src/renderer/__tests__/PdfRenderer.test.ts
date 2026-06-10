import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PdfRenderer } from '../PdfRenderer.js'
import type {
  PdfDocumentProxy,
  PdfPageProxy,
  PdfPageViewport,
  PdfRenderTask,
} from '../PdfRenderer.js'

// ── Mock factory helpers ───────────────────────────────────────────────────

function makeMockViewport(
  width = 595,
  height = 842,
  scale = 1,
): PdfPageViewport {
  return {
    width: width * scale,
    height: height * scale,
    scale,
    rotation: 0,
    clone({ scale: s = scale } = {}) {
      return makeMockViewport(width, height, s)
    },
  }
}

function makeMockRenderTask(): PdfRenderTask {
  let cancelled = false
  return {
    promise: new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (cancelled) {
          const err = new Error('Rendering cancelled')
          err.name = 'RenderingCancelledException'
          reject(err)
        } else {
          resolve()
        }
      }, 0)
    }),
    cancel() {
      cancelled = true
    },
  }
}

function makeMockPage(
  pageNumber = 1,
  width = 595,
  height = 842,
): PdfPageProxy {
  return {
    pageNumber,
    getViewport({ scale = 1 }) {
      return makeMockViewport(width, height, scale)
    },
    render(_params) {
      return makeMockRenderTask()
    },
    cleanup: vi.fn(),
  }
}

function makeMockDocument(
  numPages = 3,
  pageWidth = 595,
  pageHeight = 842,
): PdfDocumentProxy {
  return {
    numPages,
    async getPage(pageNumber: number) {
      return makeMockPage(pageNumber, pageWidth, pageHeight)
    },
    async destroy() {},
  }
}

// ── Canvas mock ────────────────────────────────────────────────────────────

function makeMockCanvas(cssWidth = 595, cssHeight = 842): HTMLCanvasElement {
  const canvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    getContext: vi.fn(() => ({
      setTransform: vi.fn(),
    })),
    getBoundingClientRect: vi.fn(() => ({
      width: cssWidth,
      height: cssHeight,
      top: 0,
      left: 0,
      right: cssWidth,
      bottom: cssHeight,
    })),
  } as unknown as HTMLCanvasElement
  return canvas
}

// ── Module mock for pdfjs-dist ─────────────────────────────────────────────

// We mock the dynamic import('pdfjs-dist') used in PdfRenderer.load()
// so tests never actually load pdf.js.
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}))

// ── Tests ──────────────────────────────────────────────────────────────────

describe('PdfRenderer', () => {
  let renderer: PdfRenderer
  let mockDoc: PdfDocumentProxy

  beforeEach(async () => {
    renderer = new PdfRenderer({ devicePixelRatio: 1 })
    mockDoc = makeMockDocument(3)

    // Wire up the getDocument mock to return our mock document
    const pdfjs = await import('pdfjs-dist')
    vi.mocked(pdfjs.getDocument).mockReturnValue({
      promise: Promise.resolve(mockDoc),
    } as ReturnType<typeof pdfjs.getDocument>)
  })

  afterEach(async () => {
    await renderer.destroy()
    vi.clearAllMocks()
  })

  // ── Initial state ────────────────────────────────────────────────────────

  it('starts unloaded', () => {
    expect(renderer.isLoaded).toBe(false)
    expect(renderer.numPages).toBe(0)
  })

  // ── load() ───────────────────────────────────────────────────────────────

  describe('load()', () => {
    it('loads a document and returns page count', async () => {
      const count = await renderer.load(new Uint8Array([1, 2, 3]))
      expect(count).toBe(3)
      expect(renderer.numPages).toBe(3)
      expect(renderer.isLoaded).toBe(true)
    })

    it('passes a copy of the bytes to getDocument', async () => {
      const pdfjs = await import('pdfjs-dist')
      const bytes = new Uint8Array([1, 2, 3])
      await renderer.load(bytes)
      const call = vi.mocked(pdfjs.getDocument).mock.calls[0]![0] as { data: Uint8Array }
      // Confirm it's a different object (slice was called)
      expect(call.data).not.toBe(bytes)
      expect(Array.from(call.data)).toEqual([1, 2, 3])
    })

    it('replaces a previously loaded document', async () => {
      await renderer.load(new Uint8Array([1]))
      const destroySpy = vi.spyOn(mockDoc, 'destroy')
      const newDoc = makeMockDocument(5)
      const pdfjs = await import('pdfjs-dist')
      vi.mocked(pdfjs.getDocument).mockReturnValue({
        promise: Promise.resolve(newDoc),
      } as ReturnType<typeof pdfjs.getDocument>)
      await renderer.load(new Uint8Array([2]))
      expect(destroySpy).toHaveBeenCalledOnce()
      expect(renderer.numPages).toBe(5)
    })

    it('clears the page cache on reload', async () => {
      await renderer.load(new Uint8Array([1]))
      await renderer.getPage(0) // populates cache
      const newDoc = makeMockDocument(2)
      const pdfjs = await import('pdfjs-dist')
      vi.mocked(pdfjs.getDocument).mockReturnValue({
        promise: Promise.resolve(newDoc),
      } as ReturnType<typeof pdfjs.getDocument>)
      await renderer.load(new Uint8Array([2]))
      // After reload, getPage should call newDoc.getPage, not use old cache
      const getPageSpy = vi.spyOn(newDoc, 'getPage')
      await renderer.getPage(0)
      expect(getPageSpy).toHaveBeenCalledOnce()
    })
  })

  // ── getPage() ─────────────────────────────────────────────────────────────

  describe('getPage()', () => {
    beforeEach(async () => {
      await renderer.load(new Uint8Array([1]))
    })

    it('returns a page for valid index', async () => {
      const page = await renderer.getPage(0)
      expect(page.pageNumber).toBe(1)
    })

    it('throws for out-of-range index', async () => {
      await expect(renderer.getPage(10)).rejects.toThrow('out of range')
    })

    it('throws for negative index', async () => {
      await expect(renderer.getPage(-1)).rejects.toThrow('out of range')
    })

    it('throws if document not loaded', async () => {
      const r = new PdfRenderer()
      await expect(r.getPage(0)).rejects.toThrow('No document loaded')
    })

    it('caches pages — getPage() on doc is called only once per page', async () => {
      const spy = vi.spyOn(mockDoc, 'getPage')
      await renderer.getPage(0)
      await renderer.getPage(0)
      expect(spy).toHaveBeenCalledOnce()
    })

    it('different pages are cached independently', async () => {
      const spy = vi.spyOn(mockDoc, 'getPage')
      await renderer.getPage(0)
      await renderer.getPage(1)
      await renderer.getPage(0) // from cache
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  // ── resolveScale() ────────────────────────────────────────────────────────

  describe('resolveScale()', () => {
    beforeEach(async () => {
      await renderer.load(new Uint8Array([1]))
    })

    it('returns explicit scale value', async () => {
      const s = await renderer.resolveScale({ type: 'scale', value: 1.5 })
      expect(s).toBeCloseTo(1.5)
    })

    it('clamps scale to maxScale', async () => {
      const s = await renderer.resolveScale({ type: 'scale', value: 100 })
      expect(s).toBe(5.0)
    })

    it('clamps scale to minScale', async () => {
      const s = await renderer.resolveScale({ type: 'scale', value: 0.01 })
      expect(s).toBe(0.25)
    })

    it('fit-width scales to container width', async () => {
      // A4 page is 595pt wide; container 297.5px → scale should be 0.5
      const s = await renderer.resolveScale(
        { type: 'fit-width', containerWidth: 297.5 },
        0,
      )
      expect(s).toBeCloseTo(0.5)
    })

    it('fit-page uses the smaller of x/y scales', async () => {
      // A4 595×842. Container 300×300.
      // scaleX = 300/595 ≈ 0.504, scaleY = 300/842 ≈ 0.356 → min = 0.356
      const s = await renderer.resolveScale(
        { type: 'fit-page', containerWidth: 300, containerHeight: 300 },
        0,
      )
      expect(s).toBeCloseTo(0.356, 2)
    })
  })

  // ── zoomIn / zoomOut ──────────────────────────────────────────────────────

  describe('zoomIn() / zoomOut()', () => {
    it('zoomIn multiplies scale by 1.25', () => {
      const r = new PdfRenderer({ devicePixelRatio: 1 })
      expect(r.zoomIn()).toBeCloseTo(1.25)
    })

    it('zoomOut multiplies scale by 0.8', () => {
      const r = new PdfRenderer({ devicePixelRatio: 1 })
      expect(r.zoomOut()).toBeCloseTo(0.8)
    })

    it('zoomIn clamps at maxScale', () => {
      const r = new PdfRenderer({ devicePixelRatio: 1, maxScale: 1.0 })
      expect(r.zoomIn()).toBe(1.0)
    })

    it('zoomOut clamps at minScale', () => {
      const r = new PdfRenderer({ devicePixelRatio: 1, minScale: 1.0 })
      expect(r.zoomOut()).toBe(1.0)
    })
  })

  // ── renderPage() ──────────────────────────────────────────────────────────

  describe('renderPage()', () => {
    let canvas: HTMLCanvasElement

    beforeEach(async () => {
      await renderer.load(new Uint8Array([1]))
      canvas = makeMockCanvas(595, 842)
    })

    it('throws if no document is loaded', async () => {
      const r = new PdfRenderer()
      await expect(r.renderPage(0, canvas)).rejects.toThrow('No document loaded')
    })

    it('returns a RenderPageResult', async () => {
      const result = await renderer.renderPage(0, canvas)
      expect(result.page).toBe(0)
      expect(result.scale).toBeGreaterThan(0)
      expect(result.viewport).toBeDefined()
      expect(result.canvasWidth).toBeGreaterThan(0)
      expect(result.canvasHeight).toBeGreaterThan(0)
    })

    it('sets canvas CSS dimensions to logical pixels', async () => {
      await renderer.renderPage(0, canvas, { type: 'scale', value: 1.0 })
      expect(canvas.style.width).toBe('595px')
      expect(canvas.style.height).toBe('842px')
    })

    it('physical canvas dimensions scale with devicePixelRatio', async () => {
      const hiDpiRenderer = new PdfRenderer({ devicePixelRatio: 2 })
      const pdfjs = await import('pdfjs-dist')
      vi.mocked(pdfjs.getDocument).mockReturnValue({
        promise: Promise.resolve(makeMockDocument(1)),
      } as ReturnType<typeof pdfjs.getDocument>)
      await hiDpiRenderer.load(new Uint8Array([1]))
      await hiDpiRenderer.renderPage(0, canvas, { type: 'scale', value: 1.0 })
      // Physical = 595 * 2 = 1190
      expect(canvas.width).toBe(1190)
      expect(canvas.height).toBe(1684)
      await hiDpiRenderer.destroy()
    })

    it('viewport has correct natural PDF dimensions', async () => {
      const result = await renderer.renderPage(0, canvas, { type: 'scale', value: 1.0 })
      expect(result.viewport.pdfNaturalWidth).toBeCloseTo(595)
      expect(result.viewport.pdfNaturalHeight).toBeCloseTo(842)
    })

    it('viewport cssWidth matches canvas CSS width', async () => {
      await renderer.renderPage(0, canvas, { type: 'scale', value: 1.0 })
      // canvas.getBoundingClientRect returns cssWidth=595
      const result = await renderer.renderPage(0, canvas, { type: 'scale', value: 1.0 })
      expect(result.viewport.cssWidth).toBe(595)
    })

    it('updates the internal scale', async () => {
      await renderer.renderPage(0, canvas, { type: 'scale', value: 1.5 })
      expect(renderer.scale).toBeCloseTo(1.5)
    })

    it('calls page.cleanup() after render', async () => {
      const page = await renderer.getPage(0)
      const cleanupSpy = vi.spyOn(page, 'cleanup')
      await renderer.renderPage(0, canvas, { type: 'scale', value: 1.0 })
      expect(cleanupSpy).toHaveBeenCalledOnce()
    })

    it('cancels an in-flight render before starting a new one', async () => {
      // Start first render but don't await it
      const first = renderer.renderPage(0, canvas, { type: 'scale', value: 1.0 })
      // Immediately start second render
      const second = renderer.renderPage(0, canvas, { type: 'scale', value: 1.5 })
      // Both should resolve (first may be cancelled gracefully)
      await expect(Promise.all([first, second])).resolves.toBeDefined()
    })
  })

  // ── getNaturalDimensions() ────────────────────────────────────────────────

  describe('getNaturalDimensions()', () => {
    beforeEach(async () => {
      await renderer.load(new Uint8Array([1]))
    })

    it('returns natural A4 dimensions', async () => {
      const dims = await renderer.getNaturalDimensions(0)
      expect(dims.width).toBeCloseTo(595)
      expect(dims.height).toBeCloseTo(842)
    })

    it('returns dimensions for US Letter pages', async () => {
      const letterDoc = makeMockDocument(1, 612, 792)
      const pdfjs = await import('pdfjs-dist')
      vi.mocked(pdfjs.getDocument).mockReturnValue({
        promise: Promise.resolve(letterDoc),
      } as ReturnType<typeof pdfjs.getDocument>)
      const r = new PdfRenderer({ devicePixelRatio: 1 })
      await r.load(new Uint8Array([1]))
      const dims = await r.getNaturalDimensions(0)
      expect(dims.width).toBeCloseTo(612)
      expect(dims.height).toBeCloseTo(792)
      await r.destroy()
    })
  })

  // ── destroy() ─────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('calls doc.destroy()', async () => {
      await renderer.load(new Uint8Array([1]))
      const destroySpy = vi.spyOn(mockDoc, 'destroy')
      await renderer.destroy()
      expect(destroySpy).toHaveBeenCalledOnce()
    })

    it('clears loaded state', async () => {
      await renderer.load(new Uint8Array([1]))
      await renderer.destroy()
      expect(renderer.isLoaded).toBe(false)
      expect(renderer.numPages).toBe(0)
    })

    it('is safe to call when not loaded', async () => {
      await expect(renderer.destroy()).resolves.not.toThrow()
    })

    it('cancels in-flight render on destroy', async () => {
      await renderer.load(new Uint8Array([1]))
      const canvas = makeMockCanvas()
      // Start a render without awaiting
      const renderPromise = renderer.renderPage(0, canvas)
      // Destroy immediately
      await renderer.destroy()
      // The render promise should resolve (cancel is graceful)
      await expect(renderPromise).resolves.toBeDefined()
    })
  })

  // ── cancelCurrentRender() ─────────────────────────────────────────────────

  describe('cancelCurrentRender()', () => {
    it('is safe to call when no render is in progress', () => {
      expect(() => renderer.cancelCurrentRender()).not.toThrow()
    })
  })
})
