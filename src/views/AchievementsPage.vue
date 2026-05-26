<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginGate from '@/components/LoginGate.vue'
import EmptyState from '@/components/EmptyState.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import NativeRewardScreen from '@/components/app/NativeRewardScreen.vue'
import { achievementApi, checkinApi, userProgressApi } from '@/services/api'
import { isNativeApp } from '@/services/admob'
import { useToastStore } from '@/stores/toast'

interface AchievementItem {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
  category: string
  reward_exp: number
  reward_coins: number
  condition_type: string | null
  condition_value: number | null
}

interface UserAchievementItem {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
  category: string
  reward_exp: number
  reward_coins: number
  unlocked_at: string | null
}

const router = useRouter()
const toastStore = useToastStore()
const nativeApp = isNativeApp()

const loading = ref(true)
const selectedCategory = ref('All')
const allAchievements = ref<AchievementItem[]>([])
const unlockedAchievements = ref<UserAchievementItem[]>([])
const userLevel = ref({
  level: 1,
  total_exp: 0,
  current_level_exp: 0,
  next_level_exp: 100,
  title: 'New Reader',
  custom_title: null as string | null,
})
const checkinStatus = ref({
  checked_today: false,
  streak: 0,
  day_in_cycle: 1,
  next_coins: 10,
  today_coins: 0,
  week_rewards: [10, 15, 20, 25, 30, 40, 80] as number[],
})

const unlockedIdSet = computed(() => new Set(unlockedAchievements.value.map(item => item.id)))
const categories = computed(() => ['All', ...Array.from(new Set(allAchievements.value.map(item => humanizeCategory(item.category))))])
const filteredUnlocked = computed(() => unlockedAchievements.value.filter(item => matchesCategory(item.category)))
const filteredLocked = computed(() =>
  allAchievements.value.filter(item => !unlockedIdSet.value.has(item.id) && matchesCategory(item.category)),
)
const unlockedCount = computed(() => unlockedAchievements.value.length)
const completionRate = computed(() => {
  if (!allAchievements.value.length) return 0
  return Math.round((unlockedAchievements.value.length / allAchievements.value.length) * 100)
})
const levelProgress = computed(() => {
  const floor = userLevel.value.current_level_exp || 0
  const ceiling = userLevel.value.next_level_exp || floor + 1
  const delta = Math.max(ceiling - floor, 1)
  return Math.min(100, ((userLevel.value.total_exp - floor) / delta) * 100)
})
const spotlightCards = computed(() => [
  {
    label: 'Reader level',
    value: `Lv.${userLevel.value.level}`,
    note: userLevel.value.custom_title || userLevel.value.title || 'Growth keeps stacking as you read.',
  },
  {
    label: 'Unlocked',
    value: String(unlockedCount.value),
    note: `${completionRate.value}% of the visible achievement catalog unlocked.`,
  },
  {
    label: 'Check-in streak',
    value: `${checkinStatus.value.streak} days`,
    note: checkinStatus.value.checked_today
      ? `Checked in today and earned ${checkinStatus.value.today_coins || checkinStatus.value.next_coins} coins.`
      : `Next daily check-in is worth ${checkinStatus.value.next_coins} coins.`,
  },
])
const nextMilestone = computed(() => filteredLocked.value[0] || null)

onMounted(async () => {
  await loadPage()
})

async function loadPage() {
  loading.value = true
  try {
    const [catalog, unlocked, level, checkin] = await Promise.all([
      achievementApi.list(),
      achievementApi.userList(),
      userProgressApi.level(),
      checkinApi.status(),
    ])
    allAchievements.value = catalog.items || []
    unlockedAchievements.value = unlocked.items || []
    userLevel.value = {
      ...userLevel.value,
      ...level,
    }
    checkinStatus.value = {
      ...checkinStatus.value,
      ...checkin,
    }
  } catch {
    toastStore.show('Failed to load achievements.', 'error')
  } finally {
    loading.value = false
  }
}

function matchesCategory(category: string) {
  return selectedCategory.value === 'All' || humanizeCategory(category) === selectedCategory.value
}

function humanizeCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function requirementLabel(item: AchievementItem): string {
  if (!item.condition_type || !item.condition_value) return 'Progress tracked automatically by the backend.'

  if (item.condition_type === 'chapters_read') return `Read ${item.condition_value} chapters`
  if (item.condition_type === 'ads_watched') return `Watch ${item.condition_value} rewarded ads`
  if (item.condition_type === 'checkin_count') return `Check in ${item.condition_value} times`
  if (item.condition_type === 'checkin_streak') return `Maintain a ${item.condition_value}-day streak`
  if (item.condition_type === 'invites_count') return `Invite ${item.condition_value} readers`
  if (item.condition_type === 'tips_count') return `Send ${item.condition_value} tips`
  if (item.condition_type === 'tips_total') return `Send ${item.condition_value} total tip value`
  if (item.condition_type === 'single_tip') return `Send a single tip worth ${item.condition_value}`
  return `${humanizeCategory(item.condition_type)}: ${item.condition_value}`
}

function formatDate(value?: string | null): string {
  if (!value) return 'Tracked automatically'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
</script>

<template>
  <NativeRewardScreen v-if="nativeApp" />

  <main v-else class="achievements-page pb-24">
    <LoginGate message="Log in to review your achievements, level progress, and reading milestones.">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="achievement-hero">
          <div class="achievement-hero-copy">
            <div class="hero-topline">
              <button class="hero-back" @click="router.back()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <p class="section-kicker">Reader growth dashboard</p>
            </div>

            <h1 class="hero-title">Achievements are now framed as milestones, because that is what the backend actually supports.</h1>
            <p class="hero-summary">
              Stitch pushed this page toward a calmer editorial dashboard, so I removed the fake claim buttons and ad-based unlock calls. What remains is the real data: the catalog, your unlocked milestones, your level, and your check-in rhythm.
            </p>

            <div class="hero-chip-row">
              <span class="hero-chip">{{ unlockedCount }} unlocked</span>
              <span class="hero-chip">{{ completionRate }}% completion</span>
              <span class="hero-chip">EXP tracked automatically</span>
            </div>
          </div>

          <div class="achievement-hero-card">
            <p class="hero-card-label">Level {{ userLevel.level }}</p>
            <p class="hero-card-value">{{ userLevel.total_exp.toLocaleString() }} EXP</p>
            <p class="hero-card-copy">{{ userLevel.custom_title || userLevel.title }}</p>

            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${levelProgress}%` }"></div>
            </div>

            <div class="progress-meta">
              <span>{{ userLevel.current_level_exp.toLocaleString() }}</span>
              <span>{{ userLevel.next_level_exp.toLocaleString() }}</span>
            </div>

            <div class="checkin-card">
              <span>Check-in streak</span>
              <strong>{{ checkinStatus.streak }} days</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="spotlight-grid">
          <div v-for="card in spotlightCards" :key="card.label" class="spotlight-card">
            <p class="section-kicker">Growth snapshot</p>
            <h2>{{ card.label }}</h2>
            <p class="spotlight-value">{{ card.value }}</p>
            <p class="spotlight-note">{{ card.note }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="catalog-shell">
          <div class="section-head">
            <div>
              <p class="section-kicker">Achievement catalog</p>
              <h2 class="section-title">Browse the milestones your profile can grow into</h2>
            </div>
            <button class="ghost-action" @click="loadPage">Refresh</button>
          </div>

          <div class="chip-row">
            <button
              v-for="category in categories"
              :key="category"
              class="filter-chip"
              :class="{ 'filter-chip-active': selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>

          <div v-if="loading" class="panel-loading">
            <span class="spinner"></span>
            <p>Loading achievement catalog...</p>
          </div>

          <template v-else>
            <div class="section-split">
              <div class="section-column">
                <div class="column-head">
                  <div>
                    <p class="section-kicker">Unlocked</p>
                    <h3>Your live milestones</h3>
                  </div>
                </div>

                <EmptyState
                  v-if="filteredUnlocked.length === 0"
                  icon="🏅"
                  title="No unlocked milestones in this category"
                  description="Your unlocked achievements will appear here as soon as the backend records them."
                />

                <div v-else class="achievement-list">
                  <article v-for="item in filteredUnlocked" :key="item.id" class="achievement-card achievement-card-unlocked">
                    <div class="achievement-icon">{{ item.icon || '🏅' }}</div>
                    <div class="achievement-copy">
                      <div class="achievement-head">
                        <div>
                          <p class="achievement-title">{{ item.name }}</p>
                          <p class="achievement-description">{{ item.description || 'Unlocked milestone recorded on your profile.' }}</p>
                        </div>
                        <span class="status-chip status-chip-success">Unlocked</span>
                      </div>

                      <div class="reward-row">
                        <span v-if="item.reward_coins" class="reward-chip reward-chip-gold">+{{ item.reward_coins }} <CoinIcon size="12px" /></span>
                        <span v-if="item.reward_exp" class="reward-chip reward-chip-blue">+{{ item.reward_exp }} EXP</span>
                        <span class="reward-chip reward-chip-soft">{{ humanizeCategory(item.category) }}</span>
                      </div>

                      <p class="unlock-date">Recorded {{ formatDate(item.unlocked_at) }}</p>
                    </div>
                  </article>
                </div>
              </div>

              <div class="section-column">
                <div class="column-head">
                  <div>
                    <p class="section-kicker">Milestones ahead</p>
                    <h3>Locked catalog items</h3>
                  </div>
                </div>

                <div v-if="nextMilestone" class="next-milestone-card">
                  <p class="section-kicker">Next visible milestone</p>
                  <h3>{{ nextMilestone.name }}</h3>
                  <p>{{ requirementLabel(nextMilestone) }}</p>
                </div>

                <EmptyState
                  v-if="filteredLocked.length === 0"
                  icon="✨"
                  title="Everything in this category is unlocked"
                  description="You have already completed the visible milestones for this category."
                />

                <div v-else class="achievement-list">
                  <article v-for="item in filteredLocked" :key="item.id" class="achievement-card">
                    <div class="achievement-icon achievement-icon-muted">{{ item.icon || '🔒' }}</div>
                    <div class="achievement-copy">
                      <div class="achievement-head">
                        <div>
                          <p class="achievement-title">{{ item.name }}</p>
                          <p class="achievement-description">{{ item.description || 'Milestone still in progress.' }}</p>
                        </div>
                        <span class="status-chip status-chip-muted">Milestone</span>
                      </div>

                      <div class="reward-row">
                        <span v-if="item.reward_coins" class="reward-chip reward-chip-gold">+{{ item.reward_coins }} <CoinIcon size="12px" /></span>
                        <span v-if="item.reward_exp" class="reward-chip reward-chip-blue">+{{ item.reward_exp }} EXP</span>
                        <span class="reward-chip reward-chip-soft">{{ humanizeCategory(item.category) }}</span>
                      </div>

                      <p class="unlock-date">{{ requirementLabel(item) }}</p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>
    </LoginGate>
  </main>
</template>

<style scoped>
.achievements-page {
  background:
    radial-gradient(circle at top left, rgba(46, 123, 216, 0.14), transparent 22%),
    radial-gradient(circle at top right, rgba(212, 169, 45, 0.15), transparent 20%),
    linear-gradient(180deg, #f6f3ed 0%, #f4f8fe 34%, #fbfcff 100%);
}

.achievement-hero,
.achievement-hero-card,
.spotlight-card,
.catalog-shell,
.achievement-card,
.next-milestone-card {
  border-radius: 1.7rem;
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.achievement-hero,
.spotlight-grid,
.section-split {
  display: grid;
  gap: 1.5rem;
}

.achievement-hero {
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
}

.achievement-hero-copy,
.achievement-hero-card,
.spotlight-card,
.catalog-shell {
  padding: clamp(1.4rem, 2vw, 2rem);
}

.achievement-hero-copy {
  border-radius: 1.9rem;
  background: linear-gradient(135deg, rgba(12, 44, 80, 0.97), rgba(43, 115, 201, 0.93));
  color: #fdfefe;
}

.hero-topline,
.section-head,
.column-head,
.achievement-head,
.reward-row,
.chip-row,
.progress-meta {
  display: flex;
  gap: 1rem;
}

.hero-topline,
.section-head,
.achievement-head,
.progress-meta {
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

.achievement-hero-copy .section-kicker {
  color: rgba(219, 234, 255, 0.76);
}

.hero-title {
  margin: 0;
  font-size: clamp(2.3rem, 4.4vw, 3.9rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
  font-weight: 700;
  max-width: 12ch;
}

.hero-summary {
  margin-top: 1rem;
  max-width: 58ch;
  color: rgba(235, 244, 255, 0.86);
  line-height: 1.7;
}

.hero-chip-row,
.chip-row,
.reward-row {
  flex-wrap: wrap;
}

.hero-chip,
.filter-chip,
.ghost-action {
  transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease, color 140ms ease, border-color 140ms ease;
}

.hero-chip {
  padding: 0.7rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.92rem;
  color: rgba(248, 252, 255, 0.92);
}

.achievement-hero-card,
.spotlight-card,
.catalog-shell,
.achievement-card,
.next-milestone-card {
  background: rgba(255, 255, 255, 0.88);
}

.hero-card-label,
.hero-card-copy,
.spotlight-note,
.achievement-description,
.unlock-date,
.panel-loading p,
.next-milestone-card p {
  color: #5d6f85;
}

.hero-card-value {
  margin-top: 0.3rem;
  font-size: clamp(2.1rem, 5vw, 3rem);
  line-height: 1;
  font-weight: 700;
  color: #0f3f6d;
}

.progress-track {
  height: 0.8rem;
  margin-top: 1rem;
  border-radius: 999px;
  background: rgba(15, 63, 109, 0.1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #0f3f6d, #d4a92d);
}

.progress-meta {
  margin-top: 0.5rem;
  color: #61768e;
  font-size: 0.85rem;
}

.checkin-card {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(15, 63, 109, 0.06);
}

.checkin-card span {
  color: #61768e;
  font-size: 0.85rem;
}

.checkin-card strong {
  display: block;
  margin-top: 0.25rem;
  color: #12304f;
  font-size: 1.05rem;
}

.spotlight-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.spotlight-card h2,
.section-title,
.column-head h3,
.achievement-title,
.next-milestone-card h3 {
  margin: 0;
  color: #12304f;
}

.spotlight-card h2 {
  font-size: 1.1rem;
}

.spotlight-value {
  margin-top: 0.85rem;
  font-size: 1.55rem;
  font-weight: 700;
  color: #0f3f6d;
}

.section-title {
  font-size: clamp(1.4rem, 2.2vw, 1.9rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.ghost-action {
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(255, 255, 255, 0.78);
  color: #0f3f6d;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
}

.ghost-action:hover,
.filter-chip:hover {
  transform: translateY(-1px);
}

.chip-row {
  margin-top: 1rem;
}

.filter-chip {
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(15, 63, 109, 0.04);
  border-radius: 999px;
  padding: 0.72rem 1rem;
  color: #19456b;
  font-weight: 600;
}

.filter-chip-active {
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  border-color: transparent;
  color: #fefefe;
}

.section-split {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1.6rem;
}

.section-column {
  min-width: 0;
}

.next-milestone-card {
  margin: 1rem 0 1.2rem;
  padding: 1rem;
}

.achievement-list {
  display: grid;
  gap: 1rem;
}

.achievement-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  padding: 1.1rem;
  background: rgba(247, 250, 254, 0.92);
}

.achievement-card-unlocked {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(252, 247, 232, 0.94));
}

.achievement-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 169, 45, 0.15);
  font-size: 1.4rem;
}

.achievement-icon-muted {
  background: rgba(15, 63, 109, 0.08);
}

.achievement-copy {
  min-width: 0;
}

.achievement-title {
  font-size: 1.02rem;
  font-weight: 700;
}

.achievement-description {
  margin-top: 0.35rem;
  line-height: 1.6;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 6.5rem;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font-size: 0.84rem;
  font-weight: 700;
}

.status-chip-success {
  background: rgba(212, 169, 45, 0.16);
  color: #735c00;
}

.status-chip-muted {
  background: rgba(15, 63, 109, 0.08);
  color: #496078;
}

.reward-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.45rem 0.72rem;
  font-size: 0.82rem;
  font-weight: 700;
}

.reward-chip-gold {
  background: rgba(212, 169, 45, 0.16);
  color: #735c00;
}

.reward-chip-blue {
  background: rgba(15, 63, 109, 0.1);
  color: #0f3f6d;
}

.reward-chip-soft {
  background: rgba(73, 96, 120, 0.08);
  color: #496078;
}

.unlock-date {
  margin-top: 0.9rem;
  line-height: 1.6;
}

.panel-loading {
  min-height: 14rem;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .achievement-hero,
  .spotlight-grid,
  .section-split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .achievement-hero-copy,
  .achievement-hero-card,
  .spotlight-card,
  .catalog-shell {
    padding: 1.2rem;
  }

  .hero-title {
    max-width: none;
  }

  .hero-topline,
  .section-head,
  .achievement-head {
    flex-direction: column;
    align-items: stretch;
  }

  .status-chip {
    min-width: 0;
    width: fit-content;
  }
}
</style>
