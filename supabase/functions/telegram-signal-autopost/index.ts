// Posts generated Botvio trading signals to the Telegram channel.
// Runs 5x/day; each run posts at most 1 signal and never more than 5 per UTC day.
// Educational framing only: no links, no profit guarantees.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";
const DAILY_LIMIT = 5;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmt = (n: number | null) => {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  const a = Math.abs(n);
  const dp = a >= 1000 ? 2 : a >= 1 ? 2 : a >= 0.01 ? 4 : 6;
  return n.toFixed(dp);
};

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

  // Enforce the daily cap of 5 posted signals (UTC day).
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: postedToday } = await db.from("telegram_signal_posts")
    .select("signal_id", { count: "exact", head: true })
    .eq("status", "posted").gte("posted_at", dayStart.toISOString());
  if ((postedToday ?? 0) >= DAILY_LIMIT) {
    return json({ ok: true, message: `Daily limit of ${DAILY_LIMIT} signal posts reached` });
  }

  // Newest published signals from the last 24h that were not posted yet.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: already } = await db.from("telegram_signal_posts").select("signal_id").eq("status", "posted");
  const skip = new Set((already ?? []).map((r) => r.signal_id));
  const { data: signals, error: sigErr } = await db.from("trading_signals")
    .select("id,symbol,timeframe,direction,entry_price,stop_loss,take_profit,confidence,reason,strategy_name,created_at")
    .eq("signal_lifecycle", "published").gte("created_at", since)
    .order("created_at", { ascending: false }).limit(25);
  if (sigErr) return json({ error: "Signal lookup failed", details: sigErr.message }, 500);

  const pick = (signals ?? []).find((s) => !skip.has(s.id));
  if (!pick) return json({ ok: true, message: "No new published signals to post" });

  const dir = String(pick.direction ?? "").toUpperCase();
  const dirIcon = dir === "BUY" || dir === "LONG" ? "🟢 BUY" : dir === "SELL" || dir === "SHORT" ? "🔴 SELL" : esc(dir || "SIGNAL");
  const reason = pick.reason ? esc(String(pick.reason).slice(0, 220)) : "";
  const text =
    `📡 <b>Botvio Signal — ${esc(pick.symbol)}</b>\n\n` +
    `Direction: <b>${dirIcon}</b>\n` +
    `Timeframe: ${esc(pick.timeframe ?? "—")}\n` +
    `Entry: <b>${fmt(pick.entry_price)}</b>\n` +
    `Stop loss: ${fmt(pick.stop_loss)}\n` +
    `Take profit: ${fmt(pick.take_profit)}\n` +
    (pick.confidence ? `Confidence: ${pick.confidence}%\n` : "") +
    (reason ? `\nWhy: ${reason}\n` : "") +
    `\n<i>Educational content only — not financial advice. Always use your own risk management; never risk more than you can afford to lose.</i>`;

  const res = await fetch(`${GATEWAY}/sendMessage`, {
    method: "POST",
    headers,
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
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

  await db.from("telegram_signal_posts").upsert({
    signal_id: pick.id,
    status: ok ? "posted" : "failed",
    telegram_message_id: messageId,
    error: ok ? null : `[${res.status}] ${body.slice(0, 500)}`,
    posted_at: new Date().toISOString(),
  }, { onConflict: "signal_id" });

  return ok
    ? json({ ok: true, posted: `${pick.symbol} ${dir}`, channel: chatId, posted_today: (postedToday ?? 0) + 1 })
    : json({ error: "Telegram post failed", status: res.status, details: body, channel: chatId }, 502);
});
