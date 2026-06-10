import type { ReactNode } from 'react'
import type { SignerDef } from '@pdf-sign/core'

interface ToolBarProps {
  currentPage: number
  totalPages: number
  scale: number
  canUndo: boolean
  canRedo: boolean
  isRendering: boolean
  mode: 'prepare' | 'sign' | 'readonly'
  signers?: SignerDef[]
  activeSignerId?: string | null
  onPrevPage: () => void
  onNextPage: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitWidth: () => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onSubmit: () => void
  children?: ReactNode
}

function formatScale(s: number) {
  return `${Math.round(s * 100)}%`
}

export function ToolBar({
  currentPage,
  totalPages,
  scale,
  canUndo,
  canRedo,
  isRendering,
  mode,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onUndo,
  onRedo,
  onSave,
  onSubmit,
  children,
}: ToolBarProps) {
  const btnBase =
    'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)] ' +
    'text-[var(--psign-text)] transition-colors ' +
    'hover:bg-[var(--psign-surface-raised)] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)] ' +
    'disabled:opacity-30 disabled:cursor-not-allowed'

  return (
    <header className="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--psign-border)] bg-[var(--psign-toolbar-bg)] px-3">
      {mode === 'prepare' && (
        <div className="flex items-center gap-0.5">
          <button className={btnBase} disabled={!canUndo} title="Undo (Ctrl+Z)" onClick={onUndo}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 L7 3.5 L7 6 Q11 6 11 10 Q11 13 7 13 L7 11 Q10 11 10 10 Q10 7.5 7 7.5 L7 10 Z" />
            </svg>
          </button>
          <button className={btnBase} disabled={!canRedo} title="Redo (Ctrl+Y)" onClick={onRedo}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7.5 L9 3.5 L9 6 Q5 6 5 10 Q5 13 9 13 L9 11 Q6 11 6 10 Q6 7.5 9 7.5 L9 10 Z" />
            </svg>
          </button>
          <div className="mx-1 h-5 w-px bg-[var(--psign-border)]" />
        </div>
      )}

      <div className="flex items-center gap-1">
        <button className={btnBase} disabled={currentPage === 0} title="Previous page" onClick={onPrevPage}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3 L6 8 L10 13" />
          </svg>
        </button>
        <span className="min-w-[4.5rem] text-center text-xs text-[var(--psign-text-muted)]">
          {currentPage + 1} / {totalPages || 1}
        </span>
        <button className={btnBase} disabled={currentPage >= totalPages - 1} title="Next page" onClick={onNextPage}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3 L10 8 L6 13" />
          </svg>
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-[var(--psign-border)]" />

      <div className="flex items-center gap-0.5">
        <button className={btnBase} title="Zoom out" onClick={onZoomOut}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="7" cy="7" r="4.5" />
            <path strokeLinecap="round" d="M5 7 H9" />
            <path strokeLinecap="round" d="M10.5 10.5 L13.5 13.5" />
          </svg>
        </button>
        <span className="min-w-[3rem] text-center text-xs text-[var(--psign-text-muted)]">
          {formatScale(scale)}
        </span>
        <button className={btnBase} title="Zoom in" onClick={onZoomIn}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="7" cy="7" r="4.5" />
            <path strokeLinecap="round" d="M5 7 H9 M7 5 V9" />
            <path strokeLinecap="round" d="M10.5 10.5 L13.5 13.5" />
          </svg>
        </button>
        <button
          className="flex h-7 items-center gap-1 rounded-[var(--psign-radius-sm)] px-2 text-xs text-[var(--psign-text-muted)] transition-colors hover:bg-[var(--psign-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
          onClick={onFitWidth}
        >
          Fit
        </button>
      </div>

      <div className="flex-1" />

      {isRendering && (
        <div className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 animate-spin text-[var(--psign-text-muted)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-xs text-[var(--psign-text-muted)]">Rendering…</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        {mode === 'prepare' && (
          <button
            className="flex h-7 items-center gap-1.5 rounded-[var(--psign-radius-sm)] bg-[var(--psign-primary)] px-3 text-xs font-medium text-[var(--psign-primary-fg)] transition-colors hover:bg-[var(--psign-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
            onClick={onSave}
          >
            Save template
          </button>
        )}
        {mode === 'sign' && (
          <button
            className="flex h-7 items-center gap-1.5 rounded-[var(--psign-radius-sm)] bg-[var(--psign-primary)] px-3 text-xs font-medium text-[var(--psign-primary-fg)] transition-colors hover:bg-[var(--psign-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
            onClick={onSubmit}
          >
            Submit signed
          </button>
        )}
        {children}
      </div>
    </header>
  )
}
