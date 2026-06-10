import type {
  DragEngineOptions,
  DragEngineEventKey,
  DragEngineEventPayload,
  DragEngineListener,
  DragState,
  FieldMoveDragState,
  FieldResizeDragState,
  PaletteDragState,
  ResizeHandle,
} from './types.js'
import { MIN_FIELD_SIZE_PX } from './types.js'
import type { OverlayRect } from '../types/index.js'

/**
 * DragEngine
 *
 * Handles all pointer-based drag interactions for the PDF sign overlay.
 * Built entirely on the Pointer Events API — no interact.js, no jQuery.
 *
 * Three interaction types:
 *  1. Palette drag  — drag a field type from the palette onto the canvas
 *  2. Field move    — drag a placed field chip to a new position
 *  3. Field resize  — drag a resize handle to change field dimensions
 *
 * Usage:
 *   const engine = new DragEngine({ gridSize: 0 })
 *
 *   // Register the canvas overlay as the drop target for palette drags
 *   engine.registerOverlay(overlayEl, page)
 *
 *   // Register a palette item as draggable
 *   engine.registerPaletteItem(chipEl, 'signature')
 *
 *   // Register a placed field as moveable
 *   engine.registerField(fieldEl, fieldId, currentOverlayRect)
 *
 *   // Register a resize handle on a placed field
 *   engine.registerResizeHandle(handleEl, fieldId, 'se', currentOverlayRect)
 *
 *   // Listen for results
 *   engine.on('palette-drop', ({ fieldTypeId, overlayX, overlayY, page }) => {
 *     const rect = controller.addField({ type: fieldTypeId, ... })
 *   })
 *   engine.on('field-move-commit', ({ fieldId, rect }) => {
 *     controller.moveField(fieldId, coordMapper.overlayToPdf(rect))
 *   })
 *   engine.on('field-resize-commit', ({ fieldId, rect }) => {
 *     controller.updateField({ id: fieldId, changes: { rect: coordMapper.overlayToPdf(rect) } })
 *   })
 *
 *   // Cleanup (call when component unmounts)
 *   engine.destroy()
 */
export class DragEngine {
  private readonly gridSize: number
  private readonly dragThreshold: number
  private dragState: DragState = null

  // Event emitter internals
  private readonly listeners = new Map<
    DragEngineEventKey,
    Set<DragEngineListener<DragEngineEventKey>>
  >()

  // Registered overlays: overlay element → page index
  private readonly overlays = new Map<HTMLElement, number>()

  // Cleanup callbacks for all registered elements
  private readonly cleanups: Array<() => void> = []

  // Live rect getters for registered fields — updated by the framework
  // adapter whenever the field rect changes (e.g. after a move commit)
  private readonly fieldRects = new Map<string, () => OverlayRect>()

  constructor(options: DragEngineOptions = {}) {
    this.gridSize = options.gridSize ?? 0
    this.dragThreshold = options.dragThreshold ?? 4
  }

  // ── Event emitter ─────────────────────────────────────────────────────────

  on<K extends DragEngineEventKey>(
    event: K,
    listener: DragEngineListener<K>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)! as Set<DragEngineListener<K>>
    set.add(listener)
    return () => set.delete(listener)
  }

  off<K extends DragEngineEventKey>(
    event: K,
    listener: DragEngineListener<K>,
  ): void {
    const set = this.listeners.get(event) as Set<DragEngineListener<K>> | undefined
    set?.delete(listener)
  }

  private emit<K extends DragEngineEventKey>(
    event: K,
    payload: DragEngineEventPayload<K>,
  ): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of set) {
      ;(listener as DragEngineListener<K>)(payload)
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Register an overlay element as a drop target for palette drags.
   * Call once per page canvas overlay.
   *
   * @param el   - The overlay div that sits on top of the pdf.js canvas
   * @param page - The 0-indexed page this overlay represents
   */
  registerOverlay(el: HTMLElement, page: number): () => void {
    this.overlays.set(el, page)

    const onPointerMove = (e: PointerEvent) => this.handleOverlayPointerMove(e, el)
    const onPointerUp = (e: PointerEvent) => this.handleOverlayPointerUp(e, el)

    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    const cleanup = () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      this.overlays.delete(el)
    }
    this.cleanups.push(cleanup)
    return cleanup
  }

  /**
   * Register a palette chip as a drag source.
   * Attaches pointerdown to start a palette drag.
   *
   * @param el          - The draggable chip element in the palette
   * @param fieldTypeId - The field type id this chip represents
   */
  registerPaletteItem(el: HTMLElement, fieldTypeId: string): () => void {
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      this.dragState = {
        kind: 'palette',
        fieldTypeId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        phase: 'pending',
        page: 0,
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    const cleanup = () => el.removeEventListener('pointerdown', onPointerDown)
    this.cleanups.push(cleanup)
    return cleanup
  }

  /**
   * Register a placed field element as moveable.
   * Attaches pointerdown to start a field-move drag.
   *
   * @param el      - The field chip element in the overlay
   * @param fieldId - The field's stable ID
   * @param getRect - A function that returns the field's current OverlayRect.
   *                  Called at drag-start so the origin rect is always fresh.
   */
  registerField(
    el: HTMLElement,
    fieldId: string,
    getRect: () => OverlayRect,
  ): () => void {
    this.fieldRects.set(fieldId, getRect)

    const onPointerDown = (e: PointerEvent) => {
      // Don't start a move drag if the user clicked a resize handle
      if ((e.target as HTMLElement).dataset['resizeHandle']) return
      e.preventDefault()
      e.stopPropagation()

      el.setPointerCapture(e.pointerId)

      this.dragState = {
        kind: 'field-move',
        fieldId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originRect: { ...getRect() },
        phase: 'pending',
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (
        !this.dragState ||
        this.dragState.kind !== 'field-move' ||
        this.dragState.fieldId !== fieldId ||
        this.dragState.pointerId !== e.pointerId
      ) return

      const state = this.dragState as FieldMoveDragState
      const dx = e.clientX - state.startX
      const dy = e.clientY - state.startY

      if (state.phase === 'pending') {
        if (Math.hypot(dx, dy) < this.dragThreshold) return
        state.phase = 'dragging'
      }

      const newRect = this.applyMove(state.originRect, dx, dy)
      this.emit('field-move', { fieldId, rect: newRect })
    }

    const onPointerUp = (e: PointerEvent) => {
      if (
        !this.dragState ||
        this.dragState.kind !== 'field-move' ||
        this.dragState.fieldId !== fieldId ||
        this.dragState.pointerId !== e.pointerId
      ) return

      const state = this.dragState as FieldMoveDragState
      if (state.phase === 'dragging') {
        const dx = e.clientX - state.startX
        const dy = e.clientY - state.startY
        const finalRect = this.applyMove(state.originRect, dx, dy)
        this.emit('field-move-commit', { fieldId, rect: finalRect })
      }

      this.dragState = null
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    const cleanup = () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      this.fieldRects.delete(fieldId)
    }
    this.cleanups.push(cleanup)
    return cleanup
  }

  /**
   * Register a resize handle element on a placed field.
   *
   * @param el      - The handle element (one of 8 per field)
   * @param fieldId - The field's stable ID
   * @param handle  - Which handle position: 'n'|'s'|'e'|'w'|'nw'|'ne'|'sw'|'se'
   * @param getRect - A function that returns the field's current OverlayRect
   */
  registerResizeHandle(
    el: HTMLElement,
    fieldId: string,
    handle: ResizeHandle,
    getRect: () => OverlayRect,
  ): () => void {
    // Mark the element so the field's pointerdown handler ignores it
    el.dataset['resizeHandle'] = handle

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()

      el.setPointerCapture(e.pointerId)

      this.dragState = {
        kind: 'field-resize',
        fieldId,
        handle,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originRect: { ...getRect() },
        phase: 'pending',
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (
        !this.dragState ||
        this.dragState.kind !== 'field-resize' ||
        this.dragState.fieldId !== fieldId ||
        this.dragState.pointerId !== e.pointerId
      ) return

      const state = this.dragState as FieldResizeDragState
      const dx = e.clientX - state.startX
      const dy = e.clientY - state.startY

      if (state.phase === 'pending') {
        if (Math.hypot(dx, dy) < this.dragThreshold) return
        state.phase = 'dragging'
      }

      const newRect = this.applyResize(state.originRect, state.handle, dx, dy)
      this.emit('field-resize', { fieldId, handle, rect: newRect })
    }

    const onPointerUp = (e: PointerEvent) => {
      if (
        !this.dragState ||
        this.dragState.kind !== 'field-resize' ||
        this.dragState.fieldId !== fieldId ||
        this.dragState.pointerId !== e.pointerId
      ) return

      const state = this.dragState as FieldResizeDragState
      if (state.phase === 'dragging') {
        const dx = e.clientX - state.startX
        const dy = e.clientY - state.startY
        const finalRect = this.applyResize(state.originRect, state.handle, dx, dy)
        this.emit('field-resize-commit', { fieldId, handle, rect: finalRect })
      }

      this.dragState = null
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    const cleanup = () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
    this.cleanups.push(cleanup)
    return cleanup
  }

  // ── Overlay handlers (palette drop) ───────────────────────────────────────

  private handleOverlayPointerMove(e: PointerEvent, overlayEl: HTMLElement): void {
    if (!this.dragState || this.dragState.kind !== 'palette') return
    const state = this.dragState as PaletteDragState

    if (state.phase === 'pending') {
      const dx = e.clientX - state.startX
      const dy = e.clientY - state.startY
      if (Math.hypot(dx, dy) < this.dragThreshold) return
      state.phase = 'dragging'
    }

    // Update the page the pointer is currently over
    const page = this.overlays.get(overlayEl) ?? 0
    state.page = page
  }

  private handleOverlayPointerUp(e: PointerEvent, overlayEl: HTMLElement): void {
    if (!this.dragState || this.dragState.kind !== 'palette') return
    const state = this.dragState as PaletteDragState

    if (state.phase !== 'dragging') {
      this.dragState = null
      return
    }

    const page = this.overlays.get(overlayEl) ?? 0
    const overlayRect = overlayEl.getBoundingClientRect()
    const rawX = e.clientX - overlayRect.left
    const rawY = e.clientY - overlayRect.top

    const overlayX = this.snap(rawX)
    const overlayY = this.snap(rawY)

    this.emit('palette-drop', {
      fieldTypeId: state.fieldTypeId,
      overlayX,
      overlayY,
      page,
    })

    this.dragState = null
  }

  // ── Geometry helpers ──────────────────────────────────────────────────────

  /**
   * Apply a move delta to a rect. Snaps to grid if configured.
   * Does NOT clamp to page bounds — that is done in PDF-space by the
   * caller after converting with the coord mapper.
   */
  private applyMove(origin: OverlayRect, dx: number, dy: number): OverlayRect {
    return {
      ...origin,
      x: this.snap(origin.x + dx),
      y: this.snap(origin.y + dy),
    }
  }

  /**
   * Apply a resize delta to a rect based on which handle is being dragged.
   *
   * Handle semantics:
   *  n  — moves top edge up/down (changes y and height)
   *  s  — moves bottom edge up/down (changes height only)
   *  e  — moves right edge left/right (changes width only)
   *  w  — moves left edge left/right (changes x and width)
   *  nw — combines n + w
   *  ne — combines n + e
   *  sw — combines s + w
   *  se — combines s + e
   *
   * Width and height are clamped to MIN_FIELD_SIZE_PX.
   */
  private applyResize(
    origin: OverlayRect,
    handle: ResizeHandle,
    dx: number,
    dy: number,
  ): OverlayRect {
    let { x, y, width, height, page } = origin

    const movesTop    = handle === 'n' || handle === 'nw' || handle === 'ne'
    const movesBottom = handle === 's' || handle === 'sw' || handle === 'se'
    const movesLeft   = handle === 'w' || handle === 'nw' || handle === 'sw'
    const movesRight  = handle === 'e' || handle === 'ne' || handle === 'se'

    if (movesTop) {
      const newHeight = Math.max(MIN_FIELD_SIZE_PX, height - dy)
      y = y + (height - newHeight)
      height = newHeight
    }

    if (movesBottom) {
      height = Math.max(MIN_FIELD_SIZE_PX, height + dy)
    }

    if (movesLeft) {
      const newWidth = Math.max(MIN_FIELD_SIZE_PX, width - dx)
      x = x + (width - newWidth)
      width = newWidth
    }

    if (movesRight) {
      width = Math.max(MIN_FIELD_SIZE_PX, width + dx)
    }

    return {
      x: this.snap(x),
      y: this.snap(y),
      width: this.snap(width),
      height: this.snap(height),
      page,
    }
  }

  /**
   * Snap a value to the nearest grid point.
   * Returns the value unchanged when gridSize is 0.
   */
  private snap(value: number): number {
    if (!this.gridSize) return value
    return Math.round(value / this.gridSize) * this.gridSize
  }

  // ── State inspection (for tests) ──────────────────────────────────────────

  /** The current drag state. Exposed for testing; treat as read-only. */
  get _dragState(): DragState {
    return this.dragState
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  /**
   * Cancel any in-progress drag and remove all event listeners.
   * Call when the component unmounts.
   */
  destroy(): void {
    this.dragState = null
    for (const cleanup of this.cleanups) {
      cleanup()
    }
    this.cleanups.length = 0
    this.listeners.clear()
    this.overlays.clear()
    this.fieldRects.clear()
  }
}
