# Hostinger deployment (TPCLUBMAIN)

## What this file is

This is the setup guide for your live site on Hostinger. It covers:

1. How the site builds and deploys
2. Which secret keys go in Hostinger **Environment variables**
3. How the ads dashboard gets fresh Google/Meta data
4. How to fix the Google `invalid_grant` error (expired refresh token)

---

## Build settings (Hostinger)

| Setting | Value |
|--------|--------|
| Framework | Vite |
| Node.js | 20.x |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | `/` |

After changing env vars: **Settings → Environment variables → Save → Redeploy**.

---

## Environment variables

Copy these into Hostinger (fill in your real values):

```
SITE_URL=https://tpclub.co
VITE_GTM_ID=GTM-MXWHXVKS
DASHBOARD_PASSWORD=your-dashboard-password
DASHBOARD_PROJECT_ROOT=/absolute/path/to/repository/on/server
DASHBOARD_REFRESH_COMMAND=npm run refresh:ads

GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token

META_AD_ACCOUNT_ID=act_...
META_ACCESS_TOKEN=your-meta-token

# Optional: waste alert to Telegram via n8n
N8N_WEBHOOK=https://your-n8n-instance/webhook/...
WASTE_ALERT_THRESHOLD_AED=200
```

**Important:** `DASHBOARD_PROJECT_ROOT` must be the real folder path on the server where the repo lives (not a URL). The dashboard “Refresh data” button runs `npm run refresh:ads` in that folder.

---

## How dashboard data refresh works

The dashboard is static HTML/JS. It does **not** call Google/Meta directly from the browser.

1. You click **Refresh data** on the dashboard (or a cron job runs).
2. Hostinger runs `public/dashboard/refresh-data.php`.
3. That runs `npm run refresh:ads` on the server.
4. The script writes `public/dashboard/data/ads-dashboard.json` (and `dist/...` if present).

### Optional cron (recommended)

In Hostinger: **Advanced → Cron Jobs**, every 15 minutes:

```
*/15 * * * * cd /absolute/path/to/repository && npm run refresh:ads >> /tmp/tpclub-ads-sync.log 2>&1
```

Replace the path with your real `DASHBOARD_PROJECT_ROOT`.

---

## Fix Google `invalid_grant` (refresh token expired)

**I cannot do this step for you** — it requires signing into your Google account in a browser. Your app can stay published; you only need a new refresh token.

### Why it breaks

`GOOGLE_ADS_REFRESH_TOKEN` is a long-lived key. It stops working when:

- You revoked app access in Google Account settings
- The OAuth client secret was regenerated
- The token is very old or was issued without `offline` access
- You used a different Google account than the one linked to Ads

The dashboard keeps showing **last good Google data** until you fix the token. Meta is unaffected.

### Step-by-step (about 5 minutes)

#### A. One-time: allow redirect in Google Cloud

**If you get `redirect_uri_mismatch`**, the URI in Google Cloud does not match the script exactly. Do this:

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Click the OAuth client whose **Client ID** matches `GOOGLE_ADS_CLIENT_ID` in your `.env` (first 8 chars should match).
3. Check **Application type**:
   - If it says **Desktop app** → create a **new** OAuth client with type **Web application** (easier for this flow), or use **Method B (Playground)** below.
   - If it says **Web application** → continue.
4. Under **Authorized redirect URIs**, click **Add URI** and paste **exactly** (copy-paste, no spaces):
   ```
   http://127.0.0.1:8080/
   ```
5. Click **Save**. Wait 1–2 minutes for Google to apply the change.
6. Run `npm run google:token` again.

**Still mismatch?** Add this second URI as well (some Google clients are picky about the trailing slash):
```
http://127.0.0.1:8080
```

**Using `localhost` instead?** Set in `.env` before running:
```
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/
```
Then add that **exact** string in Google Cloud redirect URIs.

#### B. Generate a new refresh token on your Mac

1. In the project folder, ensure `.env` has at least:
   ```
   GOOGLE_ADS_CLIENT_ID=...
   GOOGLE_ADS_CLIENT_SECRET=...
   ```
2. Run:
   ```bash
   npm run google:token
   ```
3. The terminal prints the **exact redirect URI** and a Google sign-in URL. Open the URL.
4. Sign in with the **Google account that has access to your Google Ads account** (manager or direct).
5. Click **Allow** / **Continue** if Google warns about an unverified app (normal for your own OAuth client).
6. Browser redirects to `127.0.0.1:8080` — terminal prints:
   ```
   GOOGLE_ADS_REFRESH_TOKEN=1//0g...
   ```
7. Copy that value into:
   - Your local `.env`
   - Hostinger → **Environment variables** → `GOOGLE_ADS_REFRESH_TOKEN`
8. **Redeploy** on Hostinger (or save env + redeploy).

#### Method B — OAuth Playground (no localhost, often easiest)

Use this if `redirect_uri_mismatch` keeps happening.

1. Google Cloud Console → **Credentials** → your OAuth client → **Authorized redirect URIs** → add:
   ```
   https://developers.google.com/oauthplayground
   ```
   Save.

2. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).

3. Click the **gear icon** (top right) → check **Use your own OAuth credentials** → paste your `GOOGLE_ADS_CLIENT_ID` and `GOOGLE_ADS_CLIENT_SECRET` from `.env`.

4. In **Step 1**, paste this scope in the input box (then **Authorize APIs**):
   ```
   https://www.googleapis.com/auth/adwords
   ```

5. Sign in with your Ads Google account → Allow.

6. **Step 2** → **Exchange authorization code for tokens**.

7. Copy the **Refresh token** from the response → paste as `GOOGLE_ADS_REFRESH_TOKEN` in `.env` and Hostinger → Redeploy.

#### C. Verify it works

On your Mac (with full `.env`):

```bash
npm run refresh:ads
```

You should **not** see `invalid_grant`. Google rows should update with today’s date.

On the server, open the dashboard and click **Refresh data**, or wait for cron.

### If you get “no refresh_token”

1. Go to [Google Account → Third-party access](https://myaccount.google.com/permissions).
2. Remove access for your OAuth app name.
3. Run `npm run google:token` again.

### If sync still fails after a new token

Check these env vars on Hostinger match your working local `.env`:

- `GOOGLE_ADS_CUSTOMER_ID` (digits only, no dashes)
- `GOOGLE_ADS_DEVELOPER_TOKEN` (from Google Ads API Center)
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (only if you use a manager account — optional)

---

## Waste Telegram alerts (optional)

If `N8N_WEBHOOK` and `WASTE_ALERT_THRESHOLD_AED` are set, each successful sync checks today’s wasted spend. Above the threshold, JSON is POSTed to n8n for Telegram.

The number in the dashboard UI is for display; the server uses `WASTE_ALERT_THRESHOLD_AED`.

---

## Dashboard behaviour in the browser

- Polls for newer JSON every 3 minutes
- Can trigger full API sync every 30 minutes (password in session)
- Shows per-platform “data through” dates and a banner when sync fails or data is behind

Default date preset: **Last 7 days** (remembered in the browser for the session).
