/**
 * A fixed-capacity undo/redo stack.
 * Stores snapshots of type T. When capacity is exceeded the oldest
 * entry is evicted.
 *
 * Design: two stacks — past and future.
 * - commit(snapshot)  → push to past, clear future
 * - undo()            → pop from past, push to future, return new head
 * - redo()            → pop from future, push to past, return new head
 */
export class UndoRedoStack<T> {
  private past: T[] = []
  private future: T[] = []

  constructor(
    private readonly capacity: number = 50,
    private readonly clone: (state: T) => T = (s) => structuredClone(s),
  ) {}

  get canUndo(): boolean {
    return this.past.length > 1
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  get currentState(): T | undefined {
    return this.past[this.past.length - 1]
  }

  get historySize(): number {
    return this.past.length
  }

  /**
   * Commit a new state snapshot. Clears the redo stack.
   * The snapshot is cloned so later mutations don't corrupt history.
   */
  commit(state: T): void {
    this.past.push(this.clone(state))
    if (this.past.length > this.capacity) {
      this.past.shift()
    }
    this.future = []
  }

  /**
   * Undo: step back one state. Returns the new current state,
   * or undefined if undo is not possible.
   */
  undo(): T | undefined {
    if (!this.canUndo) return undefined
    const current = this.past.pop()!
    this.future.push(this.clone(current))
    return this.currentState
  }

  /**
   * Redo: step forward one state. Returns the new current state,
   * or undefined if redo is not possible.
   */
  redo(): T | undefined {
    if (!this.canRedo) return undefined
    const next = this.future.pop()!
    this.past.push(this.clone(next))
    return this.currentState
  }

  /** Reset to a single initial state, clearing all history. */
  reset(initialState: T): void {
    this.past = [this.clone(initialState)]
    this.future = []
  }

  /** Clear everything. */
  clear(): void {
    this.past = []
    this.future = []
  }
}
