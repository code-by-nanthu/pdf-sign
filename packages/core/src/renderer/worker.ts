/**
 * Initialise the pdf.js worker.
 *
 * Must be called once before any PdfRenderer is constructed.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * Framework adapter usage:
 *
 *   Vue plugin install():
 *     import { initialisePdfWorker } from '@pdf-sign/core'
 *     initialisePdfWorker()
 *
 *   Next.js (App Router, client component):
 *     'use client'
 *     import { initialisePdfWorker } from '@pdf-sign/core'
 *     initialisePdfWorker()
 *
 * The workerSrc pattern uses import.meta.url so bundlers (Vite,
 * webpack, esbuild) can resolve the worker asset at build time.
 * Falls back to a CDN URL only when import.meta.url is unavailable
 * (e.g. CJS test environments).
 */

let initialised = false

export function initialisePdfWorker(): void {
  // SSR guard — pdf.js must not run in Node
  if (typeof window === 'undefined') return
  if (initialised) return

  // Dynamically import to avoid top-level side effects in SSR
  void import('pdfjs-dist').then(({ GlobalWorkerOptions }) => {
    if (GlobalWorkerOptions.workerSrc) {
      initialised = true
      return
    }

    try {
      // Vite / esbuild / webpack 5 — resolves the worker file as a
      // build asset. This is the recommended approach for all modern
      // bundlers.
      GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href
    } catch {
      // CJS / Jest / environments where import.meta.url is unavailable
      // Fall back to unpkg CDN. Not suitable for production — consumers
      // should call initialisePdfWorker() from a bundled entry point.
      GlobalWorkerOptions.workerSrc =
        'https://unpkg.com/pdfjs-dist/build/pdf.worker.min.mjs'
    }

    initialised = true
  })
}

/** Reset — only used in tests. */
export function _resetWorkerInit(): void {
  initialised = false
}
