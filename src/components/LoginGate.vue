<script setup lang="ts">
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
withDefaults(defineProps<{ message?: string }>(), {
  message: 'Please log in to access this feature'
})
</script>

<template>
  <div v-if="!userStore.isLoggedIn" class="flex flex-col items-center justify-center py-20 px-4">
    <p class="text-5xl mb-4">🔒</p>
    <p class="text-lg font-semibold mb-2" style="color: var(--text-primary)">Login Required</p>
    <p class="text-sm mb-6 text-center" style="color: var(--text-tertiary)">{{ message }}</p>
    <router-link to="/login" class="px-8 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors">
      Log In / Sign Up
    </router-link>
  </div>
  <slot v-else />
</template>
