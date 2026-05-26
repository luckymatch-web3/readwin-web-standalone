<template>
  <div class="flex items-center" :class="interactive ? 'cursor-pointer' : ''">
    <button
      v-for="i in 5" :key="i"
      :class="interactive ? 'min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform active:scale-90 hover:scale-110 cursor-pointer' : 'px-0.5'"
      @click="interactive && $emit('rate', i)"
      @mouseenter="interactive && (hoverVal = i)"
      @mouseleave="interactive && (hoverVal = 0)"
    >
      {{ i <= displayVal ? '⭐' : '☆' }}
    </button>
    <span v-if="count !== undefined" class="text-xs ml-1" style="color: var(--text-tertiary)">({{ count }})</span>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
const props = defineProps<{
  rating?: number
  count?: number
  size?: string
  modelValue?: number
  interactive?: boolean
}>()
defineEmits(['rate', 'update:modelValue'])

const hoverVal = ref(0)
const displayVal = computed(() => hoverVal.value || props.modelValue || Math.round(props.rating || 0))
</script>
