import type { Meta, StoryObj } from '@storybook/vue3'
import { PdfSigner } from '@pdf-sign/vue'
import { SAMPLE_PDF_URL, SAMPLE_TEMPLATE } from '../shared/sample-template.js'
import { THEME_PRESETS } from '../shared/theme-presets.js'

const meta = {
  title: 'Vue / PdfSigner / Sign mode',
  component: PdfSigner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sign mode: the signer is presented with a read-only document showing only their assigned fields. ' +
          'The component guides them through completion and emits a signing-complete event with the flattened PDF.',
      },
    },
  },
} satisfies Meta<typeof PdfSigner>

export default meta
type Story = StoryObj<typeof meta>

export const SignerAlice: Story = {
  name: 'Signer Alice (first signer)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: { ...SAMPLE_TEMPLATE, pdfHash: 'a'.repeat(64) },
    signerId: 'signer-alice',
    includeAuditPage: true,
  },
  render: (args) => ({
    components: { PdfSigner },
    setup: () => ({ args }),
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner
          v-bind="args"
          @signing-complete="(r) => console.log('signing-complete', r.finalPdfHash)"
          @declined="(p) => console.log('declined', p)"
          @error="(e) => console.error('error', e)"
        />
      </div>
    `,
  }),
}

export const SignerBob: Story = {
  name: 'Signer Bob (second signer)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: { ...SAMPLE_TEMPLATE, pdfHash: 'a'.repeat(64) },
    signerId: 'signer-bob',
  },
  render: (args) => ({
    components: { PdfSigner },
    setup: () => ({ args }),
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
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
    components: { PdfSigner },
    setup: () => ({ args }),
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    `,
  }),
}
