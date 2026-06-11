import type { Preview } from '@storybook/vue3'
import '@pdf-sign/vue/base.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'pdf-sign component',
      },
    },
  },
}

export default preview
