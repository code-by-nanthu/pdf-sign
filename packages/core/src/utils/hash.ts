/**
 * Compute SHA-256 hex digest of arbitrary bytes.
 * Uses the Web Crypto API (available in all modern browsers and Node ≥ 18).
 */
export async function sha256Hex(data: Uint8Array | ArrayBuffer): Promise<string> {
  // Copy into a new Uint8Array backed by a plain ArrayBuffer so cross-realm
  // environments (e.g. jsdom) don't trigger ERR_INVALID_ARG_TYPE.
  const source: BufferSource = data instanceof Uint8Array ? new Uint8Array(data) : data
  const hashBuffer = await crypto.subtle.digest('SHA-256', source)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a UUID v4.
 * Uses crypto.randomUUID() where available, falls back to a manual implementation.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for environments without randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get the current ISO 8601 timestamp.
 */
export function now(): string {
  return new Date().toISOString()
}
