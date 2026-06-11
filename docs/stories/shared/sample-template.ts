import type { PdfTemplate } from '@pdf-sign/core'

/**
 * Sample template for sign-mode stories.
 * Fields are placed on a standard A4 page (595 × 842 pts).
 */
export const SAMPLE_TEMPLATE: PdfTemplate = {
  version: '1',
  pdfHash: 'a'.repeat(64),
  pageCount: 1,
  createdAt: '2024-01-01T10:00:00.000Z',
  updatedAt: '2024-01-01T10:00:00.000Z',
  signers: [
    {
      id: 'signer-alice',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      order: 1,
      color: '#6366f1',
    },
    {
      id: 'signer-bob',
      name: 'Bob Smith',
      email: 'bob@example.com',
      order: 2,
      color: '#0ea5e9',
    },
  ],
  fields: [
    {
      id: 'field-sig-alice',
      type: 'signature',
      label: 'Signature',
      required: true,
      signerId: 'signer-alice',
      rect: { x: 50, y: 80, width: 180, height: 55, page: 0 },
    },
    {
      id: 'field-date-alice',
      type: 'date-signed',
      label: 'Date',
      required: true,
      signerId: 'signer-alice',
      rect: { x: 250, y: 80, width: 130, height: 30, page: 0 },
    },
    {
      id: 'field-name-alice',
      type: 'text',
      label: 'Full Name',
      required: true,
      signerId: 'signer-alice',
      placeholder: 'Enter your full name',
      rect: { x: 50, y: 680, width: 240, height: 32, page: 0 },
    },
    {
      id: 'field-agree-alice',
      type: 'checkbox',
      label: 'I agree to the terms',
      required: true,
      signerId: 'signer-alice',
      rect: { x: 50, y: 720, width: 20, height: 20, page: 0 },
    },
    {
      id: 'field-initials-bob',
      type: 'initials',
      label: 'Initials',
      required: true,
      signerId: 'signer-bob',
      rect: { x: 420, y: 80, width: 80, height: 55, page: 0 },
    },
    {
      id: 'field-title-bob',
      type: 'text',
      label: 'Job Title',
      required: false,
      signerId: 'signer-bob',
      placeholder: 'Your job title',
      rect: { x: 300, y: 680, width: 200, height: 32, page: 0 },
    },
  ],
}

/** Freely-licensed sample PDF for prepare-mode stories. */
export const SAMPLE_PDF_URL =
  'https://www.w3.org/WAI/WCAG21/Techniques/pdf/samples/sample.pdf'
