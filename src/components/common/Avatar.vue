<script setup lang="ts">
import { computed } from 'vue'
import type { AccentColor } from '../../services/ai/personas'

const props = withDefaults(
  defineProps<{
    initial: string
    accent: AccentColor
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const gradientMap: Record<AccentColor, string> = {
  sky: 'from-sky-300 to-sky-500',
  indigo: 'from-indigo-300 to-indigo-500',
  slate: 'from-slate-300 to-slate-500',
  rose: 'from-rose-300 to-rose-400',
  cyan: 'from-cyan-300 to-cyan-500',
  amber: 'from-amber-300 to-amber-500',
  fuchsia: 'from-fuchsia-300 to-fuchsia-500',
}

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8 text-sm'
    case 'lg':
      return 'h-20 w-20 text-2xl'
    default:
      return 'h-11 w-11 text-base'
  }
})
</script>

<template>
  <span
    class="inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm"
    :class="[sizeClass, gradientMap[accent]]"
    aria-hidden="true"
  >
    {{ initial }}
  </span>
</template>
