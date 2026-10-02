<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useBrowserAI } from './composables/useBrowserAI'

const { detect } = useBrowserAI()

onMounted(detect)
</script>

<template>
  <div class="min-h-screen">
    <RouterView />
  </div>
</template>
