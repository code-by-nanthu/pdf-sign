import type { PdfSignOptions, ThemeTokens, PdfTemplate, SigningResult } from '@pdf-sign/core'

export interface PdfSignerProps {
  pdf?: PdfSignOptions['pdf']
  mode?: PdfSignOptions['mode']
  template?: PdfTemplate
  signerId?: string
  theme?: Partial<ThemeTokens>
  onTemplateReady?: (template: PdfTemplate) => void
  onSigningComplete?: (result: SigningResult) => void
  onError?: (err: { message: string; cause?: unknown }) => void
}

export function PdfSigner({ mode = 'prepare' }: PdfSignerProps) {
  return (
    <div className="pdf-sign-root flex h-full w-full flex-col" data-pdf-sign>
      <div className="flex flex-1 items-center justify-center text-[var(--psign-text-muted)]">
        PdfSigner (React) stub — implementation coming in next prompt
      </div>
    </div>
  )
}
