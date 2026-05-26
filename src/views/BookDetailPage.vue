<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { coverUrl } from '@/utils/cover'
import { capitalize } from '@/utils/text'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useNovelStore } from '@/stores/novel'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useUserStore } from '@/stores/user'
import { novelApi, chapterApi, interactionApi, tipRankApi } from '@/services/api'
import type { Chapter, TipGift } from '@/types'
import StarRating from '@/components/StarRating.vue'
import Modal from '@/components/Modal.vue'
import AdDisplay from '@/components/AdDisplay.vue'
import TipGiftSelector from '@/components/TipGiftSelector.vue'
import NativeBookDetailScreen from '@/components/app/NativeBookDetailScreen.vue'
import { useToastStore } from '@/stores/toast'
import CoinIcon from '@/components/CoinIcon.vue'
import { Analytics } from '@/services/analytics'

const route = useRoute()
const router = useRouter()
const isNative = Capacitor.isNativePlatform()

const store = useNovelStore()
const bookshelfStore = useBookshelfStore()
const userStore = useUserStore()
const toastStore = useToastStore()

const novelId = computed(() => Number(route.params.id))
const novel = ref<any>(null)
const chapters = ref<Chapter[]>([])

const urgeCount = ref(0)
const urgedToday = ref(false)
const urgingLoading = ref(false)

const showTipModal = ref(false)
const tipAmount = ref(100)
const selectedGiftType = ref('coffee')
const tipMessage = ref('')
const tipLoading = ref(false)
const tipTotal = ref(0)
const tipList = ref<any[]>([])
const tipRankList = ref<any[]>([])

const liked = ref(false)
const likeCount = ref(0)
const likeLoading = ref(false)

const userRating = ref(0)
const ratingAvg = ref(0)
const ratingCount = ref(0)
const hasRated = ref(false)

const expanded = ref(false)
const sortAsc = ref(true)

const isBookmarked = computed(() => bookshelfStore.isInBookshelf(novelId.value))
const progressChapter = computed(() => bookshelfStore.getProgress(novelId.value) || 0)
const readingProgress = computed(() => {
  if (!novel.value?.total_chapters || !progressChapter.value) return 0
  return Math.min(100, Math.round((progressChapter.value / novel.value.total_chapters) * 100))
})
const statusLabel = computed(() => (novel.value?.status === 2 ? 'Completed' : 'Ongoing'))
const ratingDisplay = computed(() => Number(ratingAvg.value || novel.value?.rating_avg || 0).toFixed(1))
const ratingVotes = computed(() => ratingCount.value || novel.value?.rating_count || 0)
const likeDisplay = computed(() => likeCount.value || novel.value?.like_count || 0)
const primaryCtaLabel = computed(() => progressChapter.value ? `Continue from Ch. ${progressChapter.value}` : 'Start Reading')
const primaryCtaLink = computed(() => novel.value ? `/book/${novel.value.id}/chapter/${safeChapter(progressChapter.value || 1, novel.value.total_chapters)}` : '/explore')

const sortedChapters = computed(() => {
  const list = [...chapters.value]
  return sortAsc.value ? list : list.reverse()
})

const chapterRows = computed(() => sortedChapters.value.slice(0, 50))
const openedNovelIds = new Set<number>()

const detailStats = computed(() => {
  if (!novel.value) return []
  return [
    { label: 'Readers', value: formatCount(novel.value.view_count) },
    { label: 'Chapters', value: String(novel.value.total_chapters) },
    { label: 'Words', value: formatWords(novel.value.word_count) },
    { label: 'Support', value: `${formatCount(tipTotal.value || 0)} coins` },
  ]
})

const similarStories = computed(() => {
  if (!novel.value) return []
  return store.novels
    .filter(n => n.id !== novel.value.id && n.category?.id === novel.value.category?.id)
    .slice(0, 8)
})

function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  toastStore.show(message, type)
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function formatWords(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

function isFreeChapter(_chapter: Chapter): boolean {
  return true
}

function safeChapter(chapterNo: number, total = 0) {
  const fallbackTotal = Math.max(1, Number(total || 1))
  const next = Number.isFinite(chapterNo) ? Math.floor(chapterNo) : 1
  return Math.min(Math.max(next, 1), fallbackTotal)
}

async function loadNovel() {
  const id = novelId.value
  if (!id) return

  await store.init().catch(() => {})
  novel.value = store.getNovelById(id)

  if (!novel.value) {
    try {
      novel.value = await novelApi.getById(id)
    } catch {
      toastStore.show('Failed to load novel', 'error')
    }
  }
  trackBookOpen()
}

async function loadInteractionData() {
  try {
    const data = await interactionApi.urgeCount(novelId.value)
    urgeCount.value = data.urge_count
  } catch {}

  if (userStore.isLoggedIn) {
    try {
      const data = await interactionApi.likeStatus(novelId.value)
      liked.value = data.liked
      likeCount.value = data.like_count
    } catch {}
    try {
      const data = await interactionApi.rateStatus(novelId.value)
      hasRated.value = data.rated
      userRating.value = data.rating || 0
      ratingAvg.value = Number(data.rating_avg) || 0
      ratingCount.value = data.rating_count
    } catch {}
  }

  try {
    const data = await interactionApi.tipTotal(novelId.value)
    tipTotal.value = data.total
  } catch {}
  try {
    const data = await interactionApi.tipList(novelId.value)
    tipList.value = data.items
  } catch {}
  try {
    const data = await tipRankApi.getRank(novelId.value)
    tipRankList.value = data.items
  } catch {}
}

function onGiftSelect(gift: TipGift) {
  tipAmount.value = gift.amount
  selectedGiftType.value = gift.type
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
  } catch (e: any) {
    showToast(e.message || 'Failed', 'error')
  } finally {
    likeLoading.value = false
  }
}

async function doRate(rating: number) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const data = await interactionApi.rate(novelId.value, rating)
    userRating.value = rating
    hasRated.value = true
    ratingAvg.value = Number(data.rating_avg) || 0
    ratingCount.value = data.rating_count
    showToast('Rated!', 'success')
  } catch (e: any) {
    showToast(e.message || 'Failed to rate', 'error')
  }
}

async function doUrge() {
  if (!userStore.isLoggedIn) return showToast('Please sign in first', 'warning')
  if (urgedToday.value) return
  urgingLoading.value = true
  try {
    const data = await interactionApi.urge(novelId.value)
    urgeCount.value = data.urge_count
    urgedToday.value = true
    showToast('Update requested!', 'success')
  } catch (e: any) {
    if (e.message?.includes('Already urged')) {
      urgedToday.value = true
      showToast('Already urged today', 'warning')
    } else {
      showToast(e.message || 'Failed to request update', 'error')
    }
  } finally {
    urgingLoading.value = false
  }
}

async function doTip() {
  if (!userStore.isLoggedIn) return showToast('Please sign in first', 'warning')
  tipLoading.value = true
  try {
    const data = await interactionApi.tip(
      novelId.value,
      tipAmount.value,
      tipMessage.value || undefined,
      selectedGiftType.value,
    )
    if (userStore.user) userStore.user.coin_balance = data.balance
    showToast(`Tipped ${tipAmount.value} coins!`, 'success')
    showTipModal.value = false
    tipMessage.value = ''
    await loadInteractionData()
  } catch (e: any) {
    showToast(e.message || 'Failed to tip', 'error')
  } finally {
    tipLoading.value = false
  }
}

function toggleBookmark() {
  if (!novel.value) return
  if (isBookmarked.value) bookshelfStore.removeFromBookshelf(novelId.value)
  else bookshelfStore.addToBookshelf(novel.value)
}

function trackBookOpen() {
  if (!novel.value?.id || openedNovelIds.has(novel.value.id)) return
  openedNovelIds.add(novel.value.id)
  Analytics.bookOpened(novel.value.id, novel.value.title || '')
}

function trackReadingStart(source: string, chapterNo = progressChapter.value || 1) {
  if (!novel.value?.id) return
  const safeChapterNo = safeChapter(chapterNo, novel.value.total_chapters)
  Analytics.novelReadStarted(novel.value.id, {
    source,
    chapter_no: safeChapterNo,
    total_chapters: novel.value.total_chapters || chapters.value.length || 0,
    category: novel.value.category?.name || novel.value.category?.display_name || '',
    is_resume: safeChapterNo > 1,
    progress_chapter: progressChapter.value || 0,
  })
  Analytics.chapterUnlocked('free', novel.value.id, safeChapterNo)
}

watch(novelId, () => {
  novel.value = null
  chapters.value = []
  loadNovel()
  chapterApi.list(novelId.value).then(data => { chapters.value = data }).catch(() => {})
  loadInteractionData().catch(() => {})
})

onMounted(async () => {
  await loadNovel()
  try {
    chapters.value = await chapterApi.list(novelId.value)
  } catch {
    toastStore.show('Failed to load chapters', 'error')
    chapters.value = store.getChapters(novelId.value)
  }
  loadInteractionData().catch(() => {})
})
</script>

<template>
  <NativeBookDetailScreen v-if="isNative" />

  <div v-else-if="!novel" class="flex items-center justify-center min-h-[60vh]">
    <div class="animate-pulse text-center">
      <div class="w-36 h-52 bg-[var(--bg-hover)] rounded-[28px] mx-auto mb-5"></div>
      <div class="h-5 w-56 bg-[var(--bg-hover)] rounded-full mx-auto mb-3"></div>
      <div class="h-4 w-40 bg-[var(--bg-hover)] rounded-full mx-auto"></div>
    </div>
  </div>

  <div v-else class="detail-page pb-28">
    <section class="detail-hero">
      <div
        class="detail-hero-blur"
        :style="{ backgroundImage: `url(${coverUrl(novel.cover_url)})` }"
      ></div>
      <div class="detail-hero-gradient"></div>

      <div class="detail-hero-inner max-w-6xl mx-auto px-4 lg:px-6 py-8 lg:py-14">
        <div class="detail-hero-grid">
          <div class="detail-cover-wrap">
            <img :src="coverUrl(novel.cover_url)" :alt="novel.title" class="detail-cover" />
            <div class="detail-cover-card">
              <p class="detail-cover-label">Featured story</p>
              <p class="detail-cover-copy">Readers are sticking for the world-building, pacing, and chapter momentum.</p>
            </div>
          </div>

          <div class="detail-copy">
            <p class="detail-kicker">{{ capitalize(novel.category?.display_name || novel.category?.name || 'Story') }}</p>
            <h1 class="detail-title">{{ capitalize(novel.title) }}</h1>
            <p class="detail-author">by {{ capitalize(novel.author_name) }}</p>

            <div class="detail-chip-row">
              <span class="detail-chip">{{ statusLabel }}</span>
              <span class="detail-chip">{{ novel.total_chapters }} chapters</span>
              <span class="detail-chip">All chapters free</span>
              <span v-for="tag in novel.tags.slice(0, 3)" :key="tag" class="detail-chip">
                {{ capitalize(tag) }}
              </span>
            </div>

            <div class="detail-proof-grid">
              <div class="detail-proof-card">
                <span class="detail-proof-label">Rating</span>
                <strong>{{ ratingDisplay }}</strong>
                <span>{{ ratingVotes }} votes</span>
              </div>
              <div class="detail-proof-card">
                <span class="detail-proof-label">Readers</span>
                <strong>{{ formatCount(novel.view_count) }}</strong>
                <span>actively following</span>
              </div>
              <div class="detail-proof-card">
                <span class="detail-proof-label">Support</span>
                <strong>{{ formatCount(tipTotal || 0) }}</strong>
                <span>coins sent</span>
              </div>
            </div>

            <div class="detail-rating-row">
              <StarRating :rating="Number(ratingAvg || novel.rating_avg || 0)" size="md" />
              <span>{{ ratingDisplay }} average</span>
              <span v-if="hasRated">Your score: {{ userRating }}/5</span>
            </div>

            <div class="detail-rate-actions">
              <button
                v-for="i in 5"
                :key="i"
                @click.stop="doRate(i)"
                class="detail-rate-chip"
                :class="i <= (userRating || Math.round(Number(ratingAvg || novel.rating_avg || 0))) ? 'detail-rate-chip-active' : ''"
              >
                {{ i }}★
              </button>
            </div>

            <p class="detail-summary line-clamp-4">{{ novel.synopsis }}</p>

            <div class="detail-cta-row">
              <router-link :to="primaryCtaLink" class="detail-primary-cta" @click="trackReadingStart('detail_primary_cta')">
                {{ primaryCtaLabel }}
              </router-link>
              <button @click="toggleBookmark" class="detail-secondary-cta">
                {{ isBookmarked ? 'Saved to Library' : 'Add to Library' }}
              </button>
              <button @click="showTipModal = true" class="detail-ghost-cta">
                Support Author
              </button>
            </div>

            <div v-if="progressChapter" class="detail-progress-row">
              <div class="detail-progress-track">
                <div class="detail-progress-fill" :style="{ width: `${readingProgress}%` }"></div>
              </div>
              <span>Reading progress: {{ readingProgress }}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 lg:px-6 mt-8">
      <div class="detail-layout">
        <div class="space-y-6">
          <div class="detail-panel">
            <div class="detail-panel-head">
              <div>
                <p class="panel-kicker">Synopsis</p>
                <h2 class="panel-title">What makes this story hard to leave</h2>
              </div>
              <button @click="expanded = !expanded" class="panel-link">
                {{ expanded ? 'Show less' : 'Read more' }}
              </button>
            </div>

            <p
              class="detail-body"
              :class="{ 'line-clamp-4': !expanded }"
            >
              {{ novel.synopsis }}
            </p>
          </div>

          <div class="reward-panel">
            <div>
              <p class="panel-kicker reward-kicker">Reader rewards</p>
              <h2 class="panel-title reward-title">Stay in the story and keep earning while you read.</h2>
              <p class="reward-copy">
                Every chapter is free now. Keep reading to earn coins, then use the reward center for daily boosts and cashout progress.
              </p>
            </div>

            <div class="reward-grid">
              <div class="reward-stat">
                <span>Read 30 mins</span>
                <strong>+50 coins</strong>
              </div>
              <div class="reward-stat">
                <span>Daily check-in</span>
                <strong>7-day streak</strong>
              </div>
              <div class="reward-stat">
                <span>Watch ads</span>
                <strong>Double rewards</strong>
              </div>
            </div>

            <div class="detail-cta-row">
              <router-link to="/earn" class="reward-primary">Earn Coins</router-link>
              <router-link to="/reward" class="reward-secondary">Open Rewards</router-link>
            </div>
          </div>

          <div class="detail-panel">
            <div class="detail-panel-head">
              <div>
                <p class="panel-kicker">Engagement</p>
                <h2 class="panel-title">Keep the story moving</h2>
              </div>
            </div>

            <div class="engagement-actions">
              <button
                @click="doUrge"
                :disabled="urgedToday || urgingLoading"
                class="engagement-button"
                :class="{ 'engagement-button-muted': urgedToday }"
              >
                {{ urgedToday ? 'Update requested' : `Request update (${urgeCount})` }}
              </button>
              <button
                @click.stop="doLike"
                :disabled="likeLoading"
                class="engagement-button engagement-button-soft"
              >
                {{ liked ? 'Liked' : 'Like story' }} · {{ formatCount(likeDisplay) }}
              </button>
              <button @click="showTipModal = true" class="engagement-button engagement-button-gold">
                Support with {{ tipAmount }} coins
              </button>
            </div>

            <div v-if="tipList.length" class="recent-support">
              <p class="support-headline">Recent support</p>
              <div class="space-y-3">
                <div
                  v-for="tip in tipList.slice(0, 4)"
                  :key="tip.id"
                  class="support-row"
                >
                  <div class="support-avatar">{{ tip.nickname?.[0]?.toUpperCase() || '?' }}</div>
                  <div class="min-w-0 flex-1">
                    <p class="support-name">{{ tip.nickname }}</p>
                    <p class="support-copy">
                      Sent {{ tip.amount }} coins
                      <span v-if="tip.message">· "{{ tip.message }}"</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-panel">
            <div class="detail-panel-head">
              <div>
                <p class="panel-kicker">Chapters</p>
                <h2 class="panel-title">Jump in at the right pace</h2>
              </div>
              <button @click="sortAsc = !sortAsc" class="panel-link">
                {{ sortAsc ? 'Ascending' : 'Descending' }}
              </button>
            </div>

            <div class="chapter-list">
              <router-link
                v-for="chapter in chapterRows"
                :key="chapter.id"
                :to="`/book/${novel.id}/chapter/${chapter.chapter_no}`"
                class="chapter-row"
                @click="trackReadingStart('chapter_list', chapter.chapter_no)"
              >
                <div class="chapter-copy">
                  <span class="chapter-number">Ch. {{ chapter.chapter_no }}</span>
                  <div>
                    <p class="chapter-title">{{ capitalize(chapter.title) }}</p>
                    <p class="chapter-meta">{{ chapter.word_count }} words</p>
                  </div>
                </div>
                <span
                  class="chapter-pill"
                  :class="isFreeChapter(chapter) ? 'chapter-pill-free' : 'chapter-pill-locked'"
                >
                  Free
                </span>
              </router-link>
            </div>
          </div>
        </div>

        <aside class="detail-sidebar">
          <div class="detail-panel detail-sidebar-card">
            <p class="panel-kicker">Story snapshot</p>
            <h2 class="panel-title">At a glance</h2>

            <div class="snapshot-grid">
              <div v-for="item in detailStats" :key="item.label" class="snapshot-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>

          <div v-if="tipRankList.length" class="detail-panel detail-sidebar-card">
            <p class="panel-kicker">Top supporters</p>
            <h2 class="panel-title">Who is backing this story</h2>

            <div class="space-y-3">
              <div
                v-for="(supporter, index) in tipRankList.slice(0, 5)"
                :key="index"
                class="support-rank-row"
              >
                <span class="support-rank-index">{{ index + 1 }}</span>
                <div class="support-avatar">{{ supporter.nickname?.[0]?.toUpperCase() || '?' }}</div>
                <div class="min-w-0 flex-1">
                  <p class="support-name">{{ supporter.nickname }}</p>
                </div>
                <span class="support-amount">{{ supporter.total_amount ?? supporter.amount }} <CoinIcon size="1em" /></span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section v-if="similarStories.length" class="max-w-6xl mx-auto px-4 lg:px-6 mt-8">
      <div class="detail-panel">
        <div class="detail-panel-head">
          <div>
            <p class="panel-kicker">More to explore</p>
            <h2 class="panel-title">Similar Stories</h2>
          </div>
        </div>

        <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-fade-right">
          <router-link
            v-for="story in similarStories"
            :key="story.id"
            :to="`/book/${story.id}`"
            class="similar-card"
          >
            <img :src="coverUrl(story.cover_url)" :alt="story.title" class="similar-cover" />
            <p class="similar-title">{{ capitalize(story.title) }}</p>
            <p class="similar-meta">{{ Number(story.rating_avg || 0).toFixed(1) }} stars · {{ story.total_chapters }} ch</p>
          </router-link>
        </div>
      </div>
    </section>

    <div class="mobile-cta-shell md:hidden">
      <div class="mobile-cta-inner">
        <button @click="toggleBookmark" class="mobile-secondary">
          {{ isBookmarked ? 'Saved' : 'Library' }}
        </button>
        <router-link :to="primaryCtaLink" class="mobile-primary" @click="trackReadingStart('detail_mobile_cta')">
          {{ primaryCtaLabel }}
        </router-link>
      </div>
      <a
        v-if="!isNative"
        href="https://play.google.com/store/apps/details?id=me.readwin.app"
        target="_blank"
        rel="noopener"
        class="mobile-app-link"
      >
        Read in App for the smoother chapter experience
      </a>
    </div>

    <Modal :show="showTipModal" title="Support the Author" @close="showTipModal = false">
      <div class="space-y-4">
        <p class="text-sm" style="color: var(--text-secondary)">
          Your balance:
          <span class="font-bold" style="color: var(--text-primary)">
            {{ userStore.user?.coin_balance ?? 0 }} coins
          </span>
        </p>
        <TipGiftSelector @select="onGiftSelect" />
        <input
          v-model="tipMessage"
          placeholder="Leave a message (optional)"
          maxlength="200"
          class="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
          style="border-color: var(--border-default); background: var(--bg-card); color: var(--text-primary)"
        />
        <button
          @click="doTip"
          :disabled="tipLoading"
          class="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
          :class="tipLoading ? 'opacity-60' : 'hover:opacity-90'"
          style="background: linear-gradient(135deg, #d97706, #f59e0b)"
        >
          {{ tipLoading ? 'Sending...' : `Tip ${tipAmount} Coins` }}
        </button>
      </div>
    </Modal>

    <div class="max-w-6xl mx-auto px-4 lg:px-6 mt-8">
      <AdDisplay />
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 30%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.9));
}

.detail-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #eff6ff, #dbeafe 46%, #f8fafc);
}

.detail-hero-blur,
.detail-hero-gradient {
  position: absolute;
  inset: 0;
}

.detail-hero-blur {
  background-size: cover;
  background-position: center;
  opacity: 0.16;
  filter: blur(44px);
  transform: scale(1.08);
}

.detail-hero-gradient {
  background:
    linear-gradient(135deg, rgba(30, 64, 175, 0.16), transparent 44%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(248, 250, 252, 0.92));
}

.detail-hero-inner,
.detail-layout,
.detail-panel,
.reward-panel,
.mobile-cta-shell {
  position: relative;
  z-index: 1;
}

.detail-hero-grid {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  gap: 32px;
  align-items: center;
}

.detail-cover-wrap {
  position: relative;
}

.detail-cover {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 30px;
  box-shadow: 0 36px 48px -28px rgba(15, 23, 42, 0.42);
}

.detail-cover-card {
  width: calc(100% - 28px);
  margin: -34px auto 0;
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: 0 22px 34px -28px rgba(15, 23, 42, 0.38);
}

.detail-cover-label,
.panel-kicker,
.detail-kicker {
  margin: 0;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 700;
}

.detail-cover-label,
.panel-kicker,
.detail-kicker {
  color: #2563eb;
}

.detail-cover-copy,
.detail-body,
.reward-copy {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}

.detail-title,
.panel-title {
  margin: 0;
  font-family: var(--font-reading);
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.detail-title {
  margin-top: 8px;
  font-size: clamp(2rem, 5vw, 3.9rem);
  line-height: 1.02;
}

.detail-author {
  margin: 12px 0 0;
  font-size: 16px;
  color: var(--text-secondary);
}

.detail-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.detail-chip {
  padding: 9px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 16px 28px -28px rgba(15, 23, 42, 0.34);
}

.detail-proof-grid,
.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}

.detail-proof-card,
.snapshot-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 30px -30px rgba(15, 23, 42, 0.34);
}

.detail-proof-card strong,
.snapshot-card strong {
  display: block;
  margin-top: 6px;
  font-size: 22px;
  line-height: 1.1;
  color: var(--text-primary);
}

.detail-proof-card span:last-child,
.snapshot-card span {
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-proof-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2563eb;
}

.detail-rating-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 18px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.detail-rate-actions,
.detail-cta-row,
.engagement-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.detail-rate-chip {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.detail-rate-chip-active {
  color: white;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
}

.detail-summary {
  margin-top: 18px;
  max-width: 62ch;
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-secondary);
}

.detail-primary-cta,
.reward-primary,
.mobile-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  box-shadow: 0 24px 38px -26px rgba(37, 99, 235, 0.7);
}

.detail-secondary-cta,
.reward-secondary,
.mobile-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  color: #1d4ed8;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.55);
}

.detail-ghost-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  color: #b45309;
  background: rgba(255, 251, 235, 0.82);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.35);
}

.detail-progress-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 18px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.detail-progress-track {
  width: min(260px, 100%);
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(191, 219, 254, 0.55);
}

.detail-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #1d4ed8, #60a5fa);
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
}

.detail-panel,
.reward-panel {
  padding: 22px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 40px -34px rgba(15, 23, 42, 0.3);
}

.reward-panel {
  background: linear-gradient(135deg, #fff7dd, #ffe8a3 56%, #ffd677);
}

.detail-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.panel-title {
  margin-top: 8px;
  font-size: clamp(1.5rem, 3vw, 2.3rem);
  line-height: 1.08;
}

.panel-link {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: #2563eb;
}

.reward-kicker {
  color: #92400e;
}

.reward-title {
  color: #5b3302;
}

.reward-copy {
  color: rgba(91, 51, 2, 0.82);
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.reward-stat {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.58);
  color: #5b3302;
}

.reward-stat span {
  display: block;
  font-size: 12px;
  line-height: 1.5;
}

.reward-stat strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
}

.engagement-button {
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #ef4444, #fb7185);
}

.engagement-button-muted {
  opacity: 0.6;
}

.engagement-button-soft {
  color: #1d4ed8;
  background: rgba(239, 246, 255, 1);
}

.engagement-button-gold {
  color: white;
  background: linear-gradient(135deg, #b45309, #f59e0b);
}

.recent-support {
  margin-top: 18px;
}

.support-headline,
.support-name {
  color: var(--text-primary);
  font-weight: 700;
}

.support-headline {
  margin: 0 0 14px;
  font-size: 14px;
}

.support-row,
.support-rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.support-avatar,
.support-rank-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.support-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1d4ed8, #60a5fa);
  color: white;
  font-size: 13px;
  font-weight: 800;
}

.support-copy,
.support-amount,
.chapter-meta,
.similar-meta {
  color: var(--text-secondary);
  font-size: 13px;
}

.chapter-list {
  margin-top: 18px;
}

.chapter-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
}

.chapter-row + .chapter-row {
  border-top: 1px solid rgba(226, 232, 240, 0.7);
}

.chapter-copy {
  display: flex;
  align-items: start;
  gap: 14px;
  min-width: 0;
}

.chapter-number {
  min-width: 58px;
  padding-top: 4px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.chapter-title,
.similar-title {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
}

.chapter-pill {
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.chapter-pill-free {
  color: #166534;
  background: #dcfce7;
}

.chapter-pill-locked {
  color: #b45309;
  background: #fef3c7;
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-sidebar-card {
  position: sticky;
  top: 80px;
}

.support-rank-index {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.08);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
}

.similar-card {
  width: 148px;
  flex-shrink: 0;
}

.similar-cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 18px;
  object-fit: cover;
}

.similar-title {
  margin-top: 12px;
  font-size: 14px;
}

.mobile-cta-shell {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 56px;
  z-index: 40;
  padding: 12px 16px 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.1), rgba(248, 250, 252, 0.92) 24%, rgba(248, 250, 252, 0.98));
  backdrop-filter: blur(16px);
}

.mobile-cta-inner {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;
}

.mobile-app-link {
  display: block;
  margin-top: 10px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@media (max-width: 1024px) {
  .detail-hero-grid,
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-sidebar-card {
    position: static;
  }

  .reward-grid,
  .detail-proof-grid,
  .snapshot-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .detail-panel,
  .reward-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .detail-cover {
    max-width: 280px;
    margin: 0 auto;
  }

  .detail-cover-card {
    width: min(280px, calc(100% - 20px));
  }

  .detail-proof-grid,
  .reward-grid,
  .snapshot-grid {
    grid-template-columns: 1fr;
  }

  .chapter-row {
    align-items: start;
    flex-direction: column;
  }

  .chapter-pill {
    margin-left: 72px;
  }
}
</style>
