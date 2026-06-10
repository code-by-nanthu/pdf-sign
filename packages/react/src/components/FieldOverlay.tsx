import { useEffect, useRef } from 'react'
import type { FieldDef, SignerDef } from '@pdf-sign/core'
import type { DragEngine } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import { FieldChip } from './FieldChip.js'

interface FieldOverlayProps {
  fields: FieldDef[]
  signers: SignerDef[]
  page: number
  viewport: RenderPageResult['viewport'] | null
  dragEngine: DragEngine | null
  selectedFieldId?: string | null
  mode: 'prepare' | 'sign' | 'readonly'
  completedFieldIds?: string[]
  onFieldSelect: (fieldId: string) => void
  onFieldDelete: (fieldId: string) => void
}

export function FieldOverlay({
  fields,
  signers,
  page,
  viewport,
  dragEngine,
  selectedFieldId,
  mode,
  completedFieldIds = [],
  onFieldSelect,
  onFieldDelete,
}: FieldOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!dragEngine || !overlayRef.current) return
    cleanupRef.current?.()
    cleanupRef.current = dragEngine.registerOverlay(overlayRef.current, page)
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [dragEngine, page])

  const visibleFields = fields.filter((f) => f.rect.page === page)
  const completedSet = new Set(completedFieldIds)

  return (
    <div
      ref={overlayRef}
      className="pointer-events-auto absolute inset-0"
      style={{ zIndex: 'var(--psign-z-overlay)' as unknown as number }}
    >
      {visibleFields.map((field) => (
        <FieldChip
          key={field.id}
          field={field}
          signers={signers}
          viewport={viewport}
          dragEngine={dragEngine}
          isSelected={selectedFieldId === field.id}
          isComplete={completedSet.has(field.id)}
          mode={mode}
          onSelect={onFieldSelect}
          onDelete={onFieldDelete}
        />
      ))}
    </div>
  )
}
