# pdf-sign

> Framework-agnostic PDF e-signature and field-placement library for Vue 3, React 18+, and Angular 17+

[![Core tests](https://img.shields.io/badge/core%20tests-220%20passing-22c55e?style=flat-square)](packages/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.base.json)
[![pnpm](https://img.shields.io/badge/pnpm-9+-orange?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)
[![Node](https://img.shields.io/badge/node-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**pdf-sign** lets you embed a fully-featured PDF signing workflow into any web app — drag-and-drop field placement, multi-signer orchestration, signature capture (draw, type, upload), and cryptographically verifiable export — without locking you into a specific framework or a proprietary cloud service.

---

## What it does

| Mode | Who uses it | What happens |
|------|-------------|--------------|
| **Prepare** | Document owner | Drags signature, text, checkbox, date and other field types onto any PDF page, assigns each field to a signer, saves a portable JSON template |
| **Sign** | Each signer | Opens the template, sees only their assigned fields highlighted, draws or types their signature, submits a flattened PDF with an audit-certificate page appended |

Everything runs **in the browser** — no backend, no cloud, no SaaS dependency.

---

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@pdf-sign/core`](packages/core) | `0.1.0` | Headless state machine, coordinate mapper, pdf.js renderer, drag engine, pdf-lib exporter — **zero framework imports** |
| [`@pdf-sign/vue`](packages/vue) | `0.1.0` | Vue 3 components + `usePdfSign` composable |
| [`@pdf-sign/react`](packages/react) | `0.1.0` | React 18+ components + `usePdfSign` hook |
| [`@pdf-sign/angular`](packages/angular) | `0.1.0` | Angular 17+ standalone components + `PdfSignService` |
| [`@pdf-sign/tailwind-plugin`](packages/tailwind-plugin) | `0.1.0` | Tailwind CSS v3 + v4 plugin, `base.css` token defaults |

---

## Quick start

### Vue 3

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
<!-- Prepare mode — drag fields, save template -->
<PdfSigner
  mode="prepare"
  :pdf="myFile"
  :signers="[{ id: 'alice', name: 'Alice', order: 1, color: '#6366f1' }]"
  @template-ready="saveTemplate"
/>

<!-- Sign mode — signer fills their fields, submits -->
<PdfSigner
  mode="sign"
  :pdf="myFile"
  :template="savedTemplate"
  signer-id="alice"
  @signing-complete="handleResult"
/>
```

### React 18+

```bash
pnpm add @pdf-sign/react @pdf-sign/tailwind-plugin pdfjs-dist pdf-lib
```

```tsx
import '@pdf-sign/react/base.css'
import { PdfSigner } from '@pdf-sign/react'

// Prepare mode
<PdfSigner
  pdf={myFile}
  mode="prepare"
  onTemplateReady={saveTemplate}
/>

// Sign mode
<PdfSigner
  pdf={myFile}
  mode="sign"
  template={savedTemplate}
  signerId="alice"
  onSigningComplete={handleResult}
/>
```

### Angular 17+

```bash
pnpm add @pdf-sign/angular @pdf-sign/tailwind-plugin pdfjs-dist pdf-lib
```

```ts
// app.component.ts
import { PdfSignerComponent } from '@pdf-sign/angular'

@Component({
  standalone: true,
  imports: [PdfSignerComponent],
  template: `
    <pdf-signer
      [pdf]="myFile"
      mode="prepare"
      (templateReady)="saveTemplate($event)"
    />
  `,
})
export class AppComponent { }
```

---

## Features

### Field types

| Type | Description |
|------|-------------|
| `signature` | Hand-drawn, typed, or uploaded PNG signature |
| `initials` | Same capture methods, compact size |
| `date-signed` | Auto-populated ISO date on submit |
| `text` | Single-line free text |
| `textarea` | Multi-line free text |
| `checkbox` | Boolean tick |
| `radio` | Mutually exclusive group |
| `dropdown` | Select from a predefined list |
| `stamp` | Image embed (company seal, logo) |

### Drag engine

Built entirely on the [Pointer Events API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — no interact.js, no jQuery, no touch-specific handlers. Mouse, stylus, and touch all use the same path.

- **Palette → canvas** drag-to-place
- **Move** placed fields with pixel precision
- **Resize** via 8-handle borders (n, ne, e, se, s, sw, w, nw)
- **Snap-to-grid** with configurable cell size
- **Undo / redo** (50-step history)

### Signature capture

Three methods, all produce a base64 PNG:

| Tab | How it works |
|-----|-------------|
| **Draw** | Bézier-smoothed strokes on a canvas. Ink colour swatches, stroke weight slider. Device-pixel-ratio aware (crisp on HiDPI screens). |
| **Type** | Name typed in an `<input>`, previewed in 5 Google Font styles. Selected font + ink colour are preserved on export. |
| **Upload** | Drag-and-drop or file picker. PNG / JPG / GIF / WebP. Live preview with remove button. |

### PDF export

Powered by [pdf-lib](https://pdf-lib.js.org):

- Fields flattened **permanently** into the PDF (no editable form fields remain)
- Signature images embedded as PNG at field dimensions
- Text and date fields drawn with Helvetica at the configured font size
- Optional **audit certificate page** appended — contains original & final SHA-256 hashes, signer list, per-field completion timestamps, IP addresses if provided
- Final document hash returned with the `signing-complete` event for server-side verification

### Theming

Every colour, radius, shadow, and font in every component is driven by a single set of CSS custom properties. Override them globally, per-instance, or via the Tailwind plugin.

```css
/* Global override — affects all instances */
.pdf-sign-root {
  --psign-primary: #dc2626;
  --psign-primary-hover: #b91c1c;
  --psign-radius: 2px;
  --psign-font-ui: 'Georgia', serif;
}
```

```vue
<!-- Per-instance via the theme prop -->
<PdfSigner :theme="{ primary: '#16a34a', primaryFg: '#fff' }" />
```

Four named presets ship out of the box: **Indigo** (default), **Red**, **Green**, and **Dark**.

---

## Headless usage

All three adapters expose the core as a framework-native reactive primitive. Use it to build your own UI while keeping pdf-sign's state machine.

### Vue

```ts
import { usePdfSign } from '@pdf-sign/vue'

const { state, fields, canUndo, addField, buildTemplate } = usePdfSign({
  mode: 'prepare',
  pdf: myFile,
})
```

### React

```ts
import { usePdfSign } from '@pdf-sign/react'

const { state, fields, canUndo, addField, buildTemplate } = usePdfSign({
  mode: 'prepare',
  pdf: myFile,
})
// State is bridged via useSyncExternalStore — concurrent-rendering safe
```

### Angular

```ts
import { PdfSignService } from '@pdf-sign/angular'

@Component({ providers: [PdfSignService] })
export class MyComponent implements OnInit {
  svc = inject(PdfSignService)

  ngOnInit() {
    this.svc.initialise({ mode: 'prepare', pdf: this.myFile })
    // All state lives in Angular signals: svc.fields(), svc.state(), etc.
  }
}
```

---

## Architecture

```
pdf-sign/
├── packages/
│   ├── core/               Zero-framework TypeScript
│   │   ├── src/types/      Master type definitions (PdfTemplate, FieldDef, …)
│   │   ├── src/state/      PdfSignController + field/signer/document stores
│   │   ├── src/coords/     Overlay ↔ PDF coordinate mapper
│   │   ├── src/renderer/   pdf.js v4 wrapper (PdfRenderer)
│   │   ├── src/drag/       PointerEvents drag engine (DragEngine)
│   │   └── src/export/     pdf-lib field flattening + audit page (PdfExporter)
│   ├── vue/                Vue 3 components + composables
│   ├── react/              React 18+ components + hooks
│   ├── angular/            Angular 17+ standalone components + service
│   └── tailwind-plugin/    Tailwind v3/v4 plugin + base.css
└── docs/                   Storybook 8 — 27 stories across all 3 adapters
```

The three adapter packages are thin reactive bridges around the same `@pdf-sign/core` classes:

```
PdfSignController   ← owns all state, emits typed events
PdfRenderer         ← wraps pdf.js, renders pages to <canvas>
DragEngine          ← handles all pointer interactions
PdfExporter         ← flattens fields into the PDF via pdf-lib
```

---

## Development

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9

```bash
# Clone
git clone https://github.com/code-by-nanthu/pdf-sign.git
cd pdf-sign

# Install all workspace dependencies
pnpm install

# Build every package
pnpm build

# Run the full test suite (220 tests in @pdf-sign/core)
pnpm test

# Start Storybook (all adapters, port 6006)
pnpm docs
```

### Per-package scripts

```bash
# Build a single package
pnpm build:core
pnpm build:vue
pnpm build:react
pnpm build:angular
pnpm build:plugin

# Typecheck all packages
pnpm typecheck

# Watch mode for core
pnpm --filter @pdf-sign/core dev
```

### Project structure conventions

- All TypeScript is compiled in **strict mode** with `exactOptionalPropertyTypes: true`
- Core has **zero framework imports** — it can be used in Node.js (SSR template validation), the browser, and any test environment
- Components use **CSS custom properties exclusively** — no hardcoded colour utilities
- Tests live alongside source code in `__tests__/` directories

---

## Contributing

1. Fork and create a feature branch
2. Make your changes, add tests for any new behaviour in `@pdf-sign/core`
3. Run `pnpm build && pnpm test` — all 220 tests must pass
4. Run `pnpm typecheck` — zero TypeScript errors across all packages
5. Open a pull request

For significant changes, please open an issue first to discuss the design.

---

## Releasing (maintainers)

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
# Record a change
pnpm changeset

# Bump versions
pnpm version-packages

# Publish to npm
pnpm release
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with <a href="https://pdfjs.express">pdf.js</a>, <a href="https://pdf-lib.js.org">pdf-lib</a>, and a lot of pointer events.<br>
  Made by <a href="https://github.com/code-by-nanthu">code-by-nanthu</a>.
</p>
