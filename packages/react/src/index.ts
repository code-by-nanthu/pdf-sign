// Components
export { PdfSigner } from './components/PdfSigner.js'
export { PdfViewer } from './components/PdfViewer.js'
export { FieldOverlay } from './components/FieldOverlay.js'
export { FieldChip } from './components/FieldChip.js'
export { FieldPalette } from './components/FieldPalette.js'
export { ToolBar } from './components/ToolBar.js'
export { SignatureModal } from './components/SignatureModal.js'
export { FieldPropertiesPanel } from './components/FieldPropertiesPanel.js'

// Types
export type { PdfViewerHandle } from './components/PdfViewer.js'
export type { PdfSignerProps } from './components/PdfSigner.js'

// Hooks
export { usePdfSign } from './hooks/usePdfSign.js'
export { usePdfRenderer } from './hooks/usePdfRenderer.js'
export { useDragEngine } from './hooks/useDragEngine.js'

// Re-export core types
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
