# Hostinger deployment (TPCLUBMAIN)

If auto-detection fails, use these settings in hPanel:

- **Framework:** Express.js (or **Other** if needed)
- **Node.js version:** 20.x
- **Entry file:** `app.js`
- **Start command:** `npm start`
- **Root directory:** `/` (repository root)
- **Output directory:** leave empty for Express backend apps

## Required environment variables

```
PORT=3000
SITE_URL=https://your-domain.com
TELEGRAM_URL=https://t.me/+VEugRODM7y5iNGY0
TELEGRAM_CHANNEL_URL=https://t.me/OfficialTPClub
BOOKING_URL=https://calendly.com/YOUR_BOOKING_LINK
BITUNIX_REFERRAL_URL=https://www.bitunix.com/register?vipCode=TPclubJackman
YOUTUBE_URL=https://www.youtube.com/@TPClub
```

After changing env vars, use **Settings and Redeploy**.
