<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type { FieldDef, SignerDef } from '@pdf-sign/core'
import type { DragEngine } from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import FieldChip from './FieldChip.vue'

interface Props {
  fields: FieldDef[]
  signers: SignerDef[]
  page: number
  viewport: RenderPageResult['viewport'] | null
  dragEngine: DragEngine | null
  selectedFieldId?: string | null
  mode: 'prepare' | 'sign' | 'readonly'
  completedFieldIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedFieldId: null,
  completedFieldIds: () => [],
})

const emit = defineEmits<{
  'field-select': [fieldId: string]
  'field-delete': [fieldId: string]
  'overlay-click': [{ x: number; y: number }]
}>()

const overlayEl = ref<HTMLElement | null>(null)
let cleanupOverlay: (() => void) | null = null

function registerOverlay() {
  cleanupOverlay?.()
  if (!props.dragEngine || !overlayEl.value) return
  cleanupOverlay = props.dragEngine.registerOverlay(overlayEl.value, props.page)
}

onMounted(() => registerOverlay())

watch(
  () => [props.dragEngine, props.page] as const,
  () => registerOverlay(),
)

onUnmounted(() => cleanupOverlay?.())

const visibleFields = computed(() =>
  props.fields.filter((f) => f.rect.page === props.page),
)

function handleOverlayClick(e: MouseEvent) {
  if (e.target === overlayEl.value) {
    emit('overlay-click', { x: e.offsetX, y: e.offsetY })
  }
}

const completedSet = computed(() => new Set(props.completedFieldIds))
</script>

<template>
  <div
    ref="overlayEl"
    class="pointer-events-auto absolute inset-0"
    :style="{ zIndex: 'var(--psign-z-overlay)' }"
    @click="handleOverlayClick"
  >
    <FieldChip
      v-for="field in visibleFields"
      :key="field.id"
      :field="field"
      :signers="signers"
      :viewport="viewport"
      :drag-engine="dragEngine"
      :is-selected="selectedFieldId === field.id"
      :is-complete="completedSet.has(field.id)"
      :mode="mode"
      @select="(id) => emit('field-select', id)"
      @delete="(id) => emit('field-delete', id)"
    />
  </div>
</template>
