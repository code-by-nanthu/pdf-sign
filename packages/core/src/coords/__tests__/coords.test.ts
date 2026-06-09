import { describe, it, expect } from 'vitest'
import {
  overlayToPdf,
  pdfToOverlay,
  overlayDimensionsToPdf,
  pdfDimensionsToOverlay,
  clampToPdfPage,
} from '../index.js'
import type { ViewportInfo } from '../index.js'

// Standard A4 PDF at 595 × 842 pts rendered into a 595 × 842 CSS px canvas (scale 1:1)
const VIEWPORT_1_TO_1: ViewportInfo = {
  cssWidth: 595,
  cssHeight: 842,
  pdfNaturalWidth: 595,
  pdfNaturalHeight: 842,
}

// A4 PDF rendered at half CSS size (zoom out scenario)
const VIEWPORT_HALF: ViewportInfo = {
  cssWidth: 297.5,
  cssHeight: 421,
  pdfNaturalWidth: 595,
  pdfNaturalHeight: 842,
}

// US Letter PDF (612 × 792 pts) rendered at 1:1
const VIEWPORT_LETTER: ViewportInfo = {
  cssWidth: 612,
  cssHeight: 792,
  pdfNaturalWidth: 612,
  pdfNaturalHeight: 792,
}

describe('overlayToPdf', () => {
  it('maps top-left overlay corner to top-left PDF coords (y-flipped)', () => {
    const result = overlayToPdf(0, 0, 0, VIEWPORT_1_TO_1)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(842) // y inverted: top of overlay = max PDF y
    expect(result.page).toBe(0)
  })

  it('maps bottom-left overlay corner to PDF origin (0, 0)', () => {
    const result = overlayToPdf(0, 842, 0, VIEWPORT_1_TO_1)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0)
  })

  it('maps centre of overlay correctly', () => {
    const result = overlayToPdf(297.5, 421, 0, VIEWPORT_1_TO_1)
    expect(result.x).toBeCloseTo(297.5)
    expect(result.y).toBeCloseTo(421)
  })

  it('scales correctly when canvas is smaller than PDF natural size', () => {
    // Half-size canvas: overlay pixel 100,100 → PDF pt 200,642
    const result = overlayToPdf(100, 100, 0, VIEWPORT_HALF)
    expect(result.x).toBeCloseTo(200)     // 100 * (595/297.5)
    expect(result.y).toBeCloseTo(642)     // 842 - 100 * (842/421)
  })

  it('preserves page number', () => {
    const result = overlayToPdf(10, 10, 3, VIEWPORT_1_TO_1)
    expect(result.page).toBe(3)
  })

  it('handles US Letter dimensions', () => {
    const result = overlayToPdf(0, 792, 0, VIEWPORT_LETTER)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0)
  })

  it('handles landscape viewport (width > height)', () => {
    const landscape: ViewportInfo = {
      cssWidth: 842,
      cssHeight: 595,
      pdfNaturalWidth: 842,
      pdfNaturalHeight: 595,
    }
    const result = overlayToPdf(0, 0, 0, landscape)
    expect(result.y).toBeCloseTo(595)
  })
})

describe('pdfToOverlay', () => {
  it('maps PDF bottom-left to overlay bottom-left', () => {
    const result = pdfToOverlay({ x: 0, y: 0, width: 0, height: 0, page: 0 }, VIEWPORT_1_TO_1)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(842)
  })

  it('maps PDF top-left (0, maxY) to overlay top-left', () => {
    const result = pdfToOverlay(
      { x: 0, y: 842, width: 0, height: 0, page: 0 },
      VIEWPORT_1_TO_1,
    )
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0)
  })

  it('round-trips correctly (overlay → pdf → overlay)', () => {
    const original = { overlayX: 150, overlayY: 300 }
    const pdf = overlayToPdf(original.overlayX, original.overlayY, 0, VIEWPORT_1_TO_1)
    const back = pdfToOverlay({ ...pdf, width: 0, height: 0 }, VIEWPORT_1_TO_1)
    expect(back.x).toBeCloseTo(original.overlayX)
    expect(back.y).toBeCloseTo(original.overlayY)
  })

  it('accounts for field height in y position', () => {
    // A 50pt tall field at y=100 (PDF) should render with its top at overlay y = 842-100-50=692
    const result = pdfToOverlay(
      { x: 0, y: 100, width: 100, height: 50, page: 0 },
      VIEWPORT_1_TO_1,
    )
    expect(result.y).toBeCloseTo(692)
    expect(result.height).toBeCloseTo(50)
    expect(result.width).toBeCloseTo(100)
  })

  it('scales correctly when canvas is smaller than PDF', () => {
    const result = pdfToOverlay(
      { x: 200, y: 200, width: 100, height: 50, page: 0 },
      VIEWPORT_HALF,
    )
    expect(result.x).toBeCloseTo(100)      // 200 * (297.5/595)
    expect(result.width).toBeCloseTo(50)   // 100 * (297.5/595)
    expect(result.height).toBeCloseTo(25)  // 50  * (421/842)
  })
})

describe('overlayDimensionsToPdf', () => {
  it('converts 1:1 scale correctly', () => {
    const result = overlayDimensionsToPdf(100, 50, VIEWPORT_1_TO_1)
    expect(result.width).toBeCloseTo(100)
    expect(result.height).toBeCloseTo(50)
  })

  it('scales up when canvas is smaller', () => {
    const result = overlayDimensionsToPdf(50, 25, VIEWPORT_HALF)
    expect(result.width).toBeCloseTo(100)
    expect(result.height).toBeCloseTo(50)
  })
})

describe('pdfDimensionsToOverlay', () => {
  it('converts 1:1 scale correctly', () => {
    const result = pdfDimensionsToOverlay(100, 50, VIEWPORT_1_TO_1)
    expect(result.width).toBeCloseTo(100)
    expect(result.height).toBeCloseTo(50)
  })

  it('scales down when canvas is smaller', () => {
    const result = pdfDimensionsToOverlay(100, 50, VIEWPORT_HALF)
    expect(result.width).toBeCloseTo(50)
    expect(result.height).toBeCloseTo(25)
  })
})

describe('clampToPdfPage', () => {
  it('does not clamp a rect fully within the page', () => {
    const rect = { x: 100, y: 100, width: 100, height: 50, page: 0 }
    const result = clampToPdfPage(rect, VIEWPORT_1_TO_1)
    expect(result).toEqual(rect)
  })

  it('clamps x position that would overflow right edge', () => {
    const rect = { x: 550, y: 100, width: 100, height: 50, page: 0 }
    const result = clampToPdfPage(rect, VIEWPORT_1_TO_1)
    expect(result.x).toBe(495) // 595 - 100
    expect(result.width).toBe(100)
  })

  it('clamps y position that would overflow top edge', () => {
    const rect = { x: 0, y: 800, width: 100, height: 100, page: 0 }
    const result = clampToPdfPage(rect, VIEWPORT_1_TO_1)
    expect(result.y).toBe(742) // 842 - 100
    expect(result.height).toBe(100)
  })

  it('clamps negative x to 0', () => {
    const rect = { x: -10, y: 100, width: 100, height: 50, page: 0 }
    const result = clampToPdfPage(rect, VIEWPORT_1_TO_1)
    expect(result.x).toBe(0)
  })

  it('clamps width when it exceeds page width', () => {
    const rect = { x: 500, y: 100, width: 200, height: 50, page: 0 }
    const result = clampToPdfPage(rect, VIEWPORT_1_TO_1)
    expect(result.x).toBe(395) // clamped x
    expect(result.width).toBe(200) // width preserved but clamped via x clamp
  })
})
