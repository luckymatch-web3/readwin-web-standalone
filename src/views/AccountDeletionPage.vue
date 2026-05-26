<script setup lang="ts">
const deletionEmail = 'privacy@readwin.me'
const appName = 'ReadWin'
const developerName = 'ReadWin Pte. Ltd.'

const mailSubject = encodeURIComponent('ReadWin account and data deletion request')
const mailBody = encodeURIComponent(`Hello ReadWin team,

I want to request deletion of my ReadWin account and associated data.

Account email or user ID:
Country/region:
Do you want to delete the full account, or only selected data:

I understand that some records may be retained for a limited period when required for fraud prevention, payment, tax, accounting, legal, or safety obligations.
`)

const deleteTypes = [
  'Account profile information, including user ID, email address, display name, avatar, and sign-in identifiers.',
  'Reading activity, bookshelf, favorites, reading progress, search history, reward task activity, and app interaction history.',
  'Wallet, coin, cashout, and PayPal payout request records where deletion is legally and operationally permitted.',
  'Advertising and analytics identifiers linked to your account where deletion is available to ReadWin.',
  'Support messages and feedback records connected to your account, unless retention is required to resolve a dispute or comply with law.',
]

const retainedTypes = [
  'Fraud prevention, abuse prevention, security, accounting, tax, payment, or legal records may be retained only for the period required by law or legitimate business obligations.',
  'Aggregated or anonymized analytics that can no longer identify you may be retained.',
  'Data controlled by third-party services, such as Google, AdMob, Firebase, PayPal, or other ad partners, must be managed according to those providers\' own privacy controls.',
]
</script>

<template>
  <main class="account-deletion-page">
    <section class="deletion-hero">
      <div class="deletion-kicker">Account deletion</div>
      <h1>Delete your ReadWin account and data</h1>
      <p>
        This page is provided by {{ developerName }} for users of {{ appName }}.
        You can use it to request deletion of your account and associated user data.
      </p>
      <a
        class="deletion-primary"
        :href="`mailto:${deletionEmail}?subject=${mailSubject}&body=${mailBody}`"
      >
        Request deletion by email
      </a>
    </section>

    <section class="deletion-card">
      <h2>How to request deletion</h2>
      <ol>
        <li>Send an email to <a :href="`mailto:${deletionEmail}`">{{ deletionEmail }}</a> from the email address linked to your ReadWin account.</li>
        <li>Use the subject line: <strong>ReadWin account and data deletion request</strong>.</li>
        <li>Include your account email, user ID if available, and whether you want full account deletion or deletion of selected data only.</li>
        <li>We may ask you to verify account ownership before deleting data.</li>
        <li>After verification, we will process eligible deletion requests within 30 days, unless a longer period is required by law.</li>
      </ol>
    </section>

    <section class="deletion-grid">
      <div class="deletion-card">
        <h2>Data we delete</h2>
        <ul>
          <li v-for="item in deleteTypes" :key="item">{{ item }}</li>
        </ul>
      </div>

      <div class="deletion-card">
        <h2>Data we may retain</h2>
        <ul>
          <li v-for="item in retainedTypes" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>

    <section class="deletion-card">
      <h2>Partial deletion requests</h2>
      <p>
        You may also request deletion of only selected data, such as reading history,
        search history, bookshelf data, reward activity, or support records, without
        deleting your full account. Tell us which data you want removed in your email.
      </p>
    </section>

    <section class="deletion-card deletion-contact">
      <h2>Contact</h2>
      <p>
        Privacy contact:
        <a :href="`mailto:${deletionEmail}`">{{ deletionEmail }}</a>
      </p>
      <p>
        Public deletion URL:
        <a href="https://readwin.me/account-deletion">https://readwin.me/account-deletion</a>
      </p>
    </section>
  </main>
</template>

<style scoped>
.account-deletion-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 20px 72px;
  color: var(--text-primary);
}

.deletion-hero,
.deletion-card {
  border: 1px solid var(--border-default);
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(255, 68, 138, 0.16), transparent 34%),
    var(--bg-card);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
}

.deletion-hero {
  padding: 40px;
  margin-bottom: 24px;
}

.deletion-kicker {
  width: fit-content;
  margin-bottom: 14px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 68, 138, 0.12);
  color: var(--primary-600);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1 {
  max-width: 720px;
  margin: 0 0 16px;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.02;
}

h2 {
  margin: 0 0 16px;
  font-size: 22px;
}

p,
li {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.deletion-hero p {
  max-width: 760px;
  margin-bottom: 28px;
}

.deletion-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff3d8b, #ff735c);
  color: #fff;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 14px 32px rgba(255, 61, 139, 0.26);
}

.deletion-card {
  padding: 28px;
  margin-bottom: 20px;
}

.deletion-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.deletion-grid .deletion-card {
  margin-bottom: 0;
}

ol,
ul {
  margin: 0;
  padding-left: 20px;
}

a {
  color: var(--primary-600);
  font-weight: 700;
}

.deletion-contact p {
  margin: 8px 0 0;
}

@media (max-width: 720px) {
  .account-deletion-page {
    padding: 28px 14px 56px;
  }

  .deletion-hero,
  .deletion-card {
    border-radius: 18px;
  }

  .deletion-hero {
    padding: 28px 22px;
  }

  .deletion-card {
    padding: 22px;
  }

  .deletion-grid {
    grid-template-columns: 1fr;
  }
}
</style>
