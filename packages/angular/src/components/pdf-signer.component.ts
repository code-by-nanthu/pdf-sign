import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core'
import type { PdfSignOptions, ThemeTokens, PdfTemplate, SigningResult } from '@pdf-sign/core'

@Component({
  selector: 'pdf-signer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pdf-sign-root flex h-full w-full flex-col" data-pdf-sign>
      <div class="flex flex-1 items-center justify-center text-[var(--psign-text-muted)]">
        PdfSigner (Angular) stub
      </div>
    </div>
  `,
})
export class PdfSignerComponent {
  @Input() pdf: PdfSignOptions['pdf'] = null
  @Input() mode: PdfSignOptions['mode'] = 'prepare'
  @Input() template?: PdfTemplate
  @Input() signerId?: string
  @Input() theme?: Partial<ThemeTokens>

  @Output() templateReady = new EventEmitter<PdfTemplate>()
  @Output() signingComplete = new EventEmitter<SigningResult>()
  @Output() error = new EventEmitter<{ message: string; cause?: unknown }>()
}
