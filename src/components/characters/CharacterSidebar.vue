<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { personas, type AccentColor } from '../../services/ai/personas'
import Avatar from '../common/Avatar.vue'

defineProps<{
  currentPersonaId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', personaId: string): void
}>()

/** 選択中ラインの色(Avatarのグラデーションと同系色に揃える) */
const lineClassMap: Record<AccentColor, string> = {
  sky: 'bg-sky-400',
  indigo: 'bg-indigo-400',
  slate: 'bg-slate-400',
  rose: 'bg-rose-400',
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  fuchsia: 'bg-fuchsia-400',
}
</script>

<template>
  <nav class="flex flex-col gap-0.5 p-3" aria-label="キャラクター一覧">
    <RouterLink
      :to="{ name: 'home' }"
      class="focus-ring mb-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      キャラクター一覧へ戻る
    </RouterLink>

    <button
      v-for="persona in personas"
      :key="persona.id"
      type="button"
      class="focus-ring relative flex cursor-pointer items-center gap-3 rounded-r-xl py-2.5 pl-4 pr-3 text-left transition"
      :class="persona.id === currentPersonaId ? 'bg-sky-50' : 'hover:bg-slate-50'"
      :aria-current="persona.id === currentPersonaId ? 'true' : undefined"
      @click="emit('select', persona.id)"
    >
      <span
        v-if="persona.id === currentPersonaId"
        class="absolute inset-y-0 left-0 w-1"
        :class="lineClassMap[persona.accent]"
        aria-hidden="true"
      />
      <Avatar :initial="persona.initial" :accent="persona.accent" size="sm" />
      <span class="min-w-0">
        <span
          class="block truncate text-sm font-semibold"
          :class="persona.id === currentPersonaId ? 'text-sky-900' : 'text-slate-800'"
        >
          {{ persona.name }}
        </span>
        <span class="block truncate text-xs text-slate-400">{{ persona.description }}</span>
      </span>
    </button>
  </nav>
</template>
