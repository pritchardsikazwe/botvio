import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All supported languages (must match src/i18n/index.ts)
const LANGS = [
  "en","fr","pt","es","de","it","ru","tr","ar","ur",
  "hi","bn","zh","ja","ko","vi","th","id","ms","tl","sw"
];
const DEFAULT_LANG = "en";

function localizedPath(path: string, lang: string): string {
  if (lang === DEFAULT_LANG) return path;
  if (path === "/") return `/${lang}`;
  return `/${lang}${path}`;
}

// Static public pages eligible for hreflang alternates
const STATIC_PAGES = [
  { loc: "/",                     priority: "1.0", changefreq: "daily" },
  { loc: "/landing",              priority: "0.9", changefreq: "weekly" },
  { loc: "/signals",              priority: "0.9", changefreq: "daily" },
  { loc: "/signals/history",      priority: "0.9", changefreq: "daily" },
  { loc: "/track-record",         priority: "0.8", changefreq: "daily" },
  { loc: "/bots",                 priority: "0.8", changefreq: "weekly" },
  { loc: "/marketplace",          priority: "0.8", changefreq: "daily" },
  { loc: "/providers",            priority: "0.7", changefreq: "weekly" },
  { loc: "/learn",                priority: "0.7", changefreq: "weekly" },
  { loc: "/strategies",           priority: "0.7", changefreq: "weekly" },
  { loc: "/blog",                 priority: "0.9", changefreq: "daily" },
  { loc: "/faq",                  priority: "0.6", changefreq: "monthly" },
  { loc: "/affiliate",            priority: "0.5", changefreq: "monthly" },
  { loc: "/testimonials",         priority: "0.5", changefreq: "monthly" },
  { loc: "/p2p",                  priority: "0.6", changefreq: "daily" },
  { loc: "/terms",                priority: "0.3", changefreq: "yearly" },
  { loc: "/privacy",              priority: "0.3", changefreq: "yearly" },
  { loc: "/about",                priority: "0.6", changefreq: "monthly" },
  { loc: "/contact",              priority: "0.5", changefreq: "monthly" },
  { loc: "/disclaimer",           priority: "0.4", changefreq: "yearly" },
  { loc: "/docs",                 priority: "0.5", changefreq: "monthly" },
  { loc: "/whitepaper",           priority: "0.5", changefreq: "monthly" },
  { loc: "/press",                priority: "0.5", changefreq: "monthly" },
  { loc: "/case-studies",         priority: "0.5", changefreq: "monthly" },
  { loc: "/gold",                 priority: "0.9", changefreq: "daily" },
  { loc: "/weltrade",             priority: "0.8", changefreq: "weekly" },
  { loc: "/trade-modes",          priority: "0.8", changefreq: "weekly" },
  { loc: "/trading",              priority: "0.8", changefreq: "daily" },
  { loc: "/authority-signals",    priority: "0.7", changefreq: "daily" },
  { loc: "/binary-options",       priority: "0.7", changefreq: "weekly" },
  { loc: "/deriv-options",        priority: "0.7", changefreq: "weekly" },
  { loc: "/news-calendar",        priority: "0.7", changefreq: "daily" },
  { loc: "/sports-betting",       priority: "0.6", changefreq: "weekly" },
  { loc: "/flipping-challenges",  priority: "0.6", changefreq: "weekly" },
  { loc: "/live",                 priority: "0.7", changefreq: "daily" },
  { loc: "/binance",              priority: "0.8", changefreq: "weekly" },
  { loc: "/markets",              priority: "0.8", changefreq: "daily" },
  { loc: "/markets/us",           priority: "0.7", changefreq: "daily" },
  { loc: "/markets/europe",       priority: "0.7", changefreq: "daily" },
  { loc: "/markets/africa",       priority: "0.7", changefreq: "daily" },
  { loc: "/markets/asia",         priority: "0.7", changefreq: "daily" },
  { loc: "/markets/middle-east",  priority: "0.7", changefreq: "daily" },
  { loc: "/markets/crypto",       priority: "0.7", changefreq: "daily" },
  { loc: "/chart/XAUUSD",         priority: "0.8", changefreq: "daily" },
  { loc: "/chart/EURUSD",         priority: "0.7", changefreq: "daily" },
  { loc: "/chart/GBPUSD",         priority: "0.7", changefreq: "daily" },
  { loc: "/chart/USDJPY",         priority: "0.7", changefreq: "daily" },
  { loc: "/chart/GBPJPY",         priority: "0.7", changefreq: "daily" },
  { loc: "/chart/AUDUSD",         priority: "0.7", changefreq: "daily" },
  { loc: "/chart/BTCUSD",         priority: "0.7", changefreq: "daily" },
  { loc: "/chart/ETHUSD",         priority: "0.7", changefreq: "daily" },
  { loc: "/chart/XAGUSD",         priority: "0.6", changefreq: "daily" },
  { loc: "/chart/NAS100",         priority: "0.6", changefreq: "daily" },
];

// Static blog slugs from src/content/blogPosts.ts — kept in sync manually for SEO.
const STATIC_BLOG_SLUGS: string[] = [
  "ai-forex-chart-analysis-tools",
  "ai-forex-trading-tools-2026",
  "ai-trading-bots-vs-human-traders-2026",
  "best-boom-1000-strategy-using-botvio",
  "best-brokers-copy-trading-2026",
  "best-forex-broker-zambia",
  "best-forex-brokers-nigeria-regulated",
  "best-forex-brokers-zambia-2026",
  "best-forex-pairs-african-traders",
  "best-forex-pairs-asian-traders-inr-pkr-php",
  "best-gold-brokers-xauusd-trading",
  "best-websites-to-make-money-online",
  "bitcoin-2026-price-outlook",
  "boom-1000-strategy-2026",
  "boom-1000-vs-boom-500-which-pays-more",
  "boom-500-strategy-botvio",
  "boom-crash-trending-strategy-2026",
  "botvio-accumulator-strategy",
  "botvio-multiplier-trading-explained",
  "botvio-risk-management-guide",
  "botvio-volatility-index-trading-guide",
  "botvio-vs-manual-trading",
  "btcusd-daily-bias-framework",
  "btcusd-forecast-today-analysis",
  "choosing-best-forex-broker-zambia-africa",
  "crash-1000-strategy-botvio",
  "crash-300-index-spike-trading-guide",
  "crash-500-strategy-2026",
  "crash-500-strategy-deep-dive",
  "crypto-scalping-binance-5m-setup",
  "deriv-accumulator-options-full-playbook",
  "deriv-binary-options-complete-guide",
  "deriv-binary-options-guide-with-botvio",
  "deriv-india-legality-funding-guide",
  "deriv-mt5-vs-dtrader-which-platform-wins",
  "deriv-payment-methods-kenya",
  "deriv-signals-forex-trading-guide",
  "deriv-signals-today-live",
  "deriv-synthetic-indices-explained-botvio",
  "deriv-synthetic-indices-trending",
  "eth-btc-ratio-altseason-timing",
  "eurusd-asian-range-breakout-playbook",
  "eurusd-forecast-today-analysis",
  "eurusd-london-breakout-strategy",
  "exness-signals-2026-guide",
  "exness-signals-gold-forex",
  "fibonacci-retracement-gold-trading",
  "fomc-trading-strategy-gold-forex",
  "forex-lot-size-calculator-guide",
  "forex-mentorship-learn-gold-trading",
  "forex-pakistan-brokers-pkr-funding",
  "forex-position-sizing-calculator-guide",
  "forex-risk-management-rules",
  "forex-signals-telegram-channel",
  "forex-trading-philippines-guide",
  "forex-trading-south-africa-fsca-rules",
  "forex-trends-2026",
  "forex-vs-crypto-which-pays-more",
  "gbpjpy-volatility-scalping",
  "gbpusd-forecast-today-analysis",
  "gbpusd-london-killzone-strategy",
  "gold-correlation-with-dxy-explained",
  "gold-ny-open-reversal-strategy",
  "gold-signals-xauusd-daily-analysis",
  "gold-trading-2026-outlook",
  "gold-trading-signals-free-xauusd",
  "gold-weekly-forecast-framework",
  "how-to-earn-money-online-trading",
  "how-to-earn-money-online-trading-with-botvio",
  "how-to-make-money-online-2026",
  "how-to-make-money-online-deriv",
  "how-to-start-forex-trading",
  "how-to-start-forex-trading-with-botvio",
  "how-to-trade-deriv-digits-using-botvio",
  "how-to-trade-ger40-dax",
  "how-to-trade-nas100-nasdaq-100",
  "how-to-trade-synthetic-indices",
  "how-to-trade-us30-dow-jones",
  "ict-killzones-london-new-york",
  "is-botvio-safe",
  "jump-100-trading-guide",
  "jump-25-index-strategy-beginners",
  "make-money-online-2026-methods",
  "nfp-trading-playbook-forex",
  "passive-income-trading-bots-2026",
  "risk-management-trading-2-percent-rule",
  "smart-money-concepts-forex-trading",
  "step-index-trading-strategy",
  "step-index-vs-range-break-choosing-the-right-synthetic",
  "synthetic-indices-guide-2026",
  "trading-bitcoin-halving-cycles",
  "trading-gold-during-fomc-safe-entry-rules",
  "trading-psychology-discipline-rules",
  "trending-crypto-coins-2026",
  "usdjpy-carry-trade-guide",
  "v10-1s-micro-scalping-tactics",
  "v75-scalping-strategy-2026",
  "volatility-25-trading-guide",
  "volatility-75-trading-strategy",
  "weltrade-signals-forex-gold",
  "weltrade-syntx-painx-gainx-explained",
  "what-is-botvio-ai-trading-bot",
  "xauusd-forecast-today-gold-analysis",
  "xauusd-london-session-breakout-system",
  "xauusd-scalping-ema-20-50-confluence",
  "xauusd-scalping-strategy-1min-5min"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: settings } = await supabase
    .from("site_settings")
    .select("site_url")
    .limit(1)
    .maybeSingle();

  const siteUrl = "https://botvio.live"; // fixed canonical origin; DB value ignored
  const now = new Date().toISOString().split("T")[0];

  const buildAlternates = (canonicalPath: string) =>
    LANGS.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${siteUrl}${localizedPath(
          canonicalPath,
          l
        )}"/>`
    ).join("\n") +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${canonicalPath}"/>`;

  const urls: string[] = [];

  // Static pages: emit one <url> per language with reciprocal alternates
  for (const p of STATIC_PAGES) {
    const alternates = buildAlternates(p.loc);
    for (const lang of LANGS) {
      const loc = `${siteUrl}${localizedPath(p.loc, lang)}`;
      urls.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
${alternates}
  </url>`);
    }
  }

  // Dynamic pages: English-only for now (separate translation pipeline later)
  const { data: lessons } = await supabase
    .from("education_lessons")
    .select("slug, category, created_at")
    .order("lesson_number");
  const categories = new Set<string>();
  lessons?.forEach((lesson) => {
    if (lesson.category) categories.add(lesson.category);
    const catPath = lesson.category
      ? `/learn/${lesson.category}/${lesson.slug}`
      : `/learn/${lesson.slug}`;
    urls.push(`  <url>
    <loc>${siteUrl}${catPath}</loc>
    <lastmod>${lesson.created_at?.split("T")[0] || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  });

  // Category landing pages
  categories.forEach((cat) => {
    urls.push(`  <url>
    <loc>${siteUrl}/learn/${cat}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  const { data: strategies } = await supabase
    .from("strategies")
    .select("slug, updated_at")
    .eq("is_public", true);
  strategies?.forEach((s) => {
    urls.push(`  <url>
    <loc>${siteUrl}/${s.slug}</loc>
    <lastmod>${s.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  });

  const { data: blogPosts } = await supabase
    .from("posts")
    .select("slug, published_at, updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  blogPosts?.forEach((post) => {
    urls.push(`  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${(post.updated_at || post.published_at)?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  const { data: seoPages } = await supabase
    .from("seo_pages")
    .select("slug, updated_at")
    .eq("is_active", true);
  seoPages?.forEach((p) => {
    const isDup = STATIC_PAGES.some((sp) => sp.loc === `/${p.slug}`);
    if (!isDup) {
      urls.push(`  <url>
    <loc>${siteUrl}/${p.slug}</loc>
    <lastmod>${p.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  });


  // Static blog posts from code (blogPosts.ts) - emit once each
  const dbBlogSlugs = new Set((blogPosts || []).map((p: any) => p.slug));
  for (const s of STATIC_BLOG_SLUGS) {
    if (dbBlogSlugs.has(s)) continue;
    urls.push(`  <url>
    <loc>${siteUrl}/blog/${s}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
});
