import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

type AdLoadState = 'idle' | 'loading' | 'loaded' | 'failed'

const RETRY_DELAY_MS = 300
const MAX_ATTEMPTS = 20

function isRenderable(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && element.isConnected
}

export function useAdsenseSlot() {
  const adRef = ref<HTMLElement | null>(null)
  const loadState = ref<AdLoadState>('idle')

  let requested = false
  let requestInFlight = false
  let observer: ResizeObserver | null = null

  async function requestAd() {
    if (requested || requestInFlight) return

    await nextTick()

    const element = adRef.value
    if (!element || !isRenderable(element)) return

    if (element.dataset.adsbygoogleStatus) {
      requested = true
      loadState.value = 'loaded'
      return
    }

    loadState.value = 'loading'
    requestInFlight = true

    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const adsbygoogle = (window as any).adsbygoogle

        if (adsbygoogle && isRenderable(element)) {
          try {
            adsbygoogle.push({})
            requested = true
            loadState.value = 'loaded'
            return
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            if (message.includes('already have ads in them')) {
              requested = true
              loadState.value = 'loaded'
              return
            }

            console.warn('[AdSense] Failed to request slot:', error)
            loadState.value = 'failed'
            return
          }
        }

        await new Promise(resolve => window.setTimeout(resolve, RETRY_DELAY_MS))
      }

      loadState.value = 'failed'
    } finally {
      requestInFlight = false
    }
  }

  onMounted(() => {
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        void requestAd()
      })

      if (adRef.value) observer.observe(adRef.value)
    }

    void requestAd()
  })

  watch(adRef, (nextElement, prevElement) => {
    if (observer && prevElement) observer.unobserve(prevElement)
    if (observer && nextElement) observer.observe(nextElement)
    if (nextElement) void requestAd()
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    adRef,
    loadState,
    requestAd,
  }
}
