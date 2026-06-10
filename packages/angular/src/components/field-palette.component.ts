import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
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

@Component({
  selector: 'pdf-field-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="flex w-60 shrink-0 flex-col border-r border-[var(--psign-border)] bg-[var(--psign-palette-bg)]">

      <!-- Signer selector -->
      <div *ngIf="signers.length > 1" class="border-b border-[var(--psign-border)] p-3">
        <label class="mb-1 block text-xs font-medium text-[var(--psign-text-muted)]">Assigning fields to</label>
        <div class="flex flex-col gap-1">
          <button
            *ngFor="let signer of signers"
            [class]="signerBtnClass(signer.id)"
            (click)="signerChange.emit(signer.id)"
          >
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" [style.background-color]="signer.color"></span>
            <span class="truncate">{{ signer.name }}</span>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="border-b border-[var(--psign-border)] p-3">
        <input
          type="search"
          [(ngModel)]="searchQuery"
          placeholder="Search fields…"
          class="w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] bg-[var(--psign-surface)] py-1.5 pl-3 pr-2 text-xs text-[var(--psign-text)] placeholder:text-[var(--psign-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]"
        />
      </div>

      <!-- Items -->
      <div class="flex-1 overflow-y-auto p-2">
        <p *ngIf="filteredItems.length === 0" class="px-2 py-4 text-center text-xs text-[var(--psign-text-muted)]">
          No fields match
        </p>
        <ng-container *ngFor="let group of groupedItems">
          <p class="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--psign-text-muted)]">
            {{ group.category }}
          </p>
          <div
            *ngFor="let item of group.items"
            #chipEl
            [attr.data-field-type]="item.type"
            class="group mb-1 flex cursor-grab items-center gap-2.5 rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] bg-[var(--psign-surface)] px-2.5 py-2 transition-colors select-none hover:border-[var(--psign-primary)] hover:bg-[var(--psign-field-active)] active:cursor-grabbing"
          >
            <span class="text-sm text-[var(--psign-text-muted)]">{{ item.label.charAt(0) }}</span>
            <span class="flex-1 text-xs font-medium text-[var(--psign-text)]">{{ item.label }}</span>
          </div>
        </ng-container>
      </div>
    </aside>
  `,
})
export class FieldPaletteComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() signers: SignerDef[] = []
  @Input() activeSignerId: string | null = null
  @Input() dragEngine: DragEngine | null = null

  @Output() signerChange = new EventEmitter<string>()

  @ViewChildren('chipEl') chipEls!: QueryList<ElementRef<HTMLElement>>

  searchQuery = ''
  private cleanups: Array<() => void> = []

  get filteredItems(): PaletteItem[] {
    const q = this.searchQuery.toLowerCase()
    return ALL_ITEMS.filter(
      (item) => q === '' || item.label.toLowerCase().includes(q),
    )
  }

  get groupedItems(): Array<{ category: string; items: PaletteItem[] }> {
    const map = new Map<string, PaletteItem[]>()
    for (const item of this.filteredItems) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
  }

  signerBtnClass(signerId: string): string {
    const base =
      'flex items-center gap-2 rounded-[var(--psign-radius-sm)] px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]'
    return this.activeSignerId === signerId
      ? `${base} bg-[var(--psign-field-active)] font-medium text-[var(--psign-text)]`
      : `${base} text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)]`
  }

  ngAfterViewInit(): void {
    this.registerChips()
    this.chipEls.changes.subscribe(() => this.registerChips())
  }

  ngOnChanges(): void {
    if (this.chipEls) this.registerChips()
  }

  private registerChips(): void {
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []
    if (!this.dragEngine) return
    for (const ref of this.chipEls) {
      const el = ref.nativeElement
      const fieldType = el.dataset['fieldType']
      if (!fieldType) continue
      this.cleanups.push(this.dragEngine.registerPaletteItem(el, fieldType))
    }
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn())
  }
}
