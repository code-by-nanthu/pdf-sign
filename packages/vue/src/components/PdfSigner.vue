<script setup lang="ts">
import type { PdfSignOptions, ThemeTokens, PdfTemplate, SigningResult } from '@pdf-sign/core'

interface Props {
  pdf?: PdfSignOptions['pdf']
  mode?: PdfSignOptions['mode']
  template?: PdfTemplate
  signerId?: string
  theme?: Partial<ThemeTokens>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'prepare',
})

const emit = defineEmits<{
  'template-ready': [template: PdfTemplate]
  'fields-changed': [fields: import('@pdf-sign/core').FieldDef[]]
  'signing-complete': [result: SigningResult]
  'declined': [payload: { signerId: string; reason: string; timestamp: string }]
  'export-ready': [payload: { pdfBytes: Uint8Array; filename: string }]
  'error': [payload: { message: string; cause?: unknown }]
}>()
</script>

<template>
  <div class="pdf-sign-root flex h-full w-full flex-col" data-pdf-sign>
    <slot>
      <!-- PdfViewer + FieldPalette + FieldOverlay + ToolBar assembled here in next prompt -->
      <div class="flex flex-1 items-center justify-center text-[var(--psign-text-muted)]">
        PdfSigner stub — implementation coming in next prompt
      </div>
    </slot>
  </div>
</template>
