<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { useRoute } from 'vue-router'

const route = useRoute()
const nativeApp = Capacitor.isNativePlatform()

const tabs = nativeApp
  ? [
      { path: '/', label: 'Home', icon: 'home' },
      { path: '/bookshelf', label: 'Shelf', icon: 'book' },
      { path: '/reward', label: 'Reward', icon: 'gift' },
      { path: '/profile', label: 'Me', icon: 'user' },
    ]
  : [
      { path: '/', label: 'Home', icon: 'home' },
      { path: '/explore', label: 'Explore', icon: 'explore' },
      { path: '/reward', label: 'Earn', icon: 'gift' },
      { path: '/wallet', label: 'Wallet', icon: 'wallet' },
      { path: '/profile', label: 'Me', icon: 'user' },
    ]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  if (path === '/reward') return route.path.startsWith('/reward') || route.path.startsWith('/earn')
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    :class="nativeApp ? 'native-nav-shell' : 'border-t'"
    :style="nativeApp ? '' : 'background-color: var(--bg-card); border-color: var(--border-default)'"
  >
    <div class="flex items-center justify-around h-14" :class="nativeApp ? 'native-nav-bar' : ''">
      <router-link
        v-for="tab in tabs" :key="tab.path"
        :to="tab.path"
        class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors"
        :class="[
          nativeApp ? 'native-nav-link' : '',
          isActive(tab.path) && !nativeApp ? 'text-primary-600' : '',
          isActive(tab.path) && nativeApp ? 'native-nav-link-active' : '',
        ]"
        :style="!isActive(tab.path) && !nativeApp ? 'color: var(--text-tertiary)' : ''"
      >
        <svg v-if="tab.icon === 'home'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <svg v-if="tab.icon === 'explore'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l3.75 1.25L14 14l-3.75-1.25L9 9z"/></svg>
        <svg v-if="tab.icon === 'book'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <svg v-if="tab.icon === 'gift'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13H7.5a2.5 2.5 0 110-5c1.657 0 2.805 1.54 4.5 5zm0 0h4.5a2.5 2.5 0 100-5c-1.657 0-2.805 1.54-4.5 5zm-7 4h14v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4z"/></svg>
        <svg v-if="tab.icon === 'wallet'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 8V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1m0-8h-7a2 2 0 000 4h7V8z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12h.01"/></svg>
        <svg v-if="tab.icon === 'user'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span class="text-xs font-medium">{{ tab.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.native-nav-shell {
  padding: 0 10px calc(env(safe-area-inset-bottom, 0px) + 8px);
  background: linear-gradient(180deg, rgba(5, 5, 8, 0), rgba(5, 5, 8, 0.9));
  pointer-events: auto;
}

.native-nav-bar {
  height: 62px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 79, 150, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(24, 24, 31, 0.96), rgba(9, 9, 14, 0.98));
  box-shadow:
    0 22px 42px -24px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.native-nav-link {
  min-height: 62px;
  height: 62px;
  padding: 6px 0;
  color: rgba(255, 236, 244, 0.58);
  touch-action: manipulation;
}

.native-nav-link-active {
  color: #ffd447;
  text-shadow: 0 0 14px rgba(255, 79, 150, 0.36);
}
</style>
