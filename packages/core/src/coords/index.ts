import type { PdfRect, OverlayRect } from '../types/index.js'

export interface ViewportInfo {
  /** Width of the canvas element in CSS pixels (getBoundingClientRect). */
  cssWidth: number
  /** Height of the canvas element in CSS pixels. */
  cssHeight: number
  /**
   * Width of the PDF page in user-space units (pts) at scale=1.
   * Retrieve via: page.getViewport({ scale: 1 }).width
   */
  pdfNaturalWidth: number
  /**
   * Height of the PDF page in user-space units (pts) at scale=1.
   */
  pdfNaturalHeight: number
}

/**
 * Convert a position in the overlay (CSS pixels, top-left origin, y↓)
 * to PDF user-space coordinates (pts, bottom-left origin, y↑).
 *
 * @param overlayX - X position in CSS pixels from left edge of canvas
 * @param overlayY - Y position in CSS pixels from top edge of canvas
 * @param page     - 0-indexed page number
 * @param viewport - Current viewport dimensions
 */
export function overlayToPdf(
  overlayX: number,
  overlayY: number,
  page: number,
  viewport: ViewportInfo,
): PdfRect {
  const scaleX = viewport.pdfNaturalWidth / viewport.cssWidth
  const scaleY = viewport.pdfNaturalHeight / viewport.cssHeight

  return {
    x: overlayX * scaleX,
    // PDF y-axis is inverted: origin is bottom-left, y increases upward
    y: viewport.pdfNaturalHeight - overlayY * scaleY,
    width: 0,
    height: 0,
    page,
  }
}

/**
 * Convert a PDF rectangle (pts, bottom-left origin, y↑)
 * to an overlay rectangle (CSS pixels, top-left origin, y↓).
 *
 * @param pdfRect  - Rectangle in PDF user-space units
 * @param viewport - Current viewport dimensions
 */
export function pdfToOverlay(
  pdfRect: PdfRect,
  viewport: ViewportInfo,
): OverlayRect {
  const scaleX = viewport.cssWidth / viewport.pdfNaturalWidth
  const scaleY = viewport.cssHeight / viewport.pdfNaturalHeight

  return {
    x: pdfRect.x * scaleX,
    // Invert y: PDF bottom-left → browser top-left
    y: (viewport.pdfNaturalHeight - pdfRect.y - pdfRect.height) * scaleY,
    width: pdfRect.width * scaleX,
    height: pdfRect.height * scaleY,
    page: pdfRect.page,
  }
}

/**
 * Convert overlay width/height (CSS pixels) to PDF pts.
 */
export function overlayDimensionsToPdf(
  cssWidth: number,
  cssHeight: number,
  viewport: ViewportInfo,
): { width: number; height: number } {
  return {
    width: cssWidth * (viewport.pdfNaturalWidth / viewport.cssWidth),
    height: cssHeight * (viewport.pdfNaturalHeight / viewport.cssHeight),
  }
}

/**
 * Convert PDF width/height (pts) to CSS pixels.
 */
export function pdfDimensionsToOverlay(
  pdfWidth: number,
  pdfHeight: number,
  viewport: ViewportInfo,
): { width: number; height: number } {
  return {
    width: pdfWidth * (viewport.cssWidth / viewport.pdfNaturalWidth),
    height: pdfHeight * (viewport.cssHeight / viewport.pdfNaturalHeight),
  }
}

/**
 * Clamp a PdfRect so it does not extend beyond the page boundaries.
 */
export function clampToPdfPage(rect: PdfRect, viewport: ViewportInfo): PdfRect {
  const maxX = viewport.pdfNaturalWidth
  const maxY = viewport.pdfNaturalHeight

  const x = Math.max(0, Math.min(rect.x, maxX - rect.width))
  const y = Math.max(0, Math.min(rect.y, maxY - rect.height))
  const width = Math.min(rect.width, maxX - x)
  const height = Math.min(rect.height, maxY - y)

  return { ...rect, x, y, width, height }
}

/**
 * Build a complete ViewportInfo from a pdf.js PDFPageProxy and a canvas element.
 * Safe to call after page.getViewport({ scale: 1 }) has been obtained.
 *
 * @param naturalViewportWidth  - page.getViewport({ scale: 1 }).width
 * @param naturalViewportHeight - page.getViewport({ scale: 1 }).height
 * @param canvasEl              - The HTMLCanvasElement the page is rendered into
 */
export function buildViewportInfo(
  naturalViewportWidth: number,
  naturalViewportHeight: number,
  canvasEl: HTMLElement,
): ViewportInfo {
  const rect = canvasEl.getBoundingClientRect()
  return {
    cssWidth: rect.width,
    cssHeight: rect.height,
    pdfNaturalWidth: naturalViewportWidth,
    pdfNaturalHeight: naturalViewportHeight,
  }
}
