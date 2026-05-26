<script setup lang="ts">
defineProps<{
  title: string
  viewAllLink?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl lg:text-2xl font-bold" style="color: var(--text-primary)">{{ title }}</h2>
    <router-link v-if="viewAllLink" :to="viewAllLink" class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
      View All →
    </router-link>
  </div>
</template>
