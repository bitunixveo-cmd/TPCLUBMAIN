let chartsModulePromise = null;
let chartsRenderToken = 0;

function loadChartsModule() {
  if (!chartsModulePromise) {
    chartsModulePromise = import('./dashboard-charts.js');
  }
  return chartsModulePromise;
}

function setChartPanelsLoading(isLoading) {
  document.querySelectorAll('.echart-panel').forEach((panel) => {
    panel.classList.toggle('is-chart-loading', isLoading);
  });
}

async function resizeDashboardCharts() {
  const charts = await loadChartsModule();
  charts.resizeDashboardCharts();
}

function flagEmoji(code) {
  const normalized = String(code || '').toUpperCase();
  if (normalized.length !== 2) return '';
  return String.fromCodePoint(...[...normalized].map((char) => 0x1F1E6 + char.charCodeAt(0) - 65));
}

const fallbackRows = [
  { date: '2026-06-01', platform: 'Google Ads', account: 'TP Club Google', campaign: 'Telegram Signup Search', status: 'ENABLED', location: 'United Arab Emirates', countryCode: 'AE', spend: 420, clicks: 510, impressions: 8400, conversions: 42 },
  { date: '2026-06-02', platform: 'Google Ads', account: 'TP Club Google', campaign: 'Telegram Signup Search', status: 'ENABLED', location: 'India', countryCode: 'IN', spend: 360, clicks: 438, impressions: 7900, conversions: 34 },
  { date: '2026-06-03', platform: 'Google Ads', account: 'TP Club Google', campaign: 'Crypto Education Search', status: 'PAUSED', location: 'Pakistan', countryCode: 'PK', spend: 270, clicks: 288, impressions: 6200, conversions: 18 },
  { date: '2026-06-04', platform: 'Meta Ads', account: 'TP Club Meta', campaign: 'Telegram Free Trial Leads', status: 'ACTIVE', location: 'United Arab Emirates', countryCode: 'AE', spend: 390, clicks: 820, impressions: 18600, conversions: 58 },
  { date: '2026-06-05', platform: 'Meta Ads', account: 'TP Club Meta', campaign: 'Chinese Crypto Community', status: 'PAUSED', location: 'Saudi Arabia', countryCode: 'SA', spend: 240, clicks: 510, impressions: 11400, conversions: 27 },
  { date: '2026-06-06', platform: 'Meta Ads', account: 'TP Club Meta', campaign: 'Retargeting Telegram Join', status: 'ACTIVE', location: 'Australia', countryCode: 'AU', spend: 145, clicks: 280, impressions: 5200, conversions: 22 }
];

const fallbackKeywordRows = [
  { date: '2026-06-01', platform: 'Google Ads', account: 'TP Club Google', campaign: 'Telegram Signup Search', adGroup: 'Telegram', keyword: 'crypto telegram group', matchType: 'PHRASE', spend: 185, clicks: 170, impressions: 2800, conversions: 18 },
  { date: '2026-06-02', platform: 'Google Ads', account: 'TP Club Google', campaign: 'Crypto Education Search', adGroup: 'Education', keyword: 'learn crypto trading', matchType: 'EXACT', spend: 142, clicks: 118, impressions: 2100, conversions: 11 }
];

let adRows = fallbackRows;
let targetedLocationRows = [];
let keywordRows = fallbackKeywordRows;
let searchTermRows = [];
let creativeRows = [];
let leafletMap = null;
let leafletLayer = null;
let dashboardRefreshPassword = '';
let activeTrendMetric = 'spend';
let activeSearchIntelTab = 'waste';
let keywordMinSpend = 10;
let keywordMinSpendEnabled = true;
let kpiSecondaryExpanded = false;
let keywordColumnsExpanded = false;
let selectedCampaignKey = '';
const syncMeta = { generatedAtMs: 0 };
const liveUpdateState = { isRefreshing: false, jsonPollTimer: null, apiSyncTimer: null };

function getLiveRefreshConfig() {
  const config = (window.__DASHBOARD_AUTH__ && window.__DASHBOARD_AUTH__.liveRefresh) || {};
  return {
    enabled: config.enabled !== false,
    staleAfterMs: (config.staleAfterMinutes || 20) * 60 * 1000,
    apiSyncIntervalMs: (config.apiSyncMinutes || 30) * 60 * 1000,
    jsonPollIntervalMs: (config.jsonPollMinutes || 3) * 60 * 1000
  };
}

function getRefreshEndpoint() {
  return window.__DASHBOARD_AUTH__ && window.__DASHBOARD_AUTH__.refreshEndpoint;
}

function getStoredRefreshPassword() {
  return dashboardRefreshPassword || sessionStorage.getItem(refreshPasswordStorageKey) || '';
}

const defaultTargets = {
  monthlyBudget: 10000,
  targetCpa: 150,
  targetCpc: 1.5,
  targetCvr: 1
};

const countryCoordinates = {
  AE: [23.4241, 53.8478],
  AU: [-25.2744, 133.7751],
  BH: [26.0667, 50.5577],
  CA: [56.1304, -106.3468],
  DE: [51.1657, 10.4515],
  FR: [46.2276, 2.2137],
  GB: [55.3781, -3.4360],
  IN: [20.5937, 78.9629],
  KW: [29.3117, 47.4818],
  OM: [21.4735, 55.9754],
  PK: [30.3753, 69.3451],
  QA: [25.3548, 51.1839],
  SA: [23.8859, 45.0792],
  SG: [1.3521, 103.8198],
  US: [37.0902, -95.7129]
};

const countryNameToCode = {
  'United Arab Emirates': 'AE',
  Australia: 'AU',
  Bahrain: 'BH',
  Canada: 'CA',
  Germany: 'DE',
  France: 'FR',
  'United Kingdom': 'GB',
  India: 'IN',
  Kuwait: 'KW',
  Oman: 'OM',
  Pakistan: 'PK',
  Qatar: 'QA',
  'Saudi Arabia': 'SA',
  Singapore: 'SG',
  'United States': 'US'
};

function resolveCountryCode(country) {
  const raw = String(country.countryCode || '').toUpperCase();
  if (raw.length === 2 && countryCoordinates[raw]) return raw;
  return countryNameToCode[country.name] || '';
}

function countryFlagUrl(code) {
  const normalized = String(code || '').toLowerCase();
  if (normalized.length !== 2) return '';
  return `https://flagcdn.com/w40/${normalized}.png`;
}

function countryFlagMarkup(code, { className = '', width = 24, height = 17 } = {}) {
  const url = countryFlagUrl(code);
  if (!url) return '';
  return `<img class="${className}" src="${url}" alt="" width="${width}" height="${height}" loading="lazy" decoding="async">`;
}

const listState = {
  accounts: false,
  locations: false,
  campaigns: false,
  keywords: false,
  health: false,
  recommendations: false,
  countryDrilldown: false,
  searchTerms: false,
  creatives: false
};

const filters = {
  platform: document.querySelector('#platformFilter'),
  datePreset: document.querySelector('#datePresetFilter'),
  account: document.querySelector('#accountFilter'),
  status: document.querySelector('#statusFilter'),
  campaign: document.querySelector('#campaignFilter'),
  locationType: document.querySelector('#locationTypeFilter'),
  location: document.querySelector('#locationFilter'),
  conversionMetric: document.querySelector('#conversionMetricFilter'),
  from: document.querySelector('#fromDate'),
  to: document.querySelector('#toDate'),
  monthlyBudget: document.querySelector('#monthlyBudgetTarget'),
  targetCpa: document.querySelector('#targetCpa'),
  targetCpc: document.querySelector('#targetCpc'),
  targetCvr: document.querySelector('#targetCvr')
};

const elements = {
  auth: document.querySelector('#dashboardAuth'),
  authForm: document.querySelector('#dashboardAuthForm'),
  authPassword: document.querySelector('#dashboardPassword'),
  authError: document.querySelector('#dashboardAuthError'),
  app: document.querySelector('#dashboardApp'),
  totalSpend: document.querySelector('#totalSpend'),
  totalImpressions: document.querySelector('#totalImpressions'),
  totalClicks: document.querySelector('#totalClicks'),
  totalConversions: document.querySelector('#totalConversions'),
  ctr: document.querySelector('#ctr'),
  cpc: document.querySelector('#cpc'),
  costPerConversion: document.querySelector('#costPerConversion'),
  wastedSpend: document.querySelector('#wastedSpend'),
  conversionRate: document.querySelector('#conversionRate'),
  spendNote: document.querySelector('#spendNote'),
  spendDelta: document.querySelector('#spendDelta'),
  conversionsDelta: document.querySelector('#conversionsDelta'),
  cpaDelta: document.querySelector('#cpaDelta'),
  wasteDelta: document.querySelector('#wasteDelta'),
  dataThroughPill: document.querySelector('#dataThroughPill'),
  toggleSecondaryKpis: document.querySelector('#toggleSecondaryKpis'),
  secondaryKpiGrid: document.querySelector('#secondaryKpiGrid'),
  executiveSnapshot: document.querySelector('#executiveSnapshot'),
  budgetPacing: document.querySelector('#budgetPacing'),
  forecastGrid: document.querySelector('#forecastGrid'),
  targetScorecard: document.querySelector('#targetScorecard'),
  anomalyGrid: document.querySelector('#anomalyGrid'),
  selectedRange: document.querySelector('#selectedRange'),
  platformBreakdown: document.querySelector('#platformBreakdown'),
  accountBreakdown: document.querySelector('#accountBreakdown'),
  keywordWasteChart: document.querySelector('#keywordWasteChart'),
  searchTermWasteChart: document.querySelector('#searchTermWasteChart'),
  matchTypeChart: document.querySelector('#matchTypeChart'),
  searchIntelCharts: document.querySelector('#searchIntelCharts'),
  searchIntelPanel: document.querySelector('#searchIntelPanel'),
  keywordTableWrap: document.querySelector('#keywordTableWrap'),
  keywordTableActions: document.querySelector('.keyword-table-actions'),
  toggleKeywordColumns: document.querySelector('#toggleKeywordColumns'),
  keywordMinSpendToggle: document.querySelector('#keywordMinSpendToggle'),
  exportWastedKeywords: document.querySelector('#exportWastedKeywords'),
  exportWastedSearchTerms: document.querySelector('#exportWastedSearchTerms'),
  copyNegativesList: document.querySelector('#copyNegativesList'),
  searchIntelTabButtons: document.querySelectorAll('[data-search-tab]'),
  countrySpendChart: document.querySelector('#countrySpendChart'),
  printReportMeta: document.querySelector('#printReportMeta'),
  campaignChart: document.querySelector('#campaignChart'),
  managementSummary: document.querySelector('#managementSummary'),
  actionsPanel: document.querySelector('#actionsPanel'),
  trendChart: document.querySelector('#trendChart'),
  trendMetricButtons: document.querySelectorAll('[data-trend-metric]'),
  metricLineChart: document.querySelector('#metricLineChart'),
  comparisonGrid: document.querySelector('#comparisonGrid'),
  funnelView: document.querySelector('#funnelView'),
  locationBreakdown: document.querySelector('#locationBreakdown'),
  countryMap: document.querySelector('#countryMap'),
  countryTooltip: document.querySelector('#countryTooltip'),
  chartFloatingTooltip: document.querySelector('#chartFloatingTooltip'),
  campaignDrilldown: document.querySelector('#campaignDrilldown'),
  countryDrilldown: document.querySelector('#countryDrilldown'),
  campaignRows: document.querySelector('#campaignRows'),
  keywordRows: document.querySelector('#keywordRows'),
  creativeRows: document.querySelector('#creativeRows'),
  refreshData: document.querySelector('#refreshData'),
  exportCsv: document.querySelector('#exportCsv'),
  printReport: document.querySelector('#printReport'),
  copySummary: document.querySelector('#copySummary'),
  toggleFilters: document.querySelector('#toggleFilters'),
  filterPanel: document.querySelector('#dashboardFilters'),
  showToggles: document.querySelectorAll('[data-toggle-list]'),
  resetFilters: document.querySelector('#resetFilters'),
  syncStatus: document.querySelector('#syncStatus'),
  syncSubtext: document.querySelector('#syncSubtext'),
  syncDot: document.querySelector('.sync-dot'),
  filterNotice: document.querySelector('#filterNotice')
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0
});

const currencyPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'AED',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const number = new Intl.NumberFormat('en-US');
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const authStorageKey = 'tpclub_dashboard_unlocked';
const refreshPasswordStorageKey = 'tpclub_dashboard_refresh_password';

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hashBuffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function unlockDashboard() {
  document.body.classList.remove('dashboard-locked');
  if (elements.auth) elements.auth.hidden = true;
  if (elements.app) elements.app.hidden = false;
}

function clearDashboardData() {
  adRows = [];
  targetedLocationRows = [];
  keywordRows = [];
  searchTermRows = [];
  creativeRows = [];
}

async function requireDashboardAuth() {
  const expectedHash = window.__DASHBOARD_AUTH__ && window.__DASHBOARD_AUTH__.passwordHash;
  if (!expectedHash) {
    if (elements.authError) elements.authError.textContent = 'Dashboard password is not configured.';
    return false;
  }

  if (sessionStorage.getItem(authStorageKey) === expectedHash) {
    dashboardRefreshPassword = sessionStorage.getItem(refreshPasswordStorageKey) || '';
    unlockDashboard();
    return true;
  }

  return new Promise((resolve) => {
    elements.authForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const typedHash = await sha256(elements.authPassword.value);
      if (typedHash === expectedHash) {
        dashboardRefreshPassword = elements.authPassword.value;
        sessionStorage.setItem(authStorageKey, expectedHash);
        sessionStorage.setItem(refreshPasswordStorageKey, dashboardRefreshPassword);
        unlockDashboard();
        resolve(true);
        return;
      }

      elements.authPassword.value = '';
      elements.authPassword.focus();
      elements.authError.textContent = 'Incorrect password.';
    }, { once: false });
  });
}

function uniqueValues(key) {
  return [...new Set(adRows.map((row) => row[key]))].sort();
}

const dayMs = 24 * 60 * 60 * 1000;

function earliestAvailableDate() {
  const dates = uniqueValues('date');
  return dates.length ? dates[0] : '';
}

function latestAvailableDate() {
  const dates = uniqueValues('date');
  return dates.length ? dates[dates.length - 1] : '';
}

function calendarTodayIso() {
  const now = new Date();
  return isoFromDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

function dateRangeOverlapsAvailable(fromValue, toValue) {
  const earliest = earliestAvailableDate();
  const latest = latestAvailableDate();
  if (!earliest || !latest || !fromValue || !toValue) return true;
  return fromValue <= latest && toValue >= earliest;
}

function syncStalenessNote() {
  const latest = latestAvailableDate();
  const today = calendarTodayIso();
  if (!latest || latest >= today) return '';
  const daysBehind = Math.round((parseDateInput(today).getTime() - parseDateInput(latest).getTime()) / dayMs);
  return ` Syncing newer days (${daysBehind} day(s) behind ${today}).`;
}

function needsLiveApiRefresh() {
  const latest = latestAvailableDate();
  const today = calendarTodayIso();
  if (latest && latest < today) return true;
  if (!syncMeta.generatedAtMs) return true;
  return Date.now() - syncMeta.generatedAtMs > getLiveRefreshConfig().staleAfterMs;
}

function setLiveSyncVisual(isActive) {
  if (elements.syncDot) {
    elements.syncDot.classList.toggle('is-syncing', isActive);
  }
}

function updateDateInputBounds() {
  const earliest = earliestAvailableDate();
  const latest = latestAvailableDate();
  const today = calendarTodayIso();
  if (!earliest) return;
  const maxDate = !latest || today > latest ? today : latest;
  filters.from.min = earliest;
  filters.from.max = maxDate;
  filters.to.min = earliest;
  filters.to.max = maxDate;
}

function addOptions(select, values) {
  select.querySelectorAll('option:not([value="all"])').forEach((option) => option.remove());

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function setupFilters() {
  addOptions(filters.platform, uniqueValues('platform'));
  refreshDependentFilters();

  setDatePreset(filters.datePreset.value || 'last30');
  updateDateInputBounds();
}

function locationSourceRowsForCurrentView() {
  if (filters.locationType.value === 'targeted') return targetedLocationRows;
  if (filters.locationType.value === 'all') return [...adRows, ...targetedLocationRows];
  return adRows;
}

function matchesStatus(row) {
  if (filters.status.value === 'all') return true;
  return statusClass(row.status) === filters.status.value;
}

function matchesConversionMetric(row) {
  if (filters.conversionMetric.value === 'all') return true;
  if (filters.conversionMetric.value === 'with-conversions') return row.conversions > 0;
  if (filters.conversionMetric.value === 'zero-conversions') return row.conversions === 0;
  if (filters.conversionMetric.value === 'google') return row.platform === 'Google Ads';
  if (filters.conversionMetric.value === 'meta') return row.platform === 'Meta Ads';
  return true;
}

function matchesDate(row) {
  return (!filters.from.value || row.date >= filters.from.value) && (!filters.to.value || row.date <= filters.to.value);
}

function matchesDashboardFilters(row, { includeDate = true } = {}) {
  const matchesPlatform = filters.platform.value === 'all' || row.platform === filters.platform.value;
  const matchesAccount = filters.account.value === 'all' || row.account === filters.account.value;
  const matchesCampaign = filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
  const matchesLocation = !row.location || filters.location.value === 'all' || row.location === filters.location.value;
  const matchesDateRange = !includeDate || matchesDate(row);
  const matchesStatusFilter = !row.status || matchesStatus(row);

  return matchesPlatform && matchesAccount && matchesCampaign && matchesLocation &&
    matchesDateRange && matchesStatusFilter && matchesConversionMetric(row);
}

function rowHasActivity(row) {
  return row.spend > 0 || row.clicks > 0 || row.impressions > 0 || row.conversions > 0;
}

function setDatePreset(preset) {
  if (preset === 'custom') return;

  const dates = uniqueValues('date');
  const latestDataDate = parseDateInput(dates.slice(-1)[0]);
  if (!latestDataDate) return;

  const earliestDataDate = parseDateInput(dates[0]);
  let from = new Date(latestDataDate);
  let to = new Date(latestDataDate);

  if (preset === 'latest') {
    // Newest date in synced data.
  } else if (preset === 'today') {
    const todayDate = parseDateInput(calendarTodayIso());
    if (todayDate) {
      from = todayDate;
      to = todayDate;
    }
  } else if (preset === 'yesterday') {
    const todayDate = parseDateInput(calendarTodayIso());
    if (todayDate) {
      from = new Date(todayDate.getTime() - dayMs);
      to = new Date(todayDate.getTime() - dayMs);
    }
  } else if (preset === 'yesterdaySynced') {
    from = new Date(latestDataDate.getTime() - dayMs);
    to = new Date(latestDataDate.getTime() - dayMs);
    if (earliestDataDate && from < earliestDataDate) {
      from = new Date(earliestDataDate);
      to = new Date(earliestDataDate);
    }
  } else if (preset === 'last7') {
    from = new Date(latestDataDate.getTime() - 6 * dayMs);
  } else if (preset === 'last30') {
    from = new Date(latestDataDate.getTime() - 30 * dayMs);
  } else if (preset === 'thisMonth') {
    from = new Date(Date.UTC(latestDataDate.getUTCFullYear(), latestDataDate.getUTCMonth(), 1));
  } else if (preset === 'previousMonth') {
    from = new Date(Date.UTC(latestDataDate.getUTCFullYear(), latestDataDate.getUTCMonth() - 1, 1));
    to = new Date(Date.UTC(latestDataDate.getUTCFullYear(), latestDataDate.getUTCMonth(), 0));
  }

  if (earliestDataDate && from < earliestDataDate) {
    from = new Date(earliestDataDate);
  }

  filters.from.value = isoFromDate(from);
  filters.to.value = isoFromDate(to);
}

function valuesForFilter(key) {
  const source = key === 'location' ? locationSourceRowsForCurrentView() : adRows;
  return [...new Set(source
    .filter((row) => {
      const matchesPlatform = key === 'platform' || filters.platform.value === 'all' || row.platform === filters.platform.value;
      const matchesAccount = key === 'account' || filters.account.value === 'all' || row.account === filters.account.value;
      const matchesCampaign = key === 'campaign' || filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
      const matchesLocation = key === 'location' || filters.location.value === 'all' || row.location === filters.location.value;
      return matchesPlatform && matchesAccount && matchesCampaign && matchesLocation &&
        matchesDate(row) && matchesStatus(row) && matchesConversionMetric(row) && rowHasActivity(row);
    })
    .map((row) => row[key]))].sort();
}

function syncFilterDependencies() {
  refreshDependentFilters();

  const campaigns = groupCampaignRows(getFilteredRows());
  if (selectedCampaignKey && !campaigns.some((row) => campaignKey(row) === selectedCampaignKey)) {
    selectedCampaignKey = '';
  }
}

function refreshSelect(select, values) {
  const current = select.value;
  addOptions(select, values);
  select.value = values.includes(current) ? current : 'all';
}

function refreshDependentFilters() {
  refreshSelect(filters.account, valuesForFilter('account'));
  refreshSelect(filters.campaign, valuesForFilter('campaign'));
  refreshSelect(filters.location, valuesForFilter('location'));
}

function setSyncStatus(status, subtext) {
  if (elements.syncStatus) elements.syncStatus.textContent = status;
  if (elements.syncSubtext) elements.syncSubtext.textContent = subtext;
}

function sourceSummary(source) {
  if (!source) return 'not configured';
  if (source.ok) return `ok, ${source.rowCount || 0} rows`;
  return `failed: ${source.error || 'unknown error'}`;
}

async function loadSyncedRows({ preserveExisting = false } = {}) {
  try {
    const response = await fetch(`/dashboard/data/ads-dashboard.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('No synced dashboard data found');

    const payload = await response.json();
    if (!Array.isArray(payload.rows) || !payload.rows.length) {
      throw new Error('Synced dashboard data has no rows');
    }

    adRows = payload.rows.map((row) => ({
      date: row.date,
      platform: row.platform,
      account: row.account,
      campaign: row.campaign,
      status: row.status || 'UNKNOWN',
      locationType: row.locationType || 'delivered',
      location: row.location || row.countryName || row.countryCode || 'Unknown',
      countryCode: row.countryCode || row.location || 'NA',
      spend: Number(row.spend || 0),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      conversions: Number(row.conversions || 0)
    }));
    targetedLocationRows = Array.isArray(payload.targetedLocationRows) ? payload.targetedLocationRows.map((row) => ({
      date: row.date,
      platform: row.platform,
      account: row.account,
      campaign: row.campaign,
      status: row.status || 'UNKNOWN',
      locationType: row.locationType || 'targeted',
      location: row.location || row.countryName || row.countryCode || 'Unknown',
      countryCode: row.countryCode || row.location || 'NA',
      spend: Number(row.spend || 0),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      conversions: Number(row.conversions || 0)
    })) : [];
    keywordRows = Array.isArray(payload.keywordRows) ? payload.keywordRows.map((row) => ({
      date: row.date,
      platform: row.platform || 'Google Ads',
      account: row.account,
      campaign: row.campaign,
      adGroup: row.adGroup || 'Unknown ad group',
      keyword: row.keyword || 'Unknown keyword',
      matchType: row.matchType || '',
      spend: Number(row.spend || 0),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      conversions: Number(row.conversions || 0)
    })) : [];
    searchTermRows = Array.isArray(payload.searchTermRows) ? payload.searchTermRows.map((row) => ({
      date: row.date,
      platform: row.platform || 'Google Ads',
      account: row.account,
      campaign: row.campaign,
      adGroup: row.adGroup || 'Unknown ad group',
      searchTerm: row.searchTerm || 'Unknown search term',
      spend: Number(row.spend || 0),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      conversions: Number(row.conversions || 0)
    })) : [];
    creativeRows = Array.isArray(payload.creativeRows) ? payload.creativeRows.map((row) => ({
      date: row.date,
      platform: row.platform || 'Meta Ads',
      account: row.account,
      campaign: row.campaign,
      adSet: row.adSet || 'Unknown ad set',
      adName: row.adName || 'Unknown ad',
      location: row.location || row.countryCode || 'Unknown',
      spend: Number(row.spend || 0),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      conversions: Number(row.conversions || 0)
    })) : [];

    syncMeta.generatedAtMs = payload.generatedAt ? new Date(payload.generatedAt).getTime() : Date.now();
    const generatedAt = payload.generatedAt ? new Date(payload.generatedAt).toLocaleString() : 'just now';
    const rangeText = payload.range && payload.range.from && payload.range.to ? `${payload.range.from} to ${payload.range.to}` : 'last synced range';
    const latestDay = latestAvailableDate();
    const throughText = latestDay ? ` Reporting through ${latestDay}.` : '';
    const liveNote = getRefreshEndpoint() && getLiveRefreshConfig().enabled ? ' Auto-sync is on while this tab is open.' : '';
    setSyncStatus('Live reporting data', `Updated ${generatedAt}.${throughText}${syncStalenessNote()}${liveNote} Range: ${rangeText}. Google: ${sourceSummary(payload.sources && payload.sources.google)}. Meta: ${sourceSummary(payload.sources && payload.sources.meta)}.`);
    updateDateInputBounds();
  } catch (error) {
    if (!preserveExisting) {
      clearDashboardData();
    }
    setSyncStatus('Live data unavailable', `${error.message}. Use Refresh data after server refresh is configured.`);
    return false;
  }

  return true;
}

function getFilteredRows({ includeDate = true } = {}) {
  return adRows.filter((row) => matchesDashboardFilters(row, { includeDate }));
}

function getFilteredLocationRows() {
  const sourceRows = locationSourceRowsForCurrentView();

  return sourceRows.filter((row) => {
    const matchesLocationType = filters.locationType.value === 'all' || row.locationType === filters.locationType.value ||
      (filters.locationType.value === 'converting' && row.conversions > 0) ||
      (filters.locationType.value === 'wasted' && row.spend > 0 && row.conversions === 0);

    return matchesDashboardFilters(row) && matchesLocationType;
  }).filter(rowHasActivity);
}

function summarize(rows) {
  return rows.reduce((summary, row) => {
    summary.spend += row.spend;
    summary.clicks += row.clicks;
    summary.impressions += row.impressions || 0;
    summary.conversions += row.conversions;
    if (row.spend > 0 && row.conversions === 0) summary.wastedSpend += row.spend;
    return summary;
  }, { spend: 0, clicks: 0, impressions: 0, conversions: 0, wastedSpend: 0 });
}

function groupRows(rows, key) {
  const groups = new Map();

  rows.forEach((row) => {
    const groupKey = row[key];
    const current = groups.get(groupKey) || { name: groupKey, countryCode: row.countryCode, spend: 0, clicks: 0, impressions: 0, conversions: 0, wastedSpend: 0 };
    current.spend += row.spend;
    current.clicks += row.clicks;
    current.impressions += row.impressions || 0;
    current.conversions += row.conversions;
    if (row.spend > 0 && row.conversions === 0) current.wastedSpend += row.spend;
    groups.set(groupKey, current);
  });

  return [...groups.values()].sort((a, b) => b.conversions - a.conversions || a.spend / Math.max(a.conversions, 1) - b.spend / Math.max(b.conversions, 1));
}

function groupCampaignRows(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const key = [row.platform, row.account, row.campaign, row.location].join('|');
    const current = groups.get(key) || {
      platform: row.platform,
      account: row.account,
      campaign: row.campaign,
      status: row.status || 'UNKNOWN',
      location: row.location,
      countryCode: row.countryCode,
      spend: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
      wastedSpend: 0,
      latestDate: ''
    };
    current.spend += row.spend;
    current.clicks += row.clicks;
    current.impressions += row.impressions || 0;
    current.conversions += row.conversions;
    if (row.spend > 0 && row.conversions === 0) current.wastedSpend += row.spend;
    if (!current.latestDate || row.date > current.latestDate) {
      current.latestDate = row.date;
      current.status = row.status || current.status;
    }
    groups.set(key, current);
  });

  return [...groups.values()].sort((a, b) => b.conversions - a.conversions || costPer(a) - costPer(b));
}

function costPer(row) {
  return row.conversions ? row.spend / row.conversions : row.spend;
}

function formatCostPerConversion(row, emptyLabel = 'No conversions') {
  if (row.conversions) return currency.format(row.spend / row.conversions);
  if (row.spend > 0) return `${currency.format(row.spend)} / 0 conv.`;
  return emptyLabel;
}

function conversionRate(row) {
  return row.clicks ? (row.conversions / row.clicks) * 100 : 0;
}

function clickThroughRate(row) {
  return row.impressions ? (row.clicks / row.impressions) * 100 : 0;
}

function costPerClick(row) {
  return row.clicks ? row.spend / row.clicks : 0;
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoFromDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateRange(from, to) {
  if (!from || !to) return 'selected range';
  return `${shortDate.format(from)} - ${shortDate.format(to)}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function kpiTooltip(row, extraMetrics = []) {
  const metrics = [
    ...extraMetrics,
    ['Spend', currency.format(row.spend || 0)],
    ['Impressions', number.format(row.impressions || 0)],
    ['Clicks', number.format(row.clicks || 0)],
    ['Ad conversions', number.format(row.conversions || 0)],
    ['CTR', formatPercent(clickThroughRate(row))],
    ['CPC', currencyPrecise.format(costPerClick(row))],
    ['CPA', formatCostPerConversion(row)],
    ['Ad CVR', formatPercent(conversionRate(row))],
    ['Wasted spend', currency.format(row.wastedSpend || 0)]
  ];

  return `
    <div class="chart-tooltip" role="tooltip">
      ${metrics.map(([label, value]) => `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`).join('')}
    </div>
  `;
}

function shareMetrics(row, total) {
  return [
    ['Spend share', formatPercent(total.spend ? ((row.spend || 0) / total.spend) * 100 : 0)],
    ['Conv. share', formatPercent(total.conversions ? ((row.conversions || 0) / total.conversions) * 100 : 0)]
  ];
}

function getTargets() {
  return {
    monthlyBudget: Number(filters.monthlyBudget && filters.monthlyBudget.value) || defaultTargets.monthlyBudget,
    targetCpa: Number(filters.targetCpa && filters.targetCpa.value) || defaultTargets.targetCpa,
    targetCpc: Number(filters.targetCpc && filters.targetCpc.value) || defaultTargets.targetCpc,
    targetCvr: Number(filters.targetCvr && filters.targetCvr.value) || defaultTargets.targetCvr
  };
}

function getCurrentRangeDates() {
  const currentFrom = parseDateInput(filters.from.value) || parseDateInput(uniqueValues('date')[0]);
  const currentTo = parseDateInput(filters.to.value) || parseDateInput(uniqueValues('date').slice(-1)[0]);
  return { currentFrom, currentTo };
}

function getRangeDays(from, to) {
  if (!from || !to) return 1;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((to - from) / dayMs) + 1);
}

function monthProgress(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return { day, daysInMonth, progress: day / daysInMonth };
}

function getPreviousSummary() {
  const { currentFrom, currentTo } = getCurrentRangeDates();
  if (!currentFrom || !currentTo) return { current: summarize([]), previous: summarize([]), currentFrom, currentTo, previousFrom: null, previousTo: null };

  const dayMs = 24 * 60 * 60 * 1000;
  const rangeDays = getRangeDays(currentFrom, currentTo);
  const previousTo = new Date(currentFrom.getTime() - dayMs);
  const previousFrom = new Date(previousTo.getTime() - (rangeDays - 1) * dayMs);
  const currentFromIso = isoFromDate(currentFrom);
  const currentToIso = isoFromDate(currentTo);
  const previousFromIso = isoFromDate(previousFrom);
  const previousToIso = isoFromDate(previousTo);
  const baseRows = getFilteredRows({ includeDate: false });

  return {
    current: summarize(baseRows.filter((row) => row.date >= currentFromIso && row.date <= currentToIso)),
    previous: summarize(baseRows.filter((row) => row.date >= previousFromIso && row.date <= previousToIso)),
    currentFrom,
    currentTo,
    previousFrom,
    previousTo
  };
}

function deltaPercent(currentValue, previousValue) {
  if (!previousValue) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

function targetTone(metric, actual, target) {
  if (!target) return 'neutral';
  if (metric === 'cpa' || metric === 'cpc') {
    if (actual <= target) return 'positive';
    if (actual <= target * 1.25) return 'warning';
    return 'negative';
  }
  if (actual >= target) return 'positive';
  if (actual >= target * 0.75) return 'warning';
  return 'negative';
}

function targetStatus(metric, actual, target) {
  const tone = targetTone(metric, actual, target);
  if (tone === 'positive') return 'On target';
  if (tone === 'warning') return 'Watch';
  return 'Off target';
}

function campaignKey(row) {
  return [row.platform, row.account, row.campaign].join('|');
}

function selectedCampaignRows() {
  if (!selectedCampaignKey) return [];
  return getFilteredRows().filter((row) => campaignKey(row) === selectedCampaignKey);
}

function performanceColor(row) {
  const targets = getTargets();
  if (row.spend > 0 && row.conversions === 0) return '#ff5ca8';
  if (row.conversions > 0 && costPer(row) <= targets.targetCpa) return '#aaff00';
  if (row.conversions > 0) return '#ffb84d';
  return '#4da3ff';
}

function positionChartTooltip(event, sourceElement) {
  if (!elements.chartFloatingTooltip || elements.chartFloatingTooltip.hidden) return;

  const tooltip = elements.chartFloatingTooltip;
  const sourceRect = sourceElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const pointerX = event && 'clientX' in event ? event.clientX : sourceRect.left + sourceRect.width / 2;
  const pointerY = event && 'clientY' in event ? event.clientY : sourceRect.top;
  const margin = 14;
  const maxLeft = window.innerWidth - tooltipRect.width - margin;
  const left = Math.max(margin, Math.min(maxLeft, pointerX - tooltipRect.width / 2));
  const above = pointerY - tooltipRect.height - 18;
  const below = pointerY + 18;
  const top = above > margin ? above : Math.min(window.innerHeight - tooltipRect.height - margin, below);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${Math.max(margin, top)}px`;
}

function showChartTooltip(sourceElement, event) {
  const tooltipContent = sourceElement.querySelector('.chart-tooltip');
  if (!tooltipContent || !elements.chartFloatingTooltip) return;

  elements.chartFloatingTooltip.innerHTML = tooltipContent.innerHTML;
  elements.chartFloatingTooltip.hidden = false;
  positionChartTooltip(event, sourceElement);
  elements.chartFloatingTooltip.classList.add('is-visible');
}

function hideChartTooltip() {
  if (!elements.chartFloatingTooltip) return;
  elements.chartFloatingTooltip.classList.remove('is-visible');
  elements.chartFloatingTooltip.hidden = true;
}

function toneForMetric(type, value) {
  if (type === 'good') return 'positive';
  if (type === 'bad') return 'negative';
  if (type === 'warning') return 'warning';
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

function visibleRows(rows, listName) {
  return listState[listName] ? rows : rows.slice(0, 5);
}

function updateToggle(listName, totalCount) {
  const button = [...elements.showToggles].find((toggle) => toggle.dataset.toggleList === listName);
  if (!button) return;

  button.hidden = totalCount <= 5;
  button.textContent = listState[listName] ? 'Show top 5' : `Show all ${totalCount}`;
}

function statusClass(status = '') {
  const normalized = status.toLowerCase();
  if (['enabled', 'active'].includes(normalized)) return 'active';
  if (['paused', 'inactive'].includes(normalized)) return 'paused';
  return 'unknown';
}

function statusLabel(status = 'UNKNOWN') {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusBadge(status) {
  return `<span class="status-badge ${statusClass(status)}"><span aria-hidden="true"></span>${statusLabel(status)}</span>`;
}

function platformClass(platform = '') {
  return platform === 'Meta Ads' ? 'meta' : 'google';
}

function platformShortLabel(platform = '') {
  return platform === 'Meta Ads' ? 'Meta' : 'Google';
}

function platformBadge(platform = '', compact = false) {
  if (!platform) return '';
  const shortLabel = platformShortLabel(platform);
  const isMeta = platform === 'Meta Ads';
  const icon = isMeta
    ? `<svg viewBox="0 0 64 40" aria-hidden="true" focusable="false"><path d="M7 28C12 11 19 4 28 19l4 7 4-7C45 4 52 11 57 28c2 7-7 11-13 2l-8-12-4 7-4-7-8 12C14 39 5 35 7 28Z"/></svg>`
    : `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path class="g-blue" d="M44 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h11.5c-.2 1.9-1.5 4.9-4.3 6.8v5.1h7c4.1-3.8 5.8-9.3 5.8-15.6Z"/><path class="g-green" d="M24 45c5.9 0 10.8-1.9 14.3-5.2l-7-5.1c-1.9 1.3-4.4 2.2-7.3 2.2-5.6 0-10.4-3.8-12.1-8.9H4.7v5.3C8.3 40.2 15.5 45 24 45Z"/><path class="g-yellow" d="M11.9 28c-.4-1.3-.7-2.6-.7-4s.2-2.7.7-4v-5.3H4.7C3.2 17.5 2.4 20.7 2.4 24s.8 6.5 2.3 9.3L11.9 28Z"/><path class="g-red" d="M24 11.1c3.2 0 6.1 1.1 8.4 3.3l6.2-6.2C34.8 4.7 29.9 2.5 24 2.5 15.5 2.5 8.3 7.4 4.7 14.7l7.2 5.3c1.7-5.1 6.5-8.9 12.1-8.9Z"/></svg>`;
  return `<span class="platform-tag ${platformClass(platform)} ${compact ? 'compact' : ''}" title="${platform}" aria-label="${platform}">${icon}</span>`;
}

function campaignWithPlatform(row) {
  return `<span class="campaign-name">${platformBadge(row.platform, true)}<span>${row.campaign}</span></span>`;
}

function changeText(value) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

function deltaToneClass(value, invertGood = false) {
  if (!value) return 'delta-neutral';
  const good = invertGood ? value < 0 : value > 0;
  const bad = invertGood ? value > 0 : value < 0;
  if (good) return 'delta-positive';
  if (bad) return 'delta-negative';
  return 'delta-neutral';
}

function setKpiDelta(el, current, previous, invertGood = false) {
  if (!el) return;
  if (!previous) {
    el.textContent = '';
    el.className = 'kpi-delta';
    return;
  }
  const pct = deltaPercent(current, previous);
  el.textContent = changeText(pct);
  el.className = `kpi-delta ${deltaToneClass(pct, invertGood)}`;
}

function keywordRowsWithMinSpend() {
  const rows = getFilteredKeywordRows();
  if (!keywordMinSpendEnabled || !keywordMinSpend) return rows;
  return rows.filter((row) => row.spend >= keywordMinSpend);
}

function wastedSearchTerms() {
  return filteredSearchTerms()
    .filter((row) => row.spend > 0 && row.conversions === 0 && (!keywordMinSpendEnabled || !keywordMinSpend || row.spend >= keywordMinSpend))
    .sort((a, b) => b.spend - a.spend);
}

function winnerKeywords() {
  return groupKeywordRows(keywordRowsWithMinSpend())
    .filter((row) => row.conversions > 0)
    .sort((a, b) => costPer(a) - costPer(b));
}

function winnerSearchTerms() {
  return filteredSearchTerms()
    .filter((row) => row.conversions > 0 && (!keywordMinSpendEnabled || !keywordMinSpend || row.spend >= keywordMinSpend))
    .sort((a, b) => costPer(a) - costPer(b));
}

function matchTypeBreakdown(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.matchType || 'UNKNOWN';
    const current = groups.get(key) || { matchType: key, spend: 0, conversions: 0, clicks: 0 };
    current.spend += row.spend;
    current.conversions += row.conversions;
    current.clicks += row.clicks;
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => b.spend - a.spend);
}

function downloadCsv(filename, header, lines) {
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return text.includes(',') || text.includes('"') || text.includes('\n') ? `"${text.replace(/"/g, '""')}"` : text;
}

function groupDaily(rows) {
  return groupRows(rows, 'date').sort((a, b) => a.name.localeCompare(b.name));
}

function filteredCampaignGroups() {
  return groupCampaignRows(getFilteredRows()).filter(rowHasActivity);
}

function filteredSearchTerms() {
  if (filters.platform.value === 'Meta Ads') return [];
  return searchTermRows.filter((row) => matchesDashboardFilters(row));
}

function filteredCreatives() {
  if (filters.platform.value === 'Google Ads') return [];
  return creativeRows.filter((row) => matchesDashboardFilters(row));
}

function renderOpportunities(rows) {
  const campaigns = filteredCampaignGroups();
  const converters = campaigns.filter((row) => row.conversions > 0);
  const wasted = campaigns.filter((row) => row.spend > 0 && row.conversions === 0).sort((a, b) => b.spend - a.spend)[0];
  const bestConv = converters[0];
  const bestCost = converters.sort((a, b) => costPer(a) - costPer(b))[0];
  const bestCtr = campaigns.filter((row) => row.impressions > 0).sort((a, b) => clickThroughRate(b) - clickThroughRate(a))[0];
  const bestCountry = groupRows(rows, 'location')[0];

  const cards = [
    { label: 'Highest conversions', row: bestConv, value: bestConv ? campaignWithPlatform(bestConv) : 'No data', detail: bestConv ? `${number.format(bestConv.conversions)} conv. · ${currency.format(bestConv.spend)}` : '', tone: 'positive' },
    { label: 'Lowest cost / conv.', row: bestCost, value: bestCost ? campaignWithPlatform(bestCost) : 'No data', detail: bestCost ? formatCostPerConversion(bestCost) : '', tone: 'positive' },
    { label: 'Highest wasted spend', row: wasted, value: wasted ? campaignWithPlatform(wasted) : 'No wasted spend', detail: wasted ? `${currency.format(wasted.spend)} with 0 conv.` : '', tone: wasted ? 'negative' : 'positive' },
    { label: 'Best CTR', row: bestCtr, value: bestCtr ? campaignWithPlatform(bestCtr) : 'No data', detail: bestCtr ? `${formatPercent(clickThroughRate(bestCtr))} CTR` : '', tone: 'positive' },
    { label: 'Best country', value: bestCountry ? bestCountry.name : 'No data', detail: bestCountry ? `${number.format(bestCountry.conversions)} conv. · ${currency.format(bestCountry.spend)}` : '', tone: 'positive' }
  ];

  elements.opportunityGrid.innerHTML = cards.map((card) => `
    <article class="insight-card ${card.tone}">
      <span>${card.label}</span>
      <strong>${card.value}</strong>
      <small>${card.detail}</small>
    </article>
  `).join('');
}

function renderManagementSummary(rows) {
  const summary = summarize(rows);
  const platformGroups = groupRows(rows, 'platform');
  const countries = groupRows(rows, 'location');
  const campaigns = filteredCampaignGroups();
  const bestPlatform = platformGroups.filter((row) => row.conversions > 0).sort((a, b) => costPer(a) - costPer(b))[0];
  const bestCampaign = campaigns.filter((row) => row.conversions > 0).sort((a, b) => b.conversions - a.conversions)[0];
  const worstCampaign = campaigns.filter((row) => row.spend > 0 && row.conversions === 0).sort((a, b) => b.spend - a.spend)[0];
  const bestCountry = countries.filter((row) => row.conversions > 0).sort((a, b) => b.conversions - a.conversions)[0];
  const messages = [
    {
      tone: summary.conversions > 0 ? 'positive' : 'negative',
      title: summary.conversions > 0 ? 'Conversions are being tracked' : 'No conversions in selected view',
      body: `${number.format(summary.conversions)} ad-platform conversions from ${currency.format(summary.spend)} spend. Cost per conversion is ${formatCostPerConversion(summary)}.`
    },
    {
      tone: bestPlatform ? 'positive' : 'neutral',
      title: bestPlatform ? `${bestPlatform.name} is currently strongest` : 'No platform winner yet',
      body: bestPlatform ? `${formatCostPerConversion(bestPlatform)} per conversion across ${number.format(bestPlatform.conversions)} conversions.` : 'Not enough conversion data to rank platforms.'
    },
    {
      tone: bestCampaign ? 'positive' : 'neutral',
      title: bestCampaign ? `Best campaign: ${campaignWithPlatform(bestCampaign)}` : 'No campaign winner yet',
      body: bestCampaign ? `${number.format(bestCampaign.conversions)} conversions at ${formatCostPerConversion(bestCampaign)} each.` : 'No campaign has conversion data in this filter.'
    },
    {
      tone: worstCampaign ? 'negative' : 'positive',
      title: worstCampaign ? `Fix wasted spend: ${campaignWithPlatform(worstCampaign)}` : 'No major wasted campaign spend',
      body: worstCampaign ? `${currency.format(worstCampaign.spend)} spent with 0 conversions.` : 'Selected campaigns have no obvious zero-conversion spend issue.'
    },
    {
      tone: bestCountry ? 'positive' : 'neutral',
      title: bestCountry ? `Best country: ${bestCountry.name}` : 'No country winner yet',
      body: bestCountry ? `${number.format(bestCountry.conversions)} conversions from ${currency.format(bestCountry.spend)} spend.` : 'Country-level conversion data is not available for this filter.'
    }
  ];

  elements.managementSummary.innerHTML = messages.map((message) => `
    <article class="summary-card ${message.tone}">
      <strong>${message.title}</strong>
      <p>${message.body}</p>
    </article>
  `).join('');
}

function renderAlerts() {
  const campaigns = filteredCampaignGroups();
  const keywords = getFilteredKeywordRows();
  const countries = groupRows(getFilteredRows(), 'location');
  const alerts = [
    ...campaigns.filter((row) => row.spend > 0 && row.conversions === 0).slice(0, 4).map((row) => `Campaign "${row.campaign}" spent ${currency.format(row.spend)} with 0 conversions.`),
    ...keywords.filter((row) => row.clicks >= 5 && row.conversions === 0).slice(0, 3).map((row) => `Keyword "${row.keyword}" has ${number.format(row.clicks)} clicks with 0 conversions.`),
    ...countries.filter((row) => row.spend > 100 && conversionRate(row) < 1).slice(0, 3).map((row) => `${row.name} has weak conversion rate at ${formatPercent(conversionRate(row))}.`)
  ];

  elements.alertList.innerHTML = (alerts.length ? alerts : ['No major wasted-spend alerts for this filter.']).map((alert) => `
    <div class="alert-item"><span aria-hidden="true">!</span>${alert}</div>
  `).join('');
}

function renderExecutiveSnapshot(rows) {
  if (!elements.executiveSnapshot) return;
  const summary = summarize(rows);
  const { current, previous } = getPreviousSummary();
  const cpaCurrent = current.conversions ? current.spend / current.conversions : 0;
  const cpaPrevious = previous.conversions ? previous.spend / previous.conversions : 0;
  const spendPct = deltaPercent(current.spend, previous.spend);
  const convPct = deltaPercent(current.conversions, previous.conversions);
  const cpaPct = cpaPrevious ? deltaPercent(cpaCurrent, cpaPrevious) : 0;
  const wastePct = deltaPercent(current.wastedSpend, previous.wastedSpend);

  elements.executiveSnapshot.innerHTML = `
    <p class="exec-scorecard-line">
      <span>Spend <strong>${currency.format(summary.spend)}</strong> <em class="${deltaToneClass(spendPct)}">${previous.spend ? changeText(spendPct) : '—'}</em></span>
      <span class="exec-sep">·</span>
      <span>${number.format(summary.conversions)} conv <em class="${deltaToneClass(convPct)}">${previous.conversions ? changeText(convPct) : '—'}</em></span>
      <span class="exec-sep">·</span>
      <span>CPA <strong>${formatCostPerConversion(summary)}</strong> <em class="${deltaToneClass(cpaPct, true)}">${cpaPrevious ? changeText(cpaPct) : '—'}</em></span>
      <span class="exec-sep">·</span>
      <span>Waste <strong>${currency.format(summary.wastedSpend)}</strong> <em class="${deltaToneClass(wastePct, true)}">${previous.wastedSpend ? changeText(wastePct) : '—'}</em></span>
    </p>
  `;
}

function renderPlanningTools(rows) {
  const targets = getTargets();
  const summary = summarize(rows);
  const { currentTo } = getCurrentRangeDates();
  const paceDate = currentTo || new Date();
  const month = monthProgress(paceDate);
  const expectedSpend = targets.monthlyBudget * month.progress;
  const pacingDelta = summary.spend - expectedSpend;
  const rangeDays = getRangeDays(...Object.values(getCurrentRangeDates()));
  const dailySpend = summary.spend / rangeDays;
  const dailyClicks = summary.clicks / rangeDays;
  const dailyConversions = summary.conversions / rangeDays;
  const forecastSpend = dailySpend * month.daysInMonth;
  const forecastClicks = dailyClicks * month.daysInMonth;
  const forecastConversions = dailyConversions * month.daysInMonth;
  const forecastCpa = forecastConversions ? forecastSpend / forecastConversions : 0;
  const cpa = summary.conversions ? summary.spend / summary.conversions : 0;
  const cpc = costPerClick(summary);
  const cvr = conversionRate(summary);

  if (elements.budgetPacing) {
    const pacePercent = targets.monthlyBudget ? Math.min(140, (summary.spend / targets.monthlyBudget) * 100) : 0;
    const tone = pacingDelta > targets.monthlyBudget * 0.12 ? 'negative' : pacingDelta < -targets.monthlyBudget * 0.12 ? 'warning' : 'positive';
    elements.budgetPacing.innerHTML = `
      <article class="pacing-card ${tone}">
        <div>
          <span>Budget pacing</span>
          <strong>${pacingDelta >= 0 ? 'Over pace' : 'Under pace'}</strong>
          <p>${currency.format(summary.spend)} spent vs ${currency.format(expectedSpend)} expected by now. Monthly budget: ${currency.format(targets.monthlyBudget)}.</p>
        </div>
        <div class="pacing-meter"><i style="width:${Math.max(3, pacePercent)}%"></i></div>
      </article>
    `;
  }

  if (elements.forecastGrid) {
    const forecastCards = [
      ['Projected spend', currency.format(forecastSpend), `At ${currency.format(dailySpend)} / day`],
      ['Projected clicks', number.format(Math.round(forecastClicks)), `At ${number.format(Math.round(dailyClicks))} / day`],
      ['Projected conversions', number.format(Math.round(forecastConversions)), `At ${dailyConversions.toFixed(1)} / day`],
      ['Projected CPA', forecastCpa ? currency.format(forecastCpa) : 'No conversions', 'Based on current pace']
    ];
    elements.forecastGrid.innerHTML = forecastCards.map(([label, value, detail]) => `
      <article class="summary-card neutral"><span>${label}</span><strong>${value}</strong><p>${detail}</p></article>
    `).join('');
  }

  if (elements.targetScorecard) {
    const targetCards = [
      ['CPA target', cpa ? currency.format(cpa) : 'No conversions', `${targetStatus('cpa', cpa, targets.targetCpa)} · target ${currency.format(targets.targetCpa)}`, targetTone('cpa', cpa || targets.targetCpa * 2, targets.targetCpa)],
      ['CPC target', currencyPrecise.format(cpc), `${targetStatus('cpc', cpc, targets.targetCpc)} · target ${currencyPrecise.format(targets.targetCpc)}`, targetTone('cpc', cpc, targets.targetCpc)],
      ['CVR target', formatPercent(cvr), `${targetStatus('cvr', cvr, targets.targetCvr)} · target ${formatPercent(targets.targetCvr)}`, targetTone('cvr', cvr, targets.targetCvr)],
      ['Waste control', currency.format(summary.wastedSpend), summary.wastedSpend ? 'Reduce zero-conversion spend' : 'Clean spend profile', summary.wastedSpend > summary.spend * 0.25 ? 'negative' : 'positive']
    ];
    elements.targetScorecard.innerHTML = targetCards.map(([label, value, detail, tone]) => `
      <article class="summary-card ${tone}"><span>${label}</span><strong>${value}</strong><p>${detail}</p></article>
    `).join('');
  }
}

function renderAnomalies() {
  if (!elements.anomalyGrid) return;
  const { current, previous } = getPreviousSummary();
  const currentCpa = current.conversions ? current.spend / current.conversions : 0;
  const previousCpa = previous.conversions ? previous.spend / previous.conversions : 0;
  const currentCtr = clickThroughRate(current);
  const previousCtr = clickThroughRate(previous);
  const currentCpc = costPerClick(current);
  const previousCpc = costPerClick(previous);
  const anomalies = [
    { label: 'CPA movement', value: previousCpa ? changeText(deltaPercent(currentCpa, previousCpa)) : 'No baseline', detail: `${formatCostPerConversion(current)} now vs ${formatCostPerConversion(previous)} previous`, tone: previousCpa && currentCpa > previousCpa * 1.25 ? 'negative' : 'neutral' },
    { label: 'CTR movement', value: previousCtr ? changeText(deltaPercent(currentCtr, previousCtr)) : 'No baseline', detail: `${formatPercent(currentCtr)} now vs ${formatPercent(previousCtr)} previous`, tone: previousCtr && currentCtr < previousCtr * 0.8 ? 'negative' : 'positive' },
    { label: 'CPC movement', value: previousCpc ? changeText(deltaPercent(currentCpc, previousCpc)) : 'No baseline', detail: `${currencyPrecise.format(currentCpc)} now vs ${currencyPrecise.format(previousCpc)} previous`, tone: previousCpc && currentCpc > previousCpc * 1.2 ? 'warning' : 'positive' },
    { label: 'Conversion movement', value: previous.conversions ? changeText(deltaPercent(current.conversions, previous.conversions)) : 'No baseline', detail: `${number.format(current.conversions)} now vs ${number.format(previous.conversions)} previous`, tone: current.conversions >= previous.conversions ? 'positive' : 'negative' }
  ];

  elements.anomalyGrid.innerHTML = anomalies.map((item) => `
    <article class="summary-card ${item.tone}"><span>${item.label}</span><strong>${item.value}</strong><p>${item.detail}</p></article>
  `).join('');
}

function buildTrendDays(rows) {
  const groupedDays = new Map(groupDaily(rows).map((day) => [day.name, day]));
  const latestDate = parseDateInput(filters.to.value) || parseDateInput(uniqueValues('date').slice(-1)[0]);
  const earliestDate = parseDateInput(filters.from.value) || latestDate;
  const chartDayMs = 24 * 60 * 60 * 1000;
  const selectedDays = latestDate && earliestDate ? Math.max(1, Math.round((latestDate - earliestDate) / chartDayMs) + 1) : 30;
  const chartDays = Math.min(30, selectedDays);

  if (!latestDate) return groupDaily(rows).slice(-30);

  return Array.from({ length: chartDays }, (_, index) => {
    const date = new Date(latestDate.getTime() - (chartDays - 1 - index) * chartDayMs);
    const name = isoFromDate(date);
    return groupedDays.get(name) || { name, spend: 0, clicks: 0, impressions: 0, conversions: 0, wastedSpend: 0 };
  });
}

const chartFormatters = {
  currency: (value) => currency.format(value),
  number: (value) => number.format(value),
  percent: (value) => formatPercent(value),
  cpc: (row) => currencyPrecise.format(costPerClick(row)),
  cpa: (row) => formatCostPerConversion(row),
  ctr: (row) => clickThroughRate(row),
  metricValue: (row, metric) => metricValue(row, metric),
  formatMetric: (value, metric) => formatMetricValue(value, metric),
  campaignLabel: (row) => campaignWithPlatform(row),
  campaignKey: (row) => campaignKey(row),
  countryCode: (row) => resolveCountryCode(row),
  flagUrl: (code) => countryFlagUrl(code),
  flagEmoji: (code) => flagEmoji(code)
};

function onChartDayClick(date) {
  filters.datePreset.value = 'custom';
  filters.from.value = date;
  filters.to.value = date;
  syncFilterDependencies();
  renderDashboard();
}

function onChartPlatformClick(name) {
  filters.platform.value = name;
  syncFilterDependencies();
  renderDashboard();
}

function onChartCampaignClick(key) {
  selectedCampaignKey = selectedCampaignKey === key ? '' : key;
  renderDashboard();
}

function onChartAccountClick(name) {
  filters.account.value = name;
  syncFilterDependencies();
  renderDashboard();
}

function onChartCountryClick(name) {
  filters.location.value = name;
  syncFilterDependencies();
  renderDashboard();
}

function groupKeywordRows(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const current = groups.get(row.keyword) || {
      keyword: row.keyword,
      spend: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0
    };
    current.spend += row.spend;
    current.clicks += row.clicks;
    current.impressions += row.impressions || 0;
    current.conversions += row.conversions;
    groups.set(row.keyword, current);
  });
  return [...groups.values()];
}

function wastedKeywords() {
  return groupKeywordRows(keywordRowsWithMinSpend())
    .filter((row) => row.spend > 0 && row.conversions === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
}

async function renderEchartSections(rows, locationRows) {
  const token = ++chartsRenderToken;
  setChartPanelsLoading(true);

  try {
    const charts = await loadChartsModule();
    if (token !== chartsRenderToken) return;

    const days = buildTrendDays(rows);
    charts.renderSpendConversionTrendChart(elements.trendChart, days, chartFormatters, onChartDayClick);
    charts.renderMetricTrendChart(elements.metricLineChart, days, activeTrendMetric, chartFormatters, onChartDayClick);
    charts.renderPlatformChart(elements.platformBreakdown, groupRows(rows, 'platform'), chartFormatters, onChartPlatformClick);

    const accountGroups = visibleRows(groupRows(rows, 'account'), 'accounts');
    updateToggle('accounts', groupRows(rows, 'account').length);
    charts.renderAccountChart(elements.accountBreakdown, accountGroups, chartFormatters, onChartAccountClick);

    const campaigns = filteredCampaignGroups().slice(0, 8);
    charts.renderCampaignEchart(
      elements.campaignChart,
      campaigns,
      chartFormatters,
      onChartCampaignClick,
      selectedCampaignKey
    );

    charts.renderKeywordWasteChart(elements.keywordWasteChart, wastedKeywords(), chartFormatters);
    charts.renderSearchTermWasteChart(elements.searchTermWasteChart, wastedSearchTerms().slice(0, 10), chartFormatters);
    charts.renderMatchTypeChart(elements.matchTypeChart, matchTypeBreakdown(keywordRowsWithMinSpend()), chartFormatters);

    const countries = groupRows(locationRows, 'location').slice(0, 10);
    charts.renderCountrySpendChart(elements.countrySpendChart, countries, chartFormatters, onChartCountryClick);
  } finally {
    if (token === chartsRenderToken) {
      setChartPanelsLoading(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resizeDashboardCharts());
      });
    }
  }
}

function renderTrendChart() {
  // Charts render in renderEchartSections.
}

function metricValue(row, metric) {
  if (metric === 'clicks') return row.clicks || 0;
  if (metric === 'conversions') return row.conversions || 0;
  if (metric === 'cpc') return costPerClick(row);
  if (metric === 'cpa') return row.conversions ? row.spend / row.conversions : 0;
  return row.spend || 0;
}

function formatMetricValue(value, metric) {
  if (metric === 'spend' || metric === 'cpa') return currency.format(value);
  if (metric === 'cpc') return currencyPrecise.format(value);
  return number.format(Math.round(value));
}

function renderComparison() {
  const currentFrom = parseDateInput(filters.from.value) || parseDateInput(uniqueValues('date')[0]);
  const currentTo = parseDateInput(filters.to.value) || parseDateInput(uniqueValues('date').slice(-1)[0]);
  if (!currentFrom || !currentTo) {
    elements.comparisonGrid.innerHTML = '<div class="empty-state">No comparison data.</div>';
    return;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const rangeDays = Math.max(1, Math.round((currentTo - currentFrom) / dayMs) + 1);
  const previousTo = new Date(currentFrom.getTime() - dayMs);
  const previousFrom = new Date(previousTo.getTime() - (rangeDays - 1) * dayMs);
  const currentFromIso = isoFromDate(currentFrom);
  const currentToIso = isoFromDate(currentTo);
  const previousFromIso = isoFromDate(previousFrom);
  const previousToIso = isoFromDate(previousTo);
  const baseRows = getFilteredRows({ includeDate: false });
  const previous = summarize(baseRows.filter((row) => row.date >= previousFromIso && row.date <= previousToIso));
  const current = summarize(baseRows.filter((row) => row.date >= currentFromIso && row.date <= currentToIso));
  const spendChange = previous.spend ? ((current.spend - previous.spend) / previous.spend) * 100 : 0;
  const conversionChange = previous.conversions ? ((current.conversions - previous.conversions) / previous.conversions) * 100 : 0;
  const cpaChange = costPer(previous) ? ((costPer(current) - costPer(previous)) / costPer(previous)) * 100 : 0;

  elements.comparisonGrid.innerHTML = `
    <article><span>Spend</span><strong>${changeText(spendChange)}</strong><small>${currency.format(current.spend)} · ${formatDateRange(currentFrom, currentTo)}</small></article>
    <article><span>Conversions</span><strong>${changeText(conversionChange)}</strong><small>${number.format(current.conversions)} current vs ${number.format(previous.conversions)} previous</small></article>
    <article><span>Cost / Conv.</span><strong>${changeText(cpaChange)}</strong><small>${formatCostPerConversion(current)} current · prev ${formatCostPerConversion(previous)}</small></article>
  `;
}

function campaignScore(row) {
  const targets = getTargets();
  let score = 0;
  if (row.conversions > 0) score += 35;
  if (conversionRate(row) >= targets.targetCvr) score += 25;
  if (costPerClick(row) <= targets.targetCpc) score += 20;
  if (costPer(row) <= targets.targetCpa && row.conversions > 0) score += 20;
  return Math.min(100, score);
}

function healthLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 35) return 'Watch';
  return 'Bad';
}

function scoreTone(score) {
  if (score >= 80) return 'positive';
  if (score >= 60) return 'good';
  if (score >= 35) return 'warning';
  return 'negative';
}

function recommendationFor(row) {
  const targets = getTargets();
  if (row.spend > targets.targetCpa && row.conversions === 0) return 'Pause / investigate';
  if (row.conversions > 0 && costPer(row) <= targets.targetCpa * 0.75) return 'Scale winner';
  if (campaignScore(row) >= 80) return 'Scale budget';
  if (campaignScore(row) >= 60) return 'Keep stable';
  if (campaignScore(row) >= 35) return 'Reduce budget';
  return 'Pause / fix targeting';
}

function renderHealthAndRecommendations() {
  const campaigns = filteredCampaignGroups().map((row) => ({ ...row, score: campaignScore(row) })).sort((a, b) => b.score - a.score);
  updateToggle('health', campaigns.length);
  updateToggle('recommendations', campaigns.length);

  elements.healthList.innerHTML = visibleRows(campaigns, 'health').map((row) => `
    <div class="health-row ${scoreTone(row.score)}">
      <strong>${campaignWithPlatform(row)}</strong>
      <span>${healthLabel(row.score)} · ${row.score}/100</span>
      <div><i style="width:${row.score}%"></i></div>
    </div>
  `).join('') || '<div class="empty-state">No campaign health data.</div>';

  elements.recommendationList.innerHTML = visibleRows(campaigns, 'recommendations').map((row) => `
    <div class="recommendation-row ${scoreTone(row.score)}">
      <strong>${recommendationFor(row)}</strong>
      <span>${campaignWithPlatform(row)}</span>
      <small>${currency.format(row.spend)} · ${number.format(row.conversions)} conv. · ${formatCostPerConversion(row)}</small>
    </div>
  `).join('') || '<div class="empty-state">No recommendations.</div>';
}

function renderFunnel(rows) {
  const summary = summarize(rows);
  const stages = [
    ['Impressions', summary.impressions],
    ['Ad clicks', summary.clicks],
    ['Tracked conversions', summary.conversions],
    ['Telegram joins', summary.conversions]
  ];
  const max = Math.max(...stages.map((stage) => stage[1]), 1);

  elements.funnelView.innerHTML = stages.map(([label, value]) => `
    <div class="funnel-step" style="--w:${Math.max(8, (value / max) * 100)}%">
      <span>${label}</span>
      <strong>${number.format(value)}</strong>
    </div>
  `).join('');
}

function renderCountryDrilldown(rows) {
  const countries = groupRows(rows, 'location');
  updateToggle('countryDrilldown', countries.length);
  elements.countryDrilldown.innerHTML = visibleRows(countries, 'countryDrilldown').map((country) => {
    const topCampaigns = groupCampaignRows(rows.filter((row) => row.location === country.name)).slice(0, 3);
    return `
      <article class="drilldown-card">
        <h3>${country.name}</h3>
        <p>${currency.format(country.spend)} · ${number.format(country.clicks)} clicks · ${number.format(country.conversions)} conv.</p>
        ${topCampaigns.map((campaign) => `<span>${campaignWithPlatform(campaign)} · ${formatCostPerConversion(campaign)}</span>`).join('')}
      </article>
    `;
  }).join('') || '<div class="empty-state">No country drilldown data.</div>';
}

function renderSearchIntelligence() {
  if (!elements.searchIntelPanel) return;

  elements.searchIntelTabButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.searchTab === activeSearchIntelTab);
  });

  const showCharts = activeSearchIntelTab === 'waste';
  if (elements.searchIntelCharts) {
    elements.searchIntelCharts.hidden = !showCharts;
  }
  if (showCharts) {
    requestAnimationFrame(() => resizeDashboardCharts());
  }
  if (elements.keywordTableWrap) {
    elements.keywordTableWrap.hidden = activeSearchIntelTab !== 'keywords';
  }
  if (elements.keywordTableActions) {
    elements.keywordTableActions.hidden = activeSearchIntelTab !== 'keywords';
  }

  if (activeSearchIntelTab === 'keywords') {
    renderKeywordTable();
    elements.searchIntelPanel.innerHTML = '';
    return;
  }

  if (activeSearchIntelTab === 'waste') {
    const wastedKw = groupKeywordRows(keywordRowsWithMinSpend())
      .filter((row) => row.spend > 0 && row.conversions === 0)
      .sort((a, b) => b.spend - a.spend);
    const wastedTerms = wastedSearchTerms();
    updateToggle('searchTerms', wastedTerms.length);

    elements.searchIntelPanel.innerHTML = `
      <div class="search-intel-tables">
        <div class="search-intel-table-block">
          <h3>Wasted keywords</h3>
          <div class="mini-list">
            ${visibleRows(wastedKw, 'searchTerms').map((row) => `
              <div class="mini-row">
                <strong><span class="mini-badge waste">Waste</span>${escapeHtml(row.keyword)}</strong>
                <span>${currency.format(row.spend)} · ${number.format(row.clicks)} clicks · 0 conv.</span>
              </div>
            `).join('') || '<div class="empty-state">No wasted keywords above threshold.</div>'}
          </div>
        </div>
        <div class="search-intel-table-block">
          <h3>Wasted search queries</h3>
          <div class="mini-list">
            ${visibleRows(wastedTerms, 'searchTerms').map((row) => `
              <div class="mini-row">
                <strong><span class="mini-badge waste">Waste</span>${escapeHtml(row.searchTerm)}</strong>
                <span>${campaignWithPlatform(row)} · ${currency.format(row.spend)} · 0 conv.</span>
              </div>
            `).join('') || '<div class="empty-state">No wasted search terms above threshold.</div>'}
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (activeSearchIntelTab === 'winners') {
    const bestKw = winnerKeywords().slice(0, 10);
    const bestTerms = winnerSearchTerms().slice(0, 10);
    elements.searchIntelPanel.innerHTML = `
      <div class="search-intel-tables">
        <div class="search-intel-table-block">
          <h3>Best keywords by CPA</h3>
          <div class="mini-list">
            ${bestKw.map((row) => `
              <div class="mini-row">
                <strong><span class="mini-badge good">Winner</span>${escapeHtml(row.keyword)}</strong>
                <span>${formatCostPerConversion(row)} · ${currency.format(row.spend)} · ${number.format(row.conversions)} conv.</span>
              </div>
            `).join('') || '<div class="empty-state">No converting keywords above threshold.</div>'}
          </div>
        </div>
        <div class="search-intel-table-block">
          <h3>Best search queries by CPA</h3>
          <div class="mini-list">
            ${bestTerms.map((row) => `
              <div class="mini-row">
                <strong><span class="mini-badge good">Winner</span>${escapeHtml(row.searchTerm)}</strong>
                <span>${formatCostPerConversion(row)} · ${currency.format(row.spend)} · ${number.format(row.conversions)} conv.</span>
              </div>
            `).join('') || '<div class="empty-state">No converting search terms above threshold.</div>'}
          </div>
        </div>
      </div>
    `;
    return;
  }

  const rows = filteredSearchTerms()
    .filter((row) => !keywordMinSpendEnabled || !keywordMinSpend || row.spend >= keywordMinSpend)
    .sort((a, b) => {
      const aWaste = a.spend > 0 && a.conversions === 0 ? 1 : 0;
      const bWaste = b.spend > 0 && b.conversions === 0 ? 1 : 0;
      return bWaste - aWaste || b.spend - a.spend || b.conversions - a.conversions;
    });
  updateToggle('searchTerms', rows.length);
  elements.searchIntelPanel.innerHTML = `
    <div class="mini-list">
      ${visibleRows(rows, 'searchTerms').map((row) => `
        <div class="mini-row">
          <strong>${row.spend > 0 && row.conversions === 0 ? '<span class="mini-badge waste">Waste</span>' : '<span class="mini-badge good">Converting</span>'}${escapeHtml(row.searchTerm)}</strong>
          <span>${campaignWithPlatform(row)} · ${currency.format(row.spend)} · ${number.format(row.conversions)} conv.</span>
        </div>
      `).join('') || '<div class="empty-state">No search term data available.</div>'}
    </div>
  `;
}

function renderActionsPanel(rows) {
  if (!elements.actionsPanel) return;

  const campaigns = filteredCampaignGroups();
  const countries = groupRows(rows, 'location');
  const scaleCamp = campaigns.filter((item) => item.conversions > 0).sort((a, b) => costPer(a) - costPer(b))[0];
  const scaleCountry = countries.filter((item) => item.conversions > 0).sort((a, b) => costPer(a) - costPer(b))[0];
  const scale = scaleCamp || scaleCountry;
  const scaleName = scaleCamp ? scaleCamp.campaign : (scaleCountry ? scaleCountry.name : 'No winner');
  const scalePlatform = scaleCamp ? scaleCamp.platform : (scaleCountry ? 'Mixed' : '');
  const scaleCpa = scale ? formatCostPerConversion(scale) : '—';

  const wastedKw = groupKeywordRows(keywordRowsWithMinSpend())
    .filter((item) => item.spend > 0 && item.conversions === 0)
    .sort((a, b) => b.spend - a.spend)[0];
  const wastedCamp = campaigns.filter((item) => item.spend > 0 && item.conversions === 0).sort((a, b) => b.spend - a.spend)[0];
  let fixName = 'No waste found';
  let fixAmount = 0;
  let fixDetail = 'Clean spend profile in this view';
  if (wastedKw && (!wastedCamp || wastedKw.spend >= wastedCamp.spend)) {
    fixName = wastedKw.keyword;
    fixAmount = wastedKw.spend;
    fixDetail = `Keyword · ${number.format(wastedKw.clicks)} clicks · 0 conv.`;
  } else if (wastedCamp) {
    fixName = wastedCamp.campaign;
    fixAmount = wastedCamp.spend;
    fixDetail = `${wastedCamp.platform} campaign · 0 conv.`;
  }

  const { current, previous } = getPreviousSummary();
  const currentCpa = current.conversions ? current.spend / current.conversions : 0;
  const previousCpa = previous.conversions ? previous.spend / previous.conversions : 0;
  const currentCtr = clickThroughRate(current);
  const previousCtr = clickThroughRate(previous);
  const cpaMove = previousCpa ? deltaPercent(currentCpa, previousCpa) : 0;
  const ctrMove = previousCtr ? deltaPercent(currentCtr, previousCtr) : 0;
  const watchMetric = Math.abs(ctrMove) > Math.abs(cpaMove) ? 'CTR' : 'CPA';
  const watchValue = watchMetric === 'CTR' ? changeText(ctrMove) : (previousCpa ? changeText(cpaMove) : 'No baseline');
  const watchDetail = watchMetric === 'CTR'
    ? `${formatPercent(currentCtr)} now vs ${formatPercent(previousCtr)} previous`
    : `${formatCostPerConversion(current)} now vs ${formatCostPerConversion(previous)} previous`;
  const watchTone = watchMetric === 'CTR'
    ? (previousCtr && currentCtr < previousCtr * 0.8 ? 'negative' : 'warning')
    : (previousCpa && currentCpa > previousCpa * 1.25 ? 'negative' : 'warning');

  elements.actionsPanel.innerHTML = `
    <article class="action-row scale">
      <span class="action-label">Scale</span>
      <div class="action-body">
        <strong>${scaleCamp ? campaignWithPlatform(scaleCamp) : escapeHtml(scaleName)}</strong>
        <small>${scaleCpa} CPA${scalePlatform && !scaleCamp ? ` · ${escapeHtml(scalePlatform)}` : ''}</small>
      </div>
    </article>
    <article class="action-row fix">
      <span class="action-label">Fix</span>
      <div class="action-body">
        <strong>${wastedCamp && fixName === wastedCamp.campaign ? campaignWithPlatform(wastedCamp) : escapeHtml(fixName)}</strong>
        <small>${fixAmount ? `${currency.format(fixAmount)} wasted · ${fixDetail}` : fixDetail}</small>
      </div>
    </article>
    <article class="action-row watch ${watchTone}">
      <span class="action-label">Watch</span>
      <div class="action-body">
        <strong>${watchMetric} ${watchValue}</strong>
        <small>${watchDetail}</small>
      </div>
    </article>
  `;
}

function renderCreativeTable() {
  const rows = filteredCreatives().sort((a, b) => b.conversions - a.conversions || costPer(a) - costPer(b));
  updateToggle('creatives', rows.length);
  elements.creativeRows.innerHTML = visibleRows(rows, 'creatives').map((row) => `
    <tr>
      <td>${row.adName}</td>
      <td>${row.adSet}</td>
      <td>${campaignWithPlatform(row)}</td>
      <td>${row.location}</td>
      <td>${currency.format(row.spend)}</td>
      <td>${number.format(row.impressions)}</td>
      <td>${number.format(row.clicks)}</td>
      <td>${number.format(row.conversions)}</td>
      <td>${formatPercent(clickThroughRate(row))}</td>
      <td>${currencyPrecise.format(costPerClick(row))}</td>
      <td>${formatCostPerConversion(row)}</td>
    </tr>
  `).join('') || '<tr><td class="empty-state" colspan="11">No Meta creative data for this filter.</td></tr>';
}

function renderKpis(rows) {
  const summary = summarize(rows);
  const { current, previous } = getPreviousSummary();
  const cpaCurrent = current.conversions ? current.spend / current.conversions : 0;
  const cpaPrevious = previous.conversions ? previous.spend / previous.conversions : 0;

  elements.totalSpend.textContent = currency.format(summary.spend);
  elements.totalImpressions.textContent = number.format(summary.impressions);
  elements.totalClicks.textContent = number.format(summary.clicks);
  elements.totalConversions.textContent = number.format(summary.conversions);
  elements.ctr.textContent = formatPercent(clickThroughRate(summary));
  elements.cpc.textContent = currencyPrecise.format(costPerClick(summary));
  elements.costPerConversion.textContent = formatCostPerConversion(summary);
  if (elements.wastedSpend) elements.wastedSpend.textContent = currency.format(summary.wastedSpend);
  elements.conversionRate.textContent = formatPercent(summary.clicks ? (summary.conversions / summary.clicks) * 100 : 0);

  setKpiDelta(elements.spendDelta, current.spend, previous.spend);
  setKpiDelta(elements.conversionsDelta, current.conversions, previous.conversions);
  setKpiDelta(elements.cpaDelta, cpaCurrent, cpaPrevious, true);
  setKpiDelta(elements.wasteDelta, current.wastedSpend, previous.wastedSpend, true);

  const hasRows = rows.length > 0;
  elements.spendNote.textContent = hasRows
    ? `${number.format(summary.clicks)} ad clicks selected`
    : 'No rows match the current filters';
  elements.selectedRange.textContent = `${filters.from.value || 'Start'} to ${filters.to.value || latestAvailableDate() || 'End'}`;

  if (elements.dataThroughPill) {
    const latest = latestAvailableDate();
    elements.dataThroughPill.textContent = latest ? `Data through ${latest}` : 'No synced data';
  }

  if (elements.secondaryKpiGrid) {
    elements.secondaryKpiGrid.hidden = !kpiSecondaryExpanded;
  }
  if (elements.toggleSecondaryKpis) {
    elements.toggleSecondaryKpis.textContent = kpiSecondaryExpanded ? 'Fewer metrics' : 'More metrics';
    elements.toggleSecondaryKpis.setAttribute('aria-expanded', String(kpiSecondaryExpanded));
  }
}

function renderFilterNotice(rows) {
  if (!elements.filterNotice) return;

  const earliest = earliestAvailableDate();
  const latest = latestAvailableDate();
  const from = filters.from.value;
  const to = filters.to.value;
  const overlaps = dateRangeOverlapsAvailable(from, to);

  if (!adRows.length || !from || !to || (rows.length > 0 && overlaps)) {
    elements.filterNotice.hidden = true;
    elements.filterNotice.innerHTML = '';
    return;
  }

  if (!overlaps) {
    elements.filterNotice.hidden = false;
    elements.filterNotice.innerHTML = `
      <p><strong>No synced data for ${escapeHtml(from)} to ${escapeHtml(to)}.</strong> Available reporting runs ${escapeHtml(earliest)} through ${escapeHtml(latest)}. Calendar today is ${escapeHtml(calendarTodayIso())}, so today/yesterday only work after you refresh from Google/Meta.</p>
      <div class="filter-notice-actions">
        <button type="button" class="action-button action-button-small" data-jump-latest-day>Use latest synced day (${escapeHtml(latest)})</button>
        <button type="button" class="action-button action-button-small" data-jump-last7>Last 7 days</button>
      </div>
    `;
    return;
  }

  elements.filterNotice.hidden = false;
  elements.filterNotice.innerHTML = `
    <p><strong>No rows match your filters</strong> for ${escapeHtml(from)} to ${escapeHtml(to)}. Try widening the date range or clearing platform/account/campaign filters.</p>
  `;
}

function renderAccountBreakdown() {
  // Charts render in renderEchartSections.
}

function renderPlatformBreakdown() {
  // Charts render in renderEchartSections.
}

function renderCampaignChart() {
  // Charts render in renderEchartSections.
}

function renderCampaignDrilldown() {
  if (!elements.campaignDrilldown) return;
  const campaigns = filteredCampaignGroups();
  const activeCampaign = selectedCampaignKey
    ? campaigns.find((row) => campaignKey(row) === selectedCampaignKey)
    : campaigns[0];

  if (!activeCampaign) {
    elements.campaignDrilldown.innerHTML = '<div class="empty-state">No campaign available for drilldown.</div>';
    return;
  }

  const activeKey = campaignKey(activeCampaign);
  const rows = getFilteredRows().filter((row) => campaignKey(row) === activeKey);
  const summary = summarize(rows);
  const daily = groupDaily(rows).slice(-10);
  const maxSpend = Math.max(...daily.map((day) => day.spend), 1);
  const countries = groupRows(rows, 'location').slice(0, 4);
  const terms = filteredSearchTerms().filter((row) => row.campaign === activeCampaign.campaign).slice(0, 4);
  const creatives = filteredCreatives().filter((row) => row.campaign === activeCampaign.campaign).slice(0, 4);

  elements.campaignDrilldown.innerHTML = `
    <div class="drilldown-hero">
      <div>
        <span>${platformBadge(activeCampaign.platform, true)} ${activeCampaign.platform}</span>
        <h3>${activeCampaign.campaign}</h3>
        <p>${recommendationFor(activeCampaign)} · ${statusLabel(activeCampaign.status)} · ${activeCampaign.account}</p>
      </div>
      <button class="action-button" type="button" data-campaign-clear>Clear selection</button>
    </div>
    <div class="management-summary">
      <article class="summary-card neutral"><span>Spend</span><strong>${currency.format(summary.spend)}</strong><p>${number.format(summary.clicks)} clicks</p></article>
      <article class="summary-card ${summary.conversions ? 'positive' : 'negative'}"><span>Ad conversions</span><strong>${number.format(summary.conversions)}</strong><p>${formatCostPerConversion(summary)} CPA</p></article>
      <article class="summary-card neutral"><span>CTR / CPC</span><strong>${formatPercent(clickThroughRate(summary))}</strong><p>${currencyPrecise.format(costPerClick(summary))} CPC</p></article>
      <article class="summary-card ${summary.wastedSpend ? 'warning' : 'positive'}"><span>Wasted spend</span><strong>${currency.format(summary.wastedSpend)}</strong><p>Spend from 0-conv rows</p></article>
    </div>
    <div class="drilldown-grid">
      <article class="drilldown-card">
        <h3>Daily spend</h3>
        <div class="mini-bars">${daily.map((day) => `<span title="${day.name}: ${currency.format(day.spend)}" style="height:${Math.max(8, (day.spend / maxSpend) * 100)}%"></span>`).join('')}</div>
      </article>
      <article class="drilldown-card">
        <h3>Top countries</h3>
        ${countries.map((country) => `<p><strong>${country.name}</strong><span>${currency.format(country.spend)} · ${number.format(country.conversions)} conv.</span></p>`).join('') || '<p>No country data.</p>'}
      </article>
      <article class="drilldown-card">
        <h3>Search terms</h3>
        ${terms.map((term) => `<p><strong>${term.searchTerm}</strong><span>${currency.format(term.spend)} · ${number.format(term.conversions)} conv.</span></p>`).join('') || '<p>No Google search term data.</p>'}
      </article>
      <article class="drilldown-card">
        <h3>Creatives</h3>
        ${creatives.map((creative) => `<p><strong>${creative.adName}</strong><span>${currency.format(creative.spend)} · ${number.format(creative.conversions)} conv.</span></p>`).join('') || '<p>No Meta creative data.</p>'}
      </article>
    </div>
  `;
}

function renderLocationBreakdown(rows) {
  const locations = groupRows(rows, 'location');
  updateToggle('locations', locations.length);

  elements.locationBreakdown.innerHTML = visibleRows(locations, 'locations').map((location, index) => {
    const code = resolveCountryCode(location);
    const flag = countryFlagMarkup(code, { className: 'location-flag-img' });
    return `
    <div class="location-row">
      <span class="location-rank">${index + 1}</span>
      <strong>${flag ? `<span class="location-flag">${flag}</span>` : ''}${location.name}</strong>
      <span>${currency.format(location.spend)} · ${number.format(location.impressions)} impr. · ${number.format(location.conversions)} conv.</span>
    </div>
  `;
  }).join('') || '<div class="empty-state">No location data for this filter.</div>';
}

function getMapFocusCountry(countries) {
  if (!countries.length) return null;
  const withConversions = countries.filter((country) => country.conversions > 0);
  if (withConversions.length) {
    return withConversions.sort((a, b) => b.conversions - a.conversions || costPer(a) - costPer(b))[0];
  }
  return countries.sort((a, b) => b.spend - a.spend)[0];
}

function mapZoomForCountry(code, hasConversions) {
  const largeCountries = new Set(['US', 'CA', 'AU', 'IN', 'PK', 'SA']);
  if (!hasConversions) return 3;
  return largeCountries.has(code) ? 4 : 5;
}

function renderCountryMap(rows) {
  const countries = groupRows(rows, 'location').slice(0, 14);
  const focusCountry = getMapFocusCountry(countries);
  const maxSpend = Math.max(...countries.map((country) => country.spend), 1);
  const locationTypeLabel = filters.locationType.options[filters.locationType.selectedIndex].textContent;
  const firstSummary = focusCountry
    ? `${locationTypeLabel} · ${focusCountry.name}: ${currency.format(focusCountry.spend)} spend, ${number.format(focusCountry.impressions)} impressions, ${number.format(focusCountry.clicks)} clicks, ${number.format(focusCountry.conversions)} conversions`
    : 'Hover a country marker to view KPIs.';

  if (window.L) {
    if (!leafletMap) {
      elements.countryMap.innerHTML = '';
      leafletMap = window.L.map(elements.countryMap, {
        attributionControl: true,
        scrollWheelZoom: false,
        worldCopyJump: true
      }).setView([23.5, 45], 2);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 8,
        minZoom: 2,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(leafletMap);
      leafletLayer = window.L.layerGroup().addTo(leafletMap);
    }

    leafletLayer.clearLayers();
    const bounds = [];

    countries.forEach((country) => {
      const code = resolveCountryCode(country);
      const coordinates = countryCoordinates[code];
      if (!coordinates) return;

      const markerSize = Math.max(48, Math.min(78, 48 + (country.spend / maxSpend) * 30));
      const markerColor = performanceColor(country);
      const flagUrl = countryFlagUrl(code);
      const summary = `${locationTypeLabel} · ${country.name}: ${currency.format(country.spend)} spend, ${number.format(country.impressions)} impressions, ${number.format(country.clicks)} clicks, ${number.format(country.conversions)} conversions`;
      const tooltipHtml = `
        <div class="map-tooltip-flag">
          ${flagUrl ? `<img src="${flagUrl}" alt="${escapeHtml(country.name)}" width="24" height="17">` : ''}
          <strong>${escapeHtml(country.name)}</strong>
        </div>
        ${escapeHtml(locationTypeLabel)}<br>
        ${currency.format(country.spend)} spend<br>
        ${number.format(country.impressions)} impressions<br>
        ${number.format(country.clicks)} clicks · ${number.format(country.conversions)} conv.<br>
        ${formatCostPerConversion(country)} CPA
      `;

      const icon = window.L.divIcon({
        className: 'map-flag-icon',
        html: `
          <div class="map-flag-marker" style="--marker-color:${markerColor};--marker-size:${markerSize}px">
            <span class="map-flag-ring"></span>
            ${flagUrl ? `<img src="${flagUrl}" alt="${escapeHtml(country.name)}" width="30" height="22" loading="lazy">` : `<span class="map-flag-fallback">${escapeHtml(code || '🌍')}</span>`}
            <strong>${currency.format(country.spend)}</strong>
          </div>
        `,
        iconSize: [markerSize, markerSize + 20],
        iconAnchor: [markerSize / 2, markerSize / 2]
      });

      const marker = window.L.marker(coordinates, { icon }).bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -markerSize / 2],
        opacity: 1
      });

      marker.on('mouseover click', () => {
        elements.countryTooltip.innerHTML = `
          <span class="map-tooltip-flag">
            ${flagUrl ? `<img src="${flagUrl}" alt="">` : ''}
            <strong>${escapeHtml(country.name)}</strong>
          </span>
          ${escapeHtml(summary)}
        `;
      });
      marker.addTo(leafletLayer);
      bounds.push(coordinates);
    });

    if (focusCountry) {
      const focusCode = resolveCountryCode(focusCountry);
      const focusCoords = countryCoordinates[focusCode];
      if (focusCoords) {
        leafletMap.setView(focusCoords, mapZoomForCountry(focusCode, focusCountry.conversions > 0), { animate: false });
      } else if (bounds.length) {
        leafletMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 4 });
      }
    } else if (bounds.length) {
      leafletMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 4 });
    }
    setTimeout(() => leafletMap.invalidateSize(), 0);
    elements.countryTooltip.innerHTML = focusCountry ? `
      <span class="map-tooltip-flag">
        ${countryFlagUrl(resolveCountryCode(focusCountry)) ? `<img src="${countryFlagUrl(resolveCountryCode(focusCountry))}" alt="">` : ''}
        <strong>${escapeHtml(focusCountry.name)}</strong>
      </span>
      ${escapeHtml(firstSummary)}
    ` : 'Hover a country flag to view KPIs.';
    return;
  }

  elements.countryMap.innerHTML = countries.map((country, index) => {
    const size = Math.max(42, Math.min(118, 42 + (country.spend / maxSpend) * 76));
    const x = 8 + ((index * 29) % 78);
    const y = 14 + ((index * 37) % 62);
    const summary = `${locationTypeLabel} · ${country.name}: ${currency.format(country.spend)} spend, ${number.format(country.impressions)} impressions, ${number.format(country.clicks)} clicks, ${number.format(country.conversions)} conversions`;
    return `
      <button class="map-bubble" type="button" style="--x:${x}%;--y:${y}%;--size:${size}px" data-summary="${summary}">
        <strong>${country.name}</strong>
        <span>${currency.format(country.spend)}</span>
      </button>
    `;
  }).join('') || '<div class="empty-state">No country data for this filter.</div>';

  elements.countryMap.querySelectorAll('.map-bubble').forEach((bubble) => {
    const updateTooltip = () => {
      elements.countryTooltip.textContent = bubble.dataset.summary;
    };
    bubble.addEventListener('mouseenter', updateTooltip);
    bubble.addEventListener('focus', updateTooltip);
    bubble.addEventListener('click', updateTooltip);
  });

  elements.countryTooltip.textContent = firstSummary;
}

function renderTable(rows) {
  const campaignRows = filteredCampaignGroups();
  updateToggle('campaigns', campaignRows.length);

  elements.campaignRows.innerHTML = visibleRows(campaignRows, 'campaigns').map((row) => {
    const key = campaignKey(row);
    return `
      <tr class="${selectedCampaignKey === key ? 'is-selected' : ''}" data-campaign-key="${escapeHtml(key)}">
        <td>${platformBadge(row.platform)}</td>
        <td>${row.account}</td>
        <td>${statusBadge(row.status)}</td>
        <td>${campaignWithPlatform(row)}</td>
        <td>${row.location}</td>
        <td>${currency.format(row.spend)}</td>
        <td>${number.format(row.impressions)}</td>
        <td>${number.format(row.clicks)}</td>
        <td>${number.format(row.conversions)}</td>
        <td>${formatPercent(clickThroughRate(row))}</td>
        <td>${currencyPrecise.format(costPerClick(row))}</td>
        <td>${formatCostPerConversion(row)}</td>
        <td>${formatPercent(conversionRate(row))}</td>
      </tr>
    `;
  }).join('') || '<tr><td class="empty-state" colspan="13">No campaign data for this filter.</td></tr>';
}

function getFilteredKeywordRows() {
  if (filters.platform.value === 'Meta Ads') return [];
  return keywordRows.filter((row) => matchesDashboardFilters(row));
}

function renderKeywordTable() {
  const rows = keywordRowsWithMinSpend()
    .sort((a, b) => b.conversions - a.conversions || costPer(a) - costPer(b));
  updateToggle('keywords', rows.length);

  const tableWrap = elements.keywordTableWrap;
  if (tableWrap) {
    tableWrap.classList.toggle('keyword-table-expanded', keywordColumnsExpanded);
  }
  if (elements.toggleKeywordColumns) {
    elements.toggleKeywordColumns.textContent = keywordColumnsExpanded ? 'Fewer columns' : 'More columns';
  }

  elements.keywordRows.innerHTML = visibleRows(rows, 'keywords').map((row) => {
    const isWaste = row.spend > 0 && row.conversions === 0;
    return `
    <tr>
      <td>${escapeHtml(row.keyword)}</td>
      <td>${escapeHtml(row.matchType)}</td>
      <td>${currency.format(row.spend)}</td>
      <td>${number.format(row.clicks)}</td>
      <td>${number.format(row.conversions)}</td>
      <td>${formatCostPerConversion(row)}</td>
      <td>${isWaste ? '<span class="mini-badge waste">Waste</span>' : (row.conversions > 0 ? '<span class="mini-badge good">OK</span>' : '—')}</td>
      <td class="col-extra">${campaignWithPlatform(row)}</td>
      <td class="col-extra">${escapeHtml(row.adGroup)}</td>
      <td class="col-extra">${number.format(row.impressions)}</td>
      <td class="col-extra">${formatPercent(clickThroughRate(row))}</td>
      <td class="col-extra">${currencyPrecise.format(costPerClick(row))}</td>
    </tr>
  `;
  }).join('') || '<tr><td class="empty-state" colspan="12">No Google keyword data for this filter.</td></tr>';
}

function renderDashboard() {
  const rows = getFilteredRows();
  const locationRows = getFilteredLocationRows();
  renderFilterNotice(rows);
  renderKpis(rows);
  renderExecutiveSnapshot(rows);
  renderPlanningTools(rows);
  renderAnomalies();
  renderManagementSummary(rows);
  renderTrendChart(rows);
  renderComparison();
  renderFunnel(rows);
  renderPlatformBreakdown(rows);
  renderAccountBreakdown(rows);
  renderLocationBreakdown(locationRows);
  renderCountryMap(locationRows);
  renderCountryDrilldown(locationRows);
  renderCampaignChart(rows);
  renderCampaignDrilldown();
  renderTable(rows);
  renderSearchIntelligence();
  renderActionsPanel(rows);
  renderCreativeTable();
  renderEchartSections(rows, locationRows);
}

function exportCsv() {
  const rows = filteredCampaignGroups();
  const header = ['Platform', 'Account', 'Status', 'Campaign', 'Location', 'Spend AED', 'Impressions', 'Clicks', 'Conversions', 'CTR', 'CPC AED', 'Cost/Conv AED', 'Conv Rate'];
  const lines = rows.map((row) => [
    row.platform,
    row.account,
    statusLabel(row.status),
    row.campaign,
    row.location,
    row.spend.toFixed(2),
    row.impressions,
    row.clicks,
    row.conversions,
    formatPercent(clickThroughRate(row)),
    costPerClick(row).toFixed(2),
    row.conversions ? (row.spend / row.conversions).toFixed(2) : '',
    formatPercent(conversionRate(row))
  ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tpclub-ads-dashboard.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function exportWastedKeywordsCsv() {
  const rows = groupKeywordRows(keywordRowsWithMinSpend())
    .filter((row) => row.spend > 0 && row.conversions === 0)
    .sort((a, b) => b.spend - a.spend);
  const header = ['Keyword', 'Spend AED', 'Clicks', 'Conversions'];
  const lines = rows.map((row) => [
    csvEscape(row.keyword),
    row.spend.toFixed(2),
    row.clicks,
    row.conversions
  ].join(','));
  downloadCsv('wasted-keywords.csv', header, lines);
}

function exportWastedSearchTermsCsv() {
  const rows = wastedSearchTerms();
  const header = ['Search term', 'Campaign', 'Spend AED', 'Clicks', 'Conversions'];
  const lines = rows.map((row) => [
    csvEscape(row.searchTerm),
    csvEscape(row.campaign),
    row.spend.toFixed(2),
    row.clicks || 0,
    row.conversions
  ].join(','));
  downloadCsv('wasted-search-terms.csv', header, lines);
}

async function copyNegativesList() {
  const terms = wastedSearchTerms().map((row) => row.searchTerm);
  const keywords = groupKeywordRows(keywordRowsWithMinSpend())
    .filter((row) => row.spend > 0 && row.conversions === 0)
    .map((row) => row.keyword);
  const negatives = [...new Set([...terms, ...keywords])];
  if (!negatives.length) {
    window.alert('No wasted keywords or search terms to copy for this filter.');
    return;
  }
  try {
    await navigator.clipboard.writeText(negatives.join('\n'));
  } catch {
    window.prompt('Copy negatives list:', negatives.join('\n'));
  }
}

function preparePrintReport() {
  const summary = summarize(getFilteredRows());
  document.querySelectorAll('.dashboard-drawer').forEach((drawer) => drawer.setAttribute('open', ''));
  if (elements.printReportMeta) {
    elements.printReportMeta.textContent = [
      `Generated ${new Date().toLocaleString()}`,
      `Range: ${filters.from.value || 'start'} to ${filters.to.value || latestAvailableDate() || 'end'}`,
      `Spend ${currency.format(summary.spend)} · ${number.format(summary.conversions)} conversions · CPA ${formatCostPerConversion(summary)}`
    ].join(' · ');
  }
}

function printDashboardReport() {
  preparePrintReport();
  window.print();
}

function copySummary() {
  const summary = summarize(getFilteredRows());
  const text = `TP Club Ads Summary\nSpend: ${currency.format(summary.spend)}\nImpressions: ${number.format(summary.impressions)}\nClicks: ${number.format(summary.clicks)}\nAd conversions: ${number.format(summary.conversions)}\nWasted spend: ${currency.format(summary.wastedSpend)}\nCost/Conv: ${formatCostPerConversion(summary)}\nConversion rate: ${formatPercent(conversionRate(summary))}`;
  navigator.clipboard.writeText(text).then(() => {
    elements.copySummary.textContent = 'Copied';
    setTimeout(() => {
      elements.copySummary.textContent = 'Copy Summary';
    }, 1600);
  });
}

async function syncLiveDataFromServer({ silent = false, force = false } = {}) {
  if (liveUpdateState.isRefreshing) return false;
  const endpoint = getRefreshEndpoint();
  if (!endpoint) {
    if (!silent) setSyncStatus('Server refresh unavailable', 'Refresh endpoint is not configured on this host.');
    return false;
  }
  if (!force && !silent && !needsLiveApiRefresh()) {
    return pollDashboardJson({ silent: false });
  }

  liveUpdateState.isRefreshing = true;
  setLiveSyncVisual(true);
  if (!silent && elements.refreshData) {
    elements.refreshData.textContent = 'Refreshing...';
    elements.refreshData.disabled = true;
  }
  if (silent) {
    setSyncStatus('Syncing live data', 'Pulling the latest Google Ads and Meta Ads numbers from the server.');
  }

  try {
    dashboardRefreshPassword = getStoredRefreshPassword();
    if (!dashboardRefreshPassword && !silent) {
      dashboardRefreshPassword = window.prompt('Enter dashboard password to refresh live ads data') || '';
      if (dashboardRefreshPassword) {
        sessionStorage.setItem(refreshPasswordStorageKey, dashboardRefreshPassword);
      }
    }
    if (!dashboardRefreshPassword) {
      if (!silent) throw new Error('Dashboard password is required for server refresh');
      return false;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: dashboardRefreshPassword })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      const serverOutput = Array.isArray(result.output) ? result.output.filter(Boolean).slice(-3).join(' | ') : '';
      throw new Error(serverOutput || result.error || result.message || 'Server refresh failed');
    }

    const didLoad = await loadSyncedRows({ preserveExisting: true });
    if (didLoad) {
      syncFilterDependencies();
      renderDashboard();
    }
    return didLoad;
  } catch (error) {
    if (!silent) setSyncStatus('Server refresh unavailable', error.message);
    return false;
  } finally {
    liveUpdateState.isRefreshing = false;
    setLiveSyncVisual(false);
    if (!silent && elements.refreshData) {
      elements.refreshData.disabled = false;
    }
  }
}

async function pollDashboardJson({ silent = true } = {}) {
  if (liveUpdateState.isRefreshing) return false;

  try {
    const response = await fetch(`/dashboard/data/ads-dashboard.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return false;

    const payload = await response.json();
    const generatedAtMs = payload.generatedAt ? new Date(payload.generatedAt).getTime() : 0;
    if (generatedAtMs && generatedAtMs <= syncMeta.generatedAtMs) return false;

    const didLoad = await loadSyncedRows({ preserveExisting: true });
    if (didLoad) {
      syncFilterDependencies();
      renderDashboard();
    }
    return didLoad;
  } catch {
    return false;
  }
}

function stopLiveDataUpdates() {
  if (liveUpdateState.jsonPollTimer) {
    clearInterval(liveUpdateState.jsonPollTimer);
    liveUpdateState.jsonPollTimer = null;
  }
  if (liveUpdateState.apiSyncTimer) {
    clearInterval(liveUpdateState.apiSyncTimer);
    liveUpdateState.apiSyncTimer = null;
  }
}

function startLiveDataUpdates() {
  const config = getLiveRefreshConfig();
  stopLiveDataUpdates();
  if (!config.enabled) return;

  liveUpdateState.jsonPollTimer = setInterval(() => {
    if (document.hidden) return;
    pollDashboardJson({ silent: true });
  }, config.jsonPollIntervalMs);

  if (getRefreshEndpoint()) {
    liveUpdateState.apiSyncTimer = setInterval(() => {
      if (document.hidden || liveUpdateState.isRefreshing) return;
      if (needsLiveApiRefresh() && getStoredRefreshPassword()) {
        syncLiveDataFromServer({ silent: true });
      }
    }, config.apiSyncIntervalMs);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden || liveUpdateState.isRefreshing) return;
    pollDashboardJson({ silent: true });
    if (needsLiveApiRefresh() && getStoredRefreshPassword() && getRefreshEndpoint()) {
      syncLiveDataFromServer({ silent: true });
    }
  });
}

async function refreshDashboardData() {
  const originalText = elements.refreshData.textContent;
  const didRefresh = await syncLiveDataFromServer({ silent: false, force: true });
  elements.refreshData.textContent = didRefresh ? 'Data refreshed' : 'Refresh failed';
  setTimeout(() => {
    elements.refreshData.textContent = originalText;
  }, 1400);
}

function toggleFilters() {
  const isHidden = elements.filterPanel.hidden;
  elements.filterPanel.hidden = !isHidden;
  elements.toggleFilters.setAttribute('aria-expanded', String(isHidden));
  elements.toggleFilters.textContent = isHidden ? 'Hide filters' : 'Show filters';
}

function resetFilters() {
  filters.platform.value = 'all';
  filters.datePreset.value = 'last30';
  filters.account.value = 'all';
  filters.status.value = 'all';
  filters.campaign.value = 'all';
  filters.locationType.value = 'delivered';
  filters.location.value = 'all';
  filters.conversionMetric.value = 'all';
  Object.keys(listState).forEach((key) => {
    listState[key] = false;
  });

  selectedCampaignKey = '';
  setDatePreset(filters.datePreset.value);
  syncFilterDependencies();
  renderDashboard();
}

function setupChartTooltips() {
  document.addEventListener('pointerover', (event) => {
    const source = event.target.closest('.chart-hover');
    if (!source) return;
    showChartTooltip(source, event);
  });

  document.addEventListener('pointermove', (event) => {
    const source = event.target.closest('.chart-hover');
    if (!source) return;
    positionChartTooltip(event, source);
  });

  document.addEventListener('pointerout', (event) => {
    const source = event.target.closest('.chart-hover');
    if (!source || source.contains(event.relatedTarget)) return;
    hideChartTooltip();
  });

  document.addEventListener('focusin', (event) => {
    const source = event.target.closest('.chart-hover');
    if (!source) return;
    showChartTooltip(source, null);
  });

  document.addEventListener('focusout', (event) => {
    const source = event.target.closest('.chart-hover');
    if (!source || source.contains(event.relatedTarget)) return;
    hideChartTooltip();
  });

  window.addEventListener('scroll', hideChartTooltip, { passive: true });
  window.addEventListener('resize', hideChartTooltip);
}

function setupDashboardInteractions() {
  elements.trendMetricButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeTrendMetric = button.dataset.trendMetric || 'spend';
      elements.trendMetricButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      renderDashboard();
    });
  });

  elements.searchIntelTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeSearchIntelTab = button.dataset.searchTab || 'waste';
      renderDashboard();
    });
  });

  if (elements.toggleSecondaryKpis) {
    elements.toggleSecondaryKpis.addEventListener('click', () => {
      kpiSecondaryExpanded = !kpiSecondaryExpanded;
      renderKpis(getFilteredRows());
    });
  }

  if (elements.keywordMinSpendToggle) {
    elements.keywordMinSpendToggle.addEventListener('change', () => {
      keywordMinSpendEnabled = elements.keywordMinSpendToggle.checked;
      renderDashboard();
    });
  }

  if (elements.toggleKeywordColumns) {
    elements.toggleKeywordColumns.addEventListener('click', () => {
      keywordColumnsExpanded = !keywordColumnsExpanded;
      renderSearchIntelligence();
    });
  }

  if (elements.exportWastedKeywords) {
    elements.exportWastedKeywords.addEventListener('click', exportWastedKeywordsCsv);
  }
  if (elements.exportWastedSearchTerms) {
    elements.exportWastedSearchTerms.addEventListener('click', exportWastedSearchTermsCsv);
  }
  if (elements.copyNegativesList) {
    elements.copyNegativesList.addEventListener('click', copyNegativesList);
  }

  [filters.monthlyBudget, filters.targetCpa, filters.targetCpc, filters.targetCvr].filter(Boolean).forEach((input) => {
    input.addEventListener('input', renderDashboard);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-jump-latest-day]')) {
      filters.datePreset.value = 'latest';
      setDatePreset('latest');
      syncFilterDependencies();
      renderDashboard();
      return;
    }
    if (event.target.closest('[data-jump-last7]')) {
      filters.datePreset.value = 'last7';
      setDatePreset('last7');
      syncFilterDependencies();
      renderDashboard();
      return;
    }

    const dateTarget = event.target.closest('[data-chart-date]');
    if (dateTarget) {
      filters.datePreset.value = 'custom';
      filters.from.value = dateTarget.dataset.chartDate;
      filters.to.value = dateTarget.dataset.chartDate;
      syncFilterDependencies();
      renderDashboard();
      return;
    }

    const platformTarget = event.target.closest('[data-platform-filter]');
    if (platformTarget) {
      filters.platform.value = platformTarget.dataset.platformFilter;
      syncFilterDependencies();
      renderDashboard();
      return;
    }

    const accountTarget = event.target.closest('[data-account-filter]');
    if (accountTarget) {
      filters.account.value = accountTarget.dataset.accountFilter;
      syncFilterDependencies();
      renderDashboard();
      return;
    }

    if (event.target.closest('[data-campaign-clear]')) {
      selectedCampaignKey = '';
      renderDashboard();
      return;
    }

    const campaignTarget = event.target.closest('[data-campaign-key]');
    if (!campaignTarget) return;
    const nextKey = campaignTarget.dataset.campaignKey;
    selectedCampaignKey = selectedCampaignKey === nextKey ? '' : nextKey;
    renderDashboard();
  });
}

async function initDashboard() {
  const isUnlocked = await requireDashboardAuth();
  if (!isUnlocked) return;

  await loadSyncedRows();
  setupFilters();
  Object.values(filters).forEach((filter) => filter.addEventListener('change', () => {
    if (filter === filters.datePreset) {
      setDatePreset(filters.datePreset.value);
    }
    if ([filters.from, filters.to].includes(filter)) {
      filters.datePreset.value = 'custom';
    }
    syncFilterDependencies();
    renderDashboard();
  }));
  elements.showToggles.forEach((button) => {
    button.addEventListener('click', () => {
      const listName = button.dataset.toggleList;
      listState[listName] = !listState[listName];
      renderDashboard();
    });
  });
  elements.exportCsv.addEventListener('click', exportCsv);
  elements.refreshData.addEventListener('click', refreshDashboardData);
  elements.printReport.addEventListener('click', printDashboardReport);
  elements.copySummary.addEventListener('click', copySummary);
  elements.toggleFilters.addEventListener('click', toggleFilters);
  elements.resetFilters.addEventListener('click', resetFilters);
  setupChartTooltips();
  setupDashboardInteractions();
  renderDashboard();
  startLiveDataUpdates();
  window.addEventListener('resize', () => { resizeDashboardCharts(); }, { passive: true });
  window.addEventListener('beforeprint', preparePrintReport);
  document.querySelectorAll('.dashboard-drawer').forEach((drawer) => {
    drawer.addEventListener('toggle', () => {
      setTimeout(resizeDashboardCharts, 80);
    });
  });

  if (needsLiveApiRefresh() && getRefreshEndpoint() && getStoredRefreshPassword()) {
    syncLiveDataFromServer({ silent: true });
  }
}

initDashboard();
