<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginGate from '@/components/LoginGate.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import NativeRewardScreen from '@/components/app/NativeRewardScreen.vue'
import { useAds } from '@/composables/useAds'
import { coinApi } from '@/services/api'
import { Analytics } from '@/services/analytics'
import { isNativeApp } from '@/services/admob'
import { useToastStore } from '@/stores/toast'
import { useUserStore } from '@/stores/user'

interface CoinLog {
  id: number
  amount: number
  balance_after: number
  type: string
  description: string | null
  created_at: string
}

const DAILY_LIMIT = 5
const REWARD_PER_AD = 30

const router = useRouter()
const toastStore = useToastStore()
const userStore = useUserStore()
const { isRewardedReady, isLoading: adLoading, preloadRewarded, showRewarded } = useAds()
const nativeApp = isNativeApp()

const watchingAd = ref(false)
const loading = ref(true)
const adLogs = ref<CoinLog[]>([])

const isNative = computed(() => Capacitor.isNativePlatform())
const adsToday = computed(() => adLogs.value.filter(log => isSameDay(log.created_at, new Date())).length)
const adsTotal = computed(() => adLogs.value.length)
const earnedToday = computed(() =>
  adLogs.value
    .filter(log => isSameDay(log.created_at, new Date()))
    .reduce((sum, log) => sum + Math.max(log.amount, 0), 0),
)
const remainingAds = computed(() => Math.max(DAILY_LIMIT - adsToday.value, 0))
const dailyProgress = computed(() => Math.min((adsToday.value / DAILY_LIMIT) * 100, 100))
const recentLogs = computed(() => adLogs.value.slice(0, 6))
const actionLabel = computed(() => {
  if (!isNative.value) return 'Rewarded ads are available inside the Android app.'
  if (remainingAds.value <= 0) return 'Daily limit reached. Come back tomorrow.'
  if (watchingAd.value) return 'Opening ad...'
  if (adLoading.value && !isRewardedReady.value) return 'Loading rewarded inventory...'
  return `Watch one ad and earn ${REWARD_PER_AD} coins`
})

const realityCards = computed(() => [
  {
    title: 'Reward rule',
    value: `${REWARD_PER_AD} coins`,
    note: 'Each completed rewarded ad grants the same real backend reward.',
  },
  {
    title: 'Daily cap',
    value: `${DAILY_LIMIT} ads`,
    note: `${remainingAds.value} attempt${remainingAds.value === 1 ? '' : 's'} remaining today.`,
  },
  {
    title: 'Wallet balance',
    value: `${formatNumber(userStore.displayCoinBalance)} coins`,
    note: 'The reward lands directly in your real coin balance after the backend records it.',
  },
])

onMounted(async () => {
  if (isNative.value) {
    preloadRewarded()
  }
  await loadStats()
})

async function loadStats() {
  loading.value = true
  if (!userStore.isLoggedIn) {
    adLogs.value = []
    loading.value = false
    return
  }
  try {
    const data = await coinApi.logs(1, 100)
    adLogs.value = (data.items || []).filter((item: CoinLog) => item.type === 'ad_reward')
  } finally {
    loading.value = false
  }
}

async function handleWatchAd() {
  if (!isNative.value) {
    toastStore.show('Rewarded ads are only live in the Android app right now.', 'info')
    return
  }
  if (remainingAds.value <= 0) {
    toastStore.show('Daily ad limit reached. Come back tomorrow.', 'warning')
    return
  }

  watchingAd.value = true
  try {
    const shown = await showRewarded(
      async () => {
        try {
          const data = await coinApi.earn('ad_reward')
          userStore.updateCoinBalance(data.balance)
          toastStore.show(`+${data.reward_coins || REWARD_PER_AD} coins added to your wallet.`, 'success')
          Analytics.coinsEarned('ad_reward', data.reward_coins || REWARD_PER_AD)
          await loadStats()
        } catch (error: any) {
          toastStore.show(error.message || 'We could not record that reward.', 'error')
          await loadStats()
        }
      },
      {
        source: 'earn_page_watch_ad',
        rewardReason: 'daily_watch_ad_task',
        rewardAmount: REWARD_PER_AD,
        currencyType: 'coins',
        screenName: 'earn',
      },
    )

    if (!shown) {
      toastStore.show('No rewarded ad is available at the moment. Try again shortly.', 'info')
    }
  } catch {
    toastStore.show('Rewarded ad failed to open.', 'error')
  } finally {
    watchingAd.value = false
  }
}

function isSameDay(value: string, date: Date): boolean {
  const current = new Date(value)
  return current.getFullYear() === date.getFullYear()
    && current.getMonth() === date.getMonth()
    && current.getDate() === date.getDate()
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString()
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <NativeRewardScreen v-if="nativeApp" />
  <main v-else class="earn-page pb-24">
    <LoginGate message="Log in to watch rewarded ads and earn reader coins.">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="earn-hero">
          <div class="earn-hero-copy">
            <div class="hero-topline">
              <button class="hero-back" @click="router.back()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <p class="section-kicker">Watch and earn</p>
            </div>

            <h1 class="hero-title">A simple coin lane, now grounded in the real backend rules.</h1>
            <p class="hero-summary">
              This page no longer pretends there are fake tiers or diamond bonuses. The real rule is straightforward: one completed rewarded ad grants 30 coins, and the backend caps the flow at five successful ads per day.
            </p>

            <div class="hero-chip-row">
              <span class="hero-chip">30 coins per completed ad</span>
              <span class="hero-chip">5 rewarded ads per day</span>
              <span class="hero-chip">{{ isNative ? 'Android app supported' : 'Web preview only' }}</span>
            </div>
          </div>

          <div class="earn-hero-card">
            <p class="progress-label">Today</p>
            <p class="progress-value">{{ adsToday }} <span>/ {{ DAILY_LIMIT }}</span></p>

            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${dailyProgress}%` }"></div>
            </div>

            <div class="progress-grid">
              <div>
                <span>Earned today</span>
                <strong>{{ earnedToday }}</strong>
              </div>
              <div>
                <span>Lifetime ads</span>
                <strong>{{ adsTotal }}</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong>{{ remainingAds }}</strong>
              </div>
            </div>

            <button class="earn-primary" :disabled="watchingAd || remainingAds <= 0 || !isNative" @click="handleWatchAd">
              {{ actionLabel }}
            </button>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="reality-grid">
          <div v-for="card in realityCards" :key="card.title" class="reality-card">
            <p class="section-kicker">Reality check</p>
            <h2>{{ card.title }}</h2>
            <p class="reality-value">{{ card.value }}</p>
            <p class="reality-note">{{ card.note }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="earn-grid">
          <div class="panel-card">
            <div class="section-head">
              <div>
                <p class="section-kicker">How it works</p>
                <h2 class="section-title">Rewarded ads, without fake gamification</h2>
              </div>
            </div>

            <ul class="rule-list">
              <li>Watch the full rewarded video and let the reward callback fire.</li>
              <li>The backend records the reward and adds 30 coins to your real wallet balance.</li>
              <li>Once you reach 5 successful ads today, the flow pauses until tomorrow.</li>
            </ul>

            <div v-if="!isNative" class="native-callout">
              <strong>Web note</strong>
              <p>The page is visible on web, but actual rewarded ad inventory is currently available in the Android app only.</p>
            </div>

            <div class="cta-row">
              <button class="ghost-action" @click="router.push('/wallet')">Open wallet</button>
              <button class="ghost-action" @click="router.push('/reward')">Open rewards</button>
            </div>
          </div>

          <div class="panel-card panel-card-dark">
            <div class="section-head">
              <div>
                <p class="section-kicker">Reward state</p>
                <h2 class="section-title">Current ad availability</h2>
              </div>
            </div>

            <div class="status-stack">
              <div class="status-row">
                <span>Native app</span>
                <strong>{{ isNative ? 'Ready' : 'Not on this device' }}</strong>
              </div>
              <div class="status-row">
                <span>Reward inventory</span>
                <strong>{{ isRewardedReady ? 'Prepared' : adLoading ? 'Loading' : 'Idle' }}</strong>
              </div>
              <div class="status-row">
                <span>Wallet coins</span>
                <strong>{{ formatNumber(userStore.displayCoinBalance) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="activity-shell">
          <div class="section-head">
            <div>
              <p class="section-kicker">Recent reward events</p>
              <h2 class="section-title">Your latest successful ad rewards</h2>
            </div>
            <button class="ghost-action" @click="loadStats">Refresh</button>
          </div>

          <div v-if="loading" class="panel-loading">
            <span class="spinner"></span>
            <p>Loading reward history...</p>
          </div>

          <div v-else-if="!recentLogs.length" class="empty-shell">
            <span class="empty-icon">AD</span>
            <h3>No rewarded ads logged yet</h3>
            <p>Your completed ad rewards will appear here after the backend records them.</p>
          </div>

          <div v-else class="activity-list">
            <article v-for="item in recentLogs" :key="item.id" class="activity-card">
              <div class="activity-icon">
                <CoinIcon size="14px" />
              </div>

              <div class="activity-copy">
                <div class="activity-head">
                  <div>
                    <p class="activity-title">Rewarded ad completed</p>
                    <p class="activity-detail">{{ item.description || 'Backend reward captured successfully.' }}</p>
                  </div>
                  <span class="activity-amount">+{{ item.amount }}</span>
                </div>

                <div class="activity-meta">
                  <span>{{ formatDate(item.created_at) }}</span>
                  <span>Balance after {{ formatNumber(item.balance_after) }} coins</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </LoginGate>
  </main>
</template>

<style scoped>
.earn-page {
  background:
    radial-gradient(circle at top left, rgba(46, 123, 216, 0.14), transparent 22%),
    radial-gradient(circle at top right, rgba(212, 169, 45, 0.16), transparent 20%),
    linear-gradient(180deg, #f6f3ed 0%, #f4f8fe 34%, #fbfcff 100%);
}

.earn-hero,
.earn-hero-card,
.reality-card,
.panel-card,
.activity-shell,
.activity-card {
  border-radius: 1.7rem;
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.earn-hero,
.reality-grid,
.earn-grid {
  display: grid;
  gap: 1.5rem;
}

.earn-hero {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
}

.earn-hero-copy,
.earn-hero-card,
.reality-card,
.panel-card,
.activity-shell {
  padding: clamp(1.4rem, 2vw, 2rem);
}

.earn-hero-copy {
  border-radius: 1.9rem;
  background: linear-gradient(135deg, rgba(12, 44, 80, 0.97), rgba(43, 115, 201, 0.93));
  color: #fdfefe;
}

.hero-topline,
.progress-grid,
.section-head,
.cta-row,
.status-row,
.activity-head,
.activity-meta {
  display: flex;
  gap: 1rem;
}

.hero-topline,
.section-head,
.status-row,
.activity-head,
.activity-meta {
  align-items: center;
  justify-content: space-between;
}

.hero-back {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: #fdfefe;
}

.section-kicker {
  margin-bottom: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(31, 75, 126, 0.66);
}

.earn-hero-copy .section-kicker,
.panel-card-dark .section-kicker {
  color: rgba(219, 234, 255, 0.76);
}

.hero-title {
  margin: 0;
  font-size: clamp(2.3rem, 4.3vw, 3.9rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
  font-weight: 700;
  max-width: 11ch;
}

.hero-summary {
  margin-top: 1rem;
  max-width: 58ch;
  color: rgba(235, 244, 255, 0.86);
  line-height: 1.7;
}

.hero-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.hero-chip {
  padding: 0.7rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.92rem;
  color: rgba(248, 252, 255, 0.92);
}

.earn-hero-card,
.reality-card,
.panel-card,
.activity-shell {
  background: rgba(255, 255, 255, 0.88);
}

.progress-label,
.reality-note,
.rule-list,
.native-callout p,
.activity-detail,
.activity-meta,
.panel-loading p,
.empty-shell p {
  color: #5d6f85;
}

.progress-value {
  margin-top: 0.2rem;
  font-size: clamp(2.4rem, 5vw, 3.3rem);
  line-height: 1;
  font-weight: 700;
  color: #0f3f6d;
}

.progress-value span {
  font-size: 1.2rem;
  color: #74869b;
}

.progress-track {
  height: 0.8rem;
  margin-top: 1.3rem;
  border-radius: 999px;
  background: rgba(15, 63, 109, 0.1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #0f3f6d, #d4a92d);
}

.progress-grid {
  margin-top: 1.2rem;
  flex-wrap: wrap;
}

.progress-grid div {
  flex: 1 1 7rem;
  padding: 0.95rem;
  border-radius: 1rem;
  background: rgba(15, 63, 109, 0.06);
}

.progress-grid span,
.status-row span {
  color: #61768e;
  font-size: 0.85rem;
}

.progress-grid strong,
.status-row strong,
.reality-value {
  display: block;
  margin-top: 0.3rem;
  color: #12304f;
  font-size: 1.05rem;
}

.earn-primary,
.ghost-action {
  transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease, color 140ms ease, border-color 140ms ease;
}

.earn-primary {
  width: 100%;
  margin-top: 1.25rem;
  border: 0;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  color: #fefefe;
  font-weight: 700;
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  box-shadow: 0 16px 30px -24px rgba(15, 63, 109, 0.8);
}

.earn-primary:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  transform: none;
}

.reality-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.reality-card h2,
.section-title,
.activity-title {
  margin: 0;
  color: #12304f;
}

.reality-card h2 {
  font-size: 1.1rem;
}

.reality-value {
  margin-top: 0.85rem;
  font-size: 1.55rem;
}

.section-title {
  font-size: clamp(1.4rem, 2.2vw, 1.9rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.panel-card-dark {
  background: linear-gradient(150deg, rgba(16, 45, 84, 0.97), rgba(95, 71, 4, 0.94));
  color: rgba(245, 250, 255, 0.96);
}

.panel-card-dark .section-title,
.panel-card-dark .status-row strong,
.panel-card-dark .status-row span {
  color: inherit;
}

.rule-list {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.8rem;
  line-height: 1.75;
}

.native-callout {
  margin-top: 1.3rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(15, 63, 109, 0.06);
}

.native-callout strong {
  color: #12304f;
}

.cta-row {
  margin-top: 1.4rem;
  flex-wrap: wrap;
}

.ghost-action {
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(255, 255, 255, 0.78);
  color: #0f3f6d;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
}

.ghost-action:hover {
  transform: translateY(-1px);
}

.status-stack {
  display: grid;
  gap: 0.95rem;
}

.activity-list {
  display: grid;
  gap: 1rem;
  margin-top: 1.4rem;
}

.activity-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  padding: 1.1rem;
  background: rgba(247, 250, 254, 0.92);
}

.activity-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 169, 45, 0.15);
}

.activity-title {
  font-size: 1.02rem;
  font-weight: 700;
}

.activity-detail {
  margin-top: 0.35rem;
  line-height: 1.6;
}

.activity-amount {
  color: #0f766e;
  font-size: 1.04rem;
  font-weight: 700;
}

.activity-meta {
  margin-top: 0.85rem;
  flex-wrap: wrap;
  color: #70859b;
  font-size: 0.9rem;
}

.panel-loading,
.empty-shell {
  min-height: 16rem;
  display: grid;
  place-items: center;
  text-align: center;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 3px solid rgba(46, 123, 216, 0.2);
  border-top-color: #2e7bd8;
  animation: spin 0.9s linear infinite;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1.2rem;
  background: linear-gradient(135deg, #0f3f6d, #d4a92d);
  color: #fdfefe;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.empty-shell h3 {
  margin-top: 1rem;
  color: #143453;
  font-size: 1.2rem;
  font-weight: 700;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .earn-hero,
  .reality-grid,
  .earn-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .earn-hero-copy,
  .earn-hero-card,
  .reality-card,
  .panel-card,
  .activity-shell {
    padding: 1.2rem;
  }

  .hero-title {
    max-width: none;
  }

  .hero-topline,
  .section-head,
  .activity-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
