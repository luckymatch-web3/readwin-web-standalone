export const ADS_DISABLED = true
export const USE_TEST_ADS = false
export const ALLOW_DIRECT_ADMOB_FALLBACK = false
export const ALLOW_NATIVE_OVERLAY_BANNER = false

export async function initAdMob(): Promise<void> {}

export async function showBanner(_position: 'top' | 'bottom' = 'bottom', _margin = 0): Promise<boolean> {
  return false
}

export async function hideBanner(): Promise<void> {}

export async function removeBanner(): Promise<void> {}

export async function prepareInterstitial(): Promise<boolean> {
  return false
}

export async function showInterstitial(_options: Record<string, unknown> = {}): Promise<boolean> {
  return false
}

export function isNativeApp(): boolean {
  return false
}
