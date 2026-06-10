import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import type { SignerDef } from '@pdf-sign/core'

@Component({
  selector: 'pdf-toolbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--psign-border)] bg-[var(--psign-toolbar-bg)] px-3">

      <!-- Undo/redo — prepare mode only -->
      <div *ngIf="mode === 'prepare'" class="flex items-center gap-0.5">
        <button [disabled]="!canUndo" [class]="btnClass" title="Undo (Ctrl+Z)" (click)="undo.emit()">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 L7 3.5 L7 6 Q11 6 11 10 Q11 13 7 13 L7 11 Q10 11 10 10 Q10 7.5 7 7.5 L7 10 Z"/>
          </svg>
        </button>
        <button [disabled]="!canRedo" [class]="btnClass" title="Redo (Ctrl+Y)" (click)="redo.emit()">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7.5 L9 3.5 L9 6 Q5 6 5 10 Q5 13 9 13 L9 11 Q6 11 6 10 Q6 7.5 9 7.5 L9 10 Z"/>
          </svg>
        </button>
        <div class="mx-1 h-5 w-px bg-[var(--psign-border)]"></div>
      </div>

      <!-- Page navigation -->
      <div class="flex items-center gap-1">
        <button [disabled]="currentPage === 0" [class]="btnClass" title="Previous page" (click)="prevPage.emit()">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 3 L6 8 L10 13"/>
          </svg>
        </button>
        <span class="min-w-[4.5rem] text-center text-xs text-[var(--psign-text-muted)]">
          {{ currentPage + 1 }} / {{ totalPages || 1 }}
        </span>
        <button [disabled]="currentPage >= totalPages - 1" [class]="btnClass" title="Next page" (click)="nextPage.emit()">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 3 L10 8 L6 13"/>
          </svg>
        </button>
      </div>

      <div class="mx-1 h-5 w-px bg-[var(--psign-border)]"></div>

      <!-- Zoom controls -->
      <div class="flex items-center gap-0.5">
        <button [class]="btnClass" title="Zoom out" (click)="zoomOut.emit()">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="4.5"/>
            <path stroke-linecap="round" d="M5 7 H9"/>
            <path stroke-linecap="round" d="M10.5 10.5 L13.5 13.5"/>
          </svg>
        </button>
        <span class="min-w-[3rem] text-center text-xs text-[var(--psign-text-muted)]">
          {{ formatScale(scale) }}
        </span>
        <button [class]="btnClass" title="Zoom in" (click)="zoomIn.emit()">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="4.5"/>
            <path stroke-linecap="round" d="M5 7 H9 M7 5 V9"/>
            <path stroke-linecap="round" d="M10.5 10.5 L13.5 13.5"/>
          </svg>
        </button>
        <button
          class="flex h-7 items-center rounded-[var(--psign-radius-sm)] px-2 text-xs text-[var(--psign-text-muted)] transition-colors hover:bg-[var(--psign-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
          (click)="fitWidth.emit()"
        >Fit</button>
      </div>

      <div class="flex-1"></div>

      <!-- Rendering indicator -->
      <div *ngIf="isRendering" class="flex items-center gap-1.5">
        <svg class="h-3.5 w-3.5 animate-spin text-[var(--psign-text-muted)]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <span class="text-xs text-[var(--psign-text-muted)]">Rendering…</span>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-1">
        <button
          *ngIf="mode === 'prepare'"
          class="flex h-7 items-center gap-1.5 rounded-[var(--psign-radius-sm)] bg-[var(--psign-primary)] px-3 text-xs font-medium text-[var(--psign-primary-fg)] transition-colors hover:bg-[var(--psign-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
          (click)="save.emit()"
        >Save template</button>
        <button
          *ngIf="mode === 'sign'"
          class="flex h-7 items-center gap-1.5 rounded-[var(--psign-radius-sm)] bg-[var(--psign-primary)] px-3 text-xs font-medium text-[var(--psign-primary-fg)] transition-colors hover:bg-[var(--psign-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
          (click)="submitDoc.emit()"
        >Submit signed</button>
        <ng-content select="[toolbar-extra]"></ng-content>
      </div>
    </header>
  `,
})
export class ToolbarComponent {
  @Input() currentPage = 0
  @Input() totalPages = 1
  @Input() scale = 1
  @Input() canUndo = false
  @Input() canRedo = false
  @Input() isRendering = false
  @Input() mode: 'prepare' | 'sign' | 'readonly' = 'prepare'
  @Input() signers: SignerDef[] = []
  @Input() activeSignerId: string | null = null

  @Output() prevPage = new EventEmitter<void>()
  @Output() nextPage = new EventEmitter<void>()
  @Output() zoomIn = new EventEmitter<void>()
  @Output() zoomOut = new EventEmitter<void>()
  @Output() fitWidth = new EventEmitter<void>()
  @Output() undo = new EventEmitter<void>()
  @Output() redo = new EventEmitter<void>()
  @Output() save = new EventEmitter<void>()
  @Output() submitDoc = new EventEmitter<void>()

  readonly btnClass =
    'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)] ' +
    'text-[var(--psign-text)] transition-colors ' +
    'hover:bg-[var(--psign-surface-raised)] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)] ' +
    'disabled:opacity-30 disabled:cursor-not-allowed'

  formatScale(s: number): string {
    return `${Math.round(s * 100)}%`
  }
}
