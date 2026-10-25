// Posts one Botvio blog/research article to LinkedIn per run (scheduled 3x/day).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";
import articles from "./articles.json" with { type: "json" };

const GATEWAY = "https://connector-gateway.lovable.dev/linkedin";
const SITE = "https://botvio.live";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Article = { slug: string; title: string; excerpt: string; category?: string };

const tagFor = (c = "") => {
  const base = ["#Botvio", "#Trading", "#AITrading"];
  const k = c.toLowerCase();
  if (k.includes("forex")) base.push("#Forex");
  if (k.includes("gold")) base.push("#Gold", "#XAUUSD");
  if (k.includes("crypto") || k.includes("bitcoin")) base.push("#Crypto");
  if (k.includes("synthetic") || k.includes("deriv")) base.push("#SyntheticIndices");
  return base.join(" ");
};

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

  const url = `${SITE}/blog/${pick.slug}`;
  const text = `${pick.title}\n\n${pick.excerpt ?? ""}\n\nRead the full article on Botvio AI 👉 ${url}\n\nTrading involves risk. Educational content only.\n\n${tagFor(pick.category)}`;

  const me = await fetch(`${GATEWAY}/v2/userinfo`, { headers });
  if (!me.ok) {
    const body = await me.text();
    console.error(`LinkedIn userinfo failed [${me.status}]: ${body}`);
    return json({ error: "LinkedIn profile lookup failed", status: me.status, details: body }, 502);
  }
  const { sub } = await me.json();

  const res = await fetch(`${GATEWAY}/v2/ugcPosts`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify({
      author: `urn:li:person:${sub}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "ARTICLE",
          media: [{ status: "READY", originalUrl: url, title: { text: pick.title.slice(0, 200) } }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const body = await res.text();
  const ok = res.ok;
  if (!ok) console.error(`LinkedIn post failed [${res.status}]: ${body}`);

  await db.from("linkedin_posts").upsert({
    slug: pick.slug, title: pick.title, url,
    status: ok ? "posted" : "failed",
    linkedin_post_id: ok ? (res.headers.get("x-restli-id") ?? (() => { try { return JSON.parse(body).id; } catch { return null; } })()) : null,
    error: ok ? null : `[${res.status}] ${body.slice(0, 500)}`,
    posted_at: new Date().toISOString(),
  }, { onConflict: "slug" });

  return ok ? json({ ok: true, posted: pick.title, url }) : json({ error: "LinkedIn post failed", status: res.status, details: body }, 502);
});
