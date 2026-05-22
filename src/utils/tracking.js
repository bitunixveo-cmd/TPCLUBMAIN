const TRACKING_STORAGE_KEY = 'tpclub_tracking';
const SESSION_ID_KEY = 'tpclub_session_id';
const ATTRIBUTION_KEYS = [
  'gclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid'
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

function writeJson(storage, key, value) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function createSessionId() {
  if (isBrowser() && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `tp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateSessionId(sessionStorage) {
  if (!sessionStorage) return createSessionId();

  const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (existingSessionId) return existingSessionId;

  const sessionId = createSessionId();
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

function getPageData(sessionStorage) {
  if (!isBrowser()) return {};

  const screenResolution = window.screen
    ? `${window.screen.width}x${window.screen.height}`
    : '';

  return {
    session_id: getOrCreateSessionId(sessionStorage),
    timestamp: new Date().toISOString(),
    landing_page: sessionStorage?.getItem('tpclub_landing_page') || window.location.href,
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
  const existingLocalData = readJson(local, TRACKING_STORAGE_KEY);
  const existingSessionData = readJson(session, TRACKING_STORAGE_KEY);

  if (session && !session.getItem('tpclub_landing_page')) {
    session.setItem('tpclub_landing_page', window.location.href);
  }

  const trackingData = {
    ...existingLocalData,
    ...existingSessionData,
    ...urlAttribution,
    ...getPageData(session)
  };

  writeJson(local, TRACKING_STORAGE_KEY, trackingData);
  writeJson(session, TRACKING_STORAGE_KEY, trackingData);

  return trackingData;
}

export function getTrackingData() {
  if (!isBrowser()) return {};

  const local = safeStorage('localStorage');
  const session = safeStorage('sessionStorage');
  const trackingData = {
    ...readJson(local, TRACKING_STORAGE_KEY),
    ...readJson(session, TRACKING_STORAGE_KEY),
    ...getPageData(session)
  };

  writeJson(local, TRACKING_STORAGE_KEY, trackingData);
  writeJson(session, TRACKING_STORAGE_KEY, trackingData);

  return trackingData;
}
