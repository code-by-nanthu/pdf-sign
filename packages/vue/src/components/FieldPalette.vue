<script setup lang="ts">
defineProps<{ signers?: import('@pdf-sign/core').SignerDef[] }>()
</script>
<template>
  <aside class="flex w-60 flex-col border-r border-[var(--psign-border)] bg-[var(--psign-palette-bg)]">
    <slot>
      <div class="p-4 text-sm text-[var(--psign-text-muted)]">Palette stub</div>
    </slot>
  </aside>
</template>
