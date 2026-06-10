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
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import type { FieldDef, SignerDef, OverlayRect } from '@pdf-sign/core'
import type { DragEngine, ResizeHandle } from '@pdf-sign/core'
import { pdfToOverlay } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'

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

@Component({
  selector: 'pdf-field-chip',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="overlayRect"
      #chipEl
      [style.position]="'absolute'"
      [style.left.px]="overlayRect.x"
      [style.top.px]="overlayRect.y"
      [style.width.px]="overlayRect.width"
      [style.height.px]="overlayRect.height"
      [class]="mode === 'prepare' ? 'group/chip select-none cursor-grab active:cursor-grabbing' : 'group/chip select-none cursor-pointer'"
      (click)="select.emit(field.id)"
    >
      <!-- Field body -->
      <div [class]="bodyClass">
        <!-- Signer colour bar -->
        <div
          *ngIf="signer"
          class="absolute left-0 top-0 h-full w-1"
          [style.background-color]="signer.color"
        ></div>

        <div class="flex min-w-0 flex-1 items-center gap-1.5 px-3">
          <span class="truncate text-[10px] font-medium text-[var(--psign-text)]">{{ field.label }}</span>
          <span *ngIf="field.required" class="shrink-0 text-[9px] font-semibold uppercase text-[var(--psign-danger)]">*</span>
        </div>

        <button
          *ngIf="mode === 'prepare' && isSelected"
          class="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-[var(--psign-danger)] text-white opacity-0 transition-opacity group-hover/chip:opacity-100 hover:opacity-100 focus-visible:outline-none"
          title="Remove field"
          (click)="$event.stopPropagation(); delete.emit(field.id)"
        >
          <svg class="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M2 2 L10 10 M10 2 L2 10"/>
          </svg>
        </button>
      </div>

      <!-- Resize handles -->
      <ng-container *ngIf="mode === 'prepare' && isSelected">
        <div
          *ngFor="let handle of handles"
          #handleEl
          [attr.data-resize-handle]="handle"
          [class]="'absolute h-2.5 w-2.5 rounded-full border-2 border-[var(--psign-primary)] bg-[var(--psign-surface)] z-10 ' + handlePositions[handle]"
        ></div>
      </ng-container>
    </div>
  `,
})
export class FieldChipComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) field!: FieldDef
  @Input() signers: SignerDef[] = []
  @Input() viewport: RenderPageResult['viewport'] | null = null
  @Input() dragEngine: DragEngine | null = null
  @Input() isSelected = false
  @Input() isComplete = false
  @Input() mode: 'prepare' | 'sign' | 'readonly' = 'prepare'

  @Output() select = new EventEmitter<string>()
  @Output() delete = new EventEmitter<string>()

  @ViewChild('chipEl') chipElRef?: ElementRef<HTMLElement>
  @ViewChildren('handleEl') handleElRefs!: QueryList<ElementRef<HTMLElement>>

  readonly handles = HANDLES
  readonly handlePositions = HANDLE_POSITIONS

  private cleanupMove: (() => void) | null = null
  private cleanupHandles: Array<() => void> = []

  get overlayRect(): OverlayRect | null {
    if (!this.viewport) return null
    return pdfToOverlay(this.field.rect, this.viewport)
  }

  get signer(): SignerDef | undefined {
    return this.signers.find((s) => s.id === this.field.signerId)
  }

  get bodyClass(): string {
    const state = this.isComplete
      ? 'bg-[var(--psign-field-complete)]'
      : this.field.required
        ? 'bg-[var(--psign-field-required)]'
        : 'bg-[var(--psign-field-active)]'
    const border = this.isSelected
      ? 'border-[var(--psign-primary)]'
      : 'border-[var(--psign-border)]'
    return `relative flex h-full w-full items-center overflow-hidden rounded-[var(--psign-radius-sm)] border transition-all duration-100 ${border} ${state}`
  }

  getLiveRect = (): OverlayRect =>
    this.overlayRect ?? { x: 0, y: 0, width: 150, height: 40, page: 0 }

  ngAfterViewInit(): void {
    this.registerWithEngine()
    this.handleElRefs.changes.subscribe(() => this.registerWithEngine())
  }

  ngOnChanges(): void {
    if (this.chipElRef) this.registerWithEngine()
  }

  private registerWithEngine(): void {
    this.cleanupMove?.()
    this.cleanupHandles.forEach((fn) => fn())
    this.cleanupHandles = []

    if (!this.dragEngine || !this.chipElRef || this.mode !== 'prepare') return

    this.cleanupMove = this.dragEngine.registerField(
      this.chipElRef.nativeElement,
      this.field.id,
      this.getLiveRect,
    )

    const handles = this.handleElRefs.toArray()
    for (const ref of handles) {
      const el = ref.nativeElement
      const handle = el.dataset['resizeHandle'] as ResizeHandle
      if (!handle) continue
      this.cleanupHandles.push(
        this.dragEngine.registerResizeHandle(el, this.field.id, handle, this.getLiveRect),
      )
    }
  }

  ngOnDestroy(): void {
    this.cleanupMove?.()
    this.cleanupHandles.forEach((fn) => fn())
  }
}
