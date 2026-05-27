<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { APP_DOWNLOAD_URL } from '@/config'
import { withdrawApi } from '@/services/api'
import { Analytics } from '@/services/analytics'
import { useUserStore } from '@/stores/user'
import type { WithdrawRecord } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const records = ref<WithdrawRecord[]>([])
const historyLoading = ref(false)

const coinBalance = computed(() => Number(userStore.displayCoinBalance || 0))
const coinCashPreview = computed(() => Math.max(0, coinBalance.value / 10000))
const commissionCashPreview = computed(() => Math.max(0, Number(userStore.displayCommissionBalance || 0) / 10))
const cashPreview = computed(() => Math.max(coinCashPreview.value, commissionCashPreview.value))
const appReadyAmount = computed(() => Math.floor(cashPreview.value))

const payoutStats = computed(() => [
  {
    label: 'Web coins',
    value: formatNumber(coinBalance.value),
    note: 'Kept on this device for guests, or in the account after login.',
  },
  {
    label: 'Cash preview',
    value: formatCash(cashPreview.value),
    note: 'Final eligibility, PayPal details, and review happen in the app.',
  },
  {
    label: 'Payout status',
    value: 'App only',
    note: 'The web page should hand users to Google Play instead of collecting forms.',
  },
])

const cashoutSteps = [
  {
    title: 'Read on web',
    note: 'Free chapters and web reward tasks keep the user engaged before install.',
  },
  {
    title: 'Install ReadWin',
    note: 'The Android app carries rewarded videos, PayPal binding, and account-level checks.',
  },
  {
    title: 'Cash out in app',
    note: 'Users submit the actual payout request after opening the app wallet.',
  },
]

onMounted(() => {
  void loadHistory()
})

async function loadHistory() {
  if (!userStore.isLoggedIn) {
    records.value = []
    return
  }

  historyLoading.value = true
  try {
    const data = await withdrawApi.history(1, 20)
    records.value = data.items || []
  } catch {
    records.value = []
  } finally {
    historyLoading.value = false
  }
}

function openAppDownload(source: string) {
  Analytics.walletAction('download_app_for_cashout', {
    source,
    coin_balance: coinBalance.value,
    cash_preview: cashPreview.value,
  })
  window.open(APP_DOWNLOAD_URL, '_blank', 'noopener')
}

function statusMeta(status: string) {
  if (status === 'paid') return { label: 'Paid', className: 'status-chip status-chip-success' }
  if (status === 'rejected') return { label: 'Needs attention', className: 'status-chip status-chip-danger' }
  return { label: 'Pending', className: 'status-chip status-chip-warning' }
}

function formatNumber(value: number | string) {
  return Number(value || 0).toLocaleString()
}

function formatCash(value: number | string) {
  return `$${Number(value || 0).toFixed(2)}`
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
  <main class="withdraw-page">
    <section class="withdraw-hero">
      <div class="withdraw-copy">
        <p class="section-kicker">Cashout</p>
        <h1>Withdrawals now open from the Android app.</h1>
        <p>
          The web side can keep users reading and earning coins. When they tap cashout, the product should move them to ReadWin on Google Play for PayPal binding, payout rules, and final review.
        </p>

        <div class="withdraw-actions">
          <button type="button" class="primary-action" @click="openAppDownload('hero')">
            Download app to cash out
          </button>
          <button type="button" class="secondary-action" @click="router.push('/reward')">
            Keep earning coins
          </button>
          <button type="button" class="secondary-action" @click="router.push('/wallet')">
            View wallet
          </button>
        </div>
      </div>

      <aside class="cashout-card">
        <span class="cashout-label">App-ready balance</span>
        <strong>{{ formatCash(cashPreview) }}</strong>
        <p>
          {{ appReadyAmount > 0 ? `About ${formatCash(appReadyAmount)} can be reviewed in app.` : 'Build more coins on web before payout review.' }}
        </p>
        <div class="cashout-balance-row">
          <div>
            <span>Coins</span>
            <b>{{ formatNumber(coinBalance) }}</b>
          </div>
          <div>
            <span>Preview rate</span>
            <b>10,000:1</b>
          </div>
        </div>
        <button type="button" @click="openAppDownload('cashout_card')">Open Google Play</button>
      </aside>
    </section>

    <section class="stat-grid">
      <article v-for="stat in payoutStats" :key="stat.label" class="stat-card">
        <span>{{ stat.label }}</span>
        <strong>{{ stat.value }}</strong>
        <p>{{ stat.note }}</p>
      </article>
    </section>

    <section class="withdraw-section app-flow">
      <div>
        <p class="section-kicker">Payout handoff</p>
        <h2>One clear path from web reader to app cashout</h2>
        <p>
          This keeps the browser experience simple: read, earn, build trust. The moment a user wants money out, the CTA goes to the install surface instead of showing a web withdrawal form.
        </p>
      </div>

      <div class="step-list">
        <article v-for="(step, index) in cashoutSteps" :key="step.title" class="step-card">
          <span>{{ index + 1 }}</span>
          <div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.note }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="withdraw-section app-banner">
      <div>
        <p class="section-kicker">Download gate</p>
        <h2>PayPal, rewarded video, and withdrawal records are in the app.</h2>
        <p>
          Users can continue reading on web, but cashout should always send them to the Android app.
        </p>
      </div>
      <button type="button" @click="openAppDownload('app_banner')">Get ReadWin on Google Play</button>
    </section>

    <section class="withdraw-section history-section">
      <div class="section-head">
        <div>
          <p class="section-kicker">History</p>
          <h2>Previous app payout records</h2>
        </div>
        <button type="button" class="secondary-action dark-text" @click="loadHistory">Refresh</button>
      </div>

      <div v-if="historyLoading" class="empty-state">Loading payout records...</div>
      <div v-else-if="!records.length" class="empty-state">
        No payout records are available on web yet. Install the app when you are ready to submit one.
      </div>
      <div v-else class="history-list">
        <article v-for="record in records" :key="record.id" class="history-card">
          <div>
            <strong>{{ formatNumber(record.amount) }} diamonds to {{ formatCash(record.cash_amount) }}</strong>
            <span>{{ formatDate(record.created_at) }} · {{ record.method || 'PayPal' }}</span>
          </div>
          <span :class="statusMeta(record.status).className">{{ statusMeta(record.status).label }}</span>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.withdraw-page {
  min-height: 100vh;
  padding: 20px 16px 92px;
  background:
    linear-gradient(180deg, #f8fafc 0, #fff7ed 300px, #fff 100%);
  color: #111827;
}

.withdraw-hero,
.stat-grid,
.withdraw-section {
  max-width: 1180px;
  margin: 0 auto;
}

.withdraw-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
  gap: 16px;
}

.withdraw-copy,
.cashout-card,
.stat-card,
.withdraw-section {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  box-shadow: 0 22px 46px -38px rgba(15, 23, 42, 0.44);
}

.withdraw-copy {
  padding: clamp(24px, 4vw, 52px);
  color: #fff;
  background:
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(88, 28, 135, 0.88)),
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

.withdraw-copy .section-kicker,
.app-flow .section-kicker,
.app-banner .section-kicker {
  color: #fbbf24;
}

.withdraw-copy h1 {
  max-width: 720px;
  margin: 0;
  font-size: clamp(40px, 7vw, 76px);
  line-height: 0.94;
  font-weight: 950;
}

.withdraw-copy p,
.app-flow p,
.app-banner p {
  max-width: 660px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.74);
  font-size: 17px;
  line-height: 1.7;
}

.withdraw-actions,
.cashout-balance-row,
.stat-grid,
.section-head,
.history-card {
  display: flex;
  align-items: center;
}

.withdraw-actions {
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.primary-action,
.secondary-action,
.cashout-card button,
.app-banner button {
  min-height: 44px;
  border-radius: 8px;
  padding: 0 18px;
  font-weight: 850;
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.primary-action {
  border: 0;
  color: #111827;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
}

.secondary-action {
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.dark-text {
  color: #111827;
  border-color: rgba(15, 23, 42, 0.12);
  background: #fff;
}

.primary-action:hover,
.secondary-action:hover,
.cashout-card button:hover,
.app-banner button:hover {
  transform: translateY(-1px);
}

.cashout-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
  background: #fff;
}

.cashout-label,
.cashout-balance-row span,
.stat-card span,
.stat-card p,
.step-card p,
.history-card span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.cashout-card > strong {
  font-size: clamp(44px, 8vw, 72px);
  line-height: 1;
  font-weight: 950;
}

.cashout-card > p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.cashout-balance-row {
  gap: 10px;
}

.cashout-balance-row div {
  flex: 1;
  min-width: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.cashout-balance-row b {
  display: block;
  margin-top: 4px;
  font-size: 20px;
}

.cashout-card button,
.app-banner button {
  border: 0;
  color: #fff;
  background: #111827;
}

.stat-grid {
  gap: 12px;
  margin-top: 16px;
}

.stat-card {
  flex: 1;
  min-height: 160px;
  padding: 16px;
  background: #fff;
}

.stat-card strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  font-weight: 950;
}

.stat-card p {
  margin: 10px 0 0;
  line-height: 1.55;
}

.withdraw-section {
  margin-top: 16px;
  padding: 20px;
  background: #fff;
}

.withdraw-section h2 {
  margin: 0;
  font-size: clamp(24px, 4vw, 38px);
  line-height: 1.05;
  font-weight: 950;
}

.app-flow,
.app-banner {
  color: #fff;
  background: #111827;
}

.app-flow {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(300px, 1.1fr);
  gap: 16px;
}

.step-list {
  display: grid;
  gap: 10px;
}

.step-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}

.step-card > span {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: #111827;
  background: #fbbf24;
  font-weight: 950;
}

.step-card h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 900;
}

.step-card p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.55;
}

.app-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background:
    linear-gradient(135deg, #111827, #581c87),
    #111827;
}

.app-banner p {
  margin-top: 10px;
}

.app-banner button {
  flex: 0 0 auto;
  background: #fff;
  color: #111827;
}

.section-head {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.empty-state {
  min-height: 126px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
  text-align: center;
}

.history-list {
  display: grid;
  gap: 10px;
}

.history-card {
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: #fff;
}

.history-card strong {
  display: block;
  font-weight: 900;
}

.status-chip {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 900;
}

.status-chip-success {
  color: #166534;
  background: #dcfce7;
}

.status-chip-warning {
  color: #92400e;
  background: #fef3c7;
}

.status-chip-danger {
  color: #991b1b;
  background: #fee2e2;
}

@media (max-width: 860px) {
  .withdraw-page {
    padding: 12px 12px 96px;
  }

  .withdraw-hero,
  .app-flow {
    grid-template-columns: 1fr;
  }

  .stat-grid,
  .app-banner {
    align-items: stretch;
    flex-direction: column;
  }

  .withdraw-copy h1 {
    font-size: clamp(38px, 14vw, 58px);
  }
}
</style>
