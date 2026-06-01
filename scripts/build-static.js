require('dotenv').config();

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const rootDir = path.join(__dirname, '..');
const viewsDir = path.join(rootDir, 'views');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

const locales = {
  en: require('../locales/en.json'),
  zh: require('../locales/zh.json')
};

const config = {
  siteUrl: (process.env.SITE_URL || 'https://tpclub.co').replace(/\/$/, ''),
  gtmId: process.env.VITE_GTM_ID || '',
  telegramUrl: process.env.TELEGRAM_URL || 'https://t.me/+5715hMkkOso3ZGY8',
  telegramRedirectPath: '/go/',
  telegramChannelUrl: process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/OfficialTPClub',
  bitunixUrl: process.env.BITUNIX_REFERRAL_URL || 'https://www.bitunix.com/register?vipCode=TPclubJackman',
  youtubeUrl: process.env.YOUTUBE_URL || 'https://www.youtube.com/@TPClub'
};

function pageUrl(lang, pagePath = '') {
  return `${config.siteUrl}/${lang}${pagePath}`;
}

function buildStructuredData({ lang, t, pagePath = '', includeFaq = false }) {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'TP Club',
    alternateName: '止盈社',
    url: config.siteUrl,
    logo: `${config.siteUrl}/images/logo.png`,
    description: 'Australian Mandarin-speaking crypto education community',
    areaServed: 'AU',
    knowsLanguage: ['en', 'zh'],
    sameAs: [config.telegramUrl, config.telegramChannelUrl]
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'TP Club',
        item: config.siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: lang === 'zh' ? '中文' : 'English',
        item: pageUrl(lang, pagePath)
      }
    ]
  };

  const schema = [organization, breadcrumb];
  if (includeFaq) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    });
  }

  return schema;
}

function buildSeo({ lang, t, pagePath = '' }) {
  return {
    canonical: pageUrl(lang, pagePath),
    ogUrl: pageUrl(lang, pagePath),
    ogImage: `${config.siteUrl}/images/og-${lang}.jpg`,
    hrefLang: {
      en: `${config.siteUrl}/en${pagePath}`,
      zh: `${config.siteUrl}/zh${pagePath}`,
      default: `${config.siteUrl}/en`
    },
    structuredData: buildStructuredData({ lang, t, pagePath, includeFaq: pagePath === '' })
  };
}

async function renderPage({ lang, view, outputPath, pageKey, pagePath = '' }) {
  const t = locales[lang];
  const page = pageKey ? t.pages[pageKey] : undefined;
  const html = await ejs.renderFile(
    path.join(viewsDir, 'layout.ejs'),
    {
      lang,
      t,
      view,
      page,
      pageTitle: page ? page.title : undefined,
      pageDescription: page ? page.intro : undefined,
      seo: buildSeo({ lang, t, pagePath }),
      siteUrl: config.siteUrl,
      gtmId: config.gtmId,
      telegramUrl: config.telegramRedirectPath,
      telegramChannelUrl: config.telegramChannelUrl,
      bitunixUrl: config.bitunixUrl,
      youtubeUrl: config.youtubeUrl
    },
    {
      filename: path.join(viewsDir, 'layout.ejs'),
      root: viewsDir,
      views: [viewsDir]
    }
  );

  const fullOutputPath = path.join(distDir, outputPath);
  fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
  fs.writeFileSync(fullOutputPath, html);
}

function writeTextFile(outputPath, content) {
  const fullOutputPath = path.join(distDir, outputPath);
  fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
  fs.writeFileSync(fullOutputPath, content);
}

function buildGtmHead() {
  return `    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-MXWHXVKS');</script>
    <!-- End Google Tag Manager -->`;
}

function buildGtmNoScript() {
  return `    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MXWHXVKS"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->`;
}

function buildGoPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
${buildGtmHead()}
    <title>Redirecting to Telegram | TP Club</title>
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#9be11a">
    <link rel="icon" type="image/png" href="/images/logo.png">
    <style>
      :root { color-scheme: dark; font-family: Arial, Helvetica, sans-serif; background: #030503; color: #f6fff2; }
      body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 50% 20%, rgba(170, 255, 0, 0.18), transparent 28rem), #030503; }
      .go-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      .go-card { width: min(100%, 460px); border: 1px solid rgba(170, 255, 0, 0.22); border-radius: 24px; background: rgba(8, 18, 10, 0.92); padding: 34px; text-align: center; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38); }
      .go-card img { border-radius: 20px; box-shadow: 0 0 34px rgba(170, 255, 0, 0.28); }
      .go-eyebrow { margin: 20px 0 8px; color: #aaff00; font-size: 0.78rem; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(2rem, 7vw, 3.4rem); line-height: 0.98; letter-spacing: -0.06em; }
      p { color: #bfd3b7; font-size: 1rem; line-height: 1.6; }
    </style>
  </head>
  <body>
${buildGtmNoScript()}
    <div id="root"></div>
    <script src="/assets/go.js?v=tg-5715" type="module"></script>
  </body>
</html>`;
}

function buildV2Page() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
${buildGtmHead()}
    <title>TP Club V2 Landing Test</title>
    <meta name="description" content="Premium test landing page for TP Club's crypto education community.">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#9be11a">
    <link rel="icon" type="image/png" href="/images/logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap">
    <link rel="stylesheet" href="/assets/v2.css">
  </head>
  <body>
${buildGtmNoScript()}
    <div id="root"></div>
    <script src="/assets/v2.js" type="module"></script>
  </body>
</html>`;
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const paths = ['/en', '/zh', '/en/privacy', '/zh/privacy', '/en/contact', '/zh/contact', '/en/admin', '/zh/admin'];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((urlPath) => `  <url>
    <loc>${config.siteUrl}${urlPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${urlPath === '/en' || urlPath === '/zh' ? '1.0' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`;
}

async function build() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  fs.cpSync(publicDir, distDir, { recursive: true });

  await renderPage({ lang: 'en', view: 'index', outputPath: 'index.html' });
  await renderPage({ lang: 'en', view: 'index', outputPath: 'en/index.html' });
  await renderPage({ lang: 'zh', view: 'index', outputPath: 'zh/index.html' });
  writeTextFile('go/index.html', buildGoPage());
  writeTextFile('v2/index.html', buildV2Page());

  for (const lang of ['en', 'zh']) {
    await renderPage({ lang, view: 'privacy', outputPath: `${lang}/privacy/index.html`, pageKey: 'privacy', pagePath: '/privacy' });
    await renderPage({ lang, view: 'contact', outputPath: `${lang}/contact/index.html`, pageKey: 'contact', pagePath: '/contact' });
    await renderPage({ lang, view: 'admin', outputPath: `${lang}/admin/index.html`, pageKey: 'admin', pagePath: '/admin' });
  }

  await renderPage({ lang: 'en', view: '404', outputPath: '404.html' });

  writeTextFile('sitemap.xml', buildSitemap());
  writeTextFile('robots.txt', `User-agent: *
Allow: /

Sitemap: ${config.siteUrl}/sitemap.xml
`);
  writeTextFile('.htaccess', `RewriteEngine On
RewriteRule ^go$ /go/ [R=302,L]
RewriteRule ^zh$ /zh/ [R=301,L]
RewriteRule ^en$ /en/ [R=301,L]
RewriteRule ^v2$ /v2/ [R=301,L]
DirectoryIndex index.html
ErrorDocument 404 /404.html
`);

  console.log(`Static site built in ${path.relative(rootDir, distDir)} for ${config.siteUrl}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
