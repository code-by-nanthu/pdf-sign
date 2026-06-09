import { useState } from 'react'
import type { PdfSignOptions, DocumentState } from '@pdf-sign/core'

export function usePdfSign(_options: PdfSignOptions) {
  const [state, setState] = useState<DocumentState>('idle')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  return { state, currentPage, totalPages }
}
