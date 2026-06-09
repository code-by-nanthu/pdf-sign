/**
 * Normalise any supported PDF input type to a Uint8Array.
 * This is the single entry point for all PDF input handling.
 */
export async function normalisePdfInput(
  input: string | Uint8Array | ArrayBuffer | File | null,
): Promise<Uint8Array> {
  if (input === null) {
    throw new Error('[pdf-sign/core] No PDF provided')
  }

  // Already bytes
  if (input instanceof Uint8Array) {
    return input
  }

  // ArrayBuffer
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  }

  // File object
  if (input instanceof File) {
    const buf = await input.arrayBuffer()
    return new Uint8Array(buf)
  }

  if (typeof input === 'string') {
    // Base64 string (with or without data URL prefix)
    if (input.startsWith('data:') || isBase64(input)) {
      const base64 = input.includes(',') ? input.split(',')[1] : input
      const binary = atob(base64!)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    }

    // URL string — fetch it
    const response = await fetch(input)
    if (!response.ok) {
      throw new Error(
        `[pdf-sign/core] Failed to fetch PDF from URL: ${response.status} ${response.statusText}`,
      )
    }
    const buf = await response.arrayBuffer()
    return new Uint8Array(buf)
  }

  throw new Error('[pdf-sign/core] Unsupported PDF input type')
}

function isBase64(str: string): boolean {
  // Quick heuristic: base64 chars only, length divisible by 4
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str) && str.length % 4 === 0
}
