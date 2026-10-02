<script setup lang="ts">
import { computed } from 'vue'
import type { AiReadiness } from '../../services/ai/types'

const props = defineProps<{
  readiness: AiReadiness
}>()

const dotClass = computed(() => {
  switch (props.readiness.status) {
    case 'ready':
      return 'bg-emerald-500'
    case 'downloading':
    case 'downloadable':
    case 'checking':
      return 'bg-amber-400'
    default:
      return 'bg-slate-300'
  }
})

const label = computed(() => {
  switch (props.readiness.status) {
    case 'checking':
      return 'AIを確認しています'
    case 'ready':
      return 'ローカルAI 準備完了'
    case 'downloadable':
      return 'AIモデル未ダウンロード'
    case 'downloading':
      return `AI準備中 ${Math.round(props.readiness.progress * 100)}%`
    case 'unsupported':
      return 'AI利用不可'
    case 'error':
      return 'AIエラー'
    default:
      return ''
  }
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-xs text-slate-500">
    <span class="h-2 w-2 rounded-full" :class="dotClass" aria-hidden="true" />
    {{ label }}
  </span>
</template>
