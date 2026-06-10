import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import type { FieldDef, SignerDef } from '@pdf-sign/core'
import type { DragEngine } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import { FieldChipComponent } from './field-chip.component.js'

@Component({
  selector: 'pdf-field-overlay',
  standalone: true,
  imports: [CommonModule, FieldChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #overlayEl
      class="pointer-events-auto absolute inset-0"
      [style.z-index]="'var(--psign-z-overlay)'"
    >
      <pdf-field-chip
        *ngFor="let field of visibleFields; trackBy: trackById"
        [field]="field"
        [signers]="signers"
        [viewport]="viewport"
        [dragEngine]="dragEngine"
        [isSelected]="selectedFieldId === field.id"
        [isComplete]="completedSet.has(field.id)"
        [mode]="mode"
        (select)="fieldSelect.emit($event)"
        (delete)="fieldDelete.emit($event)"
      />
    </div>
  `,
})
export class FieldOverlayComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() fields: FieldDef[] = []
  @Input() signers: SignerDef[] = []
  @Input() page = 0
  @Input() viewport: RenderPageResult['viewport'] | null = null
  @Input() dragEngine: DragEngine | null = null
  @Input() selectedFieldId: string | null = null
  @Input() mode: 'prepare' | 'sign' | 'readonly' = 'prepare'
  @Input() completedFieldIds: string[] = []

  @Output() fieldSelect = new EventEmitter<string>()
  @Output() fieldDelete = new EventEmitter<string>()

  @ViewChild('overlayEl') overlayElRef?: ElementRef<HTMLElement>

  private cleanupOverlay: (() => void) | null = null

  get visibleFields(): FieldDef[] {
    return this.fields.filter((f) => f.rect.page === this.page)
  }

  get completedSet(): Set<string> {
    return new Set(this.completedFieldIds)
  }

  trackById(_: number, field: FieldDef): string {
    return field.id
  }

  ngAfterViewInit(): void {
    this.registerOverlay()
  }

  ngOnChanges(): void {
    if (this.overlayElRef) this.registerOverlay()
  }

  private registerOverlay(): void {
    this.cleanupOverlay?.()
    if (!this.dragEngine || !this.overlayElRef) return
    this.cleanupOverlay = this.dragEngine.registerOverlay(
      this.overlayElRef.nativeElement,
      this.page,
    )
  }

  ngOnDestroy(): void {
    this.cleanupOverlay?.()
  }
}
