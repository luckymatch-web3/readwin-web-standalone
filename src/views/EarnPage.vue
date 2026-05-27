<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CoinIcon from '@/components/CoinIcon.vue'
import { APP_DOWNLOAD_URL } from '@/config'
import { Analytics } from '@/services/analytics'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useNovelStore } from '@/stores/novel'
import { useToastStore } from '@/stores/toast'
import { useUserStore } from '@/stores/user'
import { coverUrl } from '@/utils/cover'
import { capitalize } from '@/utils/text'
import type { Novel } from '@/types'

type RewardTaskKey = 'daily_checkin' | 'reading_sprint' | 'web_chest' | 'app_video' | 'app_wheel'

type RewardTask = {
  key: RewardTaskKey
  title: string
  amount: number
  cadence: string
  note: string
  appOnly?: boolean
  onceDaily?: boolean
}

type WebRewardLog = {
  id: number
  title: string
  amount: number
  balance_after: number
  source: RewardTaskKey
  created_at: string
  note: string
}

const WEB_REWARD_LOGS_KEY = 'readwin-web-reward-logs'
const WEB_DAILY_REWARD_PREFIX = 'readwin-web-daily-reward'

const router = useRouter()
const novelStore = useNovelStore()
const bookshelfStore = useBookshelfStore()
const toastStore = useToastStore()
const userStore = useUserStore()

const loading = ref(true)
const rewardLogs = ref<WebRewardLog[]>([])
const claimedToday = ref<Record<string, boolean>>({})

const rewardTasks = computed<RewardTask[]>(() => [
  {
    key: 'daily_checkin',
    title: 'Daily check-in',
    amount: 1000,
    cadence: 'Once today',
    note: 'Keep a web streak and add a meaningful coin boost before reading.',
    onceDaily: true,
  },
  {
    key: 'reading_sprint',
    title: 'Read a chapter sprint',
    amount: 300,
    cadence: 'Once today',
    note: 'Start a free chapter from the web shelf and collect a reader bonus.',
    onceDaily: true,
  },
  {
    key: 'web_chest',
    title: 'Open web chest',
    amount: 200,
    cadence: 'Once today',
    note: 'A light web-only reward so new readers can feel the wallet grow.',
    onceDaily: true,
  },
  {
    key: 'app_video',
    title: 'Rewarded video',
    amount: 30,
    cadence: 'Android app',
    note: 'Video inventory and ad callbacks stay in the app where the SDK runs.',
    appOnly: true,
  },
  {
    key: 'app_wheel',
    title: 'Lucky wheel',
    amount: 500,
    cadence: 'Android app',
    note: 'App-only events, payout review, and PayPal details continue there.',
    appOnly: true,
  },
])

const readingStory = computed(() =>
  novelStore.featuredNovels[0] || novelStore.hotNovels[0] || novelStore.novels[0] || null,
)
const suggestedStories = computed(() => {
  const seen = new Set<number>()
  return [...novelStore.hotNovels, ...novelStore.featuredNovels, ...novelStore.novels]
    .filter(story => {
      if (seen.has(story.id)) return false
      seen.add(story.id)
      return true
    })
    .slice(0, 6)
})
const webTasks = computed(() => rewardTasks.value.filter(task => !task.appOnly))
const appTasks = computed(() => rewardTasks.value.filter(task => task.appOnly))
const coinBalance = computed(() => Number(userStore.displayCoinBalance || 0))
const estimatedCash = computed(() => Math.max(0, coinBalance.value / 10000))
const earnedToday = computed(() =>
  rewardLogs.value
    .filter(log => isToday(log.created_at))
    .reduce((sum, log) => sum + Math.max(0, Number(log.amount || 0)), 0),
)
const completedToday = computed(() =>
  webTasks.value.filter(task => hasClaimedToday(task.key)).length,
)
const dailyProgress = computed(() =>
  webTasks.value.length ? Math.round((completedToday.value / webTasks.value.length) * 100) : 0,
)

onMounted(async () => {
  loading.value = true
  await novelStore.init()
  loadRewardLogs()
  refreshClaimedState()
  loading.value = false
})

function claimTask(task: RewardTask) {
  if (task.appOnly) {
    openAppDownload(task.key)
    return
  }
  if (task.onceDaily && hasClaimedToday(task.key)) {
    toastStore.show('This web reward is already claimed today.', 'info')
    return
  }

  userStore.addCoins(task.amount)
  const log: WebRewardLog = {
    id: Date.now(),
    title: task.title,
    amount: task.amount,
    balance_after: userStore.displayCoinBalance,
    source: task.key,
    created_at: new Date().toISOString(),
    note: task.note,
  }

  rewardLogs.value = [log, ...rewardLogs.value].slice(0, 30)
  saveRewardLogs()
  if (task.onceDaily) {
    localStorage.setItem(dailyKey(task.key), currentDayKey())
    refreshClaimedState()
  }

  Analytics.coinsEarned(task.key, task.amount)
  Analytics.rewardAction('web_reward_claimed', {
    reward_key: task.key,
    amount: task.amount,
    balance_after: userStore.displayCoinBalance,
  })
  toastStore.show(`+${task.amount.toLocaleString()} coins added.`, 'success')

  if (task.key === 'reading_sprint') {
    startReading()
  }
}

function claimDailyCheckin() {
  const task = webTasks.value.find(item => item.key === 'daily_checkin')
  if (task) claimTask(task)
}

function startReading(story?: Novel | null) {
  const target = story || readingStory.value || novelStore.novels[0]
  if (!target) {
    router.push('/explore')
    return
  }
  bookshelfStore.addToBookshelf(target)
  router.push(`/book/${target.id}/chapter/1`)
}

function openAppDownload(source: string) {
  Analytics.rewardAction('download_app_from_reward', {
    source,
    coin_balance: coinBalance.value,
  })
  window.open(APP_DOWNLOAD_URL, '_blank', 'noopener')
}

function loadRewardLogs() {
  try {
    const raw = localStorage.getItem(WEB_REWARD_LOGS_KEY)
    rewardLogs.value = raw ? JSON.parse(raw) : []
  } catch {
    rewardLogs.value = []
  }
}

function saveRewardLogs() {
  localStorage.setItem(WEB_REWARD_LOGS_KEY, JSON.stringify(rewardLogs.value))
}

function refreshClaimedState() {
  const state: Record<string, boolean> = {}
  rewardTasks.value.forEach(task => {
    if (task.onceDaily) {
      state[task.key] = localStorage.getItem(dailyKey(task.key)) === currentDayKey()
    }
  })
  claimedToday.value = state
}

function hasClaimedToday(key: RewardTaskKey) {
  return Boolean(claimedToday.value[key])
}

function taskActionLabel(task: RewardTask) {
  if (task.appOnly) return 'Open app'
  if (hasClaimedToday(task.key)) return 'Done today'
  if (task.key === 'reading_sprint') return 'Claim and read'
  return 'Claim coins'
}

function dailyKey(key: RewardTaskKey) {
  return `${WEB_DAILY_REWARD_PREFIX}-${key}`
}

function currentDayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function isToday(value: string) {
  if (!value) return false
  const date = new Date(value)
  return date.getFullYear() === new Date().getFullYear()
    && date.getMonth() === new Date().getMonth()
    && date.getDate() === new Date().getDate()
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <main class="earn-page">
    <section class="earn-hero">
      <div class="earn-hero-copy">
        <p class="section-kicker">Reward center</p>
        <h1>Earn coins on web. Cash out in the app.</h1>
        <p>
          Readers can now collect daily web rewards, read free chapters, and watch their balance grow before moving to the Android app for ad videos, PayPal details, and payout review.
        </p>

        <div class="earn-actions">
          <button type="button" class="earn-primary" @click="claimDailyCheckin">
            Daily check-in
          </button>
          <button type="button" class="earn-secondary" @click="startReading()">
            Start reading
          </button>
          <a class="earn-secondary" :href="APP_DOWNLOAD_URL" target="_blank" rel="noopener">
            Download app
          </a>
        </div>
      </div>

      <aside class="earn-wallet-card">
        <div class="wallet-card-head">
          <span class="coin-badge"><CoinIcon size="20px" /> Coins</span>
          <span>{{ completedToday }}/{{ webTasks.length }} web tasks</span>
        </div>
        <strong>{{ formatNumber(coinBalance) }}</strong>
        <p>Estimated cash value: ${{ estimatedCash.toFixed(2) }}</p>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${dailyProgress}%` }"></div>
        </div>
        <button type="button" @click="router.push('/withdraw')">Cashout opens in app</button>
      </aside>
    </section>

    <section class="earn-snapshot">
      <div>
        <span>Earned today</span>
        <strong>+{{ formatNumber(earnedToday) }}</strong>
      </div>
      <div>
        <span>Web balance</span>
        <strong>{{ formatNumber(coinBalance) }}</strong>
      </div>
      <div>
        <span>Payout lane</span>
        <strong>Android app</strong>
      </div>
    </section>

    <section class="earn-section">
      <div class="section-head">
        <div>
          <p class="section-kicker">Web tasks</p>
          <h2>Claim rewards here</h2>
        </div>
      </div>

      <div class="task-grid">
        <article v-for="task in webTasks" :key="task.key" class="task-card">
          <div class="task-topline">
            <span>{{ task.cadence }}</span>
            <strong>+{{ formatNumber(task.amount) }}</strong>
          </div>
          <h3>{{ task.title }}</h3>
          <p>{{ task.note }}</p>
          <button
            type="button"
            :disabled="hasClaimedToday(task.key)"
            @click="claimTask(task)"
          >
            {{ taskActionLabel(task) }}
          </button>
        </article>
      </div>
    </section>

    <section class="earn-section app-lane">
      <div>
        <p class="section-kicker">App-only rewards</p>
        <h2>Keep high-value actions inside the Android app</h2>
        <p>
          Rewarded video SDK callbacks, lucky wheel events, PayPal account binding, and withdrawal review should stay in the app. The web page hands users there at the right moment.
        </p>
      </div>
      <div class="app-task-list">
        <button v-for="task in appTasks" :key="task.key" type="button" @click="claimTask(task)">
          <span>{{ task.title }}</span>
          <strong>{{ task.cadence }}</strong>
          <small>{{ task.note }}</small>
        </button>
      </div>
    </section>

    <section v-if="suggestedStories.length" class="earn-section story-lane">
      <div class="section-head">
        <div>
          <p class="section-kicker">Read and grow</p>
          <h2>Pick a free chapter</h2>
        </div>
        <button type="button" class="section-action" @click="router.push('/explore')">Explore all</button>
      </div>

      <div class="story-grid">
        <button v-for="story in suggestedStories" :key="story.id" type="button" @click="startReading(story)">
          <img :src="coverUrl(story.cover_url)" :alt="story.title">
          <span>{{ capitalize(story.title) }}</span>
          <small>{{ story.total_chapters }} chapters</small>
        </button>
      </div>
    </section>

    <section class="earn-section history-section">
      <div class="section-head">
        <div>
          <p class="section-kicker">Recent rewards</p>
          <h2>Web coin log</h2>
        </div>
      </div>

      <div v-if="loading" class="empty-state">Loading rewards...</div>
      <div v-else-if="!rewardLogs.length" class="empty-state">
        Claim your first web task and it will appear here.
      </div>
      <div v-else class="reward-log-list">
        <article v-for="log in rewardLogs.slice(0, 8)" :key="log.id" class="reward-log">
          <div>
            <strong>{{ log.title }}</strong>
            <span>{{ formatDate(log.created_at) }}</span>
          </div>
          <p>+{{ formatNumber(log.amount) }} coins</p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.earn-page {
  min-height: 100vh;
  padding: 20px 16px 92px;
  background:
    linear-gradient(180deg, #fff7ed 0, #f8fafc 260px, #fff 100%);
  color: #111827;
}

.earn-hero,
.earn-snapshot,
.earn-section {
  max-width: 1180px;
  margin: 0 auto;
}

.earn-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
  gap: 16px;
}

.earn-hero-copy,
.earn-wallet-card,
.earn-snapshot,
.earn-section {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  box-shadow: 0 22px 46px -38px rgba(15, 23, 42, 0.44);
}

.earn-hero-copy {
  padding: clamp(24px, 4vw, 52px);
  color: #fff;
  background:
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(112, 26, 117, 0.88)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent);
}

.section-kicker {
  margin: 0 0 10px;
  color: #db2777;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.earn-hero-copy .section-kicker {
  color: #fbbf24;
}

.earn-hero h1 {
  max-width: 700px;
  margin: 0;
  font-size: clamp(40px, 7vw, 76px);
  line-height: 0.94;
  font-weight: 950;
}

.earn-hero p {
  max-width: 650px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 17px;
  line-height: 1.7;
}

.earn-actions,
.section-head,
.task-topline,
.wallet-card-head,
.earn-snapshot,
.reward-log,
.story-grid {
  display: flex;
  align-items: center;
}

.earn-actions {
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.earn-primary,
.earn-secondary,
.earn-wallet-card button,
.task-card button,
.section-action {
  min-height: 44px;
  border-radius: 8px;
  padding: 0 18px;
  font-weight: 850;
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.earn-primary {
  border: 0;
  color: #111827;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
}

.earn-secondary {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.08);
}

.earn-primary:hover,
.earn-secondary:hover,
.earn-wallet-card button:hover,
.task-card button:hover,
.section-action:hover {
  transform: translateY(-1px);
}

.earn-wallet-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
  background: #fff;
}

.wallet-card-head {
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.coin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #111827;
}

.earn-wallet-card strong {
  font-size: clamp(44px, 8vw, 72px);
  line-height: 1;
  font-weight: 950;
}

.earn-wallet-card p {
  margin: 0;
  color: #64748b;
}

.progress-track {
  width: 100%;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #fbbf24, #db2777);
}

.earn-wallet-card button,
.task-card button,
.section-action {
  border: 0;
  color: #fff;
  background: #111827;
}

.earn-wallet-card button:disabled,
.task-card button:disabled {
  color: #94a3b8;
  background: #e5e7eb;
  cursor: not-allowed;
}

.earn-snapshot {
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  background: #fff;
}

.earn-snapshot div {
  flex: 1;
  min-width: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.earn-snapshot span,
.reward-log span,
.story-grid small,
.task-card p,
.app-lane p,
.app-task-list small {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.earn-snapshot strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 900;
}

.earn-section {
  margin-top: 16px;
  padding: 20px;
  background: #fff;
}

.section-head {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-head h2,
.app-lane h2 {
  margin: 0;
  font-size: clamp(24px, 4vw, 38px);
  font-weight: 950;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.task-card {
  min-height: 260px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: #f8fafc;
}

.task-topline {
  justify-content: space-between;
  gap: 12px;
}

.task-topline span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.task-topline strong {
  color: #db2777;
}

.task-card h3 {
  min-height: 58px;
  margin: 24px 0 8px;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 950;
}

.task-card p {
  min-height: 62px;
  line-height: 1.55;
}

.task-card button {
  width: 100%;
  margin-top: 18px;
}

.app-lane {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
  gap: 16px;
  color: #fff;
  background: #111827;
}

.app-lane .section-kicker,
.app-lane p,
.app-task-list small {
  color: rgba(255, 255, 255, 0.68);
}

.app-task-list {
  display: grid;
  gap: 10px;
}

.app-task-list button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 14px;
  text-align: left;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.app-task-list small {
  grid-column: 1 / -1;
}

.story-grid {
  align-items: stretch;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.story-grid button {
  flex: 0 0 150px;
  border: 0;
  border-radius: 8px;
  padding: 0;
  text-align: left;
  background: transparent;
}

.story-grid img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  object-fit: cover;
  background: #e5e7eb;
}

.story-grid span {
  display: block;
  min-height: 38px;
  margin-top: 8px;
  font-weight: 850;
  line-height: 1.2;
}

.empty-state {
  min-height: 120px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
  text-align: center;
}

.reward-log-list {
  display: grid;
  gap: 10px;
}

.reward-log {
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: #fff;
}

.reward-log p {
  margin: 0;
  color: #16a34a;
  font-weight: 900;
}

@media (max-width: 860px) {
  .earn-page {
    padding: 12px 12px 96px;
  }

  .earn-hero,
  .app-lane {
    grid-template-columns: 1fr;
  }

  .task-grid {
    grid-template-columns: 1fr;
  }

  .earn-snapshot {
    align-items: stretch;
    flex-direction: column;
  }

  .earn-hero h1 {
    font-size: clamp(38px, 14vw, 58px);
  }
}
</style>
