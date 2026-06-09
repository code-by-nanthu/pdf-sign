import { ref } from 'vue'
import type { PdfSignOptions, DocumentState } from '@pdf-sign/core'

/**
 * Headless composable — wraps @pdf-sign/core for Vue.
 * Full implementation in the next prompt.
 */
export function usePdfSign(_options: PdfSignOptions) {
  const state = ref<DocumentState>('idle')
  const currentPage = ref(0)
  const totalPages = ref(0)
  const zoom = ref(1)

  return {
    state,
    currentPage,
    totalPages,
    zoom,
  }
}
