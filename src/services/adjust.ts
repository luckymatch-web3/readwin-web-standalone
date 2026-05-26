type AdjustParams = Record<string, string | number | boolean | null | undefined>

export async function isAdjustConfigured(): Promise<boolean> {
  return false
}

export async function trackAdjustEvent(_eventName: string, _params: AdjustParams = {}): Promise<boolean> {
  return false
}
