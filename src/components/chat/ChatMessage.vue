<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChatMessage } from '../../services/ai/types'
import type { Persona } from '../../services/ai/personas'
import Avatar from '../common/Avatar.vue'
import { renderMarkdown } from '../../composables/useMarkdown'

const props = defineProps<{
  message: ChatMessage
  persona: Persona
}>()

const isUser = computed(() => props.message.role === 'user')
const html = computed(() => renderMarkdown(props.message.content))
const copiedBlock = ref<number | null>(null)

async function copyCodeBlock(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-copy-index]')
  if (!button) return

  const codeEl = button.parentElement?.querySelector('pre code')
  if (!codeEl) return

  await navigator.clipboard.writeText(codeEl.textContent ?? '')
  const index = Number(button.dataset.copyIndex)
  copiedBlock.value = index
  button.textContent = 'コピーしました'
  window.setTimeout(() => {
    copiedBlock.value = null
    button.textContent = 'コピー'
  }, 1500)
}
</script>

<template>
  <div class="flex gap-3" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
    <Avatar v-if="!isUser" :initial="persona.initial" :accent="persona.accent" size="sm" />
    <div v-else class="w-8 shrink-0" aria-hidden="true" />

    <div class="flex max-w-[80%] flex-col" :class="isUser ? 'items-end' : 'items-start'">
      <span v-if="!isUser" class="mb-1 text-xs font-semibold text-slate-500">{{
        persona.name
      }}</span>

      <div
        class="rounded-2xl px-4 py-2.5"
        :class="
          isUser
            ? 'rounded-tr-sm bg-sky-500 text-white'
            : 'rounded-tl-sm bg-white text-slate-800 shadow-card'
        "
      >
        <p v-if="isUser" class="whitespace-pre-wrap text-sm leading-relaxed">
          {{ message.content }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -- DOMPurify.sanitize()済みのHTMLのみを表示する -->
        <div v-else class="prose-chat" @click="copyCodeBlock" v-html="html" />
        <span
          v-if="message.pending && !message.content"
          class="inline-flex gap-1 py-1"
          aria-label="入力中"
        >
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
          <span
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0.15s]"
          />
          <span
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0.3s]"
          />
        </span>
      </div>
    </div>
  </div>
</template>
