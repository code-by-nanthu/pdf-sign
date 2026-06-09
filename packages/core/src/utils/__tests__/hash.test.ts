import { describe, it, expect } from 'vitest'
import { sha256Hex, generateId, now } from '../hash.js'

describe('hash utils', () => {
  it('sha256Hex produces a 64-char hex string', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    const hash = await sha256Hex(bytes)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('sha256Hex is deterministic', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    expect(await sha256Hex(bytes)).toBe(await sha256Hex(bytes))
  })

  it('generateId returns a uuid-like string', () => {
    expect(generateId()).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('now returns an ISO string', () => {
    expect(now()).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
