import { getTrackingData } from './tracking.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK || '';
const IS_DEV = import.meta.env.DEV;
const IP_TIMEOUT_MS = 600;
const REQUIRED_FIELDS = ['event', 'session_id', 'timestamp', 'current_page'];
const SESSION_SEEN_KEY = 'tpclub_seen_events';

// ── Plugin registry ───────────────────────────────────────────────────────────

const plugins = [];

/**
 * Register an async plugin that receives every final payload after the main
 * webhook. Use this to add PostHog, Meta CAPI, BigQuery, Segment, etc.
 * @param {(payload: object) => Promise<void>} fn
 */
export function registerPlugin(fn) {
  if (typeof fn === 'function') plugins.push(fn);
}

// ── In-memory deduplication ───────────────────────────────────────────────────
// Resets on page reload — prevents React strict-mode double-fire and rapid clicks.

const firedThisLoad = new Set();

// ── IP data cache ─────────────────────────────────────────────────────────────
// Fetched at most once per page load.

let cachedIpData = null;

async function fetchIpData() {
  if (cachedIpData) return cachedIpData;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), IP_TIMEOUT_MS);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return {};
    const data = await res.json();
    cachedIpData = {
      visitor_ip: data.ip || '',
      visitor_country: data.country || '',
      visitor_country_code: data.country_code || '',
      visitor_city: data.city || '',
      visitor_region: data.region || '',
      visitor_timezone: data.timezone?.id || ''
    };
    return cachedIpData;
  } catch {
    if (IS_DEV) console.warn('[TP tracking] IP lookup failed (non-blocking)');
    return {};
  }
}

// ── Transport ─────────────────────────────────────────────────────────────────

function dispatchWebhook(payload) {
  if (!WEBHOOK_URL) return Promise.resolve();

  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(WEBHOOK_URL, new Blob([body], { type: 'application/json' }));
    return Promise.resolve();
  }

  return fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch((err) => {
    if (IS_DEV) console.warn('[TP tracking] webhook fetch failed:', err);
  });
}

// ── GTM dataLayer ─────────────────────────────────────────────────────────────

function pushDataLayer(payload) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: payload.event,
    tracking_data: payload
  });
}

// ── Schema validation ─────────────────────────────────────────────────────────

function validatePayload(payload) {
  const missing = REQUIRED_FIELDS.filter((f) => !payload[f]);
  if (missing.length > 0) {
    if (IS_DEV) console.warn('[TP tracking] missing required fields:', missing, payload);
    return false;
  }
  return true;
}

// ── Session-level deduplication ───────────────────────────────────────────────
// Used for popup_view and other impression events that should fire at most once
// per browser session regardless of page navigations.

function hasSeenInSession(key) {
  try {
    const seen = JSON.parse(sessionStorage.getItem(SESSION_SEEN_KEY) || '[]');
    return seen.includes(key);
  } catch {
    return false;
  }
}

function markSeenInSession(key) {
  try {
    const seen = JSON.parse(sessionStorage.getItem(SESSION_SEEN_KEY) || '[]');
    if (!seen.includes(key)) {
      seen.push(key);
      sessionStorage.setItem(SESSION_SEEN_KEY, JSON.stringify(seen));
    }
  } catch {
    // storage unavailable — skip silently
  }
}

// ── Core trackEvent ───────────────────────────────────────────────────────────

/**
 * Universal event tracking function.
 *
 * @param {string} eventName
 * @param {object} extraData   Event-specific fields merged into payload
 * @param {object} options
 * @param {boolean} [options.includeIp=false]       Fetch and include visitor IP data
 * @param {boolean} [options.allowDuplicates=false]  Skip in-memory dedup for this event
 * @param {boolean} [options.sessionDedup=false]     Suppress if already fired this session
 * @param {boolean} [options.noWebhook=false]        Fire GTM only, skip webhook
 * @returns {Promise<void>}
 */
export async function trackEvent(eventName, extraData = {}, options = {}) {
  if (typeof window === 'undefined' || !eventName) {
    if (IS_DEV && !eventName) console.warn('[TP tracking] trackEvent called without eventName');
    return;
  }

  const dedupKey = `${eventName}:${extraData.popup_id || extraData.modal_id || extraData.dedup_id || ''}`;

  // In-memory dedup (rapid clicks, React strict mode)
  if (!options.allowDuplicates) {
    if (firedThisLoad.has(dedupKey)) {
      if (IS_DEV) console.info('[TP tracking] suppressed duplicate (in-memory):', dedupKey);
      return;
    }
    firedThisLoad.add(dedupKey);
  }

  // Session-level dedup (popup impressions across page navigations)
  if (options.sessionDedup) {
    if (hasSeenInSession(dedupKey)) {
      if (IS_DEV) console.info('[TP tracking] suppressed duplicate (session):', dedupKey);
      return;
    }
    markSeenInSession(dedupKey);
  }

  // Build payload — event and timestamp come last so they can never be
  // silently overwritten by stale storage data or extra fields.
  const ipData = options.includeIp ? await fetchIpData() : {};
  const payload = {
    ...getTrackingData(),
    ...extraData,
    ...ipData,
    event: eventName,
    timestamp: new Date().toISOString()
  };

  // Validate
  if (!validatePayload(payload)) return;

  // GTM
  pushDataLayer(payload);

  // Webhook
  if (!options.noWebhook) {
    await dispatchWebhook(payload);
  }

  // Plugins (PostHog, Meta CAPI, BigQuery, etc.)
  if (plugins.length > 0) {
    for (const plugin of plugins) {
      plugin(payload).catch((err) => {
        if (IS_DEV) console.warn('[TP tracking] plugin error:', err);
      });
    }
  }
}

// ── Helper functions ──────────────────────────────────────────────────────────

/** Fired on /go/ and /zh/go/ page mount — includes IP lookup */
export function trackTelegramClick(extraData = {}) {
  return trackEvent('telegram_click', {
    button_text: 'Join Telegram',
    ...extraData
  }, { includeIp: true });
}

/** Fired when any CTA link with data-track-cta is clicked */
export function trackCTA(buttonText, extraData = {}) {
  return trackEvent('cta_click', {
    button_text: buttonText,
    ...extraData
  }, { allowDuplicates: true });
}

/** Fired when a lead/contact form is submitted */
export function trackLeadSubmit(extraData = {}) {
  return trackEvent('lead_submit', extraData);
}

/** Fired when a modal is opened */
export function trackModalOpen(modalId, extraData = {}) {
  return trackEvent('modal_open', {
    modal_id: modalId,
    ...extraData
  });
}

/** Fired when a modal is closed */
export function trackModalClose(modalId, extraData = {}) {
  return trackEvent('modal_close', {
    modal_id: modalId,
    ...extraData
  }, { allowDuplicates: true });
}

/** Fired when the CTA inside a modal is clicked */
export function trackModalCTA(modalId, extraData = {}) {
  return trackEvent('modal_cta_click', {
    modal_id: modalId,
    ...extraData
  }, { allowDuplicates: true });
}

/**
 * Fired when a popup becomes visible.
 * Deduplicated per session — will not fire again for the same popupId
 * even if the user navigates between pages.
 */
export function trackPopupView(popupId, variant = '', extraData = {}) {
  return trackEvent('popup_view', {
    popup_id: popupId,
    popup_variant: variant,
    popup_trigger: extraData.popup_trigger || 'unknown',
    ...extraData
  }, { sessionDedup: true });
}

/** Fired when a popup is closed via the close button */
export function trackPopupClose(popupId, extraData = {}) {
  return trackEvent('popup_close', {
    popup_id: popupId,
    ...extraData
  }, { allowDuplicates: true });
}

/** Fired when the CTA inside a popup is clicked */
export function trackPopupCTA(popupId, extraData = {}) {
  return trackEvent('popup_cta_click', {
    popup_id: popupId,
    ...extraData
  }, { allowDuplicates: true });
}

/** Fired when a popup is dismissed (backdrop click, escape key, or timeout) */
export function trackPopupDismiss(popupId, extraData = {}) {
  return trackEvent('popup_dismiss', {
    popup_id: popupId,
    ...extraData
  }, { allowDuplicates: true });
}

// ── Dev-only globals ──────────────────────────────────────────────────────────
// Exposed on window in development mode so QA can manually fire and inspect
// events from the browser console. Stripped entirely from production bundles
// by Vite's dead-code elimination on the import.meta.env.DEV constant.

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.trackEvent = trackEvent;
  window.trackTelegramClick = trackTelegramClick;
  window.trackCTA = trackCTA;
  window.trackLeadSubmit = trackLeadSubmit;
  window.trackModalOpen = trackModalOpen;
  window.trackModalClose = trackModalClose;
  window.trackModalCTA = trackModalCTA;
  window.trackPopupView = trackPopupView;
  window.trackPopupClose = trackPopupClose;
  window.trackPopupCTA = trackPopupCTA;
  window.trackPopupDismiss = trackPopupDismiss;
  window.registerPlugin = registerPlugin;

  window.debugTracking = () => ({
    localStorage: (() => {
      try {
        return JSON.parse(localStorage.getItem('tpclub_tracking') || '{}');
      } catch {
        return null;
      }
    })(),
    sessionStorage: (() => {
      try {
        return {
          tracking: JSON.parse(sessionStorage.getItem('tpclub_tracking') || '{}'),
          landing_page: sessionStorage.getItem('tpclub_landing_page'),
          seen_events: JSON.parse(sessionStorage.getItem('tpclub_seen_events') || '[]')
        };
      } catch {
        return null;
      }
    })(),
    dataLayer: window.dataLayer || []
  });

  console.info(
    '%c[TP Tracking] Dev mode active — globals exposed on window.',
    'color: #aaff00; font-weight: bold;'
  );
  console.info('  trackEvent(name, extra, opts)  trackTelegramClick()  debugTracking()');
}
