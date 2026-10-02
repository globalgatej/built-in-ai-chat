import { Marked } from 'marked'
import DOMPurify from 'dompurify'

let codeBlockIndex = 0

const marked = new Marked({
  breaks: true,
  gfm: true,
})

marked.use({
  renderer: {
    code({ text, lang }) {
      const index = codeBlockIndex++
      const escaped = escapeHtml(text)
      const language = lang ? ` data-lang="${escapeHtml(lang)}"` : ''
      return `<div class="not-prose relative"><button type="button" data-copy-index="${index}" class="absolute right-2 top-2 rounded-md bg-slate-700/70 px-2 py-1 text-xs text-white hover:bg-slate-700">コピー</button><pre${language}><code>${escaped}</code></pre></div>`
    },
    // `**〜**` はMarkdownの太字ではなく、Zeta的な「状況説明(ト書き)」として扱う。
    // 例: 「**微笑みながら**「おかえり」」の**部分**を、会話本文と区別して表示する。
    strong(token) {
      return `<span class="chat-narration">${this.parser.parseInline(token.tokens)}</span>`
    },
  },
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 状況説明(`**〜**`)がセリフの文中に埋もれないよう、前後を改行で区切って独立した行にする。
 * AIが指示どおりに改行しなかった場合でも表示を揃えるための整形で、コードブロック内は対象外。
 */
function separateNarration(source: string): string {
  return source
    .split(/(```[\s\S]*?(?:```|$))/)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/\s*\*\*([^*\n]+?)\*\*\s*/g, '\n**$1**\n').replace(/\*\*\n\n\*\*/g, '**\n**'),
    )
    .join('')
    .trim()
}

/** AI応答のMarkdownを安全なHTMLへ変換する。XSS対策としてDOMPurifyで必ずサニタイズする。 */
export function renderMarkdown(source: string): string {
  codeBlockIndex = 0
  const rawHtml = marked.parse(separateNarration(source), { async: false }) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'a',
      'h1',
      'h2',
      'h3',
      'blockquote',
      'span',
      'div',
      'button',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-copy-index', 'data-lang', 'type'],
  })
}
