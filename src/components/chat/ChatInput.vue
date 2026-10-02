<script setup lang="ts">
import { nextTick, ref } from 'vue'

const props = defineProps<{
  disabled: boolean
  isSending: boolean
}>()

const emit = defineEmits<{
  (e: 'send', text: string): void
  (e: 'stop'): void
}>()

const text = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function handleSubmit() {
  if (props.isSending || props.disabled) return
  const value = text.value.trim()
  if (!value) return
  emit('send', value)
  text.value = ''
  textareaRef.value?.focus()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  if (event.isComposing) return // IME変換中は送信しない
  if (event.shiftKey) return // Shift+Enterは改行

  event.preventDefault()
  handleSubmit()
}

/**
 * `**〜**`(状況説明/ト書き)を入力欄へ挿入する。
 * 選択範囲があればそれを`**`で囲み、なければ`**`と`**`の間にキャレットを置く。
 */
function insertNarration() {
  const el = textareaRef.value
  if (!el || props.disabled) return

  const start = el.selectionStart ?? text.value.length
  const end = el.selectionEnd ?? text.value.length
  const selected = text.value.slice(start, end)

  text.value = text.value.slice(0, start) + `**${selected}**` + text.value.slice(end)

  nextTick(() => {
    el.focus()
    const caret = selected ? start + selected.length + 4 : start + 2
    el.setSelectionRange(caret, caret)
  })
}
</script>

<template>
  <div class="border-t border-slate-100 bg-white px-4 py-3">
    <form
      class="flex items-end gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-1.5 transition focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-card"
      @submit.prevent="handleSubmit"
    >
      <label for="chat-input" class="sr-only">メッセージを入力</label>
      <button
        type="button"
        :disabled="disabled"
        aria-label="状況説明(**〜**)を挿入"
        title="状況説明を挿入"
        class="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        @click="insertNarration"
      >
        <span aria-hidden="true" class="text-base font-semibold">*</span>
      </button>
      <textarea
        id="chat-input"
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        rows="1"
        placeholder="メッセージを入力... (* で状況説明を挿入できます)"
        class="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-slate-400 disabled:text-slate-400"
        @keydown="handleKeydown"
      />

      <button
        v-if="!isSending"
        type="submit"
        :disabled="disabled || !text.trim()"
        class="focus-ring shrink-0 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        送信
      </button>
      <button
        v-else
        type="button"
        class="focus-ring shrink-0 rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        @click="emit('stop')"
      >
        停止
      </button>
    </form>
  </div>
</template>
