<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LoginGate from '@/components/LoginGate.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import DiamondIcon from '@/components/DiamondIcon.vue'
import NativeWalletScreen from '@/components/app/NativeWalletScreen.vue'
import { useUserStore } from '@/stores/user'
import { coinApi, diamondApi } from '@/services/api'
import { isNativeApp } from '@/services/admob'

type CurrencyFilter = 'all' | 'coin' | 'diamond'
type DirectionFilter = 'all' | 'income' | 'expense'

interface LedgerEntry {
  id: string
  currency: 'coin' | 'diamond'
  title: string
  detail: string
  amount: number
  balanceAfter: number
  createdAt: string
  category: string
}

const userStore = useUserStore()
const nativeApp = isNativeApp()

const loading = ref(true)
const currencyFilter = ref<CurrencyFilter>('all')
const directionFilter = ref<DirectionFilter>('all')
const ledger = ref<LedgerEntry[]>([])

const filteredLedger = computed(() => {
  let items = ledger.value
  if (currencyFilter.value !== 'all') items = items.filter(item => item.currency === currencyFilter.value)
  if (directionFilter.value === 'income') items = items.filter(item => item.amount > 0)
  if (directionFilter.value === 'expense') items = items.filter(item => item.amount < 0)
  return items
})

const incomeTotal = computed(() =>
  filteredLedger.value.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
)
const expenseTotal = computed(() =>
  Math.abs(filteredLedger.value.filter(item => item.amount < 0).reduce((sum, item) => sum + item.amount, 0)),
)
const recentActivityCount = computed(() =>
  filteredLedger.value.filter(item => Date.now() - new Date(item.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length,
)

const guideCards = [
  {
    title: 'Coins move fast',
    body: 'Coins come from reading time, check-ins, rewarded ads, and other reader tasks. Every chapter stays free.',
  },
  {
    title: 'Diamonds hold value',
    body: 'Reward diamonds track higher-value activity. Commission diamonds are the part that can move into withdrawal when the threshold is met.',
  },
  {
    title: 'One ledger, two balances',
    body: 'This page now combines real coin logs and real diamond logs so the money side of the product finally feels coherent.',
  },
]

onMounted(async () => {
  await loadLedger()
})

async function loadLedger() {
  loading.value = true
  try {
    const [coinLogs, diamondLogs] = await Promise.all([
      coinApi.logs(1, 100),
      diamondApi.logs(1, 100),
    ])

    const normalizedCoins = (coinLogs.items || []).map((item: any) => ({
      id: `coin-${item.id}`,
      currency: 'coin' as const,
      title: coinTitle(item.type),
      detail: item.description || 'Coin wallet activity.',
      amount: item.amount,
      balanceAfter: item.balance_after,
      createdAt: item.created_at,
      category: humanize(item.type),
    }))

    const normalizedDiamonds = (diamondLogs.items || []).map((item: any) => ({
      id: `diamond-${item.id}`,
      currency: 'diamond' as const,
      title: diamondTitle(item),
      detail: item.note || sourceLabel(item.source),
      amount: item.amount,
      balanceAfter: item.balance_after,
      createdAt: item.created_at,
      category: humanize(item.type),
    }))

    ledger.value = [...normalizedCoins, ...normalizedDiamonds].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
  } finally {
    loading.value = false
  }
}

function coinTitle(type: string): string {
  if (type === 'daily_checkin') return 'Daily check-in'
  if (type === 'ad_reward') return 'Rewarded ad'
  if (type === 'chapter_unlock') return 'Free chapter progress'
  if (type === 'task_reward') return 'Reader task reward'
  return humanize(type)
}

function diamondTitle(item: any): string {
  if (item.type === 'commission') return 'Commission credit'
  if (item.type === 'reward') return 'Reward diamond'
  if (item.type === 'paid') return 'Bonus diamond'
  if (item.type === 'withdrawal') return 'Withdrawal movement'
  if (item.action) return humanize(item.action)
  return humanize(item.type)
}

function sourceLabel(value?: string | null): string {
  if (!value) return 'Wallet activity.'
  return `${humanize(value)} flow.`
}

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function formatAmount(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}`
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
  <NativeWalletScreen v-if="nativeApp" />

  <main v-else class="ledger-page pb-24">
    <LoginGate message="Log in to review your real coin and diamond history in one place.">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="ledger-hero">
          <div class="ledger-hero-copy">
            <p class="section-kicker">Unified ledger</p>
            <h1 class="hero-title">Your wallet history finally reads like one clean story.</h1>
            <p class="hero-summary">
              We now merge real coin logs and real diamond logs into a single account timeline, so you can understand income, spend, and reward balance movement without hopping between screens.
            </p>
          </div>

          <div class="ledger-summary-card">
            <div class="balance-row">
              <span class="balance-label">Diamond balance</span>
              <strong class="balance-value balance-value-blue">
                <DiamondIcon size="20px" />
                {{ formatNumber(userStore.totalDiamond) }}
              </strong>
            </div>
            <div class="balance-row">
              <span class="balance-label">Coin balance</span>
              <strong class="balance-value balance-value-gold">
                <CoinIcon size="16px" />
                {{ formatNumber(userStore.user?.coin_balance || 0) }}
              </strong>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-metrics">
              <div>
                <span>Filtered income</span>
                <strong>+{{ formatNumber(incomeTotal) }}</strong>
              </div>
              <div>
                <span>Filtered spend</span>
                <strong>-{{ formatNumber(expenseTotal) }}</strong>
              </div>
              <div>
                <span>Last 7 days</span>
                <strong>{{ recentActivityCount }} events</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="guide-grid">
          <div v-for="card in guideCards" :key="card.title" class="guide-card">
            <p class="section-kicker">Guide</p>
            <h2>{{ card.title }}</h2>
            <p>{{ card.body }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="ledger-shell">
          <div class="section-head">
            <div>
              <p class="section-kicker">Filters</p>
              <h2 class="section-title">Slice the ledger by balance and direction</h2>
            </div>
            <button class="ghost-action" @click="loadLedger">Refresh ledger</button>
          </div>

          <div class="filter-stack">
            <div class="filter-row">
              <button
                v-for="filter in (['all', 'diamond', 'coin'] as const)"
                :key="filter"
                class="filter-chip"
                :class="{ 'filter-chip-active': currencyFilter === filter }"
                @click="currencyFilter = filter"
              >
                {{ filter === 'all' ? 'All balances' : filter === 'diamond' ? 'Diamonds' : 'Coins' }}
              </button>
            </div>

            <div class="filter-row">
              <button
                v-for="filter in (['all', 'income', 'expense'] as const)"
                :key="filter"
                class="filter-chip filter-chip-soft"
                :class="{ 'filter-chip-active': directionFilter === filter }"
                @click="directionFilter = filter"
              >
                {{ filter === 'all' ? 'All movement' : filter === 'income' ? 'Income only' : 'Expense only' }}
              </button>
            </div>
          </div>

          <div v-if="loading" class="panel-loading">
            <span class="spinner"></span>
            <p>Loading wallet history...</p>
          </div>

          <div v-else-if="!filteredLedger.length" class="empty-shell">
            <span class="empty-icon">LG</span>
            <h3>No matching ledger entries</h3>
            <p>Try a wider filter or come back after your next coin or diamond activity.</p>
          </div>

          <div v-else class="ledger-list">
            <article v-for="entry in filteredLedger" :key="entry.id" class="ledger-card">
              <div class="ledger-icon" :class="entry.currency === 'diamond' ? 'ledger-icon-diamond' : 'ledger-icon-coin'">
                <DiamondIcon v-if="entry.currency === 'diamond'" size="18px" />
                <CoinIcon v-else size="14px" />
              </div>

              <div class="ledger-copy">
                <div class="ledger-head">
                  <div>
                    <p class="ledger-title">{{ entry.title }}</p>
                    <p class="ledger-detail">{{ entry.detail }}</p>
                  </div>
                  <div class="ledger-amount-wrap">
                    <span class="ledger-amount" :class="entry.amount > 0 ? 'ledger-amount-income' : 'ledger-amount-expense'">
                      {{ formatAmount(entry.amount) }}
                    </span>
                    <span class="ledger-category">{{ entry.category }}</span>
                  </div>
                </div>

                <div class="ledger-meta">
                  <span>{{ formatDate(entry.createdAt) }}</span>
                  <span>Balance after {{ formatNumber(entry.balanceAfter) }}</span>
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
.ledger-page {
  background:
    radial-gradient(circle at top left, rgba(46, 123, 216, 0.14), transparent 22%),
    radial-gradient(circle at top right, rgba(212, 169, 45, 0.16), transparent 20%),
    linear-gradient(180deg, #f6f3ed 0%, #f4f8fe 34%, #fbfcff 100%);
}

.ledger-hero,
.ledger-summary-card,
.guide-card,
.ledger-shell,
.ledger-card {
  border-radius: 1.7rem;
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.ledger-hero,
.guide-grid {
  display: grid;
  gap: 1.5rem;
}

.ledger-hero {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
}

.ledger-hero-copy,
.ledger-summary-card,
.guide-card,
.ledger-shell {
  padding: clamp(1.4rem, 2vw, 2rem);
}

.ledger-hero-copy {
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

.ledger-hero-copy .section-kicker {
  color: rgba(219, 234, 255, 0.76);
}

.hero-title {
  margin: 0;
  font-size: clamp(2.3rem, 4.3vw, 3.9rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
  font-weight: 700;
  max-width: 10ch;
}

.hero-summary {
  margin-top: 1rem;
  max-width: 58ch;
  color: rgba(235, 244, 255, 0.86);
  line-height: 1.7;
}

.ledger-summary-card,
.guide-card,
.ledger-shell {
  background: rgba(255, 255, 255, 0.88);
}

.balance-row,
.summary-metrics,
.section-head,
.filter-row,
.ledger-head,
.ledger-meta {
  display: flex;
  gap: 1rem;
}

.balance-row,
.section-head,
.ledger-head,
.ledger-meta {
  align-items: center;
  justify-content: space-between;
}

.balance-row + .balance-row {
  margin-top: 1rem;
}

.balance-label,
.guide-card p,
.ledger-detail,
.ledger-meta,
.panel-loading p,
.empty-shell p {
  color: #5d6f85;
}

.balance-value {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.3rem;
  font-weight: 700;
}

.balance-value-blue {
  color: #0f3f6d;
}

.balance-value-gold {
  color: #9a6700;
}

.summary-divider {
  height: 1px;
  margin: 1.2rem 0;
  background: rgba(15, 63, 109, 0.1);
}

.summary-metrics {
  flex-direction: column;
}

.summary-metrics span,
.ledger-category {
  color: #61768e;
  font-size: 0.85rem;
}

.summary-metrics strong {
  margin-top: 0.25rem;
  display: block;
  color: #113352;
  font-size: 1.05rem;
}

.guide-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.guide-card h2,
.section-title,
.ledger-title {
  margin: 0;
  color: #12304f;
}

.guide-card h2 {
  font-size: 1.1rem;
}

.guide-card p:last-child {
  margin-top: 0.85rem;
  line-height: 1.7;
}

.section-title {
  font-size: clamp(1.4rem, 2.2vw, 1.9rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.ghost-action,
.filter-chip {
  transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease, color 140ms ease, border-color 140ms ease;
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

.filter-stack {
  display: grid;
  gap: 0.85rem;
}

.filter-row {
  flex-wrap: wrap;
}

.filter-chip {
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(15, 63, 109, 0.04);
  border-radius: 999px;
  padding: 0.72rem 1rem;
  color: #19456b;
  font-weight: 600;
}

.filter-chip-soft {
  background: rgba(154, 103, 0, 0.04);
  border-color: rgba(154, 103, 0, 0.12);
  color: #795a13;
}

.filter-chip-active {
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  border-color: transparent;
  color: #fefefe;
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

.ledger-list {
  display: grid;
  gap: 1rem;
  margin-top: 1.4rem;
}

.ledger-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  padding: 1.1rem;
  background: rgba(247, 250, 254, 0.92);
}

.ledger-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ledger-icon-diamond {
  background: rgba(15, 63, 109, 0.1);
}

.ledger-icon-coin {
  background: rgba(212, 169, 45, 0.15);
}

.ledger-copy {
  min-width: 0;
}

.ledger-title {
  font-size: 1.02rem;
  font-weight: 700;
}

.ledger-detail {
  margin-top: 0.35rem;
  line-height: 1.6;
}

.ledger-amount-wrap {
  text-align: right;
}

.ledger-amount {
  display: block;
  font-size: 1.04rem;
  font-weight: 700;
}

.ledger-amount-income {
  color: #0f766e;
}

.ledger-amount-expense {
  color: #be123c;
}

.ledger-meta {
  margin-top: 0.85rem;
  flex-wrap: wrap;
  color: #70859b;
  font-size: 0.9rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .ledger-hero,
  .guide-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .ledger-hero-copy,
  .ledger-summary-card,
  .guide-card,
  .ledger-shell {
    padding: 1.2rem;
  }

  .hero-title {
    max-width: none;
  }

  .section-head,
  .ledger-head {
    flex-direction: column;
    align-items: stretch;
  }

  .ledger-amount-wrap {
    text-align: left;
  }
}
</style>
