import { useEffect, useRef, useState } from 'react'
import type { SignerDef } from '@pdf-sign/core'
import type { DragEngine } from '@pdf-sign/core'

interface PaletteItem {
  type: string
  label: string
  category: string
}

const ALL_ITEMS: PaletteItem[] = [
  { type: 'signature',   label: 'Signature',   category: 'Signature' },
  { type: 'initials',    label: 'Initials',    category: 'Signature' },
  { type: 'date-signed', label: 'Date signed', category: 'Signature' },
  { type: 'text',        label: 'Text',        category: 'Input' },
  { type: 'textarea',    label: 'Multiline',   category: 'Input' },
  { type: 'checkbox',    label: 'Checkbox',    category: 'Input' },
  { type: 'radio',       label: 'Radio',       category: 'Input' },
  { type: 'dropdown',    label: 'Dropdown',    category: 'Input' },
  { type: 'stamp',       label: 'Stamp',       category: 'Media' },
]

interface FieldPaletteProps {
  signers: SignerDef[]
  activeSignerId?: string | null
  dragEngine: DragEngine | null
  onSignerChange?: (signerId: string) => void
}

export function FieldPalette({
  signers,
  activeSignerId,
  dragEngine,
  onSignerChange,
}: FieldPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const cleanupRefs = useRef<Map<string, () => void>>(new Map())

  const filtered = ALL_ITEMS.filter(
    (item) =>
      searchQuery === '' ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category]!.push(item)
    return acc
  }, {})

  useEffect(() => {
    if (!dragEngine) return
    const cleanups: Array<() => void> = []
    for (const [type, el] of chipRefs.current.entries()) {
      const cleanup = dragEngine.registerPaletteItem(el, type)
      cleanups.push(cleanup)
      cleanupRefs.current.set(type, cleanup)
    }
    return () => cleanups.forEach((fn) => fn())
  }, [dragEngine])

  function setChipRef(el: HTMLDivElement | null, type: string) {
    if (el) {
      chipRefs.current.set(type, el)
    } else {
      chipRefs.current.delete(type)
      cleanupRefs.current.get(type)?.()
      cleanupRefs.current.delete(type)
    }
  }

  const chipBase =
    'group mb-1 flex cursor-grab items-center gap-2.5 rounded-[var(--psign-radius-sm)] ' +
    'border border-[var(--psign-border)] bg-[var(--psign-surface)] ' +
    'px-2.5 py-2 transition-colors select-none ' +
    'hover:border-[var(--psign-primary)] hover:bg-[var(--psign-field-active)] active:cursor-grabbing'

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--psign-border)] bg-[var(--psign-palette-bg)]">
      {signers.length > 1 && (
        <div className="border-b border-[var(--psign-border)] p-3">
          <label className="mb-1 block text-xs font-medium text-[var(--psign-text-muted)]">
            Assigning fields to
          </label>
          <div className="flex flex-col gap-1">
            {signers.map((signer) => (
              <button
                key={signer.id}
                className={[
                  'flex items-center gap-2 rounded-[var(--psign-radius-sm)] px-2 py-1.5 text-left text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
                  activeSignerId === signer.id
                    ? 'bg-[var(--psign-field-active)] font-medium text-[var(--psign-text)]'
                    : 'text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)]',
                ].join(' ')}
                onClick={() => onSignerChange?.(signer.id)}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: signer.color }} />
                <span className="truncate">{signer.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-[var(--psign-border)] p-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search fields…"
          className="w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] bg-[var(--psign-surface)] py-1.5 pl-3 pr-2 text-xs text-[var(--psign-text)] placeholder:text-[var(--psign-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-[var(--psign-text-muted)]">
            No fields match
          </p>
        )}
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--psign-text-muted)] first:mt-0">
              {category}
            </p>
            {items.map((item) => (
              <div
                key={item.type}
                ref={(el) => setChipRef(el, item.type)}
                className={chipBase}
              >
                <span className="text-sm text-[var(--psign-text-muted)]">
                  {item.label.charAt(0)}
                </span>
                <span className="flex-1 text-xs font-medium text-[var(--psign-text)]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
