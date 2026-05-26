<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/services/api'
import { Capacitor } from '@capacitor/core'
import NativeLoginScreen from '@/components/app/NativeLoginScreen.vue'
import { isNativeApp } from '@/services/admob'

const router = useRouter()
const userStore = useUserStore()
const nativeApp = isNativeApp()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const nickname = ref('')
const inviteCode = ref('')
const verifyCode = ref('')
const error = ref('')
const codeSent = ref(false)
const codeCooldown = ref(0)
const googleLoading = ref(false)

let cooldownTimer: ReturnType<typeof setInterval> | null = null

async function sendCode() {
  const normalizedEmail = email.value.trim()
  if (!normalizedEmail) { error.value = 'Please enter your email first'; return }
  if (codeCooldown.value > 0) return
  try {
    await authApi.sendCode(normalizedEmail)
    email.value = normalizedEmail
    codeSent.value = true
    codeCooldown.value = 60
    cooldownTimer = setInterval(() => {
      codeCooldown.value--
      if (codeCooldown.value <= 0 && cooldownTimer) clearInterval(cooldownTimer)
    }, 1000)
  } catch (e: any) {
    error.value = e.message || 'Failed to send code'
  }
}

async function handleSubmit() {
  error.value = ''
  const normalizedEmail = email.value.trim()
  const normalizedNickname = nickname.value.trim()
  const normalizedInviteCode = inviteCode.value.trim().toUpperCase()
  const normalizedVerifyCode = verifyCode.value.trim()

  if (!normalizedEmail || !password.value) { error.value = 'Please fill in all fields'; return }
  if (!isLogin.value && !normalizedNickname) { error.value = 'Please enter a nickname'; return }
  if (!isLogin.value && normalizedVerifyCode && !/^\d{6}$/.test(normalizedVerifyCode)) {
    error.value = 'Enter the 6-digit verification code, or leave it blank.'
    return
  }

  try {
    if (isLogin.value) {
      await userStore.login(normalizedEmail, password.value)
    } else {
      await userStore.register(
        normalizedEmail,
        password.value,
        normalizedNickname,
        normalizedInviteCode || undefined,
        normalizedVerifyCode || undefined,
      )
    }
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Authentication failed'
  }
}

async function handleGoogleLogin() {
  error.value = ''
  googleLoading.value = true
  try {
    if (Capacitor.isNativePlatform()) {
      // Native: use Capacitor Google Auth plugin
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
      const result = await GoogleAuth.signIn()
      const idToken = result.authentication?.idToken
      if (!idToken) throw new Error('No ID token from Google')
      await userStore.googleLogin(idToken, inviteCode.value || undefined)
    } else {
      // Web: use Google Identity Services
      error.value = 'Google Sign-In is available in the app only'
      return
    }
    router.push('/')
  } catch (e: any) {
    if (e.message?.includes('canceled') || e.message?.includes('cancelled')) return
    error.value = e.message || 'Google login failed'
  } finally {
    googleLoading.value = false
  }
}

onMounted(() => {
  // If already logged in, redirect
  if (userStore.isLoggedIn) router.replace('/')
})
</script>

<template>
  <NativeLoginScreen v-if="nativeApp" />

  <main v-else class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
          <span class="text-white font-bold text-2xl">R</span>
        </div>
        <h1 class="text-2xl font-bold" style="color: var(--text-primary)">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h1>
        <p class="text-sm mt-1" style="color: var(--text-secondary)">{{ isLogin ? 'Sign in to continue reading' : 'Join millions of readers' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="!isLogin">
          <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Nickname</label>
          <input v-model="nickname" type="text" placeholder="Your display name"
            class="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
            style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
        </div>
        <div v-if="!isLogin">
          <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Invite Code <span class="text-xs font-normal" style="color: var(--text-tertiary)">(optional)</span></label>
          <input v-model="inviteCode" type="text" placeholder="e.g. ABC123" maxlength="6"
            class="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 uppercase tracking-wider"
            style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com"
            class="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
            style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Password</label>
          <input v-model="password" type="password" placeholder="••••••••"
            class="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
            style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
        </div>

        <div v-if="isLogin" class="text-right -mt-2">
          <router-link to="/forgot-password" class="text-xs text-primary-600 hover:text-primary-700 font-medium">Forgot password?</router-link>
        </div>

        <!-- Verify code for registration -->
        <div v-if="!isLogin">
          <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">
            Verification Code <span class="text-xs font-normal" style="color: var(--text-tertiary)">(optional)</span>
          </label>
          <div class="flex gap-2">
            <input v-model="verifyCode" type="text" placeholder="Enter code" maxlength="6"
              class="flex-1 px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
              style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
            <button type="button" @click="sendCode" :disabled="codeCooldown > 0"
              class="px-4 py-2.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap"
              :class="codeCooldown > 0 ? 'bg-secondary-300 text-secondary-500' : 'bg-primary-600 text-white hover:bg-primary-700'">
              {{ codeCooldown > 0 ? `${codeCooldown}s` : (codeSent ? 'Resend' : 'Send Code') }}
            </button>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button type="submit" :disabled="userStore.loading"
          class="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50">
          {{ userStore.loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account') }}
        </button>
      </form>

      <!-- Google Sign-In -->
      <div class="mt-4">
        <div class="flex items-center gap-3 my-4">
          <div class="flex-1 h-px" style="background-color: var(--border-default)"></div>
          <span class="text-xs" style="color: var(--text-tertiary)">or</span>
          <div class="flex-1 h-px" style="background-color: var(--border-default)"></div>
        </div>
        <button @click="handleGoogleLogin" :disabled="googleLoading"
          class="w-full py-2.5 rounded-lg border font-medium text-sm flex items-center justify-center gap-2 hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          style="border-color: var(--border-default); color: var(--text-primary)">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {{ googleLoading ? 'Signing in...' : 'Continue with Google' }}
        </button>
      </div>

      <p class="text-center text-sm mt-6" style="color: var(--text-secondary)">
        {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
        <button @click="isLogin = !isLogin; error = ''" class="text-primary-600 font-medium ml-1">
          {{ isLogin ? 'Sign Up' : 'Sign In' }}
        </button>
      </p>
    </div>
  </main>
</template>
