<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginGate from '@/components/LoginGate.vue'
import DiamondIcon from '@/components/DiamondIcon.vue'
import { isNativeApp } from '@/services/admob'
import { Analytics } from '@/services/analytics'
import { useToastStore } from '@/stores/toast'
import { useUserStore } from '@/stores/user'
import { withdrawApi } from '@/services/api'
import type { WithdrawRecord } from '@/types'

interface WithdrawRules {
  min_amount: number
  exchange_rate: string
  method: string
  max_monthly: number
  commission_balance: number
}

const router = useRouter()
const toastStore = useToastStore()
const userStore = useUserStore()
const nativeApp = isNativeApp()

const loading = ref(true)
const historyLoading = ref(false)
const submitting = ref(false)
const amount = ref(50)
const nativeCashoutAmount = ref('')
const paypalAccount = ref('')
const records = ref<WithdrawRecord[]>([])
const rules = ref<WithdrawRules>({
  min_amount: 50,
  exchange_rate: '10 diamonds = \u00a51',
  method: 'PayPal',
  max_monthly: 3,
  commission_balance: 0,
})

const withdrawableBalance = computed(() => userStore.user?.commission_diamond ?? rules.value.commission_balance ?? 0)
const nativeEstimatedCoinCash = computed(() => Math.floor((userStore.displayCoinBalance || 0) / 10000))
const nativeCashBalance = computed(() => Math.max(Math.floor((userStore.displayCommissionBalance || 0) / 10), nativeEstimatedCoinCash.value))
const nativeCashoutValue = computed(() => Number(nativeCashoutAmount.value || 0))
const amountPresets = computed(() => {
  const baseline = [rules.value.min_amount, 100, 200, 500]
  return [...new Set(baseline.filter(value => value > 0))]
})
const currentMonthAttempts = computed(() =>
  records.value.filter(record => {
    const date = new Date(record.created_at)
    const now = new Date()
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }).length,
)
const remainingAttempts = computed(() => Math.max(rules.value.max_monthly - currentMonthAttempts.value, 0))
const pendingCount = computed(() => records.value.filter(record => record.status === 'pending').length)
const paidCashTotal = computed(() =>
  records.value
    .filter(record => record.status === 'paid')
    .reduce((sum, record) => sum + Number(record.cash_amount || 0), 0),
)
const cashPreview = computed(() => Math.max(amount.value, 0) / 10)
const validationMessage = computed(() => {
  if (!paypalAccount.value.trim()) return 'Add the PayPal email that should receive the payout.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalAccount.value.trim())) return 'Use a valid PayPal email address.'
  if (withdrawableBalance.value < rules.value.min_amount) {
    return `You need at least ${rules.value.min_amount} commission diamonds before you can withdraw.`
  }
  if (amount.value < rules.value.min_amount) return `Minimum withdrawal is ${rules.value.min_amount} diamonds.`
  if (amount.value > withdrawableBalance.value) return 'Withdrawal amount is higher than your commission balance.'
  if (remainingAttempts.value <= 0) return `You have already used the ${rules.value.max_monthly} monthly withdrawal slots.`
  return ''
})
const canSubmit = computed(() => !validationMessage.value && !submitting.value)

const payoutMoments = computed(() => [
  {
    label: 'Withdrawable now',
    value: `${formatNumber(withdrawableBalance.value)} diamonds`,
    note: 'Only commission diamonds can enter payout.',
  },
  {
    label: 'This month',
    value: `${currentMonthAttempts.value}/${rules.value.max_monthly}`,
    note: `${remainingAttempts.value} withdrawal slot${remainingAttempts.value === 1 ? '' : 's'} remaining.`,
  },
  {
    label: 'Paid out so far',
    value: formatCash(paidCashTotal.value),
    note: pendingCount.value ? `${pendingCount.value} request${pendingCount.value === 1 ? '' : 's'} still pending review.` : 'No pending payout right now.',
  },
])

onMounted(async () => {
  if (nativeApp) {
    loading.value = false
    if (!paypalAccount.value && userStore.user?.email) {
      paypalAccount.value = userStore.user.email
    }
    return
  }

  await refreshPage()
  if (!paypalAccount.value && userStore.user?.email) {
    paypalAccount.value = userStore.user.email
  }
})

async function refreshPage() {
  loading.value = true
  try {
    await Promise.all([loadRules(), loadHistory()])
  } finally {
    loading.value = false
  }
}

async function loadRules() {
  const data = await withdrawApi.rules()
  rules.value = data
  if (amount.value < data.min_amount) {
    amount.value = data.min_amount
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const data = await withdrawApi.history()
    records.value = data.items || []
  } finally {
    historyLoading.value = false
  }
}

async function submitWithdrawal() {
  Analytics.walletAction('withdraw_submit_attempt', {
    amount: amount.value,
    cash_preview: cashPreview.value,
    withdrawable_balance: withdrawableBalance.value,
    screen_name: 'withdraw',
    is_native: false,
  })
  if (!canSubmit.value) {
    Analytics.walletAction('withdraw_submit_blocked', {
      amount: amount.value,
      fail_reason: validationMessage.value || 'form_incomplete',
      screen_name: 'withdraw',
      is_native: false,
    })
    toastStore.show(validationMessage.value || 'Please complete the form first.', 'warning')
    return
  }

  submitting.value = true
  try {
    await withdrawApi.apply(amount.value, paypalAccount.value.trim())
    toastStore.show('Withdrawal submitted. We will review the request and update your history shortly.', 'success')
    Analytics.walletAction('withdraw_submit_success', {
      amount: amount.value,
      cash_preview: cashPreview.value,
      screen_name: 'withdraw',
      is_native: false,
    })
    await userStore.fetchMe()
    await Promise.all([loadRules(), loadHistory()])
    amount.value = Math.max(rules.value.min_amount, Math.min(withdrawableBalance.value, rules.value.min_amount))
  } catch (error: any) {
    toastStore.show(error.message || 'Unable to submit withdrawal right now.', 'error')
    Analytics.walletAction('withdraw_submit_failed', {
      amount: amount.value,
      fail_reason: error.message || 'withdraw_failed',
      screen_name: 'withdraw',
      is_native: false,
    })
  } finally {
    submitting.value = false
  }
}

async function submitNativeCashout() {
  Analytics.walletAction('cashout_submit_attempt', {
    amount: nativeCashoutValue.value,
    cash_balance: nativeCashBalance.value,
    screen_name: 'native_cashout',
    is_native: true,
  })
  if (!Number.isInteger(nativeCashoutValue.value) || nativeCashoutValue.value <= 0) {
    Analytics.walletAction('cashout_submit_blocked', {
      fail_reason: 'invalid_amount',
      screen_name: 'native_cashout',
      is_native: true,
    })
    toastStore.show('Please enter an integer cashout amount.', 'warning')
    return
  }
  if (!userStore.isLoggedIn) {
    Analytics.walletAction('cashout_submit_blocked', {
      fail_reason: 'guest_account',
      screen_name: 'native_cashout',
      is_native: true,
    })
    toastStore.show('Guest balance is visible. Bind an account before PayPal cashout.', 'info')
    router.push('/login')
    return
  }
  if (nativeCashoutValue.value > nativeCashBalance.value) {
    Analytics.walletAction('cashout_submit_blocked', {
      fail_reason: 'amount_over_balance',
      screen_name: 'native_cashout',
      is_native: true,
    })
    toastStore.show('Cashout amount is higher than your available balance.', 'warning')
    return
  }
  if (!paypalAccount.value.trim() && userStore.user?.email) {
    paypalAccount.value = userStore.user.email
  }
  if (!paypalAccount.value.trim()) {
    Analytics.walletAction('cashout_submit_blocked', {
      fail_reason: 'missing_account',
      screen_name: 'native_cashout',
      is_native: true,
    })
    toastStore.show('Add an account email before cashout.', 'warning')
    return
  }

  submitting.value = true
  try {
    await withdrawApi.apply(nativeCashoutValue.value * 10, paypalAccount.value.trim())
    toastStore.show('Cashout request submitted.', 'success')
    Analytics.walletAction('cashout_submit_success', {
      amount: nativeCashoutValue.value,
      cash_balance: nativeCashBalance.value,
      screen_name: 'native_cashout',
      is_native: true,
    })
    nativeCashoutAmount.value = ''
    await userStore.fetchMe()
  } catch (error: any) {
    toastStore.show(error.message || 'Unable to submit cashout right now.', 'error')
    Analytics.walletAction('cashout_submit_failed', {
      amount: nativeCashoutValue.value,
      fail_reason: error.message || 'cashout_failed',
      screen_name: 'native_cashout',
      is_native: true,
    })
  } finally {
    submitting.value = false
  }
}

function setAmount(value: number) {
  amount.value = value
  Analytics.walletAction('withdraw_amount_selected', {
    amount: value,
    screen_name: 'withdraw',
  })
}

function statusMeta(status: string) {
  if (status === 'paid') {
    return {
      label: 'Paid',
      className: 'status-chip status-chip-success',
    }
  }
  if (status === 'rejected') {
    return {
      label: 'Needs attention',
      className: 'status-chip status-chip-danger',
    }
  }
  return {
    label: 'Pending',
    className: 'status-chip status-chip-warning',
  }
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString()
}

function formatCash(value: number | string): string {
  return `\u00a5${Number(value || 0).toFixed(2)}`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <main v-if="nativeApp" class="native-cashout-page">
    <header class="native-cashout-header">
      <button type="button" class="native-cashout-back" aria-label="Go back" @click="router.back()">‹</button>
      <h1>Cashout</h1>
      <span></span>
    </header>

    <section class="native-paypal-card" aria-label="PayPal">
      <div class="native-paypal-brand-mark">P</div>
      <div class="native-paypal-brand-word">
        <span>Pay</span><strong>Pal</strong>
      </div>
    </section>

    <section class="native-cashout-form">
      <p class="native-cashout-label">Balance:</p>
      <strong class="native-cashout-balance">${{ formatNumber(nativeCashBalance) }}</strong>

      <label class="native-cashout-field">
        <span>Enter Cash out Amount</span>
        <div class="native-cashout-input-row">
          <b>$</b>
          <input
            v-model="nativeCashoutAmount"
            type="number"
            inputmode="numeric"
            min="1"
            step="1"
            placeholder="Please enter an integer (no decimals)"
          >
        </div>
      </label>

      <p class="native-cashout-help">
        To ensure your cashout is processed smoothly, please enter the amount in this format: 5 (meaning $5). Coins convert toward cash after each refresh; PayPal requests require a signed-in account.
      </p>
    </section>

    <button class="native-cashout-submit" type="button" :disabled="submitting" @click="submitNativeCashout">
      {{ submitting ? 'Submitting...' : 'Cashout' }}
    </button>
  </main>

  <main v-else class="withdraw-page pb-24">
    <LoginGate message="Log in to manage commission payouts and track your withdrawal history.">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="withdraw-hero">
          <div class="withdraw-hero-copy">
            <p class="section-kicker">Commission payout</p>
            <h1 class="hero-title">Move referral earnings into a clean cash-out flow.</h1>
            <p class="hero-summary">
              This page is now aligned to the real withdrawal rules: only commission diamonds are eligible, PayPal is the payout method, and each account gets a limited number of monthly requests.
            </p>

            <div class="hero-chip-row">
              <span class="hero-chip">PayPal payout</span>
              <span class="hero-chip">{{ rules.exchange_rate }}</span>
              <span class="hero-chip">{{ rules.max_monthly }} requests / month</span>
            </div>
          </div>

          <div class="hero-spotlight">
            <div class="spotlight-card">
              <p class="spotlight-label">Commission balance</p>
              <div class="spotlight-value-row">
                <DiamondIcon size="26px" />
                <span>{{ formatNumber(withdrawableBalance) }}</span>
              </div>
              <p class="spotlight-copy">
                Withdrawable balance only tracks commission diamonds. Reward and paid diamonds stay in your reading wallet.
              </p>

              <div class="spotlight-grid">
                <div class="spotlight-stat">
                  <span>Minimum</span>
                  <strong>{{ formatNumber(rules.min_amount) }} 💎</strong>
                </div>
                <div class="spotlight-stat">
                  <span>Preview</span>
                  <strong>{{ formatCash(cashPreview) }}</strong>
                </div>
              </div>

              <button class="spotlight-cta" @click="router.push('/wallet')">Back to wallet</button>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="moment-grid">
          <div v-for="moment in payoutMoments" :key="moment.label" class="moment-card">
            <p class="section-kicker">Payout snapshot</p>
            <h2>{{ moment.label }}</h2>
            <p class="moment-value">{{ moment.value }}</p>
            <p class="moment-note">{{ moment.note }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="withdraw-grid">
          <div class="panel-card">
            <div class="section-head">
              <div>
                <p class="section-kicker">Request payout</p>
                <h2 class="section-title">Submit your next withdrawal</h2>
              </div>
            </div>

            <div v-if="loading" class="panel-loading">
              <span class="spinner"></span>
              <p>Loading payout rules...</p>
            </div>

            <template v-else>
              <div class="amount-chip-row">
                <button
                  v-for="preset in amountPresets"
                  :key="preset"
                  class="amount-chip"
                  :class="{ 'amount-chip-selected': amount === preset }"
                  @click="setAmount(preset)"
                >
                  {{ formatNumber(preset) }} 💎
                </button>
              </div>

              <label class="field-block">
                <span>Withdrawal amount</span>
                <input
                  v-model.number="amount"
                  type="number"
                  min="0"
                  inputmode="numeric"
                  class="field-input"
                  placeholder="Enter commission diamonds"
                >
              </label>

              <label class="field-block">
                <span>PayPal account</span>
                <input
                  v-model="paypalAccount"
                  type="email"
                  class="field-input"
                  placeholder="you@example.com"
                >
              </label>

              <div class="form-meta">
                <div>
                  <span>Estimated payout</span>
                  <strong>{{ formatCash(cashPreview) }}</strong>
                </div>
                <div>
                  <span>Processing lane</span>
                  <strong>{{ rules.method }}</strong>
                </div>
              </div>

              <p v-if="validationMessage" class="validation-copy">{{ validationMessage }}</p>
              <p v-else class="helper-copy">
                Requests land in history immediately and stay there while the payout team reviews them.
              </p>

              <button class="primary-cta" :disabled="!canSubmit" @click="submitWithdrawal">
                {{ submitting ? 'Submitting...' : 'Submit withdrawal request' }}
              </button>
            </template>
          </div>

          <div class="panel-card panel-card-dark">
            <div class="section-head">
              <div>
                <p class="section-kicker">Rules that matter</p>
                <h2 class="section-title">Keep the payout flow predictable</h2>
              </div>
            </div>

            <ul class="rule-list">
              <li>Only commission diamonds can be withdrawn. Paid and reward diamonds stay in your reading balance.</li>
              <li>Minimum request size is {{ formatNumber(rules.min_amount) }} diamonds.</li>
              <li>Each account can submit up to {{ rules.max_monthly }} requests per calendar month.</li>
              <li>Current payout method is {{ rules.method }} only, so the account email needs to be correct.</li>
            </ul>

            <div class="dark-divider"></div>

            <div class="history-mini">
              <div class="history-mini-row">
                <span>Pending review</span>
                <strong>{{ pendingCount }}</strong>
              </div>
              <div class="history-mini-row">
                <span>Successful payouts</span>
                <strong>{{ records.filter(record => record.status === 'paid').length }}</strong>
              </div>
              <div class="history-mini-row">
                <span>Rejected requests</span>
                <strong>{{ records.filter(record => record.status === 'rejected').length }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="section-head section-head-spread">
          <div>
            <p class="section-kicker">History</p>
            <h2 class="section-title">Track every payout request</h2>
          </div>
          <button class="ghost-action" @click="loadHistory">Refresh history</button>
        </div>

        <div class="history-shell">
          <div v-if="historyLoading" class="panel-loading">
            <span class="spinner"></span>
            <p>Loading withdrawal history...</p>
          </div>

          <div v-else-if="!records.length" class="empty-shell">
            <span class="empty-icon">WD</span>
            <h3>No withdrawal requests yet</h3>
            <p>Your first payout request will appear here as soon as you submit it.</p>
          </div>

          <div v-else class="history-list">
            <article v-for="record in records" :key="record.id" class="history-card">
              <div class="history-head">
                <div>
                  <p class="history-title">{{ formatNumber(record.amount) }} diamonds to {{ formatCash(record.cash_amount) }}</p>
                  <p class="history-meta">{{ formatDateTime(record.created_at) }} · {{ record.method }} · {{ record.account }}</p>
                </div>
                <span :class="statusMeta(record.status).className">{{ statusMeta(record.status).label }}</span>
              </div>

              <div class="history-grid">
                <div>
                  <span>Requested</span>
                  <strong>{{ formatDate(record.created_at) }}</strong>
                </div>
                <div>
                  <span>Processed</span>
                  <strong>{{ record.processed_at ? formatDate(record.processed_at) : 'Waiting for review' }}</strong>
                </div>
                <div>
                  <span>Payout cash</span>
                  <strong>{{ formatCash(record.cash_amount) }}</strong>
                </div>
              </div>

              <p v-if="record.reject_reason" class="reject-copy">
                {{ record.reject_reason }}
              </p>
            </article>
          </div>
        </div>
      </section>
    </LoginGate>
  </main>
</template>

<style scoped>
.native-cashout-page {
  position: relative;
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 10px calc(env(safe-area-inset-bottom, 0px) + 76px);
  overflow: hidden;
  color: #fff;
  background: #0b0b0c;
}

.native-cashout-header {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px;
  align-items: center;
  min-height: 42px;
}

.native-cashout-header h1 {
  margin: 0;
  text-align: center;
  font-size: 14px;
  font-weight: 900;
  color: #fff;
}

.native-cashout-back {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: rgba(36, 40, 56, 0.82);
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
}

.native-paypal-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  min-height: 128px;
  margin-top: 10px;
  border-radius: 8px;
  background: #effbff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.78);
}

.native-paypal-brand-mark {
  color: #003087;
  font-size: 86px;
  line-height: 0.85;
  font-weight: 900;
  font-style: italic;
}

.native-paypal-brand-word {
  display: inline-flex;
  align-items: center;
  color: #003087;
  font-size: 52px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0;
}

.native-paypal-brand-word strong {
  color: #009cde;
  font-weight: 900;
}

.native-cashout-form {
  margin-top: 30px;
}

.native-cashout-label,
.native-cashout-help {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 11px;
  line-height: 1.5;
  font-weight: 700;
}

.native-cashout-balance {
  display: block;
  margin-top: 16px;
  font-size: 27px;
  line-height: 1;
  font-weight: 900;
  color: #fff;
}

.native-cashout-field {
  display: grid;
  gap: 14px;
  margin-top: 30px;
}

.native-cashout-field > span {
  color: rgba(255, 255, 255, 0.94);
  font-size: 11px;
  line-height: 1.3;
  font-weight: 700;
}

.native-cashout-input-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 2px;
  min-height: 34px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.88);
}

.native-cashout-input-row b {
  color: #fff;
  font-size: 16px;
  font-weight: 900;
}

.native-cashout-input-row input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  color: #fff;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
}

.native-cashout-input-row input::placeholder {
  color: rgba(255, 255, 255, 0.48);
}

.native-cashout-help {
  margin-top: 28px;
}

.native-cashout-submit {
  position: fixed;
  right: 20px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  left: 20px;
  min-height: 30px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(90deg, #ff8a5b 0%, #ff4d93 47%, #e100c5 100%);
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 16px 34px rgba(255, 37, 148, 0.24);
}

.native-cashout-submit:disabled {
  opacity: 0.72;
}

.withdraw-page {
  background:
    radial-gradient(circle at top left, rgba(46, 123, 216, 0.14), transparent 24%),
    radial-gradient(circle at top right, rgba(56, 166, 165, 0.12), transparent 18%),
    linear-gradient(180deg, #f6f3ed 0%, #f5f8fd 36%, #fbfdff 100%);
}

.withdraw-hero,
.spotlight-card,
.moment-card,
.panel-card,
.history-shell,
.history-card {
  border-radius: 1.7rem;
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.withdraw-hero,
.moment-grid,
.withdraw-grid {
  display: grid;
  gap: 1.5rem;
}

.withdraw-hero {
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  align-items: stretch;
}

.withdraw-hero-copy,
.spotlight-card,
.moment-card,
.panel-card,
.history-shell {
  padding: clamp(1.4rem, 2vw, 2rem);
}

.withdraw-hero-copy {
  border-radius: 1.9rem;
  background: linear-gradient(135deg, rgba(12, 44, 80, 0.97), rgba(43, 115, 201, 0.93));
  color: #fdfefe;
  overflow: hidden;
}

.hero-title {
  font-size: clamp(2.3rem, 4.5vw, 4rem);
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

.section-kicker {
  margin-bottom: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(31, 75, 126, 0.66);
}

.withdraw-hero-copy .section-kicker {
  color: rgba(219, 234, 255, 0.76);
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

.spotlight-card {
  height: 100%;
  background:
    linear-gradient(150deg, rgba(249, 252, 255, 0.98), rgba(236, 245, 252, 0.98)),
    #fff;
}

.spotlight-label,
.moment-card h2,
.history-title,
.section-title,
.spotlight-stat span,
.history-grid span,
.form-meta span {
  color: #12304f;
}

.spotlight-value-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1;
  font-weight: 700;
  color: #0f3f6d;
}

.spotlight-copy,
.moment-note,
.helper-copy,
.history-meta,
.panel-loading p,
.empty-shell p {
  color: #5d6f85;
  line-height: 1.7;
}

.spotlight-grid,
.history-grid,
.form-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.spotlight-grid {
  margin-top: 1.4rem;
}

.spotlight-stat,
.history-grid div,
.form-meta div {
  padding: 1rem;
  border-radius: 1.1rem;
  background: rgba(14, 63, 109, 0.06);
}

.spotlight-stat strong,
.moment-value,
.history-grid strong,
.form-meta strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.05rem;
  color: #0f3f6d;
}

.spotlight-cta,
.primary-cta,
.ghost-action,
.amount-chip {
  transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease, color 140ms ease, border-color 140ms ease;
}

.spotlight-cta,
.primary-cta {
  margin-top: 1.4rem;
  width: 100%;
  border: 0;
  border-radius: 1rem;
  padding: 0.95rem 1.15rem;
  font-weight: 700;
  color: #fefefe;
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  box-shadow: 0 16px 30px -24px rgba(15, 63, 109, 0.8);
}

.spotlight-cta:hover,
.primary-cta:hover,
.ghost-action:hover,
.amount-chip:hover {
  transform: translateY(-1px);
}

.moment-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.moment-card {
  background: rgba(255, 255, 255, 0.84);
}

.moment-card h2 {
  margin: 0;
  font-size: 1.1rem;
}

.moment-value {
  margin-top: 0.9rem;
  font-size: 1.6rem;
  font-weight: 700;
}

.withdraw-grid {
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
}

.panel-card {
  background: rgba(255, 255, 255, 0.88);
}

.panel-card-dark {
  background: linear-gradient(150deg, rgba(16, 45, 84, 0.97), rgba(23, 71, 96, 0.94));
  color: rgba(245, 250, 255, 0.96);
}

.panel-card-dark .section-kicker,
.panel-card-dark .section-title,
.panel-card-dark .history-mini-row strong,
.panel-card-dark .history-mini-row span {
  color: inherit;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.3rem;
}

.section-head-spread {
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: clamp(1.4rem, 2.2vw, 1.9rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.amount-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
}

.amount-chip {
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(15, 63, 109, 0.04);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  color: #19456b;
  font-weight: 600;
}

.amount-chip-selected {
  background: linear-gradient(135deg, #0f3f6d, #2e7bd8);
  border-color: transparent;
  color: #fefefe;
}

.field-block {
  display: block;
  margin-top: 1rem;
}

.field-block span {
  display: block;
  margin-bottom: 0.55rem;
  color: #153352;
  font-size: 0.94rem;
  font-weight: 600;
}

.field-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(255, 255, 255, 0.92);
  padding: 0.95rem 1rem;
  color: #153352;
  outline: none;
}

.field-input:focus {
  border-color: rgba(46, 123, 216, 0.55);
  box-shadow: 0 0 0 4px rgba(46, 123, 216, 0.12);
}

.form-meta {
  margin-top: 1.1rem;
}

.validation-copy {
  margin-top: 1rem;
  color: #b42318;
  font-size: 0.94rem;
}

.primary-cta:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  transform: none;
}

.rule-list {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.8rem;
  color: rgba(236, 244, 255, 0.84);
  line-height: 1.75;
}

.dark-divider {
  height: 1px;
  margin: 1.4rem 0;
  background: rgba(255, 255, 255, 0.12);
}

.history-mini {
  display: grid;
  gap: 0.9rem;
}

.history-mini-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.history-shell {
  background: rgba(255, 255, 255, 0.88);
}

.history-list {
  display: grid;
  gap: 1rem;
}

.history-card {
  padding: 1.2rem;
  background: rgba(247, 250, 254, 0.92);
}

.history-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.history-title {
  margin: 0;
  font-size: 1.04rem;
  font-weight: 700;
}

.history-meta {
  margin-top: 0.35rem;
  font-size: 0.92rem;
}

.history-grid {
  margin-top: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 6.8rem;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.status-chip-success {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-chip-warning {
  background: rgba(202, 138, 4, 0.13);
  color: #b45309;
}

.status-chip-danger {
  background: rgba(190, 24, 93, 0.12);
  color: #be185d;
}

.reject-copy {
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  background: rgba(190, 24, 93, 0.08);
  color: #9d174d;
  line-height: 1.65;
}

.ghost-action {
  border: 1px solid rgba(15, 63, 109, 0.12);
  background: rgba(255, 255, 255, 0.78);
  color: #0f3f6d;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
}

.panel-loading,
.empty-shell {
  min-height: 14rem;
  display: grid;
  place-items: center;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1.2rem;
  background: linear-gradient(135deg, #0f3f6d, #38a6a5);
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
  .withdraw-hero,
  .withdraw-grid,
  .moment-grid,
  .history-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .withdraw-hero-copy,
  .spotlight-card,
  .moment-card,
  .panel-card,
  .history-shell {
    padding: 1.2rem;
  }

  .hero-title {
    max-width: none;
  }

  .history-head,
  .section-head-spread {
    flex-direction: column;
    align-items: stretch;
  }

  .status-chip {
    min-width: 0;
    width: fit-content;
  }
}
</style>
