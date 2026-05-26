<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useNovelStore } from '@/stores/novel'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useUserStore } from '@/stores/user'
import { chapterApi, interactionApi } from '@/services/api'
import type { Chapter } from '@/types'
import { capitalize } from '@/utils/text'
import AdBanner from '@/components/AdBanner.vue'
import AdInArticle from '@/components/AdInArticle.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import { useAds } from '@/composables/useAds'
import {
  removeBanner as removeAdMobBanner,
  showInterstitial as showAdMobInterstitial,
  isNativeApp,
} from '@/services/admob'
import { Analytics } from '@/services/analytics'

const route = useRoute()
const router = useRouter()
const store = useNovelStore()
const bookshelfStore = useBookshelfStore()
const userStore = useUserStore()
const { preloadRewarded, showRewarded } = useAds()
const nativeReader = isNativeApp()

const READER_TICK_COINS = 200
const READER_TICK_MS = 10000
const READER_BONUS_COINS = 300
const READER_BONUS_MS = 30000
const READER_SKIP_KEY = 'readwin-reader-bonus-skip-count'

const novelId = computed(() => Number(route.params.id))
const chapterNum = computed(() => Number(route.params.num))
const novel = computed(() => store.getNovelById(novelId.value))

const chapters = ref<Chapter[]>([])
const content = ref('')
const readerContent = computed(() => {
  const text = content.value?.trim()
  return text || store.getChapterContent(novelId.value, chapterNum.value)
})
const readerParagraphs = computed(() => {
  const text = readerContent.value?.trim()
  if (!text) return []
  return text
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
})
const paragraphSplitIndex = computed(() => Math.ceil(readerParagraphs.value.length / 2))
const contentTopParagraphs = computed(() => readerParagraphs.value.slice(0, paragraphSplitIndex.value))
const contentBottomParagraphs = computed(() => readerParagraphs.value.slice(paragraphSplitIndex.value))
const contentTop = computed(() => {
  const text = readerContent.value
  if (!text || text.length < 500) return text
  const mid = Math.floor(text.length / 2)
  const breakPoint = text.indexOf('\n', mid)
  return breakPoint > 0 ? text.slice(0, breakPoint) : text
})
const contentBottom = computed(() => {
  const text = readerContent.value
  if (!text || text.length < 500) return ''
  const mid = Math.floor(text.length / 2)
  const breakPoint = text.indexOf('\n', mid)
  return breakPoint > 0 ? text.slice(breakPoint + 1) : ''
})
const chapterLoading = ref(false)
const readerBonusVisible = ref(false)
const readerBonusActionLocked = ref(false)
const readerDoubleClaiming = ref(false)
const readerCoinBursts = ref<{ id: number; amount: number; kind: 'tick' | 'bonus' | 'double' }[]>([])
const readerFlyingCoins = ref<{ id: number; delay: number; offset: number }[]>([])
const readerBalance = computed(() => userStore.displayCoinBalance)
const readerBonusRemainingMs = ref(READER_BONUS_MS)
const readerBonusReady = computed(() => readerBonusRemainingMs.value <= 0)
const readerBonusCountdown = computed(() => {
  if (readerBonusReady.value) return 'Ready'
  const totalSeconds = Math.ceil(readerBonusRemainingMs.value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
let readerRewardTimer: number | null = null
let readerBonusTimer: number | null = null
let readerBonusCountdownTimer: number | null = null
let readerBonusDueAt = 0
let readerRewardId = 0
let readerNativeBannerVisible = false
let readerNativeBannerBusy = false
let readerBackNavigationBusy = false

const liked = ref(false)
const likeCount = ref(0)
const likeLoading = ref(false)
const hasRated = ref(false)
const userRating = ref(0)
const chapter = computed(() => chapters.value.find(c => c.chapter_no === chapterNum.value))
const nextChapter = computed(() => chapters.value.find(c => c.chapter_no === chapterNum.value + 1))
const nextChapterPreview = ref('')

const SETTINGS_KEY = 'readwin-reader-settings'
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}
function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      fontSizeIndex: fontSizeIndex.value,
      lineHeightIndex: lineHeightIndex.value,
      bgMode: bgMode.value,
      fontFamily: fontFamily.value,
    }),
  )
}

const fontSizes = [14, 16, 18, 20, 22] as const
const fontSizeIndex = ref(2)
const fontSize = computed(() => fontSizes[fontSizeIndex.value])

const lineHeights = [1.6, 1.8, 2.0] as const
const lineHeightIndex = ref(1)
const lineHeight = computed(() => lineHeights[lineHeightIndex.value])

const fontFamilies = ['Merriweather, Georgia, serif', 'Inter, sans-serif', 'Georgia, serif'] as const
const fontFamilyNames = ['Editorial', 'Sans', 'Classic'] as const
const fontFamily = ref<(typeof fontFamilies)[number]>(fontFamilies[0])

type BgMode = 'light' | 'sepia' | 'dark' | 'black'
const bgMode = ref<BgMode>('light')
const bgStyles: Record<BgMode, { bg: string; text: string; border: string; label: string; chip: string; card: string }> = {
  light: { bg: '#FFF5F8', text: '#172033', border: '#FFD6E6', label: 'Light', chip: '#FFF0F6', card: 'rgba(255,255,255,0.9)' },
  sepia: { bg: '#F5EFE3', text: '#3D3225', border: '#D6CAB7', label: 'Sepia', chip: '#EFE6D6', card: 'rgba(255,250,242,0.88)' },
  dark: { bg: '#162033', text: '#D8E2F0', border: '#334155', label: 'Night', chip: '#223148', card: 'rgba(17,24,39,0.76)' },
  black: { bg: '#090909', text: '#D4D4D4', border: '#262626', label: 'OLED', chip: '#171717', card: 'rgba(14,14,14,0.84)' },
}
const currentBg = computed(() => bgStyles[bgMode.value])

const saved = loadSettings()
if (saved.fontSizeIndex !== undefined) fontSizeIndex.value = saved.fontSizeIndex
if (saved.lineHeightIndex !== undefined) lineHeightIndex.value = saved.lineHeightIndex
if (saved.bgMode) bgMode.value = saved.bgMode
if (saved.fontFamily) fontFamily.value = saved.fontFamily
watch([fontSizeIndex, lineHeightIndex, bgMode, fontFamily], saveSettings)

if (window.matchMedia?.('(prefers-color-scheme: dark)').matches && !localStorage.getItem(SETTINGS_KEY)) {
  bgMode.value = 'dark'
}

const CHAPTERS_READ_KEY = 'readwin-chapters-read-count'
const READ_NOVELS_KEY = 'readwin-read-novel-ids'
const READ_DEPTH_KEY = 'readwin-reading-depth-milestones'
const READ_DEPTH_MILESTONES = [1, 3, 5, 10, 20, 50, 100] as const
const READER_SCROLL_MILESTONES = [25, 50, 75, 90] as const
let readerScrollMilestones = new Set<number>()

function getChaptersReadCount(): number {
  return parseInt(localStorage.getItem(CHAPTERS_READ_KEY) || '0', 10)
}
function incrementChaptersRead(): number {
  const count = getChaptersReadCount() + 1
  localStorage.setItem(CHAPTERS_READ_KEY, String(count))
  return count
}
async function triggerInterstitialAd(readCount: number) {
  if (!nativeReader) return
  if (readCount < 5 || readCount % 5 !== 0) return

  await showAdMobInterstitial({
    minIntervalMs: 180_000,
    source: 'reader_chapter_interval',
    trigger: `chapter_read_count_${readCount}`,
    screenName: 'chapter',
  })
}

async function syncReaderNativeBanner(forceRemove = false) {
  if (!nativeReader || readerNativeBannerBusy) return
  // Native overlay banners sit above the WebView on Android. They are disabled
  // here to keep the reader and reward popups fully tappable.
  if (!forceRemove && !readerNativeBannerVisible) return
  readerNativeBannerBusy = true
  try {
    await removeAdMobBanner()
    readerNativeBannerVisible = false
  } finally {
    readerNativeBannerBusy = false
  }
}

function startReaderRewards() {
  stopReaderRewards()
  if (nativeReader) {
    preloadRewarded()
  }
  readerRewardTimer = window.setInterval(() => {
    if (readerBonusVisible.value) return
    grantReaderCoins(READER_TICK_COINS, 'tick')
  }, READER_TICK_MS)
  scheduleReaderBonus()
}

function stopReaderRewards() {
  if (readerRewardTimer) {
    window.clearInterval(readerRewardTimer)
    readerRewardTimer = null
  }
  if (readerBonusTimer) {
    window.clearTimeout(readerBonusTimer)
    readerBonusTimer = null
  }
  if (readerBonusCountdownTimer) {
    window.clearInterval(readerBonusCountdownTimer)
    readerBonusCountdownTimer = null
  }
  readerBonusVisible.value = false
  readerDoubleClaiming.value = false
  readerBonusActionLocked.value = false
}

function cleanupReaderRewardState() {
  stopReaderRewards()
  readerCoinBursts.value = []
  readerFlyingCoins.value = []
  readerBonusRemainingMs.value = READER_BONUS_MS
}

function scheduleReaderBonus() {
  if (readerBonusTimer) window.clearTimeout(readerBonusTimer)
  if (readerBonusCountdownTimer) window.clearInterval(readerBonusCountdownTimer)

  readerBonusDueAt = Date.now() + READER_BONUS_MS
  updateReaderBonusCountdown()
  readerBonusCountdownTimer = window.setInterval(updateReaderBonusCountdown, 1000)
  readerBonusTimer = window.setTimeout(() => {
    readerBonusRemainingMs.value = 0
    readerBonusVisible.value = true
  }, READER_BONUS_MS)
}

function updateReaderBonusCountdown() {
  readerBonusRemainingMs.value = Math.max(0, readerBonusDueAt - Date.now())
}

function openReaderBonusFromIcon() {
  if (!readerBonusReady.value) return
  readerBonusVisible.value = true
}

async function goBackToBookDetail() {
  if (readerBackNavigationBusy) return
  readerBackNavigationBusy = true
  try {
    readerBonusVisible.value = false
    stopReaderRewards()
    await syncReaderNativeBanner(true)
    Analytics.readerInteraction('reader_back_to_detail_ui_click', {
      novel_id: novelId.value,
      chapter_no: chapterNum.value,
      scroll_depth_pct: Math.round(readProgress.value),
    })
    await router.replace(`/book/${novelId.value}`)
  } finally {
    window.setTimeout(() => {
      readerBackNavigationBusy = false
    }, 600)
  }
}

function grantReaderCoins(amount: number, kind: 'tick' | 'bonus' | 'double') {
  userStore.addCoins(amount)
  spawnCoinBurst(amount, kind)
  Analytics.readerRewardTick(amount, {
    source: `reader_${kind}`,
    novel_id: novelId.value,
    chapter_no: chapterNum.value,
    currency_type: 'coins',
  })
  Analytics.coinsEarned(`reader_${kind}`, amount)
}

function formatCoins(value: number) {
  return Number(value || 0).toLocaleString()
}

function spawnCoinBurst(amount: number, kind: 'tick' | 'bonus' | 'double') {
  const id = ++readerRewardId
  readerCoinBursts.value.push({ id, amount, kind })
  window.setTimeout(() => {
    readerCoinBursts.value = readerCoinBursts.value.filter(item => item.id !== id)
  }, 1300)

  const coinCount = kind === 'tick' ? 6 : 10
  for (let index = 0; index < coinCount; index += 1) {
    const coinId = ++readerRewardId
    readerFlyingCoins.value.push({
      id: coinId,
      delay: index * 70,
      offset: (index - Math.floor(coinCount / 2)) * 9,
    })
    window.setTimeout(() => {
      readerFlyingCoins.value = readerFlyingCoins.value.filter(item => item.id !== coinId)
    }, 1400 + index * 70)
  }
}

function getReaderSkipCount() {
  return Number(localStorage.getItem(READER_SKIP_KEY) || 0)
}

function setReaderSkipCount(value: number) {
  localStorage.setItem(READER_SKIP_KEY, String(Math.max(0, value)))
}

function lockReaderBonusAction() {
  if (readerBonusActionLocked.value) return false
  readerBonusActionLocked.value = true
  return true
}

function unlockReaderBonusAction(delay = 350) {
  window.setTimeout(() => {
    readerBonusActionLocked.value = false
  }, delay)
}

function claimReaderBonus() {
  if (!lockReaderBonusAction()) return
  try {
    readerBonusVisible.value = false
    setReaderSkipCount(0)
    grantReaderCoins(READER_BONUS_COINS, 'bonus')
    scheduleReaderBonus()
  } finally {
    unlockReaderBonusAction()
  }
}

async function claimReaderBonusDouble() {
  if (readerDoubleClaiming.value || !lockReaderBonusAction()) return
  readerDoubleClaiming.value = true
  readerBonusVisible.value = false
  try {
    if (!isNativeApp()) {
      grantReaderCoins(READER_BONUS_COINS * 2, 'double')
      setReaderSkipCount(0)
      readerBonusVisible.value = false
      scheduleReaderBonus()
      return
    }
    const shown = await showRewarded(
      () => {
        grantReaderCoins(READER_BONUS_COINS * 2, 'double')
        setReaderSkipCount(0)
      },
      {
        source: 'reader_bonus_double',
        rewardReason: 'reader_bonus_double',
        rewardAmount: READER_BONUS_COINS * 2,
        currencyType: 'coins',
        screenName: 'chapter',
      },
    )
    if (shown) {
      scheduleReaderBonus()
    } else {
      grantReaderCoins(READER_BONUS_COINS, 'bonus')
      scheduleReaderBonus()
    }
  } finally {
    readerDoubleClaiming.value = false
    unlockReaderBonusAction()
  }
}

async function skipReaderBonus() {
  if (!lockReaderBonusAction()) return
  try {
    readerBonusVisible.value = false
    const nextSkipCount = getReaderSkipCount() + 1
    if (nextSkipCount >= 2) {
      setReaderSkipCount(0)
      if (isNativeApp()) {
        try {
          await showAdMobInterstitial({
            minIntervalMs: 90_000,
            source: 'reader_bonus_skip_pressure',
            trigger: 'two_bonus_skips',
            screenName: 'chapter',
          })
        } finally {
          scheduleReaderBonus()
        }
      } else {
        scheduleReaderBonus()
      }
      return
    }
    setReaderSkipCount(nextSkipCount)
    scheduleReaderBonus()
  } finally {
    unlockReaderBonusAction()
  }
}

const BOOKMARK_KEY = 'readwin-bookmarks'
function saveBookmark() {
  try {
    const bookmarks = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '{}')
    bookmarks[novelId.value] = { chapter: chapterNum.value, scroll: window.scrollY, ts: Date.now() }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks))
  } catch {}
}
function getBookmark(nid: number) {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '{}')[nid]
  } catch {
    return null
  }
}

const readProgress = ref(0)
const totalChapters = computed(() => Math.max(1, Number(novel.value?.total_chapters || chapters.value.length || 1)))
const bookProgress = computed(() => Math.min(100, Math.round((chapterNum.value / totalChapters.value) * 100)))
function updateProgress() {
  const scroll = window.scrollY
  const distance = document.documentElement.scrollHeight - window.innerHeight
  readProgress.value = distance > 0 ? Math.min(100, (scroll / distance) * 100) : 0
  for (const milestone of READER_SCROLL_MILESTONES) {
    if (readProgress.value >= milestone && !readerScrollMilestones.has(milestone)) {
      readerScrollMilestones.add(milestone)
      Analytics.readerScrollDepth(novelId.value, chapterNum.value, milestone, {
        book_progress_pct: bookProgress.value,
        category: novelCategoryName(),
        content_available: readerContent.value.trim().length > 0,
      })
    }
  }
  saveBookmark()
  void syncReaderNativeBanner()
}

const showToolbar = ref(false)
const showChapterList = ref(false)
const showSettingsPanel = ref(false)

const ONBOARDING_KEY = 'readwin-tap-zone-onboarded'
const showTapOnboarding = ref(!nativeReader && !localStorage.getItem(ONBOARDING_KEY))
function dismissOnboarding() {
  showTapOnboarding.value = false
  localStorage.setItem(ONBOARDING_KEY, '1')
}

function handleContentTap(e: MouseEvent | TouchEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button, a, [role="button"], .unlock-zone, input, select, textarea')) return
  const clientX = 'touches' in e ? (e.changedTouches[0]?.clientX ?? 0) : e.clientX
  const zone = clientX / window.innerWidth

  if (zone < 0.33) {
    Analytics.readerInteraction('tap_previous_zone', {
      novel_id: novelId.value,
      chapter_no: chapterNum.value,
      scroll_depth_pct: Math.round(readProgress.value),
    })
    window.scrollBy({ top: -window.innerHeight * 0.85, behavior: 'smooth' })
  } else if (zone > 0.67) {
    Analytics.readerInteraction('tap_next_zone', {
      novel_id: novelId.value,
      chapter_no: chapterNum.value,
      scroll_depth_pct: Math.round(readProgress.value),
    })
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })
  } else {
    showToolbar.value = !showToolbar.value
    Analytics.readerInteraction(showToolbar.value ? 'toolbar_open' : 'toolbar_close', {
      novel_id: novelId.value,
      chapter_no: chapterNum.value,
      scroll_depth_pct: Math.round(readProgress.value),
    })
    if (!showToolbar.value) {
      showSettingsPanel.value = false
      showChapterList.value = false
    }
  }
}

const hasPrev = computed(() => chapterNum.value > 1)
const hasNext = computed(() => chapterNum.value < totalChapters.value)
const chapterHeading = computed(() =>
  chapter.value?.title ? `Chapter ${chapterNum.value}: ${capitalize(chapter.value.title)}` : `Chapter ${chapterNum.value}`,
)
const estimatedMinutes = computed(() => {
  const words = chapter.value?.word_count || readerContent.value.trim().split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.round(words / 220))
})
const readingModeName = computed(() => {
  const labels: Record<BgMode, string> = {
    light: 'Paper',
    sepia: 'Sepia',
    dark: 'Night',
    black: 'OLED',
  }
  return labels[bgMode.value]
})
const readerSurfaceStyle = computed(() => ({
  backgroundColor: currentBg.value.card,
  borderColor: currentBg.value.border,
  color: currentBg.value.text,
}))
const toolbarSurfaceStyle = computed(() => ({
  backgroundColor: bgMode.value === 'light' || bgMode.value === 'sepia'
    ? 'rgba(255,255,255,0.85)'
    : 'rgba(10,15,24,0.86)',
  borderColor: currentBg.value.border,
  color: currentBg.value.text,
}))

async function goChapter(num: number) {
  const targetChapter = safeChapter(num)
  showToolbar.value = false
  showChapterList.value = false
  showSettingsPanel.value = false
  await router.push(`/book/${novelId.value}/chapter/${targetChapter}`)
  await nextTick()
  window.scrollTo(0, 0)
}

function safeChapter(num: number) {
  const next = Number.isFinite(num) ? Math.floor(num) : 1
  return Math.min(Math.max(next, 1), totalChapters.value)
}

function readJsonValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJsonValue<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function trackNovelReadStarted() {
  const ids = readJsonValue<number[]>(READ_NOVELS_KEY, [])
  if (ids.includes(novelId.value)) return ids.length
  const nextIds = [...ids, novelId.value]
  writeJsonValue(READ_NOVELS_KEY, nextIds)
  Analytics.novelReadStarted(novelId.value, {
    novel_count: nextIds.length,
    chapter_no: chapterNum.value,
    total_chapters: totalChapters.value,
    category: novelCategoryName(),
  })
  return nextIds.length
}

function trackReadingDepth(readCount: number) {
  const depthMap = readJsonValue<Record<string, number[]>>(READ_DEPTH_KEY, {})
  const key = String(novelId.value)
  const reached = new Set(depthMap[key] || [])
  const newlyReached = READ_DEPTH_MILESTONES.filter(depth => chapterNum.value >= depth && !reached.has(depth))

  if (!newlyReached.length) return
  newlyReached.forEach(depth => {
    reached.add(depth)
    Analytics.readingDepthReached(novelId.value, depth, {
      chapter_no: chapterNum.value,
      total_chapters: totalChapters.value,
      book_progress_pct: bookProgress.value,
      global_chapter_read_count: readCount,
      category: novelCategoryName(),
    })
  })

  depthMap[key] = [...reached].sort((a, b) => a - b)
  writeJsonValue(READ_DEPTH_KEY, depthMap)
}

function trackChapterRead(readCount: number) {
  const novelCount = trackNovelReadStarted()
  Analytics.chapterRead(novelId.value, chapterNum.value, {
    total_chapters: totalChapters.value,
    book_progress_pct: bookProgress.value,
    is_first_chapter: chapterNum.value === 1,
    global_chapter_read_count: readCount,
    novel_count: novelCount,
    category: novelCategoryName(),
    word_count: chapter.value?.word_count || readerContent.value.trim().split(/\s+/).filter(Boolean).length,
    content_available: readerContent.value.trim().length > 0,
  })
  trackReadingDepth(readCount)
}

function novelCategoryName(): string {
  return novel.value?.category?.display_name || novel.value?.category?.name || ''
}

async function doLike() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (likeLoading.value) return
  likeLoading.value = true
  try {
    const data = await interactionApi.like(novelId.value)
    liked.value = data.liked
    likeCount.value = data.like_count
  } catch {} finally {
    likeLoading.value = false
  }
}

async function doRate(rating: number) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    await interactionApi.rate(novelId.value, rating)
    userRating.value = rating
    hasRated.value = true
  } catch {}
}

async function loadInteractionStatus() {
  if (!userStore.isLoggedIn) return
  try {
    const data = await interactionApi.likeStatus(novelId.value)
    liked.value = data.liked
    likeCount.value = data.like_count
  } catch {}
  try {
    const data = await interactionApi.rateStatus(novelId.value)
    hasRated.value = data.rated
    userRating.value = data.rating || 0
  } catch {}
}

async function loadChapter() {
  chapterLoading.value = true
  nextChapterPreview.value = ''
  readerScrollMilestones = new Set<number>()

  try {
    await store.init()
    if (!chapters.value.length) chapters.value = await chapterApi.list(novelId.value)
    const normalizedChapter = safeChapter(chapterNum.value)
    if (normalizedChapter !== chapterNum.value) {
      await router.replace(`/book/${novelId.value}/chapter/${normalizedChapter}`)
      return
    }
    content.value = await chapterApi.getContent(novelId.value, chapterNum.value)

    if (novel.value) bookshelfStore.updateReadProgress(novel.value, chapterNum.value)

    if (hasNext.value) {
      try {
        const nextContent = await chapterApi.getContent(novelId.value, chapterNum.value + 1)
        nextChapterPreview.value = nextContent?.slice(0, 200) || ''
      } catch {}
    }

    const bookmark = getBookmark(novelId.value)
    if (bookmark && bookmark.chapter === chapterNum.value && bookmark.scroll > 0) {
      await nextTick()
      window.scrollTo(0, bookmark.scroll)
    }

    const readCount = incrementChaptersRead()
    trackChapterRead(readCount)
    void triggerInterstitialAd(readCount)
    await loadInteractionStatus()
  } catch {
    if (!chapters.value.length) chapters.value = store.getChapters(novelId.value)
    content.value = store.getChapterContent(novelId.value, chapterNum.value)
  } finally {
    if (!chapters.value.length) chapters.value = store.getChapters(novelId.value)
    if (!content.value?.trim()) content.value = store.getChapterContent(novelId.value, chapterNum.value)
    chapterLoading.value = false
  }
}

watch(() => route.params.num, () => loadChapter(), { immediate: false })

onMounted(() => {
  loadChapter()
  startReaderRewards()
  window.addEventListener('scroll', updateProgress)
  updateProgress()
  window.setTimeout(() => {
    void syncReaderNativeBanner()
  }, 900)
})

onUnmounted(() => {
  cleanupReaderRewardState()
  window.removeEventListener('scroll', updateProgress)
  void syncReaderNativeBanner(true)
  saveBookmark()
})

onBeforeRouteLeave(() => {
  cleanupReaderRewardState()
  void syncReaderNativeBanner(true)
  saveBookmark()
})
</script>

<template>
  <div
    class="reader-page min-h-screen select-none"
    :class="{ 'reader-page-native': nativeReader }"
    :style="{ backgroundColor: currentBg.bg, color: currentBg.text }"
    @click="handleContentTap"
  >
    <div v-if="showTapOnboarding" class="tap-onboarding" @click="dismissOnboarding">
      <div class="tap-zone">
        <span class="tap-icon">◀</span>
        <span>Previous</span>
      </div>
      <div class="tap-zone tap-zone-center">
        <span class="tap-icon">◎</span>
        <span>Menu</span>
      </div>
      <div class="tap-zone">
        <span class="tap-icon">▶</span>
        <span>Next</span>
      </div>
      <p class="tap-note">Tap anywhere to dismiss</p>
    </div>

    <div class="reader-progress-track" :style="{ backgroundColor: currentBg.border }">
      <div class="reader-progress-fill" :style="{ width: `${readProgress}%` }"></div>
    </div>

    <div v-if="nativeReader" class="reader-native-topbar" @click.stop>
      <button
        class="reader-native-back"
        type="button"
        aria-label="Back to story"
        @pointerup.prevent.stop="goBackToBookDetail"
        @click.prevent.stop="goBackToBookDetail"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <button class="reader-coin-bank reader-coin-bank-native" type="button" @click="router.push('/reward')">
        <CoinIcon size="18px" />
        <span>{{ formatCoins(readerBalance) }}</span>
      </button>

    </div>

    <button
      v-if="nativeReader"
      class="reader-redpacket reader-redpacket-float"
      type="button"
      :class="{ ready: readerBonusReady }"
      aria-label="Timed reading reward"
      @click.stop="openReaderBonusFromIcon"
    >
      <span class="reader-redpacket-icon" aria-hidden="true"><CoinIcon size="20px" /></span>
      <span class="reader-redpacket-copy">
        <strong>{{ readerBonusCountdown }}</strong>
        <small>+{{ READER_BONUS_COINS }}</small>
      </span>
    </button>

    <div v-else class="reader-coin-bank" @click.stop>
      <CoinIcon size="18px" />
      <span>{{ formatCoins(readerBalance) }}</span>
    </div>

    <span
      v-for="burst in readerCoinBursts"
      :key="burst.id"
      class="reader-coin-burst"
      :class="`reader-coin-burst-${burst.kind}`"
    >
      +{{ burst.amount }}
    </span>

    <span
      v-for="coin in readerFlyingCoins"
      :key="coin.id"
      class="reader-flying-coin"
      :style="{ '--coin-delay': `${coin.delay}ms`, '--coin-offset': `${coin.offset}px` }"
      aria-hidden="true"
    >
      <CoinIcon size="18px" />
    </span>

    <Transition name="reader-bonus" :duration="{ enter: 220, leave: 220 }">
      <div v-if="readerBonusVisible" class="reader-bonus-overlay" @click.stop>
        <div class="reader-bonus-card">
          <p class="reader-bonus-title">Congratulations</p>
          <div class="reader-bonus-art">
            <span class="reader-bonus-coin-stack">★★★</span>
            <strong>+{{ READER_BONUS_COINS }}</strong>
          </div>
          <button
            class="reader-bonus-double"
            type="button"
            :disabled="readerDoubleClaiming"
            @pointerup.prevent.stop="claimReaderBonusDouble"
            @click.prevent.stop="claimReaderBonusDouble"
          >
            {{ readerDoubleClaiming ? 'Loading video...' : `Watch video for +${READER_BONUS_COINS * 2}` }}
          </button>
          <button
            class="reader-bonus-claim"
            type="button"
            @pointerup.prevent.stop="claimReaderBonus"
            @click.prevent.stop="claimReaderBonus"
          >
            Claim +{{ READER_BONUS_COINS }}
          </button>
          <button
            class="reader-bonus-skip"
            type="button"
            @pointerup.prevent.stop="skipReaderBonus"
            @click.prevent.stop="skipReaderBonus"
          >
            Skip
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="slide-down">
      <header
        v-if="showToolbar && !nativeReader"
        class="reader-floating-header"
        :style="toolbarSurfaceStyle"
        @click.stop
      >
        <button
          @click="router.push(`/book/${novelId}`)"
          class="toolbar-icon"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <p class="toolbar-title truncate">{{ novel?.title }}</p>
          <p class="toolbar-meta">Ch.{{ chapterNum }} · {{ bookProgress }}% of book</p>
        </div>
      </header>
    </Transition>

    <article class="reader-shell max-w-[820px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-8">
      <section class="reader-intro" :style="readerSurfaceStyle">
        <p class="reader-kicker">{{ novel?.title || 'Reading Mode' }}</p>
        <h1 class="reader-title">{{ chapterHeading }}</h1>
        <div class="reader-meta-row">
          <span>{{ estimatedMinutes }} min read</span>
          <span>{{ bookProgress }}% through book</span>
          <span>{{ readingModeName }} mode</span>
        </div>
      </section>

      <div class="reader-content-flow">
        <div v-if="!nativeReader" class="reader-start-ad" @click.stop>
          <AdBanner format="banner" position="top" />
        </div>

        <section v-if="chapterLoading" class="reader-sheet reader-loading" :style="readerSurfaceStyle">
          <div class="chapter-loader">
            <div class="book-flip">
              <div class="page"></div>
              <div class="page"></div>
              <div class="page"></div>
            </div>
          </div>
          <p>Loading chapter...</p>
        </section>

        <section v-else class="reader-sheet" :style="readerSurfaceStyle">
          <div
            class="reader-prose"
            :style="{ fontFamily, fontSize: `${fontSize}px`, lineHeight }"
          >
            <template v-if="readerParagraphs.length">
              <p v-for="(paragraph, index) in contentTopParagraphs" :key="`top-${index}`">{{ paragraph }}</p>
              <div v-if="contentBottomParagraphs.length && !nativeReader" class="reader-inline-ad">
                <AdInArticle />
              </div>
              <p v-for="(paragraph, index) in contentBottomParagraphs" :key="`bottom-${index}`">{{ paragraph }}</p>
            </template>
            <div v-else class="reader-empty-copy">
              Chapter content is loading. Pull back once and open the chapter again if the network is slow.
            </div>
          </div>
        </section>

        <section class="reader-end-card" :style="readerSurfaceStyle">
          <div class="reader-end-head">
            <div>
              <p class="reader-kicker">Chapter complete</p>
              <h2 class="reader-end-title">Keep momentum while the hook is still fresh.</h2>
            </div>
          </div>

          <div class="reader-feedback-row">
            <button @click.stop="doLike" class="feedback-button" :style="{ borderColor: currentBg.border }">
              <span>{{ liked ? '♥' : '♡' }}</span>
              <span>{{ liked ? 'Liked' : 'Like' }}</span>
              <span v-if="likeCount">· {{ likeCount }}</span>
            </button>

            <div class="rating-row">
              <span class="rating-label">{{ hasRated ? 'Your rating' : 'Rate this chapter' }}</span>
              <div class="flex items-center gap-1">
                <button
                  v-for="i in 5"
                  :key="i"
                  @click.stop="doRate(i)"
                  class="rating-star"
                >
                  {{ i <= userRating ? '★' : '☆' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="hasNext && nextChapter" class="next-chapter-card">
            <p class="reader-kicker">Up next</p>
            <h3>Chapter {{ chapterNum + 1 }}: {{ capitalize(nextChapter.title) }}</h3>
            <p v-if="nextChapterPreview" class="line-clamp-3">{{ nextChapterPreview }}</p>
            <div v-if="!nativeReader" class="mt-4 mb-2">
              <AdBanner format="banner" position="bottom" />
            </div>
            <button @click.stop="goChapter(chapterNum + 1)" class="next-primary">
              Read Next Free Chapter
            </button>
          </div>

          <div v-else class="next-chapter-card next-chapter-complete">
            <p class="reader-kicker">Book complete</p>
            <h3>You finished the book.</h3>
            <p>Leave a rating, save it to your favorites, and jump back to the detail page for your next pick.</p>
            <div v-if="!nativeReader" class="mt-4 mb-2">
              <AdBanner format="banner" position="bottom" />
            </div>
            <button @click.stop="router.push('/book/' + novelId)" class="next-primary">
              Back to Story Page
            </button>
          </div>
        </section>
      </div>
    </article>

    <div
      v-if="!isNativeApp() && !showToolbar"
      class="reader-app-bar"
    >
      <div class="reader-app-copy">
        <span class="reader-app-icon">📱</span>
        <span>Read in the app for smoother chapter sessions</span>
      </div>
      <a
        href="https://play.google.com/store/apps/details?id=me.readwin.app"
        target="_blank"
        rel="noopener"
        class="reader-app-button"
      >
        Open App
      </a>
    </div>

    <Transition name="slide-up">
      <div
        v-if="showToolbar || nativeReader"
        class="reader-bottom-toolbar"
        :style="toolbarSurfaceStyle"
        @click.stop
      >
        <Transition name="slide-up">
          <div
            v-if="showSettingsPanel"
            class="toolbar-panel"
            :style="{ borderColor: currentBg.border }"
          >
            <div class="toolbar-panel-inner">
              <div class="toolbar-row">
                <span class="toolbar-label">Size</span>
                <div class="toolbar-button-row">
                  <button
                    v-for="(size, index) in fontSizes"
                    :key="size"
                    @click="fontSizeIndex = index"
                    class="toolbar-pill-button"
                    :class="{ 'toolbar-pill-button-active': fontSizeIndex === index }"
                    :style="{ color: fontSizeIndex === index ? '#fff' : currentBg.text, backgroundColor: fontSizeIndex === index ? '#ff2f83' : currentBg.chip }"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>

              <div class="toolbar-row">
                <span class="toolbar-label">Font</span>
                <div class="toolbar-button-row">
                  <button
                    v-for="(ff, index) in fontFamilies"
                    :key="ff"
                    @click="fontFamily = ff"
                    class="toolbar-pill-button"
                    :class="{ 'toolbar-pill-button-active': fontFamily === ff }"
                    :style="{ color: fontFamily === ff ? '#fff' : currentBg.text, backgroundColor: fontFamily === ff ? '#ff2f83' : currentBg.chip }"
                  >
                    {{ fontFamilyNames[index] }}
                  </button>
                </div>
              </div>

              <div class="toolbar-row">
                <span class="toolbar-label">Spacing</span>
                <div class="toolbar-button-row">
                  <button
                    v-for="(lh, index) in lineHeights"
                    :key="lh"
                    @click="lineHeightIndex = index"
                    class="toolbar-pill-button"
                    :class="{ 'toolbar-pill-button-active': lineHeightIndex === index }"
                    :style="{ color: lineHeightIndex === index ? '#fff' : currentBg.text, backgroundColor: lineHeightIndex === index ? '#ff2f83' : currentBg.chip }"
                  >
                    {{ lh }}x
                  </button>
                </div>
              </div>

              <div class="toolbar-row">
                <span class="toolbar-label">Theme</span>
                <div class="toolbar-theme-row">
                  <button
                    v-for="(style, mode) in bgStyles"
                    :key="mode"
                    @click="bgMode = mode as BgMode"
                    class="toolbar-theme-button"
                    :class="{ 'toolbar-theme-button-active': bgMode === mode }"
                    :style="{ backgroundColor: style.bg, borderColor: style.border }"
                  >
                    {{ style.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="slide-up">
          <div
            v-if="showChapterList"
            class="toolbar-panel toolbar-panel-list"
            :style="{ borderColor: currentBg.border }"
          >
            <div class="toolbar-panel-inner">
              <p class="reader-kicker mb-3">Chapter list</p>
              <div class="space-y-1 max-h-[45vh] overflow-y-auto">
                <button
                  v-for="ch in chapters"
                  :key="ch.chapter_no"
                  @click="goChapter(ch.chapter_no)"
                  class="chapter-list-row"
                  :style="{ backgroundColor: ch.chapter_no === chapterNum ? currentBg.chip : 'transparent' }"
                >
                  <span class="truncate">{{ ch.chapter_no }}. {{ ch.title }}</span>
                  <span class="chapter-list-pill chapter-list-pill-free">Free</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <div class="toolbar-progress">
          <span>Ch.{{ chapterNum }}</span>
          <div class="toolbar-progress-track" :style="{ backgroundColor: currentBg.border }">
            <div class="toolbar-progress-fill" :style="{ width: `${bookProgress}%` }"></div>
          </div>
          <span>{{ bookProgress }}%</span>
        </div>

        <div class="toolbar-actions">
          <button @click="hasPrev && goChapter(chapterNum - 1)" :disabled="!hasPrev" class="toolbar-icon" :class="{ 'toolbar-icon-disabled': !hasPrev }">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button @click="showChapterList = !showChapterList; showSettingsPanel = false" class="toolbar-icon" :style="{ backgroundColor: showChapterList ? currentBg.chip : 'transparent' }">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
          </button>
          <button @click="showSettingsPanel = !showSettingsPanel; showChapterList = false" class="toolbar-icon" :style="{ backgroundColor: showSettingsPanel ? currentBg.chip : 'transparent' }">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
          </button>
          <button @click="hasNext && goChapter(chapterNum + 1)" :disabled="!hasNext" class="toolbar-icon" :class="{ 'toolbar-icon-disabled': !hasNext }">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.reader-page {
  background-image:
    radial-gradient(circle at top right, rgba(255, 91, 142, 0.18), transparent 24%),
    radial-gradient(circle at 18% 0%, rgba(255, 204, 54, 0.11), transparent 20%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 42%);
}

.reader-page-native .reader-shell {
  padding-top: calc(env(safe-area-inset-top, 0px) + 76px);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 188px);
}

.reader-page::before {
  content: '';
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 64;
  height: calc(env(safe-area-inset-top, 0px) + 66px);
  background:
    radial-gradient(circle at 92% 42%, rgba(255, 90, 140, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(15, 8, 18, 0.36), rgba(15, 8, 18, 0.08));
  pointer-events: none;
}

.tap-onboarding {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  background: rgba(3, 7, 18, 0.76);
  backdrop-filter: blur(6px);
}

.tap-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 700;
}

.tap-zone-center {
  border-left: 1px solid rgba(255, 255, 255, 0.16);
  border-right: 1px solid rgba(255, 255, 255, 0.16);
}

.tap-icon {
  font-size: 28px;
}

.tap-note {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.reader-progress-track {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  height: 3px;
}

.reader-progress-fill,
.toolbar-progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #ff2f83, #ff6a5f);
}

.reader-native-topbar {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 10px);
  left: 12px;
  right: 76px;
  z-index: 94;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  pointer-events: none;
}

.reader-native-topbar button {
  pointer-events: auto;
}

.reader-native-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: rgba(14, 10, 18, 0.72);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24), inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(16px);
}

.reader-coin-bank {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 25px);
  left: 86px;
  z-index: 70;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 0;
  border-radius: 0;
  color: #fff;
  background: transparent;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  font-size: 17px;
  line-height: 1;
  font-weight: 1000;
  text-shadow: 0 2px 7px rgba(0, 0, 0, 0.48);
}

.reader-coin-bank-native {
  position: static;
  justify-self: start;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(14, 10, 18, 0.58);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12), 0 10px 24px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
  font-size: 15px;
}

.reader-redpacket {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  padding: 4px 10px 4px 6px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 246, 188, 0.45), transparent 24%),
    linear-gradient(135deg, #ff2f83, #ff7a45);
  box-shadow: 0 14px 26px rgba(255, 49, 126, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(12px);
}

.reader-redpacket-float {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 96px);
  right: 86px;
  z-index: 86;
}

.reader-redpacket.ready {
  animation: redpacketPulse 1.1s ease-in-out infinite;
}

.reader-redpacket-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.22);
}

.reader-redpacket-copy {
  display: grid;
  gap: 1px;
  text-align: left;
  line-height: 1;
}

.reader-redpacket-copy strong {
  font-size: 11px;
  font-weight: 1000;
}

.reader-redpacket-copy small {
  color: #fff7a8;
  font-size: 10px;
  font-weight: 900;
}

.reader-coin-burst {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 10px);
  left: 102px;
  z-index: 72;
  color: #ffe852;
  font-size: 12px;
  font-weight: 1000;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.52);
  pointer-events: none;
  animation: readerCoinBurst 1.3s ease-out forwards;
}

.reader-coin-burst-double {
  color: #fff7a8;
}

.reader-flying-coin {
  --coin-delay: 0ms;
  --coin-offset: 0px;
  position: fixed;
  top: 45%;
  right: calc(18px + var(--coin-offset));
  z-index: 71;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 0 10px rgba(255, 198, 38, 0.68));
  pointer-events: none;
  animation: readerCoinFly 1.22s cubic-bezier(0.2, 0.72, 0.2, 1) var(--coin-delay) forwards;
}

.reader-bonus-overlay {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
}

.reader-bonus-card {
  position: relative;
  width: min(92vw, 340px);
  padding: 28px 22px 24px;
  border-radius: 28px;
  text-align: center;
  color: #fff;
  background:
    radial-gradient(circle at 50% 20%, rgba(255, 234, 88, 0.32), transparent 30%),
    linear-gradient(180deg, rgba(28, 28, 30, 0.98), rgba(9, 9, 11, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.62);
  overflow: hidden;
}

.reader-bonus-card::before {
  content: '';
  position: absolute;
  inset: 42px 76px auto;
  height: 170px;
  background: conic-gradient(from 0deg, transparent, rgba(255, 230, 76, 0.34), transparent 22%);
  filter: blur(4px);
  animation: readerBonusGlow 5s linear infinite;
}

.reader-bonus-title {
  position: relative;
  margin: 0;
  color: #ffe600;
  font-size: 18px;
  font-weight: 1000;
  letter-spacing: 0.04em;
}

.reader-bonus-art {
  position: relative;
  display: grid;
  place-items: center;
  gap: 14px;
  margin: 22px auto 20px;
}

.reader-bonus-coin-stack {
  display: grid;
  place-items: center;
  width: 138px;
  height: 108px;
  border-radius: 28px;
  color: #fff3a5;
  font-size: 40px;
  letter-spacing: -10px;
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 246, 166, 0.92), transparent 22%),
    radial-gradient(circle at 42% 58%, #ffcf30 0 18%, transparent 19%),
    radial-gradient(circle at 56% 56%, #ffb116 0 20%, transparent 21%),
    radial-gradient(circle at 52% 38%, #ffe781 0 16%, transparent 17%),
    rgba(255, 255, 255, 0.05);
  filter: drop-shadow(0 16px 22px rgba(255, 174, 21, 0.24));
}

.reader-bonus-art strong {
  color: #ffe600;
  font-size: 30px;
  font-weight: 1000;
  text-shadow: 0 5px 20px rgba(255, 174, 0, 0.45);
}

.reader-bonus-double,
.reader-bonus-claim,
.reader-bonus-skip {
  position: relative;
  width: 100%;
  border: 0;
  font-weight: 1000;
  cursor: pointer;
}

.reader-bonus-double {
  min-height: 46px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #00d800, #04b900);
  box-shadow: 0 16px 28px rgba(0, 209, 35, 0.24);
}

.reader-bonus-double:disabled {
  opacity: 0.76;
}

.reader-bonus-claim {
  margin-top: 10px;
  min-height: 36px;
  border-radius: 999px;
  color: #ffe600;
  background: transparent;
}

.reader-bonus-skip {
  margin-top: 4px;
  min-height: 28px;
  color: rgba(255, 255, 255, 0.68);
  background: transparent;
  font-size: 12px;
}

.reader-bonus-enter-active,
.reader-bonus-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.reader-bonus-enter-from,
.reader-bonus-leave-to {
  opacity: 0;
}

.reader-bonus-enter-from .reader-bonus-card,
.reader-bonus-leave-to .reader-bonus-card {
  transform: scale(0.94) translateY(12px);
}

.reader-floating-header {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: min(calc(100% - 24px), 760px);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid;
  border-radius: 18px;
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 40px -32px rgba(15, 23, 42, 0.42);
}

.reader-page-native .reader-floating-header {
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  z-index: 90;
}

.toolbar-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.toolbar-meta {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.68;
}

.reader-shell {
  padding-bottom: 140px;
}

.reader-intro,
.reader-sheet,
.reader-end-card,
.reader-gate {
  border: 1px solid;
  border-radius: 28px;
  box-shadow: 0 28px 50px -40px rgba(15, 23, 42, 0.24);
}

.reader-intro {
  padding: 22px;
}

.reader-kicker {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: #ff2f83;
}

.reader-title,
.reader-end-title,
.reader-gate h2,
.next-chapter-card h3 {
  margin: 0;
  font-family: var(--font-reading);
  letter-spacing: -0.03em;
  color: inherit;
}

.reader-title {
  margin-top: 10px;
  font-size: clamp(1.9rem, 4vw, 3rem);
  line-height: 1.08;
}

.reader-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.reader-meta-row span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 240, 246, 0.9);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.reader-start-ad {
  margin: 14px 0 -2px;
  border-radius: 18px;
  overflow: hidden;
}

.reader-gate {
  margin-top: 18px;
  padding: 22px;
  text-align: center;
}

.gate-icon {
  margin: 0 0 10px;
  font-size: 40px;
}

.reader-gate h2 {
  font-size: 30px;
  line-height: 1.08;
}

.reader-gate p {
  margin: 12px auto 0;
  max-width: 44ch;
  line-height: 1.8;
  color: var(--text-secondary);
}

.gate-primary,
.next-primary,
.reader-app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #ff2f83, #ff6a5f);
  box-shadow: 0 24px 38px -26px rgba(255, 47, 131, 0.66);
}

.gate-primary {
  margin-top: 20px;
}

.locked-preview {
  position: relative;
  margin-bottom: 18px;
  padding: 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.42);
  overflow: hidden;
}

.locked-preview::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 60%;
  background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.88));
}

.locked-preview-text {
  white-space: pre-line;
  opacity: 0.42;
  filter: blur(1.8px);
}

.reader-gate-copy {
  margin-bottom: 18px;
}

.gate-kicker {
  color: #b45309;
}

.reader-unlock-hint {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.reader-unlock-link {
  color: #b45309;
  font-weight: 700;
}

.reader-sheet {
  margin-top: 18px;
  padding: clamp(20px, 5vw, 38px);
}

.reader-prose {
  color: inherit;
}

.reader-prose p,
.reader-prose :deep(p) {
  margin: 0 0 1.4em;
}

.reader-empty-copy {
  min-height: 36vh;
  display: grid;
  place-items: center;
  color: rgba(20, 34, 53, 0.62);
  text-align: center;
  line-height: 1.7;
}

.reader-inline-ad {
  margin: 24px 0;
}

.reader-loading {
  min-height: 44vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.reader-end-card {
  margin-top: 18px;
  padding: 22px;
}

.reader-feedback-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 18px;
  align-items: center;
}

.feedback-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: inherit;
}

.rating-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.rating-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

.rating-star {
  min-width: 42px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.next-chapter-card {
  margin-top: 22px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 240, 246, 0.72);
}

.next-chapter-card p {
  margin: 10px 0 0;
  line-height: 1.7;
  color: var(--text-secondary);
}

.next-primary {
  margin-top: 16px;
  width: 100%;
}

.reader-app-bar {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 39;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff2f83, #ff6a5f);
  box-shadow: 0 22px 42px -30px rgba(255, 47, 131, 0.66);
}

.reader-app-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.reader-app-icon {
  font-size: 18px;
}

.reader-bottom-toolbar {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 50;
  border: 1px solid;
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 24px 44px -34px rgba(15, 23, 42, 0.42);
}

.reader-page-native .reader-bottom-toolbar {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
  z-index: 92;
}

.toolbar-panel {
  border-bottom: 1px solid;
}

.toolbar-panel-inner {
  padding: 16px;
}

.toolbar-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
}

.toolbar-row + .toolbar-row {
  margin-top: 14px;
}

.toolbar-label {
  min-width: 58px;
  padding-top: 10px;
  font-size: 12px;
  font-weight: 700;
  opacity: 0.7;
}

.toolbar-button-row,
.toolbar-theme-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.toolbar-pill-button {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.toolbar-theme-button {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 2px solid;
}

.toolbar-theme-button-active {
  box-shadow: 0 0 0 2px rgba(255, 47, 131, 0.32);
}

.toolbar-panel-list {
  max-height: 50vh;
}

.chapter-list-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 14px;
  font-size: 14px;
  color: inherit;
}

.chapter-list-pill {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.chapter-list-pill-free {
  color: #166534;
  background: #dcfce7;
}

.chapter-list-pill-lock {
  color: #b45309;
  background: #fef3c7;
}

.toolbar-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.toolbar-progress-track {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 10px 12px;
}

.toolbar-icon {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: inherit;
}

.toolbar-icon-disabled {
  opacity: 0.3;
}

.slide-up-enter-active,
.slide-down-enter-active {
  transition: transform 0.28s ease-out, opacity 0.28s ease-out;
}

.slide-up-leave-active,
.slide-down-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s ease-in;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.chapter-loader {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-flip {
  position: relative;
  width: 40px;
  height: 50px;
  perspective: 200px;
}

.book-flip .page {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 0 4px 4px 0;
  transform-origin: left center;
  animation: flipPage 1.5s ease-in-out infinite;
}

.book-flip .page:nth-child(1) {
  background: linear-gradient(135deg, #ff2f83, #ff6a5f);
  animation-delay: 0s;
}

.book-flip .page:nth-child(2) {
  background: linear-gradient(135deg, #ff6a5f, #ffb000);
  animation-delay: 0.15s;
}

.book-flip .page:nth-child(3) {
  background: linear-gradient(135deg, #ffb000, #ffe26b);
  animation-delay: 0.3s;
}

@keyframes flipPage {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(-180deg); }
}

@keyframes readerCoinBurst {
  0% { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.8); }
  16% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(0, -28px, 0) scale(1.18); }
}

@keyframes readerCoinFly {
  0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.6) rotate(0deg); }
  12% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(calc(-100vw + 118px), calc(-45vh + 36px), 0) scale(0.62) rotate(720deg); }
}

@keyframes readerBonusGlow {
  to { transform: rotate(360deg); }
}

@keyframes redpacketPulse {
  0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
  50% { transform: translateY(-2px) scale(1.04); filter: brightness(1.1); }
}

@media (max-width: 768px) {
  .reader-intro,
  .reader-sheet,
  .reader-end-card,
  .reader-gate {
    padding: 18px;
    border-radius: 24px;
  }

  .reader-title,
  .reader-gate h2 {
    font-size: clamp(1.7rem, 7vw, 2.4rem);
  }

  .reader-floating-header,
  .reader-bottom-toolbar,
  .reader-app-bar {
    left: 12px;
    right: 12px;
  }

  .toolbar-row {
    flex-direction: column;
  }

  .toolbar-label {
    min-width: 0;
    padding-top: 0;
  }

  .toolbar-button-row,
  .toolbar-theme-row {
    justify-content: flex-start;
  }

  .reader-feedback-row {
    flex-direction: column;
    align-items: start;
  }
}
</style>
