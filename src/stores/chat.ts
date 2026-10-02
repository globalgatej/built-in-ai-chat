import { defineStore } from 'pinia'
import { personas } from '../services/ai/personas'
import type { ChatMessage, AiReadiness } from '../services/ai/types'
import type { LanguageModelSession } from '../services/ai/types'

/** 会話履歴の保存先キー。sessionStorageのため、タブ/ブラウザを閉じると履歴は消える。 */
const STORAGE_KEY = 'gensokyo-ai-chat:messages'

function loadStoredMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, ChatMessage[]>) : {}
  } catch {
    // sessionStorageが使えない、または内容が壊れている場合は空の履歴で始める
    return {}
  }
}

interface ChatState {
  /** キャラクターIDごとの会話履歴(sessionStorageへ保存し、リロードでは残る) */
  messagesByPersona: Record<string, ChatMessage[]>
  currentPersonaId: string | null
  aiReadiness: AiReadiness
  isSending: boolean
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messagesByPersona: loadStoredMessages(),
    currentPersonaId: null,
    aiReadiness: { status: 'checking' },
    isSending: false,
  }),
  getters: {
    currentPersona: (state) => personas.find((p) => p.id === state.currentPersonaId) ?? null,
    currentMessages: (state): ChatMessage[] =>
      state.currentPersonaId ? (state.messagesByPersona[state.currentPersonaId] ?? []) : [],
  },
  actions: {
    setReadiness(readiness: AiReadiness) {
      this.aiReadiness = readiness
    },
    selectPersona(personaId: string) {
      this.currentPersonaId = personaId
      if (!this.messagesByPersona[personaId]) {
        this.messagesByPersona[personaId] = []
      }
    },
    appendMessage(personaId: string, message: ChatMessage) {
      if (!this.messagesByPersona[personaId]) {
        this.messagesByPersona[personaId] = []
      }
      this.messagesByPersona[personaId].push(message)
      this.persist()
    },
    updateMessageContent(personaId: string, messageId: string, content: string) {
      const list = this.messagesByPersona[personaId]
      if (!list) return
      const target = list.find((m) => m.id === messageId)
      if (target) target.content = content
    },
    finalizeMessage(personaId: string, messageId: string) {
      const list = this.messagesByPersona[personaId]
      if (!list) return
      const target = list.find((m) => m.id === messageId)
      if (target) target.pending = false
      this.persist()
    },
    clearPersonaMessages(personaId: string) {
      this.messagesByPersona[personaId] = []
      this.persist()
    },
    setSending(value: boolean) {
      this.isSending = value
    },
    /** 履歴をsessionStorageへ保存する。応答生成中の空メッセージは保存しない。 */
    persist() {
      const snapshot: Record<string, ChatMessage[]> = {}
      for (const [personaId, messages] of Object.entries(this.messagesByPersona)) {
        snapshot[personaId] = messages
          .filter((m) => m.content)
          .map(({ id, role, content, createdAt }) => ({ id, role, content, createdAt }))
      }
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      } catch (error) {
        console.error('[chatStore] persist failed', error)
      }
    },
  },
})

/** LanguageModelSessionはリアクティブにする必要がないため、Piniaのstateに含めず別管理する */
export const sessionRegistry = new Map<string, LanguageModelSession>()
