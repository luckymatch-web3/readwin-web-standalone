<script setup lang="ts">
withDefaults(defineProps<{ mode?: 'vertical' | 'horizontal' }>(), { mode: 'vertical' })
</script>

<template>
  <div v-if="mode === 'vertical'" class="animate-pulse">
    <div class="aspect-[3/4] rounded-lg skeleton"></div>
    <div class="mt-2 h-4 rounded skeleton w-3/4"></div>
    <div class="mt-1.5 h-3 rounded skeleton w-1/2"></div>
  </div>
  <div v-else class="flex gap-4 p-3 animate-pulse">
    <div class="w-20 aspect-[3/4] rounded-md skeleton shrink-0"></div>
    <div class="flex-1 space-y-2 py-1">
      <div class="h-4 rounded skeleton w-2/3"></div>
      <div class="h-3 rounded skeleton w-full"></div>
      <div class="h-3 rounded skeleton w-1/3"></div>
    </div>
  </div>
</template>
