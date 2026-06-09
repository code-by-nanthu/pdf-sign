<script setup lang="ts">
defineProps<{ currentPage?: number; totalPages?: number; zoom?: number }>()
</script>
<template>
  <header class="flex items-center gap-2 border-b border-[var(--psign-border)] bg-[var(--psign-toolbar-bg)] px-4 py-2">
    <slot />
    <slot name="extra" />
  </header>
</template>
