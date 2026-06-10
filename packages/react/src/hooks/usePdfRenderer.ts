import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import {
  PdfRenderer,
  type ZoomMode,
  type RenderPageResult,
} from '@pdf-sign/core'

export interface UsePdfRendererReturn {
  rendererRef: MutableRefObject<PdfRenderer>
  scale: number
  isRendering: boolean
  lastViewport: RenderPageResult['viewport'] | null
  load: (bytes: Uint8Array) => Promise<number>
  renderPage: (
    pageIndex: number,
    canvas: HTMLCanvasElement,
    mode?: ZoomMode,
  ) => Promise<RenderPageResult | null>
  zoomIn: (canvas: HTMLCanvasElement, pageIndex: number) => Promise<void>
  zoomOut: (canvas: HTMLCanvasElement, pageIndex: number) => Promise<void>
  fitWidth: (
    canvas: HTMLCanvasElement,
    pageIndex: number,
    containerWidth: number,
  ) => Promise<void>
  fitPage: (
    canvas: HTMLCanvasElement,
    pageIndex: number,
    containerWidth: number,
    containerHeight: number,
  ) => Promise<void>
}

export function usePdfRenderer(): UsePdfRendererReturn {
  const rendererRef = useRef<PdfRenderer>(
    new PdfRenderer({
      devicePixelRatio:
        typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1,
    }),
  )

  const [scale, setScale] = useState(1.0)
  const [isRendering, setIsRendering] = useState(false)
  const [lastViewport, setLastViewport] =
    useState<RenderPageResult['viewport'] | null>(null)

  useEffect(() => {
    const r = rendererRef.current
    return () => {
      void r.destroy()
    }
  }, [])

  const load = useCallback(async (bytes: Uint8Array): Promise<number> => {
    return rendererRef.current.load(bytes)
  }, [])

  const renderPage = useCallback(
    async (
      pageIndex: number,
      canvas: HTMLCanvasElement,
      mode?: ZoomMode,
    ): Promise<RenderPageResult | null> => {
      const renderer = rendererRef.current
      if (isRendering) renderer.cancelCurrentRender()
      setIsRendering(true)
      try {
        const result = await renderer.renderPage(pageIndex, canvas, mode)
        setScale(result.scale)
        setLastViewport(result.viewport)
        return result
      } catch {
        return null
      } finally {
        setIsRendering(false)
      }
    },
    [isRendering],
  )

  const zoomIn = useCallback(
    async (canvas: HTMLCanvasElement, pageIndex: number) => {
      const newScale = rendererRef.current.zoomIn()
      await renderPage(pageIndex, canvas, { type: 'scale', value: newScale })
    },
    [renderPage],
  )

  const zoomOut = useCallback(
    async (canvas: HTMLCanvasElement, pageIndex: number) => {
      const newScale = rendererRef.current.zoomOut()
      await renderPage(pageIndex, canvas, { type: 'scale', value: newScale })
    },
    [renderPage],
  )

  const fitWidth = useCallback(
    async (
      canvas: HTMLCanvasElement,
      pageIndex: number,
      containerWidth: number,
    ) => {
      await renderPage(pageIndex, canvas, {
        type: 'fit-width',
        containerWidth,
      })
    },
    [renderPage],
  )

  const fitPage = useCallback(
    async (
      canvas: HTMLCanvasElement,
      pageIndex: number,
      containerWidth: number,
      containerHeight: number,
    ) => {
      await renderPage(pageIndex, canvas, {
        type: 'fit-page',
        containerWidth,
        containerHeight,
      })
    },
    [renderPage],
  )

  return {
    rendererRef,
    scale,
    isRendering,
    lastViewport,
    load,
    renderPage,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
  }
}
