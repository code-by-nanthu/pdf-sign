import type { FieldDef, CompletedFieldValue } from '../types/index.js'

// We type pdf-lib objects loosely to avoid importing them at the top
// level (dynamic import in PdfExporter keeps the module SSR-safe).
// The actual types are passed in at call time.
export interface RenderContext {
  page: {
    drawImage: (image: unknown, options: Record<string, unknown>) => void
    drawText: (text: string, options: Record<string, unknown>) => void
    drawRectangle: (options: Record<string, unknown>) => void
    drawLine: (options: Record<string, unknown>) => void
    getSize: () => { width: number; height: number }
  }
  pdfDoc: {
    embedPng: (bytes: Uint8Array | ArrayBuffer) => Promise<unknown>
    embedJpg: (bytes: Uint8Array | ArrayBuffer) => Promise<unknown>
    embedFont: (fontBytes: Uint8Array | ArrayBuffer) => Promise<unknown>
  }
  fonts: {
    helvetica: unknown   // PDFFont
    helveticaBold: unknown
  }
  rgb: (r: number, g: number, b: number) => unknown
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a PDF rect (bottom-left origin, y increases up) to pdf-lib
 * drawing coordinates. pdf-lib uses the same coordinate system as the
 * PDF spec so no inversion is needed — we just pass x/y/width/height
 * directly to drawImage / drawText etc.
 */
function pdfLibRect(field: FieldDef) {
  return {
    x: field.rect.x,
    y: field.rect.y,
    width: field.rect.width,
    height: field.rect.height,
  }
}

/**
 * Decode a base64 data URL to a Uint8Array.
 * Handles both "data:image/png;base64,..." and bare base64 strings.
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Detect whether a data URL or bytes are PNG or JPEG.
 */
export function detectImageType(dataUrl: string): 'png' | 'jpeg' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'jpeg'
  }
  return 'png' // default to PNG
}

/**
 * Parse a hex colour string (#rrggbb or #rgb) to pdf-lib rgb() values [0–1].
 * Falls back to black on parse failure.
 */
export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0]! + clean[0]!, 16) / 255,
      g: parseInt(clean[1]! + clean[1]!, 16) / 255,
      b: parseInt(clean[2]! + clean[2]!, 16) / 255,
    }
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16) / 255,
      g: parseInt(clean.slice(2, 4), 16) / 255,
      b: parseInt(clean.slice(4, 6), 16) / 255,
    }
  }
  return { r: 0, g: 0, b: 0 }
}

// ── Per-type renderers ─────────────────────────────────────────────────────

/**
 * Render a signature, initials, or stamp field.
 * Value must be a base64 data URL (PNG or JPEG).
 */
export async function renderImageField(
  field: FieldDef,
  value: CompletedFieldValue,
  ctx: RenderContext,
): Promise<void> {
  if (typeof value.value !== 'string') return

  const bytes = dataUrlToBytes(value.value)
  const type = detectImageType(value.value)
  const image = type === 'jpeg'
    ? await ctx.pdfDoc.embedJpg(bytes)
    : await ctx.pdfDoc.embedPng(bytes)

  const r = pdfLibRect(field)
  ctx.page.drawImage(image, {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
  })
}

/**
 * Render a text or textarea field.
 * Value must be a string.
 */
export function renderTextField(
  field: FieldDef,
  value: CompletedFieldValue,
  ctx: RenderContext,
): void {
  if (typeof value.value !== 'string' || value.value.trim() === '') return

  const fontSize = field.appearance?.fontSize ?? 11
  const colorHex = field.appearance?.fontColor ?? '#000000'
  const { r, g, b } = hexToRgb(colorHex)

  const r2 = pdfLibRect(field)

  // For multiline, we do a simple word-wrap by splitting on newlines
  const lines = value.value.split('\n')
  const lineHeight = fontSize * 1.3
  let currentY = r2.y + r2.height - fontSize

  for (const line of lines) {
    if (currentY < r2.y) break // clip to field bounds
    ctx.page.drawText(line, {
      x: r2.x + 2, // 2pt left padding
      y: currentY,
      size: fontSize,
      font: ctx.fonts.helvetica,
      color: ctx.rgb(r, g, b),
      maxWidth: r2.width - 4,
    })
    currentY -= lineHeight
  }
}

/**
 * Render a date-signed field.
 * Value must be an ISO 8601 string — formatted to locale date on render.
 */
export function renderDateField(
  field: FieldDef,
  value: CompletedFieldValue,
  ctx: RenderContext,
): void {
  if (typeof value.value !== 'string') return

  const date = new Date(value.value)
  const formatted = isNaN(date.getTime())
    ? value.value
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  const fontSize = field.appearance?.fontSize ?? 11
  const colorHex = field.appearance?.fontColor ?? '#000000'
  const { r, g, b } = hexToRgb(colorHex)
  const r2 = pdfLibRect(field)

  ctx.page.drawText(formatted, {
    x: r2.x + 2,
    y: r2.y + (r2.height - fontSize) / 2,
    size: fontSize,
    font: ctx.fonts.helvetica,
    color: ctx.rgb(r, g, b),
    maxWidth: r2.width - 4,
  })
}

/**
 * Render a checkbox field.
 * Value must be boolean. Draws a border and, if true, a checkmark (✓).
 */
export function renderCheckboxField(
  field: FieldDef,
  value: CompletedFieldValue,
  ctx: RenderContext,
): void {
  const checked = value.value === true || value.value === 'true'
  const r = pdfLibRect(field)
  const size = Math.min(r.width, r.height)
  const x = r.x + (r.width - size) / 2
  const y = r.y + (r.height - size) / 2

  // Draw border
  ctx.page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    borderColor: ctx.rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
    color: ctx.rgb(1, 1, 1),
  })

  if (checked) {
    // Draw checkmark as two lines
    const pad = size * 0.2
    ctx.page.drawLine({
      start: { x: x + pad, y: y + size * 0.45 },
      end: { x: x + size * 0.4, y: y + pad },
      thickness: 1.5,
      color: ctx.rgb(0.1, 0.5, 0.1),
    })
    ctx.page.drawLine({
      start: { x: x + size * 0.4, y: y + pad },
      end: { x: x + size - pad, y: y + size * 0.75 },
      thickness: 1.5,
      color: ctx.rgb(0.1, 0.5, 0.1),
    })
  }
}

/**
 * Render a radio, dropdown, or any other field whose value is a
 * selected string option.
 */
export function renderOptionField(
  field: FieldDef,
  value: CompletedFieldValue,
  ctx: RenderContext,
): void {
  if (typeof value.value !== 'string') return

  const fontSize = field.appearance?.fontSize ?? 11
  const r = pdfLibRect(field)

  ctx.page.drawText(value.value, {
    x: r.x + 2,
    y: r.y + (r.height - fontSize) / 2,
    size: fontSize,
    font: ctx.fonts.helvetica,
    color: ctx.rgb(0, 0, 0),
    maxWidth: r.width - 4,
  })
}
