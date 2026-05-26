<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginGate from '@/components/LoginGate.vue'
import NativeNotificationsScreen from '@/components/app/NativeNotificationsScreen.vue'
import { isNativeApp } from '@/services/admob'

const router = useRouter()
const nativeApp = isNativeApp()
const pushEnabled = ref(false)
const emailEnabled = ref(true)
const newChapter = ref(true)
const newReply = ref(true)
const systemAnnounce = ref(true)
</script>

<template>
  <NativeNotificationsScreen v-if="nativeApp" />

  <main v-else class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8">
    <LoginGate message="Log in to manage notifications">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="router.back()" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors active:scale-90">
          <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="text-xl font-bold" style="color: var(--text-primary)">🔔 Notifications</h1>
      </div>

      <div class="rounded-xl border overflow-hidden" style="border-color: var(--border-default); background: var(--bg-card)">
        <label class="flex items-center justify-between px-4 py-4 min-h-[56px] cursor-pointer border-b" style="border-color: var(--border-default)">
          <div><p class="text-sm font-medium" style="color: var(--text-primary)">Push Notifications</p><p class="text-xs" style="color: var(--text-tertiary)">Receive push alerts on your device</p></div>
          <input type="checkbox" v-model="pushEnabled" class="w-6 h-6 accent-blue-600 cursor-pointer" />
        </label>
        <label class="flex items-center justify-between px-4 py-4 min-h-[56px] cursor-pointer border-b" style="border-color: var(--border-default)">
          <div><p class="text-sm font-medium" style="color: var(--text-primary)">Email Notifications</p><p class="text-xs" style="color: var(--text-tertiary)">Weekly digest and important updates</p></div>
          <input type="checkbox" v-model="emailEnabled" class="w-6 h-6 accent-blue-600 cursor-pointer" />
        </label>
        <label class="flex items-center justify-between px-4 py-4 min-h-[56px] cursor-pointer border-b" style="border-color: var(--border-default)">
          <div><p class="text-sm font-medium" style="color: var(--text-primary)">New Chapter Updates</p><p class="text-xs" style="color: var(--text-tertiary)">When books you follow get new chapters</p></div>
          <input type="checkbox" v-model="newChapter" class="w-6 h-6 accent-blue-600 cursor-pointer" />
        </label>
        <label class="flex items-center justify-between px-4 py-4 min-h-[56px] cursor-pointer border-b" style="border-color: var(--border-default)">
          <div><p class="text-sm font-medium" style="color: var(--text-primary)">Replies & Interactions</p><p class="text-xs" style="color: var(--text-tertiary)">When someone replies to your tips or comments</p></div>
          <input type="checkbox" v-model="newReply" class="w-6 h-6 accent-blue-600 cursor-pointer" />
        </label>
        <label class="flex items-center justify-between px-4 py-4 min-h-[56px] cursor-pointer">
          <div><p class="text-sm font-medium" style="color: var(--text-primary)">System Announcements</p><p class="text-xs" style="color: var(--text-tertiary)">New features and maintenance notices</p></div>
          <input type="checkbox" v-model="systemAnnounce" class="w-6 h-6 accent-blue-600 cursor-pointer" />
        </label>
      </div>
    </div>
    </LoginGate>
  </main>
</template>
