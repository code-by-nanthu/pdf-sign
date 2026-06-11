# @pdf-sign/react

React 18+ PDF e-signature components.

## Install

```bash
pnpm add @pdf-sign/react @pdf-sign/tailwind-plugin pdfjs-dist pdf-lib
```

## Setup

```ts
// Import base CSS once (entry point or layout)
import '@pdf-sign/react/base.css'
```

## Prepare mode

```tsx
import { PdfSigner } from '@pdf-sign/react'

<PdfSigner
  pdf={myFile}
  mode="prepare"
  onTemplateReady={(t) => saveTemplate(t)}
  onError={console.error}
/>
```

## Sign mode

```tsx
<PdfSigner
  pdf={myFile}
  mode="sign"
  template={savedTemplate}
  signerId="alice"
  onSigningComplete={(result) => handleComplete(result)}
/>
```

## Theming

```tsx
<PdfSigner theme={{ primary: '#dc2626', primaryFg: '#fff' }} />
```

## Headless

```ts
import { usePdfSign } from '@pdf-sign/react'

const { state, fields, addField, buildTemplate } = usePdfSign({
  mode: 'prepare',
  pdf: myFile,
})
```
