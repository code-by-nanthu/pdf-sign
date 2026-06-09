// ─── Field types ─────────────────────────────────────────────────────────────

export const BUILT_IN_FIELD_TYPES = [
  'signature',
  'initials',
  'date-signed',
  'text',
  'textarea',
  'checkbox',
  'radio',
  'dropdown',
  'stamp',
] as const

export type BuiltInFieldType = (typeof BUILT_IN_FIELD_TYPES)[number]
export type FieldType = BuiltInFieldType | (string & {})

// ─── Coordinate system ────────────────────────────────────────────────────────

/**
 * A point in PDF user-space units (pts, 1in = 72pts, origin bottom-left).
 */
export interface PdfPoint {
  x: number
  y: number
}

/**
 * A rectangle in PDF user-space units.
 * Origin is BOTTOM-LEFT (PDF spec), x increases right, y increases UP.
 */
export interface PdfRect extends PdfPoint {
  width: number
  height: number
  page: number // 0-indexed
}

/**
 * A rectangle in overlay/canvas CSS pixels.
 * Origin is TOP-LEFT (browser convention), y increases DOWN.
 */
export interface OverlayRect {
  x: number   // px from left edge of canvas element
  y: number   // px from top edge of canvas element
  width: number
  height: number
  page: number
}

// ─── Signers ─────────────────────────────────────────────────────────────────

export interface SignerDef {
  /** Unique ID, stable across sessions. */
  id: string
  /** Display name shown in the UI. */
  name: string
  /**
   * Signing order. Lower numbers sign first.
   * Signers with the same order number sign in parallel.
   */
  order: number
  /**
   * Accent colour used to tint this signer's field chips in the editor.
   * Must be a valid CSS colour string.
   */
  color: string
  /** Optional email — not used internally, stored for consumer use. */
  email?: string
}

// ─── Field definitions ───────────────────────────────────────────────────────

export interface FieldValidation {
  /** Built-in validators. */
  preset?: 'email' | 'phone' | 'number' | 'url' | 'date'
  /** Custom regex pattern (serialised as string for JSON safety). */
  pattern?: string
  /** Min character count (text fields). */
  minLength?: number
  /** Max character count (text fields). */
  maxLength?: number
  /** Min value (number fields). */
  min?: number
  /** Max value (number fields). */
  max?: number
}

export interface FieldAppearance {
  /** Font size in pts as rendered in the PDF. Default: 12. */
  fontSize?: number
  /** Font colour — CSS colour string. Default: '#000000'. */
  fontColor?: string
  /** Background colour — CSS colour string. Default: transparent. */
  backgroundColor?: string
  /** Border colour — CSS colour string. Default: '#cccccc'. */
  borderColor?: string
  /** Border width in pts. Default: 1. */
  borderWidth?: number
}

export interface FieldDef {
  /** Stable unique ID (UUID v4). */
  id: string
  /** Field type — built-in or custom-registered. */
  type: FieldType
  /** PDF coordinate bounding box. Origin: bottom-left of the page. */
  rect: PdfRect
  /**
   * ID of the signer responsible for filling this field.
   * null = any signer / first signer.
   */
  signerId: string | null
  /** Whether the signer must fill this field before submitting. */
  required: boolean
  /** Human-readable label shown in the palette and field chip. */
  label: string
  /** Placeholder text shown inside the field before it is filled. */
  placeholder?: string
  /** For dropdown and radio fields: the selectable options. */
  options?: string[]
  /** For radio fields: the group name (radio buttons sharing a name are mutually exclusive). */
  radioGroup?: string
  /** Validation rules applied when the signer submits. */
  validation?: FieldValidation
  /** Visual appearance of the field when rendered into the PDF. */
  appearance?: FieldAppearance
  /** Whether this field is locked and cannot be edited in prepare mode. */
  readOnly?: boolean
  /**
   * Arbitrary metadata the consumer can attach to a field.
   * Passed through untouched in all events and the template JSON.
   */
  meta?: Record<string, unknown>
}

// ─── Template ─────────────────────────────────────────────────────────────────

/**
 * The serialisable output of prepare mode.
 * Store this in your backend and pass it back in to sign mode.
 */
export interface PdfTemplate {
  /** Schema version. Increment when breaking changes are made to this type. */
  version: '1'
  /**
   * SHA-256 hex digest of the original PDF bytes.
   * Used to verify the document has not been tampered with before signing.
   */
  pdfHash: string
  /** Total number of pages in the source PDF. */
  pageCount: number
  /** All placed fields. */
  fields: FieldDef[]
  /** All signer definitions. */
  signers: SignerDef[]
  /** ISO 8601 timestamp of when this template was created. */
  createdAt: string
  /** ISO 8601 timestamp of when this template was last modified. */
  updatedAt: string
  /**
   * Arbitrary metadata the consumer can attach to the template.
   * Not interpreted by the package.
   */
  meta?: Record<string, unknown>
}

// ─── Completed / signed records ───────────────────────────────────────────────

export interface CompletedFieldValue {
  fieldId: string
  signerId: string
  /** The value the signer provided. Type depends on field type:
   *  - signature / initials / stamp: base64 data URL (PNG)
   *  - text / textarea / dropdown: string
   *  - checkbox: boolean
   *  - radio: string (the selected option value)
   *  - date-signed: ISO 8601 string (auto-populated on completion)
   *  - custom: unknown (serialised by the field type's serialize fn)
   */
  value: string | boolean | unknown
  /** ISO 8601 timestamp of when the field was completed. */
  completedAt: string
}

export interface AuditEntry {
  event:
    | 'document-opened'
    | 'field-completed'
    | 'document-submitted'
    | 'document-declined'
  fieldId?: string
  signerId?: string
  timestamp: string
  /** Consumer-provided IP address, stored verbatim. */
  ipAddress?: string
  /** Consumer-provided user-agent string, stored verbatim. */
  userAgent?: string
}

export interface SigningResult {
  /** The original template. */
  template: PdfTemplate
  /** One entry per completed field. */
  completedValues: CompletedFieldValue[]
  /** Full audit trail of events during this signing session. */
  auditTrail: AuditEntry[]
  /** ISO 8601 timestamp of final submission. */
  completedAt: string
  /** SHA-256 hex digest of the completed PDF bytes. */
  finalPdfHash: string
  /**
   * The completed, flattened PDF as Uint8Array.
   * This is what you send to your backend / generate a download from.
   */
  pdfBytes: Uint8Array
}

// ─── Document lifecycle state ────────────────────────────────────────────────

export type DocumentState =
  | 'idle'        // no document loaded
  | 'loading'     // pdf.js is loading the document
  | 'ready'       // document rendered, in prepare mode, no fields placed
  | 'editing'     // document in prepare mode, fields placed / being edited
  | 'signing'     // signer is filling fields (sign mode)
  | 'complete'    // all required fields filled, ready to submit
  | 'submitting'  // export in progress
  | 'done'        // export complete
  | 'error'       // unrecoverable error

// ─── Plugin / field type registry ────────────────────────────────────────────

export interface FieldTypeRenderContext {
  field: FieldDef
  value: unknown
  isActive: boolean
  isComplete: boolean
  mode: 'prepare' | 'sign' | 'readonly'
}

export interface CustomFieldTypeDef<TValue = unknown> {
  /** Must be unique across all registered types. Use namespaced IDs: 'myapp:qr-code'. */
  id: string
  /** Display label shown in the palette. */
  label: string
  /** Tabler icon name (without 'ti-' prefix). e.g. 'qrcode', 'map-pin'. */
  icon: string
  /** Default width in PDF pts when dropped. */
  defaultWidth: number
  /** Default height in PDF pts when dropped. */
  defaultHeight: number
  /**
   * Serialise the field value to a plain string / boolean for storage in SigningResult.
   * Called before export.
   */
  serialize: (value: TValue) => string | boolean
  /**
   * Render the field value into a pdf-lib page.
   * Called during PDF export for each completed field of this type.
   * Import PDFPage, PDFDocument from 'pdf-lib' in your implementation.
   */
  renderToPdf: (
    page: unknown, // PDFPage — typed as unknown to avoid pdf-lib peer dep in types
    value: TValue,
    rect: PdfRect,
    doc: unknown,  // PDFDocument
  ) => Promise<void> | void
}

// ─── Options ─────────────────────────────────────────────────────────────────

export interface PdfSignOptions {
  /**
   * 'prepare' — full drag-drop field editor. Emits a PdfTemplate on save.
   * 'sign'    — signer view. Accepts a PdfTemplate, signer fills assigned fields.
   * 'readonly'— viewer only. No interaction.
   */
  mode: 'prepare' | 'sign' | 'readonly'
  /**
   * The PDF to render. Accepts:
   *  - base64 string
   *  - Uint8Array
   *  - ArrayBuffer
   *  - URL string (fetched client-side)
   *  - File object
   */
  pdf: string | Uint8Array | ArrayBuffer | File | null
  /**
   * Required when mode = 'sign'. The template produced by prepare mode.
   */
  template?: PdfTemplate
  /**
   * Required when mode = 'sign'. ID of the signer currently interacting.
   * Must match a SignerDef.id in the template.
   */
  signerId?: string
  /**
   * Signer definitions for prepare mode.
   * If omitted in prepare mode, a single default signer is created.
   */
  signers?: SignerDef[]
  /**
   * Field types available in the palette (prepare mode only).
   * If omitted, all built-in types are shown.
   */
  paletteFieldTypes?: FieldType[]
  /**
   * Initial set of fields to pre-populate.
   * Useful when resuming an in-progress template.
   */
  initialFields?: FieldDef[]
  /** Theme token overrides injected as CSS vars on the root element. */
  theme?: Partial<ThemeTokens>
  /** i18n string overrides. */
  locale?: Partial<LocaleStrings>
  /**
   * Whether to include an audit certificate page when exporting.
   * Default: true.
   */
  includeAuditPage?: boolean
  /**
   * Consumer-provided function called on field-completed audit events.
   * Use this to capture IP / user-agent for audit purposes.
   */
  getAuditContext?: () => Pick<AuditEntry, 'ipAddress' | 'userAgent'>
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

export interface ThemeTokens {
  // Brand
  primary: string
  primaryFg: string
  primaryHover: string
  // Surfaces
  surface: string
  surfaceRaised: string
  overlay: string
  // Text
  text: string
  textMuted: string
  // Borders + rings
  border: string
  focusRing: string
  // Semantic
  danger: string
  success: string
  warning: string
  // Component-specific
  toolbarBg: string
  paletteBg: string
  canvasBg: string
  // Field states
  fieldActive: string
  fieldRequired: string
  fieldComplete: string
  // Signature
  sigInk: string
  sigFont: string
  // Shape
  radiusSm: string
  radius: string
  radiusLg: string
  // Typography
  fontUi: string
  // Z-index
  zOverlay: string
  // Shadow
  shadow: string
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

export interface LocaleStrings {
  // Toolbar
  toolbarZoomIn: string
  toolbarZoomOut: string
  toolbarFitPage: string
  toolbarFitWidth: string
  toolbarDownload: string
  toolbarSave: string
  toolbarPageOf: string // '{current} of {total}'
  // Palette
  paletteTitle: string
  paletteSearch: string
  paletteEmpty: string
  // Field types
  fieldTypeSignature: string
  fieldTypeInitials: string
  fieldTypeDateSigned: string
  fieldTypeText: string
  fieldTypeTextarea: string
  fieldTypeCheckbox: string
  fieldTypeRadio: string
  fieldTypeDropdown: string
  fieldTypeStamp: string
  // Field chip
  fieldRequired: string
  fieldOptional: string
  fieldAssignedTo: string
  // Signature modal
  sigModalTitle: string
  sigTabDraw: string
  sigTabType: string
  sigTabUpload: string
  sigDrawInstructions: string
  sigTypeLabel: string
  sigTypeSelectFont: string
  sigUploadInstructions: string
  sigClear: string
  sigConfirm: string
  sigCancel: string
  // Signing session
  signProgress: string // '{done} of {total} fields'
  signSubmit: string
  signDecline: string
  signDeclineReason: string
  signDeclineConfirm: string
  // Validation
  validationRequired: string
  validationPattern: string
  validationEmail: string
  validationPhone: string
  validationNumber: string
  validationMinLength: string // 'Minimum {min} characters'
  validationMaxLength: string // 'Maximum {max} characters'
  // Export
  exportGenerating: string
  exportSuccess: string
  exportError: string
  // States
  stateLoading: string
  stateError: string
  stateEmpty: string
}

// ─── Events emitted by the controller ────────────────────────────────────────

export interface PdfSignEvents {
  /** Fired when the PDF finishes loading and the first page is rendered. */
  'ready': { pageCount: number; pdfHash: string }
  /** Fired whenever the field list changes in prepare mode. */
  'fields-changed': { fields: FieldDef[] }
  /** Fired in prepare mode when the user saves / triggers export. */
  'template-ready': { template: PdfTemplate }
  /** Fired when a signer completes a single field. */
  'field-completed': { fieldId: string; signerId: string; value: unknown }
  /** Fired when all required fields for the current signer are filled. */
  'signing-complete': SigningResult
  /** Fired when the signer clicks Decline. */
  'declined': { signerId: string; reason: string; timestamp: string }
  /** Fired when PDF bytes are ready for download. */
  'export-ready': { pdfBytes: Uint8Array; filename: string }
  /** Fired on any unrecoverable error. */
  'error': { message: string; cause?: unknown }
  /** Fired when document state changes. */
  'state-changed': { from: DocumentState; to: DocumentState }
}
