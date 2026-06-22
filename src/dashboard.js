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
  to: document.querySelector('#toDate')
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
  conversionRate: document.querySelector('#conversionRate'),
  spendNote: document.querySelector('#spendNote'),
  selectedRange: document.querySelector('#selectedRange'),
  platformBreakdown: document.querySelector('#platformBreakdown'),
  accountBreakdown: document.querySelector('#accountBreakdown'),
  managementSummary: document.querySelector('#managementSummary'),
  opportunityGrid: document.querySelector('#opportunityGrid'),
  alertList: document.querySelector('#alertList'),
  trendChart: document.querySelector('#trendChart'),
  comparisonGrid: document.querySelector('#comparisonGrid'),
  healthList: document.querySelector('#healthList'),
  recommendationList: document.querySelector('#recommendationList'),
  funnelView: document.querySelector('#funnelView'),
  locationBreakdown: document.querySelector('#locationBreakdown'),
  countryMap: document.querySelector('#countryMap'),
  countryTooltip: document.querySelector('#countryTooltip'),
  countryDrilldown: document.querySelector('#countryDrilldown'),
  campaignRows: document.querySelector('#campaignRows'),
  keywordRows: document.querySelector('#keywordRows'),
  keywordIntelligence: document.querySelector('#keywordIntelligence'),
  searchTermList: document.querySelector('#searchTermList'),
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
  syncSubtext: document.querySelector('#syncSubtext')
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0
});

const number = new Intl.NumberFormat('en-US');
const authStorageKey = 'tpclub_dashboard_unlocked';

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

  const dates = uniqueValues('date');
  filters.from.value = dates[0];
  filters.to.value = dates[dates.length - 1];
  setDatePreset(filters.datePreset.value || 'last30');
}

function allLocationSourceRows() {
  return [...adRows, ...targetedLocationRows];
}

function matchesStatus(row) {
  if (filters.status.value === 'all') return true;
  return statusClass(row.status) === filters.status.value;
}

function matchesConversionMetric(row) {
  if (filters.conversionMetric.value === 'all') return true;
  if (filters.conversionMetric.value === 'google') return row.platform === 'Google Ads';
  if (filters.conversionMetric.value === 'meta') return row.platform === 'Meta Ads';
  return true;
}

function matchesDate(row) {
  return (!filters.from.value || row.date >= filters.from.value) && (!filters.to.value || row.date <= filters.to.value);
}

function setDatePreset(preset) {
  const now = new Date();
  const to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const from = new Date(to);

  if (preset === 'custom') return;
  if (preset === 'last7') from.setUTCDate(to.getUTCDate() - 6);
  if (preset === 'last30') from.setUTCDate(to.getUTCDate() - 30);
  if (preset === 'thisMonth') from.setUTCDate(1);
  if (preset === 'previousMonth') {
    from.setUTCMonth(to.getUTCMonth() - 1, 1);
    to.setUTCDate(0);
  }

  filters.from.value = from.toISOString().slice(0, 10);
  filters.to.value = to.toISOString().slice(0, 10);
}

function valuesForFilter(key) {
  const source = key === 'location' ? allLocationSourceRows() : adRows;
  return [...new Set(source
    .filter((row) => {
      const matchesPlatform = key === 'platform' || filters.platform.value === 'all' || row.platform === filters.platform.value;
      const matchesAccount = key === 'account' || filters.account.value === 'all' || row.account === filters.account.value;
      const matchesCampaign = key === 'campaign' || filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
      const matchesLocation = key === 'location' || filters.location.value === 'all' || row.location === filters.location.value;
      return matchesPlatform && matchesAccount && matchesCampaign && matchesLocation && matchesStatus(row) && matchesConversionMetric(row);
    })
    .map((row) => row[key]))].sort();
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

async function loadSyncedRows() {
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

    const generatedAt = payload.generatedAt ? new Date(payload.generatedAt).toLocaleString() : 'just now';
    setSyncStatus('Live API data loaded', `Updated ${generatedAt}. Google: ${sourceSummary(payload.sources && payload.sources.google)}. Meta: ${sourceSummary(payload.sources && payload.sources.meta)}.`);
  } catch (error) {
    clearDashboardData();
    setSyncStatus('Live data unavailable', `${error.message}. Use Refresh data after server refresh is configured.`);
  }
}

function getFilteredRows() {
  return adRows.filter((row) => {
    const matchesPlatform = filters.platform.value === 'all' || row.platform === filters.platform.value;
    const matchesAccount = filters.account.value === 'all' || row.account === filters.account.value;
    const matchesCampaign = filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
    const matchesLocation = filters.location.value === 'all' || row.location === filters.location.value;

    return matchesPlatform && matchesAccount && matchesCampaign && matchesLocation && matchesDate(row) && matchesStatus(row) && matchesConversionMetric(row);
  });
}

function getFilteredLocationRows() {
  const sourceRows = filters.locationType.value === 'targeted' ? targetedLocationRows : allLocationSourceRows();

  return sourceRows.filter((row) => {
    const matchesPlatform = filters.platform.value === 'all' || row.platform === filters.platform.value;
    const matchesAccount = filters.account.value === 'all' || row.account === filters.account.value;
    const matchesCampaign = filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
    const matchesLocation = filters.location.value === 'all' || row.location === filters.location.value;
    const matchesLocationType = filters.locationType.value === 'all' || row.locationType === filters.locationType.value ||
      (filters.locationType.value === 'converting' && row.conversions > 0) ||
      (filters.locationType.value === 'wasted' && row.spend > 0 && row.conversions === 0);

    return matchesPlatform && matchesAccount && matchesCampaign && matchesLocation && matchesLocationType && matchesStatus(row) && matchesConversionMetric(row);
  });
}

function summarize(rows) {
  return rows.reduce((summary, row) => {
    summary.spend += row.spend;
    summary.clicks += row.clicks;
    summary.impressions += row.impressions || 0;
    summary.conversions += row.conversions;
    return summary;
  }, { spend: 0, clicks: 0, impressions: 0, conversions: 0 });
}

function groupRows(rows, key) {
  const groups = new Map();

  rows.forEach((row) => {
    const groupKey = row[key];
    const current = groups.get(groupKey) || { name: groupKey, countryCode: row.countryCode, spend: 0, clicks: 0, impressions: 0, conversions: 0 };
    current.spend += row.spend;
    current.clicks += row.clicks;
    current.impressions += row.impressions || 0;
    current.conversions += row.conversions;
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
      conversions: 0
    };
    current.spend += row.spend;
    current.clicks += row.clicks;
    current.impressions += row.impressions || 0;
    current.conversions += row.conversions;
    if (statusClass(current.status) !== 'active' && statusClass(row.status) === 'active') {
      current.status = row.status;
    }
    groups.set(key, current);
  });

  return [...groups.values()].sort((a, b) => b.conversions - a.conversions || costPer(a) - costPer(b));
}

function costPer(row) {
  return row.conversions ? row.spend / row.conversions : row.spend;
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

function changeText(value) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

function groupDaily(rows) {
  return groupRows(rows, 'date').sort((a, b) => a.name.localeCompare(b.name));
}

function filteredCampaignGroups() {
  return groupCampaignRows(getFilteredRows());
}

function filteredSearchTerms() {
  return searchTermRows.filter((row) => {
    const matchesAccount = filters.account.value === 'all' || row.account === filters.account.value;
    const matchesCampaign = filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
    const matchesFrom = !filters.from.value || row.date >= filters.from.value;
    const matchesTo = !filters.to.value || row.date <= filters.to.value;
    const matchesPlatform = filters.platform.value === 'all' || filters.platform.value === 'Google Ads';
    return matchesPlatform && matchesAccount && matchesCampaign && matchesFrom && matchesTo;
  });
}

function filteredCreatives() {
  return creativeRows.filter((row) => {
    const matchesAccount = filters.account.value === 'all' || row.account === filters.account.value;
    const matchesCampaign = filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
    const matchesLocation = filters.location.value === 'all' || row.location === filters.location.value;
    const matchesFrom = !filters.from.value || row.date >= filters.from.value;
    const matchesTo = !filters.to.value || row.date <= filters.to.value;
    const matchesPlatform = filters.platform.value === 'all' || filters.platform.value === 'Meta Ads';
    return matchesPlatform && matchesAccount && matchesCampaign && matchesLocation && matchesFrom && matchesTo;
  });
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
    ['Highest conversions', bestConv ? `${bestConv.campaign}` : 'No data', bestConv ? `${number.format(bestConv.conversions)} conv. · ${currency.format(bestConv.spend)}` : '', 'positive'],
    ['Lowest cost / conv.', bestCost ? `${bestCost.campaign}` : 'No data', bestCost ? `${currency.format(costPer(bestCost))}/conv.` : '', 'positive'],
    ['Highest wasted spend', wasted ? `${wasted.campaign}` : 'No wasted spend', wasted ? `${currency.format(wasted.spend)} with 0 conv.` : '', wasted ? 'negative' : 'positive'],
    ['Best CTR', bestCtr ? `${bestCtr.campaign}` : 'No data', bestCtr ? `${formatPercent(clickThroughRate(bestCtr))} CTR` : '', 'positive'],
    ['Best country', bestCountry ? bestCountry.name : 'No data', bestCountry ? `${number.format(bestCountry.conversions)} conv. · ${currency.format(bestCountry.spend)}` : '', 'positive']
  ];

  elements.opportunityGrid.innerHTML = cards.map(([label, value, detail, tone]) => `
    <article class="insight-card ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
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
  const cpa = costPer(summary);
  const messages = [
    {
      tone: summary.conversions > 0 ? 'positive' : 'negative',
      title: summary.conversions > 0 ? 'Conversions are being tracked' : 'No conversions in selected view',
      body: `${number.format(summary.conversions)} conversions from ${currency.format(summary.spend)} spend. Cost per conversion is ${currency.format(cpa)}.`
    },
    {
      tone: bestPlatform ? 'positive' : 'neutral',
      title: bestPlatform ? `${bestPlatform.name} is currently strongest` : 'No platform winner yet',
      body: bestPlatform ? `${currency.format(costPer(bestPlatform))}/conv. across ${number.format(bestPlatform.conversions)} conversions.` : 'Not enough conversion data to rank platforms.'
    },
    {
      tone: bestCampaign ? 'positive' : 'neutral',
      title: bestCampaign ? `Best campaign: ${bestCampaign.campaign}` : 'No campaign winner yet',
      body: bestCampaign ? `${number.format(bestCampaign.conversions)} conversions at ${currency.format(costPer(bestCampaign))}/conv.` : 'No campaign has conversion data in this filter.'
    },
    {
      tone: worstCampaign ? 'negative' : 'positive',
      title: worstCampaign ? `Fix wasted spend: ${worstCampaign.campaign}` : 'No major wasted campaign spend',
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

function renderTrendChart(rows) {
  const days = groupDaily(rows).slice(-14);
  const maxSpend = Math.max(...days.map((day) => day.spend), 1);
  const maxConversions = Math.max(...days.map((day) => day.conversions), 1);

  elements.trendChart.innerHTML = days.map((day) => `
    <div class="trend-day">
      <div class="trend-bars">
        <span class="spend-bar" style="height:${Math.max(6, (day.spend / maxSpend) * 100)}%"></span>
        <span class="conv-bar" style="height:${Math.max(6, (day.conversions / maxConversions) * 100)}%"></span>
      </div>
      <small>${day.name.slice(5)}</small>
    </div>
  `).join('') || '<div class="empty-state">No trend data.</div>';
}

function renderComparison() {
  const sortedDates = uniqueValues('date');
  const midpoint = Math.floor(sortedDates.length / 2);
  const previousDates = new Set(sortedDates.slice(0, midpoint));
  const currentDates = new Set(sortedDates.slice(midpoint));
  const baseRows = getFilteredRows();
  const previous = summarize(baseRows.filter((row) => previousDates.has(row.date)));
  const current = summarize(baseRows.filter((row) => currentDates.has(row.date)));
  const spendChange = previous.spend ? ((current.spend - previous.spend) / previous.spend) * 100 : 0;
  const conversionChange = previous.conversions ? ((current.conversions - previous.conversions) / previous.conversions) * 100 : 0;
  const cpaChange = costPer(previous) ? ((costPer(current) - costPer(previous)) / costPer(previous)) * 100 : 0;

  elements.comparisonGrid.innerHTML = `
    <article><span>Spend</span><strong>${changeText(spendChange)}</strong><small>${currency.format(current.spend)} current</small></article>
    <article><span>Conversions</span><strong>${changeText(conversionChange)}</strong><small>${number.format(current.conversions)} current</small></article>
    <article><span>Cost / Conv.</span><strong>${changeText(cpaChange)}</strong><small>${currency.format(costPer(current))} current</small></article>
  `;
}

function campaignScore(row) {
  let score = 0;
  if (row.conversions > 0) score += 35;
  if (conversionRate(row) >= 5) score += 25;
  if (clickThroughRate(row) >= 2) score += 20;
  if (costPer(row) <= 30 && row.conversions > 0) score += 20;
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
  if (row.spend > 100 && row.conversions === 0) return 'Pause / investigate';
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
      <strong>${row.campaign}</strong>
      <span>${healthLabel(row.score)} · ${row.score}/100</span>
      <div><i style="width:${row.score}%"></i></div>
    </div>
  `).join('') || '<div class="empty-state">No campaign health data.</div>';

  elements.recommendationList.innerHTML = visibleRows(campaigns, 'recommendations').map((row) => `
    <div class="recommendation-row ${scoreTone(row.score)}">
      <strong>${recommendationFor(row)}</strong>
      <span>${row.campaign}</span>
      <small>${currency.format(row.spend)} · ${number.format(row.conversions)} conv. · ${currency.format(costPer(row))}/conv.</small>
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
        ${topCampaigns.map((campaign) => `<span>${campaign.campaign} · ${currency.format(costPer(campaign))}/conv.</span>`).join('')}
      </article>
    `;
  }).join('') || '<div class="empty-state">No country drilldown data.</div>';
}

function renderKeywordIntelligence() {
  const rows = getFilteredKeywordRows();
  const best = rows.filter((row) => row.conversions > 0).sort((a, b) => costPer(a) - costPer(b)).slice(0, 3);
  const wasted = rows.filter((row) => row.clicks > 0 && row.conversions === 0).sort((a, b) => b.spend - a.spend).slice(0, 3);
  const renderGroup = (title, list) => `
    <div class="intelligence-card">
      <h3>${title}</h3>
      ${(list.length ? list : [{ keyword: 'No data', spend: 0, clicks: 0, conversions: 0 }]).map((row) => `
        <p><strong>${row.keyword}</strong><span>${currency.format(row.spend)} · ${number.format(row.clicks)} clicks · ${number.format(row.conversions)} conv.</span></p>
      `).join('')}
    </div>
  `;

  elements.keywordIntelligence.innerHTML = renderGroup('Best keywords', best) + renderGroup('Wasted keywords', wasted);
}

function renderSearchTerms() {
  const rows = filteredSearchTerms().sort((a, b) => b.conversions - a.conversions || b.spend - a.spend);
  updateToggle('searchTerms', rows.length);
  elements.searchTermList.innerHTML = visibleRows(rows, 'searchTerms').map((row) => `
    <div class="mini-row">
      <strong>${row.searchTerm}</strong>
      <span>${row.campaign} · ${currency.format(row.spend)} · ${number.format(row.conversions)} conv.</span>
    </div>
  `).join('') || '<div class="empty-state">No search term data available.</div>';
}

function renderCreativeTable() {
  const rows = filteredCreatives().sort((a, b) => b.conversions - a.conversions || costPer(a) - costPer(b));
  updateToggle('creatives', rows.length);
  elements.creativeRows.innerHTML = visibleRows(rows, 'creatives').map((row) => `
    <tr>
      <td>${row.adName}</td>
      <td>${row.adSet}</td>
      <td>${row.campaign}</td>
      <td>${row.location}</td>
      <td>${currency.format(row.spend)}</td>
      <td>${number.format(row.impressions)}</td>
      <td>${number.format(row.clicks)}</td>
      <td>${number.format(row.conversions)}</td>
      <td>${formatPercent(clickThroughRate(row))}</td>
      <td>${currency.format(costPerClick(row))}</td>
      <td>${currency.format(costPer(row))}</td>
    </tr>
  `).join('') || '<tr><td class="empty-state" colspan="11">No Meta creative data for this filter.</td></tr>';
}

function renderKpis(rows) {
  const summary = summarize(rows);
  elements.totalSpend.textContent = currency.format(summary.spend);
  elements.totalImpressions.textContent = number.format(summary.impressions);
  elements.totalClicks.textContent = number.format(summary.clicks);
  elements.totalConversions.textContent = number.format(summary.conversions);
  elements.ctr.textContent = formatPercent(clickThroughRate(summary));
  elements.cpc.textContent = currency.format(costPerClick(summary));
  elements.costPerConversion.textContent = summary.conversions ? currency.format(summary.spend / summary.conversions) : currency.format(0);
  elements.conversionRate.textContent = formatPercent(summary.clicks ? (summary.conversions / summary.clicks) * 100 : 0);
  elements.spendNote.textContent = `${number.format(summary.clicks)} ad clicks selected`;
  elements.selectedRange.textContent = `${filters.from.value || 'Start'} to ${filters.to.value || 'Today'}`;
}

function renderAccountBreakdown(rows) {
  const accountGroups = groupRows(rows, 'account');
  const maxSpend = Math.max(...accountGroups.map((group) => group.spend), 1);
  updateToggle('accounts', accountGroups.length);

  elements.accountBreakdown.innerHTML = visibleRows(accountGroups, 'accounts').map((group) => {
    const width = Math.max((group.spend / maxSpend) * 100, 3);
    return `
      <div class="bar-row">
        <div class="bar-meta">
          <strong>${group.name}</strong>
          <span>${currency.format(group.spend)} · ${number.format(group.conversions)} conv.</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill account" style="width:${width}%"></div>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty-state">No account data for this filter.</div>';
}

function renderPlatformBreakdown(rows) {
  const platformGroups = groupRows(rows, 'platform');
  const maxConversions = Math.max(...platformGroups.map((group) => group.conversions), 1);

  elements.platformBreakdown.innerHTML = platformGroups.map((group) => {
    const width = Math.max((group.conversions / maxConversions) * 100, 3);
    const className = group.name === 'Meta Ads' ? 'meta' : 'google';
    return `
      <div class="bar-row">
        <div class="bar-meta">
          <strong>${group.name}</strong>
          <span>${number.format(group.conversions)} conv. · ${currency.format(group.spend)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${className}" style="width:${width}%"></div>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty-state">No platform data for this filter.</div>';
}

function renderLocationBreakdown(rows) {
  const locations = groupRows(rows, 'location');
  updateToggle('locations', locations.length);

  elements.locationBreakdown.innerHTML = visibleRows(locations, 'locations').map((location, index) => `
    <div class="location-row">
      <span class="location-rank">${index + 1}</span>
      <strong>${location.name}</strong>
      <span>${currency.format(location.spend)} · ${number.format(location.impressions)} impr. · ${number.format(location.conversions)} conv.</span>
    </div>
  `).join('') || '<div class="empty-state">No location data for this filter.</div>';
}

function renderCountryMap(rows) {
  const countries = groupRows(rows, 'location').slice(0, 14);
  const maxSpend = Math.max(...countries.map((country) => country.spend), 1);
  const locationTypeLabel = filters.locationType.options[filters.locationType.selectedIndex].textContent;
  const firstSummary = countries[0]
    ? `${locationTypeLabel} · ${countries[0].name}: ${currency.format(countries[0].spend)} spend, ${number.format(countries[0].impressions)} impressions, ${number.format(countries[0].clicks)} clicks, ${number.format(countries[0].conversions)} conversions`
    : 'Hover a country marker to view KPIs.';

  if (window.L) {
    if (!leafletMap) {
      elements.countryMap.innerHTML = '';
      leafletMap = window.L.map(elements.countryMap, {
        attributionControl: false,
        scrollWheelZoom: false,
        worldCopyJump: true
      }).setView([23.5, 45], 2);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 7,
        minZoom: 2
      }).addTo(leafletMap);
      leafletLayer = window.L.layerGroup().addTo(leafletMap);
    }

    leafletLayer.clearLayers();
    const bounds = [];

    countries.forEach((country) => {
      const coordinates = countryCoordinates[country.countryCode];
      if (!coordinates) return;

      const radius = Math.max(9, Math.min(34, 9 + (country.spend / maxSpend) * 25));
      const summary = `${locationTypeLabel} · ${country.name}: ${currency.format(country.spend)} spend, ${number.format(country.impressions)} impressions, ${number.format(country.clicks)} clicks, ${number.format(country.conversions)} conversions`;
      const marker = window.L.circleMarker(coordinates, {
        radius,
        color: '#aaff00',
        weight: 2,
        fillColor: '#aaff00',
        fillOpacity: 0.32
      }).bindTooltip(`
        <strong>${country.name}</strong><br>
        ${locationTypeLabel}<br>
        ${currency.format(country.spend)} spend<br>
        ${number.format(country.impressions)} impressions<br>
        ${number.format(country.clicks)} clicks · ${number.format(country.conversions)} conv.
      `);

      marker.on('mouseover click', () => {
        elements.countryTooltip.textContent = summary;
      });
      marker.addTo(leafletLayer);
      bounds.push(coordinates);
    });

    if (bounds.length) {
      leafletMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 4 });
    }
    setTimeout(() => leafletMap.invalidateSize(), 0);
    elements.countryTooltip.textContent = firstSummary;
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
  const campaignRows = groupCampaignRows(rows);
  updateToggle('campaigns', campaignRows.length);

  elements.campaignRows.innerHTML = visibleRows(campaignRows, 'campaigns').map((row) => {
    const platformClass = row.platform === 'Meta Ads' ? 'meta' : 'google';
    return `
      <tr>
        <td><span class="platform-tag ${platformClass}">${row.platform}</span></td>
        <td>${row.account}</td>
        <td>${statusBadge(row.status)}</td>
        <td>${row.campaign}</td>
        <td>${row.location}</td>
        <td>${currency.format(row.spend)}</td>
        <td>${number.format(row.impressions)}</td>
        <td>${number.format(row.clicks)}</td>
        <td>${number.format(row.conversions)}</td>
        <td>${formatPercent(clickThroughRate(row))}</td>
        <td>${currency.format(costPerClick(row))}</td>
        <td>${currency.format(costPer(row))}</td>
        <td>${formatPercent(conversionRate(row))}</td>
      </tr>
    `;
  }).join('') || '<tr><td class="empty-state" colspan="13">No campaign data for this filter.</td></tr>';
}

function getFilteredKeywordRows() {
  return keywordRows.filter((row) => {
    const matchesAccount = filters.account.value === 'all' || row.account === filters.account.value;
    const matchesCampaign = filters.campaign.value === 'all' || row.campaign === filters.campaign.value;
    const matchesFrom = !filters.from.value || row.date >= filters.from.value;
    const matchesTo = !filters.to.value || row.date <= filters.to.value;
    const matchesPlatform = filters.platform.value === 'all' || filters.platform.value === 'Google Ads';

    return matchesPlatform && matchesAccount && matchesCampaign && matchesFrom && matchesTo;
  });
}

function renderKeywordTable() {
  const rows = getFilteredKeywordRows()
    .sort((a, b) => b.conversions - a.conversions || costPer(a) - costPer(b));
  updateToggle('keywords', rows.length);

  elements.keywordRows.innerHTML = visibleRows(rows, 'keywords').map((row) => `
    <tr>
      <td>${row.keyword}</td>
      <td>${row.matchType}</td>
      <td>${row.campaign}</td>
      <td>${row.adGroup}</td>
      <td>${currency.format(row.spend)}</td>
      <td>${number.format(row.impressions)}</td>
      <td>${number.format(row.clicks)}</td>
      <td>${number.format(row.conversions)}</td>
      <td>${formatPercent(clickThroughRate(row))}</td>
      <td>${currency.format(costPerClick(row))}</td>
      <td>${currency.format(costPer(row))}</td>
    </tr>
  `).join('') || '<tr><td class="empty-state" colspan="11">No Google keyword data for this filter.</td></tr>';
}

function renderDashboard() {
  const rows = getFilteredRows();
  const locationRows = getFilteredLocationRows();
  renderKpis(rows);
  renderManagementSummary(rows);
  renderOpportunities(rows);
  renderAlerts();
  renderTrendChart(rows);
  renderComparison();
  renderHealthAndRecommendations();
  renderFunnel(rows);
  renderPlatformBreakdown(rows);
  renderAccountBreakdown(rows);
  renderLocationBreakdown(locationRows);
  renderCountryMap(locationRows);
  renderCountryDrilldown(locationRows);
  renderTable(rows);
  renderKeywordIntelligence();
  renderSearchTerms();
  renderKeywordTable();
  renderCreativeTable();
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
    costPer(row).toFixed(2),
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

function copySummary() {
  const summary = summarize(getFilteredRows());
  const text = `TP Club Ads Summary\nSpend: ${currency.format(summary.spend)}\nImpressions: ${number.format(summary.impressions)}\nClicks: ${number.format(summary.clicks)}\nConversions: ${number.format(summary.conversions)}\nCost/Conv: ${currency.format(costPer(summary))}\nConversion rate: ${formatPercent(conversionRate(summary))}`;
  navigator.clipboard.writeText(text).then(() => {
    elements.copySummary.textContent = 'Copied';
    setTimeout(() => {
      elements.copySummary.textContent = 'Copy Summary';
    }, 1600);
  });
}

async function refreshDashboardData() {
  const originalText = elements.refreshData.textContent;
  const endpoint = window.__DASHBOARD_AUTH__ && window.__DASHBOARD_AUTH__.refreshEndpoint;
  elements.refreshData.textContent = 'Refreshing...';
  elements.refreshData.disabled = true;

  try {
    if (!endpoint) throw new Error('Refresh endpoint is not configured');
    if (!dashboardRefreshPassword) throw new Error('Please log out and unlock again before server refresh');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: dashboardRefreshPassword })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.error || result.message || 'Server refresh failed');
    }
  } catch (error) {
    setSyncStatus('Server refresh unavailable', error.message);
  }

  await loadSyncedRows();
  refreshDependentFilters();
  renderDashboard();

  elements.refreshData.textContent = 'Data refreshed';
  setTimeout(() => {
    elements.refreshData.textContent = originalText;
    elements.refreshData.disabled = false;
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

  setDatePreset(filters.datePreset.value);
  refreshDependentFilters();
  renderDashboard();
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
    if ([filters.platform, filters.account, filters.status, filters.campaign, filters.locationType, filters.location, filters.conversionMetric].includes(filter)) {
      refreshDependentFilters();
    }
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
  elements.printReport.addEventListener('click', () => window.print());
  elements.copySummary.addEventListener('click', copySummary);
  elements.toggleFilters.addEventListener('click', toggleFilters);
  elements.resetFilters.addEventListener('click', resetFilters);
  renderDashboard();
}

initDashboard();
