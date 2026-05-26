<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
  actionTo?: string
  actionText?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <span class="text-5xl mb-4">{{ icon }}</span>
    <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary)">{{ title }}</h3>
    <p class="text-sm mb-6 text-center max-w-xs" style="color: var(--text-secondary)">{{ description }}</p>
    <router-link v-if="actionTo" :to="actionTo" class="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition">{{ actionText }}</router-link>
  </div>
</template>
