<script setup lang="ts">
import { computed } from 'vue'
import type { AccentColor, Persona } from '../../services/ai/personas'
import Avatar from '../common/Avatar.vue'

const props = defineProps<{
  persona: Persona
}>()

const emit = defineEmits<{
  (e: 'select', personaId: string): void
}>()

/** カード上部のごく淡いウォッシュ(キャラクターのアクセントカラーを控えめに反映) */
const washClass = computed(() => {
  const map: Record<AccentColor, string> = {
    sky: 'from-sky-50',
    indigo: 'from-indigo-50',
    slate: 'from-slate-100',
    rose: 'from-rose-50',
    cyan: 'from-cyan-50',
    amber: 'from-amber-50',
    fuchsia: 'from-fuchsia-50',
  }
  return map[props.persona.accent]
})

function select() {
  emit('select', props.persona.id)
}
</script>

<template>
  <article
    class="group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-2xl bg-white p-6 text-center shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    @click="select"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent opacity-70"
      :class="washClass"
      aria-hidden="true"
    />

    <Avatar class="relative" :initial="persona.initial" :accent="persona.accent" size="lg" />

    <h3 class="relative mt-4 text-lg font-bold text-slate-900">{{ persona.name }}</h3>
    <p class="relative mt-0.5 text-xs text-slate-400">{{ persona.role }}</p>
    <p class="relative mt-2 text-sm leading-relaxed text-slate-600">{{ persona.description }}</p>

    <div class="relative mt-3 flex flex-wrap justify-center gap-1.5">
      <span
        v-for="tag in persona.tags"
        :key="tag"
        class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500"
      >
        #{{ tag }}
      </span>
    </div>

    <button
      type="button"
      class="focus-ring relative mt-5 w-full cursor-pointer rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-sky-600"
      @click.stop="select"
    >
      話してみる
    </button>
  </article>
</template>
