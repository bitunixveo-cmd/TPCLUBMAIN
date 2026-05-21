require('dotenv').config();

const path = require('path');
const compression = require('compression');
const express = require('express');
const helmet = require('helmet');
const { attachSeo, siteUrl } = require('./middleware/seo');

const locales = {
  en: require('./locales/en.json'),
  zh: require('./locales/zh.json')
};

const app = express();
const port = process.env.PORT || 3000;
const telegramUrl = process.env.TELEGRAM_URL || 'https://t.me/+VEugRODM7y5iNGY0';
const telegramChannelUrl = process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/OfficialTPClub';
const bitunixUrl = process.env.BITUNIX_REFERRAL_URL || 'https://www.bitunix.com/register?vipCode=TPclubJackman';
const youtubeUrl = process.env.YOUTUBE_URL || 'https://www.youtube.com/@TPClub';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', siteUrl()],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", 'https://api.binance.com']
      }
    }
  })
);

app.use('/images', express.static(path.join(__dirname, 'public/images'), { maxAge: '1y', immutable: true }));
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts'), { maxAge: '1y', immutable: true }));

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: 0,
    etag: true
  })
);

app.use((req, res, next) => {
  const lang = req.path.startsWith('/zh') ? 'zh' : 'en';
  res.locals.lang = lang;
  res.locals.t = locales[lang];
  res.locals.siteUrl = siteUrl();
  res.locals.telegramUrl = telegramUrl;
  res.locals.telegramChannelUrl = telegramChannelUrl;
  res.locals.bookingUrl = process.env.BOOKING_URL || 'https://calendly.com/YOUR_BOOKING_LINK';
  res.locals.bitunixUrl = bitunixUrl;
  res.locals.youtubeUrl = youtubeUrl;
  next();
});

app.get('/', (req, res) => {
  const acceptsChinese = /\bzh\b/i.test(req.get('accept-language') || '');
  res.redirect(301, acceptsChinese ? '/zh' : '/en');
});

app.get(['/en', '/zh'], attachSeo, (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.render('layout', { view: 'index' });
});

function pageRoute(pathName, view, pageKey) {
  app.get([`/en/${pathName}`, `/zh/${pathName}`], (req, res, next) => {
    res.locals.seoPath = `/${pathName}`;
    next();
  }, attachSeo, (req, res) => {
    const page = res.locals.t.pages[pageKey];
    res.set('Cache-Control', 'no-cache');
    res.render('layout', {
      view,
      page,
      pageTitle: page.title,
      pageDescription: page.intro
    });
  });
}

pageRoute('privacy', 'privacy', 'privacy');
pageRoute('contact', 'contact', 'contact');
pageRoute('admin', 'admin', 'admin');

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const paths = ['/en', '/zh', '/en/privacy', '/zh/privacy', '/en/contact', '/zh/contact', '/en/admin', '/zh/admin'];
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((urlPath) => `  <url>
    <loc>${siteUrl()}${urlPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${urlPath === '/en' || urlPath === '/zh' ? '1.0' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /

Sitemap: ${siteUrl()}/sitemap.xml
`);
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'tpclub', timestamp: new Date().toISOString() });
});

app.use(attachSeo, (req, res) => {
  res.status(404).render('layout', { view: '404' });
});

app.listen(port, () => {
  console.log(`TP Club landing page running on port ${port}`);
});
