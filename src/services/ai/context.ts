/**
 * LanguageModelセッション再構築用のコンテキスト(initialPrompts)構築ロジック。
 * Vue/Piniaから独立させ、将来的な要約対応(古い会話をAIで要約してMemory化する)にも
 * 差し替えやすいよう単独関数として切り出している。
 */
import type { ChatMessage } from './types'
import type { LanguageModelInitialPrompt } from './types'
import { buildFullSystemPrompt, type Persona } from './personas'

/** 直近何メッセージ分まで履歴として保持するか(概算のコンテキスト上限対策) */
const MAX_HISTORY_MESSAGES = 40

/**
 * 永続化されたメッセージ履歴から、LanguageModel.create()へ渡すinitialPromptsを構築する。
 * 古いメッセージは除外し、直近の会話を優先する。System Promptは常に先頭に残す。
 */
export function buildInitialPrompts(
  persona: Persona,
  history: ChatMessage[],
): LanguageModelInitialPrompt[] {
  const trimmed = trimHistory(history, MAX_HISTORY_MESSAGES)

  const prompts: LanguageModelInitialPrompt[] = [
    { role: 'system', content: buildFullSystemPrompt(persona) },
  ]

  for (const message of trimmed) {
    prompts.push({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    })
  }

  return prompts
}

/**
 * 古い会話を除外し、直近の会話を優先して残す。
 * 将来的にはここで「除外されたメッセージをAI要約してMemoryへ格納する」処理へ拡張できる。
 */
export function trimHistory(history: ChatMessage[], maxMessages: number): ChatMessage[] {
  if (history.length <= maxMessages) return history
  return history.slice(history.length - maxMessages)
}
