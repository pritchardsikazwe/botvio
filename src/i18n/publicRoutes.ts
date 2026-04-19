/**
 * Public route registry used by:
 * - the multilingual sitemap (Edge Function reads this list via copy)
 * - hreflang generation in <SEOHead>
 * - localized navigation helpers
 *
 * `seoKey` matches a key in `src/i18n/seo/en.json`.
 * Only static, indexable, public routes belong here. Dynamic slugs
 * (blog posts, strategies, programmatic SEO pages) are handled separately.
 */
export interface PublicRoute {
  path: string;       // canonical English path, e.g. "/signals"
  seoKey: string;     // key into seoRegistry, e.g. "signals"
  priority: string;
  changefreq: string;
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  { path: "/",                     seoKey: "home",                priority: "1.0", changefreq: "daily" },
  { path: "/signals",              seoKey: "signals",             priority: "0.9", changefreq: "daily" },
  { path: "/gold",                 seoKey: "gold",                priority: "0.9", changefreq: "daily" },
  { path: "/binary-options",       seoKey: "binary",              priority: "0.8", changefreq: "weekly" },
  { path: "/blog",                 seoKey: "blog",                priority: "0.9", changefreq: "daily" },
  { path: "/strategies",           seoKey: "strategies",          priority: "0.8", changefreq: "weekly" },
  { path: "/markets",              seoKey: "markets",             priority: "0.8", changefreq: "daily" },
  { path: "/markets/us",           seoKey: "marketsUs",           priority: "0.7", changefreq: "daily" },
  { path: "/markets/europe",       seoKey: "marketsEurope",       priority: "0.7", changefreq: "daily" },
  { path: "/markets/asia",         seoKey: "marketsAsia",         priority: "0.7", changefreq: "daily" },
  { path: "/markets/middle-east",  seoKey: "marketsMiddleEast",   priority: "0.7", changefreq: "daily" },
  { path: "/markets/africa",       seoKey: "marketsAfrica",       priority: "0.7", changefreq: "daily" },
  { path: "/markets/crypto",       seoKey: "marketsCrypto",       priority: "0.7", changefreq: "daily" },
  { path: "/bots",                 seoKey: "bots",                priority: "0.8", changefreq: "weekly" },
  { path: "/binance",              seoKey: "binanceHub",          priority: "0.8", changefreq: "weekly" },
  { path: "/weltrade",             seoKey: "weltrade",            priority: "0.8", changefreq: "weekly" },
  { path: "/marketplace",          seoKey: "marketplace",         priority: "0.8", changefreq: "daily" },
  { path: "/about",                seoKey: "about",               priority: "0.6", changefreq: "monthly" },
  { path: "/contact",              seoKey: "contact",             priority: "0.5", changefreq: "monthly" },
  { path: "/faq",                  seoKey: "faq",                 priority: "0.6", changefreq: "monthly" },
  { path: "/affiliate",            seoKey: "affiliate",           priority: "0.6", changefreq: "monthly" },
  { path: "/p2p",                  seoKey: "p2p",                 priority: "0.6", changefreq: "daily" },
  { path: "/sports-betting",       seoKey: "sportsBetting",       priority: "0.6", changefreq: "weekly" },
  { path: "/flipping-challenges",  seoKey: "flippingChallenges",  priority: "0.6", changefreq: "weekly" },
  { path: "/live",                 seoKey: "live",                priority: "0.7", changefreq: "daily" },
  { path: "/news-calendar",        seoKey: "newsCalendar",        priority: "0.7", changefreq: "daily" },
  { path: "/trade-modes",          seoKey: "tradeModes",          priority: "0.7", changefreq: "weekly" },
  { path: "/deriv-options",        seoKey: "derivOptions",        priority: "0.7", changefreq: "weekly" },
  { path: "/trading",              seoKey: "trading",             priority: "0.7", changefreq: "daily" },
  { path: "/authority-signals",    seoKey: "authoritySignals",    priority: "0.7", changefreq: "daily" },
  { path: "/learn",                seoKey: "learn",               priority: "0.7", changefreq: "weekly" },
  { path: "/providers",            seoKey: "providers",           priority: "0.6", changefreq: "weekly" },
  { path: "/billing",              seoKey: "billing",             priority: "0.6", changefreq: "monthly" },
  { path: "/press",                seoKey: "press",               priority: "0.4", changefreq: "monthly" },
  { path: "/testimonials",         seoKey: "testimonials",        priority: "0.5", changefreq: "monthly" },
  { path: "/case-studies",         seoKey: "caseStudies",         priority: "0.5", changefreq: "monthly" },
  { path: "/docs",                 seoKey: "docs",                priority: "0.5", changefreq: "monthly" },
  { path: "/whitepaper",           seoKey: "whitepaper",          priority: "0.5", changefreq: "monthly" },
  { path: "/terms",                seoKey: "terms",               priority: "0.3", changefreq: "yearly" },
  { path: "/privacy",              seoKey: "privacy",             priority: "0.3", changefreq: "yearly" },
  { path: "/disclaimer",           seoKey: "disclaimer",          priority: "0.3", changefreq: "yearly" },
  { path: "/install",              seoKey: "install",             priority: "0.5", changefreq: "monthly" },
];

export const PUBLIC_PATHS = PUBLIC_ROUTES.map((r) => r.path);
