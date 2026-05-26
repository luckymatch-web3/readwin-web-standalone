import type { Router } from 'vue-router'

type AnalyticsValue = string | number | boolean | null | undefined
type AnalyticsParams = Record<string, AnalyticsValue>
type AdFormat = 'rewarded' | 'interstitial' | 'banner' | 'native' | 'splash'

function emit(name: string, params?: AnalyticsParams) {
  if (!import.meta.env.DEV) return
  console.debug('[Analytics:web]', name, params || {})
}

export async function logEvent(name: string, params?: AnalyticsParams) {
  emit(name, params)
}

export async function setUserProperty(_name: string, _value: string) {}

export async function setUserId(_userId: string) {}

export function installAnalytics(router: Router) {
  router.afterEach((to, from) => {
    if (to.fullPath === from.fullPath) return
    void Analytics.screenView(String(to.name || 'unknown'), to.path, {
      previous_screen: String(from.name || ''),
      is_native: false,
    })
  })
}

export const Analytics = {
  screenView: (screenName: string, routePath: string, extra?: AnalyticsParams) =>
    logEvent('screen_view', { screen_name: screenName, route_path: routePath, ...extra }),
  uiClick: (params: AnalyticsParams) => logEvent('ui_click', params),
  formSubmit: (params: AnalyticsParams) => logEvent('form_submit', params),
  formChange: (params: AnalyticsParams) => logEvent('form_change', params),
  appLifecycle: (state: string, params?: AnalyticsParams) =>
    logEvent('app_lifecycle', { state, ...params }),
  screenEngaged: (screenName: string, routePath: string, durationMs: number, params?: AnalyticsParams) =>
    logEvent('screen_engaged', { screen_name: screenName, route_path: routePath, duration_ms: durationMs, ...params }),

  adLoadAttempt: (adFormat: AdFormat, params?: AnalyticsParams) =>
    logEvent('ad_load_attempt', { ad_format: adFormat, ...params }),
  adLoadResult: (adFormat: AdFormat, success: boolean, params?: AnalyticsParams) =>
    logEvent(success ? 'ad_load_success' : 'ad_load_failed', { ad_format: adFormat, success, ...params }),
  adShowAttempt: (adFormat: AdFormat, params?: AnalyticsParams) =>
    logEvent('ad_show_attempt', { ad_format: adFormat, ...params }),
  adShowResult: (adFormat: AdFormat, success: boolean, params?: AnalyticsParams) =>
    logEvent(success ? 'ad_show_success' : 'ad_show_failed', { ad_format: adFormat, success, ...params }),
  adImpression: (adFormat: AdFormat, params?: AnalyticsParams) =>
    logEvent('ad_impression', { ad_format: adFormat, ...params }),
  adClosed: (adFormat: AdFormat, params?: AnalyticsParams) =>
    logEvent('ad_closed', { ad_format: adFormat, ...params }),
  adRewardedShown: (params?: AnalyticsParams) => logEvent('ad_rewarded_shown', params),
  adRewardedEarned: (coins: number, params?: AnalyticsParams) =>
    logEvent('ad_rewarded_earned', { coins, ...params }),
  adRewardedFailed: (reason: string, params?: AnalyticsParams) =>
    logEvent('ad_rewarded_failed', { reason, ...params }),
  adInterstitialShown: (params?: AnalyticsParams) => logEvent('ad_interstitial_shown', params),
  adBannerShown: (params?: AnalyticsParams) => logEvent('ad_banner_shown', params),

  chapterRead: (novelId: number, chapterNo: number, params?: AnalyticsParams) =>
    logEvent('chapter_read', { novel_id: novelId, chapter_no: chapterNo, ...params }),
  chapterUnlocked: (method: string, novelId: number, chapterNo: number) =>
    logEvent('chapter_free_accessed', { method, novel_id: novelId, chapter_no: chapterNo }),
  bookOpened: (novelId: number, title: string) =>
    logEvent('book_opened', { novel_id: novelId, title }),
  novelReadStarted: (novelId: number, params?: AnalyticsParams) =>
    logEvent('novel_read_started', { novel_id: novelId, ...params }),
  readingDepthReached: (novelId: number, depth: number, params?: AnalyticsParams) =>
    logEvent('reading_depth_reached', { novel_id: novelId, depth, ...params }),
  readerRewardTick: (amount: number, params?: AnalyticsParams) =>
    logEvent('reader_reward_tick', { amount, ...params }),
  readerScrollDepth: (novelId: number, chapterNo: number, depthPct: number, params?: AnalyticsParams) =>
    logEvent('reader_scroll_depth', { novel_id: novelId, chapter_no: chapterNo, depth_pct: depthPct, ...params }),
  readerInteraction: (action: string, params?: AnalyticsParams) =>
    logEvent('reader_interaction', { action, ...params }),
  searchPerformed: (query: string, params?: AnalyticsParams) =>
    logEvent('search_performed', { query_length: query.trim().length, ...params }),
  filterChanged: (filterName: string, filterValue: string, params?: AnalyticsParams) =>
    logEvent('filter_changed', { filter_name: filterName, filter_value: filterValue, ...params }),

  userSignup: (method: string) => logEvent('sign_up', { method }),
  userLogin: (method: string) => logEvent('login', { method }),
  authAttempt: (action: string, method: string, params?: AnalyticsParams) =>
    logEvent('auth_attempt', { action, method, ...params }),
  authResult: (action: string, method: string, success: boolean, params?: AnalyticsParams) =>
    logEvent('auth_result', { action, method, success, ...params }),

  coinsEarned: (source: string, amount: number) =>
    logEvent('coins_earned', { source, amount }),
  coinsSpent: (purpose: string, amount: number) =>
    logEvent('coins_spent', { purpose, amount }),
  diamondEarned: (amount: number) =>
    logEvent('diamond_earned', { amount }),

  dailyCheckin: (day: number) => logEvent('daily_checkin', { streak_day: day }),
  inviteSent: (params?: AnalyticsParams) => logEvent('invite_sent', params),
  inviteAction: (action: string, params?: AnalyticsParams) =>
    logEvent('invite_action', { action, ...params }),
  achievementClaimed: (name: string) => logEvent('achievement_claimed', { name }),
  rewardAction: (action: string, params?: AnalyticsParams) =>
    logEvent('reward_action', { action, ...params }),
  walletAction: (action: string, params?: AnalyticsParams) =>
    logEvent('wallet_action', { action, ...params }),
}
