<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace('/reward')
})
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-6 text-center" style="background: var(--bg-primary); color: var(--text-primary)">
    <div>
      <p class="text-xs uppercase tracking-[0.3em]" style="color: var(--text-tertiary)">ReadWin Rewards</p>
      <h1 class="mt-3 text-2xl font-bold">All chapters are free now.</h1>
      <p class="mt-2 text-sm" style="color: var(--text-secondary)">Sending you to the reward center.</p>
    </div>
  </main>
</template>
