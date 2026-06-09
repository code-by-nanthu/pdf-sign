import { createRequire } from 'module'
import type { PsignTokenConfig } from './tokens.js'
import { TOKEN_DEFAULTS, TOKEN_CSS_VARS } from './tokens.js'

type PluginHelpers = {
  addBase: (styles: Record<string, Record<string, string>>) => void
  matchUtilities: (
    utilities: Record<string, (value: string) => Record<string, string>>,
    options?: { values?: Record<string, string>; supportsNegativeValues?: boolean },
  ) => void
  theme: (path: string) => unknown
}

type TailwindPlugin = (handler: (helpers: PluginHelpers) => void, config?: unknown) => unknown

/**
 * @pdf-sign Tailwind CSS v3 plugin.
 *
 * Registers bg-psign-*, text-psign-*, border-psign-*, ring-psign-*
 * utilities that point to the package's CSS custom properties.
 *
 * Usage in tailwind.config.js:
 *   plugins: [require('@pdf-sign/tailwind-plugin')()]
 *
 * With config:
 *   plugins: [require('@pdf-sign/tailwind-plugin')({ primary: '#dc2626' })]
 */
export default function psignPlugin(config: PsignTokenConfig = {}) {
  // In CJS context (tailwind.config.js), use the global require.
  // In ESM context (direct import), fall back to createRequire.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const _req: NodeRequire = typeof require !== 'undefined' ? require : createRequire(import.meta.url)
  const plugin = _req('tailwindcss/plugin') as TailwindPlugin

  const merged = { ...TOKEN_DEFAULTS, ...config }

  return plugin(
    ({ addBase, matchUtilities }) => {
      // Inject CSS variable defaults on .pdf-sign-root
      const cssVars: Record<string, string> = {}
      for (const [key, cssVar] of Object.entries(TOKEN_CSS_VARS) as [
        keyof PsignTokenConfig,
        string,
      ][]) {
        cssVars[cssVar] = merged[key]
      }
      addBase({ '.pdf-sign-root': cssVars })

      // Register bg-psign-* utilities
      matchUtilities(
        { 'bg-psign': (value) => ({ backgroundColor: value }) },
        { values: buildTokenValues(), supportsNegativeValues: false },
      )

      // Register text-psign-* utilities
      matchUtilities(
        { 'text-psign': (value) => ({ color: value }) },
        { values: buildTokenValues() },
      )

      // Register border-psign-* utilities
      matchUtilities(
        { 'border-psign': (value) => ({ borderColor: value }) },
        { values: buildTokenValues() },
      )

      // Register ring-psign-* utilities
      matchUtilities(
        { 'ring-psign': (value) => ({ '--tw-ring-color': value }) },
        { values: buildTokenValues() },
      )
    },
    {
      theme: {
        extend: {
          colors: buildThemeColors(merged),
        },
      },
    },
  )
}

function buildTokenValues() {
  return {
    primary: `var(--psign-primary)`,
    'primary-fg': `var(--psign-primary-fg)`,
    'primary-hover': `var(--psign-primary-hover)`,
    surface: `var(--psign-surface)`,
    'surface-raised': `var(--psign-surface-raised)`,
    text: `var(--psign-text)`,
    muted: `var(--psign-text-muted)`,
    border: `var(--psign-border)`,
    'focus-ring': `var(--psign-focus-ring)`,
    danger: `var(--psign-danger)`,
    success: `var(--psign-success)`,
    warning: `var(--psign-warning)`,
  }
}

function buildThemeColors(config: Required<PsignTokenConfig>) {
  return {
    'psign-primary': config.primary,
    'psign-surface': config.surface,
    'psign-text': config.text,
    'psign-muted': config.textMuted,
    'psign-border': config.border,
    'psign-danger': config.danger,
    'psign-success': config.success,
    'psign-warning': config.warning,
  }
}
