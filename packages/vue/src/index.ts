// Plugin
export { PdfSignPlugin } from './plugin.js'
export type { PdfSignPluginOptions } from './plugin.js'

// Components
export { default as PdfSigner } from './components/PdfSigner.vue'
export { default as PdfViewer } from './components/PdfViewer.vue'
export { default as FieldPalette } from './components/FieldPalette.vue'
export { default as FieldOverlay } from './components/FieldOverlay.vue'
export { default as FieldChip } from './components/FieldChip.vue'
export { default as ToolBar } from './components/ToolBar.vue'
export { default as SignatureModal } from './components/SignatureModal.vue'

// Composables
export { usePdfSign } from './composables/usePdfSign.js'
export { usePdfRenderer } from './composables/usePdfRenderer.js'
export { useDragEngine, dropToPdfRect, moveToPdfRect } from './composables/useDragEngine.js'

// Re-export core types for consumer convenience
export type {
  PdfTemplate,
  FieldDef,
  SignerDef,
  PdfSignOptions,
  SigningResult,
  ThemeTokens,
  LocaleStrings,
  DocumentState,
  CustomFieldTypeDef,
  OverlayRect,
  PdfRect,
  CompletedFieldValue,
  AuditEntry,
} from '@pdf-sign/core'

export { BUILT_IN_FIELD_TYPES, DEFAULT_THEME_TOKENS } from '@pdf-sign/core'
