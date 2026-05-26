import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/services/api'
import { Analytics, setUserId, setUserProperty } from '@/services/analytics'

const STORAGE_KEY = 'readwin-auth'
const GUEST_STORAGE_KEY = 'readwin-guest-profile'

function randomNumber(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function loadFromStorage(): { user: User | null; token: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, token: null, refreshToken: null }
    return JSON.parse(raw)
  } catch {
    return { user: null, token: null, refreshToken: null }
  }
}

function saveToStorage(user: User | null, token: string | null, refreshToken: string | null) {
  if (user && token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token, refreshToken }))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
  // Compat: api.ts getToken() reads from here
  localStorage.setItem('user-store', JSON.stringify({ token }))
}

function createGuestUser(): User {
  const suffix = randomNumber(100000, 999999)
  const uid = `${randomNumber(10000000, 99999999)}${randomNumber(10000000, 99999999)}`

  return {
    id: -suffix,
    uid,
    email: '',
    nickname: `user_${suffix}`,
    avatar_url: '',
    coin_balance: randomNumber(10000, 13999),
    reward_diamond: 0,
    paid_diamond: 0,
    commission_diamond: 0,
    vip_expire_at: null,
    invite_code: '',
  }
}

function loadGuestUser(): User {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as User
  } catch {}

  const guest = createGuestUser()
  saveGuestUser(guest)
  return guest
}

function saveGuestUser(guest: User) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guest))
}

function emailDomain(email: string) {
  const domain = email.split('@')[1]?.trim().toLowerCase()
  return domain || ''
}

export const useUserStore = defineStore('user', () => {
  const saved = loadFromStorage()
  const user = ref<User | null>(saved.user)
  const guestUser = ref<User>(loadGuestUser())
  const token = ref<string | null>(saved.token)
  const refreshToken = ref<string | null>(saved.refreshToken)
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const isGuest = computed(() => !isLoggedIn.value)
  const displayUser = computed(() => user.value || guestUser.value)
  const displayCoinBalance = computed(() => displayUser.value.coin_balance || 0)
  const displayCommissionBalance = computed(() => displayUser.value.commission_diamond || 0)
  const isVip = computed(() => {
    if (!user.value?.vip_expire_at) return false
    return new Date(user.value.vip_expire_at) > new Date()
  })
  const totalDiamond = computed(() => {
    if (!user.value) return 0
    return (user.value.reward_diamond || 0) + (user.value.paid_diamond || 0) + (user.value.commission_diamond || 0)
  })

  function setAuth(data: { access_token: string; refresh_token: string; user: any }) {
    token.value = data.access_token
    refreshToken.value = data.refresh_token
    user.value = data.user as User
    saveToStorage(user.value, token.value, refreshToken.value)
    void setUserId(String(user.value.uid || user.value.id))
    void setUserProperty('account_type', 'registered')
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = ''
    Analytics.authAttempt('login', 'email', { email_domain: emailDomain(email) })
    try {
      const data = await authApi.login(email, password)
      setAuth(data)
      Analytics.userLogin('email')
      Analytics.authResult('login', 'email', true, { email_domain: emailDomain(email) })
    } catch (e: any) {
      error.value = e.message || 'Login failed'
      Analytics.authResult('login', 'email', false, {
        email_domain: emailDomain(email),
        fail_reason: error.value,
      })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, nickname: string, inviteCode?: string, verifyCode?: string) {
    loading.value = true
    error.value = ''
    Analytics.authAttempt('register', 'email', {
      email_domain: emailDomain(email),
      has_invite_code: Boolean(inviteCode),
      has_verify_code: Boolean(verifyCode),
    })
    try {
      let data
      try {
        data = await authApi.register(email, password, nickname, inviteCode, verifyCode)
      } catch (e: any) {
        const message = String(e?.message || '')
        if (!verifyCode || !message.toLowerCase().includes('verification code')) throw e
        // Email verification is optional on the backend. If a stale in-memory code blocks
        // signup, retry without it so account creation still works.
        data = await authApi.register(email, password, nickname, inviteCode)
      }
      setAuth(data)
      Analytics.userSignup('email')
      Analytics.authResult('register', 'email', true, {
        email_domain: emailDomain(email),
        has_invite_code: Boolean(inviteCode),
      })
    } catch (e: any) {
      error.value = e.message || 'Registration failed'
      Analytics.authResult('register', 'email', false, {
        email_domain: emailDomain(email),
        has_invite_code: Boolean(inviteCode),
        fail_reason: error.value,
      })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function googleLogin(idToken: string, inviteCode?: string) {
    loading.value = true
    error.value = ''
    Analytics.authAttempt('login', 'google', { has_invite_code: Boolean(inviteCode) })
    try {
      const data = await authApi.googleLogin(idToken, inviteCode)
      setAuth(data)
      Analytics.userLogin('google')
      Analytics.authResult('login', 'google', true, { has_invite_code: Boolean(inviteCode) })
    } catch (e: any) {
      error.value = e.message || 'Google login failed'
      Analytics.authResult('login', 'google', false, {
        has_invite_code: Boolean(inviteCode),
        fail_reason: error.value,
      })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const userData = await authApi.me()
      user.value = userData as User
      saveToStorage(user.value, token.value, refreshToken.value)
    } catch {
      logout()
    }
  }

  function logout() {
    Analytics.authResult('logout', token.value ? 'registered' : 'guest', true)
    user.value = null
    token.value = null
    refreshToken.value = null
    saveToStorage(null, null, null)
    void setUserProperty('account_type', 'guest')
  }

  function updateDiamonds(reward: number, paid: number, commission: number) {
    if (user.value) {
      user.value.reward_diamond = reward
      user.value.paid_diamond = paid
      user.value.commission_diamond = commission
      saveToStorage(user.value, token.value, refreshToken.value)
    }
  }

  function updateCoinBalance(balance: number) {
    if (user.value) {
      user.value.coin_balance = balance
      saveToStorage(user.value, token.value, refreshToken.value)
      return
    }

    guestUser.value.coin_balance = balance
    saveGuestUser(guestUser.value)
  }

  function addCoins(amount: number) {
    const nextBalance = Math.max(0, (displayUser.value.coin_balance || 0) + Number(amount || 0))
    updateCoinBalance(nextBalance)
  }

  function addCommission(amount: number) {
    const nextCommission = Math.max(0, (displayUser.value.commission_diamond || 0) + Number(amount || 0))

    if (user.value) {
      user.value.commission_diamond = nextCommission
      saveToStorage(user.value, token.value, refreshToken.value)
      return
    }

    guestUser.value.commission_diamond = nextCommission
    saveGuestUser(guestUser.value)
  }

  return {
    user, guestUser, token, refreshToken, loading, error,
    isLoggedIn, isGuest, displayUser, displayCoinBalance, displayCommissionBalance, isVip, totalDiamond,
    login, register, googleLogin, fetchMe, logout,
    setAuth, updateDiamonds, updateCoinBalance, addCoins, addCommission,
  }
})
