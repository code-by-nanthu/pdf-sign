import { Injectable, signal } from '@angular/core'
import type { PdfSignOptions, DocumentState } from '@pdf-sign/core'

@Injectable({ providedIn: 'root' })
export class PdfSignService {
  readonly state = signal<DocumentState>('idle')
  readonly currentPage = signal(0)
  readonly totalPages = signal(0)

  initialise(_options: PdfSignOptions) {
    // Full implementation in next prompt
  }
}
