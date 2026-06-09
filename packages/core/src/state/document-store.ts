import type { DocumentState } from '../types/index.js'

/**
 * Valid state transitions.
 * Key = current state, Value = set of states reachable from it.
 */
const TRANSITIONS: Record<DocumentState, DocumentState[]> = {
  idle:       ['loading'],
  loading:    ['ready', 'error'],
  ready:      ['editing', 'signing', 'idle'],
  editing:    ['ready', 'signing', 'submitting', 'idle'],
  signing:    ['complete', 'idle', 'error'],
  complete:   ['submitting', 'signing', 'idle'],
  submitting: ['done', 'error'],
  done:       ['idle'],
  error:      ['idle', 'loading'],
}

/**
 * Tracks the document's lifecycle state and enforces valid transitions.
 *
 * Provides a typed history of transitions for debugging and
 * the 'state-changed' event payload.
 */
export class DocumentStore {
  private _state: DocumentState = 'idle'
  private _history: Array<{ from: DocumentState; to: DocumentState; at: string }> = []

  get state(): DocumentState {
    return this._state
  }

  /** Full transition history — useful for debugging. */
  get transitionHistory(): ReadonlyArray<{ from: DocumentState; to: DocumentState; at: string }> {
    return this._history
  }

  /**
   * Transition to a new state.
   * Throws if the transition is not valid from the current state.
   * Returns the previous state so the controller can emit state-changed.
   */
  transition(to: DocumentState): DocumentState {
    const allowed = TRANSITIONS[this._state]
    if (!allowed.includes(to)) {
      throw new Error(
        `[pdf-sign/core] Invalid state transition: "${this._state}" → "${to}". ` +
        `Allowed: ${allowed.join(', ')}`,
      )
    }

    const from = this._state
    this._state = to
    this._history.push({ from, to, at: new Date().toISOString() })
    return from
  }

  /**
   * Attempt a transition without throwing.
   * Returns { success: true, from } on success, { success: false } if invalid.
   */
  tryTransition(to: DocumentState): { success: true; from: DocumentState } | { success: false } {
    const allowed = TRANSITIONS[this._state]
    if (!allowed.includes(to)) return { success: false }
    const from = this.transition(to)
    return { success: true, from }
  }

  /** Whether the document is in any of the given states. */
  is(...states: DocumentState[]): boolean {
    return states.includes(this._state)
  }

  /** Whether the document is in a state where the user can interact. */
  get isInteractive(): boolean {
    return this.is('editing', 'signing', 'complete')
  }

  /** Whether a PDF is currently loaded (any non-idle, non-error state). */
  get hasDocument(): boolean {
    return !this.is('idle', 'error')
  }

  reset(): void {
    this._state = 'idle'
    this._history = []
  }
}
