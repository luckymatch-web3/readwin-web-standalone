<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useRoute } from 'vue-router'
import router from '@/router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import MobileNav from '@/components/MobileNav.vue'
import NativeFloatingRewards from '@/components/app/NativeFloatingRewards.vue'
import NativeCoinFlightLayer from '@/components/app/NativeCoinFlightLayer.vue'
import { initAdMob, removeBanner, showInterstitial } from '@/services/admob'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'
import ToastContainer from '@/components/ToastContainer.vue'

const route = useRoute()
const loading = ref(true)
const nativeLoadingProgress = ref(0)
const nativeApp = Capacitor.isNativePlatform()
const NATIVE_RETURNING_USER_KEY = 'readwin-native-returning-user'
const NATIVE_ROUTE_INTERSTITIAL_EVERY = 4
const NATIVE_ROUTE_INTERSTITIAL_MIN_INTERVAL_MS = 120_000
const nativePrimaryRoutes = new Set(['home', 'bookshelf', 'earn', 'profile'])
const nativeInterstitialRoutes = new Set(['home', 'bookshelf', 'earn', 'profile'])
const routeInterstitialSkip = new Set(['login', 'forgot-password', 'withdraw', 'language'])
const nativeLoadingStories = [
  { title: 'Moonlit Evidence', cover: '/native-loading/moonlit-evidence-silver-secrets.jpg' },
  { title: 'Broken Moon', cover: '/native-loading/the-alpha-s-broken-moon.webp' },
  { title: 'Shadowed Twin', cover: '/native-loading/the-alpha-s-shadowed-twin.jpg' },
  { title: 'Snowbound', cover: '/native-loading/snowbound-with-the-billionaire.webp' },
  { title: 'Last Laugh', cover: '/native-loading/the-luna-s-last-laugh.webp' },
  { title: 'Saving My Enemy', cover: '/native-loading/saving-my-enemy-s-heart.webp' },
  { title: 'Crimson Suit', cover: '/native-loading/beneath-the-crimson-suit.svg' },
  { title: 'Love In Every Note', cover: '/native-loading/love-in-every-wrong-note.jpg' },
  { title: 'Bought By Alpha', cover: '/native-loading/the-alpha-who-bought-me.webp' },
  { title: 'Canvas Of Hearts', cover: '/native-loading/879-canvas-of-hearts-and-rivals.jpg' },
  { title: 'Midnight Wings', cover: '/native-loading/midnight-wings-and-wolf-s-howl.svg' },
  { title: 'Summer Hearts', cover: '/native-loading/summer-hearts-rekindled.jpg' },
]
const showHeader = computed(() => !nativeApp && route.name !== 'chapter')
const showFooter = computed(() => !nativeApp && route.name !== 'chapter')
const showMobileNav = computed(() => {
  if (nativeApp) {
    return nativePrimaryRoutes.has(String(route.name || ''))
  }
  return route.name !== 'chapter'
})
const showMobileSpacer = computed(() => showMobileNav.value)

// Back button: in chapter page → go to book detail; on main pages → double-tap to exit
let lastBackTime = 0
let nativeRouteSwitchCount = Number(sessionStorage.getItem('readwin-native-route-switch-count') || 0)
let firstNativeRouteAfterLoading = true

function handleBackButton() {
  const currentRoute = router.currentRoute.value

  // In chapter reading → go back to book detail (same as top-left back button)
  if (currentRoute.name === 'chapter') {
    router.push(`/book/${currentRoute.params.id}`)
    return
  }

  // In book detail or sub-pages → go back in history
  if (currentRoute.name !== 'home') {
    router.back()
    return
  }

  // On home page → double-tap within 2s to exit
  const now = Date.now()
  if (now - lastBackTime < 2000) {
    // Actually exit the app (Capacitor)
    const { App } = (window as any).Capacitor?.Plugins || {}
    if (App?.exitApp) App.exitApp()
  } else {
    lastBackTime = now
    // Show toast hint
    const toastStore = useToastStore()
    toastStore.show('Press back again to exit', 'info', 2000)
  }
}

function wait(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms))
}

function runNativeLoading() {
  return new Promise<void>(resolve => {
    const duration = 2800
    const started = Date.now()
    nativeLoadingProgress.value = 3

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started
      const ratio = Math.min(elapsed / duration, 1)
      nativeLoadingProgress.value = Math.min(99, Math.round(3 + ratio * 96))

      if (ratio >= 1) {
        window.clearInterval(timer)
        nativeLoadingProgress.value = 100
        window.setTimeout(resolve, 220)
      }
    }, 80)
  })
}

function scheduleNativeAdWarmup(delayMs = 2200) {
  window.setTimeout(() => {
    void initAdMob().catch(error => {
      console.warn('[App] Native ad warmup skipped:', error)
    })
  }, delayMs)
}

async function finishInitialLoading() {
  if (!nativeApp) {
    await wait(800)
    loading.value = false
    initAdMob()
    return
  }

  const returningUser = localStorage.getItem(NATIVE_RETURNING_USER_KEY) === 'true'

  await runNativeLoading()
  loading.value = false
  removeBanner()
  localStorage.setItem(NATIVE_RETURNING_USER_KEY, 'true')

  // TopOn mediation can spin up several network SDKs. Warm it after the first
  // native frame so startup never gets stuck behind ad-network initialization.
  scheduleNativeAdWarmup(returningUser ? 1800 : 3200)
}

onMounted(async () => {
  const saved = localStorage.getItem('readwin-dark-mode')
  if (saved === 'true') {
    document.documentElement.classList.add('dark')
  }
  await router.isReady()
  finishInitialLoading()
  // Restore session
  const userStore = useUserStore()
  userStore.fetchMe()

  // Listen for hardware back button (Capacitor)
  try {
    const { App: CapApp } = await import('@capacitor/app')
    CapApp.addListener('backButton', () => handleBackButton())
  } catch {}
})

watch(() => route.fullPath, async (_to, from) => {
  if (!nativeApp || loading.value || !from) return
  if (route.name !== 'chapter') {
    void removeBanner()
  }
  const toRouteName = String(route.name || '')
  const fromRouteName = String(router.resolve(from).name || '')
  if (routeInterstitialSkip.has(toRouteName)) return
  if (!nativeInterstitialRoutes.has(toRouteName)) return
  if (!nativeInterstitialRoutes.has(fromRouteName)) return

  if (firstNativeRouteAfterLoading) {
    firstNativeRouteAfterLoading = false
    return
  }

  nativeRouteSwitchCount += 1
  sessionStorage.setItem('readwin-native-route-switch-count', String(nativeRouteSwitchCount))
  if (nativeRouteSwitchCount % NATIVE_ROUTE_INTERSTITIAL_EVERY !== 0) return

  try {
    await initAdMob()
    await showInterstitial({
      minIntervalMs: NATIVE_ROUTE_INTERSTITIAL_MIN_INTERVAL_MS,
      source: 'route_switch',
      trigger: `route_switch_${nativeRouteSwitchCount}`,
      screenName: String(route.name || 'unknown'),
    })
  } catch (error) {
    console.warn('[App] Route interstitial skipped:', error)
  }
})
</script>

<template>
  <!-- Splash Screen -->
  <Transition name="splash">
    <div v-if="loading" class="splash-screen" :class="{ 'native-loading-screen': nativeApp }">
      <template v-if="nativeApp">
        <div class="native-loading-top">
          <span class="native-loading-app-dot"></span>
          <span>ReadWin</span>
        </div>

        <div class="native-loading-collage" aria-hidden="true">
          <article
            v-for="(story, index) in nativeLoadingStories"
            :key="story.cover"
            class="native-loading-cover"
            :style="{ backgroundImage: `url(${story.cover})`, animationDelay: `${index * 0.06}s` }"
          >
            <span>{{ story.title }}</span>
          </article>
        </div>

        <div class="native-loading-shade"></div>

        <div class="native-loading-brand">
          <div class="native-loading-coin-field" aria-hidden="true">
            <span v-for="index in 8" :key="index" :style="{ animationDelay: `${index * 0.16}s` }"></span>
          </div>
          <div class="native-loading-logo">
            <img src="/logo.png" alt="ReadWin" />
          </div>
          <h1>ReadWin</h1>
          <p>Every chapter, completely free.</p>
          <small>Read stories, earn rewards, and keep going.</small>
          <div class="native-loading-earn-card">
            <strong>+200</strong>
            <span>Coins rise while you read</span>
          </div>
        </div>

        <div class="native-loading-progress">
          <div class="native-loading-track">
            <span :style="{ width: `${nativeLoadingProgress}%` }"></span>
          </div>
          <p>Loading... {{ nativeLoadingProgress }}%</p>
        </div>
      </template>

      <div v-else class="splash-content">
        <div class="splash-logo">
          <img src="/logo.png" alt="ReadWin" class="splash-logo-img" />
        </div>
        <h1 class="splash-title">ReadWin</h1>
        <p class="splash-subtitle">Read to Win</p>
        <div class="splash-loader">
          <div class="splash-dot"></div>
          <div class="splash-dot"></div>
          <div class="splash-dot"></div>
        </div>
      </div>
    </div>
  </Transition>

  <div v-show="!loading" class="min-h-screen flex flex-col" style="background-color: var(--bg-page); color: var(--text-primary)">
    <AppHeader v-if="showHeader" />
    <div class="flex-1">
      <router-view v-slot="{ Component }">
        <!-- no transition to avoid white screen -->
          <component :is="Component" />
        <!-- /no transition -->
      </router-view>
    </div>
    <AppFooter v-if="showFooter" />
    <MobileNav v-if="showMobileNav" />
    <div class="h-14 md:hidden" v-if="showMobileSpacer"></div>
    <NativeFloatingRewards v-if="nativeApp" />
    <NativeCoinFlightLayer v-if="nativeApp" />
    <ToastContainer />
  </div>
</template>

<style>
.page-enter-active { transition: opacity 0.15s ease-out, transform 0.15s ease-out; }
.page-leave-active { transition: opacity 0.1s ease-in; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; }

.splash-screen {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
}
.splash-content { text-align: center; animation: splashFadeIn 0.6s ease-out; }
.splash-logo {
  width: 88px; height: 88px; margin: 0 auto 20px;
  background: rgba(255,255,255,0.15); border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px);
  animation: splashPulse 2s ease-in-out infinite;
}
.splash-logo-img { width: 64px; height: 64px; border-radius: 18px; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22); }
.splash-title { font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 4px; }
.splash-subtitle { font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 32px; }
.splash-loader { display: flex; gap: 8px; justify-content: center; }
.splash-dot {
  width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.8);
  animation: splashBounce 1.4s ease-in-out infinite;
}
.splash-dot:nth-child(2) { animation-delay: 0.16s; }
.splash-dot:nth-child(3) { animation-delay: 0.32s; }

.native-loading-screen {
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  background: #020204;
  color: #fffafc;
}

.native-loading-top {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  left: 8px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

.native-loading-app-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fff, #ff7ca8);
  box-shadow: 0 0 18px rgba(255, 103, 151, 0.76);
}

.native-loading-collage {
  position: absolute;
  inset: -7% -36% 8% -22%;
  display: grid;
  grid-template-columns: repeat(4, minmax(112px, 1fr));
  grid-auto-rows: minmax(188px, 24vh);
  gap: 12px;
  transform: rotate(-17deg) scale(1.08);
  transform-origin: center;
  opacity: 0.74;
}

.native-loading-cover {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background-position: center;
  background-size: cover;
  box-shadow: 0 24px 42px rgba(0, 0, 0, 0.58);
  animation: nativePosterFloat 4.2s ease-in-out infinite;
}

.native-loading-cover:nth-child(3n + 1) {
  transform: translateY(-18px);
}

.native-loading-cover:nth-child(3n + 2) {
  transform: translateY(28px);
}

.native-loading-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, transparent 42%, rgba(0, 0, 0, 0.78)),
    radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.2), transparent 22%);
}

.native-loading-cover span {
  position: absolute;
  right: 10px;
  bottom: 12px;
  left: 10px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 16px;
  line-height: 1.05;
  font-weight: 900;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.82);
}

.native-loading-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 46%, rgba(255, 104, 153, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.64) 42%, #020204 96%),
    linear-gradient(90deg, #020204 0%, transparent 22%, transparent 70%, #020204 100%);
  z-index: 1;
}

.native-loading-brand {
  position: relative;
  z-index: 2;
  align-self: center;
  width: min(78vw, 360px);
  margin: auto;
  text-align: center;
  animation: splashFadeIn 0.7s ease-out;
}

.native-loading-logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 128px;
  height: 128px;
  margin-bottom: 12px;
}

.native-loading-logo::before {
  content: '';
  position: absolute;
  width: 122px;
  height: 122px;
  border-radius: 40px;
  background:
    radial-gradient(circle at 36% 30%, rgba(255, 247, 184, 0.88), rgba(255, 122, 163, 0.34) 44%, transparent 45%),
    linear-gradient(135deg, rgba(255, 244, 174, 0.26), rgba(255, 77, 145, 0.22));
  transform: rotate(14deg);
  box-shadow: 0 0 52px rgba(255, 229, 115, 0.42);
}

.native-loading-logo img {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 26px;
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.46));
  animation: nativeLogoFloat 2.8s ease-in-out infinite;
}

.native-loading-coin-field {
  position: absolute;
  inset: -58px -10px auto;
  height: 220px;
  pointer-events: none;
}

.native-loading-coin-field span {
  position: absolute;
  left: calc(50% - 7px);
  top: 62%;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 30%, #fff7a8 0 17%, transparent 18%),
    radial-gradient(circle, #ffcf24 0 58%, #f38c00 59% 100%);
  box-shadow: 0 0 0 1px rgba(120, 70, 0, 0.2), 0 0 18px rgba(255, 206, 40, 0.62);
  animation: nativeLoadingCoinRise 2.2s ease-in-out infinite;
}

.native-loading-coin-field span:nth-child(2n) { --coin-x: -64px; }
.native-loading-coin-field span:nth-child(3n) { --coin-x: 58px; }
.native-loading-coin-field span:nth-child(4n) { --coin-x: -112px; }
.native-loading-coin-field span:nth-child(5n) { --coin-x: 106px; }

.native-loading-brand h1 {
  margin: 0;
  color: #fffafc;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0;
  text-shadow: 0 3px 18px rgba(0, 0, 0, 0.78);
}

.native-loading-brand p {
  margin: 14px 0 0;
  color: #fff6bd;
  font-size: 16px;
  line-height: 1.25;
  font-weight: 900;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.82);
}

.native-loading-brand small {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  line-height: 1.35;
  font-weight: 800;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.82);
}

.native-loading-earn-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 9px 13px;
  border-radius: 999px;
  color: #151013;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.38);
  animation: nativeEarnCardPulse 1.8s ease-in-out infinite;
}

.native-loading-earn-card strong {
  color: #ff4d91;
  font-size: 16px;
  font-weight: 1000;
}

.native-loading-earn-card span {
  font-size: 12px;
  font-weight: 900;
}

.native-loading-progress {
  position: absolute;
  right: 36px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 62px);
  left: 36px;
  z-index: 3;
  text-align: center;
}

.native-loading-track {
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18), 0 16px 32px rgba(0, 0, 0, 0.5);
}

.native-loading-track span {
  display: block;
  width: 0%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff4b91, #ff82a8, #ffe86a);
  transition: width 0.12s ease-out;
}

.native-loading-progress p {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 800;
}

@keyframes splashFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes splashPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes splashBounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
@keyframes nativePosterFloat {
  0%, 100% { filter: brightness(0.86); }
  50% { filter: brightness(1.06); }
}
@keyframes nativeLogoFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-7px) scale(1.035); }
}
@keyframes nativeLoadingCoinRise {
  0% { opacity: 0; transform: translate3d(var(--coin-x, 0), 40px, 0) scale(0.6) rotate(0deg); }
  22% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(var(--coin-x, 0), -120px, 0) scale(1.1) rotate(540deg); }
}
@keyframes nativeEarnCardPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.splash-enter-active { transition: opacity 0.3s ease; }
.splash-leave-active { transition: opacity 0.5s ease; }
.splash-enter-from, .splash-leave-to { opacity: 0; }
</style>
