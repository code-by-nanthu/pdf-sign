export interface PsignTokenConfig {
  primary?: string
  primaryFg?: string
  primaryHover?: string
  surface?: string
  surfaceRaised?: string
  overlay?: string
  text?: string
  textMuted?: string
  border?: string
  focusRing?: string
  danger?: string
  success?: string
  warning?: string
  toolbarBg?: string
  paletteBg?: string
  canvasBg?: string
  fieldActive?: string
  fieldRequired?: string
  fieldComplete?: string
  sigInk?: string
  radius?: string
  radiusSm?: string
  radiusLg?: string
}

export const TOKEN_DEFAULTS: Required<PsignTokenConfig> = {
  primary: '#6366f1',
  primaryFg: '#ffffff',
  primaryHover: '#4f46e5',
  surface: '#ffffff',
  surfaceRaised: '#f9fafb',
  overlay: 'rgba(0,0,0,0.45)',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  focusRing: '#6366f1',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  toolbarBg: '#f3f4f6',
  paletteBg: '#ffffff',
  canvasBg: '#e5e7eb',
  fieldActive: 'rgba(99,102,241,0.18)',
  fieldRequired: 'rgba(239,68,68,0.15)',
  fieldComplete: 'rgba(34,197,94,0.15)',
  sigInk: '#1e293b',
  radius: '8px',
  radiusSm: '4px',
  radiusLg: '12px',
}

/**
 * All token keys mapped to their CSS variable names.
 * These are the variables that base.css sets and components reference.
 */
export const TOKEN_CSS_VARS: Record<keyof PsignTokenConfig, string> = {
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
  radius: '--psign-radius',
  radiusSm: '--psign-radius-sm',
  radiusLg: '--psign-radius-lg',
}
