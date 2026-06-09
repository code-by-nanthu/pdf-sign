import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TOKEN_DEFAULTS, TOKEN_CSS_VARS } from '../dist/tokens.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')

mkdirSync(distDir, { recursive: true })

// ── base.css ─────────────────────────────────────────────────────────────────
// Imported once by the consumer. Sets all CSS variable defaults.

const baseLines = Object.entries(TOKEN_CSS_VARS).map(([key, cssVar]) => {
  return `  ${cssVar}: ${TOKEN_DEFAULTS[key]};`
})

const baseCss = `/*
 * @pdf-sign base CSS
 * Import this once in your app entry point:
 *   import '@pdf-sign/vue/base.css'   (or /react, /angular)
 *
 * Override any token by setting the CSS variable on .pdf-sign-root or a parent.
 */

.pdf-sign-root {
${baseLines.join('\n')}
}
`

writeFileSync(join(distDir, 'base.css'), baseCss)
console.log('✓ dist/base.css')

// ── plugin.css ────────────────────────────────────────────────────────────────
// Tailwind v4 @plugin file.

const pluginCss = `/*
 * @pdf-sign Tailwind v4 plugin CSS.
 *
 * Usage in your CSS file:
 *   @import "tailwindcss";
 *   @plugin "@pdf-sign/tailwind-plugin/plugin.css";
 *
 * Or with config:
 *   @plugin "@pdf-sign/tailwind-plugin/plugin.css" {
 *     primary: #dc2626;
 *   }
 */

@layer base {
  .pdf-sign-root {
${baseLines.join('\n')}
  }
}

@utility bg-psign-primary     { background-color: var(--psign-primary); }
@utility bg-psign-surface      { background-color: var(--psign-surface); }
@utility bg-psign-surface-raised { background-color: var(--psign-surface-raised); }
@utility bg-psign-danger       { background-color: var(--psign-danger); }
@utility bg-psign-success      { background-color: var(--psign-success); }
@utility bg-psign-warning      { background-color: var(--psign-warning); }

@utility text-psign-primary    { color: var(--psign-primary); }
@utility text-psign-text       { color: var(--psign-text); }
@utility text-psign-muted      { color: var(--psign-text-muted); }
@utility text-psign-primary-fg { color: var(--psign-primary-fg); }
@utility text-psign-danger     { color: var(--psign-danger); }
@utility text-psign-success    { color: var(--psign-success); }

@utility border-psign-border   { border-color: var(--psign-border); }
@utility border-psign-primary  { border-color: var(--psign-primary); }
@utility border-psign-danger   { border-color: var(--psign-danger); }

@utility ring-psign-primary    { --tw-ring-color: var(--psign-primary); }
@utility ring-psign-focus      { --tw-ring-color: var(--psign-focus-ring); }
`

writeFileSync(join(distDir, 'plugin.css'), pluginCss)
console.log('✓ dist/plugin.css')
