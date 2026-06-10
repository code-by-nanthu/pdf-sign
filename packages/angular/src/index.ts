// Components
export { PdfSignerComponent } from './components/pdf-signer.component.js'
export { PdfViewerComponent } from './components/pdf-viewer.component.js'
export { FieldOverlayComponent } from './components/field-overlay.component.js'
export { FieldChipComponent } from './components/field-chip.component.js'
export { FieldPaletteComponent } from './components/field-palette.component.js'
export { ToolbarComponent } from './components/toolbar.component.js'
export { SignatureModalComponent } from './components/signature-modal.component.js'
export { FieldPropertiesPanelComponent } from './components/field-properties-panel.component.js'

// Service
export { PdfSignService } from './services/pdf-sign.service.js'

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
