import type { Meta, StoryObj } from '@storybook/react'
import { PdfSigner } from '@pdf-sign/react'
import { SAMPLE_PDF_URL, SAMPLE_TEMPLATE } from '../shared/sample-template.js'
import { THEME_PRESETS } from '../shared/theme-presets.js'

const meta = {
  title: 'React / PdfSigner / Sign mode',
  component: PdfSigner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PdfSigner>

export default meta
type Story = StoryObj<typeof meta>

export const SignerAlice: Story = {
  name: 'Signer Alice',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: { ...SAMPLE_TEMPLATE, pdfHash: 'a'.repeat(64) },
    signerId: 'signer-alice',
    onSigningComplete: (r) => console.log('signing-complete', r.finalPdfHash),
    onDeclined: (p) => console.log('declined', p),
  },
  render: (args) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PdfSigner {...args} />
    </div>
  ),
}

export const DarkTheme: Story = {
  name: 'Dark theme',
  parameters: { backgrounds: { default: 'dark' } },
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: { ...SAMPLE_TEMPLATE, pdfHash: 'a'.repeat(64) },
    signerId: 'signer-alice',
    theme: THEME_PRESETS.Dark,
  },
  render: (args) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PdfSigner {...args} />
    </div>
  ),
}
