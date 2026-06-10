import { ref, shallowRef, onUnmounted, type Ref } from 'vue'
import { PdfRenderer, type ZoomMode, type RenderPageResult } from '@pdf-sign/core'

export interface UsePdfRendererReturn {
  renderer: PdfRenderer
  scale: Ref<number>
  isRendering: Ref<boolean>
  lastViewport: Ref<RenderPageResult['viewport'] | null>
  load: (bytes: Uint8Array) => Promise<number>
  renderPage: (
    pageIndex: number,
    canvas: HTMLCanvasElement,
    mode?: ZoomMode,
  ) => Promise<RenderPageResult | null>
  zoomIn: (canvas: HTMLCanvasElement, pageIndex: number) => Promise<void>
  zoomOut: (canvas: HTMLCanvasElement, pageIndex: number) => Promise<void>
  fitWidth: (canvas: HTMLCanvasElement, pageIndex: number, containerWidth: number) => Promise<void>
  fitPage: (
    canvas: HTMLCanvasElement,
    pageIndex: number,
    containerWidth: number,
    containerHeight: number,
  ) => Promise<void>
}

export function usePdfRenderer(): UsePdfRendererReturn {
  const renderer = new PdfRenderer({
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1,
  })

  const scale = ref(1.0)
  const isRendering = ref(false)
  const lastViewport = shallowRef<RenderPageResult['viewport'] | null>(null)

  onUnmounted(() => renderer.destroy())

  async function load(bytes: Uint8Array): Promise<number> {
    return renderer.load(bytes)
  }

  async function renderPage(
    pageIndex: number,
    canvas: HTMLCanvasElement,
    mode?: ZoomMode,
  ): Promise<RenderPageResult | null> {
    if (isRendering.value) renderer.cancelCurrentRender()
    isRendering.value = true
    try {
      const result = await renderer.renderPage(pageIndex, canvas, mode)
      scale.value = result.scale
      lastViewport.value = result.viewport
      return result
    } catch {
      return null
    } finally {
      isRendering.value = false
    }
  }

  async function zoomIn(canvas: HTMLCanvasElement, pageIndex: number) {
    const newScale = renderer.zoomIn()
    await renderPage(pageIndex, canvas, { type: 'scale', value: newScale })
  }

  async function zoomOut(canvas: HTMLCanvasElement, pageIndex: number) {
    const newScale = renderer.zoomOut()
    await renderPage(pageIndex, canvas, { type: 'scale', value: newScale })
  }

  async function fitWidth(canvas: HTMLCanvasElement, pageIndex: number, containerWidth: number) {
    await renderPage(pageIndex, canvas, { type: 'fit-width', containerWidth })
  }

  async function fitPage(
    canvas: HTMLCanvasElement,
    pageIndex: number,
    containerWidth: number,
    containerHeight: number,
  ) {
    await renderPage(pageIndex, canvas, {
      type: 'fit-page',
      containerWidth,
      containerHeight,
    })
  }

  return {
    renderer,
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
