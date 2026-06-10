import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

type Tab = 'draw' | 'type' | 'upload'

const INK_COLOURS = [
  { value: '#1e293b', label: 'Black' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#991b1b', label: 'Red' },
]

const SIGNATURE_FONTS = [
  { family: 'Dancing Script',  googleName: 'Dancing+Script:wght@700' },
  { family: 'Pinyon Script',   googleName: 'Pinyon+Script' },
  { family: 'Great Vibes',     googleName: 'Great+Vibes' },
  { family: 'Sacramento',      googleName: 'Sacramento' },
  { family: 'Pacifico',        googleName: 'Pacifico' },
]

@Component({
  selector: 'pdf-signature-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--psign-overlay)]"
      role="dialog"
      aria-modal="true"
      (click)="onBackdropClick($event)"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-[var(--psign-radius-lg)] bg-[var(--psign-surface)]" style="box-shadow:0 20px 60px rgba(0,0,0,0.25)">

        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[var(--psign-border)] px-5 py-4">
          <h2 class="text-sm font-semibold text-[var(--psign-text)]">Add your signature</h2>
          <button class="flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)] text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)] transition-colors" (click)="cancel.emit()">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M3 3 L13 13 M13 3 L3 13"/>
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-[var(--psign-border)] px-5 py-3">
          <button *ngFor="let tab of tabs" [class]="tabClass(tab)" (click)="activeTab = tab">{{ tab }}</button>
        </div>

        <!-- Content -->
        <div class="px-5 py-4">

          <!-- Draw tab -->
          <div *ngIf="activeTab === 'draw'">
            <div
              class="overflow-hidden rounded-[var(--psign-radius)] border border-[var(--psign-border)] cursor-crosshair"
              [style.aspect-ratio]="fieldAspectRatio"
            >
              <canvas
                #drawCanvas
                class="block h-full w-full touch-none"
                [width]="canvasWidth"
                [height]="canvasHeight"
                style="width:100%;height:100%"
                (pointerdown)="onDrawPointerDown($event)"
                (pointermove)="onDrawPointerMove($event)"
                (pointerup)="onDrawPointerUp()"
                (pointercancel)="onDrawPointerUp()"
              ></canvas>
            </div>
            <div class="mt-3 flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-[var(--psign-text-muted)]">Ink</span>
                <button
                  *ngFor="let c of inkColours"
                  [title]="c.label"
                  [class]="inkSwatchClass(c.value)"
                  [style.background-color]="c.value"
                  (click)="inkColour = c.value"
                ></button>
              </div>
              <div class="flex flex-1 items-center gap-2">
                <span class="text-xs text-[var(--psign-text-muted)]">Weight</span>
                <input type="range" min="1" max="5" step="0.5" [(ngModel)]="strokeWeight"
                  class="h-1.5 flex-1 cursor-pointer rounded-full bg-[var(--psign-border)] accent-[var(--psign-primary)]"/>
              </div>
              <button class="text-xs text-[var(--psign-text-muted)] hover:text-[var(--psign-danger)] transition-colors" (click)="initCanvas()">Clear</button>
            </div>
            <p *ngIf="!hasStrokes" class="mt-2 text-center text-xs text-[var(--psign-text-muted)]">Draw your signature above</p>
          </div>

          <!-- Type tab -->
          <div *ngIf="activeTab === 'type'">
            <input
              type="text"
              [(ngModel)]="typedName"
              placeholder="Type your full name"
              maxlength="80"
              class="w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] bg-[var(--psign-surface)] px-3 py-2 text-sm text-[var(--psign-text)] placeholder:text-[var(--psign-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]"
            />
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button
                *ngFor="let font of signatureFonts"
                [class]="fontCardClass(font.family)"
                style="height:56px"
                (click)="selectedFont = font.family"
              >
                <span
                  class="block truncate text-[var(--psign-sig-ink)]"
                  [style.font-family]="\"'\" + font.family + \"', cursive\""
                  style="font-size:24px;line-height:56px"
                >{{ typedName || font.family }}</span>
              </button>
            </div>
            <p *ngIf="!fontsLoaded" class="mt-2 text-center text-xs text-[var(--psign-text-muted)]">Loading fonts…</p>
          </div>

          <!-- Upload tab -->
          <div *ngIf="activeTab === 'upload'">
            <div
              *ngIf="!uploadDataUrl"
              [class]="dropZoneClass"
              (click)="fileInput.click()"
              (dragover)="$event.preventDefault(); isDragOver = true"
              (dragleave)="isDragOver = false"
              (drop)="onDrop($event)"
            >
              <svg class="h-8 w-8 text-[var(--psign-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
              </svg>
              <div class="text-center">
                <p class="text-sm font-medium text-[var(--psign-text)]">Drop an image here</p>
                <p class="text-xs text-[var(--psign-text-muted)]">or click to browse — PNG, JPG, GIF, WebP</p>
              </div>
              <input #fileInput type="file" accept="image/*" class="sr-only" (change)="onFileInput($event)"/>
            </div>
            <div
              *ngIf="uploadDataUrl"
              class="relative overflow-hidden rounded-[var(--psign-radius)] border border-[var(--psign-border)]"
              [style.aspect-ratio]="fieldAspectRatio"
            >
              <img [src]="uploadDataUrl" alt="Signature preview" class="h-full w-full object-contain"/>
              <button
                class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--psign-danger)] text-white hover:opacity-90"
                (click)="clearUpload()"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" d="M2 2 L12 12 M12 2 L2 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 border-t border-[var(--psign-border)] px-5 py-3">
          <button
            class="rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] px-4 py-1.5 text-sm text-[var(--psign-text)] hover:bg-[var(--psign-surface-raised)] transition-colors"
            (click)="cancel.emit()"
          >Cancel</button>
          <button
            [disabled]="!canConfirm"
            class="rounded-[var(--psign-radius-sm)] bg-[var(--psign-primary)] px-4 py-1.5 text-sm font-medium text-[var(--psign-primary-fg)] transition-colors hover:bg-[var(--psign-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            (click)="doConfirm()"
          >Apply</button>
        </div>
      </div>
    </div>
  `,
})
export class SignatureModalComponent implements OnChanges {
  @Input() open = false
  @Input() fieldAspectRatio = 3.5

  // Output named 'confirm' — the method that triggers it is named 'doConfirm' to avoid collision
  @Output() confirm = new EventEmitter<string>()
  @Output() cancel = new EventEmitter<void>()

  @ViewChild('drawCanvas') drawCanvasRef?: ElementRef<HTMLCanvasElement>

  readonly tabs: Tab[] = ['draw', 'type', 'upload']
  readonly inkColours = INK_COLOURS
  readonly signatureFonts = SIGNATURE_FONTS

  activeTab: Tab = 'draw'
  hasStrokes = false
  inkColour = '#1e293b'
  strokeWeight = 2
  typedName = ''
  selectedFont = SIGNATURE_FONTS[0]!.family
  fontsLoaded = false
  uploadDataUrl: string | null = null
  isDragOver = false

  private isDrawing = false
  private points: Array<{ x: number; y: number }> = []
  private dpr = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1

  get canvasWidth(): number { return 500 * this.dpr }
  get canvasHeight(): number { return Math.round(500 / this.fieldAspectRatio) * this.dpr }

  get canConfirm(): boolean {
    if (this.activeTab === 'draw') return this.hasStrokes
    if (this.activeTab === 'type') return this.typedName.trim().length > 0
    return this.uploadDataUrl !== null
  }

  get dropZoneClass(): string {
    const base = 'flex flex-col items-center justify-center gap-3 rounded-[var(--psign-radius)] border-2 border-dashed py-10 transition-colors cursor-pointer'
    return this.isDragOver
      ? `${base} border-[var(--psign-primary)] bg-[var(--psign-field-active)]`
      : `${base} border-[var(--psign-border)] hover:border-[var(--psign-primary)]`
  }

  tabClass(tab: Tab): string {
    const base = 'rounded-full px-3.5 py-1 text-xs font-medium transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]'
    return this.activeTab === tab
      ? `${base} bg-[var(--psign-primary)] text-[var(--psign-primary-fg)]`
      : `${base} text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)]`
  }

  inkSwatchClass(colour: string): string {
    const base = 'h-5 w-5 rounded-full border-2 transition-all'
    return this.inkColour === colour
      ? `${base} border-[var(--psign-primary)] scale-110`
      : `${base} border-transparent hover:scale-105`
  }

  fontCardClass(family: string): string {
    const base = 'relative overflow-hidden rounded-[var(--psign-radius-sm)] border px-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]'
    return this.selectedFont === family
      ? `${base} border-[var(--psign-primary)] bg-[var(--psign-field-active)]`
      : `${base} border-[var(--psign-border)] hover:border-[var(--psign-primary)]`
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.activeTab = 'draw'
      this.typedName = ''
      this.selectedFont = SIGNATURE_FONTS[0]!.family
      this.uploadDataUrl = null
      this.hasStrokes = false
      setTimeout(() => this.initCanvas(), 0)
      void this.loadFonts()
    }
  }

  initCanvas(): void {
    const canvas = this.drawCanvasRef?.nativeElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#cbd5e1'
    for (let x = 12; x < canvas.width; x += 20) {
      for (let y = 12; y < canvas.height; y += 20) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
      }
    }
    this.hasStrokes = false
  }

  private async loadFonts(): Promise<void> {
    if (this.fontsLoaded || typeof document === 'undefined') return
    const families = SIGNATURE_FONTS.map((f) => f.googleName).join('&family=')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
    document.head.appendChild(link)
    await document.fonts.ready
    this.fontsLoaded = true
  }

  onDrawPointerDown(e: PointerEvent): void {
    e.preventDefault()
    const canvas = this.drawCanvasRef?.nativeElement
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    this.isDrawing = true
    const pt = this.getPoint(e)
    this.points = [pt]
    const ctx = canvas.getContext('2d')!
    ctx.beginPath(); ctx.moveTo(pt.x, pt.y)
  }

  onDrawPointerMove(e: PointerEvent): void {
    if (!this.isDrawing) return
    e.preventDefault()
    const canvas = this.drawCanvasRef?.nativeElement
    if (!canvas) return
    const pt = this.getPoint(e)
    this.points.push(pt)
    this.hasStrokes = true
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = this.inkColour
    ctx.lineWidth = this.strokeWeight * this.dpr
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    const pts = this.points
    if (pts.length < 3) { ctx.lineTo(pt.x, pt.y); ctx.stroke(); return }
    const p0 = pts[pts.length - 3]!, p1 = pts[pts.length - 2]!, p2 = pts[pts.length - 1]!
    ctx.beginPath()
    ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2)
    ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
    ctx.stroke()
  }

  onDrawPointerUp(): void {
    this.isDrawing = false
    this.points = []
  }

  private getPoint(e: PointerEvent): { x: number; y: number } {
    const canvas = this.drawCanvasRef!.nativeElement
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * this.dpr, y: (e.clientY - rect.top) * this.dpr }
  }

  async onFileInput(e: Event): Promise<void> {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    this.uploadDataUrl = await this.readFile(file)
  }

  async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault()
    this.isDragOver = false
    const file = e.dataTransfer?.files[0]
    if (!file?.type.startsWith('image/')) return
    this.uploadDataUrl = await this.readFile(file)
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = (ev) => resolve(ev.target?.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }

  clearUpload(): void { this.uploadDataUrl = null }

  doConfirm(): void {
    if (!this.canConfirm) return
    let dataUrl = ''
    if (this.activeTab === 'draw' && this.drawCanvasRef) {
      const canvas = this.drawCanvasRef.nativeElement
      const exp = document.createElement('canvas')
      exp.width = canvas.width; exp.height = canvas.height
      const ctx = exp.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, exp.width, exp.height)
      ctx.drawImage(canvas, 0, 0)
      dataUrl = exp.toDataURL('image/png')
    } else if (this.activeTab === 'type') {
      dataUrl = this.renderTyped()
    } else if (this.activeTab === 'upload' && this.uploadDataUrl) {
      dataUrl = this.uploadDataUrl
    }
    if (dataUrl) this.confirm.emit(dataUrl)
  }

  private renderTyped(): string {
    const c = document.createElement('canvas')
    const W = 500; const H = Math.round(W / this.fieldAspectRatio)
    c.width = W; c.height = H
    const ctx = c.getContext('2d')!
    const fs = Math.min(H * 0.65, 72)
    ctx.font = `${fs}px '${this.selectedFont}', cursive`
    ctx.fillStyle = this.inkColour
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
    ctx.fillText(this.typedName, W / 2, H / 2)
    return c.toDataURL('image/png')
  }

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.cancel.emit()
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.cancel.emit()
  }
}
