import type { FieldDef, PdfRect, FieldType } from '../types/index.js'
import { generateId } from '../utils/hash.js'
import { UndoRedoStack } from './history.js'

export interface FieldStoreState {
  fields: FieldDef[]
}

export interface AddFieldPayload {
  type: FieldType
  rect: PdfRect
  signerId: string | null
  label?: string
  required?: boolean
}

export interface UpdateFieldPayload {
  id: string
  changes: Partial<Omit<FieldDef, 'id'>>
}

/**
 * Manages the list of placed fields with undo/redo support.
 *
 * All mutating methods return the updated FieldDef[] so callers
 * (the controller) can emit the fields-changed event without an
 * extra getter call.
 *
 * The store is NOT reactive by itself — framework adapters subscribe
 * to the controller's event emitter to get notified of changes.
 */
export class FieldStore {
  private readonly history: UndoRedoStack<FieldStoreState>

  constructor(
    initialFields: FieldDef[] = [],
    undoCapacity = 50,
  ) {
    this.history = new UndoRedoStack<FieldStoreState>(undoCapacity)
    this.history.reset({ fields: initialFields })
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  get fields(): FieldDef[] {
    return this.history.currentState?.fields ?? []
  }

  get canUndo(): boolean {
    return this.history.canUndo
  }

  get canRedo(): boolean {
    return this.history.canRedo
  }

  /** All fields on a specific page (0-indexed). */
  fieldsOnPage(page: number): FieldDef[] {
    return this.fields.filter((f) => f.rect.page === page)
  }

  /** All fields assigned to a specific signer. */
  fieldsForSigner(signerId: string): FieldDef[] {
    return this.fields.filter((f) => f.signerId === signerId)
  }

  /** All fields with no signer assigned. */
  unassignedFields(): FieldDef[] {
    return this.fields.filter((f) => f.signerId === null)
  }

  getField(id: string): FieldDef | undefined {
    return this.fields.find((f) => f.id === id)
  }

  // ── Mutations (each commits to history) ───────────────────────────────────

  /**
   * Add a new field. Generates a stable UUID for it.
   * Returns the new FieldDef.
   */
  addField(payload: AddFieldPayload): FieldDef {
    const field: FieldDef = {
      id: generateId(),
      type: payload.type,
      rect: { ...payload.rect },
      signerId: payload.signerId,
      label: payload.label ?? payload.type,
      required: payload.required ?? false,
    }

    this.commitFields([...this.fields, field])
    return field
  }

  /**
   * Update one or more properties of an existing field.
   * Returns the updated FieldDef, or undefined if not found.
   */
  updateField(payload: UpdateFieldPayload): FieldDef | undefined {
    const index = this.fields.findIndex((f) => f.id === payload.id)
    if (index === -1) return undefined

    const updated: FieldDef = {
      ...this.fields[index]!,
      ...payload.changes,
      id: payload.id, // id is immutable
    }

    const next = [...this.fields]
    next[index] = updated
    this.commitFields(next)
    return updated
  }

  /**
   * Move a field to a new position on the same or different page.
   * Only updates rect — does not affect other properties.
   */
  moveField(id: string, newRect: PdfRect): FieldDef | undefined {
    return this.updateField({ id, changes: { rect: { ...newRect } } })
  }

  /**
   * Delete a field by ID.
   * Returns true if deleted, false if not found.
   */
  deleteField(id: string): boolean {
    const next = this.fields.filter((f) => f.id !== id)
    if (next.length === this.fields.length) return false
    this.commitFields(next)
    return true
  }

  /**
   * Delete all fields on a specific page.
   * Returns the number of fields deleted.
   */
  deleteFieldsOnPage(page: number): number {
    const before = this.fields.length
    const next = this.fields.filter((f) => f.rect.page !== page)
    this.commitFields(next)
    return before - next.length
  }

  /**
   * Reassign all fields currently assigned to fromSignerId to toSignerId.
   * Used when a signer is removed or replaced.
   */
  reassignFields(fromSignerId: string, toSignerId: string | null): void {
    const next = this.fields.map((f) =>
      f.signerId === fromSignerId ? { ...f, signerId: toSignerId } : f,
    )
    this.commitFields(next)
  }

  /**
   * Replace the entire field list at once (e.g. when loading a saved template).
   * This resets undo history.
   */
  loadFields(fields: FieldDef[]): void {
    this.history.reset({ fields: fields.map((f) => ({ ...f })) })
  }

  /** Clear all fields and reset undo history. */
  clear(): void {
    this.history.reset({ fields: [] })
  }

  // ── Undo / Redo ────────────────────────────────────────────────────────────

  /** Returns the field list after undoing, or undefined if nothing to undo. */
  undo(): FieldDef[] | undefined {
    const state = this.history.undo()
    return state?.fields
  }

  /** Returns the field list after redoing, or undefined if nothing to redo. */
  redo(): FieldDef[] | undefined {
    const state = this.history.redo()
    return state?.fields
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private commitFields(fields: FieldDef[]): void {
    this.history.commit({ fields })
  }
}
