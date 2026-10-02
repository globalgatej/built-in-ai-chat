<script setup lang="ts">
import { useRouter } from 'vue-router'
import { personas } from '../../services/ai/personas'
import CharacterCard from './CharacterCard.vue'

const router = useRouter()

function handleSelect(personaId: string) {
  router.push({ name: 'chat', params: { personaId } })
}
</script>

<template>
  <section class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <CharacterCard
      v-for="persona in personas"
      :key="persona.id"
      :persona="persona"
      @select="handleSelect"
    />
  </section>
</template>
