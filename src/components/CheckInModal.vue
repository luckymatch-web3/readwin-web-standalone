<script setup lang="ts">
import { ref } from 'vue'
import { useEngagementStore } from '@/stores/engagement'
import { useUserStore } from '@/stores/user'
import CoinIcon from '@/components/CoinIcon.vue'
import { useToastStore } from '@/stores/toast'

const emit = defineEmits(['close'])
const engagementStore = useEngagementStore()
const userStore = useUserStore()

const toastStore = useToastStore()
const loading = ref(false)
const result = ref<any>(null)
const error = ref('')

const STREAK_COINS = [10, 15, 20, 25, 30, 40, 80]
const STREAK_DIAMONDS = [0, 0, 1, 0, 1, 0, 3]

async function doCheckIn() {
  loading.value = true
  error.value = ''
  try {
    const data = await engagementStore.checkIn()
    result.value = data
    // Update coin balance if returned
    if (data?.coin_balance != null && userStore.user) {
      userStore.user.coin_balance = data.coin_balance
    }
  } catch (e: any) {
    error.value = e.message || 'Check-in failed'
    toastStore.show('Check-in failed', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <div style="background-color: var(--bg-card)" class="rounded-2xl p-6 w-[340px] max-w-[90vw] shadow-xl" @click.stop>
      <h2 class="text-lg font-bold text-center mb-4" style="color: var(--text-primary)">📅 Daily Check-In</h2>

      <!-- Week streak display -->
      <div class="grid grid-cols-7 gap-1 mb-4">
        <div v-for="(coins, i) in STREAK_COINS" :key="i"
          class="text-center py-2 rounded-lg text-xs"
          :style="{
            background: (engagementStore.checkinStatus?.streak || 0) > i ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : 'var(--bg-elevated)',
            color: (engagementStore.checkinStatus?.streak || 0) > i ? 'white' : 'var(--text-tertiary)',
          }">
          <div class="font-bold">{{ i + 1 }}</div>
          <div>+{{ coins }}🪙</div>
          <div v-if="STREAK_DIAMONDS[i]" class="text-[10px]">+{{ STREAK_DIAMONDS[i] }}💎</div>
        </div>
      </div>

      <!-- Check-in button or result -->
      <div v-if="result" class="text-center py-4">
        <p class="text-3xl mb-2">🎉</p>
        <p class="font-bold text-lg" style="color: var(--text-primary)">+{{ result.coins_earned || result.coins || 10 }} <CoinIcon size="16px" /></p>
        <p v-if="result.diamonds_earned" class="font-semibold text-sm text-blue-500">+{{ result.diamonds_earned }} 💎</p>
        <p class="text-xs mt-1" style="color: var(--text-tertiary)">🔥 {{ result.streak || engagementStore.streak }} day streak!</p>
        <button @click="emit('close')" class="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold">OK</button>
      </div>

      <div v-else-if="engagementStore.checkinStatus?.checked_today" class="text-center py-4">
        <p class="text-3xl mb-2">✅</p>
        <p class="font-semibold" style="color: var(--text-primary)">Already checked in today!</p>
        <p class="text-xs mt-1" style="color: var(--text-tertiary)">Come back tomorrow 🔥{{ engagementStore.checkinStatus?.streak || 0 }}</p>
        <button @click="emit('close')" class="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold">OK</button>
      </div>

      <div v-else class="text-center">
        <p v-if="error" class="text-red-500 text-xs mb-2">{{ error }}</p>
        <button @click="doCheckIn" :disabled="loading"
          class="w-full py-3 rounded-lg text-sm font-bold text-white transition-all"
          :style="{ background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }">
          {{ loading ? 'Checking in...' : '📅 Check In Now' }}
        </button>
      </div>

      <button @click="emit('close')" class="absolute top-3 right-3 text-lg" style="color: var(--text-tertiary)">✕</button>
    </div>
  </div>
</template>
