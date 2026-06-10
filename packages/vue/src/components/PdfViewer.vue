<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  nextTick,
} from 'vue'
import type { FieldDef, SignerDef } from '@pdf-sign/core'
import type { DragEngine, ZoomMode } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import { usePdfRenderer } from '../composables/usePdfRenderer.js'
import FieldOverlay from './FieldOverlay.vue'

interface Props {
  pdfBytes: Uint8Array | null
  currentPage: number
  fields: FieldDef[]
  signers: SignerDef[]
  dragEngine: DragEngine | null
  selectedFieldId?: string | null
  mode: 'prepare' | 'sign' | 'readonly'
  completedFieldIds?: string[]
  initialZoom?: ZoomMode
}

const props = withDefaults(defineProps<Props>(), {
  selectedFieldId: null,
  completedFieldIds: () => [],
  initialZoom: () => ({ type: 'fit-width', containerWidth: 800 }),
})

const emit = defineEmits<{
  'page-count': [count: number]
  'viewport-ready': [viewport: RenderPageResult['viewport']]
  'field-select': [fieldId: string]
  'field-delete': [fieldId: string]
  'zoom-change': [scale: number]
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const containerEl = ref<HTMLElement | null>(null)
const { renderer, scale, isRendering, lastViewport, load, renderPage } = usePdfRenderer()

async function render(zoomMode?: ZoomMode) {
  if (!canvasEl.value || !props.pdfBytes) return

  const container = containerEl.value
  const effectiveZoom: ZoomMode = zoomMode ?? {
    type: 'fit-width',
    containerWidth: container?.clientWidth ?? 800,
  }

  const result = await renderPage(props.currentPage, canvasEl.value, effectiveZoom)
  if (result) {
    emit('viewport-ready', result.viewport)
    emit('zoom-change', result.scale)
  }
}

watch(
  () => props.pdfBytes,
  async (bytes) => {
    if (!bytes) return
    const count = await load(bytes)
    emit('page-count', count)
    await nextTick()
    await render()
  },
  { immediate: true },
)

watch(() => props.currentPage, () => render())

onMounted(async () => {
  if (props.pdfBytes) {
    await render()
  }
})

defineExpose({
  zoomIn: async () => {
    if (!canvasEl.value) return
    const s = renderer.zoomIn()
    await render({ type: 'scale', value: s })
  },
  zoomOut: async () => {
    if (!canvasEl.value) return
    const s = renderer.zoomOut()
    await render({ type: 'scale', value: s })
  },
  fitWidth: async () => {
    if (!canvasEl.value || !containerEl.value) return
    await render({ type: 'fit-width', containerWidth: containerEl.value.clientWidth })
  },
  fitPage: async () => {
    if (!canvasEl.value || !containerEl.value) return
    await render({
      type: 'fit-page',
      containerWidth: containerEl.value.clientWidth,
      containerHeight: containerEl.value.clientHeight,
    })
  },
  currentScale: scale,
  isRendering,
})
</script>

<template>
  <div
    ref="containerEl"
    class="
      relative flex flex-1 flex-col items-center overflow-auto
      bg-[var(--psign-canvas-bg)]
      p-6
    "
  >
    <!-- Empty state -->
    <div
      v-if="!pdfBytes"
      class="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--psign-text-muted)]"
    >
      <svg class="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-sm">No document loaded</p>
    </div>

    <!-- Canvas wrapper -->
    <div
      v-else
      class="relative shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
      :style="{
        width: canvasEl ? canvasEl.style.width : 'auto',
        height: canvasEl ? canvasEl.style.height : 'auto',
      }"
    >
      <canvas ref="canvasEl" class="block" />

      <FieldOverlay
        :fields="fields"
        :signers="signers"
        :page="currentPage"
        :viewport="lastViewport"
        :drag-engine="dragEngine"
        :selected-field-id="selectedFieldId ?? null"
        :mode="mode"
        :completed-field-ids="completedFieldIds ?? []"
        @field-select="(id) => emit('field-select', id)"
        @field-delete="(id) => emit('field-delete', id)"
      />
    </div>
  </div>
</template>
