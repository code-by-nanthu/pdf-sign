import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { PdfSignerComponent } from '@pdf-sign/angular'
import { SAMPLE_PDF_URL } from '../shared/sample-template.js'
import { THEME_PRESETS } from '../shared/theme-presets.js'

const meta: Meta<PdfSignerComponent> = {
  title: 'Angular / PdfSigner / Prepare mode',
  component: PdfSignerComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PdfSignerComponent],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Angular adapter — prepare mode. Feature parity with the Vue and React adapters.',
      },
    },
  },
  argTypes: {
    snapGrid: { control: { type: 'range', min: 0, max: 40, step: 5 } },
    includeAuditPage: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<PdfSignerComponent>

export const Default: Story = {
  name: 'Default (indigo)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 0,
    includeAuditPage: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <pdf-signer
          [pdf]="pdf"
          [mode]="mode"
          [snapGrid]="snapGrid"
          [includeAuditPage]="includeAuditPage"
        />
      </div>
    `,
  }),
}

export const MultipleSigners: Story = {
  name: 'Multiple signers',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    signers: [
      { id: 'alice', name: 'Alice Johnson', order: 1, color: '#6366f1' },
      { id: 'bob',   name: 'Bob Smith',     order: 2, color: '#0ea5e9' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <pdf-signer [pdf]="pdf" [mode]="mode" [signers]="signers" />
      </div>
    `,
  }),
}

export const RedTheme: Story = {
  name: 'Red theme',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    theme: THEME_PRESETS.Red,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <pdf-signer [pdf]="pdf" [mode]="mode" [theme]="theme" />
      </div>
    `,
  }),
}
