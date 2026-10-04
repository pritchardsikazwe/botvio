import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SERVICE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type EventInput = {
  visitor_id: string;
  user_id?: string | null;
  session_id?: string | null;
  event_type: string;
  page_path?: string | null;
  product?: string | null;
  metadata?: Record<string, unknown>;
};

function interestFromEvent(e: EventInput): string | null {
  const p = `${e.product ?? ""} ${e.page_path ?? ""} `.toLowerCase();
  if (/gold|xau/.test(p)) return "gold";
  if (/bitcoin|btc|crypto/.test(p)) return "crypto";
  if (/synthetic|boom|crash|volatility|deriv/.test(p)) return "synthetic";
  if (/copy.?trad|mt5|tradecopy|robot/.test(p)) return "copy_trading";
  if (/forex|eurusd|gbpusd|forex/.test(p)) return "forex";
  if (/signal/.test(p)) return "signals";
  if (/weltrade|syntx/.test(p)) return "syntx";
  return null;
}

function scoreEvent(e: EventInput): number {
  const m: Record<string, number> = {
    page_view: 1, chart_view: 3, signal_view: 4, pricing_view: 5,
    product_interest: 6, signup_started: 12, signup_completed: 30,
    connect_mt5: 20, connect_broker: 18, demo_started: 15,
    copy_trade_started: 25, deposit_click: 18, checkout_started: 20,
  };
  return m[e.event_type] ?? 1;
}

function nextBestAction(score: number, signedUp: boolean, signupStarted: boolean, interests: string[]) {
  if (signedUp) {
    if (interests.includes("copy_trading") || interests.includes("mt5"))
      return "connect_mt5";
    if (interests.includes("signals")) return "open_demo_signals";
    return "complete_profile";
  }
  if (signupStarted) return "complete_signup";
  if (score >= 25) return "show_signup_offer";
  if (score >= 12) return "show_product_demo";
  return "educate";
}

function messageFor(action: string, interests: string[]) {
  const interest = interests[0];
  const labels: Record<string, [string,string,string,string]> = {
    gold: ["Gold signals are active", "You have been exploring Gold. See the current setup and try Botvio on a demo account.", "View Gold", "/gold"],
    crypto: ["Bitcoin signals are ready", "You have been exploring Bitcoin. See the latest market setup and test Botvio in demo mode.", "View Bitcoin", "/crypto"],
    synthetic: ["Explore synthetic signals", "You have been looking at synthetic markets. See the available signals and start with demo trading.", "Open Synthetic Hub", "/synthetic-hub"],
    copy_trading: ["Connect MT5 when you're ready", "You have shown interest in copy trading. Connect a demo MT5 account and test the workflow.", "Connect MT5", "/copy-trading"],
    signals: ["Your next step: try a signal", "You have been exploring signals. Open the demo signal workspace to see Botvio in action.", "Open Signals", "/signals"],
  };
  if (action === "complete_signup") return ["Finish creating your Botvio account", "You already started signup. Complete it to unlock your workspace.", "Complete signup", "/auth"];
  if (action === "show_signup_offer") return ["You're ready to try Botvio", "Based on what you've explored, your next best step is to create a free account and continue.", "Create account", "/auth"];
  if (action === "show_product_demo") return ["See Botvio in action", "Take a quick demo of the tools you have been exploring.", "Open demo", "/"];
  const x = interest ? labels[interest] : undefined;
  return x ?? ["Welcome to Botvio", "Explore signals, markets and automated trading tools. Create an account when you're ready.", "Explore Botvio", "/"];
}

async function upsertProfile(db: any, e: EventInput) {
  const { data: old } = await db.from("marketing_profiles").select("*").eq("visitor_id", e.visitor_id).maybeSingle();
  const interest = interestFromEvent(e);
  const interests = Array.from(new Set([...(old?.interests ?? []), ...(interest ? [interest] : [])]));
  const signedUp = Boolean(old?.signed_up || e.event_type === "signup_completed");
  const signupStarted = Boolean(old?.signup_started || e.event_type === "signup_started");
  const score = Math.min(100, Number(old?.intent_score ?? 0) + scoreEvent(e));
  const stage = signedUp ? "user" : score >= 25 ? "high_intent" : score >= 10 ? "engaged" : "visitor";
  const action = nextBestAction(score, signedUp, signupStarted, interests);
  const row = {
    visitor_id: e.visitor_id,
    user_id: e.user_id ?? old?.user_id ?? null,
    last_seen_at: new Date().toISOString(),
    pages_viewed: Number(old?.pages_viewed ?? 0) + (e.event_type === "page_view" ? 1 : 0),
    sessions: Number(old?.sessions ?? 0) + (e.event_type === "session_start" ? 1 : 0),
    signup_started: signupStarted,
    signed_up: signedUp,
    interests,
    intent_score: score,
    lifecycle_stage: stage,
    next_best_action: action,
    updated_at: new Date().toISOString(),
    metadata: { ...(old?.metadata ?? {}), last_event: e.event_type },
  };
  await db.from("marketing_profiles").upsert(row, { onConflict: "visitor_id" });
  return { old, ...row };
}

async function processVisitor(db: any, visitor_id: string) {
  const { data: p } = await db.from("marketing_profiles").select("*").eq("visitor_id", visitor_id).maybeSingle();
  if (!p || p.signed_up) return { visitor_id, notification: null };
  const now = Date.now();
  if (p.last_notification_at && now - new Date(p.last_notification_at).getTime() < 24 * 3600_000) {
    return { visitor_id, notification: null, throttled: true };
  }
  const action = p.next_best_action ?? "educate";
  const [title, body, cta_label, cta_url] = messageFor(action, p.interests ?? []);
  const { data: n, error } = await db.from("marketing_notifications").insert({
    visitor_id, user_id: p.user_id, channel: "in_app", notification_type: action,
    title, body, cta_label, cta_url, priority: p.intent_score >= 25 ? 80 : 50,
    status: "pending", metadata: { intent_score: p.intent_score, interests: p.interests },
  }).select().single();
  if (error) throw error;
  await db.from("marketing_profiles").update({
    last_notification_at: new Date().toISOString(),
    notification_count: Number(p.notification_count ?? 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq("visitor_id", visitor_id);
  return { visitor_id, notification: n };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const db = createClient(SERVICE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "track";

    if (action === "track") {
      const e = body.event as EventInput;
      if (!e?.visitor_id || !e?.event_type) return json({ error: "visitor_id and event_type are required" }, 400);
      const { error } = await db.from("marketing_events").insert({
        visitor_id: e.visitor_id, user_id: e.user_id ?? null, session_id: e.session_id ?? null,
        event_type: e.event_type, page_path: e.page_path ?? null, product: e.product ?? null,
        metadata: e.metadata ?? {},
      });
      if (error) throw error;
      const profile = await upsertProfile(db, e);
      const result = await processVisitor(db, e.visitor_id);
      return json({ ok: true, profile, ...result });
    }

    if (action === "process") {
      if (!assertAutomationKey(req)) return json({ error: "Unauthorized automation trigger" }, 401);
      const { data: profiles, error } = await db.from("marketing_profiles")
        .select("visitor_id").eq("signed_up", false).gte("intent_score", 10).limit(200);
      if (error) throw error;
      const results = [];
      for (const p of profiles ?? []) results.push(await processVisitor(db, p.visitor_id));
      return json({ ok: true, processed: results.length, results });
    }

    if (action === "report") {
      if (!assertAutomationKey(req)) return json({ error: "Unauthorized" }, 401);
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const [{ count: visitors }, { count: engaged }, { count: highIntent }, { count: signups }, { count: signupStarted }, { count: notifications }] = await Promise.all([
        db.from("marketing_profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", since),
        db.from("marketing_profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", since).in("lifecycle_stage", ["engaged", "high_intent", "user"]),
        db.from("marketing_profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", since).eq("lifecycle_stage", "high_intent"),
        db.from("marketing_profiles").select("*", { count: "exact", head: true }).gte("updated_at", since).eq("signed_up", true),
        db.from("marketing_profiles").select("*", { count: "exact", head: true }).gte("updated_at", since).eq("signup_started", true),
        db.from("marketing_notifications").select("*", { count: "exact", head: true }).gte("created_at", since),
      ]);
      const v = visitors ?? 0, s = signups ?? 0, ss = signupStarted ?? 0;
      const report = {
        report_date: new Date().toISOString().slice(0,10), period: "daily",
        visitors: v, engaged_visitors: engaged ?? 0, high_intent_visitors: highIntent ?? 0,
        signups: s, signup_rate: v ? Number((s / v * 100).toFixed(2)) : 0,
        signup_started: ss, signup_completion_rate: ss ? Number((s / ss * 100).toFixed(2)) : 0,
        notifications_created: notifications ?? 0,
        notification_clicks: 0, notification_conversion_rate: 0,
        top_interests: [], top_pages: [], top_next_actions: [],
        funnel: { visitors: v, engaged: engaged ?? 0, high_intent: highIntent ?? 0, signup_started: ss, signups: s },
        recommendations: [
          v && s / v < 0.03 ? "Improve first-visit signup CTA and reduce signup friction." : "Signup conversion is healthy; test stronger activation CTAs.",
          (highIntent ?? 0) > s ? "Follow up high-intent visitors with personalised product-specific CTAs." : "Keep personalised follow-up active."
        ],
        worker_summary: { generated_at: new Date().toISOString(), source: "marketing-intelligence-worker" }
      };
      const { data, error } = await db.from("marketing_worker_reports").upsert(report, { onConflict: "report_date,period" }).select().single();
      if (error) throw error;
      return json({ ok: true, report: data });
    }

    if (action === "status") {
      if (!assertAutomationKey(req)) return json({ error: "Unauthorized" }, 401);
      const [{ count: visitors }, { count: highIntent }, { count: notifications }] = await Promise.all([
        db.from("marketing_profiles").select("*", { count: "exact", head: true }),
        db.from("marketing_profiles").select("*", { count: "exact", head: true }).gte("intent_score", 25).eq("signed_up", false),
        db.from("marketing_notifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return json({ visitors, high_intent: highIntent, pending_notifications: notifications });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Worker error" }, 500);
  }
});
