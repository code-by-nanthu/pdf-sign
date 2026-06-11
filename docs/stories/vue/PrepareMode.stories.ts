import type { Meta, StoryObj } from '@storybook/vue3'
import { PdfSigner } from '@pdf-sign/vue'
import { SAMPLE_PDF_URL } from '../shared/sample-template.js'
import { THEME_PRESETS } from '../shared/theme-presets.js'

const meta = {
  title: 'Vue / PdfSigner / Prepare mode',
  component: PdfSigner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Prepare mode: the preparer drags field types from the palette onto the document, ' +
          'assigns them to signers, and saves a JSON template that can be used later in sign mode.',
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
  },
  render: (args) => ({
    components: { PdfSigner },
    setup: () => ({ args }),
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner
          v-bind="args"
          @template-ready="(t) => console.log('template-ready', t)"
          @fields-changed="(f) => console.log('fields-changed', f.length, 'fields')"
          @error="(e) => console.error('error', e)"
        />
      </div>
    `,
  }),
}

export const WithSnapGrid: Story = {
  name: 'Snap-to-grid (10px)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 10,
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

export const MultipleSigners: Story = {
  name: 'Multiple signers',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    signers: [
      { id: 'alice', name: 'Alice Johnson', order: 1, color: '#6366f1' },
      { id: 'bob',   name: 'Bob Smith',     order: 2, color: '#0ea5e9' },
      { id: 'carol', name: 'Carol White',   order: 3, color: '#10b981' },
    ],
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

export const CustomTheme: Story = {
  name: 'Custom theme (red brand)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    theme: THEME_PRESETS.Red,
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

export const ExtraToolbarSlot: Story = {
  name: 'Extra toolbar slot',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
  },
  render: (args) => ({
    components: { PdfSigner },
    setup: () => ({ args }),
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args">
          <template #toolbar-extra>
            <button
              style="
                font-size: 11px;
                padding: 2px 10px;
                border-radius: 4px;
                border: 1px solid var(--psign-border);
                background: var(--psign-surface);
                color: var(--psign-text);
                cursor: pointer;
              "
            >
              My action
            </button>
          </template>
        </PdfSigner>
      </div>
    `,
  }),
}
