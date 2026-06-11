import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  // Angular stories are excluded: @storybook/angular uses a webpack-based
  // compiler that runs the Angular Ivy compiler. This Storybook instance
  // uses @storybook/vue3-vite (Vite) which cannot compile Angular templates.
  // Angular stories live in docs/stories/angular/ for reference and require
  // a separate Storybook instance using @storybook/angular.
  stories: [
    '../stories/vue/**/*.stories.ts',
    '../stories/react/**/*.stories.tsx',
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
