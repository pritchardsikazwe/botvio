import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const Sig = z.object({
  symbol: z.string().min(2).max(40).regex(/^[A-Za-z0-9 ._-]+$/),
  timeframe: z.string().min(1).max(8),
  direction: z.enum(["BUY", "SELL"]),
  strategy: z.string().min(1).max(120),
  strategyId: z.string().max(80).optional(),
  confidence: z.number().min(0).max(100),
  entry: z.number().positive().finite(),
  stopLoss: z.number().positive().finite(),
  takeProfit: z.number().positive().finite(),
  time: z.number().int().positive(),
  result: z.enum(["WIN", "LOSS", "OPEN"]),
  reason: z.string().max(500).optional(),
  family: z.string().max(40).optional(),
  category: z.string().max(40).optional(),
  instrumentLabel: z.string().max(120).optional(),
});

const Body = z.object({ signals: z.array(Sig).min(1).max(50) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ ok: false, error: "Sign in required" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) return json({ ok: false, error: "Sign in required" }, 401);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ ok: false, error: parsed.error.flatten().fieldErrors }, 400);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // The signal is only publishable when it came from this user's connected
    // Weltrade feed. No synthetic or fallback prices are accepted here.
    const { data: conn } = await admin
      .from("syntx_api_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("connection_status", "connected")
      .limit(1);

    if (!conn?.length) return json({ ok: false, error: "Weltrade feed not connected" }, 403);

    const now = Date.now() / 1000;
    let inserted = 0;
    let settled = 0;

    for (const s of parsed.data.signals) {
      const okGeom =
        s.direction === "BUY"
          ? s.stopLoss < s.entry && s.takeProfit > s.entry
          : s.stopLoss > s.entry && s.takeProfit < s.entry;

      if (!okGeom || s.time > now + 120 || s.time < now - 7 * 86400) continue;

      const symbol = s.symbol.toUpperCase();
      const sourceKey = { source: "weltrade_chart", candle_time: s.time };

      const { data: existing } = await admin
        .from("trading_signals")
        .select("id,outcome")
        .eq("symbol", symbol)
        .eq("timeframe", s.timeframe)
        .eq("direction", s.direction)
        .contains("explanation_json", sourceKey)
        .limit(1);

      const outcome = s.result === "WIN" ? "win" : s.result === "LOSS" ? "loss" : "pending";

      if (outcome === "pending") {
        const recentWindow = new Date(Math.max(0, s.time * 1000 - 30 * 60 * 1000)).toISOString();
        const { data: opposite } = await admin
          .from("trading_signals")
          .select("id,direction")
          .eq("symbol", symbol)
          .eq("timeframe", s.timeframe)
          .eq("status", "ACTIVE")
          .neq("direction", s.direction)
          .gte("created_at", recentWindow)
          .limit(1);
        if (opposite?.length) continue;
      }

      if (existing?.length) {
        const row = existing[0];
        if (row.outcome === "pending" && outcome !== "pending") {
          await admin.from("trading_signals").update({
            outcome,
            status: "CLOSED",
            outcome_updated_at: new Date().toISOString(),
            settled_price: outcome === "win" ? s.takeProfit : s.stopLoss,
            settled_at: new Date().toISOString(),
          }).eq("id", row.id);
          settled++;
        }
        continue;
      }

      const { error } = await admin.from("trading_signals").insert({
        strategy_name: s.strategy,
        symbol,
        timeframe: s.timeframe,
        direction: s.direction,
        entry_price: s.entry,
        stop_loss: s.stopLoss,
        take_profit: s.takeProfit,
        confidence: Math.round(s.confidence),
        reason: s.reason ?? null,
        status: outcome === "pending" ? "ACTIVE" : "CLOSED",
        outcome,
        settled_price: outcome === "win" ? s.takeProfit : outcome === "loss" ? s.stopLoss : null,
        settled_at: outcome === "pending" ? null : new Date().toISOString(),
        category: s.category ?? "weltrade",
        broker: ["weltrade"],
        is_manual: false,
        posted_by: user.id,
        signal_lifecycle: "published",
        created_at: new Date(s.time * 1000).toISOString(),
        explanation_json: {
          source: "weltrade_chart",
          candle_time: s.time,
          strategy_id: s.strategyId ?? null,
          family: s.family ?? null,
          category: s.category ?? null,
          instrument_label: s.instrumentLabel ?? null,
        },
      });

      if (!error) inserted++;
      else console.error("Weltrade signal insert failed:", error.message);
    }

    return json({ ok: true, inserted, settled });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "Could not record Weltrade signals" }, 500);
  }
});
