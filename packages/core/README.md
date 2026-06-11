# @pdf-sign/core

Headless PDF e-signature core. Zero framework imports. Pure TypeScript.

Provides the state machine, coordinate mapper, pdf.js renderer wrapper,
PointerEvents drag engine, and pdf-lib export used by all framework adapters.

## Install

```bash
pnpm add @pdf-sign/core pdfjs-dist pdf-lib
```

## Usage (headless)

```ts
import { PdfSignController, PdfRenderer, DragEngine } from '@pdf-sign/core'

const ctrl = new PdfSignController({ mode: 'prepare', pdf: myFile })
const renderer = new PdfRenderer()
const drag = new DragEngine()

await ctrl.load()
const count = await renderer.load(ctrl.pdfBytes!)
ctrl.setPageCount(count)

ctrl.events.on('fields-changed', ({ fields }) => {
  console.log(fields)
})
```

## Key exports

- `PdfSignController` — owns all state, emits typed events
- `PdfRenderer` — wraps pdf.js v4, renders pages to canvas
- `DragEngine` — PointerEvents drag-to-place + move + resize
- `PdfExporter` — pdf-lib field flattening + audit page
- Coordinate mapper: `overlayToPdf`, `pdfToOverlay`, `clampToPdfPage`
- All TypeScript types: `PdfTemplate`, `FieldDef`, `SignerDef`, etc.
