import { computed } from 'vue'
import { useChatStore } from '../stores/chat'
import { checkAvailability, isLanguageModelApiPresent } from '../services/ai/browserAi'

/**
 * Browser Built-in AIの利用可否をチェックし、chat storeのaiReadinessへ反映する。
 * Vueコンポーネントはこの結果(readiness)だけを見て表示を切り替える。
 */
export function useBrowserAI() {
  const chatStore = useChatStore()

  async function detect(): Promise<void> {
    chatStore.setReadiness({ status: 'checking' })

    if (!isLanguageModelApiPresent()) {
      chatStore.setReadiness({
        status: 'unsupported',
        reason: 'このブラウザにはBrowser Built-in AIが搭載されていません。',
      })
      return
    }

    try {
      const availability = await checkAvailability()

      if (availability === 'unavailable') {
        chatStore.setReadiness({
          status: 'unsupported',
          reason: 'AIモデルの準備が完了していないか、この端末では利用できません。',
        })
        return
      }

      if (availability === 'downloadable') {
        // まだダウンロードが始まっていない状態。ユーザーの明示的な同意なしに
        // create()を呼んでダウンロードを開始させないよう、ここでは待機する。
        chatStore.setReadiness({ status: 'downloadable' })
        return
      }

      if (availability === 'downloading') {
        // 既にダウンロードが進行中(このアプリ内での同意後、または他タブ等で開始済み)。
        chatStore.setReadiness({ status: 'downloading', progress: 0 })
        return
      }

      chatStore.setReadiness({ status: 'ready' })
    } catch (error) {
      console.error('[useBrowserAI] detect failed', error)
      chatStore.setReadiness({
        status: 'error',
        message: 'AIの利用可否確認中にエラーが発生しました。',
      })
    }
  }

  const readiness = computed(() => chatStore.aiReadiness)
  const isReady = computed(() => chatStore.aiReadiness.status === 'ready')
  const isUnsupported = computed(() => chatStore.aiReadiness.status === 'unsupported')

  return { detect, readiness, isReady, isUnsupported }
}
