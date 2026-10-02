import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages(https://<user>.github.io/<repo>/)ではサブパス配信になるため、
  // デプロイ用ワークフローがVITE_BASEへ `/<repo>/` を渡す。未指定時(ローカル等)は `/`。
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
})
