import { useEffect, useRef } from 'react'
import type { FieldDef, SignerDef, OverlayRect } from '@pdf-sign/core'
import type { DragEngine, ResizeHandle } from '@pdf-sign/core'
import { pdfToOverlay } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'

interface FieldChipProps {
  field: FieldDef
  signers: SignerDef[]
  viewport: RenderPageResult['viewport'] | null
  dragEngine: DragEngine | null
  isSelected: boolean
  isComplete: boolean
  mode: 'prepare' | 'sign' | 'readonly'
  onSelect: (fieldId: string) => void
  onDelete: (fieldId: string) => void
}

const HANDLES: ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']

const HANDLE_POSITIONS: Record<ResizeHandle, string> = {
  n:  'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
  ne: 'top-0 right-0 -translate-y-1/2 translate-x-1/2 cursor-ne-resize',
  e:  'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
  se: 'bottom-0 right-0 translate-y-1/2 translate-x-1/2 cursor-se-resize',
  s:  'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
  sw: 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2 cursor-sw-resize',
  w:  'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
  nw: 'top-0 left-0 -translate-y-1/2 -translate-x-1/2 cursor-nw-resize',
}

export function FieldChip({
  field,
  signers,
  viewport,
  dragEngine,
  isSelected,
  isComplete,
  mode,
  onSelect,
  onDelete,
}: FieldChipProps) {
  const chipRef = useRef<HTMLDivElement | null>(null)
  const handleRefs = useRef<Map<ResizeHandle, HTMLDivElement>>(new Map())
  const cleanupMoveRef = useRef<(() => void) | null>(null)
  const cleanupHandlesRef = useRef<Array<() => void>>([])

  // Register with drag engine — must run BEFORE conditional returns
  useEffect(() => {
    if (!dragEngine || !chipRef.current || mode !== 'prepare' || !viewport) return

    cleanupMoveRef.current?.()
    cleanupHandlesRef.current.forEach((fn) => fn())
    cleanupHandlesRef.current = []

    const getLiveRect = (): OverlayRect => pdfToOverlay(field.rect, viewport)

    cleanupMoveRef.current = dragEngine.registerField(
      chipRef.current,
      field.id,
      getLiveRect,
    )

    for (const [handle, el] of handleRefs.current.entries()) {
      const cleanup = dragEngine.registerResizeHandle(el, field.id, handle, getLiveRect)
      cleanupHandlesRef.current.push(cleanup)
    }

    return () => {
      cleanupMoveRef.current?.()
      cleanupHandlesRef.current.forEach((fn) => fn())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragEngine, field.id, mode, viewport])

  if (!viewport) return null

  const overlayRect: OverlayRect = pdfToOverlay(field.rect, viewport)

  function setHandleRef(el: HTMLDivElement | null, handle: ResizeHandle) {
    if (el) handleRefs.current.set(handle, el)
    else handleRefs.current.delete(handle)
  }

  const signer = signers.find((s) => s.id === field.signerId)

  const stateClass = isComplete
    ? 'bg-[var(--psign-field-complete)]'
    : field.required
      ? 'bg-[var(--psign-field-required)]'
      : 'bg-[var(--psign-field-active)]'

  return (
    <div
      ref={chipRef}
      style={{
        position: 'absolute',
        left: overlayRect.x,
        top: overlayRect.y,
        width: overlayRect.width,
        height: overlayRect.height,
      }}
      className={`group/chip select-none ${mode === 'prepare' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      onClick={() => onSelect(field.id)}
    >
      <div
        className={[
          'relative flex h-full w-full items-center overflow-hidden',
          'rounded-[var(--psign-radius-sm)] border transition-all duration-100',
          isSelected ? 'border-[var(--psign-primary)]' : 'border-[var(--psign-border)]',
          stateClass,
        ].join(' ')}
      >
        {signer && (
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: signer.color }}
          />
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 px-3">
          <span className="truncate text-[10px] font-medium text-[var(--psign-text)]">
            {field.label}
          </span>
          {field.required && (
            <span className="shrink-0 text-[9px] font-semibold uppercase text-[var(--psign-danger)]">
              *
            </span>
          )}
        </div>
        {mode === 'prepare' && isSelected && (
          <button
            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-[var(--psign-danger)] text-white opacity-0 transition-opacity group-hover/chip:opacity-100 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
            title="Remove field"
            onClick={(e) => { e.stopPropagation(); onDelete(field.id) }}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M2 2 L10 10 M10 2 L2 10" />
            </svg>
          </button>
        )}
      </div>

      {mode === 'prepare' && isSelected && HANDLES.map((handle) => (
        <div
          key={handle}
          ref={(el) => setHandleRef(el, handle)}
          className={[
            'absolute h-2.5 w-2.5 rounded-full',
            'border-2 border-[var(--psign-primary)] bg-[var(--psign-surface)] z-10',
            HANDLE_POSITIONS[handle],
          ].join(' ')}
          data-resize-handle={handle}
        />
      ))}
    </div>
  )
}
