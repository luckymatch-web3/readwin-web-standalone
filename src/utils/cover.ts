import { ASSET_BASE_URL } from '@/config'

export function coverUrl(url: string | null | undefined): string {
  if (!url) return `${ASSET_BASE_URL}/default-cover.svg`
  if (url.startsWith('http')) return url
  return `${ASSET_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
}
