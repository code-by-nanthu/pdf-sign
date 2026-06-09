import type { ThemeTokens } from '../types/index.js'
import { DEFAULT_THEME_TOKENS } from '../types/defaults.js'

/**
 * Map from ThemeTokens key to the CSS custom property name.
 */
const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
  primary: '--psign-primary',
  primaryFg: '--psign-primary-fg',
  primaryHover: '--psign-primary-hover',
  surface: '--psign-surface',
  surfaceRaised: '--psign-surface-raised',
  overlay: '--psign-overlay',
  text: '--psign-text',
  textMuted: '--psign-text-muted',
  border: '--psign-border',
  focusRing: '--psign-focus-ring',
  danger: '--psign-danger',
  success: '--psign-success',
  warning: '--psign-warning',
  toolbarBg: '--psign-toolbar-bg',
  paletteBg: '--psign-palette-bg',
  canvasBg: '--psign-canvas-bg',
  fieldActive: '--psign-field-active',
  fieldRequired: '--psign-field-required',
  fieldComplete: '--psign-field-complete',
  sigInk: '--psign-sig-ink',
  sigFont: '--psign-sig-font',
  radiusSm: '--psign-radius-sm',
  radius: '--psign-radius',
  radiusLg: '--psign-radius-lg',
  fontUi: '--psign-font-ui',
  zOverlay: '--psign-z-overlay',
  shadow: '--psign-shadow',
}

/**
 * Inject theme token overrides as inline CSS custom properties on a DOM element.
 * Merges with defaults so only overridden values need to be provided.
 *
 * @param el       - The root element to inject on (the component's root div)
 * @param overrides - Partial theme token overrides from the consumer
 */
export function injectTheme(
  el: HTMLElement,
  overrides: Partial<ThemeTokens> = {},
): void {
  const merged = { ...DEFAULT_THEME_TOKENS, ...overrides }

  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR) as [
    keyof ThemeTokens,
    string,
  ][]) {
    const value = merged[key]
    if (value !== undefined) {
      el.style.setProperty(cssVar, value)
    }
  }
}

/**
 * Remove all theme custom properties injected by injectTheme.
 * Call when the component unmounts.
 */
export function removeTheme(el: HTMLElement): void {
  for (const cssVar of Object.values(TOKEN_TO_CSS_VAR)) {
    el.style.removeProperty(cssVar)
  }
}

/**
 * Generate a CSS string of all default token values.
 * Used in base.css / tailwind plugin to define the defaults.
 */
export function generateDefaultTokensCss(selector = '.pdf-sign-root'): string {
  const lines = Object.entries(TOKEN_TO_CSS_VAR).map(([key, cssVar]) => {
    const value = DEFAULT_THEME_TOKENS[key as keyof ThemeTokens]
    return `  ${cssVar}: ${value};`
  })
  return `${selector} {\n${lines.join('\n')}\n}`
}
