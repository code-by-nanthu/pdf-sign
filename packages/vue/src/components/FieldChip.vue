<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { FieldDef, SignerDef, OverlayRect } from '@pdf-sign/core'
import type { DragEngine, ResizeHandle } from '@pdf-sign/core'
import { pdfToOverlay } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'

interface Props {
  field: FieldDef
  signers: SignerDef[]
  viewport: RenderPageResult['viewport'] | null
  dragEngine: DragEngine | null
  isSelected?: boolean
  mode: 'prepare' | 'sign' | 'readonly'
  isComplete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isComplete: false,
})

const emit = defineEmits<{
  'select': [fieldId: string]
  'delete': [fieldId: string]
}>()

const chipEl = ref<HTMLElement | null>(null)

const overlayRect = computed<OverlayRect | null>(() => {
  if (!props.viewport) return null
  return pdfToOverlay(props.field.rect, props.viewport)
})

const signer = computed(() =>
  props.signers.find((s) => s.id === props.field.signerId),
)

function getLiveRect(): OverlayRect {
  return overlayRect.value ?? { x: 0, y: 0, width: 150, height: 40, page: 0 }
}

const HANDLES: ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
const handleEls = ref<Map<ResizeHandle, HTMLElement>>(new Map())

let cleanupMove: (() => void) | null = null
const cleanupHandles: Array<() => void> = []

function registerWithEngine() {
  if (!props.dragEngine || !chipEl.value || props.mode !== 'prepare') return

  cleanupMove?.()
  cleanupHandles.forEach((fn) => fn())
  cleanupHandles.length = 0

  cleanupMove = props.dragEngine.registerField(
    chipEl.value,
    props.field.id,
    getLiveRect,
  )

  for (const [handle, el] of handleEls.value.entries()) {
    const cleanup = props.dragEngine.registerResizeHandle(
      el,
      props.field.id,
      handle,
      getLiveRect,
    )
    cleanupHandles.push(cleanup)
  }
}

function setHandleEl(el: HTMLElement | null, handle: ResizeHandle) {
  if (el) handleEls.value.set(handle, el)
}

onMounted(() => registerWithEngine())

watch(
  () => [props.dragEngine, props.mode, props.field.id] as const,
  () => registerWithEngine(),
)

onUnmounted(() => {
  cleanupMove?.()
  cleanupHandles.forEach((fn) => fn())
})

const handlePositions: Record<ResizeHandle, string> = {
  n:  'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
  ne: 'top-0 right-0 -translate-y-1/2 translate-x-1/2 cursor-ne-resize',
  e:  'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
  se: 'bottom-0 right-0 translate-y-1/2 translate-x-1/2 cursor-se-resize',
  s:  'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
  sw: 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2 cursor-sw-resize',
  w:  'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
  nw: 'top-0 left-0 -translate-y-1/2 -translate-x-1/2 cursor-nw-resize',
}

const fieldStateClass = computed(() => {
  if (props.isComplete) return 'bg-[var(--psign-field-complete)]'
  if (props.field.required) return 'bg-[var(--psign-field-required)]'
  return 'bg-[var(--psign-field-active)]'
})
</script>

<template>
  <div
    v-if="overlayRect"
    :ref="(el) => { chipEl = el as HTMLElement | null }"
    :style="{
      position: 'absolute',
      left: `${overlayRect.x}px`,
      top: `${overlayRect.y}px`,
      width: `${overlayRect.width}px`,
      height: `${overlayRect.height}px`,
    }"
    :class="[
      'group/chip select-none',
      mode === 'prepare' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
    ]"
    @click="emit('select', field.id)"
  >
    <!-- Field body -->
    <div
      :class="[
        'relative flex h-full w-full items-center overflow-hidden',
        'rounded-[var(--psign-radius-sm)]',
        'border',
        isSelected
          ? 'border-[var(--psign-primary)]'
          : 'border-[var(--psign-border)]',
        fieldStateClass,
        'transition-all duration-100',
      ]"
    >
      <!-- Signer colour bar -->
      <div
        v-if="signer"
        class="absolute left-0 top-0 h-full w-1"
        :style="{ backgroundColor: signer.color }"
      />

      <!-- Label -->
      <div class="flex min-w-0 flex-1 items-center gap-1.5 px-3">
        <span class="truncate text-[10px] font-medium text-[var(--psign-text)]">
          {{ field.label }}
        </span>
        <span
          v-if="field.required"
          class="shrink-0 text-[9px] font-semibold uppercase text-[var(--psign-danger)]"
        >
          *
        </span>
      </div>

      <!-- Delete button (prepare mode, selected) -->
      <button
        v-if="mode === 'prepare' && isSelected"
        class="
          absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center
          rounded-sm
          bg-[var(--psign-danger)] text-white
          opacity-0 transition-opacity
          group-hover/chip:opacity-100
          hover:opacity-100
          focus-visible:opacity-100 focus-visible:outline-none
        "
        title="Remove field"
        @click.stop="emit('delete', field.id)"
      >
        <svg class="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" d="M2 2 L10 10 M10 2 L2 10" />
        </svg>
      </button>
    </div>

    <!-- Resize handles (prepare mode + selected) -->
    <template v-if="mode === 'prepare' && isSelected">
      <div
        v-for="handle in HANDLES"
        :key="handle"
        :ref="(el) => setHandleEl(el as HTMLElement | null, handle)"
        :class="[
          'absolute h-2.5 w-2.5 rounded-full',
          'border-2 border-[var(--psign-primary)]',
          'bg-[var(--psign-surface)]',
          handlePositions[handle],
          'z-10',
        ]"
        :data-resize-handle="handle"
      />
    </template>
  </div>
</template>
