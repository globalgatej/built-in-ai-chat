<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 0〜1の進捗率 */
  value: number
}>()

/** 進捗が0%でも「止まっていない」と伝わるよう、最低でも数%は常に見せる */
const widthPercent = computed(() => Math.max(4, Math.min(100, Math.round(props.value * 100))))
</script>

<template>
  <div
    class="relative h-2 w-full overflow-hidden rounded-full bg-amber-100"
    role="progressbar"
    :aria-valuenow="Math.round(value * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full rounded-full bg-amber-500 transition-[width] duration-500 ease-out"
      :style="{ width: `${widthPercent}%` }"
    />
    <!-- 進捗イベントが疎らでも「動いている」ことが伝わるよう、常時流れるシマーを重ねる -->
    <div class="absolute inset-0 overflow-hidden rounded-full">
      <div class="progress-shimmer h-full w-1/3 bg-white/40" />
    </div>
  </div>
</template>

<style scoped>
.progress-shimmer {
  animation: progress-shimmer-move 1.4s ease-in-out infinite;
}

@keyframes progress-shimmer-move {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-shimmer {
    animation: none;
  }
}
</style>
