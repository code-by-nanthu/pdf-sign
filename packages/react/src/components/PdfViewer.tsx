import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { FieldDef, SignerDef } from '@pdf-sign/core'
import type { DragEngine, ZoomMode } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import { usePdfRenderer } from '../hooks/usePdfRenderer.js'
import { FieldOverlay } from './FieldOverlay.js'

export interface PdfViewerHandle {
  zoomIn: () => Promise<void>
  zoomOut: () => Promise<void>
  fitWidth: () => Promise<void>
  fitPage: () => Promise<void>
  scale: number
  isRendering: boolean
}

interface PdfViewerProps {
  pdfBytes: Uint8Array | null
  currentPage: number
  fields: FieldDef[]
  signers: SignerDef[]
  dragEngine: DragEngine | null
  selectedFieldId?: string | null
  mode: 'prepare' | 'sign' | 'readonly'
  completedFieldIds?: string[]
  onPageCount?: (count: number) => void
  onViewportReady?: (viewport: RenderPageResult['viewport']) => void
  onFieldSelect?: (fieldId: string) => void
  onFieldDelete?: (fieldId: string) => void
}

export const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(function PdfViewer(
  {
    pdfBytes,
    currentPage,
    fields,
    signers,
    dragEngine,
    selectedFieldId,
    mode,
    completedFieldIds = [],
    onPageCount,
    onViewportReady,
    onFieldSelect,
    onFieldDelete,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { rendererRef, scale, isRendering, lastViewport, load, renderPage } =
    usePdfRenderer()

  async function render(zoomMode?: ZoomMode) {
    if (!canvasRef.current || !pdfBytes) return
    const containerWidth = containerRef.current?.clientWidth ?? 800
    const effectiveZoom: ZoomMode = zoomMode ?? {
      type: 'fit-width',
      containerWidth,
    }
    const result = await renderPage(currentPage, canvasRef.current, effectiveZoom)
    if (result) {
      onViewportReady?.(result.viewport)
    }
  }

  useEffect(() => {
    if (!pdfBytes) return
    let cancelled = false
    void (async () => {
      const count = await load(pdfBytes)
      if (cancelled) return
      onPageCount?.(count)
      await render()
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfBytes])

  useEffect(() => {
    if (!pdfBytes) return
    void render()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  useImperativeHandle(ref, () => ({
    zoomIn: async () => {
      if (!canvasRef.current) return
      const s = rendererRef.current.zoomIn()
      await render({ type: 'scale', value: s })
    },
    zoomOut: async () => {
      if (!canvasRef.current) return
      const s = rendererRef.current.zoomOut()
      await render({ type: 'scale', value: s })
    },
    fitWidth: async () => {
      if (!canvasRef.current || !containerRef.current) return
      await render({ type: 'fit-width', containerWidth: containerRef.current.clientWidth })
    },
    fitPage: async () => {
      if (!canvasRef.current || !containerRef.current) return
      await render({
        type: 'fit-page',
        containerWidth: containerRef.current.clientWidth,
        containerHeight: containerRef.current.clientHeight,
      })
    },
    get scale() { return scale },
    get isRendering() { return isRendering },
  }), [scale, isRendering])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!pdfBytes) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--psign-canvas-bg)] text-[var(--psign-text-muted)]">
        <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No document loaded</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 flex-col items-center overflow-auto bg-[var(--psign-canvas-bg)] p-6"
    >
      <div
        className="relative shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
        style={{
          width: canvasRef.current?.style.width ?? 'auto',
          height: canvasRef.current?.style.height ?? 'auto',
        }}
      >
        <canvas ref={canvasRef} className="block" />
        <FieldOverlay
          fields={fields}
          signers={signers}
          page={currentPage}
          viewport={lastViewport}
          dragEngine={dragEngine}
          selectedFieldId={selectedFieldId ?? null}
          mode={mode}
          completedFieldIds={completedFieldIds}
          onFieldSelect={onFieldSelect ?? (() => {})}
          onFieldDelete={onFieldDelete ?? (() => {})}
        />
      </div>
    </div>
  )
})
