import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VuePdfSign',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'vue',
        'pdfjs-dist',
        'pdf-lib',
        '@pdf-sign/core',
      ],
      output: {
        globals: {
          vue: 'Vue',
        },
        assetFileNames: (info) => {
          if (info.name === 'style.css') return 'index.css'
          return info.name ?? 'asset'
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
})
