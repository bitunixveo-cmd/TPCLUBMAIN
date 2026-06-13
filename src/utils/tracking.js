const TRACKING_STORAGE_KEY = 'tpclub_tracking';
const SESSION_ID_KEY = 'tpclub_session_id';
const LANDING_PAGE_KEY = 'tpclub_landing_page';
const INITIAL_REFERRER_KEY = 'tpclub_initial_referrer';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const ATTRIBUTION_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'ttclid'
];

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function safeStorage(storageType) {
  if (!isBrowser()) return null;

  try {
    const storage = window[storageType];
    const testKey = '__tpclub_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

function readJson(storage, key) {
  if (!storage) return {};

  try {
    return JSON.parse(storage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
}

function readCookieJson(key) {
  if (!isBrowser()) return {};

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${key}=`));

  if (!cookie) return {};

  try {
    return JSON.parse(decodeURIComponent(cookie.slice(key.length + 1))) || {};
  } catch {
    return {};
  }
}

function writeJson(storage, key, value) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function writeCookieJson(key, value) {
  if (!isBrowser()) return;

  document.cookie = [
    `${key}=${encodeURIComponent(JSON.stringify(value))}`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    'Path=/',
    'SameSite=Lax',
    window.location.protocol === 'https:' ? 'Secure' : ''
  ].filter(Boolean).join('; ');
}

function createSessionId() {
  if (isBrowser() && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `tp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateSessionId(sessionStorage, fallbackSessionId = '') {
  if (!sessionStorage) return fallbackSessionId || createSessionId();

  const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (existingSessionId) return existingSessionId;

  const sessionId = fallbackSessionId || createSessionId();
  sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  return sessionId;
}

function getUrlAttribution() {
  if (!isBrowser()) return {};

  const searchParams = new URLSearchParams(window.location.search);
  return ATTRIBUTION_KEYS.reduce((data, key) => {
    const value = searchParams.get(key);
    if (value) data[key] = value;
    return data;
  }, {});
}

function getUrlInternalData() {
  if (!isBrowser()) return {};

  const searchParams = new URLSearchParams(window.location.search);
  return {
    session_id: searchParams.get('_tp_session_id') || '',
    landing_page: searchParams.get('_tp_landing_page') || '',
    initial_referrer: searchParams.get('_tp_referrer') || ''
  };
}

function getPersistableData(data) {
  return {
    ...ATTRIBUTION_KEYS.reduce((persisted, key) => {
      if (data[key]) persisted[key] = data[key];
      return persisted;
    }, {}),
    session_id: data.session_id || '',
    landing_page: data.landing_page || '',
    initial_referrer: data.initial_referrer || ''
  };
}

function getPageData(sessionStorage, fallbackSessionId = '') {
  if (!isBrowser()) return {};

  const screenResolution = window.screen
    ? `${window.screen.width}x${window.screen.height}`
    : '';
  const sessionId = getOrCreateSessionId(sessionStorage, fallbackSessionId);

  return {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    landing_page: sessionStorage?.getItem(LANDING_PAGE_KEY) || window.location.href,
    initial_referrer: sessionStorage?.getItem(INITIAL_REFERRER_KEY) || document.referrer || '',
    current_page: window.location.href,
    referrer: document.referrer || '',
    user_agent: window.navigator.userAgent || '',
    language: window.navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen_resolution: screenResolution
  };
}

export function initTracking() {
  if (!isBrowser()) return {};

  const local = safeStorage('localStorage');
  const session = safeStorage('sessionStorage');
  const urlAttribution = getUrlAttribution();
  const urlInternalData = getUrlInternalData();
  const cookieData = readCookieJson(TRACKING_STORAGE_KEY);
  const existingLocalData = readJson(local, TRACKING_STORAGE_KEY);
  const existingSessionData = readJson(session, TRACKING_STORAGE_KEY);
  const fallbackSessionId = urlInternalData.session_id
    || existingSessionData.session_id
    || cookieData.session_id
    || existingLocalData.session_id
    || '';

  if (session && !session.getItem(LANDING_PAGE_KEY)) {
    session.setItem(LANDING_PAGE_KEY, urlInternalData.landing_page || window.location.href);
  }

  if (session && !session.getItem(INITIAL_REFERRER_KEY)) {
    session.setItem(INITIAL_REFERRER_KEY, urlInternalData.initial_referrer || document.referrer || '');
  }

  const trackingData = {
    ...cookieData,
    ...existingLocalData,
    ...existingSessionData,
    ...Object.fromEntries(Object.entries(urlInternalData).filter(([, value]) => value)),
    ...urlAttribution,
    ...getPageData(session, fallbackSessionId)
  };

  writeJson(local, TRACKING_STORAGE_KEY, trackingData);
  writeJson(session, TRACKING_STORAGE_KEY, trackingData);
  writeCookieJson(TRACKING_STORAGE_KEY, getPersistableData(trackingData));

  return trackingData;
}

export function getTrackingData() {
  if (!isBrowser()) return {};

  const local = safeStorage('localStorage');
  const session = safeStorage('sessionStorage');
  const cookieData = readCookieJson(TRACKING_STORAGE_KEY);
  const fallbackSessionId = cookieData.session_id || readJson(local, TRACKING_STORAGE_KEY).session_id || '';
  const trackingData = {
    ...cookieData,
    ...readJson(local, TRACKING_STORAGE_KEY),
    ...readJson(session, TRACKING_STORAGE_KEY),
    ...getUrlAttribution(),
    ...Object.fromEntries(Object.entries(getUrlInternalData()).filter(([, value]) => value)),
    ...getPageData(session, fallbackSessionId)
  };

  writeJson(local, TRACKING_STORAGE_KEY, trackingData);
  writeJson(session, TRACKING_STORAGE_KEY, trackingData);
  writeCookieJson(TRACKING_STORAGE_KEY, getPersistableData(trackingData));

  return trackingData;
}

export function decorateLinkWithTracking(link) {
  if (!isBrowser() || !link?.href) return;

  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  if (url.hash && url.pathname === window.location.pathname && !url.search) return;

  const data = getTrackingData();
  ATTRIBUTION_KEYS.forEach((key) => {
    if (data[key] && !url.searchParams.has(key)) {
      url.searchParams.set(key, data[key]);
    }
  });

  if (data.session_id && !url.searchParams.has('_tp_session_id')) {
    url.searchParams.set('_tp_session_id', data.session_id);
  }

  if (data.landing_page && !url.searchParams.has('_tp_landing_page')) {
    url.searchParams.set('_tp_landing_page', data.landing_page);
  }

  if (data.initial_referrer && !url.searchParams.has('_tp_referrer')) {
    url.searchParams.set('_tp_referrer', data.initial_referrer);
  }

  link.href = url.toString();
}

export function decorateInternalLinks() {
  if (!isBrowser()) return;
  document.querySelectorAll('a[href]').forEach(decorateLinkWithTracking);
}

export function isLikelyBot() {
  if (!isBrowser()) return false;

  const userAgent = window.navigator.userAgent || '';
  return /bot|crawler|spider|crawling|googlebot|bingbot|applebot|baiduspider|yandex|duckduckbot|slurp|facebookexternalhit|facebot|twitterbot|linkedinbot|embedly|quora link preview|pinterest|whatsapp|telegrambot|discordbot|preview/i.test(userAgent);
}
