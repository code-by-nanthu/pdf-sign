import { onUnmounted } from 'vue'
import {
  DragEngine,
  overlayToPdf,
  pdfToOverlay,
  overlayDimensionsToPdf,
  clampToPdfPage,
  type DragEngineOptions,
  type RenderPageResult,
  type PdfRect,
  type OverlayRect,
} from '@pdf-sign/core'

export interface UseDragEngineOptions extends DragEngineOptions {}

export interface UseDragEngineReturn {
  engine: DragEngine
}

export function useDragEngine(options: UseDragEngineOptions = {}): UseDragEngineReturn {
  const engine = new DragEngine(options)
  onUnmounted(() => engine.destroy())
  return { engine }
}

// ── Coordinate conversion helpers exposed for component use ────────────────

/**
 * Convert a palette drop event (overlay px) into a PdfRect for addField.
 * Centers the default field size on the drop point.
 */
export function dropToPdfRect(
  overlayX: number,
  overlayY: number,
  page: number,
  viewport: RenderPageResult['viewport'],
  defaultWidthPt = 150,
  defaultHeightPt = 40,
): PdfRect {
  const halfWPx = (defaultWidthPt / viewport.pdfNaturalWidth) * viewport.cssWidth / 2
  const halfHPx = (defaultHeightPt / viewport.pdfNaturalHeight) * viewport.cssHeight / 2

  const topLeft = overlayToPdf(overlayX - halfWPx, overlayY - halfHPx, page, viewport)

  const raw: PdfRect = {
    x: topLeft.x,
    y: topLeft.y,
    width: defaultWidthPt,
    height: defaultHeightPt,
    page,
  }

  return clampToPdfPage(raw, viewport)
}

/**
 * Convert a field-move-commit overlay rect back to a PdfRect.
 */
export function moveToPdfRect(
  overlayRect: OverlayRect,
  viewport: RenderPageResult['viewport'],
): PdfRect {
  const topLeftPdf = overlayToPdf(overlayRect.x, overlayRect.y, overlayRect.page, viewport)
  const { width, height } = overlayDimensionsToPdf(
    overlayRect.width,
    overlayRect.height,
    viewport,
  )

  const raw: PdfRect = {
    x: topLeftPdf.x,
    y: topLeftPdf.y - height,
    width,
    height,
    page: overlayRect.page,
  }

  return clampToPdfPage(raw, viewport)
}

/**
 * Convert a stored PdfRect to an OverlayRect for rendering field chips.
 */
export { pdfToOverlay as pdfRectToOverlay }
