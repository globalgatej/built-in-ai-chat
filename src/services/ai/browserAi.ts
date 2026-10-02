/**
 * Chrome / Edge の Browser Built-in AI (LanguageModel / Prompt API) を扱う唯一の窓口。
 * Experimental APIへの依存はすべてこのファイル内に閉じ込め、Vue側は
 * 「使えるか」「セッションを作る」「送る」「止める」という抽象化された関数だけを呼ぶ。
 *
 * 特定モデル名(Gemini Nano等)へ強く依存しない「Browser Built-in AI Chat」として設計する。
 */
import type {
  AiAvailability,
  ChatMessage,
  LanguageModelCreateOptions,
  LanguageModelSession,
} from './types'

const JA_INPUT_OUTPUT = {
  expectedInputs: [{ type: 'text' as const, languages: ['ja'] }],
  expectedOutputs: [{ type: 'text' as const, languages: ['ja'] }],
}

/** このブラウザにLanguageModel APIが存在するかどうかの機能検出 */
export function isLanguageModelApiPresent(): boolean {
  return typeof globalThis.LanguageModel !== 'undefined'
}

/**
 * 実際の利用可否を確認する。
 * API自体は存在してもモデルがunavailableな場合があるため、availability()で確認する。
 */
export async function checkAvailability(): Promise<AiAvailability> {
  if (!isLanguageModelApiPresent()) return 'unavailable'
  try {
    return await globalThis.LanguageModel!.availability(JA_INPUT_OUTPUT)
  } catch (error) {
    console.error('[browserAi] availability check failed', error)
    return 'unavailable'
  }
}

export interface CreateSessionParams {
  options: LanguageModelCreateOptions
  onDownloadProgress?: (progress: number) => void
  signal?: AbortSignal
}

/** 新しいAIセッションを作成する。モデル未ダウンロード時は進捗をコールバックする。 */
export async function createSession(params: CreateSessionParams): Promise<LanguageModelSession> {
  if (!isLanguageModelApiPresent()) {
    throw new AiUnsupportedError('このブラウザではAI機能が利用できません。')
  }

  const { options, onDownloadProgress, signal } = params

  try {
    return await globalThis.LanguageModel!.create({
      ...JA_INPUT_OUTPUT,
      ...options,
      signal,
      monitor(monitor) {
        monitor.addEventListener('downloadprogress', (event) => {
          onDownloadProgress?.(event.loaded)
        })
      },
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    console.error('[browserAi] createSession failed', error)
    throw new AiCreateSessionError('AIモデルの準備に失敗しました。')
  }
}

export interface SendMessageParams {
  session: LanguageModelSession
  message: string
  signal?: AbortSignal
  onChunk: (chunkText: string, fullText: string) => void
}

/**
 * メッセージを送信し、ストリーミングで応答を受け取る。
 * promptStreaming()が利用できない環境向けにprompt()へのフォールバックも用意する。
 */
export async function sendMessage(params: SendMessageParams): Promise<string> {
  const { session, message, signal, onChunk } = params

  if (typeof session.promptStreaming !== 'function') {
    try {
      const full = await session.prompt(message, { signal })
      onChunk(full, full)
      return full
    } catch (error) {
      throw normalizePromptError(error)
    }
  }

  let fullText = ''
  try {
    const stream = session.promptStreaming(message, { signal })
    const reader = stream.getReader()

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        fullText += value
        onChunk(value, fullText)
      }
    }
    return fullText
  } catch (error) {
    throw normalizePromptError(error)
  }
}

function normalizePromptError(error: unknown): Error {
  if (isAbortError(error)) return error as Error
  console.error('[browserAi] sendMessage failed', error)
  return new AiPromptError('AIからの応答生成に失敗しました。')
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** 直近履歴からChatMessage形式へ変換するヘルパー */
export function toChatMessage(
  id: string,
  role: 'user' | 'assistant',
  content: string,
  createdAt: number,
): ChatMessage {
  return { id, role, content, createdAt }
}

export class AiUnsupportedError extends Error {}
export class AiCreateSessionError extends Error {}
export class AiPromptError extends Error {}
