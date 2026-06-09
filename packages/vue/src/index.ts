// Plugin
export { PdfSignPlugin } from './plugin.js'

// Components
export { default as PdfSigner } from './components/PdfSigner.vue'
export { default as PdfViewer } from './components/PdfViewer.vue'
export { default as FieldPalette } from './components/FieldPalette.vue'
export { default as FieldOverlay } from './components/FieldOverlay.vue'
export { default as SignatureModal } from './components/SignatureModal.vue'
export { default as ToolBar } from './components/ToolBar.vue'

// Composables
export { usePdfSign } from './composables/usePdfSign.js'

// Re-export types from core for consumer convenience
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
} from '@pdf-sign/core'
