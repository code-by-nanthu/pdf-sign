<script setup lang="ts">
defineProps<{ fields?: import('@pdf-sign/core').FieldDef[]; page?: number }>()
</script>
<template>
  <div class="pointer-events-none absolute inset-0 z-[var(--psign-z-overlay)]">
    <slot />
  </div>
</template>
