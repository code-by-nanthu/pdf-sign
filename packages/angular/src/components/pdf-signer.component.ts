import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import type {
  PdfSignOptions,
  FieldDef,
  SignerDef,
  PdfTemplate,
  SigningResult,
  ThemeTokens,
} from '@pdf-sign/core'
import {
  injectTheme,
  removeTheme,
  overlayToPdf,
  overlayDimensionsToPdf,
  clampToPdfPage,
  DragEngine,
  PdfExporter,
  initialisePdfWorker,
} from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import { PdfSignService } from '../services/pdf-sign.service.js'
import { ToolbarComponent } from './toolbar.component.js'
import { PdfViewerComponent } from './pdf-viewer.component.js'
import { FieldPaletteComponent } from './field-palette.component.js'
import { FieldPropertiesPanelComponent } from './field-properties-panel.component.js'
import { SignatureModalComponent } from './signature-modal.component.js'

@Component({
  selector: 'pdf-signer',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarComponent,
    PdfViewerComponent,
    FieldPaletteComponent,
    FieldPropertiesPanelComponent,
    SignatureModalComponent,
  ],
  providers: [PdfSignService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #rootEl
      class="pdf-sign-root flex h-full w-full flex-col overflow-hidden"
      data-pdf-sign
    >
      <!-- Toolbar -->
      <pdf-toolbar
        [currentPage]="currentPage"
        [totalPages]="svc.pageCount()"
        [scale]="viewerRef?.scale ?? 1"
        [canUndo]="svc.canUndo()"
        [canRedo]="svc.canRedo()"
        [isRendering]="viewerRef?.isRendering ?? false"
        [mode]="mode"
        [signers]="svc.signers()"
        [activeSignerId]="activeSignerIdForPalette"
        (prevPage)="prevPage()"
        (nextPage)="nextPage()"
        (zoomIn)="viewerRef?.zoomIn()"
        (zoomOut)="viewerRef?.zoomOut()"
        (fitWidth)="viewerRef?.fitWidth()"
        (undo)="svc.undo()"
        (redo)="svc.redo()"
        (save)="onSave()"
        (submitDoc)="onSubmit()"
      >
        <ng-content select="[toolbar-extra]" ngProjectAs="[toolbar-extra]"></ng-content>
      </pdf-toolbar>

      <!-- Main body -->
      <div class="flex min-h-0 flex-1 overflow-hidden">
        <!-- Palette -->
        <pdf-field-palette
          *ngIf="mode === 'prepare'"
          [signers]="svc.signers()"
          [activeSignerId]="activeSignerIdForPalette"
          [dragEngine]="dragEngine"
          (signerChange)="activeSignerIdForPalette = $event"
        />

        <!-- Viewer -->
        <pdf-viewer
          #viewerRef
          [pdfBytes]="svc.controller.pdfBytes"
          [currentPage]="currentPage"
          [fields]="svc.fields()"
          [signers]="svc.signers()"
          [dragEngine]="dragEngine"
          [selectedFieldId]="selectedFieldId"
          [mode]="mode"
          [completedFieldIds]="completedFieldIds"
          (pageCount)="svc.setPageCount($event)"
          (viewportReady)="onViewportReady($event)"
          (fieldSelect)="onFieldSelect($event)"
          (fieldDelete)="onFieldDelete($event)"
        />

        <!-- Properties panel -->
        <pdf-field-properties
          *ngIf="mode === 'prepare'"
          [field]="selectedField"
          [signers]="svc.signers()"
          (update)="svc.updateField({ id: $event.id, changes: $event.changes })"
          (delete)="onFieldDelete($event)"
          (close)="selectedFieldId = null"
        />

        <!-- Sign mode side panel -->
        <div
          *ngIf="mode === 'sign'"
          class="flex w-60 shrink-0 flex-col border-l border-[var(--psign-border)] bg-[var(--psign-palette-bg)] p-4"
        >
          <div class="mb-4">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-xs font-medium text-[var(--psign-text)]">Progress</span>
              <span class="text-xs text-[var(--psign-text-muted)]">{{ progressPct }}%</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--psign-border)]">
              <div
                class="h-full rounded-full bg-[var(--psign-primary)] transition-all duration-300"
                [style.width.%]="progressPct"
              ></div>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto">
            <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--psign-text-muted)]">Fields to complete</p>
            <div
              *ngFor="let field of pendingFieldsList"
              [class]="pendingFieldClass(field)"
              (click)="currentPage = field.rect.page; onFieldSelect(field.id)"
            >
              <span class="font-medium text-[var(--psign-text)]">{{ field.label }}</span>
              <span *ngIf="field.required" class="ml-1 text-[var(--psign-danger)]">*</span>
              <span class="ml-1 text-[var(--psign-text-muted)]">p.{{ field.rect.page + 1 }}</span>
            </div>
            <p *ngIf="pendingFieldsList.length === 0" class="text-xs text-[var(--psign-success)]">
              All fields complete ✓
            </p>
          </div>
          <button
            class="mt-4 rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] py-2 text-xs text-[var(--psign-danger)] transition-colors hover:bg-[var(--psign-field-required)]"
            (click)="onDecline()"
          >Decline to sign</button>
        </div>
      </div>

      <!-- Loading overlay -->
      <div
        *ngIf="svc.isLoading()"
        class="absolute inset-0 flex items-center justify-center bg-[var(--psign-overlay)]"
        style="z-index:200"
      >
        <div class="flex flex-col items-center gap-3">
          <svg class="h-8 w-8 animate-spin text-[var(--psign-primary)]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p class="text-sm font-medium text-[var(--psign-surface)]">Loading document…</p>
        </div>
      </div>

      <!-- Error overlay -->
      <div
        *ngIf="svc.hasError()"
        class="absolute inset-0 flex items-center justify-center bg-[var(--psign-canvas-bg)]"
      >
        <div class="max-w-sm text-center">
          <p class="mb-1 font-medium text-[var(--psign-danger)]">Failed to load document</p>
          <p class="text-sm text-[var(--psign-text-muted)]">Check that the file is a valid PDF and try again.</p>
        </div>
      </div>

      <!-- Signature modal -->
      <pdf-signature-modal
        [open]="showSignatureModal"
        (confirm)="onSignatureConfirm($event)"
        (cancel)="showSignatureModal = false; pendingSignatureFieldId = null"
      />

      <ng-content></ng-content>
    </div>
  `,
})
export class PdfSignerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pdf: PdfSignOptions['pdf'] = null
  @Input() mode: PdfSignOptions['mode'] = 'prepare'
  @Input() template?: PdfTemplate
  @Input() signerId?: string
  @Input() signers?: SignerDef[]
  @Input() theme?: Partial<ThemeTokens>
  @Input() includeAuditPage = true
  @Input() snapGrid = 0

  @Output() templateReady = new EventEmitter<PdfTemplate>()
  @Output() fieldsChanged = new EventEmitter<FieldDef[]>()
  @Output() signingComplete = new EventEmitter<SigningResult>()
  @Output() declined = new EventEmitter<{ signerId: string; reason: string; timestamp: string }>()
  @Output() exportReady = new EventEmitter<{ pdfBytes: Uint8Array; filename: string }>()
  @Output() error = new EventEmitter<{ message: string; cause?: unknown }>()

  @ViewChild('rootEl') rootElRef?: ElementRef<HTMLElement>
  @ViewChild('viewerRef') viewerRef?: PdfViewerComponent

  readonly svc = inject(PdfSignService)

  currentPage = 0
  selectedFieldId: string | null = null
  activeSignerIdForPalette: string | null = null
  viewport: RenderPageResult['viewport'] | null = null
  showSignatureModal = false
  pendingSignatureFieldId: string | null = null
  completedFieldIds: string[] = []

  dragEngine!: DragEngine
  private dragCleanups: Array<() => void> = []

  get selectedField(): FieldDef | null {
    return this.svc.fields().find((f) => f.id === this.selectedFieldId) ?? null
  }

  get progressPct(): number {
    return Math.round(this.svc.signingProgress() * 100)
  }

  get pendingFieldsList(): FieldDef[] {
    return this.svc.pendingFields()
  }

  pendingFieldClass(field: FieldDef): string {
    const base = 'mb-1 rounded-[var(--psign-radius-sm)] border px-3 py-2 text-xs border-[var(--psign-border)] bg-[var(--psign-surface)] cursor-pointer transition-colors hover:bg-[var(--psign-surface-raised)]'
    return field.required ? `${base} border-l-2 border-l-[var(--psign-danger)]` : base
  }

  ngOnInit(): void {
    initialisePdfWorker()

    this.dragEngine = new DragEngine({ gridSize: this.snapGrid })
    this.activeSignerIdForPalette = this.signers?.[0]?.id ?? 'signer-1'

    this.svc.initialise({
      mode: this.mode,
      pdf: this.pdf,
      ...(this.template !== undefined && { template: this.template }),
      ...(this.signerId !== undefined && { signerId: this.signerId }),
      ...(this.signers !== undefined && { signers: this.signers }),
      includeAuditPage: this.includeAuditPage,
    })

    const ctrl = this.svc.controller
    this.dragCleanups.push(
      ctrl.events.on('fields-changed', ({ fields }) => this.fieldsChanged.emit(fields)),
      ctrl.events.on('template-ready', ({ template }) => this.templateReady.emit(template)),
      ctrl.events.on('signing-complete', (r) => this.signingComplete.emit(r)),
      ctrl.events.on('declined', (p) => this.declined.emit(p)),
      ctrl.events.on('export-ready', (p) => this.exportReady.emit(p)),
      ctrl.events.on('error', (p) => this.error.emit(p)),
    )

    this.dragCleanups.push(
      this.dragEngine.on('palette-drop', ({ fieldTypeId, overlayX, overlayY, page }) => {
        if (!this.viewport) return
        const DEFAULT: Record<string, { w: number; h: number }> = {
          signature: { w: 180, h: 60 }, initials: { w: 80, h: 40 },
          stamp: { w: 100, h: 100 }, checkbox: { w: 20, h: 20 },
          radio: { w: 16, h: 16 }, default: { w: 150, h: 36 },
        }
        const { w, h } = DEFAULT[fieldTypeId] ?? DEFAULT['default']!
        const vp = this.viewport
        const halfWPx = (w / vp.pdfNaturalWidth) * vp.cssWidth / 2
        const halfHPx = (h / vp.pdfNaturalHeight) * vp.cssHeight / 2
        const topLeft = overlayToPdf(overlayX - halfWPx, overlayY - halfHPx, page, vp)
        const { width, height } = overlayDimensionsToPdf(w, h, vp)
        const raw = { x: topLeft.x, y: topLeft.y - height, width, height, page }
        const clamped = clampToPdfPage(raw, vp)
        const field = this.svc.addField({ type: fieldTypeId, rect: clamped, signerId: this.activeSignerIdForPalette, required: false })
        this.selectedFieldId = field.id
        this.svc.startEditing()
      }),

      this.dragEngine.on('field-move-commit', ({ fieldId, rect }) => {
        if (!this.viewport) return
        const vp = this.viewport
        const tl = overlayToPdf(rect.x, rect.y, rect.page, vp)
        const { width, height } = overlayDimensionsToPdf(rect.width, rect.height, vp)
        this.svc.moveField(fieldId, clampToPdfPage({ x: tl.x, y: tl.y - height, width, height, page: rect.page }, vp))
      }),

      this.dragEngine.on('field-resize-commit', ({ fieldId, rect }) => {
        if (!this.viewport) return
        const vp = this.viewport
        const tl = overlayToPdf(rect.x, rect.y, rect.page, vp)
        const { width, height } = overlayDimensionsToPdf(rect.width, rect.height, vp)
        this.svc.updateField({ id: fieldId, changes: { rect: clampToPdfPage({ x: tl.x, y: tl.y - height, width, height, page: rect.page }, vp) } })
      }),
    )

    if (this.pdf) void this.svc.load()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['theme'] && this.rootElRef) {
      const el = this.rootElRef.nativeElement
      if (this.theme) injectTheme(el, this.theme)
      else removeTheme(el)
    }
    if (changes['pdf'] && !changes['pdf'].firstChange && this.pdf) {
      void this.svc.load()
    }
  }

  ngOnDestroy(): void {
    this.dragCleanups.forEach((fn) => fn())
    this.dragEngine.destroy()
  }

  onViewportReady(vp: RenderPageResult['viewport']): void {
    this.viewport = vp
  }

  onFieldSelect(fieldId: string): void {
    if (this.mode === 'prepare') {
      this.selectedFieldId = fieldId
    } else if (this.mode === 'sign') {
      const field = this.svc.fields().find((f) => f.id === fieldId)
      if (!field) return
      if (field.type === 'signature' || field.type === 'initials') {
        this.pendingSignatureFieldId = fieldId
        this.showSignatureModal = true
      }
    }
  }

  onFieldDelete(fieldId: string): void {
    this.svc.deleteField(fieldId)
    if (this.selectedFieldId === fieldId) this.selectedFieldId = null
  }

  onSignatureConfirm(dataUrl: string): void {
    if (!this.pendingSignatureFieldId) return
    this.svc.completeField(this.pendingSignatureFieldId, dataUrl)
    this.completedFieldIds = [...this.completedFieldIds, this.pendingSignatureFieldId]
    this.showSignatureModal = false
    this.pendingSignatureFieldId = null
  }

  async onSubmit(): Promise<void> {
    const ctrl = this.svc.controller
    if (!ctrl.pdfBytes) return
    try {
      const exporter = new PdfExporter()
      const tmpl = this.template ?? this.svc.buildTemplate()
      const { pdfBytes } = await exporter.export(
        ctrl.pdfBytes, tmpl,
        { template: tmpl, completedValues: ctrl.completedValues, auditTrail: [], completedAt: new Date().toISOString() },
        ctrl.completedValues,
        { includeAuditPage: this.includeAuditPage },
      )
      await this.svc.submit(pdfBytes)
    } catch (err) {
      this.error.emit({ message: err instanceof Error ? err.message : String(err), cause: err })
    }
  }

  onSave(): void {
    const t = this.svc.buildTemplate()
    this.templateReady.emit(t)
  }

  onDecline(): void {
    this.svc.decline()
    this.declined.emit({ signerId: this.svc.controller.activeSigner?.id ?? '', reason: '', timestamp: new Date().toISOString() })
  }

  prevPage(): void { if (this.currentPage > 0) this.currentPage-- }
  nextPage(): void { if (this.currentPage < this.svc.pageCount() - 1) this.currentPage++ }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const meta = e.metaKey || e.ctrlKey
    if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.svc.undo() }
    else if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this.svc.redo() }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedFieldId && this.mode === 'prepare') {
      e.preventDefault(); this.onFieldDelete(this.selectedFieldId)
    } else if (e.key === 'ArrowLeft') this.prevPage()
    else if (e.key === 'ArrowRight') this.nextPage()
  }
}
