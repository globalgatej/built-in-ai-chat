import { computed, ref, watch } from 'vue'
import { useChatStore, sessionRegistry } from '../stores/chat'
import { getPersonaById, type Persona } from '../services/ai/personas'
import { buildInitialPrompts } from '../services/ai/context'
import {
  createSession,
  sendMessage as sendToAi,
  isAbortError,
  AiUnsupportedError,
  AiCreateSessionError,
  AiPromptError,
} from '../services/ai/browserAi'
import type { ChatMessage } from '../services/ai/types'

/** 一言目を一文字ずつ表示するときの、1文字あたりの間隔(ミリ秒) */
const GREETING_CHAR_INTERVAL_MS = 35

function createMessageId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * キャラクター選択・チャット送信・セッション管理を統括するcomposable。
 * Vueコンポーネントはここから提供される関数だけを呼び出せばよい。
 */
export function useChat() {
  const chatStore = useChatStore()

  const errorMessage = ref<string | null>(null)
  const downloadProgress = ref(0)
  const abortController = ref<AbortController | null>(null)

  const currentPersona = computed(() => chatStore.currentPersona)
  const currentMessages = computed(() => chatStore.currentMessages)
  const isSending = computed(() => chatStore.isSending)

  /** キャラクター側から話しかける一言目のメッセージを作る */
  function createGreeting(persona: Persona): ChatMessage {
    return {
      id: createMessageId(),
      role: 'assistant',
      content: persona.greetings[Math.floor(Math.random() * persona.greetings.length)],
      createdAt: Date.now(),
    }
  }

  /**
   * 一言目を、AIの応答と同じように一文字ずつ表示する。
   * 表示中は送信中と同じ扱いにし、停止ボタンが押されたら残りを一度に表示する。
   */
  async function typeGreeting(personaId: string, greeting: ChatMessage): Promise<void> {
    chatStore.appendMessage(personaId, { ...greeting, content: '', pending: true })
    chatStore.setSending(true)
    const controller = new AbortController()
    abortController.value = controller

    const chars = Array.from(greeting.content)
    for (let i = 1; i <= chars.length && !controller.signal.aborted; i++) {
      await new Promise((resolve) => window.setTimeout(resolve, GREETING_CHAR_INTERVAL_MS))
      chatStore.updateMessageContent(personaId, greeting.id, chars.slice(0, i).join(''))
    }

    chatStore.updateMessageContent(personaId, greeting.id, greeting.content)
    chatStore.finalizeMessage(personaId, greeting.id)
    chatStore.setSending(false)
    abortController.value = null
  }

  /**
   * キャラクターを選択する。
   * 履歴があればそのまま続きから、なければAIの準備完了後にキャラクターからの一言目で会話を始める。
   */
  async function selectPersona(personaId: string): Promise<void> {
    errorMessage.value = null
    const persona = getPersonaById(personaId)
    if (!persona) return

    chatStore.selectPersona(personaId)
    await ensureSession(personaId)
  }

  /**
   * ユーザーがダウンロードに同意した際に呼び出す。
   * 'downloadable'状態からのみ明示的にAIセッション作成(=モデルダウンロード開始)を行う。
   */
  async function startDownloadAndConnect(): Promise<void> {
    const persona = currentPersona.value
    if (!persona) return
    await ensureSession(persona.id, { allowDownload: true })
  }

  /** AIの利用可否の確認(useBrowserAIのdetect)が終わるまで待つ */
  function waitForDetection(): Promise<void> {
    if (chatStore.aiReadiness.status !== 'checking') return Promise.resolve()
    return new Promise((resolve) => {
      const stop = watch(
        () => chatStore.aiReadiness.status,
        (status) => {
          if (status === 'checking') return
          stop()
          resolve()
        },
      )
    })
  }

  /**
   * キャラクターごとのAIセッションを、必要な場合のみ作成する(全員分を常時作らない)。
   * これまでの会話がない場合は、セッションの準備が完了した時点で一言目を表示する。
   *
   * モデルが未ダウンロード('downloadable')の場合、create()を呼ぶとダウンロードが始まるため、
   * ユーザーが明示的に同意した(allowDownload)ときだけ作成する。利用可否の確認が終わる前に
   * 呼ばれても判定をすり抜けないよう、確認の完了を待ってから判定する。
   */
  async function ensureSession(
    personaId: string,
    { allowDownload = false }: { allowDownload?: boolean } = {},
  ): Promise<void> {
    if (sessionRegistry.has(personaId)) return

    await waitForDetection()
    if (chatStore.aiReadiness.status === 'downloadable' && !allowDownload) return
    if (sessionRegistry.has(personaId)) return

    const persona = getPersonaById(personaId)
    if (!persona) return

    try {
      const history = chatStore.messagesByPersona[personaId] ?? []
      // 一言目はAIの文脈にも含めるため、表示より先にinitialPromptsへ渡しておく
      const greeting = history.length === 0 ? createGreeting(persona) : null
      const initialPrompts = buildInitialPrompts(persona, greeting ? [greeting] : history)

      const session = await createSession({
        options: { initialPrompts },
        onDownloadProgress: (progress) => {
          downloadProgress.value = progress
          chatStore.setReadiness({ status: 'downloading', progress })
        },
      })

      // 準備中に同じキャラクターのセッションが作られていた場合は、後から出来た方を破棄する
      if (sessionRegistry.has(personaId)) {
        session.destroy()
        return
      }

      sessionRegistry.set(personaId, session)
      chatStore.setReadiness({ status: 'ready' })
      if (greeting && (chatStore.messagesByPersona[personaId] ?? []).length === 0) {
        await typeGreeting(personaId, greeting)
      }
    } catch (error) {
      if (error instanceof AiUnsupportedError) {
        chatStore.setReadiness({ status: 'unsupported', reason: error.message })
        return
      }
      if (error instanceof AiCreateSessionError) {
        errorMessage.value = error.message
        return
      }
      console.error('[useChat] ensureSession failed', error)
      errorMessage.value = 'AIセッションの初期化に失敗しました。'
    }
  }

  /** メッセージを送信し、ストリーミングでAI応答を受け取る */
  async function send(text: string): Promise<void> {
    const persona = currentPersona.value
    const trimmed = text.trim()
    if (!persona || !trimmed || chatStore.isSending) return

    errorMessage.value = null

    let session = sessionRegistry.get(persona.id)
    if (!session) {
      await ensureSession(persona.id)
      session = sessionRegistry.get(persona.id)
    }
    if (!session) {
      errorMessage.value = 'AIの準備ができていません。しばらくしてから再度お試しください。'
      return
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    }
    chatStore.appendMessage(persona.id, userMessage)

    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      pending: true,
    }
    chatStore.appendMessage(persona.id, assistantMessage)

    chatStore.setSending(true)
    const controller = new AbortController()
    abortController.value = controller

    try {
      await sendToAi({
        session,
        message: trimmed,
        signal: controller.signal,
        onChunk: (_chunk, full) => {
          chatStore.updateMessageContent(persona.id, assistantMessage.id, full)
        },
      })

      chatStore.finalizeMessage(persona.id, assistantMessage.id)
    } catch (error) {
      chatStore.finalizeMessage(persona.id, assistantMessage.id)

      if (isAbortError(error)) {
        if (!assistantMessage.content) {
          chatStore.updateMessageContent(persona.id, assistantMessage.id, '(生成を停止しました)')
        }
      } else if (error instanceof AiPromptError) {
        errorMessage.value = error.message
      } else {
        console.error('[useChat] send failed', error)
        errorMessage.value = 'メッセージの送信中にエラーが発生しました。'
      }
    } finally {
      chatStore.setSending(false)
      chatStore.persist()
      abortController.value = null
    }
  }

  function stop(): void {
    abortController.value?.abort()
  }

  /** 現在選択中のキャラクターとの会話のみをリセットする */
  async function resetConversation(): Promise<void> {
    const persona = currentPersona.value
    if (!persona) return

    errorMessage.value = null

    const existingSession = sessionRegistry.get(persona.id)
    existingSession?.destroy()
    sessionRegistry.delete(persona.id)

    chatStore.clearPersonaMessages(persona.id)
    await ensureSession(persona.id)
  }

  return {
    currentPersona,
    currentMessages,
    isSending,
    errorMessage,
    downloadProgress,
    selectPersona,
    startDownloadAndConnect,
    send,
    stop,
    resetConversation,
  }
}
