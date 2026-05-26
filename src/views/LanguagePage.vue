<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAds } from '@/composables/useAds'
import { isNativeApp } from '@/services/admob'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toastStore = useToastStore()
const nativeApp = isNativeApp()
const { preloadRewarded, showRewarded } = useAds()
const savedLanguage = ref(localStorage.getItem('readwin-language') || 'en')
const selected = ref(savedLanguage.value)
const watchingAd = ref(false)

const languages = [
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'en', name: 'English' },
  { code: 'id', name: 'Indonesian' },
  { code: 'th', name: 'Thai' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Simplified Chinese' },
  { code: 'zh-TW', name: 'Traditional Chinese' },
]

const changed = computed(() => selected.value !== savedLanguage.value)

onMounted(() => {
  if (nativeApp) preloadRewarded()
})

async function watchHere() {
  if (watchingAd.value) return
  watchingAd.value = true

  if (!nativeApp) {
    toastStore.show('Watch here opens rewarded video inside the Android app.', 'info')
    watchingAd.value = false
    return
  }

  try {
    const shown = await showRewarded(
      () => {
        toastStore.show('Ad watched. Language list is ready.', 'success')
      },
      {
        source: 'language_watch_here',
        rewardReason: 'language_page_ad',
        rewardAmount: 0,
        currencyType: 'none',
        screenName: 'language',
      },
    )
    if (!shown) {
      toastStore.show('No rewarded ad is ready right now.', 'info')
    }
  } catch {
    toastStore.show('Rewarded ad failed to open.', 'error')
  } finally {
    watchingAd.value = false
  }
}

function completeLanguage() {
  localStorage.setItem('readwin-language', selected.value)
  savedLanguage.value = selected.value
  toastStore.show('Language saved.', 'success')
  router.back()
}
</script>

<template>
  <main class="native-language-page">
    <header class="native-language-header">
      <button type="button" aria-label="Back" @click="router.back()">‹</button>
      <h1>App Language</h1>
      <button
        type="button"
        class="native-language-done"
        :class="{ active: changed }"
        :disabled="!changed"
        @click="completeLanguage"
      >
        Done
      </button>
    </header>

    <section class="native-language-ad">
      <div>
        <span>Rewarded video</span>
        <strong>Watch once, then continue setup</strong>
        <p>No overlay banner here. This opens the third-party rewarded placement only when you tap.</p>
      </div>
      <button type="button" @click="watchHere">
        {{ watchingAd ? 'Opening ad...' : 'Watch here rewards' }}
      </button>
    </section>

    <section class="native-language-list">
      <button
        v-for="lang in languages"
        :key="lang.code"
        type="button"
        class="native-language-row"
        :class="{ selected: selected === lang.code }"
        @click="selected = lang.code"
      >
        <span>{{ lang.name }}</span>
        <b>{{ selected === lang.code ? '✓' : '' }}</b>
      </button>
    </section>
  </main>
</template>

<style scoped>
.native-language-page {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 7px calc(env(safe-area-inset-bottom, 0px) + 84px);
  color: #f7f7fb;
  background: #0d0d0f;
}

.native-language-header {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 64px;
  align-items: center;
  min-height: 46px;
}

.native-language-header button {
  min-height: 38px;
  border: none;
  background: transparent;
  color: #ffffff;
  font-size: 28px;
  font-weight: 800;
}

.native-language-header h1 {
  margin: 0;
  text-align: center;
  font-size: 15px;
  font-weight: 900;
}

.native-language-header .native-language-done {
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  font-weight: 800;
}

.native-language-done.active {
  color: #ffffff;
  background: linear-gradient(135deg, #ff4c91, #ff7b57);
}

.native-language-ad {
  display: grid;
  gap: 12px;
  overflow: hidden;
  padding: 14px;
  border: 1px solid rgba(255, 197, 107, 0.18);
  border-radius: 18px;
  background:
    radial-gradient(circle at 88% 18%, rgba(255, 222, 102, 0.2), transparent 28%),
    linear-gradient(135deg, rgba(63, 29, 48, 0.94), rgba(18, 13, 20, 0.96));
}

.native-language-ad span {
  display: block;
  color: #ff78ae;
  font-size: 10px;
  line-height: 1;
  font-weight: 1000;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.native-language-ad strong {
  display: block;
  margin-top: 6px;
  color: #ffe45e;
  font-size: 18px;
  line-height: 1;
  font-weight: 1000;
}

.native-language-ad p {
  margin: 7px 0 0;
  color: rgba(255, 233, 213, 0.58);
  font-size: 10px;
  line-height: 1.35;
  font-weight: 740;
}

.native-language-ad button {
  width: 100%;
  min-height: 38px;
  border: none;
  border-radius: 999px;
  color: #2b111a;
  background: linear-gradient(180deg, #ffe996, #ffba42);
  font-size: 13px;
  font-weight: 1000;
}

.native-language-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.native-language-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 35px;
  padding: 0 14px;
  border: none;
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.76);
  background: #232436;
  font-size: 13px;
  text-align: left;
}

.native-language-row.selected {
  color: #ffffff;
}

.native-language-row b {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  color: #ffffff;
  background: linear-gradient(135deg, #ff40ac, #ff5a8f);
  font-size: 12px;
}
</style>
