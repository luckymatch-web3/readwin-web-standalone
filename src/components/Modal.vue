<script setup lang="ts">
defineProps<{ show: boolean; title?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <transition name="modal-backdrop">
      <div v-if="show" class="fixed inset-0 z-[100] bg-[rgba(15,23,42,0.5)]" @click="emit('close')" />
    </transition>
    <transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div class="relative w-full max-w-md rounded-2xl shadow-lg p-6 pointer-events-auto" style="background-color: var(--bg-elevated)">
          <div v-if="title" class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold" style="color: var(--text-primary)">{{ title }}</h3>
            <button @click="emit('close')" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors active:scale-90" style="color: var(--text-tertiary)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>
