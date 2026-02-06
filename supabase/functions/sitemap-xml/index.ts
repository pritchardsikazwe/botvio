import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // Static public pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/landing", priority: "0.9", changefreq: "weekly" },
    { loc: "/signals", priority: "0.8", changefreq: "daily" },
    { loc: "/bots", priority: "0.8", changefreq: "weekly" },
    { loc: "/providers", priority: "0.7", changefreq: "weekly" },
    { loc: "/marketplace", priority: "0.8", changefreq: "daily" },
    { loc: "/learn", priority: "0.7", changefreq: "weekly" },
    { loc: "/strategies", priority: "0.7", changefreq: "weekly" },
    { loc: "/affiliate", priority: "0.5", changefreq: "monthly" },
    { loc: "/install", priority: "0.5", changefreq: "monthly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/p2p", priority: "0.6", changefreq: "daily" },
  ];

  // Dynamic: education lessons
  const { data: lessons } = await supabase
    .from("education_lessons")
    .select("slug, created_at")
    .order("lesson_number");

  // Dynamic: public strategies
  const { data: strategies } = await supabase
    .from("strategies")
    .select("slug, updated_at")
    .eq("is_public", true);

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
    <loc>${siteUrl}/s/${s.slug}</loc>
    <lastmod>${s.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
});
