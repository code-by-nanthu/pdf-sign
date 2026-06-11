import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming/create'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'pdf-sign',
    brandUrl: 'https://github.com/your-org/pdf-sign',
    colorPrimary: '#6366f1',
    colorSecondary: '#4f46e5',
    appBg: '#f8fafc',
    appContentBg: '#ffffff',
    barBg: '#ffffff',
    inputBg: '#ffffff',
    fontBase: '"Inter", "system-ui", sans-serif',
  }),
  sidebar: {
    showRoots: true,
  },
})
