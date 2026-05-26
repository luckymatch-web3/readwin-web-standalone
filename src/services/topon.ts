export type TopOnAdResult = {
  ready?: boolean
  shown?: boolean
  rewarded?: boolean
  error?: string
  placementId?: string
  adSourceId?: string
  networkFirmId?: string | number
  publisherRevenue?: number
  currency?: string
}

export type TopOnPlacementKind = 'rewarded' | 'interstitial' | 'banner' | 'native' | 'splash'

export function getResolvedTopOnProfile() {
  return {
    appId: '',
    appKey: '',
    bucket: 'web',
    country: '',
    placements: {
      rewarded: '',
      interstitial: '',
      banner: '',
      native: '',
      splash: '',
    },
  }
}

export function getTopOnPlacement(kind: TopOnPlacementKind): string {
  return getResolvedTopOnProfile().placements[kind]
}

export function hasTopOnBridge(): boolean {
  return false
}

export async function initTopOn(): Promise<boolean> {
  return false
}

export async function preloadTopOnRewarded(): Promise<boolean> {
  return false
}

export async function preloadTopOnRewardedResult(): Promise<TopOnAdResult> {
  return { ready: false, error: 'web_build' }
}

export async function showTopOnRewarded(): Promise<boolean> {
  return false
}

export async function showTopOnRewardedResult(): Promise<TopOnAdResult> {
  return { shown: false, rewarded: false, error: 'web_build' }
}

export async function preloadTopOnInterstitial(): Promise<boolean> {
  return false
}

export async function preloadTopOnInterstitialResult(): Promise<TopOnAdResult> {
  return { ready: false, error: 'web_build' }
}

export async function showTopOnInterstitial(): Promise<boolean> {
  return false
}

export async function showTopOnInterstitialResult(): Promise<TopOnAdResult> {
  return { shown: false, error: 'web_build' }
}

export async function showTopOnBanner(_position: 'top' | 'bottom' = 'bottom', _margin = 0): Promise<boolean> {
  return false
}

export async function hideTopOnBanner(): Promise<void> {}

export async function removeTopOnBanner(): Promise<void> {}
