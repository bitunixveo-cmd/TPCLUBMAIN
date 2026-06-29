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
VITE_TELEGRAM_URL=https://t.me/+5715hMkkOso3ZGY8
TELEGRAM_URL=https://t.me/+5715hMkkOso3ZGY8
TELEGRAM_CHANNEL_URL=https://t.me/OfficialTPClub
BITUNIX_REFERRAL_URL=https://www.bitunix.com/register?vipCode=TPclubJackman
YOUTUBE_URL=https://www.youtube.com/@TPClub
DASHBOARD_PASSWORD=your-dashboard-password
DASHBOARD_PROJECT_ROOT=/absolute/path/to/repository
DASHBOARD_REFRESH_COMMAND=npm run refresh:ads
```

After changing env vars, use **Settings and Redeploy**.

## Ads dashboard refresh

The dashboard is static, so the browser cannot safely call Google Ads or Meta Ads directly. To refresh live data from the dashboard:

1. Configure the Google Ads and Meta Ads environment variables on the server.
2. Set `DASHBOARD_PROJECT_ROOT` to the absolute path where this repository exists on the server.
3. Ensure Node dependencies are installed in that project root.
4. The dashboard button calls `/dashboard/refresh-data.php`, which runs:

```
npm run refresh:ads
```

This updates:

```
dist/dashboard/data/ads-dashboard.json
```

You can also schedule the same refresh with cron so data stays current even when nobody has the dashboard open:

```
*/15 * * * * cd /absolute/path/to/repository && npm run refresh:ads >> /tmp/tpclub-ads-sync.log 2>&1
```

The dashboard also auto-syncs while open: it pulls fresh API data on load when stale, checks for newer JSON every 3 minutes, and runs a full API sync every 30 minutes.
