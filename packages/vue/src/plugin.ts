import type { App } from 'vue'
import type { PdfSignOptions } from '@pdf-sign/core'
import PdfSigner from './components/PdfSigner.vue'
import PdfViewer from './components/PdfViewer.vue'
import FieldPalette from './components/FieldPalette.vue'

export interface PdfSignPluginOptions extends Partial<PdfSignOptions> {}

export const PdfSignPlugin = {
  install(app: App, options: PdfSignPluginOptions = {}) {
    app.provide('pdf-sign-plugin-options', options)
    app.component('PdfSigner', PdfSigner)
    app.component('PdfViewer', PdfViewer)
    app.component('FieldPalette', FieldPalette)
  },
}
