<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SignerDef } from '@pdf-sign/core'
import type { DragEngine } from '@pdf-sign/core'

interface Props {
  signers: SignerDef[]
  activeSignerId?: string | null
  dragEngine?: DragEngine | null
  disabledTypes?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  activeSignerId: null,
  dragEngine: null,
  disabledTypes: () => [],
})

const emit = defineEmits<{
  'signer-change': [signerId: string]
}>()

const searchQuery = ref('')

interface PaletteItem {
  type: string
  label: string
  category: string
}

const ALL_ITEMS: PaletteItem[] = [
  { type: 'signature',   label: 'Signature',   category: 'Signature' },
  { type: 'initials',    label: 'Initials',    category: 'Signature' },
  { type: 'date-signed', label: 'Date signed', category: 'Signature' },
  { type: 'text',        label: 'Text',        category: 'Input' },
  { type: 'textarea',    label: 'Multiline',   category: 'Input' },
  { type: 'checkbox',    label: 'Checkbox',    category: 'Input' },
  { type: 'radio',       label: 'Radio',       category: 'Input' },
  { type: 'dropdown',    label: 'Dropdown',    category: 'Input' },
  { type: 'stamp',       label: 'Stamp',       category: 'Media' },
]

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return ALL_ITEMS.filter(
    (item) =>
      !props.disabledTypes.includes(item.type) &&
      (q === '' || item.label.toLowerCase().includes(q) || item.type.includes(q)),
  )
})

const grouped = computed(() => {
  const map = new Map<string, PaletteItem[]>()
  for (const item of filtered.value) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  return map
})

function registerChip(el: HTMLElement | null, fieldType: string) {
  if (!el || !props.dragEngine) return
  props.dragEngine.registerPaletteItem(el, fieldType)
}
</script>

<template>
  <aside
    class="
      flex w-60 shrink-0 flex-col border-r
      border-[var(--psign-border)]
      bg-[var(--psign-palette-bg)]
    "
  >
    <!-- Signer selector -->
    <div
      v-if="signers.length > 1"
      class="border-b border-[var(--psign-border)] p-3"
    >
      <label class="mb-1 block text-xs font-medium text-[var(--psign-text-muted)]">
        Assigning fields to
      </label>
      <div class="flex flex-col gap-1">
        <button
          v-for="signer in signers"
          :key="signer.id"
          :class="[
            'flex items-center gap-2 rounded-[var(--psign-radius-sm)] px-2 py-1.5',
            'text-left text-sm transition-colors',
            activeSignerId === signer.id
              ? 'bg-[var(--psign-field-active)] text-[var(--psign-text)] font-medium'
              : 'text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
          ]"
          @click="emit('signer-change', signer.id)"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: signer.color }"
          />
          <span class="truncate">{{ signer.name }}</span>
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="border-b border-[var(--psign-border)] p-3">
      <div class="relative">
        <svg
          class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--psign-text-muted)]"
          fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path stroke-linecap="round" d="M10.5 10.5 L13.5 13.5" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search fields…"
          class="
            w-full rounded-[var(--psign-radius-sm)] border
            border-[var(--psign-border)]
            bg-[var(--psign-surface)]
            py-1.5 pl-7 pr-2 text-xs
            text-[var(--psign-text)]
            placeholder:text-[var(--psign-text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]
          "
        />
      </div>
    </div>

    <!-- Field chips -->
    <div class="flex-1 overflow-y-auto p-2">
      <template v-if="filtered.length === 0">
        <p class="px-2 py-4 text-center text-xs text-[var(--psign-text-muted)]">
          No fields match
        </p>
      </template>

      <template v-for="[category, items] in grouped" :key="category">
        <p class="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--psign-text-muted)] first:mt-0">
          {{ category }}
        </p>
        <div
          v-for="item in items"
          :key="item.type"
          :ref="(el) => registerChip(el as HTMLElement | null, item.type)"
          :class="[
            'group mb-1 flex cursor-grab items-center gap-2.5 rounded-[var(--psign-radius-sm)]',
            'border border-[var(--psign-border)]',
            'bg-[var(--psign-surface)]',
            'px-2.5 py-2 transition-colors',
            'hover:border-[var(--psign-primary)] hover:bg-[var(--psign-field-active)]',
            'active:cursor-grabbing',
            'select-none',
          ]"
          :draggable="false"
        >
          <span class="text-sm text-[var(--psign-text-muted)]">
            {{ item.label.charAt(0) }}
          </span>
          <span class="flex-1 text-xs font-medium text-[var(--psign-text)]">
            {{ item.label }}
          </span>
          <svg
            class="h-3.5 w-3.5 shrink-0 text-[var(--psign-border)] opacity-0 transition-opacity group-hover:opacity-100"
            fill="currentColor" viewBox="0 0 16 16"
          >
            <circle cx="5.5" cy="5" r="1.2" />
            <circle cx="10.5" cy="5" r="1.2" />
            <circle cx="5.5" cy="8" r="1.2" />
            <circle cx="10.5" cy="8" r="1.2" />
            <circle cx="5.5" cy="11" r="1.2" />
            <circle cx="10.5" cy="11" r="1.2" />
          </svg>
        </div>
      </template>
    </div>
  </aside>
</template>
