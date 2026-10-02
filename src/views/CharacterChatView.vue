<script setup lang="ts">
import ChatView from '../components/chat/ChatView.vue'

defineProps<{
  personaId: string
}>()
</script>

<template>
  <ChatView :persona-id="personaId" />
</template>
