# 幻想郷 Browser AI Chat

ブラウザ内蔵AI(Chrome / Edge の Prompt API)だけで動く、キャラクター選択型AIチャットWebアプリです。
外部LLM API(OpenAI / Claude / Gemini API等)は一切使用しません。AI推論はすべてユーザーのブラウザ内で実行されます。

## Overview

- 7人の異なる人格を持つAIキャラクターから1人を選び、継続的に会話できます
- AI推論はブラウザ内蔵の `LanguageModel` (Prompt API) で実行され、APIキーやAI利用料は不要です
- ログイン機能はありません。誰でもそのまま会話できます
- 会話履歴はブラウザの `sessionStorage` に保存され、リロードでは残り、タブ/ブラウザを閉じると消えます(サーバーには一切送信しません)
- これまでの会話がないキャラクターを選ぶと、キャラクター側から一言目を話しかけてきます
- Firebase Hostingで公開できる構成です

## Tech Stack

- Vue 3 (Composition API) + Vite + TypeScript
- Vue Router / Pinia
- Tailwind CSS v4
- Firebase Hosting(公開用。Firebase SDKは使用しません)
- Chrome / Edge Browser Built-in AI (`LanguageModel` / Prompt API)
- marked + DOMPurify (Markdown表示 / XSS対策)

## Requirements

- Node.js 20以降推奨
- Google Chrome または Microsoft Edge(AIチャット機能の利用に必要)
- Firebaseアカウント(Firebase Hostingへ公開する場合のみ)

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Chrome / Edge Built-in AI setup

このアプリはChrome / Edgeの実験的なBrowser Built-in AI (`LanguageModel` / Prompt API) を使用します。

- 対応ブラウザ: 最新版のGoogle ChromeまたはMicrosoft Edge(デスクトップ)
- ブラウザによっては `chrome://flags` 等でAI機能を有効化する必要がある場合があります。有効化手順は変更されることがあるため、各ブラウザの公式ドキュメント(Chrome: `developer.chrome.com/docs/ai/prompt-api`)を確認してください
- 初回利用時にAIモデルのダウンロードが必要になることがあります(進捗はアプリ内に表示されます)
- Safari / Firefox 等、Prompt APIが存在しないブラウザでは、チャット機能の代わりに非対応の案内が表示されます(アプリ自体はクラッシュしません)

## GitHub Pages

`main` ブランチへpushすると、`.github/workflows/deploy.yml` がビルドしてGitHub Pagesへ公開します。

- リポジトリの Settings → Pages → Source を「GitHub Actions」にしてください
- 公開URLは `https://<ユーザー名>.github.io/<リポジトリ名>/` です(サブパスはワークフローが `VITE_BASE` として自動で渡します)
- `/chat/...` を直接開いたりリロードしたりできるよう、`index.html` を `404.html` としても配置しています

## Firebase Setup

公開にFirebase Hostingを使う場合のみ必要です(環境変数の設定は不要です)。

1. [Firebase Console](https://console.firebase.google.com/) にログインし、プロジェクトを作成
2. 下記「Firebase CLI」の手順で `.firebaserc` に対象プロジェクトを反映
3. `npm run deploy` で公開

## Firebase CLI

```bash
npm install
npm install -g firebase-tools

firebase login
firebase use --add   # 対象のFirebaseプロジェクトを選択し、.firebaserc に反映

npm run build
firebase deploy
```

`.firebaserc` の `default` は `YOUR_FIREBASE_PROJECT_ID` のままになっているので、
`firebase use --add` を実行して実際のプロジェクトIDに置き換えてください。

## Build

```bash
npm run build
```

## Deploy

```bash
npm run deploy
# 内部的には: npm run build && firebase deploy
```

## Scripts

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run preview` | ビルド結果のプレビュー |
| `npm run typecheck` | 型チェックのみ |
| `npm run lint` | ESLint実行 |
| `npm run deploy` | ビルド + Firebase Hostingへデプロイ |

## ディレクトリ構成

```
src/
  components/
    characters/     キャラクターカード・選択画面・サイドバー
    chat/          チャットヘッダー・メッセージ・入力・チャット画面本体
    common/        Modal / Loading / AiStatus / Avatar
  composables/
    useChat.ts       チャット送受信・セッション管理・一言目の挨拶の中心ロジック
    useBrowserAI.ts  Browser Built-in AIの利用可否検出
    useMarkdown.ts   AI応答のMarkdown→安全なHTML変換
  services/
    ai/            Browser Built-in AIラッパー(Vueに依存しない)
      browserAi.ts   LanguageModel APIの生呼び出しをすべてここに閉じ込める
      personas.ts    7人格のSystem Prompt・一言目の挨拶の定義
      context.ts     履歴からinitialPromptsを構築(将来の要約対応を見据えた独立関数)
      types.ts       LanguageModel関連の型定義
  stores/          Pinia(チャット状態・sessionStorageへの履歴保存)
  views/           HomeView / CharacterChatView
  router/          Vue Router設定
```

## 制約・既知の注意点

- Browser Built-in AI (Prompt API) は実験的な仕様であり、Chrome / Edgeの実装によって挙動が変わる可能性があります
- モデル未ダウンロードの端末では、初回利用時にダウンロードが必要です(ダウンロードには時間がかかる場合があります)
- スマートフォン等、Prompt APIが利用できない環境ではAIチャット機能自体は利用できません(UIはクラッシュせず、非対応の案内を表示します)
