<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import { personas } from '../../services/ai/personas'
import CharacterSidebar from '../characters/CharacterSidebar.vue'
import ChatHeader from './ChatHeader.vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import Modal from '../common/Modal.vue'
import ProgressBar from '../common/ProgressBar.vue'

const props = defineProps<{
  personaId: string
}>()

const router = useRouter()
const chatStore = useChatStore()
const chat = useChat()

const isSidebarOpen = ref(false)
const isResetModalOpen = ref(false)
const messagesContainer = ref<HTMLDivElement | null>(null)

const persona = computed(() => chat.currentPersona.value)
const readiness = computed(() => chatStore.aiReadiness)

async function loadPersona(id: string) {
  const exists = personas.some((p) => p.id === id)
  if (!exists) {
    router.replace({ name: 'home' })
    return
  }
  await chat.selectPersona(id)
  scrollToBottom()
}

watch(() => props.personaId, (id) => loadPersona(id), { immediate: true })

watch(chat.currentMessages, () => {
  scrollToBottom()
}, { deep: true })

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function selectPersona(id: string) {
  isSidebarOpen.value = false
  router.push({ name: 'chat', params: { personaId: id } })
}

async function handleReset() {
  isResetModalOpen.value = false
  await chat.resetConversation()
  scrollToBottom()
}
</script>

<template>
  <div class="flex h-dvh min-h-0">
    <!-- Desktop sidebar -->
    <aside class="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-100 bg-white lg:block">
      <CharacterSidebar :current-persona-id="props.personaId" @select="selectPersona" />
    </aside>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
        @click.self="isSidebarOpen = false"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <div v-if="isSidebarOpen" class="h-full w-72 overflow-y-auto bg-white shadow-xl">
            <CharacterSidebar :current-persona-id="props.personaId" @select="selectPersona" />
          </div>
        </Transition>
      </div>
    </Transition>

    <section v-if="persona" class="flex min-w-0 flex-1 flex-col">
      <ChatHeader
        :persona="persona"
        :readiness="readiness"
        @open-sidebar="isSidebarOpen = true"
        @reset="isResetModalOpen = true"
      />

      <div
        v-if="readiness.status === 'downloadable'"
        class="flex flex-col gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>
          初回のみ、この端末にAIモデルをダウンロードする必要があります(数GB規模になる場合があります・Wi-Fi推奨)。
        </span>
        <button
          type="button"
          class="focus-ring shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 font-semibold text-white hover:bg-amber-600"
          @click="chat.startDownloadAndConnect()"
        >
          AIモデルをダウンロードして始める
        </button>
      </div>

      <div
        v-if="readiness.status === 'downloading'"
        class="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-700"
      >
        <span class="shrink-0 whitespace-nowrap">
          AIを準備しています ({{ Math.round(readiness.progress * 100) }}%)
        </span>
        <ProgressBar :value="readiness.progress" class="max-w-xs" />
      </div>

      <div
        v-if="readiness.status === 'unsupported'"
        class="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600"
      >
        このAIチャットは、Google Chrome または Microsoft Edge でご利用ください。<br />
        このサービスはブラウザ内蔵AIを利用しています({{ readiness.reason }})。
      </div>

      <div v-if="chat.errorMessage.value" class="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">
        {{ chat.errorMessage.value }}
      </div>

      <div ref="messagesContainer" class="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        <ChatMessage
          v-for="message in chat.currentMessages.value"
          :key="message.id"
          :message="message"
          :persona="persona"
        />
      </div>

      <ChatInput
        :disabled="readiness.status !== 'ready'"
        :is-sending="chat.isSending.value"
        @send="chat.send"
        @stop="chat.stop"
      />
    </section>

    <Modal v-model="isResetModalOpen" title-id="reset-modal-title">
      <h2 id="reset-modal-title" class="text-base font-bold text-slate-900">
        {{ persona?.name }}との会話をリセットしますか？
      </h2>
      <p class="mt-2 text-sm text-slate-500">
        これまでの会話履歴は削除され、元に戻すことはできません。
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          data-autofocus
          class="focus-ring rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          @click="isResetModalOpen = false"
        >
          キャンセル
        </button>
        <button
          type="button"
          class="focus-ring rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          @click="handleReset"
        >
          リセットする
        </button>
      </div>
    </Modal>
  </div>
</template>
