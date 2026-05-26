<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useAdsenseSlot } from '@/composables/useAdsenseSlot'
import { ALLOW_NATIVE_OVERLAY_BANNER, removeBanner, showBanner } from '@/services/admob'
import { useUserStore } from '@/stores/user'

const props = withDefaults(defineProps<{
  format?: 'banner' | 'rectangle' | 'interstitial' | 'chapter-break'
  position?: 'top' | 'bottom'
  slot?: string
}>(), {
  format: 'banner',
  position: 'bottom',
  slot: '1533988493'
})

const userStore = useUserStore()
const nativeApp = Capacitor.isNativePlatform()
const shouldRenderWeb = computed(() => !nativeApp && !userStore.isVip)
const shouldReserveNativeSpace = computed(() =>
  nativeApp && ALLOW_NATIVE_OVERLAY_BANNER && !userStore.isVip && props.format === 'banner'
)
const { adRef } = useAdsenseSlot()

const adStyles: Record<string, { width: string; height: string }> = {
  banner: { width: '100%', height: '60px' },
  rectangle: { width: '300px', height: '250px' },
  interstitial: { width: '100%', height: '250px' },
  'chapter-break': { width: '100%', height: '200px' },
}
const style = adStyles[props.format] ?? adStyles['banner'] ?? { width: '100%', height: '60px' }
const adFormat = computed(() => props.format === 'banner' ? undefined : 'auto')
const responsive = computed(() => props.format === 'banner' ? 'false' : 'true')
const nativeSpacerStyle = computed(() => {
  if (props.position === 'top') {
    return { minHeight: '72px' }
  }
  return { minHeight: '84px' }
})

async function syncNativeBanner() {
  if (!nativeApp) return
  if (userStore.isVip || props.format !== 'banner') {
    await removeBanner()
    return
  }
  const shown = await showBanner(props.position)
  if (!shown) {
    await removeBanner()
  }
}

onMounted(() => {
  if (nativeApp) {
    void syncNativeBanner()
  }
})

watch(() => [props.position, props.format, userStore.isVip], () => {
  if (nativeApp) {
    void syncNativeBanner()
  }
})

onUnmounted(() => {
  if (nativeApp) {
    void removeBanner()
  }
})
</script>

<template>
  <div v-if="shouldReserveNativeSpace" class="native-banner-spacer" :style="nativeSpacerStyle" aria-hidden="true"></div>
  <div v-else-if="shouldRenderWeb" class="ad-container" :class="`ad-${format}`">
    <span class="ad-label">Advertisement</span>
    <ins
      ref="adRef"
      class="adsbygoogle"
      :style="{ display: 'block', width: style.width, height: style.height }"
      data-ad-client="ca-pub-8148693514304068"
      :data-ad-slot="slot"
      :data-ad-format="adFormat"
      :data-full-width-responsive="responsive"
    ></ins>
  </div>
</template>

<style scoped>
.ad-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 16px auto;
  max-width: 100%;
}

.ad-label {
  margin-bottom: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.native-banner-spacer {
  width: 100%;
  pointer-events: none;
}
</style>
