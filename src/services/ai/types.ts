/**
 * Browser Built-in AI (Chrome / Edge の LanguageModel / Prompt API) に関する型定義。
 * 標準DOM型に存在しないExperimental APIのため、このファイル内で独自に宣言する。
 * 参照: https://developer.chrome.com/docs/ai/prompt-api (2025年時点の仕様に準拠)
 */

export type AiAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available'

export interface LanguageModelExpectedInput {
  type: 'text' | 'image' | 'audio'
  languages?: string[]
}

export interface LanguageModelExpectedOutput {
  type: 'text'
  languages?: string[]
}

export type LanguageModelMessageRole = 'system' | 'user' | 'assistant'

export interface LanguageModelInitialPrompt {
  role: LanguageModelMessageRole
  content: string
}

export interface LanguageModelDownloadProgressEvent extends Event {
  loaded: number
}

export interface LanguageModelCreateMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: LanguageModelDownloadProgressEvent) => void,
  ): void
}

export interface LanguageModelCreateOptions {
  initialPrompts?: LanguageModelInitialPrompt[]
  expectedInputs?: LanguageModelExpectedInput[]
  expectedOutputs?: LanguageModelExpectedOutput[]
  temperature?: number
  topK?: number
  signal?: AbortSignal
  monitor?: (monitor: LanguageModelCreateMonitor) => void
}

export interface LanguageModelPromptOptions {
  signal?: AbortSignal
}

export interface LanguageModelSession {
  readonly inputUsage?: number
  readonly inputQuota?: number
  prompt(input: string, options?: LanguageModelPromptOptions): Promise<string>
  promptStreaming(input: string, options?: LanguageModelPromptOptions): ReadableStream<string>
  clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>
  destroy(): void
  addEventListener?(type: 'quotaoverflow', listener: () => void): void
}

export interface LanguageModelStatic {
  availability(options?: {
    expectedInputs?: LanguageModelExpectedInput[]
    expectedOutputs?: LanguageModelExpectedOutput[]
  }): Promise<AiAvailability>
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>
  params?(): Promise<{
    defaultTopK: number
    maxTopK: number
    defaultTemperature: number
    maxTemperature: number
  } | null>
}

declare global {
  var LanguageModel: LanguageModelStatic | undefined
}

/** アプリ内で扱うチャットメッセージ(role: system は履歴には含めず内部でのみ利用) */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  /** ストリーミング中かどうか(UI表示制御用) */
  pending?: boolean
}

/**
 * AIの利用可否や準備状況をUIへ伝えるための状態。
 * 'downloadable' は「まだダウンロードを開始していない(ユーザーの同意が必要)」状態を表す。
 * 'downloading' は既にダウンロードが進行中の状態を表す(ユーザーが同意した後、または
 * 他タブ等で既に開始済みの場合)。この区別により、ユーザーの同意なしに
 * 数GB規模のモデルダウンロードが自動で始まることを防ぐ。
 */
export type AiReadiness =
  | { status: 'checking' }
  | { status: 'unsupported'; reason: string }
  | { status: 'downloadable' }
  | { status: 'downloading'; progress: number }
  | { status: 'ready' }
  | { status: 'error'; message: string }
