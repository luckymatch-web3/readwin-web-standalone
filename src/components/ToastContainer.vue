<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const icons: Record<string, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg backdrop-blur-md text-sm font-medium min-w-[200px] max-w-[90vw]"
          style="background: rgba(30, 30, 30, 0.88); color: #fff;"
          @click="toastStore.dismiss(toast.id)"
        >
          <span class="text-base shrink-0">{{ icons[toast.type] }}</span>
          <span class="flex-1">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
