import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    .select("site_url, robots_index, robots_follow")
    .limit(1)
    .maybeSingle();

  const siteUrl = "https://botvio.live"; // fixed canonical origin; DB value ignored
  const allowIndex = settings?.robots_index !== false;

  const privateRoutes = [
    "/admin/", "/api/", "/auth/", "/login", "/register",
    "/dashboard/", "/settings/", "/billing/", "/accounts/",
    "/connections/", "/trade-history/", "/provider-dashboard/",
    "/my-products/", "/private/", "/tmp/", "/internal/",
    "/sports-betting",
  ];
  const disallowBlock = privateRoutes.map(r => `Disallow: ${r}`).join("\n");

  let robotsTxt = "";

  // Default
  robotsTxt += `# Default rule for all bots\nUser-agent: *\n`;
  robotsTxt += allowIndex ? `Allow: /\n` : `Disallow: /\n`;
  robotsTxt += disallowBlock + "\n";
  robotsTxt += `Disallow: /*?token=\nDisallow: /*?session=\n\n`;

  // Googlebot
  robotsTxt += `# Googlebot specific rules\nUser-agent: Googlebot\n`;
  robotsTxt += allowIndex ? `Allow: /\n` : `Disallow: /\n`;
  robotsTxt += disallowBlock + "\n\n";

  // Bingbot
  robotsTxt += `# Bingbot rules\nUser-agent: Bingbot\n`;
  robotsTxt += allowIndex ? `Allow: /\n` : `Disallow: /\n`;
  robotsTxt += disallowBlock + "\n\n";

  // Social crawlers
  robotsTxt += `# Social media crawlers (for link previews)\n`;
  robotsTxt += `User-agent: facebookexternalhit\nAllow: /\n\n`;
  robotsTxt += `User-agent: Twitterbot\nAllow: /\n\n`;
  robotsTxt += `User-agent: LinkedInBot\nAllow: /\n\n`;

  // Block AI crawlers
  robotsTxt += `# Block aggressive AI crawlers\n`;
  robotsTxt += `User-agent: GPTBot\nDisallow: /\n\n`;
  robotsTxt += `User-agent: CCBot\nDisallow: /\n\n`;
  robotsTxt += `User-agent: Bytespider\nDisallow: /\n\n`;

  // Sitemap
  robotsTxt += `# Sitemap\nSitemap: ${siteUrl}/sitemap.xml\n`;

  return new Response(robotsTxt, {
    headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
});
