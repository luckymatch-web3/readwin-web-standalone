<script setup lang="ts">
withDefaults(defineProps<{
  variant: 'free' | 'vip' | 'hot' | 'new' | 'locked'
  label?: string
}>(), {})

const styles: Record<string, string> = {
  free: 'bg-[#DCFCE7] text-[#16A34A]',
  vip: 'bg-accent-100 text-accent-700',
  hot: 'bg-error-50 text-error-600',
  new: 'bg-primary-100 text-primary-700',
  locked: 'bg-secondary-100 text-secondary-500',
}
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase" :class="styles[variant]">
    {{ label || variant }}
  </span>
</template>
