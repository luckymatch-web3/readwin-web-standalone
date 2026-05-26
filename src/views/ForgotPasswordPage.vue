<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { API_BASE_URL } from '@/config'

const router = useRouter()
const toastStore = useToastStore()
const step = ref<'email' | 'code' | 'done'>('email')
const email = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const countdown = ref(0)
let timer: any = null

const BASE = API_BASE_URL

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function sendCode() {
  if (!email.value.trim()) { error.value = 'Please enter your email'; return }
  loading.value = true; error.value = ''
  try {
    const res = await fetch(`${BASE}/auth/forgot-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || json.detail || 'Failed')
    step.value = 'code'
    startCountdown()
  } catch (e: any) {
    error.value = e.message
  } finally { loading.value = false }
}

async function resetPassword() {
  if (!code.value.trim()) { error.value = 'Please enter the code'; return }
  if (newPassword.value.length < 6) { error.value = 'Password must be at least 6 characters'; return }
  if (newPassword.value !== confirmPassword.value) { error.value = 'Passwords do not match'; return }
  loading.value = true; error.value = ''
  try {
    const res = await fetch(`${BASE}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, code: code.value, new_password: newPassword.value }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || json.detail || 'Failed')
    step.value = 'done'
    toastStore.show('Password reset successfully!', 'success')
  } catch (e: any) {
    error.value = e.message
  } finally { loading.value = false }
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-4" style="background: var(--bg-base)">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold" style="color: var(--text-primary)">🔑 Reset Password</h1>
        <p class="text-sm mt-2" style="color: var(--text-tertiary)">We'll send a code to your email</p>
      </div>

      <!-- Step 1: Email -->
      <div v-if="step === 'email'" class="space-y-4">
        <input v-model="email" type="email" placeholder="Your email address"
          class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:border-primary-500"
          style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)"
          @keyup.enter="sendCode" />
        <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
        <button @click="sendCode" :disabled="loading"
          class="w-full py-3 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 transition-colors">
          {{ loading ? 'Sending...' : 'Send Reset Code' }}
        </button>
      </div>

      <!-- Step 2: Code + New Password -->
      <div v-else-if="step === 'code'" class="space-y-4">
        <p class="text-sm text-center" style="color: var(--text-secondary)">Code sent to <strong>{{ email }}</strong></p>
        <input v-model="code" type="text" placeholder="6-digit code" maxlength="6"
          class="w-full px-4 py-3 rounded-xl border text-sm text-center tracking-widest outline-none transition-all focus:border-primary-500"
          style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
        <input v-model="newPassword" type="password" placeholder="New password (min 6 chars)"
          class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:border-primary-500"
          style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" />
        <input v-model="confirmPassword" type="password" placeholder="Confirm new password"
          class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:border-primary-500"
          style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)"
          @keyup.enter="resetPassword" />
        <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
        <button @click="resetPassword" :disabled="loading"
          class="w-full py-3 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 transition-colors">
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
        <button v-if="countdown <= 0" @click="sendCode" class="w-full text-sm text-primary-600 font-medium">Resend Code</button>
        <p v-else class="text-center text-xs" style="color: var(--text-tertiary)">Resend in {{ countdown }}s</p>
      </div>

      <!-- Step 3: Done -->
      <div v-else class="text-center space-y-4">
        <p class="text-4xl">✅</p>
        <p class="font-bold text-lg" style="color: var(--text-primary)">Password Reset!</p>
        <p class="text-sm" style="color: var(--text-tertiary)">You can now sign in with your new password.</p>
        <button @click="router.push('/login')" class="w-full py-3 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
          Go to Sign In
        </button>
      </div>

      <div class="text-center mt-6">
        <router-link to="/login" class="text-sm text-primary-600 font-medium">← Back to Sign In</router-link>
      </div>
    </div>
  </main>
</template>
