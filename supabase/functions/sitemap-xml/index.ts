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
  { loc: "/bots",                 priority: "0.8", changefreq: "weekly" },
  { loc: "/marketplace",          priority: "0.8", changefreq: "daily" },
  { loc: "/providers",            priority: "0.7", changefreq: "weekly" },
  { loc: "/learn",                priority: "0.7", changefreq: "weekly" },
  { loc: "/strategies",           priority: "0.7", changefreq: "weekly" },
  { loc: "/blog",                 priority: "0.9", changefreq: "daily" },
  { loc: "/faq",                  priority: "0.6", changefreq: "monthly" },
  { loc: "/affiliate",            priority: "0.5", changefreq: "monthly" },
  { loc: "/install",              priority: "0.5", changefreq: "monthly" },
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

  const siteUrl = settings?.site_url || "https://botvio.live";
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
    .select("slug, created_at")
    .order("lesson_number");
  lessons?.forEach((lesson) => {
    urls.push(`  <url>
    <loc>${siteUrl}/learn/${lesson.slug}</loc>
    <lastmod>${lesson.created_at?.split("T")[0] || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
});
