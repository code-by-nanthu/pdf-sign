# @pdf-sign/vue

Vue 3 PDF e-signature components. Drop-in prepare and sign modes.

## Install

```bash
pnpm add @pdf-sign/vue @pdf-sign/tailwind-plugin pdfjs-dist pdf-lib
```

## Setup

```ts
// main.ts
import { createApp } from 'vue'
import { PdfSignPlugin } from '@pdf-sign/vue'
import '@pdf-sign/vue/base.css'
import App from './App.vue'

createApp(App).use(PdfSignPlugin).mount('#app')
```

## Prepare mode

```vue
<template>
  <PdfSigner
    mode="prepare"
    :pdf="myFile"
    :signers="[{ id: 'alice', name: 'Alice', order: 1, color: '#6366f1' }]"
    @template-ready="onTemplate"
    @error="onError"
  />
</template>
```

## Sign mode

```vue
<template>
  <PdfSigner
    mode="sign"
    :pdf="myFile"
    :template="savedTemplate"
    signer-id="alice"
    @signing-complete="onComplete"
  />
</template>
```

## Theming

```vue
<!-- Via prop -->
<PdfSigner :theme="{ primary: '#dc2626', primaryFg: '#fff' }" />
```

```css
/* Via CSS vars */
.pdf-sign-root {
  --psign-primary: #dc2626;
  --psign-radius: 2px;
}
```

## Headless

```ts
import { usePdfSign } from '@pdf-sign/vue'

const { state, fields, addField, buildTemplate } = usePdfSign({
  mode: 'prepare',
  pdf: myFile,
})
```
