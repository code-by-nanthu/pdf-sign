<script setup lang="ts">
defineProps<{ open?: boolean }>()
const emit = defineEmits<{ 'confirm': [dataUrl: string]; 'cancel': [] }>()
</script>
<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--psign-overlay)]">
    <div class="rounded-[var(--psign-radius-lg)] bg-[var(--psign-surface)] p-6 shadow-[var(--psign-shadow)]">
      <slot>Signature modal stub</slot>
    </div>
  </div>
</template>
