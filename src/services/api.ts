import type { Novel, Category, Banner, Chapter } from '@/types'
import {
  novels as mockNovels,
  categories as mockCategories,
  banners as mockBanners,
  generateChapters,
  sampleChapterContent,
  hotSearchTerms as mockHotSearchTerms,
} from '@/mock/novels'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

function getToken(): string | null {
  try {
    const userStore = JSON.parse(localStorage.getItem('user-store') || '{}')
    return userStore.token || null
  } catch {
    return null
  }
}

// Backend returns {code:0, message:"ok", data: ...}
// This function unwraps to return data directly
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  const json = await res.json()
  // Unwrap backend envelope: {code, message, data}
  if (json && typeof json === 'object' && 'code' in json && 'data' in json) {
    if (Number(json.code) !== 0) {
      throw new Error(json.message || `API error ${json.code}`)
    }
    return json.data as T
  }
  return json as T
}

async function withFallback<T>(apiCall: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await apiCall()
  } catch (e) {
    console.warn('[API] Backend unavailable, using mock data:', (e as Error).message)
    return fallback
  }
}

function normalizeChapterContent(value: unknown): string {
  if (typeof value !== 'string') return sampleChapterContent

  let text = value
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')

  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(div|section|article|h\d|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  }

  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text || sampleChapterContent
}

function normalizeNovelFreeAccess<T extends Record<string, any>>(novel: T): T {
  if (!novel) return novel
  return {
    ...novel,
    free_chapters: Number(novel.total_chapters || novel.free_chapters || 0),
    chapter_coin_price: 0,
  }
}

function normalizeNovelListFreeAccess<T extends Record<string, any>>(items: T[]): T[] {
  return items.map(item => normalizeNovelFreeAccess(item))
}

// --- Novel APIs ---
// Backend: GET /api/novels -> {data: {items:[], total, page, page_size}}
// Backend: GET /api/novels/{id} -> {data: {...novel}}
// Backend: GET /api/novels/search?q= -> {data: {items:[]}}
// Backend: GET /api/home -> {data: {banners, featured, hot, new_arrivals, categories}}
// Backend: GET /api/rankings?type= -> {data: [...]}
// Backend: GET /api/novels/categories -> {data: [...]}

export const novelApi = {
  listPaged: async (page: number = 1, pageSize: number = 100) => {
    const data = await request<{ items: any[]; total: number }>(`/novels?page=${page}&page_size=${pageSize}`)
    return {
      ...data,
      items: normalizeNovelListFreeAccess(data.items || []),
    }
  },

  list: (params?: { category?: string; status?: string; sort?: string }) => {
    let qs = ''
    if (params) {
      const sp = new URLSearchParams()
      if (params.category) sp.set('category_id', params.category)
      if (params.status) sp.set('status', params.status)
      if (params.sort) sp.set('sort', params.sort)
      qs = sp.toString() ? `?${sp.toString()}` : ''
    }
    return withFallback(
      async () => {
        const data = await request<{ items: Novel[]; total: number }>(`/novels${qs}`)
        return normalizeNovelListFreeAccess(data.items)
      },
      normalizeNovelListFreeAccess(mockNovels),
    )
  },

  getById: (id: number) =>
    withFallback(
      async () => normalizeNovelFreeAccess(await request<Novel>(`/novels/${id}`)),
      normalizeNovelFreeAccess(mockNovels.find(n => n.id === id)!),
    ),

  search: (query: string) =>
    withFallback(
      async () => {
        const data = await request<{ items: Novel[] }>(`/novels/search?q=${encodeURIComponent(query)}`)
        return normalizeNovelListFreeAccess(data.items)
      },
      normalizeNovelListFreeAccess(mockNovels.filter(n => {
        const q = query.toLowerCase()
        return n.title.toLowerCase().includes(q) ||
          n.author_name.toLowerCase().includes(q) ||
          n.tags.some(t => t.toLowerCase().includes(q)) ||
          n.synopsis.toLowerCase().includes(q)
      })),
    ),

  getFeatured: () =>
    withFallback(
      async () => {
        const data = await request<{ featured: Novel[] }>('/home')
        return normalizeNovelListFreeAccess(data.featured)
      },
      normalizeNovelListFreeAccess(mockNovels.filter(n => n.is_featured)),
    ),

  getRankings: (type: string) =>
    withFallback(
      async () => normalizeNovelListFreeAccess(await request<Novel[]>(`/rankings?type=${type}`)),
      normalizeNovelListFreeAccess((() => {
        const sorted = [...mockNovels]
        switch (type) {
          case 'hot': return sorted.sort((a, b) => b.view_count - a.view_count)
          case 'trending': return sorted.sort((a, b) => b.like_count - a.like_count)
          case 'completed': return sorted.filter(n => n.status === 2).sort((a, b) => b.rating_avg - a.rating_avg)
          case 'rating': return sorted.sort((a, b) => b.rating_avg - a.rating_avg)
          default: return sorted
        }
      })()),
    ),
}

// --- Chapter APIs ---
// Backend: GET /api/chapters/{chapter_id}
// But we need novel_id + chapter_no -> need /api/novels/{id}/chapters

export const chapterApi = {
  list: (novelId: number) =>
    withFallback(
      async () => {
        const data = await request<{ items: Chapter[] }>(`/novels/${novelId}/chapters`)
        return data.items.map(item => ({
          ...item,
          is_free: true,
          coin_price: 0,
          is_unlocked: true,
        }))
      },
      generateChapters(novelId, mockNovels.find(n => n.id === novelId)?.total_chapters ?? 50).map(item => ({
        ...item,
        is_free: true,
        coin_price: 0,
        is_unlocked: true,
      })),
    ),

  getContent: (novelId: number, chapterNo: number) =>
    withFallback(
      async () => {
        // First get chapter list to find chapter_id by chapter_no
        const listData = await request<{ items: Chapter[] }>(`/novels/${novelId}/chapters`)
        const ch = listData.items.find(c => c.chapter_no === chapterNo)
        if (!ch) throw new Error(`Chapter ${chapterNo} not found`)
        const data = await request<any>(`/chapters/${ch.id}`)
        return normalizeChapterContent(data.content)
      },
      sampleChapterContent,
    ),
}

// --- Category APIs ---
// Backend: GET /api/novels/categories

export const categoryApi = {
  list: () =>
    withFallback(
      () => request<Category[]>('/novels/categories'),
      mockCategories,
    ),
}

// --- Banner APIs ---
// Backend: GET /api/home/banners

export const bannerApi = {
  list: () =>
    withFallback(
      () => request<Banner[]>('/home/banners'),
      mockBanners,
    ),
}

// --- Auth APIs ---

export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; user: any }>('/auth/login', { method: 'POST', body: { email, password } }),

  register: (email: string, password: string, nickname: string, inviteCode?: string, verifyCode?: string) =>
    request<{ access_token: string; refresh_token: string; user: any }>('/auth/register', {
      method: 'POST', body: { email, password, nickname, invite_code: inviteCode, verify_code: verifyCode },
    }),

  googleLogin: (idToken: string, inviteCode?: string) =>
    request<{ access_token: string; refresh_token: string; user: any }>('/auth/google', {
      method: 'POST', body: { id_token: idToken, invite_code: inviteCode },
    }),

  sendCode: (email: string) =>
    request<{ sent: boolean }>('/auth/send-code', { method: 'POST', body: { email } }),

  me: () => request<any>('/auth/me'),

  refresh: (refreshToken: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      method: 'POST', body: { refresh_token: refreshToken },
    }),
}

// --- Search APIs ---

// --- Interaction APIs (Urge / Tip) ---

export const interactionApi = {
  urge: (novelId: number, message?: string) =>
    request<{ urge_count: number }>(`/novels/${novelId}/urge`, { method: 'POST', body: { message } }),

  urgeCount: (novelId: number) =>
    request<{ urge_count: number }>(`/novels/${novelId}/urge/count`),

  tip: (novelId: number, amount: number, message?: string, giftType?: string) =>
    request<{ balance: number }>(`/novels/${novelId}/tip`, { method: 'POST', body: { amount, message, gift_type: giftType } }),

  tipList: (novelId: number, page = 1) =>
    request<{ items: any[]; total: number }>(`/novels/${novelId}/tips?page=${page}`),

  tipTotal: (novelId: number) =>
    request<{ total: number }>(`/novels/${novelId}/tip/total`),

  like: (novelId: number) =>
    request<{ liked: boolean; like_count: number }>(`/novels/${novelId}/like`, { method: 'POST' }),

  likeStatus: (novelId: number) =>
    request<{ liked: boolean; like_count: number }>(`/novels/${novelId}/like/status`),

  rate: (novelId: number, rating: number) =>
    request<{ rating_avg: number; rating_count: number }>(`/novels/${novelId}/rate`, { method: 'POST', body: { rating } }),

  rateStatus: (novelId: number) =>
    request<{ rated: boolean; rating: number; rating_avg: number; rating_count: number }>(`/novels/${novelId}/rate/status`),

  tipRank: (novelId: number) =>
    request<{ items: any[] }>(`/novels/${novelId}/tip/rank`),
}

// --- Payment APIs ---

export const paymentApi = {
  packages: () => request<any[]>('/coins/packages'),

  topup: (packageId: number, paymentMethod: string) =>
    request<{ order_no: string; amount_usd: number; coins_total: number }>('/coins/topup', {
      method: 'POST', body: { package_id: packageId, payment_method: paymentMethod },
    }),

  confirm: (orderNo: string) =>
    request<{ balance: number; coins_added: number }>('/coins/topup/confirm', {
      method: 'POST', body: { order_no: orderNo },
    }),
}

export const coinApi = {
  balance: () => request<{ balance: number }>('/coins/balance'),

  logs: (page: number = 1, pageSize: number = 100) =>
    withFallback(
      () => request<{ items: any[]; total: number; page: number; page_size: number }>(`/coins/logs?page=${page}&page_size=${pageSize}`),
      { items: [], total: 0, page, page_size: pageSize },
    ),

  earn: (taskType: string) =>
    request<any>('/coins/earn', {
      method: 'POST',
      body: { task_type: taskType },
    }),
}

export const diamondApi = {
  balance: () =>
    withFallback(
      () => request<any>('/diamonds/balance'),
      {
        reward_diamond: 0,
        paid_diamond: 0,
        commission_diamond: 0,
        total_diamond: 0,
      },
    ),

  logs: (page: number = 1, pageSize: number = 100, type?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    if (type) params.set('type', type)

    return withFallback(
      () => request<{ items: any[]; total: number; page: number; page_size: number }>(`/diamonds/logs?${params.toString()}`),
      { items: [], total: 0, page, page_size: pageSize },
    )
  },
}

export const withdrawApi = {
  rules: () =>
    withFallback(
      () => request<any>('/withdraw/rules'),
      {
        min_amount: 50,
        exchange_rate: '10 diamonds = ¥1',
        method: 'PayPal',
        max_monthly: 3,
        commission_balance: 0,
      },
    ),

  history: (page: number = 1, pageSize: number = 20) =>
    withFallback(
      () => request<{ items: any[]; total: number; page: number; page_size: number }>(`/withdraw/history?page=${page}&page_size=${pageSize}`),
      { items: [], total: 0, page, page_size: pageSize },
    ),

  apply: (amount: number, paypalAccount: string) =>
    request<any>('/withdraw/apply', {
      method: 'POST',
      body: { amount, paypal_account: paypalAccount },
    }),
}

export const inviteApi = {
  info: () =>
    withFallback(
      () => request<any>('/invite/info'),
      {
        invite_code: '',
        invite_link: '',
        level1_count: 0,
        level2_count: 0,
        total_commission: 0,
        month_commission: 0,
      },
    ),

  team: (level?: number, page: number = 1, pageSize: number = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    if (level) params.set('level', String(level))

    return withFallback(
      () => request<{ items: any[]; total: number; page: number; page_size: number }>(`/invite/team?${params.toString()}`),
      { items: [], total: 0, page, page_size: pageSize },
    )
  },

  earnings: (page: number = 1, pageSize: number = 20) =>
    withFallback(
      () => request<{ items: any[]; total: number; page: number; page_size: number }>(`/invite/earnings?page=${page}&page_size=${pageSize}`),
      { items: [], total: 0, page, page_size: pageSize },
    ),
}

export const achievementApi = {
  list: () =>
    withFallback(
      () => request<{ items: any[] }>('/achievements'),
      { items: [] },
    ),

  userList: () =>
    withFallback(
      () => request<{ items: any[] }>('/user/achievements'),
      { items: [] },
    ),
}

export const userProgressApi = {
  level: () =>
    withFallback(
      () => request<any>('/user/level'),
      {
        user_id: 0,
        total_exp: 0,
        level: 1,
        title: 'New Reader',
        custom_title: null,
        avatar_frame: null,
        next_level_exp: 100,
        current_level_exp: 0,
      },
    ),
}

export const checkinApi = {
  status: () =>
    withFallback(
      () => request<any>('/checkin/status'),
      {
        checked_today: false,
        streak: 0,
        day_in_cycle: 1,
        next_coins: 10,
        week_rewards: [10, 15, 20, 25, 30, 40, 80],
      },
    ),
}

export const searchApi = {
  hotTerms: () =>
    withFallback(
      () => request<string[]>('/search/hot-terms'),
      mockHotSearchTerms,
    ),
}

export const tipRankApi = {
  getRank: (novelId: number) => interactionApi.tipRank(novelId),
}
