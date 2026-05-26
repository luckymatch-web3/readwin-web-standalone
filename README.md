# ReadWin Web Standalone

This is the browser-only ReadWin frontend extracted from the original full-stack/mobile workspace.

## What is included

- Vue 3 + Vite + TypeScript web app
- Pinia stores, router, pages, reusable components, and mock fallback data
- Public logo/icon assets needed by the browser build
- API base URL configuration through `VITE_API_BASE_URL`

## What is not included

- Backend source code
- Android/Capacitor project files
- Native ad SDK configuration
- Adjust/Firebase/TopOn production credentials
- Large generated cover and store screenshot assets

## Configure API domain

Copy `.env.example` to `.env` and change the domain:

```bash
VITE_API_BASE_URL=https://readwin.me
```

When `VITE_API_BASE_URL` is not set, the app calls `/api` on the same domain. In local dev, Vite proxies `/api` to `https://readwin.me` by default.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
