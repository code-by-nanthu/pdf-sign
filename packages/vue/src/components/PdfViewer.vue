<script setup lang="ts">
defineProps<{ page?: number; zoom?: number }>()
</script>
<template>
  <div class="relative flex-1 overflow-auto bg-[var(--psign-canvas-bg)]">
    <canvas ref="canvasEl" class="block" />
    <slot name="overlay" />
  </div>
</template>
