import { ref } from 'vue'
import { Analytics } from '@/services/analytics'

export type RewardedAdContext = {
  source?: string
  rewardReason?: string
  rewardAmount?: number
  currencyType?: string
  screenName?: string
}

const isRewardedReady = ref(true)
const isLoading = ref(false)

export function useAds() {
  async function preloadRewarded(): Promise<boolean> {
    isRewardedReady.value = true
    return true
  }

  async function showRewarded(onReward?: () => void, context: RewardedAdContext = {}): Promise<boolean> {
    isLoading.value = true
    Analytics.adShowAttempt('rewarded', { source: context.source || 'web_stub' })
    window.setTimeout(() => {
      onReward?.()
      isLoading.value = false
      Analytics.adShowResult('rewarded', true, { source: context.source || 'web_stub' })
      Analytics.adRewardedEarned(context.rewardAmount ?? 0, { source: context.source || 'web_stub' })
    }, 150)
    return true
  }

  return { isRewardedReady, isLoading, preloadRewarded, showRewarded }
}
