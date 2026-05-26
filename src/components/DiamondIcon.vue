<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), { size: '1em' })
</script>

<template>
  <svg class="inline-block align-text-bottom" :style="{ width: size, height: size }" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="diamondBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#93C5FD"/>
        <stop offset="40%" stop-color="#60A5FA"/>
        <stop offset="100%" stop-color="#2563EB"/>
      </linearGradient>
      <linearGradient id="diamondShine" x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>
    <polygon points="50,10 90,40 50,90 10,40" fill="url(#diamondBlue)" stroke="#3B82F6" stroke-width="2"/>
    <polygon points="50,10 70,40 50,90 30,40" fill="rgba(255,255,255,0.15)"/>
    <polygon points="50,10 30,40 10,40" fill="url(#diamondShine)"/>
    <line x1="10" y1="40" x2="90" y2="40" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  </svg>
</template>
