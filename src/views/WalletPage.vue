<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CoinIcon from '@/components/CoinIcon.vue'
import DiamondIcon from '@/components/DiamondIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import AdBanner from '@/components/AdBanner.vue'
import NativeWalletScreen from '@/components/app/NativeWalletScreen.vue'
import { coinApi, diamondApi, withdrawApi } from '@/services/api'
import { Analytics } from '@/services/analytics'
import { isNativeApp } from '@/services/admob'
import type { WithdrawRecord } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const nativeApp = isNativeApp()

type WalletLog = {
  id: number
  type: 'reward' | 'paid' | 'commission' | 'coin'
  action: 'earn' | 'spend'
  amount: number
  balance_after: number
  source: string | null
  note: string | null
  created_at: string
}

const activeTab = ref<'income' | 'withdraw'>('income')
const exchangeAmount = ref(10)
const showExchange = ref(false)
const exchangeRate = 100
const exchangeLoading = ref(false)
const exchangeError = ref('')
const loadingLogs = ref(false)
const withdrawRecords = ref<WithdrawRecord[]>([])

const diamondLogs = ref<WalletLog[]>([])
const coinLogs = ref<WalletLog[]>([])

const allLogs = computed(() =>
  [...diamondLogs.value, ...coinLogs.value].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ),
)

const filteredLogs = computed(() => allLogs.value)

const withdrawGoal = 500
const withdrawProgress = computed(() => Math.min((userStore.totalDiamond / withdrawGoal) * 100, 100))
const withdrawRemaining = computed(() => Math.max(withdrawGoal - userStore.totalDiamond, 0))

const balanceBreakdown = computed(() => [
  {
    label: 'Reward diamonds',
    value: formatNum(userStore.displayUser?.reward_diamond || 0),
    note: 'Earned from activity, streaks, and reader rewards.',
    tone: 'diamond',
  },
  {
    label: 'Bonus diamonds',
    value: formatNum(userStore.displayUser?.paid_diamond || 0),
    note: 'Extra reward balance for reader events and bonuses.',
    tone: 'gold',
  },
  {
    label: 'Commission diamonds',
    value: formatNum(userStore.displayUser?.commission_diamond || 0),
    note: 'Withdrawable referral and commission earnings.',
    tone: 'teal',
  },
  {
    label: 'Reader coins',
    value: formatNum(userStore.displayCoinBalance || 0),
    note: 'Earned while reading and through reward tasks.',
    tone: 'coin',
  },
])

onMounted(() => {
  void loadWalletRecords()
})

async function loadWalletRecords() {
  loadingLogs.value = true
  try {
    if (!userStore.isLoggedIn) {
      coinLogs.value = [{
        id: Date.now(),
        type: 'coin',
        action: 'earn',
        amount: userStore.displayCoinBalance,
        balance_after: userStore.displayCoinBalance,
        source: 'guest_wallet',
        note: 'Guest coin balance saved on this device',
        created_at: new Date().toISOString(),
      }]
      diamondLogs.value = []
      withdrawRecords.value = []
      return
    }

    const [coinData, diamondData, withdrawData] = await Promise.all([
      coinApi.logs(1, 100),
      diamondApi.logs(1, 100),
      withdrawApi.history(1, 50),
    ])

    coinLogs.value = (coinData.items || []).map((item: any) => ({
      id: item.id,
      type: 'coin',
      action: Number(item.amount || 0) >= 0 ? 'earn' : 'spend',
      amount: Number(item.amount || 0),
      balance_after: Number(item.balance_after || 0),
      source: item.type || item.source || null,
      note: item.description || item.note || coinSourceLabel(item.type),
      created_at: item.created_at,
    }))

    diamondLogs.value = (diamondData.items || []).map((item: any) => ({
      id: item.id,
      type: normalizeDiamondType(item.type),
      action: Number(item.amount || 0) >= 0 ? 'earn' : 'spend',
      amount: Number(item.amount || 0),
      balance_after: Number(item.balance_after || 0),
      source: item.source || item.action || null,
      note: item.note || diamondSourceLabel(item.source || item.action),
      created_at: item.created_at,
    }))

    withdrawRecords.value = withdrawData.items || []
  } finally {
    loadingLogs.value = false
  }
}

const quickActions = [
  {
    label: 'Rewards',
    desc: 'Open missions, check-ins, and rewarded videos.',
    route: '/reward',
    accent: 'linear-gradient(135deg, #0f3f6d, #2e7bd8)',
  },
  {
    label: 'Exchange',
    desc: 'Beta lane for converting diamonds into flexible coins.',
    action: openExchangeModal,
    accent: 'linear-gradient(135deg, #5f4704, #d4a92d)',
  },
  {
    label: 'Withdraw',
    desc: 'Move eligible commission rewards into cash-out flow.',
    route: '/withdraw',
    accent: 'linear-gradient(135deg, #21424a, #38a6a5)',
  },
  {
    label: 'Activity',
    desc: 'Review every wallet movement and history event.',
    route: '/coin-details',
    accent: 'linear-gradient(135deg, #5d2347, #d35a91)',
  },
]

async function exchangeDiamondToCoin() {
  if (!userStore.user) return
  if (exchangeAmount.value <= 0 || exchangeAmount.value > userStore.totalDiamond) return

  Analytics.walletAction('exchange_attempt', {
    amount: exchangeAmount.value,
    balance: userStore.totalDiamond,
    screen_name: 'wallet',
  })
  exchangeLoading.value = true
  exchangeError.value = ''

  try {
    const token = JSON.parse(localStorage.getItem('user-store') || '{}').token
    const baseUrl = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api'
    const response = await fetch(`${baseUrl}/diamonds/exchange`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ diamond_amount: exchangeAmount.value }),
    })

    const json = await response.json()
    if (response.status === 404) {
      throw new Error('Diamond exchange is still in beta and is not enabled on the server yet.')
    }
    if (!response.ok) throw new Error(json.detail || json.message || 'Exchange failed')

    const data = json.data
    userStore.user.coin_balance = data.coin_balance
    userStore.user.reward_diamond = data.reward_diamond
    userStore.user.paid_diamond = data.paid_diamond
    userStore.user.commission_diamond = data.commission_diamond
    showExchange.value = false
    Analytics.walletAction('exchange_success', {
      amount: exchangeAmount.value,
      received_coins: exchangeAmount.value * exchangeRate,
      screen_name: 'wallet',
    })
  } catch (error: any) {
    exchangeError.value = error.message
    Analytics.walletAction('exchange_failed', {
      amount: exchangeAmount.value,
      fail_reason: error.message || 'exchange_failed',
      screen_name: 'wallet',
    })
  } finally {
    exchangeLoading.value = false
  }
}

function setWalletTab(tab: 'income' | 'withdraw') {
  activeTab.value = tab
  Analytics.walletAction('ledger_tab_changed', {
    tab,
    income_count: filteredLogs.value.length,
    withdraw_count: withdrawRecords.value.length,
    screen_name: 'wallet',
  })
}

function openExchangeModal() {
  exchangeError.value = ''
  showExchange.value = true
  Analytics.walletAction('exchange_modal_open', {
    balance: userStore.totalDiamond,
    screen_name: 'wallet',
  })
}

function closeExchangeModal() {
  showExchange.value = false
  Analytics.walletAction('exchange_modal_close', {
    screen_name: 'wallet',
  })
}

function openWalletRoute(label: string, route: string) {
  Analytics.walletAction('quick_action_open', {
    action_label: label,
    target_path: route,
    screen_name: 'wallet',
  })
  router.push(route)
}

function formatNum(value: number): string {
  return value.toLocaleString()
}

function formatCash(value: number | string): string {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelative(value: string): string {
  const timestamp = new Date(value).getTime()
  const diff = Date.now() - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${Math.max(hours, 1)}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function typeLabel(type: WalletLog['type']): string {
  if (type === 'coin') return 'Coins'
  if (type === 'reward') return 'Reward'
  if (type === 'paid') return 'Paid'
  return 'Commission'
}

function typeIcon(type: WalletLog['type']): string {
  if (type === 'coin') return 'CO'
  if (type === 'reward') return 'RW'
  if (type === 'paid') return 'PD'
  return 'CM'
}

function coinSourceLabel(source?: string | null) {
  if (source === 'daily_checkin') return 'checkin rewards'
  if (source === 'ad_reward') return 'reading ad rewards'
  if (source === 'task_reward') return 'general task rewards'
  if (source === 'invite_reward') return 'invite rewards'
  return 'coin rewards'
}

function diamondSourceLabel(source?: string | null) {
  if (source === 'withdrawal') return 'withdrawal movement'
  if (source === 'commission') return 'commission rewards'
  return 'diamond rewards'
}

function normalizeDiamondType(type?: string | null): WalletLog['type'] {
  if (type === 'reward' || type === 'paid' || type === 'commission') return type
  return 'commission'
}
</script>

<template>
  <NativeWalletScreen v-if="nativeApp" />
  <main v-else class="wallet-page pb-24">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="wallet-hero">
          <div class="wallet-hero-copy">
            <p class="wallet-kicker">Wallet dashboard</p>
            <h1 class="wallet-title">Your reading capital, organized.</h1>
            <p class="wallet-summary">
              Track reward diamonds, reader coins, referral commission, and your next cash-out milestone from one polished reader finance hub.
            </p>

            <div class="wallet-balance-card wallet-balance-card-primary">
              <div class="wallet-balance-head">
                <div class="flex items-center gap-2">
                  <DiamondIcon size="26px" />
                  <span>Total diamonds</span>
                </div>
                <span class="wallet-badge">Reward balance</span>
              </div>

              <p class="wallet-balance-value">{{ formatNum(userStore.totalDiamond) }}</p>
              <p class="wallet-balance-note">Commission diamonds can be withdrawn once you cross the payout threshold.</p>

              <div class="wallet-balance-actions">
                <button class="wallet-primary-cta" @click="openWalletRoute('Earn more', '/reward')">Earn more</button>
                <button class="wallet-secondary-cta" @click="openExchangeModal">Exchange to coins</button>
              </div>
            </div>
          </div>

          <div class="wallet-hero-side">
            <div class="wallet-balance-card wallet-balance-card-secondary">
              <div class="wallet-balance-head">
                <div class="flex items-center gap-2">
                  <CoinIcon size="24px" />
                  <span>Reader coins</span>
                </div>
                <span class="wallet-badge wallet-badge-amber">Flexible spend</span>
              </div>

              <p class="wallet-side-value">{{ formatNum(userStore.displayCoinBalance || 0) }}</p>
              <p class="wallet-side-note">Coins grow as you read free chapters and complete reward tasks.</p>
            </div>

            <AdBanner format="banner" position="bottom" />

            <div class="wallet-payout-card">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Payout runway</p>
                  <h2 class="section-title">Withdraw progress</h2>
                </div>
                <span class="wallet-goal-badge">{{ withdrawGoal }}💎 goal</span>
              </div>

              <div class="wallet-progress-track">
                <div class="wallet-progress-fill" :style="{ width: `${withdrawProgress}%` }"></div>
              </div>

              <div class="wallet-progress-meta">
                <span>{{ formatNum(Math.min(userStore.totalDiamond, withdrawGoal)) }} / {{ withdrawGoal }} diamonds</span>
                <span>{{ withdrawProgress.toFixed(0) }}%</span>
              </div>

              <p class="wallet-side-note">
                {{
                  withdrawRemaining === 0
                    ? 'You are eligible for withdrawal. Move your commission into the cash-out flow whenever you’re ready.'
                    : `${formatNum(withdrawRemaining)} more diamonds to reach your next payout window.`
                }}
              </p>

              <button class="wallet-inline-cta" :disabled="withdrawRemaining > 0" @click="openWalletRoute('Withdraw progress', '/withdraw')">
                {{ withdrawRemaining === 0 ? 'Withdraw now' : 'Keep earning' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="wallet-grid">
          <div class="wallet-main">
            <div class="breakdown-grid">
              <div
                v-for="item in balanceBreakdown"
                :key="item.label"
                class="breakdown-card"
                :class="`breakdown-card-${item.tone}`"
              >
                <p class="breakdown-label">{{ item.label }}</p>
                <p class="breakdown-value">{{ item.value }}</p>
                <p class="breakdown-note">{{ item.note }}</p>
              </div>
            </div>

            <div class="wallet-ledger-card">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Recent movement</p>
                  <h2 class="section-title">Wallet ledger</h2>
                </div>
              </div>

              <div class="ledger-tabs">
                <button
                  v-for="tab in (['income', 'withdraw'] as const)"
                  :key="tab"
                  class="ledger-tab"
                  :class="{ 'ledger-tab-active': activeTab === tab }"
                  @click="setWalletTab(tab)"
                >
                  <template v-if="tab === 'income'">Income records</template>
                  <template v-else>Withdrawal records</template>
                </button>
              </div>

              <EmptyState
                v-if="activeTab === 'income' && !loadingLogs && filteredLogs.length === 0"
                icon="💳"
                title="No wallet activity yet"
                description="Your exchanges, top-ups, and spend history will land here."
              />

              <div v-if="loadingLogs" class="ledger-list">
                <div class="ledger-item">
                  <span class="ledger-icon">...</span>
                  <div class="min-w-0 flex-1">
                    <p class="ledger-title">Loading wallet records...</p>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'income'" class="ledger-list">
                <div v-for="log in filteredLogs" :key="log.id" class="ledger-item">
                  <span class="ledger-icon">{{ typeIcon(log.type) }}</span>

                  <div class="min-w-0 flex-1">
                    <div class="ledger-row">
                      <p class="ledger-title">{{ log.note || log.source || 'Wallet update' }}</p>
                      <span class="ledger-amount" :class="log.amount >= 0 ? 'is-positive' : 'is-negative'">
                        {{ log.amount > 0 ? '+' : '' }}{{ log.amount }}
                      </span>
                    </div>

                    <div class="ledger-row ledger-row-meta">
                      <span>{{ typeLabel(log.type) }}</span>
                      <span>Balance {{ log.balance_after }}</span>
                      <span>{{ formatRelative(log.created_at) }}</span>
                      <span>{{ formatDate(log.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="withdrawRecords.length" class="ledger-list">
                <div v-for="record in withdrawRecords" :key="record.id" class="ledger-item">
                  <span class="ledger-icon">WD</span>
                  <div class="min-w-0 flex-1">
                    <div class="ledger-row">
                      <p class="ledger-title">{{ formatNum(record.amount) }} diamonds · {{ record.method }}</p>
                      <span class="ledger-amount" :class="record.status === 'paid' ? 'is-positive' : ''">
                        {{ record.status }}
                      </span>
                    </div>
                    <div class="ledger-row ledger-row-meta">
                      <span>{{ formatCash(record.cash_amount) }}</span>
                      <span>{{ record.account }}</span>
                      <span>{{ formatRelative(record.created_at) }}</span>
                      <span>{{ formatDate(record.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <EmptyState
                v-else
                icon="💸"
                title="No withdrawal records yet"
                description="PayPal cashout requests will appear here after submission."
              />
            </div>
          </div>

          <aside class="wallet-side-panel">
            <div class="wallet-aside-card">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Quick actions</p>
                  <h2 class="section-title">Move faster</h2>
                </div>
              </div>

              <button
                v-for="action in quickActions"
                :key="action.label"
                class="aside-action"
                @click="action.route ? openWalletRoute(action.label, action.route) : action.action?.()"
              >
                <span class="aside-action-icon" :style="{ background: action.accent }">{{ action.label.slice(0, 2).toUpperCase() }}</span>
                <span class="min-w-0 flex-1">
                  <span class="aside-action-title">{{ action.label }}</span>
                  <span class="aside-action-desc">{{ action.desc }}</span>
                </span>
              </button>
            </div>

            <div class="wallet-aside-card wallet-aside-card-note">
              <p class="section-kicker">Exchange notes</p>
              <h2 class="section-title">How the balance works</h2>
              <ul class="wallet-note-list">
                <li>1 diamond converts into {{ exchangeRate }} reader coins.</li>
                <li>Commission diamonds are the balance most relevant for withdrawal.</li>
                <li>Bonus diamonds are promotional balance for reader events and reward boosts.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <div v-if="showExchange" class="wallet-modal-backdrop" @click.self="closeExchangeModal">
        <div class="wallet-modal">
          <p class="section-kicker">Diamond exchange</p>
          <h3 class="wallet-modal-title">Turn reward balance into flexible coins.</h3>
          <p class="wallet-modal-copy">Set the amount you want to convert. This flow is still in beta, so if the exchange service is not live on the server yet we will tell you directly instead of pretending it worked.</p>

          <label class="wallet-modal-label" for="exchange-amount">Diamond amount</label>
          <input
            id="exchange-amount"
            v-model.number="exchangeAmount"
            type="number"
            min="1"
            :max="userStore.totalDiamond"
            class="wallet-modal-input"
          />

          <p class="wallet-modal-hint">You will receive <strong>{{ formatNum(exchangeAmount * exchangeRate) }}</strong> coins.</p>
          <p v-if="exchangeError" class="wallet-modal-error">{{ exchangeError }}</p>

          <div class="wallet-modal-actions">
            <button class="wallet-modal-secondary" @click="closeExchangeModal">Cancel</button>
            <button class="wallet-modal-primary" :disabled="exchangeLoading" @click="exchangeDiamondToCoin">
              {{ exchangeLoading ? 'Exchanging...' : 'Exchange now' }}
            </button>
          </div>
        </div>
      </div>
  </main>
</template>

<style scoped>
.wallet-page {
  background:
    radial-gradient(circle at top left, rgba(46, 123, 216, 0.18), transparent 24%),
    radial-gradient(circle at top right, rgba(212, 169, 45, 0.16), transparent 20%),
    linear-gradient(180deg, #f7f5ef 0%, #f5f8fc 34%, #fbfcff 100%);
}

.wallet-hero,
.wallet-balance-card,
.wallet-payout-card,
.breakdown-card,
.wallet-ledger-card,
.wallet-aside-card,
.wallet-modal {
  border-radius: 1.7rem;
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.wallet-hero,
.wallet-grid,
.wallet-hero-side,
.breakdown-grid {
  display: grid;
  gap: 1rem;
}

.wallet-hero {
  padding: 1.5rem;
  background:
    linear-gradient(135deg, rgba(13, 40, 82, 0.97), rgba(26, 79, 152, 0.92)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent);
  color: #ffffff;
}

.wallet-kicker,
.section-kicker,
.breakdown-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.wallet-kicker {
  color: rgba(243, 205, 102, 0.88);
}

.wallet-title {
  margin-top: 0.8rem;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1;
  font-weight: 800;
}

.wallet-summary {
  max-width: 38rem;
  margin-top: 0.85rem;
  color: rgba(228, 236, 248, 0.88);
  line-height: 1.75;
}

.wallet-balance-card,
.wallet-payout-card,
.wallet-ledger-card,
.wallet-aside-card,
.breakdown-card {
  padding: 1.25rem;
}

.wallet-balance-card-primary {
  margin-top: 1.5rem;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.12);
}

.wallet-balance-card-secondary,
.wallet-payout-card,
.wallet-ledger-card,
.wallet-aside-card,
.breakdown-card {
  background: rgba(255, 255, 255, 0.92);
}

.wallet-balance-head,
.wallet-balance-actions,
.wallet-progress-meta,
.ledger-row,
.section-head,
.ledger-tabs,
.wallet-modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.wallet-balance-head span:first-child,
.wallet-balance-head div {
  font-weight: 700;
}

.wallet-badge,
.wallet-goal-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.wallet-badge {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(244, 247, 252, 0.9);
}

.wallet-badge-amber,
.wallet-goal-badge {
  background: rgba(243, 205, 102, 0.14);
  color: #b7870e;
}

.wallet-balance-value,
.wallet-side-value {
  font-weight: 800;
  color: #ffffff;
}

.wallet-balance-value {
  margin-top: 1rem;
  font-size: clamp(2.3rem, 4vw, 3.6rem);
  line-height: 1;
}

.wallet-side-value {
  margin-top: 0.85rem;
  font-size: 2.25rem;
  color: #10284f;
}

.wallet-balance-note,
.wallet-side-note,
.breakdown-note,
.aside-action-desc,
.wallet-modal-copy,
.wallet-modal-hint,
.wallet-note-list li,
.ledger-row-meta {
  line-height: 1.7;
}

.wallet-balance-note {
  margin-top: 0.55rem;
  color: rgba(233, 239, 249, 0.88);
}

.wallet-balance-actions {
  margin-top: 1.2rem;
  flex-wrap: wrap;
}

.wallet-primary-cta,
.wallet-secondary-cta,
.wallet-inline-cta,
.wallet-modal-primary,
.wallet-modal-secondary,
.ledger-tab {
  min-height: 2.9rem;
  padding: 0.85rem 1.05rem;
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
}

.wallet-primary-cta,
.wallet-inline-cta,
.wallet-modal-primary {
  border: 0;
  background: linear-gradient(135deg, #f2d47a, #d8a629);
  color: #1f1600;
}

.wallet-secondary-cta,
.wallet-modal-secondary,
.ledger-tab {
  border: 1px solid rgba(16, 45, 84, 0.08);
  background: rgba(248, 250, 255, 0.96);
  color: #1b4e93;
}

.wallet-secondary-cta {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.16);
}

.wallet-primary-cta:hover,
.wallet-secondary-cta:hover,
.wallet-inline-cta:hover,
.wallet-modal-primary:hover,
.wallet-modal-secondary:hover,
.ledger-tab:hover,
.aside-action:hover {
  transform: translateY(-1px);
}

.section-kicker,
.breakdown-label {
  color: rgba(21, 69, 136, 0.82);
}

.section-title {
  margin-top: 0.35rem;
  font-size: 1.45rem;
  font-weight: 800;
  color: #11284d;
}

.wallet-progress-track {
  width: 100%;
  height: 0.8rem;
  margin-top: 0.8rem;
  border-radius: 999px;
  background: rgba(16, 45, 84, 0.08);
  overflow: hidden;
}

.wallet-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f3f6d, #d4a92d);
}

.wallet-progress-meta {
  margin-top: 0.6rem;
  color: #5c6d86;
  font-size: 0.9rem;
}

.breakdown-label {
  color: #5b84be;
}

.breakdown-value {
  margin-top: 0.55rem;
  font-size: 1.85rem;
  font-weight: 800;
  color: #11284d;
}

.breakdown-card-diamond {
  background: linear-gradient(180deg, rgba(242, 247, 255, 0.96), rgba(255, 255, 255, 0.95));
}

.breakdown-card-gold {
  background: linear-gradient(180deg, rgba(255, 249, 233, 0.96), rgba(255, 255, 255, 0.95));
}

.breakdown-card-teal {
  background: linear-gradient(180deg, rgba(235, 249, 248, 0.96), rgba(255, 255, 255, 0.95));
}

.breakdown-card-coin {
  background: linear-gradient(180deg, rgba(255, 245, 231, 0.96), rgba(255, 255, 255, 0.95));
}

.ledger-tabs {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.ledger-tab-active {
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  border-color: transparent;
  color: #ffffff;
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.ledger-item,
.aside-action {
  display: flex;
  align-items: flex-start;
  gap: 0.95rem;
  padding: 1rem;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, rgba(246, 249, 255, 0.96), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(16, 45, 84, 0.06);
}

.ledger-icon,
.aside-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  color: #ffffff;
  font-weight: 800;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.ledger-title,
.aside-action-title {
  font-weight: 800;
  color: #122b50;
}

.ledger-amount {
  font-weight: 800;
}

.ledger-amount.is-positive {
  color: #16945f;
}

.ledger-amount.is-negative {
  color: #c13b3b;
}

.ledger-row-meta {
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  color: #66768d;
  font-size: 0.88rem;
}

.wallet-aside-card-note {
  background: linear-gradient(180deg, rgba(14, 39, 76, 0.96), rgba(34, 82, 145, 0.92));
}

.wallet-aside-card-note .section-kicker,
.wallet-aside-card-note .section-title,
.wallet-aside-card-note .wallet-note-list li {
  color: #ffffff;
}

.wallet-note-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: rgba(239, 244, 251, 0.9);
  padding-left: 1rem;
}

.wallet-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(5, 10, 18, 0.54);
  backdrop-filter: blur(8px);
}

.wallet-modal {
  width: min(100%, 26rem);
  padding: 1.4rem;
  background: rgba(255, 255, 255, 0.98);
}

.wallet-modal-title {
  margin-top: 0.35rem;
  font-size: 1.55rem;
  font-weight: 800;
  color: #11284d;
}

.wallet-modal-copy {
  margin-top: 0.65rem;
  color: #5c6d86;
}

.wallet-modal-label {
  display: block;
  margin-top: 1rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #122b50;
}

.wallet-modal-input {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(16, 45, 84, 0.08);
  background: #f8fbff;
  color: #11284d;
  outline: none;
}

.wallet-modal-hint {
  margin-top: 0.7rem;
  color: #66768d;
}

.wallet-modal-error {
  margin-top: 0.45rem;
  color: #b33939;
  font-size: 0.88rem;
}

.wallet-modal-actions {
  margin-top: 1rem;
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .wallet-hero {
    grid-template-columns: minmax(0, 1.3fr) minmax(20rem, 0.85fr);
    align-items: stretch;
  }

  .breakdown-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .wallet-grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(21rem, 0.72fr);
    align-items: flex-start;
  }
}
</style>
