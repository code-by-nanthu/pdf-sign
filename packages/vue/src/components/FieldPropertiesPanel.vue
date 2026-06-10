<script setup lang="ts">
import { computed } from 'vue'
import type { FieldDef, SignerDef } from '@pdf-sign/core'

interface Props {
  field: FieldDef | null
  signers: SignerDef[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [payload: { id: string; changes: Partial<Omit<FieldDef, 'id'>> }]
  'delete': [fieldId: string]
  'close': []
}>()

const FIELD_TYPE_LABELS: Record<string, string> = {
  signature:    'Signature',
  initials:     'Initials',
  'date-signed': 'Date signed',
  text:         'Text',
  textarea:     'Multiline text',
  checkbox:     'Checkbox',
  radio:        'Radio',
  dropdown:     'Dropdown',
  stamp:        'Stamp',
}

const typeLabel = computed(() =>
  props.field ? (FIELD_TYPE_LABELS[props.field.type] ?? props.field.type) : '',
)

const showPlaceholder = computed(() =>
  props.field?.type === 'text' || props.field?.type === 'textarea',
)

const showOptions = computed(() =>
  props.field?.type === 'radio' || props.field?.type === 'dropdown',
)

function update(changes: Partial<Omit<FieldDef, 'id'>>) {
  if (!props.field) return
  emit('update', { id: props.field.id, changes })
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-x-2"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 translate-x-2"
  >
    <aside
      v-if="field"
      class="
        flex w-60 shrink-0 flex-col border-l
        border-[var(--psign-border)]
        bg-[var(--psign-palette-bg)]
      "
    >
      <!-- Header -->
      <div
        class="
          flex items-center justify-between border-b
          border-[var(--psign-border)]
          px-4 py-3
        "
      >
        <span
          class="
            rounded-[var(--psign-radius-sm)]
            bg-[var(--psign-field-active)]
            px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide
            text-[var(--psign-primary)]
          "
        >
          {{ typeLabel }}
        </span>
        <button
          class="
            flex h-6 w-6 items-center justify-center
            rounded-[var(--psign-radius-sm)]
            text-[var(--psign-text-muted)]
            hover:bg-[var(--psign-surface-raised)]
            transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]
          "
          title="Close panel"
          @click="emit('close')"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M2 2 L12 12 M12 2 L2 12" />
          </svg>
        </button>
      </div>

      <!-- Properties -->
      <div class="flex-1 overflow-y-auto space-y-4 p-4">

        <!-- Label -->
        <div>
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">
            Label
          </label>
          <input
            :value="field.label"
            type="text"
            class="
              w-full rounded-[var(--psign-radius-sm)] border
              border-[var(--psign-border)]
              bg-[var(--psign-surface)]
              px-2.5 py-1.5 text-xs
              text-[var(--psign-text)]
              focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]
            "
            placeholder="Field label"
            @input="update({ label: ($event.target as HTMLInputElement).value })"
          />
        </div>

        <!-- Required toggle -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--psign-text)]">Required</span>
          <button
            :class="[
              'relative h-5 w-9 rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
              field.required
                ? 'bg-[var(--psign-primary)]'
                : 'bg-[var(--psign-border)]',
            ]"
            role="switch"
            :aria-checked="field.required"
            @click="update({ required: !field.required })"
          >
            <span
              :class="[
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                field.required ? 'translate-x-4' : 'translate-x-0.5',
              ]"
            />
          </button>
        </div>

        <!-- Signer assignment -->
        <div v-if="signers.length > 0">
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">
            Assigned to
          </label>
          <select
            :value="field.signerId ?? ''"
            class="
              w-full rounded-[var(--psign-radius-sm)] border
              border-[var(--psign-border)]
              bg-[var(--psign-surface)]
              px-2.5 py-1.5 text-xs
              text-[var(--psign-text)]
              focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]
            "
            @change="update({ signerId: ($event.target as HTMLSelectElement).value || null })"
          >
            <option value="">Any signer</option>
            <option
              v-for="signer in signers"
              :key="signer.id"
              :value="signer.id"
            >
              {{ signer.name }}
            </option>
          </select>
          <div
            v-if="field!.signerId"
            class="mt-1.5 flex items-center gap-1.5"
          >
            <span
              class="h-2 w-2 rounded-full"
              :style="{
                backgroundColor: signers.find((s) => s.id === field!.signerId)?.color ?? '#999',
              }"
            />
            <span class="text-[10px] text-[var(--psign-text-muted)]">
              {{ signers.find((s) => s.id === field!.signerId)?.name }}
            </span>
          </div>
        </div>

        <!-- Placeholder (text / textarea only) -->
        <div v-if="showPlaceholder">
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">
            Placeholder
          </label>
          <input
            :value="field.placeholder ?? ''"
            type="text"
            class="
              w-full rounded-[var(--psign-radius-sm)] border
              border-[var(--psign-border)]
              bg-[var(--psign-surface)]
              px-2.5 py-1.5 text-xs
              text-[var(--psign-text)]
              placeholder:text-[var(--psign-text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]
            "
            placeholder="Hint text shown to signer"
            @input="update({ placeholder: ($event.target as HTMLInputElement).value })"
          />
        </div>

        <!-- Options (radio / dropdown) -->
        <div v-if="showOptions">
          <label class="mb-1 block text-xs font-medium text-[var(--psign-text)]">
            Options
            <span class="ml-1 font-normal text-[var(--psign-text-muted)]">(one per line)</span>
          </label>
          <textarea
            :value="(field.options ?? []).join('\n')"
            rows="4"
            class="
              w-full resize-none rounded-[var(--psign-radius-sm)] border
              border-[var(--psign-border)]
              bg-[var(--psign-surface)]
              px-2.5 py-1.5 text-xs
              text-[var(--psign-text)]
              placeholder:text-[var(--psign-text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]
            "
            placeholder="Option A&#10;Option B&#10;Option C"
            @input="
              update({
                options: ($event.target as HTMLTextAreaElement).value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            "
          />
        </div>

        <!-- Position info (read-only) -->
        <div>
          <p class="mb-1 text-xs font-medium text-[var(--psign-text)]">
            Position
          </p>
          <div class="grid grid-cols-2 gap-1 text-[10px] text-[var(--psign-text-muted)]">
            <span>x: {{ Math.round(field.rect.x) }}pt</span>
            <span>y: {{ Math.round(field.rect.y) }}pt</span>
            <span>w: {{ Math.round(field.rect.width) }}pt</span>
            <span>h: {{ Math.round(field.rect.height) }}pt</span>
            <span class="col-span-2">page: {{ field.rect.page + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- Footer: delete -->
      <div class="border-t border-[var(--psign-border)] p-4">
        <button
          class="
            w-full rounded-[var(--psign-radius-sm)] border
            border-[var(--psign-danger)]
            py-1.5 text-xs font-medium
            text-[var(--psign-danger)]
            hover:bg-[var(--psign-field-required)]
            transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]
          "
          @click="emit('delete', field!.id)"
        >
          Remove field
        </button>
      </div>
    </aside>
  </Transition>
</template>
