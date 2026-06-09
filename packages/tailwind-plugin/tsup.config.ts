import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts', tokens: 'src/tokens.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  external: ['tailwindcss'],
})
