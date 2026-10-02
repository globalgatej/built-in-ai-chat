<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    size?: 'sm' | 'md'
  }>(),
  { label: '読み込み中...', size: 'md' },
)
</script>

<template>
  <div class="flex items-center gap-2 text-slate-500" role="status" aria-live="polite">
    <span
      class="inline-block animate-spin rounded-full border-2 border-slate-200 border-t-sky-500"
      :class="size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'"
    />
    <span class="text-sm">{{ label }}</span>
  </div>
</template>
