require('dotenv').config();

const http = require('http');
const { URL } = require('url');

const HOST = process.env.GOOGLE_OAUTH_HOST || '127.0.0.1';
const PORT = Number(process.env.GOOGLE_OAUTH_PORT || 8080);
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || `http://${HOST}:${PORT}/`;
const SCOPE = 'https://www.googleapis.com/auth/adwords';

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Missing GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET in .env');
  process.exit(1);
}

function maskClientId(value) {
  if (!value || value.length < 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-20)}`;
}

function buildAuthUrl() {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function exchangeCode(code) {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error_description || body.error || `Token exchange failed (${response.status})`);
  }
  return body;
}

function printSetupInstructions() {
  console.log('\nGoogle Ads refresh token helper\n');
  console.log('Using OAuth client:', maskClientId(clientId));
  console.log('\nIf you see redirect_uri_mismatch, add this EXACT URI in Google Cloud Console:');
  console.log(`  ${REDIRECT_URI}`);
  console.log('\nWhere to add it:');
  console.log('  Google Cloud Console → APIs & Services → Credentials');
  console.log('  → open the OAuth client that matches GOOGLE_ADS_CLIENT_ID in .env');
  console.log('  → Application type must be "Web application" (not Desktop)');
  console.log('  → Authorized redirect URIs → Add URI → Save');
  console.log('\nAlso try without trailing slash if mismatch persists:');
  console.log(`  ${REDIRECT_URI.replace(/\/$/, '')}`);
  console.log('\nOr use OAuth Playground instead (see HOSTINGER.md — no localhost needed).\n');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);

  if (url.pathname !== '/') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'content-type': 'text/html; charset=utf-8' });
    res.end(`<h1>Google sign-in failed</h1><p>${error}</p>`);
    console.error(`Google returned error: ${error}`);
    if (error === 'redirect_uri_mismatch') {
      console.error(`\nAdd this exact redirect URI to your OAuth client:\n  ${REDIRECT_URI}\n`);
    }
    server.close();
    process.exit(1);
    return;
  }

  if (!code) {
    res.writeHead(400, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<h1>Missing authorization code</h1>');
    return;
  }

  try {
    const tokens = await exchangeCode(code);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<h1>Success</h1><p>You can close this tab and return to the terminal.</p>');

    console.log('\n--- Google OAuth tokens ---\n');
    if (tokens.refresh_token) {
      console.log('Add this to .env and Hostinger:\n');
      console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    } else {
      console.log('No refresh_token in response.');
      console.log('Revoke app access at https://myaccount.google.com/permissions');
      console.log('Then run this script again (prompt=consent forces a new refresh token).\n');
    }
    if (tokens.access_token) {
      console.log('Access token received (short-lived, for testing only).');
    }
    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' });
    res.end(`<h1>Token exchange failed</h1><pre>${err.message}</pre>`);
    console.error(err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, HOST, () => {
  printSetupInstructions();
  const authUrl = buildAuthUrl();
  console.log('Open this URL and sign in with the Google account linked to Ads:\n');
  console.log(authUrl);
  console.log('\nWaiting for redirect...\n');
});
