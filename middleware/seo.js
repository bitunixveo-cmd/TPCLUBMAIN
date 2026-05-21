const siteUrl = () => (process.env.SITE_URL || 'https://tpclub.com.au').replace(/\/$/, '');
const defaultTelegramUrl = 'https://t.me/+VEugRODM7y5iNGY0';
const defaultTelegramChannelUrl = 'https://t.me/OfficialTPClub';

function pageUrl(lang, path = '') {
  return `${siteUrl()}/${lang}${path}`;
}

function buildStructuredData({ lang, t, telegramUrl, telegramChannelUrl, path = '', includeFaq = false }) {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'TP Club',
    alternateName: '止盈社',
    url: siteUrl(),
    logo: `${siteUrl()}/images/logo.png`,
    description: 'Australian Mandarin-speaking crypto education community',
    areaServed: 'AU',
    knowsLanguage: ['en', 'zh'],
    sameAs: [telegramUrl, telegramChannelUrl]
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'TP Club',
        item: siteUrl()
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: lang === 'zh' ? '中文' : 'English',
        item: pageUrl(lang, path)
      }
    ]
  };

  const schema = [organization, breadcrumb];
  if (!includeFaq) return schema;

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

  return schema;
}

function attachSeo(req, res, next) {
  const lang = res.locals.lang || 'en';
  const t = res.locals.t;
  const telegramUrl = process.env.TELEGRAM_URL || defaultTelegramUrl;
  const telegramChannelUrl = process.env.TELEGRAM_CHANNEL_URL || defaultTelegramChannelUrl;
  const path = res.locals.seoPath || '';
  const includeFaq = path === '';

  res.locals.seo = {
    canonical: pageUrl(lang, path),
    ogUrl: pageUrl(lang, path),
    ogImage: `${siteUrl()}/images/og-${lang}.jpg`,
    hrefLang: {
      en: `${siteUrl()}/en${path}`,
      zh: `${siteUrl()}/zh${path}`,
      default: `${siteUrl()}/en`
    },
    structuredData: buildStructuredData({ lang, t, telegramUrl, telegramChannelUrl, path, includeFaq })
  };

  next();
}

module.exports = {
  attachSeo,
  siteUrl
};
