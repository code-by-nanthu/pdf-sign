import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import type { FieldDef, SignerDef } from '@pdf-sign/core'
import type { DragEngine, ZoomMode } from '@pdf-sign/core'
import { PdfRenderer, type RenderPageResult } from '@pdf-sign/core'
import { FieldOverlayComponent } from './field-overlay.component.js'

@Component({
  selector: 'pdf-viewer',
  standalone: true,
  imports: [CommonModule, FieldOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #containerEl
      class="relative flex flex-1 flex-col items-center overflow-auto bg-[var(--psign-canvas-bg)] p-6"
    >
      <!-- Empty state -->
      <div
        *ngIf="!pdfBytes"
        class="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--psign-text-muted)]"
      >
        <svg class="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-sm">No document loaded</p>
      </div>

      <!-- Canvas wrapper -->
      <div
        *ngIf="pdfBytes"
        class="relative shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
        [style.width]="canvasStyleWidth"
        [style.height]="canvasStyleHeight"
      >
        <canvas #canvasEl class="block"></canvas>
        <pdf-field-overlay
          [fields]="fields"
          [signers]="signers"
          [page]="currentPage"
          [viewport]="lastViewport"
          [dragEngine]="dragEngine"
          [selectedFieldId]="selectedFieldId"
          [mode]="mode"
          [completedFieldIds]="completedFieldIds"
          (fieldSelect)="fieldSelect.emit($event)"
          (fieldDelete)="fieldDelete.emit($event)"
        />
      </div>
    </div>
  `,
})
export class PdfViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pdfBytes: Uint8Array | null = null
  @Input() currentPage = 0
  @Input() fields: FieldDef[] = []
  @Input() signers: SignerDef[] = []
  @Input() dragEngine: DragEngine | null = null
  @Input() selectedFieldId: string | null = null
  @Input() mode: 'prepare' | 'sign' | 'readonly' = 'prepare'
  @Input() completedFieldIds: string[] = []

  @Output() pageCount = new EventEmitter<number>()
  @Output() viewportReady = new EventEmitter<RenderPageResult['viewport']>()
  @Output() fieldSelect = new EventEmitter<string>()
  @Output() fieldDelete = new EventEmitter<string>()
  @Output() zoomChange = new EventEmitter<number>()

  @ViewChild('canvasEl') canvasElRef?: ElementRef<HTMLCanvasElement>
  @ViewChild('containerEl') containerElRef?: ElementRef<HTMLElement>

  private renderer = new PdfRenderer({
    devicePixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1,
  })

  scale = 1
  isRendering = false
  lastViewport: RenderPageResult['viewport'] | null = null
  canvasStyleWidth = 'auto'
  canvasStyleHeight = 'auto'

  async ngAfterViewInit(): Promise<void> {
    if (this.pdfBytes) await this.loadAndRender()
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['pdfBytes'] && !changes['pdfBytes'].firstChange && this.canvasElRef) {
      await this.loadAndRender()
    } else if (changes['currentPage'] && !changes['currentPage'].firstChange && this.canvasElRef) {
      await this.render()
    }
  }

  private async loadAndRender(): Promise<void> {
    if (!this.pdfBytes || !this.canvasElRef) return
    const count = await this.renderer.load(this.pdfBytes)
    this.pageCount.emit(count)
    await this.render()
  }

  private async render(zoomMode?: ZoomMode): Promise<void> {
    const canvas = this.canvasElRef?.nativeElement
    if (!canvas) return
    const containerWidth = this.containerElRef?.nativeElement.clientWidth ?? 800
    const mode: ZoomMode = zoomMode ?? { type: 'fit-width', containerWidth }
    this.isRendering = true
    try {
      const result = await this.renderer.renderPage(this.currentPage, canvas, mode)
      this.scale = result.scale
      this.lastViewport = result.viewport
      this.canvasStyleWidth = canvas.style.width
      this.canvasStyleHeight = canvas.style.height
      this.viewportReady.emit(result.viewport)
      this.zoomChange.emit(result.scale)
    } finally {
      this.isRendering = false
    }
  }

  async zoomIn(): Promise<void> {
    const s = this.renderer.zoomIn()
    await this.render({ type: 'scale', value: s })
  }

  async zoomOut(): Promise<void> {
    const s = this.renderer.zoomOut()
    await this.render({ type: 'scale', value: s })
  }

  async fitWidth(): Promise<void> {
    const w = this.containerElRef?.nativeElement.clientWidth ?? 800
    await this.render({ type: 'fit-width', containerWidth: w })
  }

  async fitPage(): Promise<void> {
    const el = this.containerElRef?.nativeElement
    await this.render({
      type: 'fit-page',
      containerWidth: el?.clientWidth ?? 800,
      containerHeight: el?.clientHeight ?? 600,
    })
  }

  ngOnDestroy(): void {
    void this.renderer.destroy()
  }
}
