<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showIAP } from '@/composables/useIAP'
import { useAds } from '@/composables/useAds'
import { achievementApi } from '@/services/api'

const router = useRouter()
const userStore = useUserStore()
const searchQuery = ref('')
const { isRewardedReady, preloadRewarded } = useAds()
const isDark = ref(false)

const unclaimedBadge = ref(0)

async function fetchUnclaimedCount() {
  if (!userStore.isLoggedIn) {
    unclaimedBadge.value = 0
    return
  }
  try {
    const data = await achievementApi.userList()
    const recentUnlocks = (data.items || []).filter((item: any) => {
      if (!item.unlocked_at) return false
      return Date.now() - new Date(item.unlocked_at).getTime() <= 7 * 24 * 60 * 60 * 1000
    })
    unclaimedBadge.value = recentUnlocks.length
  } catch {
    unclaimedBadge.value = 0
  }
}

onMounted(() => {
  window.addEventListener("achievement-claimed", fetchUnclaimedCount)
  isDark.value = document.documentElement.classList.contains('dark')
  fetchUnclaimedCount()
  preloadRewarded()
})

onUnmounted(() => {
  window.removeEventListener('achievement-claimed', fetchUnclaimedCount)
})

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('readwin-dark-mode', String(isDark.value))
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'search', query: { q: searchQuery.value.trim() } })
  }
}

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Explore', path: '/explore' },
  { name: 'Rankings', path: '/rankings' },
  { name: 'Bookshelf', path: '/bookshelf' },
]
</script>

<template>
  <header class="sticky top-0 z-50 h-14 border-b" style="background-color: var(--bg-card); border-color: var(--border-default)">
    <div class="mx-auto max-w-[1280px] h-full flex items-center justify-between px-4 lg:px-6">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 shrink-0">
        <img src="/logo.png" alt="ReadWin" class="w-7 h-7 rounded-lg" />
        <span class="font-bold text-lg" style="color: var(--text-primary)">ReadWin</span>
      </router-link>

      <!-- Nav Links (desktop only) -->
      <nav class="hidden md:flex items-center gap-6 ml-8">
        <router-link
          v-for="link in navLinks" :key="link.path" :to="link.path"
          class="text-sm font-medium transition-colors hover:text-primary-600"
          style="color: var(--text-secondary)"
          active-class="!text-primary-600"
        >{{ link.name }}</router-link>
      </nav>

      <!-- Right side -->
      <div class="flex items-center gap-1.5">
        <!-- Desktop search -->
        <form @submit.prevent="handleSearch" class="hidden md:flex items-center relative">
          <svg class="absolute left-3 w-4 h-4" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Search..."
            class="pl-9 pr-4 py-1.5 text-sm rounded-full w-48 border outline-none transition-all focus:border-primary-500"
            style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
        </form>

        <!-- Mobile search icon -->
        <router-link to="/search" class="md:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)]" style="color: var(--text-secondary)">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </router-link>

        <!-- Dark mode (desktop only) -->
        <button @click="toggleDark" class="hidden md:block p-2 rounded-lg hover:bg-[var(--bg-hover)]" style="color: var(--text-secondary)">
          <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
        </button>

        <!-- Coin balance -->
        <router-link v-if="userStore.isLoggedIn && showIAP" to="/wallet" class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style="background: rgba(245,158,11,0.1); color: #F59E0B">
          <img src="/coin.svg" alt="" class="w-3.5 h-3.5" /> {{ userStore.user?.coin_balance ?? 0 }}
        </router-link>

        <!-- Avatar / Login -->
        <router-link v-if="userStore.isLoggedIn" to="/profile" class="ml-0.5">
          <div class="relative">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold">
              {{ userStore.user?.nickname?.[0]?.toUpperCase() || 'U' }}
            </div>
            <div v-if="unclaimedBadge > 0 || isRewardedReady" class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" :class="isRewardedReady ? 'bg-red-500 header-badge-pulse' : 'bg-red-500'" style="border-color: var(--bg-card)">
              <span class="text-white text-xs font-bold leading-none">{{ unclaimedBadge > 0 ? (unclaimedBadge > 9 ? '!' : unclaimedBadge) : '!' }}</span>
            </div>
          </div>
        </router-link>
        <router-link v-else to="/login" class="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors">Sign In</router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-badge-pulse {
  animation: badge-pulse 1.5s ease-in-out infinite;
}
@keyframes badge-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
  50% { transform: scale(1.15); box-shadow: 0 0 6px 2px rgba(239,68,68,0.3); }
}
</style>
