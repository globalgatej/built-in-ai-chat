<script setup lang="ts">
import CharacterSelector from '../components/characters/CharacterSelector.vue'
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <section class="text-center">
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-sky-100/70 px-3 py-1 text-xs font-medium text-sky-700"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
        ブラウザ内蔵AI・API不要
      </span>

      <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        今日は、誰と話す？
      </h1>
      <p class="mt-3 text-sm text-slate-500 sm:text-base">
        7人のAIから、今の気分に合う相手を選んで話してみよう。
      </p>
      <p class="mt-1 text-xs text-slate-400">
        ログイン不要。会話はあなたのブラウザ内のAIで処理され、ブラウザを閉じると消えます。
      </p>
    </section>

    <div class="mt-10 sm:mt-12">
      <CharacterSelector />
    </div>
  </div>
</template>
