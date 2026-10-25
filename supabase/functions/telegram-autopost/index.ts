// Posts one Botvio blog/research article to the Telegram channel per run (scheduled 3x/day).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";
import articles from "./articles.json" with { type: "json" };

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";
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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await assertAutomationKey(req))) return json({ error: "Unauthorized" }, 401);

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const tgKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovableKey || !tgKey) return json({ error: "Telegram connection not configured" }, 500);
  const headers = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": tgKey, "Content-Type": "application/json" };

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Target channel: configurable in app_settings, defaults to the public Botvio channel.
  const { data: setting } = await db.from("app_settings").select("value").eq("key", "telegram_channel").maybeSingle();
  const chatId = (typeof setting?.value === "string" && setting.value.trim()) || "@botviolive";

  // Candidates: editor-managed posts (newest first) + built-in research index.
  const { data: dbPosts } = await db.from("posts").select("slug,title,excerpt,category")
    .eq("is_published", true).order("published_at", { ascending: false }).limit(200);
  const all: Article[] = [...(dbPosts ?? []), ...(articles as Article[])]
    .filter((a, i, arr) => a.slug && a.title && arr.findIndex((b) => b.slug === a.slug) === i);

  const { data: done } = await db.from("telegram_posts").select("slug,posted_at,status");
  const posted = new Map((done ?? []).map((r) => [r.slug, r]));
  let pick = all.find((a) => !posted.has(a.slug) || posted.get(a.slug)!.status === "failed");
  if (!pick) {
    // Everything posted once: recycle the one posted longest ago.
    const oldest = [...(done ?? [])].sort((a, b) => +new Date(a.posted_at) - +new Date(b.posted_at))[0];
    pick = all.find((a) => a.slug === oldest?.slug);
  }
  if (!pick) return json({ ok: true, message: "No articles available" });

  const url = `${SITE}/blog/${pick.slug}`;
  const text =
    `<b>${esc(pick.title)}</b>\n\n${esc(pick.excerpt ?? "")}\n\n` +
    `👉 <a href="${url}">Read the full article on Botvio AI</a>\n\n` +
    `<i>Trading involves risk. Educational content only.</i>\n\n${tagFor(pick.category)}`;

  const res = await fetch(`${GATEWAY}/sendMessage`, {
    method: "POST",
    headers,
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
  });
  const body = await res.text();
  let messageId: number | null = null;
  let ok = res.ok;
  try {
    const parsed = JSON.parse(body);
    if (parsed?.ok === false) ok = false;
    messageId = parsed?.result?.message_id ?? null;
  } catch { /* keep ok from HTTP status */ }
  if (!ok) console.error(`Telegram sendMessage failed [${res.status}]: ${body}`);

  await db.from("telegram_posts").upsert({
    slug: pick.slug, title: pick.title, url,
    status: ok ? "posted" : "failed",
    telegram_message_id: messageId,
    error: ok ? null : `[${res.status}] ${body.slice(0, 500)}`,
    posted_at: new Date().toISOString(),
  }, { onConflict: "slug" });

  return ok
    ? json({ ok: true, posted: pick.title, url, channel: chatId })
    : json({ error: "Telegram post failed", status: res.status, details: body, channel: chatId }, 502);
});
