# pdf-sign

> Framework-agnostic PDF e-signature and field-placement library for Vue 3, React 18+, and Angular 17+

[![Core tests](https://img.shields.io/badge/core%20tests-220%20passing-22c55e?style=flat-square)](packages/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.base.json)
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

## Installing in your project

Once published to npm, install with **any** package manager:

```bash
# npm
npm install @pdf-sign/vue pdfjs-dist pdf-lib

# yarn
yarn add @pdf-sign/vue pdfjs-dist pdf-lib

# bun
bun add @pdf-sign/vue pdfjs-dist pdf-lib

# pnpm
pnpm add @pdf-sign/vue pdfjs-dist pdf-lib
```

Replace `@pdf-sign/vue` with `@pdf-sign/react` or `@pdf-sign/angular` as needed.

---

## Quick start

### Vue 3

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

```tsx
import '@pdf-sign/react/base.css'
import { PdfSigner } from '@pdf-sign/react'

// Prepare mode
<PdfSigner pdf={myFile} mode="prepare" onTemplateReady={saveTemplate} />

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

Built entirely on the [Pointer Events API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — no interact.js, no jQuery, no touch-specific handlers. Mouse, stylus, and touch all use the same code path.

- **Palette → canvas** drag-to-place
- **Move** placed fields with pixel precision
- **Resize** via 8-handle borders (n, ne, e, se, s, sw, w, nw)
- **Snap-to-grid** with configurable cell size
- **Undo / redo** (50-step history)

### Signature capture

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

Every colour, radius, shadow, and font in every component is driven by CSS custom properties. Override them globally, per-instance, or via the Tailwind plugin.

```css
/* Global — affects all instances */
.pdf-sign-root {
  --psign-primary: #dc2626;
  --psign-primary-hover: #b91c1c;
  --psign-radius: 2px;
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
// State bridged via useSyncExternalStore — concurrent-rendering safe
```

### Angular

```ts
import { PdfSignService } from '@pdf-sign/angular'

@Component({ providers: [PdfSignService] })
export class MyComponent implements OnInit {
  svc = inject(PdfSignService)

  ngOnInit() {
    this.svc.initialise({ mode: 'prepare', pdf: this.myFile })
    // All state lives in Angular signals: svc.fields(), svc.state(), …
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

### Package manager note

> **TL;DR:** Use **pnpm** to develop this monorepo. Consumers of the published packages can use any package manager.

This monorepo uses [pnpm workspaces](https://pnpm.io/workspaces) for development. Three things tie it to pnpm at dev time:

1. **`pnpm-workspace.yaml`** — the workspace definition (npm/yarn/bun use the `workspaces` field in `package.json` instead, which is also present)
2. **`workspace:*` protocol** in internal `devDependencies` — pnpm resolves this natively. Changesets automatically rewrites these to real version numbers on publish, so consumers never see `workspace:*`
3. **pnpm filter syntax** in scripts (`pnpm --filter`, `pnpm -r`) — used in all monorepo orchestration commands

Once published to npm, the individual packages (`@pdf-sign/vue`, etc.) are standard ESM/CJS bundles with no pnpm requirement whatsoever. Consumers install and use them with **npm, yarn, bun, or pnpm** identically.

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18.0.0 |
| pnpm | 9.0.0 |

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Clone and bootstrap
git clone https://github.com/code-by-nanthu/pdf-sign.git
cd pdf-sign
pnpm install

# Build every package
pnpm build

# Run the full test suite (220 tests in @pdf-sign/core)
pnpm test

# Start Storybook (all adapters, port 6006)
pnpm docs
```

### Per-package commands

```bash
# Build individual packages
pnpm build:core
pnpm build:vue
pnpm build:react
pnpm build:angular
pnpm build:plugin

# Typecheck all packages (zero errors required)
pnpm typecheck

# Watch mode while developing core
pnpm --filter @pdf-sign/core dev
```

### Project conventions

- All TypeScript is compiled in **strict mode** with `exactOptionalPropertyTypes: true`
- `@pdf-sign/core` has **zero framework imports** — works in Node.js (SSR), browser, and test environments equally
- Components use **CSS custom properties exclusively** — no hardcoded colour utilities
- Tests live alongside source in `__tests__/` directories — new behaviour in core requires a test

---

## Contributing

1. Fork and create a feature branch
2. Make your changes; add tests in `@pdf-sign/core` for any new behaviour
3. Run `pnpm build && pnpm test` — all 220 tests must pass
4. Run `pnpm typecheck` — zero TypeScript errors across all packages
5. Open a pull request with a clear description of _what_ changed and _why_

For significant changes, open an issue first to align on the design.

---

## Releasing (maintainers)

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

```bash
# 1. Record a change (interactive prompt)
pnpm changeset

# 2. Bump versions + update changelogs
pnpm version-packages

# 3. Build + publish all packages to npm
pnpm release
```

Changesets automatically rewrites all `workspace:*` dependency entries to real semver ranges before publish, so the packages on npm have no pnpm-specific artifacts.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with <a href="https://mozilla.github.io/pdf.js/">pdf.js</a>, <a href="https://pdf-lib.js.org">pdf-lib</a>, and the Pointer Events API.<br>
  Made by <a href="https://github.com/code-by-nanthu">code-by-nanthu</a>.
</p>
