# Hostinger deployment (TPCLUBMAIN)

This repository builds as a static Vite site. The build renders real HTML files for every public page, so search engines can crawl the bilingual pages without JavaScript rendering.

- **Framework:** Vite
- **Node.js version:** 20.x
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Root directory:** `/` (repository root)

## Required environment variables

```
SITE_URL=https://tpclub.co
VITE_GTM_ID=GTM-MXWHXVKS
VITE_N8N_WEBHOOK=
VITE_TELEGRAM_URL=https://t.me/+VEugRODM7y5iNGY0
TELEGRAM_URL=https://t.me/+VEugRODM7y5iNGY0
TELEGRAM_CHANNEL_URL=https://t.me/OfficialTPClub
BITUNIX_REFERRAL_URL=https://www.bitunix.com/register?vipCode=TPclubJackman
YOUTUBE_URL=https://www.youtube.com/@TPClub
```

After changing env vars, use **Settings and Redeploy**.
