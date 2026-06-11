import type { Meta, StoryObj } from '@storybook/vue3'
import { defineComponent } from 'vue'
import { PdfSigner } from '@pdf-sign/vue'
import { THEME_PRESETS } from '../shared/theme-presets.js'

const ThemingDemo = defineComponent({
  name: 'ThemingDemo',
  components: { PdfSigner },
  setup() {
    return { THEME_PRESETS }
  },
  template: `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; height: 100vh; box-sizing: border-box;">
      <div v-for="(theme, name) in THEME_PRESETS" :key="name" style="display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="padding: 8px 12px; background: #f8fafc; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
          Theme: {{ name }}
        </div>
        <div style="flex: 1; min-height: 0;">
          <PdfSigner
            mode="prepare"
            :pdf="null"
            :theme="theme"
            style="height: 100%"
          />
        </div>
      </div>
    </div>
  `,
})

const meta = {
  title: 'Vue / Theming / All presets',
  component: ThemingDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'All four built-in theme presets shown side by side. ' +
          'Override any token via the theme prop or by setting CSS custom properties on .pdf-sign-root.',
      },
    },
  },
} satisfies Meta<typeof ThemingDemo>

export default meta
type Story = StoryObj<typeof meta>

export const AllPresets: Story = {
  name: 'All theme presets',
}

export const CSSVarOverride: Story = {
  name: 'CSS var override (global)',
  render: () => ({
    components: { PdfSigner },
    template: `
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <style>
          .my-custom-theme {
            --psign-primary: #7c3aed;
            --psign-primary-fg: #ffffff;
            --psign-primary-hover: #6d28d9;
            --psign-radius: 2px;
            --psign-radius-sm: 1px;
            --psign-radius-lg: 4px;
          }
        </style>
        <div class="my-custom-theme" style="flex: 1; display: flex; flex-direction: column;">
          <PdfSigner mode="prepare" :pdf="null" />
        </div>
      </div>
    `,
  }),
}
