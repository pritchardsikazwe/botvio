// deno-lint-ignore-file no-explicit-any
// 24/7 cloud auto-trade worker.
// Triggered by pg_cron every 2 minutes — scans all enabled per-instrument
// auto-trade rows, evaluates a server-side EMA/RSI signal mirroring the
// client `useDerivLiveSignal` engine, and either calls deriv-trade-execute
// or queues an MT5 bridge command. Honours per-user daily limits.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DERIV_APP_ID = Deno.env.get("DERIV_APP_ID") || "99139";
const DERIV_WS = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

interface Candle { epoch: number; open: number; high: number; low: number; close: number; }

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}
function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let g = 0, l = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) g += d; else l -= d;
  }
  const ag = g / period, al = l / period;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

async function fetchCandles(symbol: string, granularity = 60, count = 60): Promise<Candle[]> {
  return await new Promise((resolve) => {
    const ws = new WebSocket(DERIV_WS);
    const out: Candle[] = [];
    const t = setTimeout(() => { try { ws.close(); } catch { /* noop */ } resolve(out); }, 10000);
    ws.onopen = () => ws.send(JSON.stringify({
      ticks_history: symbol, adjust_start_time: 1, count, end: "latest",
      granularity, style: "candles",
    }));
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.candles) {
          for (const c of m.candles) out.push({
            epoch: +c.epoch, open: +c.open, high: +c.high, low: +c.low, close: +c.close,
          });
          clearTimeout(t); ws.close(); resolve(out);
        } else if (m.error) { clearTimeout(t); ws.close(); resolve(out); }
      } catch { /* noop */ }
    };
    ws.onerror = () => { clearTimeout(t); resolve(out); };
  });
}

function buildSignal(candles: Candle[]): { signal: "BUY" | "SELL" | "WAIT"; confidence: number; reason: string } {
  if (candles.length < 25) return { signal: "WAIT", confidence: 0, reason: "Not enough candles" };
  const closes = candles.map((c) => c.close);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50) ?? ema(closes, Math.min(50, closes.length - 1));
  const r = rsi(closes, 14);
  const last = closes[closes.length - 1];
  if (e20 == null || e50 == null || r == null) return { signal: "WAIT", confidence: 0, reason: "Indicators warming up" };
  const trendUp = e20 > e50 && last > e20;
  const trendDown = e20 < e50 && last < e20;
  let signal: "BUY" | "SELL" | "WAIT" = "WAIT";
  let conf = 50;
  if (trendUp && r > 50 && r < 75) { signal = "BUY"; conf = 60 + Math.min(20, Math.round(r - 50)); }
  else if (trendDown && r < 50 && r > 25) { signal = "SELL"; conf = 60 + Math.min(20, Math.round(50 - r)); }
  return { signal, confidence: conf, reason: `EMA20 ${e20.toFixed(2)} / EMA50 ${e50.toFixed(2)} / RSI ${r.toFixed(1)}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: run } = await admin.from("auto_trade_runs").insert({ status: "running" }).select("id").single();
  const runId = run?.id;
  let scanned = 0, placed = 0, skipped = 0, errors = 0;
  const details: any[] = [];

  try {
    // Global kill switch
    const { data: ks } = await admin.from("app_settings").select("value").eq("key", "global_kill_switch").maybeSingle();
    if (ks?.value?.enabled) {
      await admin.from("auto_trade_runs").update({ status: "killswitch", finished_at: new Date().toISOString(), details: { reason: ks.value.reason } }).eq("id", runId);
      return new Response(JSON.stringify({ ok: true, killswitch: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pull all enabled per-instrument rows
    const { data: rows, error } = await admin
      .from("auto_trade_instruments")
      .select("*")
      .eq("enabled", true);
    if (error) throw error;
    scanned = rows?.length ?? 0;

    // Group by user for limit checks
    const byUser = new Map<string, any[]>();
    for (const r of rows ?? []) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
      byUser.get(r.user_id)!.push(r);
    }

    for (const [userId, items] of byUser) {
      // ── Plan gating: only paid tiers (basic / standard / vip) get the cloud worker ──
      const { data: planRow } = await admin
        .from("user_plan_subscriptions")
        .select("status, pricing_plans!inner(code)")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      const planCode = (planRow as any)?.pricing_plans?.code ?? "free";
      const PAID_PLANS = ["basic", "standard", "vip", "pro", "premium"];
      if (!PAID_PLANS.includes(planCode)) {
        skipped += items.length;
        details.push({ userId, reason: "free_plan", planCode });
        continue;
      }

      // Load limits (defaults if missing)
      const { data: limits } = await admin.from("auto_trade_user_limits").select("*").eq("user_id", userId).maybeSingle();
      const maxTradesPerDay = limits?.max_trades_per_day ?? 20;
      const maxDailyLoss = Number(limits?.max_daily_loss_usd ?? 50);
      const maxOpen = limits?.max_open_positions ?? 3;
      const targetProfit = limits?.target_profit_usd != null ? Number(limits.target_profit_usd) : null;
      if (limits?.paused) { skipped += items.length; continue; }

      // Today's P&L from auto_trade_executions
      const { data: pnlRow } = await admin.rpc("get_auto_trade_today_pnl", { _user_id: userId });
      const today = Array.isArray(pnlRow) ? pnlRow[0] : pnlRow;
      const realized = Number(today?.realized_pnl_usd ?? 0);
      const tradesToday = Number(today?.trade_count ?? 0);
      if (tradesToday >= maxTradesPerDay) { skipped += items.length; details.push({ userId, reason: "max_trades" }); continue; }
      if (realized <= -Math.abs(maxDailyLoss)) { skipped += items.length; details.push({ userId, reason: "max_loss" }); continue; }
      if (targetProfit != null && realized >= targetProfit) { skipped += items.length; details.push({ userId, reason: "target_hit" }); continue; }

      for (const inst of items) {
        try {
          // Open position cap (per user across all instruments)
          const { count: openCount } = await admin
            .from("auto_trade_executions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .in("status", ["pending", "filled"]);
          if ((openCount ?? 0) >= maxOpen) { skipped++; continue; }

          // Skip if same instrument already has an open trade
          const { data: alreadyOpen } = await admin.rpc("has_open_auto_trade", {
            _user_id: userId, _display_symbol: inst.display_symbol,
          });
          if (alreadyOpen === true) { skipped++; continue; }

          // Throttle: don't trade same instrument twice within 5 minutes
          if (inst.last_trade_at && Date.now() - new Date(inst.last_trade_at).getTime() < 5 * 60 * 1000) {
            skipped++; continue;
          }

          const candles = await fetchCandles(inst.display_symbol, 60, 60);
          const sig = buildSignal(candles);
          if (sig.signal === "WAIT" || sig.confidence < (inst.min_confidence ?? 70)) {
            skipped++; continue;
          }

          const idempotencyKey = `auto:${userId}:${inst.instrument_key}:${Math.floor(Date.now() / (5 * 60 * 1000))}`;

          // Auto-post the signal to the public feed (best-effort, non-blocking on failure)
          if (inst.auto_post !== false) {
            try {
              const lastClose = candles[candles.length - 1]?.close ?? 0;
              const isBuy = sig.signal === "BUY";
              // Tight scalp brackets: ~0.25% SL, ~0.5% TP
              const slPct = 0.0025;
              const tpPct = 0.005;
              const sl = isBuy ? lastClose * (1 - slPct) : lastClose * (1 + slPct);
              const tp = isBuy ? lastClose * (1 + tpPct) : lastClose * (1 - tpPct);
              await admin.from("trading_signals").insert({
                strategy_name: "Botvio AI Strategy",
                symbol: inst.display_symbol,
                timeframe: "M1",
                direction: sig.signal,
                entry_price: Number(lastClose.toFixed(5)),
                stop_loss: Number(sl.toFixed(5)),
                take_profit: Number(tp.toFixed(5)),
                reason: `Cloud worker · ${sig.reason}`,
                confidence: sig.confidence,
                status: "ACTIVE",
                category: inst.category || "synthetic",
                broker: ["deriv", "weltrade", "exness"],
                is_manual: false,
                posted_by: userId,
                signal_lifecycle: "approved",
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              });
            } catch (postErr) {
              console.warn("auto-post failed", inst.instrument_key, postErr);
            }
          }

          if (inst.route === "deriv") {
            if (!inst.deriv_connection_id) { skipped++; continue; }
            const contractType = sig.signal === "BUY" ? "MULTUP" : "MULTDOWN";
            const resp = await fetch(`${SUPABASE_URL}/functions/v1/deriv-trade-execute`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
              body: JSON.stringify({
                connection_id: inst.deriv_connection_id,
                idempotency_key: idempotencyKey,
                contract_family: inst.contract_family || "MULTIPLIERS",
                payload: {
                  symbol: inst.display_symbol,
                  contract_type: contractType,
                  stake: Number(inst.stake) || 1,
                  multiplier: Number(inst.multiplier) || 100,
                  currency: "USD",
                },
              }),
            });
            if (!resp.ok) { errors++; details.push({ userId, inst: inst.instrument_key, route: "deriv", err: await resp.text() }); }
            else { placed++; }
          } else {
            // MT5 bridge: insert directly into mt5_commands using service key
            const { data: terminal } = await admin
              .from("user_mt5_terminals")
              .select("terminal_uid, default_lot")
              .eq("user_id", userId)
              .eq("auto_execute", true)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!terminal) { skipped++; continue; }
            const command = {
              action: "OPEN",
              symbol: inst.display_symbol, // synthetic-hub already passes broker MT5 symbol
              type: sig.signal,
              volume: Number(inst.stake) > 0 ? Number(inst.stake) : Number(terminal.default_lot) || 0.01,
              source: "auto-trade-worker",
              requested_at: new Date().toISOString(),
              idempotency_key: idempotencyKey,
            };
            const { error: insErr } = await admin.from("mt5_commands").insert({
              terminal_uid: terminal.terminal_uid, command, status: "QUEUED",
            });
            if (insErr) { errors++; details.push({ userId, inst: inst.instrument_key, route: "mt5", err: insErr.message }); }
            else { placed++; }
          }

          await admin.from("auto_trade_instruments")
            .update({ last_signal_at: new Date().toISOString(), last_trade_at: new Date().toISOString() })
            .eq("id", inst.id);
        } catch (e: any) {
          errors++;
          details.push({ userId, inst: inst.instrument_key, err: e?.message });
        }
      }
    }

    await admin.from("auto_trade_runs").update({
      status: "ok", finished_at: new Date().toISOString(),
      candidates_scanned: scanned, trades_placed: placed, trades_skipped: skipped, errors, details,
    }).eq("id", runId);

    return new Response(JSON.stringify({ ok: true, scanned, placed, skipped, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("auto-trade-worker error:", e);
    await admin.from("auto_trade_runs").update({
      status: "error", finished_at: new Date().toISOString(),
      candidates_scanned: scanned, trades_placed: placed, trades_skipped: skipped, errors: errors + 1,
      details: { error: e?.message },
    }).eq("id", runId);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});