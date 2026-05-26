<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), { size: '1em' })
</script>

<template>
  <svg class="inline-block align-text-bottom" :style="{ width: size, height: size }" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="30%" stop-color="#FFEC80"/>
        <stop offset="60%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#B8860B"/>
      </linearGradient>
      <linearGradient id="coinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#DAA520"/>
        <stop offset="100%" stop-color="#8B6914"/>
      </linearGradient>
      <linearGradient id="coinShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.6)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>
    <!-- Outer edge / shadow -->
    <circle cx="50" cy="52" r="44" fill="#8B6914" opacity="0.4"/>
    <!-- Coin body -->
    <circle cx="50" cy="50" r="44" fill="url(#coinEdge)"/>
    <circle cx="50" cy="50" r="40" fill="url(#coinGold)"/>
    <!-- Inner ring -->
    <circle cx="50" cy="50" r="34" fill="none" stroke="#DAA520" stroke-width="2"/>
    <!-- Letter R -->
    <text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="#8B6914">R</text>
    <text x="49.5" y="49.5" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="#B8860B">R</text>
    <!-- Shine highlight -->
    <ellipse cx="36" cy="36" rx="18" ry="14" fill="url(#coinShine)" transform="rotate(-30 36 36)"/>
  </svg>
</template>
