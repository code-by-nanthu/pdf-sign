import type {
  PdfTemplate,
  FieldDef,
  CompletedFieldValue,
  SigningResult,
} from '../types/index.js'
import { sha256Hex } from '../utils/hash.js'
import {
  renderImageField,
  renderTextField,
  renderDateField,
  renderCheckboxField,
  renderOptionField,
} from './renderers.js'
import { buildAuditLines, renderAuditPage } from './audit.js'
import type { RenderContext } from './renderers.js'

export interface ExportOptions {
  /**
   * Whether to append an audit certificate page.
   * Default: true.
   */
  includeAuditPage?: boolean
}

export interface ExportResult {
  /** The completed, flattened PDF as Uint8Array. */
  pdfBytes: Uint8Array
  /** SHA-256 hex digest of pdfBytes. */
  finalHash: string
}

/**
 * PdfExporter
 *
 * Flattens completed field values into the original PDF bytes using
 * pdf-lib, optionally appends an audit certificate page, and returns
 * the final PDF bytes + their SHA-256 hash.
 *
 * Usage (called by framework adapter before controller.submit()):
 *
 *   const exporter = new PdfExporter()
 *   const { pdfBytes, finalHash } = await exporter.export(
 *     originalPdfBytes,
 *     template,
 *     signingResult,
 *     completedValues,
 *   )
 *   await controller.submit(pdfBytes)
 */
export class PdfExporter {
  /**
   * Export a signed PDF.
   *
   * @param originalBytes   - The original PDF bytes (from controller.pdfBytes)
   * @param template        - The PdfTemplate used for this signing session
   * @param result          - Partial SigningResult (without pdfBytes/finalHash yet)
   * @param completedValues - All completed field values
   * @param options         - Export options
   */
  async export(
    originalBytes: Uint8Array,
    template: PdfTemplate,
    result: Omit<SigningResult, 'pdfBytes' | 'finalPdfHash'>,
    completedValues: CompletedFieldValue[],
    options: ExportOptions = {},
  ): Promise<ExportResult> {
    const includeAuditPage = options.includeAuditPage ?? true

    // Dynamic import — keeps module SSR-safe
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

    // Load the original document
    const pdfDoc = await PDFDocument.load(originalBytes)

    // Embed standard fonts once for the whole document
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const fonts = { helvetica, helveticaBold }

    // Build a map of fieldId → completed value for O(1) lookup
    const valueMap = new Map<string, CompletedFieldValue>(
      completedValues.map((v) => [v.fieldId, v]),
    )

    // Render each completed field onto its page
    for (const field of template.fields) {
      const completed = valueMap.get(field.id)
      if (!completed) continue // skip uncompleted optional fields

      const pageIndex = field.rect.page
      if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue

      const page = pdfDoc.getPage(pageIndex)

      const ctx: RenderContext = {
        page: page as unknown as RenderContext['page'],
        pdfDoc: pdfDoc as unknown as RenderContext['pdfDoc'],
        fonts,
        rgb,
      }

      await this.renderField(field, completed, ctx)
    }

    // Append audit certificate page
    if (includeAuditPage) {
      const auditPageSize: [number, number] = [595, 842]
      const auditPage = pdfDoc.addPage(auditPageSize)

      const auditCtx = {
        pdfDoc: pdfDoc as unknown as Parameters<typeof renderAuditPage>[1]['pdfDoc'],
        page: auditPage as unknown as Parameters<typeof renderAuditPage>[1]['page'],
        fonts,
        rgb,
      }

      const fullResult: SigningResult = {
        ...result,
        pdfBytes: new Uint8Array(0), // placeholder
        finalPdfHash: '',             // placeholder
      }

      const lines = buildAuditLines(fullResult, template)
      renderAuditPage(lines, auditCtx)
    }

    // Serialise to bytes
    const finalBytes = await pdfDoc.save()
    const pdfBytes = new Uint8Array(finalBytes)
    const finalHash = await sha256Hex(pdfBytes)

    return { pdfBytes, finalHash }
  }

  // ── Per-field dispatch ─────────────────────────────────────────────────────

  private async renderField(
    field: FieldDef,
    value: CompletedFieldValue,
    ctx: RenderContext,
  ): Promise<void> {
    switch (field.type) {
      case 'signature':
      case 'initials':
      case 'stamp':
        await renderImageField(field, value, ctx)
        break

      case 'text':
      case 'textarea':
        renderTextField(field, value, ctx)
        break

      case 'date-signed':
        renderDateField(field, value, ctx)
        break

      case 'checkbox':
        renderCheckboxField(field, value, ctx)
        break

      case 'radio':
      case 'dropdown':
        renderOptionField(field, value, ctx)
        break

      default:
        // Custom field type — skip silently.
        // Custom types should call renderToPdf themselves via
        // the CustomFieldTypeDef.renderToPdf callback.
        break
    }
  }
}
