require('dotenv').config();

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outputPaths = [
  path.join(rootDir, 'public', 'dashboard', 'data', 'ads-dashboard.json'),
  path.join(rootDir, 'dist', 'dashboard', 'data', 'ads-dashboard.json')
];

const googleApiVersion = process.env.GOOGLE_ADS_API_VERSION || 'v24';
const metaApiVersion = process.env.META_API_VERSION || 'v23.0';
const metaConversionActionTypes = (process.env.META_CONVERSION_ACTION_TYPES || 'offsite_conversion.fb_pixel_start_trial,start_trial,lead,complete_registration')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const countryNames = {
  AE: 'United Arab Emirates',
  AU: 'Australia',
  BH: 'Bahrain',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  GB: 'United Kingdom',
  IN: 'India',
  KW: 'Kuwait',
  OM: 'Oman',
  PK: 'Pakistan',
  QA: 'Qatar',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  US: 'United States'
};

const googleCountryCriteria = {
  2036: { code: 'AU', name: 'Australia' },
  2048: { code: 'BH', name: 'Bahrain' },
  2124: { code: 'CA', name: 'Canada' },
  2276: { code: 'DE', name: 'Germany' },
  2250: { code: 'FR', name: 'France' },
  2826: { code: 'GB', name: 'United Kingdom' },
  2356: { code: 'IN', name: 'India' },
  2414: { code: 'KW', name: 'Kuwait' },
  2512: { code: 'OM', name: 'Oman' },
  2586: { code: 'PK', name: 'Pakistan' },
  2634: { code: 'QA', name: 'Qatar' },
  2682: { code: 'SA', name: 'Saudi Arabia' },
  2702: { code: 'SG', name: 'Singapore' },
  2784: { code: 'AE', name: 'United Arab Emirates' },
  2840: { code: 'US', name: 'United States' }
};

function sanitizeError(error) {
  if (!error) return 'Unknown error';
  const message = error.message || String(error);
  return message
    .replace(/access_token=[^&\s]+/g, 'access_token=REDACTED')
    .replace(/Bearer\s+[A-Za-z0-9._/-]+/g, 'Bearer REDACTED')
    .replace(/client_secret=[^&\s]+/g, 'client_secret=REDACTED');
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeCustomerId(value) {
  return String(value || '').replace(/\D/g, '');
}

function countryFromGeoTargetResource(resourceName) {
  const id = Number(String(resourceName || '').split('/').pop());
  return googleCountryCriteria[id] || { code: '', name: resourceName || 'Unknown targeted location' };
}

function isoDate(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : {};
  } catch (_error) {
    body = { raw: text };
  }

  if (!response.ok) {
    const detail = body.error && (body.error.message || JSON.stringify(body.error));
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  return body;
}

async function getGoogleAccessToken() {
  const required = [
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN'
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing ${missing.join(', ')}`);
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
  });

  const body = await requestJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!body.access_token) {
    throw new Error('Google OAuth did not return an access token');
  }

  return body.access_token;
}

async function googleSearch(accessToken, query) {
  const customerId = normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID);
  if (!customerId) {
    throw new Error('Missing GOOGLE_ADS_CUSTOMER_ID');
  }

  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    throw new Error('Missing GOOGLE_ADS_DEVELOPER_TOKEN');
  }

  const headers = {
    authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'content-type': 'application/json'
  };

  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers['login-customer-id'] = normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  }

  const body = await requestJson(`https://googleads.googleapis.com/${googleApiVersion}/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });

  return body.flatMap((chunk) => chunk.results || []);
}

function googleMetricRow(result, fallbackLocation = 'All locations') {
  const metrics = result.metrics || {};
  const campaign = result.campaign || {};
  const customer = result.customer || {};
  const segments = result.segments || {};
  const geographicView = result.geographicView || {};
  const userLocationView = result.userLocationView || {};
  const criterionId = geographicView.countryCriterionId || userLocationView.countryCriterionId;
  const criterion = googleCountryCriteria[criterionId];
  const countryCode = criterion ? criterion.code : '';
  const countryName = criterion ? criterion.name : fallbackLocation;
  const location = countryName || segments.geoTargetCity || segments.geoTargetRegion || segments.geoTargetCountry || fallbackLocation;

  return {
    date: segments.date,
    platform: 'Google Ads',
    account: customer.descriptiveName || `Customer ${process.env.GOOGLE_ADS_CUSTOMER_ID}`,
    campaign: campaign.name || 'Unknown campaign',
    status: campaign.status || 'UNKNOWN',
    locationType: 'delivered',
    location: String(location).replace('geoTargetConstants/', 'Location '),
    countryCode,
    countryName: location,
    spend: toNumber(metrics.costMicros) / 1000000,
    clicks: toNumber(metrics.clicks),
    impressions: toNumber(metrics.impressions),
    conversions: toNumber(metrics.conversions),
    source: 'google_ads_api'
  };
}

async function fetchGoogleRows() {
  const accessToken = await getGoogleAccessToken();
  const dateFilter = `segments.date BETWEEN '${isoDate(30)}' AND '${isoDate(0)}'`;

  const countryQuery = `
    SELECT
      segments.date,
      user_location_view.country_criterion_id,
      customer.descriptive_name,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions
    FROM user_location_view
    WHERE ${dateFilter}
      AND campaign.status != 'REMOVED'
  `;

  try {
    const results = await googleSearch(accessToken, countryQuery);
    return results.map((result) => googleMetricRow(result));
  } catch (error) {
    const campaignQuery = `
      SELECT
        segments.date,
        customer.descriptive_name,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions
      FROM campaign
      WHERE ${dateFilter}
        AND campaign.status != 'REMOVED'
    `;

    const results = await googleSearch(accessToken, campaignQuery);
    return results.map((result) => googleMetricRow(result, 'All Google locations'));
  }
}

function googleTargetedLocationRow(result) {
  const campaign = result.campaign || {};
  const customer = result.customer || {};
  const criterion = result.campaignCriterion || {};
  const location = criterion.location || {};
  const country = countryFromGeoTargetResource(location.geoTargetConstant);

  return {
    date: isoDate(0),
    platform: 'Google Ads',
    account: customer.descriptiveName || `Customer ${process.env.GOOGLE_ADS_CUSTOMER_ID}`,
    campaign: campaign.name || 'Unknown campaign',
    status: campaign.status || 'UNKNOWN',
    locationType: 'targeted',
    location: country.name,
    countryCode: country.code,
    countryName: country.name,
    spend: 0,
    clicks: 0,
    impressions: 0,
    conversions: 0,
    source: 'google_ads_targeting'
  };
}

async function fetchGoogleTargetedLocationRows() {
  const accessToken = await getGoogleAccessToken();
  const targetedQuery = `
    SELECT
      customer.descriptive_name,
      campaign.name,
      campaign.status,
      campaign_criterion.location.geo_target_constant
    FROM campaign_criterion
    WHERE campaign_criterion.type = 'LOCATION'
      AND campaign_criterion.negative = false
      AND campaign.status != 'REMOVED'
  `;

  const results = await googleSearch(accessToken, targetedQuery);
  return results.map((result) => googleTargetedLocationRow(result));
}

function googleKeywordRow(result) {
  const metrics = result.metrics || {};
  const campaign = result.campaign || {};
  const customer = result.customer || {};
  const segments = result.segments || {};
  const adGroup = result.adGroup || {};
  const criterion = result.adGroupCriterion || {};
  const keyword = criterion.keyword || {};

  return {
    date: segments.date,
    platform: 'Google Ads',
    account: customer.descriptiveName || `Customer ${process.env.GOOGLE_ADS_CUSTOMER_ID}`,
    campaign: campaign.name || 'Unknown campaign',
    status: campaign.status || 'UNKNOWN',
    adGroup: adGroup.name || 'Unknown ad group',
    keyword: keyword.text || 'Unknown keyword',
    matchType: keyword.matchType || '',
    spend: toNumber(metrics.costMicros) / 1000000,
    clicks: toNumber(metrics.clicks),
    impressions: toNumber(metrics.impressions),
    conversions: toNumber(metrics.conversions),
    source: 'google_ads_api'
  };
}

async function fetchGoogleKeywordRows() {
  const accessToken = await getGoogleAccessToken();
  const dateFilter = `segments.date BETWEEN '${isoDate(30)}' AND '${isoDate(0)}'`;
  const keywordQuery = `
    SELECT
      segments.date,
      customer.descriptive_name,
      campaign.name,
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions
    FROM keyword_view
    WHERE ${dateFilter}
      AND campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
      AND ad_group_criterion.status != 'REMOVED'
  `;

  const results = await googleSearch(accessToken, keywordQuery);
  return results.map((result) => googleKeywordRow(result));
}

function googleSearchTermRow(result) {
  const metrics = result.metrics || {};
  const campaign = result.campaign || {};
  const customer = result.customer || {};
  const segments = result.segments || {};
  const adGroup = result.adGroup || {};
  const searchTermView = result.searchTermView || {};

  return {
    date: segments.date,
    platform: 'Google Ads',
    account: customer.descriptiveName || `Customer ${process.env.GOOGLE_ADS_CUSTOMER_ID}`,
    campaign: campaign.name || 'Unknown campaign',
    adGroup: adGroup.name || 'Unknown ad group',
    searchTerm: searchTermView.searchTerm || 'Unknown search term',
    status: campaign.status || 'UNKNOWN',
    spend: toNumber(metrics.costMicros) / 1000000,
    clicks: toNumber(metrics.clicks),
    impressions: toNumber(metrics.impressions),
    conversions: toNumber(metrics.conversions),
    source: 'google_ads_api'
  };
}

async function fetchGoogleSearchTermRows() {
  const accessToken = await getGoogleAccessToken();
  const dateFilter = `segments.date BETWEEN '${isoDate(30)}' AND '${isoDate(0)}'`;
  const searchTermQuery = `
    SELECT
      segments.date,
      customer.descriptive_name,
      campaign.name,
      campaign.status,
      ad_group.name,
      search_term_view.search_term,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions
    FROM search_term_view
    WHERE ${dateFilter}
      AND campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
  `;

  const results = await googleSearch(accessToken, searchTermQuery);
  return results.map((result) => googleSearchTermRow(result));
}

function metaConversionCount(actions = []) {
  return actions.reduce((total, action) => {
    const actionType = action.action_type || '';
    const isConfigured = metaConversionActionTypes.includes(actionType);
    const isTrialLike = actionType.toLowerCase().includes('trial');
    return total + (isConfigured || isTrialLike ? toNumber(action.value) : 0);
  }, 0);
}

async function fetchMetaPage(url) {
  const rows = [];
  let nextUrl = url;

  while (nextUrl) {
    const body = await requestJson(nextUrl);
    rows.push(...(body.data || []));
    nextUrl = body.paging && body.paging.next ? body.paging.next : '';
  }

  return rows;
}

async function fetchMetaRows() {
  if (!process.env.META_AD_ACCOUNT_ID || !process.env.META_ACCESS_TOKEN) {
    throw new Error('Missing META_AD_ACCOUNT_ID or META_ACCESS_TOKEN');
  }

  const accountId = String(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, '');
  const campaignStatuses = await fetchMetaCampaignStatuses(accountId);
  const params = new URLSearchParams({
    access_token: process.env.META_ACCESS_TOKEN,
    level: 'campaign',
    fields: 'date_start,account_name,campaign_id,campaign_name,spend,clicks,impressions,actions',
    time_increment: '1',
    date_preset: 'last_30d',
    breakdowns: 'country',
    limit: '500'
  });

  const rows = await fetchMetaPage(`https://graph.facebook.com/${metaApiVersion}/act_${accountId}/insights?${params.toString()}`);

  return rows.map((row) => ({
    date: row.date_start,
    platform: 'Meta Ads',
    account: row.account_name || `Ad Account ${accountId}`,
    campaign: row.campaign_name || 'Unknown campaign',
    status: campaignStatuses.get(row.campaign_id) || 'UNKNOWN',
    locationType: 'delivered',
    location: countryNames[row.country] || row.country || 'All Meta locations',
    countryCode: row.country || '',
    countryName: countryNames[row.country] || row.country || 'All Meta locations',
    spend: toNumber(row.spend),
    clicks: toNumber(row.clicks),
    impressions: toNumber(row.impressions),
    conversions: metaConversionCount(row.actions || []),
    source: 'meta_marketing_api'
  }));
}

async function fetchMetaCampaignStatuses(accountId) {
  const params = new URLSearchParams({
    access_token: process.env.META_ACCESS_TOKEN,
    fields: 'id,effective_status',
    limit: '500'
  });
  const rows = await fetchMetaPage(`https://graph.facebook.com/${metaApiVersion}/act_${accountId}/campaigns?${params.toString()}`);
  return new Map(rows.map((row) => [row.id, row.effective_status || 'UNKNOWN']));
}

async function fetchMetaTargetedLocationRows() {
  if (!process.env.META_AD_ACCOUNT_ID || !process.env.META_ACCESS_TOKEN) {
    throw new Error('Missing META_AD_ACCOUNT_ID or META_ACCESS_TOKEN');
  }

  const accountId = String(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, '');
  const params = new URLSearchParams({
    access_token: process.env.META_ACCESS_TOKEN,
    fields: 'name,effective_status,campaign{name,effective_status},targeting',
    limit: '500'
  });
  const rows = await fetchMetaPage(`https://graph.facebook.com/${metaApiVersion}/act_${accountId}/adsets?${params.toString()}`);

  return rows.flatMap((row) => {
    const countries = (row.targeting && row.targeting.geo_locations && row.targeting.geo_locations.countries) || [];
    return countries.map((code) => ({
      date: isoDate(0),
      platform: 'Meta Ads',
      account: `Ad Account ${accountId}`,
      campaign: row.campaign && row.campaign.name ? row.campaign.name : 'Unknown campaign',
      status: row.campaign && row.campaign.effective_status ? row.campaign.effective_status : row.effective_status || 'UNKNOWN',
      locationType: 'targeted',
      location: countryNames[code] || code,
      countryCode: code,
      countryName: countryNames[code] || code,
      spend: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
      source: 'meta_ads_targeting'
    }));
  });
}

async function fetchMetaAdRows() {
  if (!process.env.META_AD_ACCOUNT_ID || !process.env.META_ACCESS_TOKEN) {
    throw new Error('Missing META_AD_ACCOUNT_ID or META_ACCESS_TOKEN');
  }

  const accountId = String(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, '');
  const params = new URLSearchParams({
    access_token: process.env.META_ACCESS_TOKEN,
    level: 'ad',
    fields: 'date_start,account_name,campaign_name,adset_name,ad_name,spend,clicks,impressions,actions',
    time_increment: '1',
    date_preset: 'last_30d',
    breakdowns: 'country',
    limit: '500'
  });

  const rows = await fetchMetaPage(`https://graph.facebook.com/${metaApiVersion}/act_${accountId}/insights?${params.toString()}`);

  return rows.map((row) => ({
    date: row.date_start,
    platform: 'Meta Ads',
    account: row.account_name || `Ad Account ${accountId}`,
    campaign: row.campaign_name || 'Unknown campaign',
    adSet: row.adset_name || 'Unknown ad set',
    adName: row.ad_name || 'Unknown ad',
    locationType: 'delivered',
    location: countryNames[row.country] || row.country || 'All Meta locations',
    countryCode: row.country || '',
    spend: toNumber(row.spend),
    clicks: toNumber(row.clicks),
    impressions: toNumber(row.impressions),
    conversions: metaConversionCount(row.actions || []),
    source: 'meta_marketing_api'
  }));
}

async function runSource(name, fetcher) {
  try {
    const rows = await fetcher();
    return {
      status: { ok: true, rowCount: rows.length },
      rows
    };
  } catch (error) {
    return {
      status: { ok: false, rowCount: 0, error: sanitizeError(error) },
      rows: []
    };
  }
}

async function main() {
  const [google, googleTargetedLocations, googleKeywords, googleSearchTerms, meta, metaTargetedLocations, metaAds] = await Promise.all([
    runSource('google', fetchGoogleRows),
    runSource('googleTargetedLocations', fetchGoogleTargetedLocationRows),
    runSource('googleKeywords', fetchGoogleKeywordRows),
    runSource('googleSearchTerms', fetchGoogleSearchTermRows),
    runSource('meta', fetchMetaRows),
    runSource('metaTargetedLocations', fetchMetaTargetedLocationRows),
    runSource('metaAds', fetchMetaAdRows)
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    range: {
      from: isoDate(30),
      to: isoDate(0)
    },
    sources: {
      google: google.status,
      googleTargetedLocations: googleTargetedLocations.status,
      googleKeywords: googleKeywords.status,
      googleSearchTerms: googleSearchTerms.status,
      meta: meta.status,
      metaTargetedLocations: metaTargetedLocations.status,
      metaAds: metaAds.status
    },
    rows: [...google.rows, ...meta.rows].filter((row) => row.date),
    targetedLocationRows: [...googleTargetedLocations.rows, ...metaTargetedLocations.rows].filter((row) => row.location),
    keywordRows: googleKeywords.rows.filter((row) => row.date),
    searchTermRows: googleSearchTerms.rows.filter((row) => row.date),
    creativeRows: metaAds.rows.filter((row) => row.date)
  };

  const writableOutputPaths = outputPaths.filter((outputPath) => {
    const isDistOutput = outputPath.includes(`${path.sep}dist${path.sep}`);
    return !isDistOutput || fs.existsSync(path.join(rootDir, 'dist'));
  });

  writableOutputPaths.forEach((outputPath) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  });

  console.log(`Ads dashboard sync complete: ${payload.rows.length} rows written to ${writableOutputPaths.length} output path(s).`);
  console.log(`Google Ads: ${payload.sources.google.ok ? 'ok' : 'failed'} (${payload.sources.google.rowCount} rows)`);
  console.log(`Google Targeted Locations: ${payload.sources.googleTargetedLocations.ok ? 'ok' : 'failed'} (${payload.sources.googleTargetedLocations.rowCount} rows)`);
  console.log(`Google Keywords: ${payload.sources.googleKeywords.ok ? 'ok' : 'failed'} (${payload.sources.googleKeywords.rowCount} rows)`);
  console.log(`Google Search Terms: ${payload.sources.googleSearchTerms.ok ? 'ok' : 'failed'} (${payload.sources.googleSearchTerms.rowCount} rows)`);
  console.log(`Meta Ads: ${payload.sources.meta.ok ? 'ok' : 'failed'} (${payload.sources.meta.rowCount} rows)`);
  console.log(`Meta Targeted Locations: ${payload.sources.metaTargetedLocations.ok ? 'ok' : 'failed'} (${payload.sources.metaTargetedLocations.rowCount} rows)`);
  console.log(`Meta Creatives: ${payload.sources.metaAds.ok ? 'ok' : 'failed'} (${payload.sources.metaAds.rowCount} rows)`);

  if (!payload.sources.google.ok) console.log(`Google Ads error: ${payload.sources.google.error}`);
  if (!payload.sources.googleTargetedLocations.ok) console.log(`Google Targeted Locations error: ${payload.sources.googleTargetedLocations.error}`);
  if (!payload.sources.googleKeywords.ok) console.log(`Google Keywords error: ${payload.sources.googleKeywords.error}`);
  if (!payload.sources.googleSearchTerms.ok) console.log(`Google Search Terms error: ${payload.sources.googleSearchTerms.error}`);
  if (!payload.sources.meta.ok) console.log(`Meta Ads error: ${payload.sources.meta.error}`);
  if (!payload.sources.metaTargetedLocations.ok) console.log(`Meta Targeted Locations error: ${payload.sources.metaTargetedLocations.error}`);
  if (!payload.sources.metaAds.ok) console.log(`Meta Creatives error: ${payload.sources.metaAds.error}`);
}

main().catch((error) => {
  console.error(sanitizeError(error));
  process.exit(1);
});
