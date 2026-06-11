import type { Meta, StoryObj } from '@storybook/react'
import { PdfSigner } from '@pdf-sign/react'
import { SAMPLE_PDF_URL } from '../shared/sample-template.js'
import { THEME_PRESETS } from '../shared/theme-presets.js'

const meta = {
  title: 'React / PdfSigner / Prepare mode',
  component: PdfSigner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'React adapter — prepare mode. Feature parity with the Vue adapter.',
      },
    },
  },
  argTypes: {
    snapGrid: { control: { type: 'range', min: 0, max: 40, step: 5 } },
    includeAuditPage: { control: 'boolean' },
    theme: {
      control: 'select',
      options: Object.keys(THEME_PRESETS),
      mapping: THEME_PRESETS,
    },
  },
} satisfies Meta<typeof PdfSigner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default (indigo)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 0,
    includeAuditPage: true,
    onTemplateReady: (t) => console.log('template-ready', t),
    onFieldsChanged: (f) => console.log('fields-changed', f.length),
    onError: (e) => console.error('error', e),
  },
  render: (args) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PdfSigner {...args} />
    </div>
  ),
}

export const WithSnapGrid: Story = {
  name: 'Snap-to-grid (10px)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 10,
  },
  render: (args) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PdfSigner {...args} />
    </div>
  ),
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
  render: (args) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PdfSigner {...args} />
    </div>
  ),
}

export const RedTheme: Story = {
  name: 'Red theme',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    theme: THEME_PRESETS.Red,
  },
  render: (args) => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PdfSigner {...args} />
    </div>
  ),
}
