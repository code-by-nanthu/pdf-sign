import type { SignerDef } from '../types/index.js'
import { generateId } from '../utils/hash.js'

/** Default colours assigned to signers in order. */
const DEFAULT_SIGNER_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
]

export const DEFAULT_SIGNER: SignerDef = {
  id: 'signer-1',
  name: 'Signer 1',
  order: 1,
  color: DEFAULT_SIGNER_COLORS[0]!,
}

/**
 * Manages the list of signers and tracks which signer is
 * currently active in sign mode.
 *
 * Signer order determines the signing sequence.
 * Signers with the same order number may sign in parallel.
 */
export class SignerStore {
  private _signers: SignerDef[]
  private _activeSignerId: string | null = null

  constructor(signers: SignerDef[] = [DEFAULT_SIGNER]) {
    this._signers = signers.map((s) => ({ ...s }))
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  get signers(): SignerDef[] {
    return [...this._signers]
  }

  get activeSignerId(): string | null {
    return this._activeSignerId
  }

  get activeSigner(): SignerDef | undefined {
    if (this._activeSignerId === null) return undefined
    return this._signers.find((s) => s.id === this._activeSignerId)
  }

  getSigner(id: string): SignerDef | undefined {
    return this._signers.find((s) => s.id === id)
  }

  /** Signers sorted by order (ascending). */
  get sortedSigners(): SignerDef[] {
    return [...this._signers].sort((a, b) => a.order - b.order)
  }

  /**
   * Returns the next signer(s) who should sign after all fields for
   * signers at order N are complete.
   * Returns [] when all signers have completed.
   */
  nextSigners(completedSignerIds: string[]): SignerDef[] {
    const pending = this._signers.filter((s) => !completedSignerIds.includes(s.id))
    if (pending.length === 0) return []
    const minOrder = Math.min(...pending.map((s) => s.order))
    return pending.filter((s) => s.order === minOrder)
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Add a new signer. Automatically assigns an order number
   * (one greater than the current maximum) and a colour.
   */
  addSigner(partial: Partial<Omit<SignerDef, 'id'>> = {}): SignerDef {
    const maxOrder = this._signers.reduce((m, s) => Math.max(m, s.order), 0)
    const colorIndex = this._signers.length % DEFAULT_SIGNER_COLORS.length

    const signer: SignerDef = {
      id: generateId(),
      name: partial.name ?? `Signer ${this._signers.length + 1}`,
      order: partial.order ?? maxOrder + 1,
      color: partial.color ?? DEFAULT_SIGNER_COLORS[colorIndex]!,
      ...(partial.email !== undefined ? { email: partial.email } : {}),
    }

    this._signers = [...this._signers, signer]
    return signer
  }

  updateSigner(id: string, changes: Partial<Omit<SignerDef, 'id'>>): SignerDef | undefined {
    const index = this._signers.findIndex((s) => s.id === id)
    if (index === -1) return undefined

    const updated: SignerDef = { ...this._signers[index]!, ...changes, id }
    this._signers = [...this._signers]
    this._signers[index] = updated
    return updated
  }

  /**
   * Remove a signer. Returns the removed SignerDef, or undefined if
   * not found. Callers should also call FieldStore.reassignFields().
   */
  removeSigner(id: string): SignerDef | undefined {
    const signer = this._signers.find((s) => s.id === id)
    if (!signer) return undefined
    this._signers = this._signers.filter((s) => s.id !== id)
    if (this._activeSignerId === id) this._activeSignerId = null
    return signer
  }

  setActiveSigner(id: string | null): void {
    if (id !== null && !this._signers.find((s) => s.id === id)) {
      throw new Error(`[pdf-sign/core] Signer "${id}" not found`)
    }
    this._activeSignerId = id
  }

  /** Replace the entire signer list (e.g. loading a saved template). */
  loadSigners(signers: SignerDef[]): void {
    this._signers = signers.map((s) => ({ ...s }))
    this._activeSignerId = null
  }

  reset(): void {
    this._signers = [{ ...DEFAULT_SIGNER }]
    this._activeSignerId = null
  }
}
