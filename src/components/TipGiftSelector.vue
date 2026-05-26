<script setup lang="ts">
import { ref } from 'vue'
import type { TipGift } from '@/types'
import CoinIcon from '@/components/CoinIcon.vue'

const emit = defineEmits<{ select: [gift: TipGift] }>()

const gifts: TipGift[] = [
  { type: 'rose', label: 'Rose', icon: '🌹', amount: 10 },
  { type: 'coffee', label: 'Coffee', icon: '☕', amount: 50 },
  { type: 'diamond', label: 'Diamond', icon: '💎', amount: 100 },
  { type: 'crown', label: 'Crown', icon: '🏆', amount: 500 },
  { type: 'rocket', label: 'Rocket', icon: '🚀', amount: 1000 },
  { type: 'castle', label: 'Castle', icon: '🏰', amount: 5000 },
]

const selected = ref<string | null>(null)

function selectGift(gift: TipGift) {
  selected.value = gift.type
  emit('select', gift)
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      v-for="gift in gifts" :key="gift.type"
      @click="selectGift(gift)"
      class="flex flex-col items-center gap-1 py-3 rounded-xl border transition-all"
      :class="selected === gift.type ? 'scale-105 ring-2 ring-primary-500' : 'hover:scale-[1.02]'"
      :style="{
        borderColor: selected === gift.type ? 'var(--primary-600)' : 'var(--border-default)',
        background: selected === gift.type ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
      }"
    >
      <span class="text-2xl">{{ gift.icon }}</span>
      <span class="text-xs font-semibold" style="color: var(--text-primary)">{{ gift.label }}</span>
      <span class="text-xs font-medium" style="color: var(--text-tertiary)">{{ gift.amount }} <CoinIcon size="1em" /></span>
    </button>
  </div>
</template>
