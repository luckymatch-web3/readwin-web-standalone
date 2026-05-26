<script setup lang="ts">
import { showIAP } from '@/composables/useIAP'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useEngagementStore } from '@/stores/engagement'
import CoinIcon from '@/components/CoinIcon.vue'
import DiamondIcon from '@/components/DiamondIcon.vue'
import LoginGate from '@/components/LoginGate.vue'
import LevelBadge from '@/components/LevelBadge.vue'
import ExpBar from '@/components/ExpBar.vue'
import CheckInModal from '@/components/CheckInModal.vue'
import NativeProfileScreen from '@/components/app/NativeProfileScreen.vue'
import { isNativeApp } from '@/services/admob'

const router = useRouter()
const userStore = useUserStore()
const engagementStore = useEngagementStore()
const nativeApp = isNativeApp()

if (!nativeApp && !userStore.isLoggedIn) router.replace('/login')

const showCheckin = ref(false)
const isEditingNickname = ref(false)
const editNickname = ref(userStore.user?.nickname || '')

onMounted(() => {
  if (userStore.isLoggedIn) engagementStore.init()
})

const displayName = computed(() => userStore.user?.nickname || 'Guest Reader')
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase() || 'R')
const vipSummary = computed(() =>
  userStore.isVip
    ? `Active until ${formatDate(userStore.user?.vip_expire_at)}`
    : 'All stories are free now. Keep reading, complete tasks, and grow your reward balance.',
)

const heroHighlights = computed(() => [
  {
    label: 'Reading streak',
    value: `${engagementStore.checkinStatus?.streak || 0} days`,
    note: engagementStore.checkinStatus?.checked_today ? 'Checked in today' : 'Keep the flame alive with a quick check-in',
  },
  {
    label: 'Reader level',
    value: `Lv.${engagementStore.userLevel?.level || 1}`,
    note: engagementStore.userLevel?.custom_title || engagementStore.userLevel?.title || 'Progress stacks with every chapter you finish',
  },
  {
    label: 'Badges earned',
    value: String(engagementStore.userAchievements.length || 0),
    note: 'Achievements celebrate streaks, milestones, and reader rewards',
  },
])

const walletPanels = computed(() =>
  showIAP
    ? [
        {
          label: 'Diamonds',
          value: formatNum(userStore.totalDiamond),
          note: `Reward ${formatNum(userStore.user?.reward_diamond || 0)} · Paid ${formatNum(userStore.user?.paid_diamond || 0)}`,
          route: '/wallet',
          tone: 'diamond',
        },
        {
          label: 'Gold coins',
          value: formatNum(userStore.user?.coin_balance || 0),
          note: 'Coins grow while you read free chapters and complete tasks',
          route: '/wallet',
          tone: 'coin',
        },
      ]
    : [],
)

const primaryActions = computed(() =>
  showIAP
    ? [
        {
          icon: 'RW',
          label: 'Rewards',
          desc: 'Open check-ins, tasks, and rewarded videos',
          route: '/reward',
          accent: 'linear-gradient(135deg, #0f3f6d, #2e7bd8)',
        },
        {
          icon: 'WE',
          label: 'Watch & Earn',
          desc: 'Turn rewarded videos into reader coins',
          route: '/earn',
          accent: 'linear-gradient(135deg, #5f4704, #d4a92d)',
        },
        {
          icon: 'IN',
          label: 'Invite & Earn',
          desc: 'Grow your team and collect commission diamonds',
          route: '/invite',
          accent: 'linear-gradient(135deg, #5d2347, #d35a91)',
        },
        {
          icon: 'WD',
          label: 'Withdraw',
          desc: 'Cash out earned value when you hit the threshold',
          route: '/withdraw',
          accent: 'linear-gradient(135deg, #21424a, #38a6a5)',
        },
      ]
    : [],
)

const achievementPreview = computed(() => {
  const tones = [
    'linear-gradient(135deg, rgba(15,63,109,0.96), rgba(46,123,216,0.92))',
    'linear-gradient(135deg, rgba(95,71,4,0.96), rgba(212,169,45,0.92))',
    'linear-gradient(135deg, rgba(93,35,71,0.96), rgba(211,90,145,0.92))',
    'linear-gradient(135deg, rgba(33,66,74,0.96), rgba(56,166,165,0.92))',
  ]

  const live = engagementStore.userAchievements.slice(0, 4).map((achievement: any, index) => ({
    title: achievement.title || achievement.name || `Milestone ${index + 1}`,
    description: achievement.description || achievement.desc || 'Your reading momentum is compounding.',
    badge: achievement.badge || `0${index + 1}`,
    accent: tones[index % tones.length],
  }))

  if (live.length) return live

  return [
    {
      title: '7-Day Flame',
      description: 'Return every day and your reader profile starts to feel alive.',
      badge: '07',
      accent: tones[0],
    },
    {
      title: 'Night Owl',
      description: 'Late-night reading marathons deserve a badge of their own.',
      badge: 'NO',
      accent: tones[1],
    },
    {
      title: 'Reward Aura',
      description: 'Reward streaks show up everywhere once your reading engine warms up.',
      badge: 'RW',
      accent: tones[2],
    },
    {
      title: 'Scout',
      description: 'Inviting one more reader keeps your rewards engine moving.',
      badge: 'SC',
      accent: tones[3],
    },
  ]
})

const menuSections = computed(() => {
  const sections: Array<{
    title: string
    items: Array<{ icon: string; label: string; desc: string; route: string; accent: string }>
  }> = []

  if (showIAP) {
    sections.push({
      title: 'Wallet & rewards',
      items: [
        {
          icon: 'WL',
          label: 'My Wallet',
          desc: 'Track diamonds, coins, and reward balances',
          route: '/wallet',
          accent: 'linear-gradient(135deg, #0f3f6d, #2e7bd8)',
        },
        {
          icon: 'TH',
          label: 'Transaction History',
          desc: 'Review every coin and diamond movement',
          route: '/coin-details',
          accent: 'linear-gradient(135deg, #244f4e, #45a9a4)',
        },
      ],
    })
  }

  sections.push({
    title: 'Preferences',
    items: [
      {
        icon: 'RD',
        label: 'Reading Settings',
        desc: 'Control theme, pacing, and reading comfort',
        route: '/reading-settings',
        accent: 'linear-gradient(135deg, #0d3d78, #6e98ff)',
      },
      {
        icon: 'LG',
        label: 'Language',
        desc: 'Manage language and localization preferences',
        route: '/language',
        accent: 'linear-gradient(135deg, #5c2a5c, #b36fd1)',
      },
      {
        icon: 'NT',
        label: 'Notifications',
        desc: 'Stay on top of updates, drops, and rewards',
        route: '/notifications',
        accent: 'linear-gradient(135deg, #274456, #40a3d2)',
      },
    ],
  })

  sections.push({
    title: 'Support & account',
    items: [
      {
        icon: 'AC',
        label: 'Achievements',
        desc: 'Review milestones and see what unlocks next',
        route: '/achievements',
        accent: 'linear-gradient(135deg, #5f4704, #d4a92d)',
      },
      {
        icon: 'ST',
        label: 'Settings',
        desc: 'Open account, privacy, and support controls',
        route: '/reading-settings',
        accent: 'linear-gradient(135deg, #21424a, #38a6a5)',
      },
    ],
  })

  return sections
})

function saveNickname() {
  if (editNickname.value.trim() && userStore.user) {
    userStore.user.nickname = editNickname.value.trim()
  }
  isEditingNickname.value = false
}

function handleLogout() {
  userStore.logout()
  router.push('/')
}

function formatNum(n: number): string {
  return n.toLocaleString()
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not active'
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}
</script>

<template>
  <NativeProfileScreen v-if="nativeApp" />
  <main v-else class="profile-page pb-24">
    <LoginGate message="Log in to view your wallet, level progress, and personalized rewards.">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="profile-hero">
          <div class="profile-hero-main">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar">
                <img
                  v-if="userStore.user?.avatar_url"
                  :src="userStore.user.avatar_url"
                  :alt="displayName"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ userInitial }}</span>
              </div>
              <button class="profile-avatar-edit" aria-label="Edit profile" @click="isEditingNickname = true; editNickname = userStore.user?.nickname || ''">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            <div class="profile-identity">
              <div class="profile-chip-row">
                <span class="profile-chip">Lv.{{ engagementStore.userLevel?.level || 1 }}</span>
                <span class="profile-chip">🔥 {{ engagementStore.checkinStatus?.streak || 0 }} day streak</span>
              </div>

              <div class="profile-name-row">
                <template v-if="isEditingNickname">
                  <input
                    v-model="editNickname"
                    class="profile-name-input"
                    autofocus
                    @keyup.enter="saveNickname"
                    @blur="saveNickname"
                  />
                </template>
                <template v-else>
                  <h1 class="profile-name">{{ displayName }}</h1>
                  <button
                    class="profile-name-edit"
                    @click="isEditingNickname = true; editNickname = userStore.user?.nickname || ''"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </template>
              </div>

              <p class="profile-email">{{ userStore.user?.email }}</p>

              <div class="profile-meta-row">
                <span>Invite code {{ userStore.user?.invite_code || 'N/A' }}</span>
                <span>Free reading account</span>
              </div>
            </div>
          </div>

          <div class="profile-highlight-grid">
            <div
              v-for="item in heroHighlights"
              :key="item.label"
              class="highlight-card"
            >
              <p class="highlight-label">{{ item.label }}</p>
              <p class="highlight-value">{{ item.value }}</p>
              <p class="highlight-note">{{ item.note }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="profile-layout">
          <div class="profile-main">
            <div class="growth-card">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Growth track</p>
                  <h2 class="section-title">Level and daily momentum</h2>
                </div>
              </div>

              <div class="growth-row">
                <LevelBadge :level="engagementStore.userLevel?.level || 1" size="lg" />
                <div class="min-w-0 flex-1">
                  <ExpBar
                    :current-exp="engagementStore.userLevel?.total_exp || 0"
                    :next-level-exp="engagementStore.userLevel?.next_level_exp || 100"
                    :current-level-exp="engagementStore.userLevel?.current_level_exp || 0"
                    :level="engagementStore.userLevel?.level || 1"
                    :title="engagementStore.userLevel?.custom_title || engagementStore.userLevel?.title || 'Reader in progress'"
                  />
                </div>
              </div>

              <div class="growth-actions">
                <button
                  class="growth-primary-action"
                  @click="showCheckin = true"
                >
                  {{ engagementStore.checkinStatus?.checked_today ? 'Checked in today' : 'Check in now' }}
                  <span v-if="engagementStore.checkinStatus?.streak">· 🔥 {{ engagementStore.checkinStatus.streak }}</span>
                </button>

                <router-link to="/achievements" class="growth-secondary-action">
                  See all achievements
                </router-link>
              </div>
            </div>

            <div v-if="showIAP" class="wallet-grid">
              <router-link
                v-for="panel in walletPanels"
                :key="panel.label"
                :to="panel.route"
                class="wallet-card"
                :class="panel.tone === 'diamond' ? 'wallet-card-diamond' : 'wallet-card-coin'"
              >
                <div class="wallet-icon-shell">
                  <DiamondIcon v-if="panel.tone === 'diamond'" size="30px" />
                  <CoinIcon v-else size="30px" />
                </div>
                <div class="min-w-0">
                  <p class="wallet-label">{{ panel.label }}</p>
                  <p class="wallet-value">{{ panel.value }}</p>
                  <p class="wallet-note">{{ panel.note }}</p>
                </div>
              </router-link>
            </div>

            <div v-if="primaryActions.length" class="action-grid">
              <router-link
                v-for="action in primaryActions"
                :key="action.label"
                :to="action.route"
                class="action-card"
              >
                <span class="action-badge" :style="{ background: action.accent }">{{ action.icon }}</span>
                <div class="min-w-0">
                  <p class="action-title">{{ action.label }}</p>
                  <p class="action-desc">{{ action.desc }}</p>
                </div>
              </router-link>
            </div>

            <div
              v-if="showIAP"
              class="vip-card"
              :class="{ 'vip-card-active': userStore.isVip }"
            >
              <div class="vip-copy">
                <p class="section-kicker">Reward lane</p>
                <h2 class="vip-title">
                  Make every reading session earn more
                </h2>
                <p class="vip-summary">{{ vipSummary }}</p>

                <div class="vip-point-row">
                  <span>Free chapters</span>
                  <span>Daily rewards</span>
                  <span>Cashout path</span>
                </div>
              </div>

              <router-link to="/reward" class="vip-cta">
                Open rewards
              </router-link>
            </div>

            <div class="achievement-card">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Reader milestones</p>
                  <h2 class="section-title">Achievements in motion</h2>
                </div>
                <router-link to="/achievements" class="section-link">
                  View all
                </router-link>
              </div>

              <div class="achievement-grid">
                <div
                  v-for="achievement in achievementPreview"
                  :key="achievement.title"
                  class="achievement-tile"
                  :style="{ background: achievement.accent }"
                >
                  <span class="achievement-badge">{{ achievement.badge }}</span>
                  <h3>{{ achievement.title }}</h3>
                  <p>{{ achievement.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <aside class="profile-side">
            <div
              v-for="section in menuSections"
              :key="section.title"
              class="settings-card"
            >
              <p class="settings-title">{{ section.title }}</p>

              <button
                v-for="item in section.items"
                :key="item.label"
                class="settings-item"
                @click="router.push(item.route)"
              >
                <span class="settings-icon" :style="{ background: item.accent }">{{ item.icon }}</span>
                <span class="min-w-0 flex-1">
                  <span class="settings-item-title">{{ item.label }}</span>
                  <span class="settings-item-desc">{{ item.desc }}</span>
                </span>
                <svg class="w-4 h-4 settings-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button class="logout-button" @click="handleLogout">
              Sign Out
            </button>
          </aside>
        </div>
      </section>
    </LoginGate>

    <CheckInModal v-if="showCheckin" @close="showCheckin = false" />
  </main>
</template>

<style scoped>
.profile-page {
  background:
    radial-gradient(circle at top left, rgba(46, 123, 216, 0.18), transparent 24%),
    radial-gradient(circle at top right, rgba(212, 169, 45, 0.16), transparent 20%),
    linear-gradient(180deg, #f7f5ef 0%, #f5f8fc 34%, #fbfcff 100%);
}

.profile-hero,
.growth-card,
.wallet-card,
.action-card,
.vip-card,
.achievement-card,
.settings-card {
  border-radius: 1.7rem;
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.profile-hero {
  padding: 1.5rem;
  background:
    linear-gradient(135deg, rgba(13, 40, 82, 0.97), rgba(26, 79, 152, 0.92)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent);
  color: #ffffff;
}

.profile-hero-main,
.profile-layout,
.growth-row,
.vip-card {
  display: grid;
  gap: 1rem;
}

.profile-avatar-wrap {
  position: relative;
  width: fit-content;
}

.profile-avatar {
  width: 6.4rem;
  height: 6.4rem;
  border-radius: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.12));
  border: 1px solid rgba(255, 255, 255, 0.16);
  overflow: hidden;
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffffff;
}

.profile-avatar-edit {
  position: absolute;
  right: -0.35rem;
  bottom: -0.35rem;
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.profile-chip-row,
.profile-meta-row,
.vip-point-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.profile-chip,
.profile-meta-row span {
  border-radius: 999px;
}

.profile-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.45rem 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(237, 243, 251, 0.92);
  font-size: 0.84rem;
  font-weight: 700;
}

.profile-chip-vip {
  background: rgba(243, 205, 102, 0.16);
  border-color: rgba(243, 205, 102, 0.24);
  color: #f5d986;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.profile-name {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  font-weight: 800;
}

.profile-name-input {
  min-width: 15rem;
  padding: 0.25rem 0;
  border: 0;
  border-bottom: 2px solid rgba(243, 205, 102, 0.75);
  background: transparent;
  color: #ffffff;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
  outline: none;
}

.profile-name-edit {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.profile-email {
  margin-top: 0.55rem;
  color: rgba(227, 236, 248, 0.88);
}

.profile-meta-row {
  margin-top: 1rem;
}

.profile-meta-row span {
  padding: 0.6rem 0.9rem;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(241, 246, 252, 0.88);
  font-size: 0.88rem;
}

.profile-highlight-grid,
.wallet-grid,
.action-grid,
.achievement-grid {
  display: grid;
  gap: 1rem;
}

.highlight-card {
  padding: 1rem;
  border-radius: 1.35rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.highlight-label,
.section-kicker,
.settings-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.highlight-label {
  color: rgba(243, 205, 102, 0.86);
}

.highlight-value {
  margin-top: 0.55rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
}

.highlight-note {
  margin-top: 0.45rem;
  color: rgba(230, 237, 248, 0.82);
  line-height: 1.6;
  font-size: 0.9rem;
}

.profile-main,
.profile-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.growth-card,
.achievement-card,
.settings-card {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.92);
}

.section-kicker {
  color: rgba(21, 69, 136, 0.82);
}

.section-title {
  margin-top: 0.35rem;
  font-size: 1.45rem;
  font-weight: 800;
  color: #11284d;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.growth-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1rem;
}

.growth-primary-action,
.growth-secondary-action,
.vip-cta,
.section-link,
.logout-button {
  transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease;
}

.growth-primary-action,
.growth-secondary-action,
.vip-cta,
.section-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  padding: 0.85rem 1.1rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
}

.growth-primary-action {
  border: 0;
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  color: #ffffff;
}

.growth-secondary-action,
.section-link {
  border: 1px solid rgba(16, 45, 84, 0.08);
  background: rgba(248, 250, 255, 0.98);
  color: #1b4e93;
}

.wallet-grid {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.wallet-card,
.action-card {
  display: flex;
  gap: 1rem;
  padding: 1.15rem;
  text-decoration: none;
}

.wallet-card-diamond {
  background: linear-gradient(135deg, rgba(15, 63, 109, 0.98), rgba(46, 123, 216, 0.92));
  color: #ffffff;
}

.wallet-card-coin {
  background: linear-gradient(135deg, rgba(95, 71, 4, 0.98), rgba(212, 169, 45, 0.92));
  color: #ffffff;
}

.wallet-icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.14);
  flex-shrink: 0;
}

.wallet-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(241, 246, 252, 0.86);
}

.wallet-value {
  margin-top: 0.3rem;
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
}

.wallet-note {
  margin-top: 0.45rem;
  line-height: 1.6;
  color: rgba(236, 241, 250, 0.82);
}

.action-grid {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.action-card {
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.92);
}

.action-badge,
.settings-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  color: #ffffff;
  font-weight: 800;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.action-badge {
  width: 3rem;
  height: 3rem;
}

.action-title,
.settings-item-title {
  font-weight: 800;
  color: #122b50;
}

.action-desc,
.settings-item-desc {
  display: block;
  margin-top: 0.35rem;
  color: #66768d;
  line-height: 1.6;
}

.vip-card {
  padding: 1.35rem;
  align-items: center;
  background: linear-gradient(135deg, rgba(12, 24, 48, 0.98), rgba(30, 53, 91, 0.94));
  color: #ffffff;
}

.vip-card-active {
  background: linear-gradient(135deg, rgba(74, 53, 7, 0.98), rgba(134, 93, 18, 0.94));
}

.vip-title {
  margin-top: 0.4rem;
  font-size: 1.6rem;
  font-weight: 800;
}

.vip-summary {
  margin-top: 0.65rem;
  color: rgba(233, 239, 249, 0.88);
  line-height: 1.7;
}

.vip-point-row {
  margin-top: 1rem;
}

.vip-point-row span {
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(244, 247, 252, 0.9);
  font-size: 0.88rem;
}

.vip-cta {
  border: 0;
  background: linear-gradient(135deg, #f2d47a, #d8a629);
  color: #1f1600;
  white-space: nowrap;
}

.achievement-grid {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.achievement-tile {
  position: relative;
  padding: 1.15rem;
  min-height: 11rem;
  border-radius: 1.45rem;
  color: #ffffff;
  overflow: hidden;
}

.achievement-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.4rem;
  height: 2.4rem;
  padding: 0 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.achievement-tile h3 {
  margin-top: 1.1rem;
  font-size: 1.3rem;
  font-weight: 800;
}

.achievement-tile p {
  margin-top: 0.7rem;
  color: rgba(239, 244, 251, 0.9);
  line-height: 1.7;
}

.settings-title {
  margin-bottom: 0.85rem;
  color: rgba(21, 69, 136, 0.82);
}

.settings-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 0;
  text-align: left;
  border-bottom: 1px solid rgba(16, 45, 84, 0.07);
}

.settings-item:last-child {
  border-bottom: 0;
}

.settings-icon {
  width: 2.85rem;
  height: 2.85rem;
}

.settings-arrow {
  color: #94a0b2;
}

.logout-button {
  width: 100%;
  min-height: 3.1rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(176, 47, 47, 0.12);
  background: rgba(255, 255, 255, 0.94);
  color: #b33939;
  font-weight: 800;
}

.growth-primary-action:hover,
.growth-secondary-action:hover,
.vip-cta:hover,
.section-link:hover,
.logout-button:hover {
  transform: translateY(-1px);
}

@media (min-width: 768px) {
  .profile-hero-main {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .profile-highlight-grid,
  .wallet-grid,
  .action-grid,
  .achievement-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .profile-layout {
    grid-template-columns: minmax(0, 1.45fr) minmax(20rem, 0.7fr);
    align-items: flex-start;
  }

  .profile-highlight-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 1.25rem;
  }

  .wallet-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .vip-card {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .achievement-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
