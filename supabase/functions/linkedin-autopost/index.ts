// Posts one existing Botvio article to LinkedIn per run (scheduled 5x/day).
// Each post promotes an already-published article and links back to botvio.live.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";
import articles from "./articles.json" with { type: "json" };

const GATEWAY = "https://connector-gateway.lovable.dev/linkedin";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Article = { slug: string; title: string; excerpt: string; category?: string };

const tagFor = (c = "") => {
  const base = ["#TradingEducation", "#RiskManagement", "#LearnToTrade"];
  const k = c.toLowerCase();
  if (k.includes("forex")) base.push("#Forex");
  if (k.includes("gold")) base.push("#Gold");
  if (k.includes("crypto") || k.includes("bitcoin")) base.push("#Crypto");
  if (k.includes("synthetic") || k.includes("deriv")) base.push("#SyntheticIndices");
  return base.join(" ");
};

// Strip any URLs or link-like text so posts stay educational and link-free.
const stripLinks = (s: string) =>
  s.replace(/https?:\/\/\S+/gi, "").replace(/www\.\S+/gi, "").replace(/\S+\.(com|net|org|live|io|app)\S*/gi, "").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await assertAutomationKey(req))) return json({ error: "Unauthorized" }, 401);

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const liKey = Deno.env.get("LINKEDIN_API_KEY");
  if (!lovableKey || !liKey) return json({ error: "LinkedIn connection not configured" }, 500);
  const headers = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": liKey };

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Candidates: editor-managed posts (newest first) + built-in research index.
  const { data: dbPosts } = await db.from("posts").select("slug,title,excerpt,category")
    .eq("is_published", true).order("published_at", { ascending: false }).limit(200);
  const all: Article[] = [...(dbPosts ?? []), ...(articles as Article[])]
    .filter((a, i, arr) => a.slug && a.title && arr.findIndex((b) => b.slug === a.slug) === i);

  const { data: done } = await db.from("linkedin_posts").select("slug,posted_at,status");
  const posted = new Map((done ?? []).map((r) => [r.slug, r]));
  let pick = all.find((a) => !posted.has(a.slug) || posted.get(a.slug)!.status === "failed");
  if (!pick) {
    // Everything posted once: recycle the one posted longest ago.
    const oldest = [...(done ?? [])].sort((a, b) => +new Date(a.posted_at) - +new Date(b.posted_at))[0];
    pick = all.find((a) => a.slug === oldest?.slug);
  }
  if (!pick) return json({ ok: true, message: "No articles available" });

  // Article promo post: title, excerpt, link back to the full article on botvio.live.
  const title = stripLinks(pick.title);
  const lesson = stripLinks(pick.excerpt ?? "");
  const url = `https://botvio.live/blog/${pick.slug}`;
  const text =
    `📚 ${title}\n\n` +
    `${lesson}\n\n` +
    `Read the full article on Botvio:\n${url}\n\n` +
    `Educational content only — not financial advice. Trading involves risk of loss.\n\n` +
    `${tagFor(pick.category)}`;

  // Post to BOTH the personal profile (connector) and the Botvio Company Page (when connected).
  const { data: org } = await db.from("linkedin_org_connection")
    .select("access_token,org_urn,expires_at").eq("id", 1).maybeSingle();
  const orgReady = !!org?.access_token && !!org?.org_urn && (!org.expires_at || new Date(org.expires_at) > new Date());

  const results: Record<string, { ok: boolean; status: number; id?: string | null; details?: string }> = {};
  const idOf = (r: Response, b: string) => r.headers.get("x-restli-id") ?? (() => { try { return JSON.parse(b).id; } catch { return null; } })();

  if (orgReady) {
    const r = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${org!.access_token}`, "Content-Type": "application/json",
        "LinkedIn-Version": "202509", "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: org!.org_urn, commentary: text, visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false,
      }),
    });
    const b = await r.text();
    if (!r.ok) console.error(`LinkedIn company post failed [${r.status}]: ${b}`);
    results.company_page = { ok: r.ok, status: r.status, id: r.ok ? idOf(r, b) : null, details: r.ok ? undefined : b.slice(0, 500) };
  }

  const me = await fetch(`${GATEWAY}/v2/userinfo`, { headers });
  if (!me.ok) {
    const b = await me.text();
    console.error(`LinkedIn userinfo failed [${me.status}]: ${b}`);
    results.personal = { ok: false, status: me.status, details: b.slice(0, 500) };
  } else {
    const { sub } = await me.json();
    const r = await fetch(`${GATEWAY}/v2/ugcPosts`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author: `urn:li:person:${sub}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": { shareCommentary: { text }, shareMediaCategory: "NONE" },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    const b = await r.text();
    if (!r.ok) console.error(`LinkedIn personal post failed [${r.status}]: ${b}`);
    results.personal = { ok: r.ok, status: r.status, id: r.ok ? idOf(r, b) : null, details: r.ok ? undefined : b.slice(0, 500) };
  }

  const ok = Object.values(results).some((r) => r.ok);
  const ids = Object.entries(results).filter(([, r]) => r.ok).map(([k, r]) => `${k}:${r.id ?? ""}`).join(" ");
  const errs = Object.entries(results).filter(([, r]) => !r.ok).map(([k, r]) => `${k} [${r.status}] ${r.details ?? ""}`).join(" | ");

  await db.from("linkedin_posts").upsert({
    slug: pick.slug, title: pick.title, url,
    status: ok ? "posted" : "failed",
    linkedin_post_id: ok ? ids.slice(0, 500) : null,
    error: errs ? errs.slice(0, 500) : null,
    posted_at: new Date().toISOString(),
  }, { onConflict: "slug" });

  return ok
    ? json({ ok: true, posted: pick.title, company_page_connected: orgReady, results })
    : json({ error: "LinkedIn post failed", results }, 502);
});
