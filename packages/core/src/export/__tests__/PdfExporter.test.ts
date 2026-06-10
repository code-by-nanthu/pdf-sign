import { describe, it, expect, beforeAll } from 'vitest'
import { PdfExporter } from '../PdfExporter.js'
import { dataUrlToBytes, detectImageType, hexToRgb } from '../renderers.js'
import type { PdfTemplate, CompletedFieldValue, SigningResult } from '../../types/index.js'

// ── Minimal valid PDF ──────────────────────────────────────────────────────
// Generated lazily using pdf-lib itself in beforeAll to avoid a file fixture.

let BLANK_PDF: Uint8Array

beforeAll(async () => {
  const { PDFDocument } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.addPage([595, 842])
  const bytes = await doc.save()
  BLANK_PDF = new Uint8Array(bytes)
})

// ── Minimal 1×1 transparent PNG (67 bytes) ────────────────────────────────
const MINIMAL_PNG_BASE64 =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const BASE_TEMPLATE: PdfTemplate = {
  version: '1',
  pdfHash: 'a'.repeat(64),
  pageCount: 1,
  fields: [],
  signers: [{ id: 'signer-1', name: 'Alice', order: 1, color: '#6366f1' }],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const BASE_RESULT: Omit<SigningResult, 'pdfBytes' | 'finalPdfHash'> = {
  template: BASE_TEMPLATE,
  completedValues: [],
  auditTrail: [],
  completedAt: '2024-01-15T14:35:00.000Z',
}

function makeRect(page = 0) {
  return { x: 50, y: 700, width: 200, height: 50, page }
}

describe('PdfExporter', () => {
  let exporter: PdfExporter

  beforeAll(() => {
    exporter = new PdfExporter()
  })

  // ── Core export ────────────────────────────────────────────────────────────

  it('returns pdfBytes as Uint8Array', async () => {
    const result = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [], { includeAuditPage: false },
    )
    expect(result.pdfBytes).toBeInstanceOf(Uint8Array)
    expect(result.pdfBytes.length).toBeGreaterThan(0)
  })

  it('returns a valid SHA-256 hex hash', async () => {
    const result = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [], { includeAuditPage: false },
    )
    expect(result.finalHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('output is a valid PDF (starts with %PDF)', async () => {
    const result = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [], { includeAuditPage: false },
    )
    const header = new TextDecoder().decode(result.pdfBytes.slice(0, 4))
    expect(header).toBe('%PDF')
  })

  it('produces a different hash when fields are completed', async () => {
    const resultEmpty = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [], { includeAuditPage: false },
    )

    const template = {
      ...BASE_TEMPLATE,
      fields: [{
        id: 'f1', type: 'text' as const,
        rect: makeRect(), signerId: 'signer-1',
        required: true, label: 'Name',
      }],
    }
    const values: CompletedFieldValue[] = [{
      fieldId: 'f1', signerId: 'signer-1',
      value: 'Alice Smith', completedAt: '2024-01-15T14:30:00.000Z',
    }]
    const resultFilled = await exporter.export(
      BLANK_PDF, template, BASE_RESULT, values, { includeAuditPage: false },
    )

    expect(resultEmpty.finalHash).not.toBe(resultFilled.finalHash)
  })

  // ── Audit page ─────────────────────────────────────────────────────────────

  it('adds an extra page when includeAuditPage is true', async () => {
    const { PDFDocument } = await import('pdf-lib')

    const withAudit = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [], { includeAuditPage: true },
    )
    const withoutAudit = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [], { includeAuditPage: false },
    )

    const docWith = await PDFDocument.load(withAudit.pdfBytes)
    const docWithout = await PDFDocument.load(withoutAudit.pdfBytes)

    expect(docWith.getPageCount()).toBe(docWithout.getPageCount() + 1)
  })

  it('includes audit page by default', async () => {
    const { PDFDocument } = await import('pdf-lib')

    const withDefault = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [],
    )
    const withExplicit = await exporter.export(
      BLANK_PDF, BASE_TEMPLATE, BASE_RESULT, [], { includeAuditPage: true },
    )

    const d1 = await PDFDocument.load(withDefault.pdfBytes)
    const d2 = await PDFDocument.load(withExplicit.pdfBytes)
    expect(d1.getPageCount()).toBe(d2.getPageCount())
  })

  // ── Field types ────────────────────────────────────────────────────────────

  it('exports a document with a text field without throwing', async () => {
    const template = {
      ...BASE_TEMPLATE,
      fields: [{
        id: 'f1', type: 'text' as const,
        rect: makeRect(), signerId: 'signer-1',
        required: false, label: 'Name',
      }],
    }
    const values: CompletedFieldValue[] = [{
      fieldId: 'f1', signerId: 'signer-1',
      value: 'Hello World', completedAt: '2024-01-15T14:30:00.000Z',
    }]
    await expect(
      exporter.export(BLANK_PDF, template, BASE_RESULT, values, { includeAuditPage: false }),
    ).resolves.not.toThrow()
  })

  it('exports a document with a signature (image) field without throwing', async () => {
    const template = {
      ...BASE_TEMPLATE,
      fields: [{
        id: 'f1', type: 'signature' as const,
        rect: makeRect(), signerId: 'signer-1',
        required: true, label: 'Signature',
      }],
    }
    const values: CompletedFieldValue[] = [{
      fieldId: 'f1', signerId: 'signer-1',
      value: MINIMAL_PNG_BASE64, completedAt: '2024-01-15T14:30:00.000Z',
    }]
    await expect(
      exporter.export(BLANK_PDF, template, BASE_RESULT, values, { includeAuditPage: false }),
    ).resolves.not.toThrow()
  })

  it('exports a document with a checkbox field without throwing', async () => {
    const template = {
      ...BASE_TEMPLATE,
      fields: [{
        id: 'f1', type: 'checkbox' as const,
        rect: { x: 50, y: 700, width: 20, height: 20, page: 0 },
        signerId: 'signer-1', required: false, label: 'Agree',
      }],
    }
    const values: CompletedFieldValue[] = [{
      fieldId: 'f1', signerId: 'signer-1',
      value: true, completedAt: '2024-01-15T14:30:00.000Z',
    }]
    await expect(
      exporter.export(BLANK_PDF, template, BASE_RESULT, values, { includeAuditPage: false }),
    ).resolves.not.toThrow()
  })

  it('exports a document with a date-signed field without throwing', async () => {
    const template = {
      ...BASE_TEMPLATE,
      fields: [{
        id: 'f1', type: 'date-signed' as const,
        rect: makeRect(), signerId: 'signer-1',
        required: true, label: 'Date',
      }],
    }
    const values: CompletedFieldValue[] = [{
      fieldId: 'f1', signerId: 'signer-1',
      value: '2024-01-15T14:30:00.000Z', completedAt: '2024-01-15T14:30:00.000Z',
    }]
    await expect(
      exporter.export(BLANK_PDF, template, BASE_RESULT, values, { includeAuditPage: false }),
    ).resolves.not.toThrow()
  })

  it('skips fields with no completed value gracefully', async () => {
    const template = {
      ...BASE_TEMPLATE,
      fields: [{
        id: 'f1', type: 'text' as const,
        rect: makeRect(), signerId: 'signer-1',
        required: false, label: 'Optional',
      }],
    }
    await expect(
      exporter.export(BLANK_PDF, template, BASE_RESULT, [], { includeAuditPage: false }),
    ).resolves.not.toThrow()
  })

  it('skips fields whose page index is out of range', async () => {
    const template = {
      ...BASE_TEMPLATE,
      fields: [{
        id: 'f1', type: 'text' as const,
        rect: { x: 50, y: 700, width: 150, height: 30, page: 99 }, // page 99 doesn't exist
        signerId: 'signer-1', required: false, label: 'Ghost',
      }],
    }
    const values: CompletedFieldValue[] = [{
      fieldId: 'f1', signerId: 'signer-1',
      value: 'test', completedAt: '2024-01-15T14:30:00.000Z',
    }]
    await expect(
      exporter.export(BLANK_PDF, template, BASE_RESULT, values, { includeAuditPage: false }),
    ).resolves.not.toThrow()
  })
})

// ── Renderer helper unit tests ─────────────────────────────────────────────

describe('dataUrlToBytes', () => {
  it('decodes a data URL to bytes', () => {
    const bytes = dataUrlToBytes('data:image/png;base64,AQID')
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes[0]).toBe(1)
    expect(bytes[1]).toBe(2)
    expect(bytes[2]).toBe(3)
  })

  it('handles bare base64 without data URL prefix', () => {
    const bytes = dataUrlToBytes('AQID')
    expect(bytes[0]).toBe(1)
  })
})

describe('detectImageType', () => {
  it('detects PNG', () => {
    expect(detectImageType('data:image/png;base64,abc')).toBe('png')
  })

  it('detects JPEG', () => {
    expect(detectImageType('data:image/jpeg;base64,abc')).toBe('jpeg')
    expect(detectImageType('data:image/jpg;base64,abc')).toBe('jpeg')
  })

  it('defaults to PNG for unknown types', () => {
    expect(detectImageType('data:image/webp;base64,abc')).toBe('png')
  })
})

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    const result = hexToRgb('#ff0000')
    expect(result.r).toBeCloseTo(1)
    expect(result.g).toBeCloseTo(0)
    expect(result.b).toBeCloseTo(0)
  })

  it('parses 3-digit hex', () => {
    const result = hexToRgb('#f00')
    expect(result.r).toBeCloseTo(1)
    expect(result.g).toBeCloseTo(0)
    expect(result.b).toBeCloseTo(0)
  })

  it('parses black', () => {
    const result = hexToRgb('#000000')
    expect(result.r).toBe(0)
    expect(result.g).toBe(0)
    expect(result.b).toBe(0)
  })

  it('parses white', () => {
    const result = hexToRgb('#ffffff')
    expect(result.r).toBeCloseTo(1)
    expect(result.g).toBeCloseTo(1)
    expect(result.b).toBeCloseTo(1)
  })

  it('falls back to black on invalid input', () => {
    const result = hexToRgb('invalid')
    expect(result.r).toBe(0)
    expect(result.g).toBe(0)
    expect(result.b).toBe(0)
  })
})
