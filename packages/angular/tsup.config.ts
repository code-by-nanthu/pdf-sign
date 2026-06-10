import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: [
    '@angular/core',
    '@angular/common',
    'pdfjs-dist',
    'pdf-lib',
    '@pdf-sign/core',
  ],
  esbuildOptions(options) {
    options.conditions = ['module']
  },
})
