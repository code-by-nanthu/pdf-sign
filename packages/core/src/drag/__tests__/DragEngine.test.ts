import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DragEngine } from '../DragEngine.js'
import { MIN_FIELD_SIZE_PX } from '../types.js'
import type { OverlayRect } from '../../types/index.js'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeEl(boundingRect = { left: 0, top: 0, width: 595, height: 842 }): HTMLElement {
  const el = document.createElement('div')
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    ...boundingRect,
    right: boundingRect.left + boundingRect.width,
    bottom: boundingRect.top + boundingRect.height,
    x: boundingRect.left,
    y: boundingRect.top,
    toJSON: () => ({}),
  } as DOMRect)
  // jsdom does not implement setPointerCapture — stub it
  el.setPointerCapture = vi.fn()
  el.releasePointerCapture = vi.fn()
  return el
}

function pointerDown(el: HTMLElement, x: number, y: number, pointerId = 1): PointerEvent {
  const e = new PointerEvent('pointerdown', {
    bubbles: true, clientX: x, clientY: y, pointerId,
  })
  el.dispatchEvent(e)
  return e
}

function pointerMove(el: HTMLElement, x: number, y: number, pointerId = 1): PointerEvent {
  const e = new PointerEvent('pointermove', {
    bubbles: true, clientX: x, clientY: y, pointerId,
  })
  el.dispatchEvent(e)
  return e
}

function pointerUp(el: HTMLElement, x: number, y: number, pointerId = 1): PointerEvent {
  const e = new PointerEvent('pointerup', {
    bubbles: true, clientX: x, clientY: y, pointerId,
  })
  el.dispatchEvent(e)
  return e
}

const BASE_RECT: OverlayRect = { x: 100, y: 100, width: 150, height: 40, page: 0 }

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DragEngine', () => {
  let engine: DragEngine

  beforeEach(() => {
    engine = new DragEngine({ dragThreshold: 4 })
  })

  afterEach(() => {
    engine.destroy()
  })

  // ── Palette drag ──────────────────────────────────────────────────────────

  describe('palette drag', () => {
    it('emits palette-drop when dragged past threshold and released on overlay', () => {
      const overlay = makeEl({ left: 0, top: 0, width: 595, height: 842 })
      const chip = makeEl()
      engine.registerOverlay(overlay, 0)
      engine.registerPaletteItem(chip, 'signature')

      const handler = vi.fn()
      engine.on('palette-drop', handler)

      pointerDown(chip, 10, 10)
      // Move past threshold on overlay
      pointerMove(overlay, 20, 20)
      pointerUp(overlay, 200, 300)

      expect(handler).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldTypeId: 'signature',
          overlayX: 200,
          overlayY: 300,
          page: 0,
        }),
      )
    })

    it('does not emit palette-drop when not dragged past threshold', () => {
      const overlay = makeEl()
      const chip = makeEl()
      engine.registerOverlay(overlay, 0)
      engine.registerPaletteItem(chip, 'text')

      const handler = vi.fn()
      engine.on('palette-drop', handler)

      pointerDown(chip, 10, 10)
      // Move less than threshold (4px)
      pointerMove(overlay, 12, 12)
      pointerUp(overlay, 12, 12)

      expect(handler).not.toHaveBeenCalled()
    })

    it('calculates overlay coords relative to overlay element bounds', () => {
      // Overlay positioned at (100, 50) in the viewport
      const overlay = makeEl({ left: 100, top: 50, width: 595, height: 842 })
      const chip = makeEl()
      engine.registerOverlay(overlay, 0)
      engine.registerPaletteItem(chip, 'date-signed')

      const handler = vi.fn()
      engine.on('palette-drop', handler)

      pointerDown(chip, 10, 10)
      pointerMove(overlay, 350, 250)
      pointerUp(overlay, 350, 250)

      // overlayX = 350 - 100 = 250, overlayY = 250 - 50 = 200
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ overlayX: 250, overlayY: 200 }),
      )
    })

    it('assigns the correct page from the registered overlay', () => {
      const overlay = makeEl()
      const chip = makeEl()
      engine.registerOverlay(overlay, 2)
      engine.registerPaletteItem(chip, 'checkbox')

      const handler = vi.fn()
      engine.on('palette-drop', handler)

      pointerDown(chip, 10, 10)
      pointerMove(overlay, 50, 50)
      pointerUp(overlay, 50, 50)

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
    })

    it('snaps drop position to grid when gridSize is set', () => {
      const snappingEngine = new DragEngine({ gridSize: 10, dragThreshold: 4 })
      const overlay = makeEl()
      const chip = makeEl()
      snappingEngine.registerOverlay(overlay, 0)
      snappingEngine.registerPaletteItem(chip, 'text')

      const handler = vi.fn()
      snappingEngine.on('palette-drop', handler)

      pointerDown(chip, 10, 10)
      pointerMove(overlay, 50, 50)
      // Drop at 213, 317 → snapped to 210, 320
      pointerUp(overlay, 213, 317)

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ overlayX: 210, overlayY: 320 }),
      )

      snappingEngine.destroy()
    })
  })

  // ── Field move ────────────────────────────────────────────────────────────

  describe('field move', () => {
    it('emits field-move while dragging', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'field-1', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-move', handler)

      pointerDown(fieldEl, 100, 100)
      pointerMove(fieldEl, 110, 115)  // +10, +15 — past threshold

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: 'field-1',
          rect: expect.objectContaining({ x: 110, y: 115 }),
        }),
      )
    })

    it('emits field-move-commit on pointer up', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'field-1', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-move-commit', handler)

      pointerDown(fieldEl, 100, 100)
      pointerMove(fieldEl, 150, 160)
      pointerUp(fieldEl, 150, 160)

      expect(handler).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: 'field-1',
          rect: expect.objectContaining({ x: 150, y: 160 }),
        }),
      )
    })

    it('does not emit field-move-commit when below threshold', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'field-1', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-move-commit', handler)

      pointerDown(fieldEl, 100, 100)
      // Only 2px movement — below 4px threshold
      pointerMove(fieldEl, 101, 101)
      pointerUp(fieldEl, 101, 101)

      expect(handler).not.toHaveBeenCalled()
    })

    it('preserves width, height, and page in move result', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-move-commit', handler)

      pointerDown(fieldEl, 100, 100)
      pointerMove(fieldEl, 150, 160)
      pointerUp(fieldEl, 150, 160)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.width).toBe(BASE_RECT.width)
      expect(rect.height).toBe(BASE_RECT.height)
      expect(rect.page).toBe(BASE_RECT.page)
    })

    it('snaps move position to grid when gridSize is set', () => {
      const snappingEngine = new DragEngine({ gridSize: 10, dragThreshold: 4 })
      const fieldEl = makeEl()
      snappingEngine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      snappingEngine.on('field-move-commit', handler)

      // origin x=100, y=100. Move +13, +17 → raw 113,117 → snapped 110,120
      pointerDown(fieldEl, 0, 0)
      pointerMove(fieldEl, 13, 17)
      pointerUp(fieldEl, 13, 17)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.x).toBe(110)
      expect(rect.y).toBe(120)

      snappingEngine.destroy()
    })

    it('uses origin rect at the time of pointerdown, not at registration', () => {
      let currentRect = { ...BASE_RECT }
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'f', () => ({ ...currentRect }))

      // Simulate a prior move that updated the field's position
      currentRect = { ...BASE_RECT, x: 200, y: 200 }

      const handler = vi.fn()
      engine.on('field-move-commit', handler)

      // New drag from the updated position
      pointerDown(fieldEl, 0, 0)
      pointerMove(fieldEl, 10, 10)
      pointerUp(fieldEl, 20, 20)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      // x = 200 + 20, y = 200 + 20
      expect(rect.x).toBe(220)
      expect(rect.y).toBe(220)
    })

    it('clears drag state after commit', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      pointerDown(fieldEl, 0, 0)
      pointerMove(fieldEl, 10, 10)
      pointerUp(fieldEl, 10, 10)

      expect(engine._dragState).toBeNull()
    })
  })

  // ── Field resize ───────────────────────────────────────────────────────────

  describe('field resize', () => {
    it('se handle: increases width and height', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'se', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-resize-commit', handler)

      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, 20, 10)
      pointerUp(handleEl, 20, 10)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.width).toBe(170)   // 150 + 20
      expect(rect.height).toBe(50)   // 40 + 10
      expect(rect.x).toBe(BASE_RECT.x) // x unchanged for se
      expect(rect.y).toBe(BASE_RECT.y) // y unchanged for se
    })

    it('nw handle: moves origin and shrinks', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'nw', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-resize-commit', handler)

      // Drag +10, +10 (moving top-left corner down-right → shrink)
      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, 10, 10)
      pointerUp(handleEl, 10, 10)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.width).toBe(140)        // 150 - 10
      expect(rect.height).toBe(30)        // 40 - 10
      expect(rect.x).toBe(110)            // 100 + 10 (origin moved right)
      expect(rect.y).toBe(110)            // 100 + 10 (origin moved down)
    })

    it('n handle: changes y and height only, x and width unchanged', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'n', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-resize-commit', handler)

      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, 99, -10) // x movement should be ignored
      pointerUp(handleEl, 99, -10)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.x).toBe(BASE_RECT.x)
      expect(rect.width).toBe(BASE_RECT.width)
      expect(rect.height).toBe(50)          // 40 - (-10) = 50
      expect(rect.y).toBe(90)              // 100 - 10 (top edge moved up)
    })

    it('e handle: changes width only', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'e', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-resize-commit', handler)

      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, 30, 99) // y movement should be ignored
      pointerUp(handleEl, 30, 99)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.width).toBe(180)          // 150 + 30
      expect(rect.height).toBe(BASE_RECT.height)
      expect(rect.y).toBe(BASE_RECT.y)
    })

    it('enforces MIN_FIELD_SIZE_PX for width', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'e', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-resize-commit', handler)

      // Drag so far left that width would go negative
      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, -200, 0)
      pointerUp(handleEl, -200, 0)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.width).toBe(MIN_FIELD_SIZE_PX)
    })

    it('enforces MIN_FIELD_SIZE_PX for height', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 's', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-resize-commit', handler)

      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, 0, -200)
      pointerUp(handleEl, 0, -200)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.height).toBe(MIN_FIELD_SIZE_PX)
    })

    it('emits field-resize during drag (not just on commit)', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'se', () => ({ ...BASE_RECT }))

      const liveHandler = vi.fn()
      engine.on('field-resize', liveHandler)

      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, 20, 10)
      // No pointerup — live event only

      expect(liveHandler).toHaveBeenCalledOnce()
    })

    it('clears drag state after resize commit', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'se', () => ({ ...BASE_RECT }))

      pointerDown(handleEl, 0, 0)
      pointerMove(handleEl, 20, 10)
      pointerUp(handleEl, 20, 10)

      expect(engine._dragState).toBeNull()
    })

    it('marks handle element with data-resize-handle attribute', () => {
      const handleEl = makeEl()
      engine.registerResizeHandle(handleEl, 'f', 'nw', () => ({ ...BASE_RECT }))
      expect(handleEl.dataset['resizeHandle']).toBe('nw')
    })
  })

  // ── Event emitter ─────────────────────────────────────────────────────────

  describe('event emitter', () => {
    it('on() returns an unsubscribe function', () => {
      const overlay = makeEl()
      const chip = makeEl()
      engine.registerOverlay(overlay, 0)
      engine.registerPaletteItem(chip, 'text')

      const handler = vi.fn()
      const unsub = engine.on('palette-drop', handler)

      pointerDown(chip, 10, 10)
      pointerMove(overlay, 50, 50)
      pointerUp(overlay, 50, 50)
      expect(handler).toHaveBeenCalledOnce()

      // Unsubscribe and do it again
      unsub()
      pointerDown(chip, 10, 10)
      pointerMove(overlay, 80, 80)
      pointerUp(overlay, 80, 80)
      expect(handler).toHaveBeenCalledOnce() // still only once
    })

    it('multiple listeners on the same event all receive it', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      const h1 = vi.fn()
      const h2 = vi.fn()
      engine.on('field-move-commit', h1)
      engine.on('field-move-commit', h2)

      pointerDown(fieldEl, 0, 0)
      pointerMove(fieldEl, 20, 20)
      pointerUp(fieldEl, 20, 20)

      expect(h1).toHaveBeenCalledOnce()
      expect(h2).toHaveBeenCalledOnce()
    })
  })

  // ── Pointer ID isolation ───────────────────────────────────────────────────

  describe('pointer ID isolation', () => {
    it('ignores events from a different pointer ID', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      engine.on('field-move-commit', handler)

      pointerDown(fieldEl, 0, 0, 1)         // pointer 1 starts drag
      pointerMove(fieldEl, 20, 20, 2)        // pointer 2 — should be ignored
      pointerUp(fieldEl, 20, 20, 2)          // pointer 2 — should be ignored

      expect(handler).not.toHaveBeenCalled()
    })
  })

  // ── destroy() ─────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('removes all listeners', () => {
      const overlay = makeEl()
      const chip = makeEl()
      engine.registerOverlay(overlay, 0)
      engine.registerPaletteItem(chip, 'text')

      const handler = vi.fn()
      engine.on('palette-drop', handler)

      engine.destroy()

      pointerDown(chip, 10, 10)
      pointerMove(overlay, 50, 50)
      pointerUp(overlay, 50, 50)

      expect(handler).not.toHaveBeenCalled()
    })

    it('clears drag state', () => {
      const fieldEl = makeEl()
      engine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      pointerDown(fieldEl, 0, 0)
      pointerMove(fieldEl, 10, 10)
      engine.destroy()

      expect(engine._dragState).toBeNull()
    })

    it('is safe to call multiple times', () => {
      expect(() => {
        engine.destroy()
        engine.destroy()
      }).not.toThrow()
    })
  })

  // ── snap() (via grid) ─────────────────────────────────────────────────────

  describe('grid snapping', () => {
    it('rounds down to nearest grid point', () => {
      const snappingEngine = new DragEngine({ gridSize: 10, dragThreshold: 4 })
      const fieldEl = makeEl()
      snappingEngine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      snappingEngine.on('field-move-commit', handler)

      // origin x=100, move +4 → raw 104 → snapped to 100
      pointerDown(fieldEl, 0, 0)
      pointerMove(fieldEl, 4, 4)
      pointerUp(fieldEl, 4, 4)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.x).toBe(100)

      snappingEngine.destroy()
    })

    it('rounds up to nearest grid point', () => {
      const snappingEngine = new DragEngine({ gridSize: 10, dragThreshold: 4 })
      const fieldEl = makeEl()
      snappingEngine.registerField(fieldEl, 'f', () => ({ ...BASE_RECT }))

      const handler = vi.fn()
      snappingEngine.on('field-move-commit', handler)

      // origin x=100, move +6 → raw 106 → snapped to 110
      pointerDown(fieldEl, 0, 0)
      pointerMove(fieldEl, 6, 6)
      pointerUp(fieldEl, 6, 6)

      const rect: OverlayRect = handler.mock.calls[0][0].rect
      expect(rect.x).toBe(110)

      snappingEngine.destroy()
    })
  })
})
