export const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'https://readwin.me').replace(/\/$/, '')
export const API_BASE_URL = `${API_ORIGIN}/api`
export const ASSET_BASE_URL = (import.meta.env.VITE_ASSET_BASE_URL || API_ORIGIN).replace(/\/$/, '')
export const APP_DOWNLOAD_URL = import.meta.env.VITE_APP_DOWNLOAD_URL || 'https://play.google.com/store/apps/details?id=me.readwin.app'
