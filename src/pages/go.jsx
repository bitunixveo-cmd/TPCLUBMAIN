import { useEffect } from 'react';
import { trackTelegramClick } from '../utils/events.js';

const MAX_WAIT_MS = 1500;
const DEFAULT_TELEGRAM_URL = 'https://t.me/+5715hMkkOso3ZGY8';

function getRedirectContext() {
  const redirectPath = window.location.pathname || '/go/';
  return {
    redirect_path: redirectPath,
    redirect_locale: redirectPath.startsWith('/zh/') ? 'zh' : 'en',
    redirect_target: DEFAULT_TELEGRAM_URL
  };
}

export default function GoPage() {
  const isChineseRedirect = window.location.pathname.startsWith('/zh/');

  useEffect(() => {
    let redirected = false;
    const redirectOnce = () => {
      if (redirected) return;
      redirected = true;
      window.location.replace(DEFAULT_TELEGRAM_URL);
    };

    Promise.race([
      trackTelegramClick(getRedirectContext()),
      new Promise((resolve) => window.setTimeout(resolve, MAX_WAIT_MS))
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
