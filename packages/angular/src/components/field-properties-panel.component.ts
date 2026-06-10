import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import type { FieldDef, SignerDef } from '@pdf-sign/core'

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

@Component({
  selector: 'pdf-field-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      *ngIf="field"
      class="flex w-60 shrink-0 flex-col border-l border-[var(--psign-border)] bg-[var(--psign-palette-bg)]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-[var(--psign-border)] px-4 py-3">
        <span class="rounded-[var(--psign-radius-sm)] bg-[var(--psign-field-active)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--psign-primary)]">
          {{ typeLabel }}
        </span>
        <button
          class="flex h-6 w-6 items-center justify-center rounded-[var(--psign-radius-sm)] text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)] transition-colors"
          (click)="close.emit()"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M2 2 L12 12 M12 2 L2 12"/>
          </svg>
        </button>
      </div>

      <!-- Properties -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">

        <!-- Label -->
        <div>
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">Label</label>
          <input
            type="text"
            [value]="field.label"
            [class]="inputClass"
            placeholder="Field label"
            (input)="onUpdate({ label: $any($event.target).value })"
          />
        </div>

        <!-- Required toggle -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--psign-text)]">Required</span>
          <button
            [class]="toggleClass"
            role="switch"
            [attr.aria-checked]="field.required"
            (click)="onUpdate({ required: !field.required })"
          >
            <span [class]="thumbClass"></span>
          </button>
        </div>

        <!-- Signer assignment -->
        <div *ngIf="signers.length > 0">
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">Assigned to</label>
          <select
            [value]="field.signerId ?? ''"
            [class]="inputClass"
            (change)="onUpdate({ signerId: $any($event.target).value || null })"
          >
            <option value="">Any signer</option>
            <option *ngFor="let s of signers" [value]="s.id">{{ s.name }}</option>
          </select>
          <div *ngIf="assignedSigner" class="mt-1.5 flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full" [style.background-color]="assignedSigner.color"></span>
            <span class="text-[10px] text-[var(--psign-text-muted)]">{{ assignedSigner.name }}</span>
          </div>
        </div>

        <!-- Placeholder -->
        <div *ngIf="showPlaceholder">
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">Placeholder</label>
          <input
            type="text"
            [value]="field.placeholder ?? ''"
            [class]="inputClass"
            placeholder="Hint text shown to signer"
            (input)="onUpdate({ placeholder: $any($event.target).value })"
          />
        </div>

        <!-- Options -->
        <div *ngIf="showOptions">
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">
            Options <span class="font-normal text-[var(--psign-text-muted)]">(one per line)</span>
          </label>
          <textarea
            [value]="(field.options ?? []).join('\\n')"
            rows="4"
            [class]="inputClass + ' resize-none'"
            placeholder="Option A&#10;Option B&#10;Option C"
            (input)="onUpdate({ options: $any($event.target).value.split('\\n').map((s: string) => s.trim()).filter(Boolean) })"
          ></textarea>
        </div>

        <!-- Position info -->
        <div>
          <p class="mb-1 text-xs font-medium text-[var(--psign-text)]">Position</p>
          <div class="grid grid-cols-2 gap-1 text-[10px] text-[var(--psign-text-muted)]">
            <span>x: {{ field.rect.x | number:'1.0-0' }}pt</span>
            <span>y: {{ field.rect.y | number:'1.0-0' }}pt</span>
            <span>w: {{ field.rect.width | number:'1.0-0' }}pt</span>
            <span>h: {{ field.rect.height | number:'1.0-0' }}pt</span>
            <span class="col-span-2">page: {{ field.rect.page + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- Delete -->
      <div class="border-t border-[var(--psign-border)] p-4">
        <button
          class="w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-danger)] py-1.5 text-xs font-medium text-[var(--psign-danger)] hover:bg-[var(--psign-field-required)] transition-colors"
          (click)="delete.emit(field!.id)"
        >Remove field</button>
      </div>
    </aside>
  `,
})
export class FieldPropertiesPanelComponent {
  @Input() field: FieldDef | null = null
  @Input() signers: SignerDef[] = []

  @Output() update = new EventEmitter<{ id: string; changes: Partial<Omit<FieldDef, 'id'>> }>()
  @Output() delete = new EventEmitter<string>()
  @Output() close = new EventEmitter<void>()

  readonly inputClass =
    'w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] ' +
    'bg-[var(--psign-surface)] px-2.5 py-1.5 text-xs text-[var(--psign-text)] ' +
    'focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]'

  get typeLabel(): string {
    return this.field ? (FIELD_TYPE_LABELS[this.field.type] ?? this.field.type) : ''
  }

  get showPlaceholder(): boolean {
    return this.field?.type === 'text' || this.field?.type === 'textarea'
  }

  get showOptions(): boolean {
    return this.field?.type === 'radio' || this.field?.type === 'dropdown'
  }

  get assignedSigner(): SignerDef | undefined {
    return this.signers.find((s) => s.id === this.field?.signerId)
  }

  get toggleClass(): string {
    const base = 'relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]'
    return this.field?.required
      ? `${base} bg-[var(--psign-primary)]`
      : `${base} bg-[var(--psign-border)]`
  }

  get thumbClass(): string {
    const base = 'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform'
    return this.field?.required ? `${base} translate-x-4` : `${base} translate-x-0.5`
  }

  onUpdate(changes: Partial<Omit<FieldDef, 'id'>>): void {
    if (!this.field) return
    this.update.emit({ id: this.field.id, changes })
  }
}
