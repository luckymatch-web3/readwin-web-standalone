<script setup lang="ts">
import { onMounted } from 'vue'

defineProps<{
  chapterNo: number
  coinPrice?: number
}>()

const emit = defineEmits<{ unlock: [method: 'video' | 'coin'] }>()

onMounted(() => {
  emit('unlock', 'video')
})

function continueReading() {
  emit('unlock', 'video')
}
</script>

<template>
  <div class="unlock-card">
    <div class="p-6 text-center">
      <div class="lock-icon-wrap">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M5 5.8C5 4.8 5.8 4 6.8 4H11c.6 0 1 .4 1 1v15c0 .6-.4 1-1 1H6.8A1.8 1.8 0 015 19.2V5.8Z" fill="url(#lockGrad)" opacity=".9"/>
          <path d="M12 5c0-.6.4-1 1-1h4.2c1 0 1.8.8 1.8 1.8v13.4c0 1-.8 1.8-1.8 1.8H13c-.6 0-1-.4-1-1V5Z" fill="url(#lockGrad)" opacity=".58"/>
          <path d="M8 8h2.2M14 8h2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
          <defs><linearGradient id="lockGrad" x1="3" y1="11" x2="21" y2="22"><stop stop-color="#2563EB"/><stop offset="1" stop-color="#60A5FA"/></linearGradient></defs>
        </svg>
      </div>
      <h3 class="text-lg font-bold mb-1" style="color: var(--text-primary)">Chapter {{ chapterNo }} is Free</h3>
      <p class="text-sm mb-5" style="color: var(--text-tertiary)">All ReadWin chapters are unlocked. Continue reading and earn coins as you go.</p>

      <div class="flex flex-col gap-3">
        <button @click="continueReading" class="watch-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          <span>Continue Free Reading</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unlock-card {
  border-radius: 22px;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid rgba(191, 219, 254, 0.75);
  box-shadow: 0 24px 38px -32px rgba(15,23,42,0.32);
}
.lock-icon-wrap {
  width: 60px; height: 60px; border-radius: 18px;
  background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
}
.watch-btn {
  width: 100%; padding: 14px 20px; border-radius: 14px;
  font-weight: 700; font-size: 15px; color: white;
  background: linear-gradient(135deg, #1D4ED8, #3B82F6);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: none; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 18px 28px -20px rgba(37, 99, 235, 0.55);
}
.watch-btn:active { transform: scale(0.98); }
.coin-btn {
  width: 100%; padding: 13px 20px; border-radius: 14px;
  font-weight: 600; font-size: 14px;
  color: #92400E;
  background: linear-gradient(135deg, #FFF7DB, #FDE68A);
  border: 1.5px solid #F59E0B;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer; transition: all 0.2s;
}
.coin-btn:active { transform: scale(0.98); }
.coin-balance { font-size: 11px; opacity: 0.7; }
.video-playing-area {
  width: 100%; aspect-ratio: 16/9; border-radius: 14px;
  background: linear-gradient(135deg, #1D4ED8, #60A5FA);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.video-pulse {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
.progress-bar { width: 100%; height: 6px; border-radius: 3px; background: var(--bg-elevated); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #2563EB, #60A5FA); transition: width 1s linear; }
.loading-spinner {
  width: 36px; height: 36px; border: 3px solid var(--border-default);
  border-top-color: #2563EB; border-radius: 50%; margin: 0 auto;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
:root.dark .lock-icon-wrap { background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(96,165,250,0.18)); }
:root.dark .coin-btn { color: #FCD34D; background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.2)); border-color: #B45309; }
</style>
