import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

const apiTarget = process.env.VITE_API_BASE_URL || 'https://readwin.me'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@capacitor/core': fileURLToPath(new URL('./src/shims/capacitor-core.ts', import.meta.url)),
      '@capacitor/app': fileURLToPath(new URL('./src/shims/capacitor-app.ts', import.meta.url)),
      '@codetrix-studio/capacitor-google-auth': fileURLToPath(new URL('./src/shims/capacitor-google-auth.ts', import.meta.url)),
    },
  },
  server: {
    port: 4000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
