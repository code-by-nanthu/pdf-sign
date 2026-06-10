import type { FieldDef, SignerDef } from '@pdf-sign/core'

interface FieldPropertiesPanelProps {
  field: FieldDef | null
  signers: SignerDef[]
  onUpdate: (payload: { id: string; changes: Partial<Omit<FieldDef, 'id'>> }) => void
  onDelete: (fieldId: string) => void
  onClose: () => void
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  signature:     'Signature',
  initials:      'Initials',
  'date-signed': 'Date signed',
  text:          'Text',
  textarea:      'Multiline text',
  checkbox:      'Checkbox',
  radio:         'Radio',
  dropdown:      'Dropdown',
  stamp:         'Stamp',
}

export function FieldPropertiesPanel({
  field,
  signers,
  onUpdate,
  onDelete,
  onClose,
}: FieldPropertiesPanelProps) {
  if (!field) return null

  const update = (changes: Partial<Omit<FieldDef, 'id'>>) =>
    onUpdate({ id: field.id, changes })

  const typeLabel = FIELD_TYPE_LABELS[field.type] ?? field.type
  const showPlaceholder = field.type === 'text' || field.type === 'textarea'
  const showOptions = field.type === 'radio' || field.type === 'dropdown'
  const assignedSigner = signers.find((s) => s.id === field.signerId)

  const inputClass =
    'w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] ' +
    'bg-[var(--psign-surface)] px-2.5 py-1.5 text-xs text-[var(--psign-text)] ' +
    'focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]'

  return (
    <aside className="flex w-60 shrink-0 flex-col border-l border-[var(--psign-border)] bg-[var(--psign-palette-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--psign-border)] px-4 py-3">
        <span className="rounded-[var(--psign-radius-sm)] bg-[var(--psign-field-active)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--psign-primary)]">
          {typeLabel}
        </span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-[var(--psign-radius-sm)] text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
          onClick={onClose}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M2 2 L12 12 M12 2 L2 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--psign-text)]">Label</label>
          <input
            type="text"
            defaultValue={field.label}
            className={inputClass}
            placeholder="Field label"
            onChange={(e) => update({ label: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--psign-text)]">Required</span>
          <button
            className={[
              'relative h-5 w-9 rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
              field.required ? 'bg-[var(--psign-primary)]' : 'bg-[var(--psign-border)]',
            ].join(' ')}
            role="switch"
            aria-checked={field.required}
            onClick={() => update({ required: !field.required })}
          >
            <span
              className={[
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                field.required ? 'translate-x-4' : 'translate-x-0.5',
              ].join(' ')}
            />
          </button>
        </div>

        {signers.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--psign-text)]">Assigned to</label>
            <select
              value={field.signerId ?? ''}
              className={inputClass}
              onChange={(e) => update({ signerId: e.target.value || null })}
            >
              <option value="">Any signer</option>
              {signers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {assignedSigner && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: assignedSigner.color }} />
                <span className="text-[10px] text-[var(--psign-text-muted)]">{assignedSigner.name}</span>
              </div>
            )}
          </div>
        )}

        {showPlaceholder && (
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--psign-text)]">Placeholder</label>
            <input
              type="text"
              defaultValue={field.placeholder ?? ''}
              className={inputClass}
              placeholder="Hint text shown to signer"
              onChange={(e) => update({ placeholder: e.target.value })}
            />
          </div>
        )}

        {showOptions && (
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--psign-text)]">
              Options <span className="font-normal text-[var(--psign-text-muted)]">(one per line)</span>
            </label>
            <textarea
              defaultValue={(field.options ?? []).join('\n')}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder={'Option A\nOption B\nOption C'}
              onChange={(e) =>
                update({
                  options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        )}

        <div>
          <p className="mb-1 text-xs font-medium text-[var(--psign-text)]">Position</p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-[var(--psign-text-muted)]">
            <span>x: {Math.round(field.rect.x)}pt</span>
            <span>y: {Math.round(field.rect.y)}pt</span>
            <span>w: {Math.round(field.rect.width)}pt</span>
            <span>h: {Math.round(field.rect.height)}pt</span>
            <span className="col-span-2">page: {field.rect.page + 1}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--psign-border)] p-4">
        <button
          className="w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-danger)] py-1.5 text-xs font-medium text-[var(--psign-danger)] hover:bg-[var(--psign-field-required)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
          onClick={() => onDelete(field.id)}
        >
          Remove field
        </button>
      </div>
    </aside>
  )
}
