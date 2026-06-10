import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', 'pdfjs-dist', 'pdf-lib', '@pdf-sign/core'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
