# TP Club Landing Page

Production-ready static Vite landing page for TP Club (止盈社), a bilingual crypto education community for Chinese Australians.

The build renders separate HTML files for English and Chinese pages, including canonical URLs, hreflang tags, JSON-LD, `sitemap.xml`, and `robots.txt`.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:4173/en/` or `http://localhost:4173/zh/` (use the trailing slash, or click **中文** in the nav). `npm run dev` runs a full build then `vite preview`; the preview port may be `4174` if `4173` is busy.

## Build

```bash
npm run build
```

The static site is generated into `dist/`.

## Environment

- `SITE_URL` - Public production origin for canonical, sitemap, and social metadata
- `VITE_GTM_ID` - Google Tag Manager container ID
- `VITE_N8N_WEBHOOK` - n8n webhook URL for Telegram click tracking
- `VITE_TELEGRAM_URL` - Telegram group URL used by the tracked `/go` redirect
- `TELEGRAM_URL` - Primary Telegram CTA URL
- `TELEGRAM_CHANNEL_URL` - Telegram channel URL for contact and social metadata
- `BITUNIX_REFERRAL_URL` - Partner exchange referral URL
