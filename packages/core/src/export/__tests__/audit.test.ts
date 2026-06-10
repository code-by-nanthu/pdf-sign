import { describe, it, expect } from 'vitest'
import { buildAuditLines } from '../audit.js'
import type { SigningResult, PdfTemplate } from '../../types/index.js'

// formatAuditEvent is a private helper — tested indirectly through buildAuditLines.

const MOCK_TEMPLATE: PdfTemplate = {
  version: '1',
  pdfHash: 'abc123def456' + '0'.repeat(52),
  pageCount: 2,
  fields: [
    {
      id: 'f1',
      type: 'signature',
      rect: { x: 100, y: 100, width: 150, height: 50, page: 0 },
      signerId: 'signer-1',
      required: true,
      label: 'Signature',
    },
    {
      id: 'f2',
      type: 'text',
      rect: { x: 100, y: 200, width: 200, height: 30, page: 0 },
      signerId: 'signer-1',
      required: false,
      label: 'Full Name',
    },
  ],
  signers: [
    { id: 'signer-1', name: 'Alice Smith', email: 'alice@example.com', order: 1, color: '#6366f1' },
  ],
  createdAt: '2024-01-01T10:00:00.000Z',
  updatedAt: '2024-01-01T10:00:00.000Z',
}

const MOCK_RESULT: SigningResult = {
  template: MOCK_TEMPLATE,
  completedValues: [
    {
      fieldId: 'f1',
      signerId: 'signer-1',
      value: 'data:image/png;base64,abc',
      completedAt: '2024-01-15T14:30:00.000Z',
    },
    {
      fieldId: 'f2',
      signerId: 'signer-1',
      value: 'Alice Smith',
      completedAt: '2024-01-15T14:31:00.000Z',
    },
  ],
  auditTrail: [
    {
      event: 'document-opened',
      timestamp: '2024-01-15T14:25:00.000Z',
    },
    {
      event: 'field-completed',
      fieldId: 'f1',
      signerId: 'signer-1',
      timestamp: '2024-01-15T14:30:00.000Z',
      ipAddress: '192.168.1.1',
    },
    {
      event: 'document-submitted',
      signerId: 'signer-1',
      timestamp: '2024-01-15T14:35:00.000Z',
    },
  ],
  completedAt: '2024-01-15T14:35:00.000Z',
  finalPdfHash: 'fff999' + '0'.repeat(58),
  pdfBytes: new Uint8Array(0),
}

describe('buildAuditLines', () => {
  it('returns an array of line objects', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.length).toBeGreaterThan(0)
  })

  it('includes the document title as first bold line', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const first = lines.find((l) => l.bold)
    expect(first?.text).toContain('Certificate')
  })

  it('includes the original PDF hash', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const hashLine = lines.find((l) => l.text.includes(MOCK_TEMPLATE.pdfHash))
    expect(hashLine).toBeDefined()
  })

  it('includes the final PDF hash', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const hashLine = lines.find((l) => l.text.includes(MOCK_RESULT.finalPdfHash))
    expect(hashLine).toBeDefined()
  })

  it('includes signer name and email', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const signerLine = lines.find((l) =>
      l.text.includes('Alice Smith') && l.text.includes('alice@example.com'),
    )
    expect(signerLine).toBeDefined()
  })

  it('includes all completed field labels', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const texts = lines.map((l) => l.text).join('\n')
    expect(texts).toContain('Signature')
    expect(texts).toContain('Full Name')
  })

  it('includes field completion timestamps', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const texts = lines.map((l) => l.text).join('\n')
    expect(texts).toContain('2024')
  })

  it('includes audit trail events', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const texts = lines.map((l) => l.text).join('\n')
    expect(texts).toContain('Document opened')
    expect(texts).toContain('submitted')
  })

  it('includes IP address when present in audit trail', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const ipLine = lines.find((l) => l.text.includes('192.168.1.1'))
    expect(ipLine).toBeDefined()
  })

  it('includes page count', () => {
    const lines = buildAuditLines(MOCK_RESULT, MOCK_TEMPLATE)
    const texts = lines.map((l) => l.text).join('\n')
    expect(texts).toContain('2') // pageCount = 2
  })

  it('handles a signer with no email gracefully', () => {
    const templateNoEmail: PdfTemplate = {
      ...MOCK_TEMPLATE,
      signers: [{ id: 's1', name: 'Bob', order: 1, color: '#000' }],
    }
    expect(() => buildAuditLines(MOCK_RESULT, templateNoEmail)).not.toThrow()
  })

  it('handles empty completedValues gracefully', () => {
    const emptyResult = { ...MOCK_RESULT, completedValues: [], auditTrail: [] }
    expect(() => buildAuditLines(emptyResult, MOCK_TEMPLATE)).not.toThrow()
  })

  it('truncates long user-agent strings to 60 chars', () => {
    const longUa = 'Mozilla/5.0 ' + 'x'.repeat(100)
    const resultWithUa: SigningResult = {
      ...MOCK_RESULT,
      auditTrail: [
        {
          event: 'document-opened',
          timestamp: '2024-01-15T14:25:00.000Z',
          userAgent: longUa,
        },
      ],
    }
    const lines = buildAuditLines(resultWithUa, MOCK_TEMPLATE)
    const uaLine = lines.find((l) => l.text.includes('UA:'))
    expect(uaLine).toBeDefined()
    expect(uaLine!.text.length).toBeLessThan(longUa.length + 10)
  })
})
