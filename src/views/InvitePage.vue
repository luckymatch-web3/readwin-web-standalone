<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import LoginGate from '@/components/LoginGate.vue'
import EmptyState from '@/components/EmptyState.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import DiamondIcon from '@/components/DiamondIcon.vue'
import AdBanner from '@/components/AdBanner.vue'
import NativeInviteScreen from '@/components/app/NativeInviteScreen.vue'
import { Analytics } from '@/services/analytics'
import { inviteApi } from '@/services/api'
import { isNativeApp } from '@/services/admob'
import { useToastStore } from '@/stores/toast'
import { useUserStore } from '@/stores/user'
import type { InviteInfo, TeamMember } from '@/types'

interface EarningItem {
  id: number
  amount: number
  source: string | null
  related_user_id: number | null
  note: string | null
  created_at: string
}

const userStore = useUserStore()
const toastStore = useToastStore()
const nativeApp = isNativeApp()

const loading = ref(true)
const teamLoading = ref(false)
const earningsLoading = ref(false)
const copied = ref('')
const teamFilter = ref<'all' | '1' | '2'>('all')

const inviteInfo = ref<InviteInfo>({
  invite_code: userStore.user?.invite_code || '',
  invite_link: `https://readwin.me/register?ref=${userStore.user?.invite_code || ''}`,
  level1_count: 0,
  level2_count: 0,
  total_commission: 0,
  month_commission: 0,
})
const teamMembers = ref<TeamMember[]>([])
const earnings = ref<EarningItem[]>([])

const inviteCode = computed(() => inviteInfo.value.invite_code || userStore.user?.invite_code || '------')
const inviteLink = computed(() => inviteInfo.value.invite_link || `https://readwin.me/register?ref=${inviteCode.value}`)
const statsCards = computed(() => [
  {
    label: 'Level 1 circle',
    value: formatNumber(inviteInfo.value.level1_count),
    note: 'Direct readers who joined with your code.',
  },
  {
    label: 'Level 2 circle',
    value: formatNumber(inviteInfo.value.level2_count),
    note: 'Second-degree readers expanding the network.',
  },
  {
    label: 'Total commission',
    value: `${formatNumber(inviteInfo.value.total_commission)} diamonds`,
    note: 'All-time referral commission recorded by the backend.',
  },
  {
    label: 'This month',
    value: `${formatNumber(inviteInfo.value.month_commission)} diamonds`,
    note: 'Current month referral earnings so far.',
  },
])
const mechanics = [
  {
    title: 'Reader joins with your code',
    detail: 'You receive 200 reader coins right away when a valid invite binds at registration.',
    tone: 'coin',
  },
  {
    title: 'New reader gets a warm start',
    detail: 'The invited reader receives 50 welcome coins so they can start reading immediately.',
    tone: 'coin-soft',
  },
  {
    title: 'Recharge creates commission',
    detail: 'When invited readers recharge, the backend pays 15% to level 1 and 5% to level 2 inviters in commission diamonds.',
    tone: 'diamond',
  },
  {
    title: 'Monthly cap stays explicit',
    detail: 'Commission accrual is capped at 5000 diamonds per month for each inviter on the server side.',
    tone: 'navy',
  },
]

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await refreshPage()
  } else {
    loading.value = false
  }
})

watch(() => userStore.isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await refreshPage()
  }
})

watch(teamFilter, async () => {
  if (userStore.isLoggedIn) {
    Analytics.filterChanged('team_filter', teamFilter.value, {
      screen_name: 'invite',
    })
    await loadTeam()
  }
})

async function refreshPage() {
  loading.value = true
  try {
    await Promise.all([loadInfo(), loadTeam(), loadEarnings()])
  } finally {
    loading.value = false
  }
}

async function loadInfo() {
  const data = await inviteApi.info()
  inviteInfo.value = {
    ...inviteInfo.value,
    ...data,
    invite_code: data.invite_code || userStore.user?.invite_code || '',
    invite_link: data.invite_link || `https://readwin.me/register?ref=${data.invite_code || userStore.user?.invite_code || ''}`,
  }
}

async function loadTeam() {
  teamLoading.value = true
  try {
    const level = teamFilter.value === 'all' ? undefined : Number(teamFilter.value)
    const data = await inviteApi.team(level, 1, 20)
    teamMembers.value = data.items || []
  } finally {
    teamLoading.value = false
  }
}

async function loadEarnings() {
  earningsLoading.value = true
  try {
    const data = await inviteApi.earnings(1, 20)
    earnings.value = data.items || []
  } finally {
    earningsLoading.value = false
  }
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = label
    Analytics.inviteSent({
      channel: 'clipboard',
      content_type: label,
      screen_name: 'invite',
    })
    Analytics.inviteAction('copy_success', {
      content_type: label,
      screen_name: 'invite',
    })
    toastStore.show('Copied and ready to share.', 'success')
    setTimeout(() => {
      if (copied.value === label) copied.value = ''
    }, 2000)
  } catch {
    Analytics.inviteAction('copy_failed', {
      content_type: label,
      screen_name: 'invite',
    })
    toastStore.show('Copy failed on this device.', 'error')
  }
}

function shareWhatsApp() {
  Analytics.inviteSent({ channel: 'whatsapp', screen_name: 'invite' })
  window.open(`https://wa.me/?text=${encodeURIComponent(`Join ReadWin with my invite code ${inviteCode.value}. ${inviteLink.value}`)}`)
}

function shareX() {
  Analytics.inviteSent({ channel: 'x', screen_name: 'invite' })
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join ReadWin with my invite code ${inviteCode.value}`)}&url=${encodeURIComponent(inviteLink.value)}`)
}

function shareTelegram() {
  Analytics.inviteSent({ channel: 'telegram', screen_name: 'invite' })
  window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink.value)}&text=${encodeURIComponent(`Join ReadWin with my code ${inviteCode.value}`)}`)
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString()
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function memberInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() || 'R'
}

function levelLabel(level: number): string {
  return level === 2 ? 'Level 2' : 'Level 1'
}

function earningSource(source?: string | null): string {
  if (source === 'level1_commission') return 'Level 1 recharge'
  if (source === 'level2_commission') return 'Level 2 recharge'
  return 'Commission'
}
</script>

<template>
  <NativeInviteScreen v-if="nativeApp" />
  <template v-else>
  <main class="invite-page pb-24">
    <LoginGate message="Log in to open your referral dashboard and share your invite code.">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="invite-hero">
          <div class="invite-hero-copy">
            <p class="section-kicker">Reader circle</p>
            <h1 class="hero-title">Invite friends, stack coins, and turn your circle into the cash lane.</h1>
            <p class="hero-summary">
              Share your code, let new readers join, then track direct invites, second-level growth, and commission records from one reward-first invite page.
            </p>

            <div class="hero-chip-row">
              <span class="hero-chip">200 coins for inviter</span>
              <span class="hero-chip">50 coins for invitee</span>
              <span class="hero-chip">15% level 1 · 5% level 2 commission</span>
            </div>
          </div>

          <div class="invite-hero-card">
            <p class="invite-code-label">Invite code</p>
            <p class="invite-code-value">{{ inviteCode }}</p>

            <button class="primary-cta" @click="copyText(inviteCode, 'code')">
              {{ copied === 'code' ? 'Code copied' : 'Copy code' }}
            </button>

            <div class="link-card">
              <p class="link-label">Share link</p>
              <p class="link-value">{{ inviteLink }}</p>
              <button class="ghost-action ghost-action-inline" @click="copyText(inviteLink, 'link')">
                {{ copied === 'link' ? 'Copied' : 'Copy link' }}
              </button>
            </div>

            <div class="share-row">
              <button class="share-chip" @click="shareWhatsApp">WhatsApp</button>
              <button class="share-chip" @click="shareX">X</button>
              <button class="share-chip" @click="shareTelegram">Telegram</button>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-5">
        <AdBanner format="banner" position="bottom" />
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="mechanic-grid">
          <div
            v-for="item in mechanics"
            :key="item.title"
            class="mechanic-card"
            :class="`mechanic-card-${item.tone}`"
          >
            <p class="section-kicker">How it works</p>
            <h2>{{ item.title }}</h2>
            <p>{{ item.detail }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="stats-grid">
          <div v-for="card in statsCards" :key="card.label" class="stats-card">
            <p class="section-kicker">Growth snapshot</p>
            <h2>{{ card.label }}</h2>
            <p class="stats-value">{{ card.value }}</p>
            <p class="stats-note">{{ card.note }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="invite-grid">
          <div class="panel-card">
            <div class="section-head">
              <div>
                <p class="section-kicker">Recent circle members</p>
                <h2 class="section-title">See who has joined your referral network</h2>
              </div>
              <div class="filter-row">
                <button
                  v-for="filter in (['all', '1', '2'] as const)"
                  :key="filter"
                  class="filter-chip"
                  :class="{ 'filter-chip-active': teamFilter === filter }"
                  @click="teamFilter = filter"
                >
                  {{ filter === 'all' ? 'All' : `Level ${filter}` }}
                </button>
              </div>
            </div>

            <div v-if="teamLoading || loading" class="panel-loading">
              <span class="spinner"></span>
              <p>Loading team members...</p>
            </div>

            <EmptyState
              v-else-if="teamMembers.length === 0"
              icon="👥"
              title="No circle members yet"
              description="Once a reader joins with your code, they will appear here with their referral level."
            />

            <div v-else class="member-list">
              <article v-for="member in teamMembers" :key="member.id" class="member-card">
                <div class="member-avatar">{{ memberInitial(member.nickname) }}</div>
                <div class="member-copy">
                  <div class="member-head">
                    <div>
                      <p class="member-title">{{ member.nickname }}</p>
                      <p class="member-meta">{{ levelLabel(member.level) }} · Joined {{ formatDate(member.joined_at) }}</p>
                    </div>
                    <span class="member-commission">+{{ formatNumber(member.total_commission) }} 💎</span>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div class="panel-card panel-card-dark">
            <div class="section-head">
              <div>
                <p class="section-kicker">Recent commissions</p>
                <h2 class="section-title">Diamond earnings recorded by the backend</h2>
              </div>
              <button class="ghost-action ghost-action-dark" @click="loadEarnings">Refresh</button>
            </div>

            <div v-if="earningsLoading || loading" class="panel-loading panel-loading-dark">
              <span class="spinner spinner-light"></span>
              <p>Loading commission history...</p>
            </div>

            <EmptyState
              v-else-if="earnings.length === 0"
              icon="💎"
              title="No commission yet"
              description="Commission diamonds appear here after readers in your circle complete recharges."
            />

            <div v-else class="earning-list">
              <article v-for="item in earnings" :key="item.id" class="earning-card">
                <div class="earning-head">
                  <div>
                    <p class="earning-title">{{ earningSource(item.source) }}</p>
                    <p class="earning-note">{{ item.note || 'Commission from referred reader recharge.' }}</p>
                  </div>
                  <span class="earning-amount">+{{ formatNumber(item.amount) }} 💎</span>
                </div>
                <p class="earning-date">{{ formatDate(item.created_at) }}</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </LoginGate>
  </main>
  </template>
</template>

<style scoped>
.invite-page {
  background:
    radial-gradient(circle at top left, rgba(46, 123, 216, 0.14), transparent 22%),
    radial-gradient(circle at top right, rgba(212, 169, 45, 0.15), transparent 20%),
    linear-gradient(180deg, #f6f3ed 0%, #f4f8fe 34%, #fbfcff 100%);
}

.invite-hero,
.invite-hero-card,
.mechanic-card,
.stats-card,
.panel-card,
.member-card,
.earning-card {
  border-radius: 1.7rem;
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.invite-hero,
.mechanic-grid,
.stats-grid,
.invite-grid {
  display: grid;
  gap: 1.5rem;
}

.invite-hero {
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
}

.invite-hero-copy,
.invite-hero-card,
.mechanic-card,
.stats-card,
.panel-card {
  padding: clamp(1.4rem, 2vw, 2rem);
}

.invite-hero-copy {
  border-radius: 1.9rem;
  background: linear-gradient(135deg, rgba(12, 44, 80, 0.97), rgba(43, 115, 201, 0.93));
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

.invite-hero-copy .section-kicker,
.panel-card-dark .section-kicker {
  color: rgba(219, 234, 255, 0.76);
}

.hero-title {
  margin: 0;
  font-size: clamp(2.3rem, 4.4vw, 3.9rem);
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

.hero-chip-row,
.share-row,
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-chip,
.share-chip,
.filter-chip,
.primary-cta,
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

.invite-hero-card,
.mechanic-card,
.stats-card,
.panel-card {
  background: rgba(255, 255, 255, 0.88);
}

.invite-code-label,
.link-label,
.stats-note,
.member-meta,
.earning-note,
.earning-date,
.panel-loading p {
  color: #5d6f85;
}

.invite-code-value {
  margin: 0.35rem 0 1rem;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #0f3f6d;
}

.primary-cta {
  width: 100%;
  border: 0;
  border-radius: 1rem;
  padding: 0.95rem 1.15rem;
  font-weight: 700;
  color: #fefefe;
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  box-shadow: 0 16px 30px -24px rgba(15, 63, 109, 0.8);
}

.primary-cta:hover,
.ghost-action:hover,
.share-chip:hover,
.filter-chip:hover {
  transform: translateY(-1px);
}

.link-card {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 1.1rem;
  background: rgba(15, 63, 109, 0.06);
}

.link-value {
  margin-top: 0.45rem;
  color: #12304f;
  line-height: 1.6;
  word-break: break-all;
}

.ghost-action {
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(255, 255, 255, 0.78);
  color: #0f3f6d;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
}

.ghost-action-inline {
  margin-top: 0.9rem;
}

.share-row {
  margin-top: 1rem;
}

.share-chip {
  border: 1px solid rgba(15, 63, 109, 0.08);
  background: rgba(15, 63, 109, 0.04);
  color: #19456b;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
}

.mechanic-grid,
.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.mechanic-card h2,
.stats-card h2,
.section-title,
.member-title,
.earning-title {
  margin: 0;
  color: #12304f;
}

.mechanic-card h2,
.stats-card h2 {
  font-size: 1.08rem;
}

.mechanic-card p:last-child,
.stats-note {
  margin-top: 0.85rem;
  line-height: 1.7;
}

.mechanic-card-coin {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.94), rgba(245, 250, 254, 0.94));
}

.mechanic-card-coin-soft {
  background: linear-gradient(160deg, rgba(255, 251, 239, 0.94), rgba(255, 248, 228, 0.94));
}

.mechanic-card-diamond {
  background: linear-gradient(160deg, rgba(246, 249, 255, 0.96), rgba(230, 240, 255, 0.94));
}

.mechanic-card-navy {
  background: linear-gradient(160deg, rgba(237, 242, 250, 0.96), rgba(225, 234, 247, 0.94));
}

.stats-value {
  margin-top: 0.85rem;
  font-size: 1.55rem;
  font-weight: 700;
  color: #0f3f6d;
}

.invite-grid {
  grid-template-columns: minmax(0, 1.06fr) minmax(320px, 0.94fr);
}

.section-head,
.member-head,
.earning-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-title {
  font-size: clamp(1.4rem, 2.2vw, 1.9rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
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

.panel-card-dark {
  background: linear-gradient(150deg, rgba(16, 45, 84, 0.97), rgba(23, 71, 96, 0.94));
  color: rgba(245, 250, 255, 0.96);
}

.panel-card-dark .section-title,
.panel-card-dark .earning-title,
.panel-card-dark .earning-date,
.panel-card-dark .earning-note {
  color: inherit;
}

.ghost-action-dark {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.14);
  color: #fefefe;
}

.member-list,
.earning-list {
  display: grid;
  gap: 1rem;
  margin-top: 1.4rem;
}

.member-card,
.earning-card {
  padding: 1.1rem;
  background: rgba(247, 250, 254, 0.92);
}

.member-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
}

.member-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 63, 109, 0.1);
  color: #0f3f6d;
  font-weight: 700;
}

.member-title,
.earning-title {
  font-size: 1.02rem;
  font-weight: 700;
}

.member-commission,
.earning-amount {
  color: #735c00;
  font-size: 1rem;
  font-weight: 700;
}

.panel-loading {
  min-height: 14rem;
  display: grid;
  place-items: center;
  text-align: center;
}

.panel-loading-dark {
  color: rgba(255, 255, 255, 0.82);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 3px solid rgba(46, 123, 216, 0.2);
  border-top-color: #2e7bd8;
  animation: spin 0.9s linear infinite;
}

.spinner-light {
  border-color: rgba(255, 255, 255, 0.18);
  border-top-color: #fefefe;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .invite-hero,
  .mechanic-grid,
  .stats-grid,
  .invite-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .invite-hero-copy,
  .invite-hero-card,
  .mechanic-card,
  .stats-card,
  .panel-card {
    padding: 1.2rem;
  }

  .hero-title {
    max-width: none;
  }

  .section-head,
  .member-head,
  .earning-head {
    flex-direction: column;
    align-items: stretch;
  }

  .invite-code-value {
    letter-spacing: 0.08em;
    word-break: break-all;
  }
}
</style>
