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
    .select("site_url, robots_index, robots_follow")
    .limit(1)
    .maybeSingle();

  const siteUrl = settings?.site_url || "https://botvio.live";
  const allowIndex = settings?.robots_index !== false;

  let robotsTxt = "";

  // Googlebot — specific rules for better crawl budget
  robotsTxt += `User-agent: Googlebot\n`;
  robotsTxt += allowIndex ? `Allow: /\n` : `Disallow: /\n`;
  robotsTxt += `Disallow: /admin\n`;
  robotsTxt += `Disallow: /dashboard\n`;
  robotsTxt += `Disallow: /settings\n`;
  robotsTxt += `Disallow: /auth\n`;
  robotsTxt += `Disallow: /api\n`;
  robotsTxt += `Disallow: /billing\n`;
  robotsTxt += `Disallow: /accounts\n`;
  robotsTxt += `Disallow: /trade-history\n`;
  robotsTxt += `Disallow: /provider-dashboard\n`;
  robotsTxt += `Disallow: /connections\n`;
  robotsTxt += `Disallow: /my-products\n`;
  robotsTxt += `\n`;

  // Bingbot
  robotsTxt += `User-agent: Bingbot\n`;
  robotsTxt += allowIndex ? `Allow: /\n` : `Disallow: /\n`;
  robotsTxt += `Disallow: /admin\n`;
  robotsTxt += `Disallow: /dashboard\n`;
  robotsTxt += `Disallow: /settings\n`;
  robotsTxt += `Disallow: /auth\n`;
  robotsTxt += `Disallow: /billing\n`;
  robotsTxt += `Disallow: /accounts\n`;
  robotsTxt += `Disallow: /trade-history\n`;
  robotsTxt += `Disallow: /provider-dashboard\n`;
  robotsTxt += `Disallow: /connections\n`;
  robotsTxt += `Disallow: /my-products\n`;
  robotsTxt += `\n`;

  // Social bots — allow everything for rich previews
  robotsTxt += `User-agent: Twitterbot\nAllow: /\n\n`;
  robotsTxt += `User-agent: facebookexternalhit\nAllow: /\n\n`;

  // Default
  robotsTxt += `User-agent: *\n`;
  robotsTxt += allowIndex ? `Allow: /\n` : `Disallow: /\n`;
  robotsTxt += `Disallow: /admin\n`;
  robotsTxt += `Disallow: /dashboard\n`;
  robotsTxt += `Disallow: /settings\n`;
  robotsTxt += `Disallow: /auth\n`;
  robotsTxt += `Disallow: /api\n`;
  robotsTxt += `Disallow: /billing\n`;
  robotsTxt += `Disallow: /accounts\n`;
  robotsTxt += `Disallow: /trade-history\n`;
  robotsTxt += `Disallow: /provider-dashboard\n`;
  robotsTxt += `Disallow: /connections\n`;
  robotsTxt += `Disallow: /my-products\n`;
  robotsTxt += `\n`;
  robotsTxt += `Sitemap: ${siteUrl}/sitemap.xml\n`;

  return new Response(robotsTxt, {
    headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
});
