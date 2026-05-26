const BASE = 'https://readwin.me'

export function coverUrl(url: string | null | undefined): string {
  if (!url) return BASE + '/default-cover.svg'
  if (url.startsWith('http')) return url
  // Capacitor app runs on https://localhost, needs full server URL for covers
  const isApp = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:')
  return isApp ? BASE + url : url
}
