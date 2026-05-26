import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE_URL } from '@/config'

const BASE_URL = API_BASE_URL

function getToken(): string | null {
  try {
    const s = JSON.parse(localStorage.getItem('user-store') || '{}')
    return s.token || null
  } catch { return null }
}

async function authGet(path: string) {
  const token = getToken()
  if (!token) throw new Error('Not logged in')
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json?.data ?? json
}

async function authPost(path: string, body?: any) {
  const token = getToken()
  if (!token) throw new Error('Not logged in')
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json?.data ?? json
}

export const useEngagementStore = defineStore('engagement', () => {
  const userLevel = ref<any>(null)
  const userAchievements = ref<any[]>([])
  const checkinStatus = ref<any>(null)

  const streak = ref(0)
  const xp = ref(0)
  const level = ref(1)
  const achievements = ref<any[]>([])
  const checkedInToday = ref(false)

  async function fetchLevel() {
    try {
      const data = await authGet('/user/level')
      userLevel.value = data
      level.value = data?.level || 1
      xp.value = data?.total_exp || 0
    } catch (e) {
      console.warn('[engagement] fetchLevel failed:', e)
    }
  }

  async function fetchAchievements() {
    try {
      const data = await authGet('/user/achievements')
      const items = Array.isArray(data) ? data : (data?.items || [])
      userAchievements.value = items
      achievements.value = items
    } catch (e) {
      console.warn('[engagement] fetchAchievements failed:', e)
    }
  }

  async function fetchCheckinStatus() {
    try {
      const data = await authGet('/checkin/status')
      checkinStatus.value = data
      streak.value = data?.streak || 0
      checkedInToday.value = data?.checked_today || false
    } catch (e) {
      console.warn('[engagement] fetchCheckinStatus failed:', e)
    }
  }

  async function checkIn() {
    try {
      const data = await authPost('/checkin')
      checkedInToday.value = true
      if (data?.streak) streak.value = data.streak
      await fetchCheckinStatus()
      await fetchLevel()
      return data
    } catch (e: any) {
      console.warn('[engagement] checkIn failed:', e)
      throw e
    }
  }

  async function init() {
    await Promise.all([fetchLevel(), fetchAchievements(), fetchCheckinStatus()])
  }

  return {
    userLevel, userAchievements, checkinStatus,
    streak, xp, level, achievements, checkedInToday,
    fetchLevel, fetchAchievements, fetchCheckinStatus,
    checkIn, init,
  }
})
