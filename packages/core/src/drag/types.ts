import type { OverlayRect } from '../types/index.js'

// ── Drag interaction types ─────────────────────────────────────────────────

/**
 * Which resize handle the user grabbed.
 * Named by position: n/s (vertical), e/w (horizontal), corners combine both.
 */
export type ResizeHandle =
  | 'n'  // top edge
  | 's'  // bottom edge
  | 'e'  // right edge
  | 'w'  // left edge
  | 'nw' // top-left corner
  | 'ne' // top-right corner
  | 'sw' // bottom-left corner
  | 'se' // bottom-right corner

/**
 * The minimum field dimension in CSS pixels.
 * Resize operations will not shrink a field below this.
 */
export const MIN_FIELD_SIZE_PX = 20

// ── Event payloads ─────────────────────────────────────────────────────────

/** Fired when a palette item is dropped onto the canvas overlay. */
export interface PaletteDropEvent {
  /** The field type id registered with the palette item. */
  fieldTypeId: string
  /**
   * Drop position in overlay px (top-left origin, y increases down).
   * This is the centre of where the new field should be placed.
   */
  overlayX: number
  overlayY: number
  /** The page index (0-based) the drop occurred on. */
  page: number
}

/** Fired continuously while a placed field is being moved. */
export interface FieldMoveEvent {
  fieldId: string
  /** New overlay rect after the move (top-left origin). */
  rect: OverlayRect
}

/** Fired when a placed field move is committed (pointer up). */
export interface FieldMoveCommitEvent extends FieldMoveEvent {
  /** The overlay rect at the time the pointer was released. */
  rect: OverlayRect
}

/** Fired continuously while a field resize handle is being dragged. */
export interface FieldResizeEvent {
  fieldId: string
  handle: ResizeHandle
  /** New overlay rect after the resize (top-left origin). */
  rect: OverlayRect
}

/** Fired when a field resize is committed (pointer up). */
export interface FieldResizeCommitEvent extends FieldResizeEvent {
  rect: OverlayRect
}

// ── Drag engine event map ─────────────────────────────────────────────────

export interface DragEngineEvents {
  'palette-drop': PaletteDropEvent
  'field-move': FieldMoveEvent
  'field-move-commit': FieldMoveCommitEvent
  'field-resize': FieldResizeEvent
  'field-resize-commit': FieldResizeCommitEvent
}

export type DragEngineEventKey = keyof DragEngineEvents
export type DragEngineEventPayload<K extends DragEngineEventKey> =
  DragEngineEvents[K]
export type DragEngineListener<K extends DragEngineEventKey> = (
  payload: DragEngineEventPayload<K>,
) => void

// ── Drag engine options ────────────────────────────────────────────────────

export interface DragEngineOptions {
  /**
   * Snap drag positions to a grid of this size (in CSS px).
   * Set to 0 or undefined to disable snapping. Default: 0.
   */
  gridSize?: number
  /**
   * Minimum pointer movement in px before a drag is recognised.
   * Prevents accidental drags on click. Default: 4.
   */
  dragThreshold?: number
}

// ── Internal drag state ────────────────────────────────────────────────────

export type DragPhase = 'idle' | 'pending' | 'dragging'

export interface PaletteDragState {
  kind: 'palette'
  fieldTypeId: string
  pointerId: number
  startX: number  // client coords
  startY: number
  phase: DragPhase
  page: number
}

export interface FieldMoveDragState {
  kind: 'field-move'
  fieldId: string
  pointerId: number
  startX: number      // client coords at drag start
  startY: number
  originRect: OverlayRect  // field rect at drag start (overlay px)
  phase: DragPhase
}

export interface FieldResizeDragState {
  kind: 'field-resize'
  fieldId: string
  handle: ResizeHandle
  pointerId: number
  startX: number      // client coords at drag start
  startY: number
  originRect: OverlayRect  // field rect at drag start (overlay px)
  phase: DragPhase
}

export type DragState =
  | PaletteDragState
  | FieldMoveDragState
  | FieldResizeDragState
  | null
