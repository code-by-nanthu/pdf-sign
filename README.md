# pdf-sign

A framework-agnostic PDF e-signature and field-placement package.
Works with Vue 3, React 18+, Angular 17+, and any Node-based framework.

## Packages

| Package | Description |
|---------|-------------|
| `@pdf-sign/core` | Headless logic — state, rendering, drag, export |
| `@pdf-sign/vue` | Vue 3 components |
| `@pdf-sign/react` | React 18+ components |
| `@pdf-sign/angular` | Angular 17+ components |
| `@pdf-sign/tailwind-plugin` | Tailwind v3 + v4 plugin and CSS token defaults |

## Quick start (Vue)

```bash
pnpm add @pdf-sign/vue @pdf-sign/tailwind-plugin pdfjs-dist pdf-lib
```

```ts
// main.ts
import { createApp } from 'vue'
import { PdfSignPlugin } from '@pdf-sign/vue'
import '@pdf-sign/vue/base.css'
import App from './App.vue'

createApp(App).use(PdfSignPlugin).mount('#app')
```

```vue
<PdfSigner mode="prepare" :pdf="myFile" @template-ready="onTemplate" />
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```
