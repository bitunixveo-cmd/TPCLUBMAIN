import { useEffect } from 'react';
import { getTrackingData } from '../utils/tracking.js';

const MAX_WEBHOOK_WAIT_MS = 1000;
const DEFAULT_TELEGRAM_URL = 'https://t.me/+5715hMkkOso3ZGY8';

function redirectToTelegram() {
  const telegramUrl = import.meta.env.VITE_TELEGRAM_URL || DEFAULT_TELEGRAM_URL;
  window.location.replace(telegramUrl);
}

async function sendWebhook() {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK || '';
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(getTrackingData()),
    keepalive: true
  });
}

function waitForTimeout() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MAX_WEBHOOK_WAIT_MS);
  });
}

export default function GoPage() {
  useEffect(() => {
    const trackingData = getTrackingData();

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'telegram_click',
      tracking_data: trackingData
    });

    let redirected = false;
    const redirectOnce = () => {
      if (redirected) return;
      redirected = true;
      redirectToTelegram();
    };

    Promise.race([
      sendWebhook().catch(() => undefined),
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
        <h1>Redirecting to Telegram...</h1>
        <p>Please wait while we open the Telegram learning group.</p>
      </div>
    </main>
  );
}
