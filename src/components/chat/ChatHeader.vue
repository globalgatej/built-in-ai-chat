<script setup lang="ts">
import type { Persona } from '../../services/ai/personas'
import type { AiReadiness } from '../../services/ai/types'
import Avatar from '../common/Avatar.vue'
import AiStatus from '../common/AiStatus.vue'

defineProps<{
  persona: Persona
  readiness: AiReadiness
}>()

const emit = defineEmits<{
  (e: 'open-sidebar'): void
  (e: 'reset'): void
}>()
</script>

<template>
  <header
    class="flex items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur"
  >
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="キャラクター一覧を開く"
        @click="emit('open-sidebar')"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Avatar :initial="persona.initial" :accent="persona.accent" />

      <div class="min-w-0">
        <h1 class="truncate text-base font-bold text-slate-900">{{ persona.name }}</h1>
        <p class="truncate text-xs text-slate-500">{{ persona.description }}</p>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-3">
      <AiStatus :readiness="readiness" class="hidden sm:inline-flex" />
      <button
        type="button"
        class="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        @click="emit('reset')"
      >
        会話をリセット
      </button>
    </div>
  </header>
</template>
