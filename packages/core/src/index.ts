// ── Types ──────────────────────────────────────────────────────────────────
export type {
  FieldType,
  BuiltInFieldType,
  PdfPoint,
  PdfRect,
  OverlayRect,
  SignerDef,
  FieldValidation,
  FieldAppearance,
  FieldDef,
  PdfTemplate,
  CompletedFieldValue,
  AuditEntry,
  SigningResult,
  DocumentState,
  CustomFieldTypeDef,
  FieldTypeRenderContext,
  PdfSignOptions,
  ThemeTokens,
  LocaleStrings,
  PdfSignEvents,
} from './types/index.js'

export { BUILT_IN_FIELD_TYPES } from './types/index.js'
export { DEFAULT_THEME_TOKENS, DEFAULT_LOCALE } from './types/defaults.js'

// ── Coordinate mapper ───────────────────────────────────────────────────────
export {
  overlayToPdf,
  pdfToOverlay,
  overlayDimensionsToPdf,
  pdfDimensionsToOverlay,
  clampToPdfPage,
  buildViewportInfo,
} from './coords/index.js'
export type { ViewportInfo } from './coords/index.js'

// ── Utilities ───────────────────────────────────────────────────────────────
export { sha256Hex, generateId, now } from './utils/hash.js'
export { normalisePdfInput } from './utils/pdf-loader.js'

// ── Theme ───────────────────────────────────────────────────────────────────
export { injectTheme, removeTheme, generateDefaultTokensCss } from './theme/inject.js'

// ── Renderer ────────────────────────────────────────────────────────────────
export { PdfRenderer } from './renderer/PdfRenderer.js'
export { initialisePdfWorker } from './renderer/worker.js'
export type {
  PdfRendererOptions,
  RenderPageResult,
  ZoomMode,
  PdfPageProxy,
  PdfPageViewport,
  PdfDocumentProxy,
} from './renderer/PdfRenderer.js'

// ── State stores (exported for framework adapter use) ───────────────────────
export { FieldStore } from './state/field-store.js'
export type { AddFieldPayload, UpdateFieldPayload, FieldStoreState } from './state/field-store.js'
export { SignerStore, DEFAULT_SIGNER } from './state/signer-store.js'
export { DocumentStore } from './state/document-store.js'
export { UndoRedoStack } from './state/history.js'

// ── Event emitter ───────────────────────────────────────────────────────────
export { TypedEventEmitter } from './events/TypedEventEmitter.js'

// ── Controller (primary public API) ─────────────────────────────────────────
export { PdfSignController } from './controller/PdfSignController.js'
