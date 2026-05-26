<script setup lang="ts">
withDefaults(defineProps<{ title?: string; message?: string }>(), {
  title: 'Coming Soon',
  message: 'This feature is under development. Stay tuned!'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 px-4">
    <p class="text-5xl mb-4">🚧</p>
    <p class="text-2xl font-bold mb-2" style="color: var(--text-primary)">{{ title }}</p>
    <p class="text-sm text-center max-w-sm" style="color: var(--text-tertiary)">{{ message }}</p>
  </div>
</template>
