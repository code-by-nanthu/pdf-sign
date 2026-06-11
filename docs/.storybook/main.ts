import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.stories.@(ts|tsx)',
    '../stories/**/*.stories.@(ts|tsx|vue)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-backgrounds',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal(config) {
    return {
      ...config,
      base: '/pdf-sign/',
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [
          ...(config.optimizeDeps?.include ?? []),
          'pdfjs-dist',
          'pdf-lib',
        ],
      },
    }
  },
}

export default config
