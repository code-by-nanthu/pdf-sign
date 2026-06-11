import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { PdfSignerComponent } from '@pdf-sign/angular'
import { SAMPLE_PDF_URL, SAMPLE_TEMPLATE } from '../shared/sample-template.js'
import { THEME_PRESETS } from '../shared/theme-presets.js'

const meta: Meta<PdfSignerComponent> = {
  title: 'Angular / PdfSigner / Sign mode',
  component: PdfSignerComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [PdfSignerComponent] }),
  ],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<PdfSignerComponent>

export const SignerAlice: Story = {
  name: 'Signer Alice',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: { ...SAMPLE_TEMPLATE, pdfHash: 'a'.repeat(64) },
    signerId: 'signer-alice',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <pdf-signer
          [pdf]="pdf"
          [mode]="mode"
          [template]="template"
          [signerId]="signerId"
        />
      </div>
    `,
  }),
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
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <pdf-signer [pdf]="pdf" [mode]="mode" [template]="template" [signerId]="signerId" [theme]="theme" />
      </div>
    `,
  }),
}
