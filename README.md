# TP Club Landing Page

Production-ready Node.js + Express landing page for TP Club (止盈社), a bilingual crypto education community for Chinese Australians.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000/en` or `http://localhost:3000/zh`.

## Environment

- `PORT` - Server port, defaults to `3000`
- `SITE_URL` - Public production origin for canonical, sitemap, and social metadata
- `TELEGRAM_URL` - Primary Telegram CTA URL
- `TELEGRAM_CHANNEL_URL` - Telegram channel URL for contact and social metadata
- `BOOKING_URL` - Free 1-on-1 booking CTA URL
- `BITUNIX_REFERRAL_URL` - Partner exchange referral URL

## Docker

```bash
docker build -t tpclub .
docker run -p 3000:3000 --env-file .env tpclub
```
