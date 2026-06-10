<script setup lang="ts">
import type { SignerDef } from '@pdf-sign/core'

interface Props {
  currentPage: number
  totalPages: number
  scale: number
  canUndo: boolean
  canRedo: boolean
  isRendering: boolean
  mode: 'prepare' | 'sign' | 'readonly'
  signers?: SignerDef[]
  activeSignerId?: string | null
}

withDefaults(defineProps<Props>(), {
  signers: () => [],
  activeSignerId: null,
})

const emit = defineEmits<{
  'prev-page': []
  'next-page': []
  'zoom-in': []
  'zoom-out': []
  'fit-width': []
  'fit-page': []
  'undo': []
  'redo': []
  'save': []
  'download': []
  'submit': []
}>()

function formatScale(s: number) {
  return `${Math.round(s * 100)}%`
}
</script>

<template>
  <header
    class="
      flex h-10 shrink-0 items-center gap-1 border-b
      border-[var(--psign-border)]
      bg-[var(--psign-toolbar-bg)]
      px-3
    "
  >
    <!-- Left group: undo/redo (prepare mode only) -->
    <div v-if="mode === 'prepare'" class="flex items-center gap-0.5">
      <button
        :disabled="!canUndo"
        :class="[
          'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)]',
          'text-[var(--psign-text)] transition-colors',
          'hover:bg-[var(--psign-surface-raised)]',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        title="Undo (Ctrl+Z)"
        @click="emit('undo')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 L7 3.5 L7 6 Q11 6 11 10 Q11 13 7 13 L7 11 Q10 11 10 10 Q10 7.5 7 7.5 L7 10 Z" />
        </svg>
      </button>
      <button
        :disabled="!canRedo"
        :class="[
          'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)]',
          'text-[var(--psign-text)] transition-colors',
          'hover:bg-[var(--psign-surface-raised)]',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        title="Redo (Ctrl+Y)"
        @click="emit('redo')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7.5 L9 3.5 L9 6 Q5 6 5 10 Q5 13 9 13 L9 11 Q6 11 6 10 Q6 7.5 9 7.5 L9 10 Z" />
        </svg>
      </button>
      <div class="mx-1 h-5 w-px bg-[var(--psign-border)]" />
    </div>

    <!-- Page navigation -->
    <div class="flex items-center gap-1">
      <button
        :disabled="currentPage === 0"
        :class="[
          'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)]',
          'text-[var(--psign-text)] transition-colors',
          'hover:bg-[var(--psign-surface-raised)]',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        title="Previous page"
        @click="emit('prev-page')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 3 L6 8 L10 13" />
        </svg>
      </button>

      <span class="min-w-[4.5rem] text-center text-xs text-[var(--psign-text-muted)]">
        {{ currentPage + 1 }} / {{ totalPages || 1 }}
      </span>

      <button
        :disabled="currentPage >= totalPages - 1"
        :class="[
          'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)]',
          'text-[var(--psign-text)] transition-colors',
          'hover:bg-[var(--psign-surface-raised)]',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        title="Next page"
        @click="emit('next-page')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 3 L10 8 L6 13" />
        </svg>
      </button>
    </div>

    <div class="mx-1 h-5 w-px bg-[var(--psign-border)]" />

    <!-- Zoom controls -->
    <div class="flex items-center gap-0.5">
      <button
        :class="[
          'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)]',
          'text-[var(--psign-text)] transition-colors',
          'hover:bg-[var(--psign-surface-raised)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        title="Zoom out"
        @click="emit('zoom-out')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
          <circle cx="7" cy="7" r="4.5" />
          <path stroke-linecap="round" d="M5 7 H9" />
          <path stroke-linecap="round" d="M10.5 10.5 L13.5 13.5" />
        </svg>
      </button>

      <span class="min-w-[3rem] text-center text-xs text-[var(--psign-text-muted)]">
        {{ formatScale(scale) }}
      </span>

      <button
        :class="[
          'flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)]',
          'text-[var(--psign-text)] transition-colors',
          'hover:bg-[var(--psign-surface-raised)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        title="Zoom in"
        @click="emit('zoom-in')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
          <circle cx="7" cy="7" r="4.5" />
          <path stroke-linecap="round" d="M5 7 H9 M7 5 V9" />
          <path stroke-linecap="round" d="M10.5 10.5 L13.5 13.5" />
        </svg>
      </button>

      <button
        :class="[
          'flex h-7 items-center gap-1 rounded-[var(--psign-radius-sm)] px-2',
          'text-xs text-[var(--psign-text-muted)] transition-colors',
          'hover:bg-[var(--psign-surface-raised)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        title="Fit to width"
        @click="emit('fit-width')"
      >
        Fit
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Loading indicator -->
    <div v-if="isRendering" class="flex items-center gap-1.5">
      <svg
        class="h-3.5 w-3.5 animate-spin text-[var(--psign-text-muted)]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span class="text-xs text-[var(--psign-text-muted)]">Rendering…</span>
    </div>

    <!-- Right group: action buttons -->
    <div class="flex items-center gap-1">
      <button
        v-if="mode === 'prepare'"
        :class="[
          'flex h-7 items-center gap-1.5 rounded-[var(--psign-radius-sm)] px-3',
          'bg-[var(--psign-primary)] text-[var(--psign-primary-fg)]',
          'text-xs font-medium transition-colors',
          'hover:bg-[var(--psign-primary-hover)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        @click="emit('save')"
      >
        Save template
      </button>

      <button
        v-if="mode === 'sign'"
        :class="[
          'flex h-7 items-center gap-1.5 rounded-[var(--psign-radius-sm)] px-3',
          'bg-[var(--psign-primary)] text-[var(--psign-primary-fg)]',
          'text-xs font-medium transition-colors',
          'hover:bg-[var(--psign-primary-hover)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
        ]"
        @click="emit('submit')"
      >
        Submit signed
      </button>

      <slot name="extra" />
    </div>
  </header>
</template>
