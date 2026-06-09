// Types — re-export everything from types
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

// Coordinate mapper
export {
  overlayToPdf,
  pdfToOverlay,
  overlayDimensionsToPdf,
  pdfDimensionsToOverlay,
  clampToPdfPage,
  buildViewportInfo,
} from './coords/index.js'
export type { ViewportInfo } from './coords/index.js'

// Utilities
export { sha256Hex, generateId, now } from './utils/hash.js'
export { normalisePdfInput } from './utils/pdf-loader.js'

// Theme
export { injectTheme, removeTheme, generateDefaultTokensCss } from './theme/inject.js'
