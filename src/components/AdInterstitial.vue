<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{ close: [] }>()

const countdown = ref(5)
const canClose = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      canClose.value = true
      if (timer) clearInterval(timer)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="relative w-[90vw] max-w-md rounded-2xl overflow-hidden shadow-2xl" style="background: var(--bg-card)">
        <!-- Close button -->
        <button
          v-if="canClose"
          @click="emit('close')"
          class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >✕</button>
        <div v-else class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-xs font-bold">
          {{ countdown }}
        </div>

        <!-- Real interstitials are served by the native ad bridge; this shell is only a close gate fallback. -->
        <div class="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-amber-500 to-pink-500 text-white p-8">
          <span class="text-4xl">📖</span>
          <p class="text-lg font-bold">Reader Break</p>
          <p class="text-sm opacity-90 text-center">All chapters are free. Your story will resume as soon as this break ends.</p>
          <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-8148693514304068" data-ad-slot="1533988493" data-ad-format="auto"></ins>
        </div>

        <!-- Bottom bar -->
        <div class="p-4 text-center">
          <p v-if="!canClose" class="text-sm" style="color: var(--text-tertiary)">Ad closes in {{ countdown }}s...</p>
          <button v-else @click="emit('close')" class="px-6 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            Return to Free Reading
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
