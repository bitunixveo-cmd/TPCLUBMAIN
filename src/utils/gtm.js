import { getTrackingData, isLikelyBot } from './tracking.js';

const GTM_ID = import.meta.env.VITE_GTM_ID || '';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getDataLayer() {
  if (!isBrowser()) return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

export function pageView(overrides = {}) {
  if (!isBrowser() || !GTM_ID) return;
  if (isLikelyBot()) return;

  getDataLayer().push({
    event: 'page_view',
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    ...getTrackingData(),
    ...overrides
  });
}
