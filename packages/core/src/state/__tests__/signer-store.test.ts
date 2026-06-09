import { describe, it, expect, beforeEach } from 'vitest'
import { SignerStore, DEFAULT_SIGNER } from '../signer-store.js'

describe('SignerStore', () => {
  let store: SignerStore

  beforeEach(() => {
    store = new SignerStore()
  })

  it('starts with a single default signer', () => {
    expect(store.signers).toHaveLength(1)
    expect(store.signers[0]!.id).toBe(DEFAULT_SIGNER.id)
  })

  describe('addSigner', () => {
    it('adds a signer with auto-incremented order', () => {
      const s = store.addSigner({ name: 'Alice' })
      expect(s.order).toBe(2)
      expect(store.signers).toHaveLength(2)
    })

    it('assigns a unique ID', () => {
      const a = store.addSigner()
      const b = store.addSigner()
      expect(a.id).not.toBe(b.id)
    })

    it('uses provided name', () => {
      const s = store.addSigner({ name: 'Bob' })
      expect(s.name).toBe('Bob')
    })

    it('assigns a colour from the default palette', () => {
      const s = store.addSigner()
      expect(s.color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('updateSigner', () => {
    it('updates signer properties', () => {
      const updated = store.updateSigner(DEFAULT_SIGNER.id, { name: 'Charlie', email: 'c@x.com' })
      expect(updated?.name).toBe('Charlie')
      expect(updated?.email).toBe('c@x.com')
    })

    it('returns undefined for unknown id', () => {
      expect(store.updateSigner('unknown', { name: 'X' })).toBeUndefined()
    })
  })

  describe('removeSigner', () => {
    it('removes and returns the signer', () => {
      const removed = store.removeSigner(DEFAULT_SIGNER.id)
      expect(removed?.id).toBe(DEFAULT_SIGNER.id)
      expect(store.signers).toHaveLength(0)
    })

    it('returns undefined for unknown id', () => {
      expect(store.removeSigner('nonexistent')).toBeUndefined()
    })

    it('clears activeSigner if the removed signer was active', () => {
      store.setActiveSigner(DEFAULT_SIGNER.id)
      store.removeSigner(DEFAULT_SIGNER.id)
      expect(store.activeSignerId).toBeNull()
    })
  })

  describe('setActiveSigner', () => {
    it('sets the active signer', () => {
      store.setActiveSigner(DEFAULT_SIGNER.id)
      expect(store.activeSignerId).toBe(DEFAULT_SIGNER.id)
      expect(store.activeSigner?.id).toBe(DEFAULT_SIGNER.id)
    })

    it('can set to null', () => {
      store.setActiveSigner(DEFAULT_SIGNER.id)
      store.setActiveSigner(null)
      expect(store.activeSignerId).toBeNull()
    })

    it('throws for unknown signer id', () => {
      expect(() => store.setActiveSigner('nonexistent')).toThrow()
    })
  })

  describe('sortedSigners', () => {
    it('returns signers sorted by order ascending', () => {
      store.addSigner({ name: 'B', order: 3 })
      store.addSigner({ name: 'A', order: 2 })
      const sorted = store.sortedSigners
      expect(sorted[0]!.order).toBeLessThanOrEqual(sorted[1]!.order)
    })
  })

  describe('nextSigners', () => {
    it('returns signers with the lowest pending order', () => {
      const s1 = store.signers[0]! // order 1
      const s2 = store.addSigner({ order: 2 })
      const s3 = store.addSigner({ order: 2 })
      const next = store.nextSigners([s1.id])
      expect(next.map((s) => s.id)).toContain(s2.id)
      expect(next.map((s) => s.id)).toContain(s3.id)
    })

    it('returns empty array when all signers are complete', () => {
      const ids = store.signers.map((s) => s.id)
      expect(store.nextSigners(ids)).toHaveLength(0)
    })
  })
})
