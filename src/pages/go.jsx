import { useEffect } from 'react';
import { getTrackingData } from '../utils/tracking.js';

const MAX_WEBHOOK_WAIT_MS = 1500;
const IP_LOOKUP_TIMEOUT_MS = 600;
const DEFAULT_TELEGRAM_URL = 'https://t.me/+5715hMkkOso3ZGY8';

async function fetchIpData() {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), IP_LOOKUP_TIMEOUT_MS);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return {};
    const data = await res.json();
    return {
      visitor_ip: data.ip || '',
      visitor_country: data.country || '',
      visitor_country_code: data.country_code || '',
      visitor_city: data.city || '',
      visitor_region: data.region || '',
      visitor_timezone: data.timezone?.id || ''
    };
  } catch {
    return {};
  }
}

function redirectToTelegram() {
  window.location.replace(DEFAULT_TELEGRAM_URL);
}

function getRedirectContext() {
  const redirectPath = window.location.pathname || '/go/';
  const locale = redirectPath.startsWith('/zh/') ? 'zh' : 'en';

  return {
    redirect_path: redirectPath,
    redirect_locale: locale,
    redirect_target: DEFAULT_TELEGRAM_URL
  };
}

async function sendWebhook(trackingData) {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK || '';
  if (!webhookUrl) return;

  const body = JSON.stringify(trackingData);

  if (navigator.sendBeacon) {
    navigator.sendBeacon(webhookUrl, new Blob([body], { type: 'application/json' }));
    return;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  });
}

function waitForTimeout() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MAX_WEBHOOK_WAIT_MS);
  });
}

export default function GoPage() {
  const isChineseRedirect = window.location.pathname.startsWith('/zh/');

  useEffect(() => {
    const baseData = {
      ...getTrackingData(),
      ...getRedirectContext()
    };

    let redirected = false;
    const redirectOnce = () => {
      if (redirected) return;
      redirected = true;
      redirectToTelegram();
    };

    async function track() {
      const ipData = await fetchIpData();
      const trackingData = {
        event: 'telegram_click',
        ...baseData,
        ...ipData
      };

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'telegram_click',
        tracking_data: trackingData
      });

      await sendWebhook(trackingData).catch(() => undefined);
    }

    Promise.race([
      track(),
      waitForTimeout()
    ]).finally(redirectOnce);

    return () => {
      redirected = true;
    };
  }, []);

  return (
    <main className="go-page" aria-live="polite">
      <div className="go-card">
        <img src="/images/logo.png" alt="TP Club" width="96" height="96" />
        <p className="go-eyebrow">TP Club</p>
        <h1>{isChineseRedirect ? '正在跳转到 Telegram...' : 'Redirecting to Telegram...'}</h1>
        <p>{isChineseRedirect ? '请稍候，我们正在打开 Telegram 学习社群。' : 'Please wait while we open the Telegram learning group.'}</p>
      </div>
    </main>
  );
}
