import type { ThemeTokens } from '@pdf-sign/core'

export const THEME_INDIGO: Partial<ThemeTokens> = {
  primary: '#6366f1',
  primaryFg: '#ffffff',
  primaryHover: '#4f46e5',
}

export const THEME_RED: Partial<ThemeTokens> = {
  primary: '#dc2626',
  primaryFg: '#ffffff',
  primaryHover: '#b91c1c',
  focusRing: '#dc2626',
  fieldActive: 'rgba(220,38,38,0.12)',
  sigInk: '#7f1d1d',
}

export const THEME_GREEN: Partial<ThemeTokens> = {
  primary: '#16a34a',
  primaryFg: '#ffffff',
  primaryHover: '#15803d',
  focusRing: '#16a34a',
  fieldActive: 'rgba(22,163,74,0.12)',
  success: '#15803d',
}

export const THEME_DARK: Partial<ThemeTokens> = {
  primary: '#818cf8',
  primaryFg: '#1e1b4b',
  primaryHover: '#a5b4fc',
  surface: '#1e293b',
  surfaceRaised: '#0f172a',
  overlay: 'rgba(0,0,0,0.75)',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#334155',
  focusRing: '#818cf8',
  toolbarBg: '#0f172a',
  paletteBg: '#1e293b',
  canvasBg: '#0f172a',
  fieldActive: 'rgba(129,140,248,0.2)',
  fieldRequired: 'rgba(248,113,113,0.2)',
  fieldComplete: 'rgba(52,211,153,0.2)',
}

export const THEME_PRESETS = {
  Indigo: THEME_INDIGO,
  Red: THEME_RED,
  Green: THEME_GREEN,
  Dark: THEME_DARK,
} as const

export type ThemePresetName = keyof typeof THEME_PRESETS
