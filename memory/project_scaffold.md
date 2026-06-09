---
name: pdf-sign-scaffold
description: Initial monorepo scaffold for pdf-sign — what was built, what's stubbed, and what comes next
metadata:
  type: project
---

@pdf-sign monorepo scaffold completed at /Users/nanthups/Workspace/Learning/pdf-sign.

**Why:** Learning project — production-grade open-source PDF e-signature package published under @pdf-sign/* scoped npm packages.

**What was built:**
- Root workspace (pnpm v9, changesets)
- `tooling/` — shared tsconfig.base.json, eslint.base.mjs, vitest.base.ts
- `packages/core` (@pdf-sign/core) — fully implemented: all types (PdfTemplate, FieldDef, SignerDef, ThemeTokens, LocaleStrings, etc.), coordinate mapper (overlayToPdf / pdfToOverlay / clamp), utils (sha256Hex, generateId, normalisePdfInput), theme injection; 21 tests all passing
- `packages/tailwind-plugin` (@pdf-sign/tailwind-plugin) — Tailwind v3+v4 plugin; builds base.css and plugin.css with all CSS vars
- `packages/vue`, `packages/react`, `packages/angular` — skeleton stubs only (components/hooks/services declared but not implemented)
- `docs/` — Storybook 8 skeleton

**Key fixes applied vs. spec:**
- Removed `composite: true` from core tsconfig (conflicts with tsup DTS)
- Added `(data.buffer as ArrayBuffer)` cast in sha256Hex (SharedArrayBuffer incompatibility)
- tailwind-plugin: added tsconfig.json + @types/node, changed from raw `require()` to `createRequire` with CJS fallback, inlined Tailwind plugin types (peer dep not installed at build time)
- build-css.mjs: imports from `../dist/tokens.js` (compiled) not `../src/tokens.ts`

**What's next (subsequent prompts):**
- core state machine (fieldStore, signerStore, document lifecycle)
- core pdf.js renderer wrapper
- core drag engine (PointerEvents)
- core pdf-lib export + audit page
- Full Vue/React/Angular component implementations

**How to apply:** When picking up this project, note the tailwind-plugin uses `createRequire` with a CJS fallback — this is intentional. Core is the only tested package; others are stubs.
