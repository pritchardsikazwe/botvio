import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  // ═══ Static public pages ═══
  const staticPages = [
    // Core (sitelink candidates)
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/landing", priority: "0.9", changefreq: "weekly" },
    { loc: "/signals", priority: "0.9", changefreq: "daily" },
    { loc: "/bots", priority: "0.8", changefreq: "weekly" },
    { loc: "/marketplace", priority: "0.8", changefreq: "daily" },
    { loc: "/providers", priority: "0.7", changefreq: "weekly" },
    { loc: "/learn", priority: "0.7", changefreq: "weekly" },
    { loc: "/strategies", priority: "0.7", changefreq: "weekly" },
    { loc: "/blog", priority: "0.9", changefreq: "daily" },
    { loc: "/faq", priority: "0.6", changefreq: "monthly" },
    { loc: "/affiliate", priority: "0.5", changefreq: "monthly" },
    { loc: "/install", priority: "0.5", changefreq: "monthly" },
    { loc: "/testimonials", priority: "0.5", changefreq: "monthly" },
    { loc: "/p2p", priority: "0.6", changefreq: "daily" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },

    // Trust pages
    { loc: "/about", priority: "0.5", changefreq: "monthly" },
    { loc: "/contact", priority: "0.5", changefreq: "monthly" },
    { loc: "/disclaimer", priority: "0.4", changefreq: "yearly" },
    { loc: "/docs", priority: "0.5", changefreq: "monthly" },
    { loc: "/whitepaper", priority: "0.5", changefreq: "monthly" },
    { loc: "/press", priority: "0.5", changefreq: "monthly" },
    { loc: "/case-studies", priority: "0.5", changefreq: "monthly" },

    // Category hub pages
    { loc: "/gold", priority: "0.9", changefreq: "daily" },
    { loc: "/weltrade", priority: "0.8", changefreq: "weekly" },
    { loc: "/trade-modes", priority: "0.8", changefreq: "weekly" },
    { loc: "/trading", priority: "0.8", changefreq: "daily" },
    { loc: "/authority-signals", priority: "0.7", changefreq: "daily" },
    { loc: "/binary-options", priority: "0.7", changefreq: "weekly" },
    { loc: "/deriv-options", priority: "0.7", changefreq: "weekly" },
    { loc: "/news-calendar", priority: "0.7", changefreq: "daily" },
    { loc: "/sports-betting", priority: "0.6", changefreq: "weekly" },
    { loc: "/flipping-challenges", priority: "0.6", changefreq: "weekly" },
    { loc: "/live", priority: "0.7", changefreq: "daily" },

    // Market pages
    { loc: "/markets", priority: "0.8", changefreq: "daily" },
    { loc: "/markets/us", priority: "0.7", changefreq: "daily" },
    { loc: "/markets/europe", priority: "0.7", changefreq: "daily" },
    { loc: "/markets/africa", priority: "0.7", changefreq: "daily" },
    { loc: "/markets/asia", priority: "0.7", changefreq: "daily" },
    { loc: "/markets/middle-east", priority: "0.7", changefreq: "daily" },
    { loc: "/markets/crypto", priority: "0.7", changefreq: "daily" },

    // Chart pages
    { loc: "/chart/XAUUSD", priority: "0.8", changefreq: "daily" },
    { loc: "/chart/EURUSD", priority: "0.7", changefreq: "daily" },
    { loc: "/chart/GBPUSD", priority: "0.7", changefreq: "daily" },
    { loc: "/chart/USDJPY", priority: "0.7", changefreq: "daily" },
    { loc: "/chart/GBPJPY", priority: "0.7", changefreq: "daily" },
    { loc: "/chart/AUDUSD", priority: "0.7", changefreq: "daily" },
    { loc: "/chart/BTCUSD", priority: "0.7", changefreq: "daily" },
    { loc: "/chart/ETHUSD", priority: "0.7", changefreq: "daily" },
    { loc: "/chart/XAGUSD", priority: "0.6", changefreq: "daily" },
    { loc: "/chart/NAS100", priority: "0.6", changefreq: "daily" },
  ];

  // ═══ Dynamic: education lessons ═══
  const { data: lessons } = await supabase
    .from("education_lessons")
    .select("slug, created_at")
    .order("lesson_number");

  // ═══ Dynamic: public strategies ═══
  const { data: strategies } = await supabase
    .from("strategies")
    .select("slug, updated_at")
    .eq("is_public", true);

  // ═══ Dynamic: blog posts ═══
  const { data: blogPosts } = await supabase
    .from("posts")
    .select("slug, published_at, updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  // ═══ Dynamic: SEO pages from DB ═══
  const { data: seoPages } = await supabase
    .from("seo_pages")
    .select("slug, updated_at")
    .eq("is_active", true);

  // Build URLs
  let urls = staticPages.map(
    (p) =>
      `  <url>
    <loc>${siteUrl}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  );

  lessons?.forEach((lesson) => {
    urls.push(`  <url>
    <loc>${siteUrl}/learn/${lesson.slug}</loc>
    <lastmod>${lesson.created_at?.split("T")[0] || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  });

  strategies?.forEach((s) => {
    urls.push(`  <url>
    <loc>${siteUrl}/${s.slug}</loc>
    <lastmod>${s.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  });

  blogPosts?.forEach((post) => {
    urls.push(`  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${(post.updated_at || post.published_at)?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  seoPages?.forEach((p) => {
    // Avoid duplicates with static pages
    const isDuplicate = staticPages.some(sp => sp.loc === `/${p.slug}`);
    if (!isDuplicate) {
      urls.push(`  <url>
    <loc>${siteUrl}/${p.slug}</loc>
    <lastmod>${p.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
});
