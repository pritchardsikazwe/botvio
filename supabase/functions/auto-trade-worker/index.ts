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
const DERIV_WS = "wss://api.derivws.com/trading/v1/options/ws/public";

const DERIV_SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "frxXAUUSD", XAUUSD: "frxXAUUSD",
  "GBP/USD": "frxGBPUSD", GBPUSD: "frxGBPUSD",
  "BTC/USD": "cryBTCUSD", BTCUSD: "cryBTCUSD",
  "NAS100": "OTC_NDX", "NASDAQ": "OTC_NDX",
  "US30": "OTC_DJI", "SPX500": "OTC_SPC", "GER40": "OTC_GDAXI",
};

function toDerivSymbol(symbol: string): string {
  const key = String(symbol || "").trim().toUpperCase();
  if (DERIV_SYMBOL_MAP[key]) return DERIV_SYMBOL_MAP[key];
  if (key.startsWith("FRX") || key.startsWith("CRY") || key.startsWith("OTC_") || key.includes("_")) return symbol;
  if (/^[A-Z]{6}$/.test(key)) return `frx${key}`;
  return symbol;
}

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

type StrategyProfile = {
  id: string;
  label: string;
  minConfidence: number;
  atrStop: number;
  atrTarget: number;
  maxExtensionAtr: number;
};

function strategyFor(symbol: string): StrategyProfile {
  const s = String(symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s === "XAUUSD" || s === "GOLD") return { id: "GOLD_STRUCTURE", label: "Gold Structure + Liquidity", minConfidence: 76, atrStop: 1.35, atrTarget: 2.45, maxExtensionAtr: 1.25 };
  if (s === "BTCUSD" || s === "BTCUSDT") return { id: "BTC_MOMENTUM", label: "Bitcoin Momentum Breakout", minConfidence: 77, atrStop: 1.55, atrTarget: 2.8, maxExtensionAtr: 1.5 };
  if (s === "NAS100" || s === "NASDAQ" || s === "NDX") return { id: "NAS100_BREAKOUT", label: "NAS100 Breakout + Retest", minConfidence: 77, atrStop: 1.4, atrTarget: 2.6, maxExtensionAtr: 1.35 };
  if (s === "GBPUSD") return { id: "GBP_PULLBACK", label: "GBP Momentum Pullback", minConfidence: 75, atrStop: 1.2, atrTarget: 2.15, maxExtensionAtr: 1.15 };
  if (/^[A-Z]{6}$/.test(s)) return { id: "FX_TREND_PULLBACK", label: "FX Trend + Pullback", minConfidence: 74, atrStop: 1.25, atrTarget: 2.2, maxExtensionAtr: 1.2 };
  return { id: "GENERIC_TREND", label: "Adaptive Trend + Pullback", minConfidence: 72, atrStop: 1.3, atrTarget: 2.25, maxExtensionAtr: 1.25 };
}

function atr14(candles: Candle[]): number | null {
  if (candles.length < 16) return null;
  let sum = 0;
  for (let i = candles.length - 14; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    sum += Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
  }
  return sum / 14;
}

function buildSignal(candles: Candle[], symbol: string): {
  signal: "BUY" | "SELL" | "WAIT";
  confidence: number;
  reason: string;
  strategy: StrategyProfile;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
} {
  const strategy = strategyFor(symbol);
  if (candles.length < 60) return { signal: "WAIT", confidence: 0, reason: "Not enough candles", strategy };

  const closes = candles.map(c => c.close);
  const e9 = ema(closes, 9), e21 = ema(closes, 21), e50 = ema(closes, 50);
  const r = rsi(closes, 14);
  const a = atr14(candles);
  if (a == null || r == null) return { signal: "WAIT", confidence: 0, reason: "Indicators warming up", strategy };

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const trendUp = e9 > e21 && e21 > e50 && last.close > e50;
  const trendDown = e9 < e21 && e21 < e50 && last.close < e50;
  const body = Math.abs(last.close - last.open);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const upperWick = last.high - Math.max(last.open, last.close);
  const bullReject = last.close > last.open && lowerWick > Math.max(body * 0.8, a * 0.2);
  const bearReject = last.close < last.open && upperWick > Math.max(body * 0.8, a * 0.2);
  const range = last.high - last.low;
  const expansion = range >= a * 1.15;
  const overExtendedUp = (last.close - e9) / a > strategy.maxExtensionAtr;
  const overExtendedDown = (e9 - last.close) / a > strategy.maxExtensionAtr;
  const lookback = candles.slice(-22, -2);
  const hi = Math.max(...lookback.map(x => x.high));
  const lo = Math.min(...lookback.map(x => x.low));
  const breakoutUp = last.close > hi && prev.close <= hi;
  const breakoutDown = last.close < lo && prev.close >= lo;

  let signal: "BUY" | "SELL" | "WAIT" = "WAIT";
  let confidence = 0;
  const reasons: string[] = [];

  if (strategy.id === "GOLD_STRUCTURE" || strategy.id === "FX_TREND_PULLBACK" || strategy.id === "GBP_PULLBACK") {
    if (trendUp && e9 > e21 && bullReject && r >= 48 && r <= 70 && !overExtendedUp) {
      signal = "BUY"; confidence = strategy.minConfidence - 7;
      reasons.push("trend structure", "pullback rejection", "momentum-safe RSI");
    } else if (trendDown && e9 < e21 && bearReject && r >= 30 && r <= 52 && !overExtendedDown) {
      signal = "SELL"; confidence = strategy.minConfidence - 7;
      reasons.push("trend structure", "pullback rejection", "momentum-safe RSI");
    }
    if (breakoutUp && !overExtendedUp && range < a * 2.2) {
      signal = "BUY"; confidence = Math.max(confidence, strategy.minConfidence);
      reasons.push("confirmed range breakout");
    } else if (breakoutDown && !overExtendedDown && range < a * 2.2) {
      signal = "SELL"; confidence = Math.max(confidence, strategy.minConfidence);
      reasons.push("confirmed range breakdown");
    }
  } else if (strategy.id === "BTC_MOMENTUM" || strategy.id === "NAS100_BREAKOUT") {
    if (breakoutUp && expansion && !overExtendedUp) {
      signal = "BUY"; confidence = strategy.minConfidence;
      reasons.push("breakout", "volatility expansion", "anti-chase filter passed");
    } else if (breakoutDown && expansion && !overExtendedDown) {
      signal = "SELL"; confidence = strategy.minConfidence;
      reasons.push("breakdown", "volatility expansion", "anti-chase filter passed");
    } else if (trendUp && bullReject && r >= 50 && r <= 72 && !overExtendedUp) {
      signal = "BUY"; confidence = strategy.minConfidence - 5;
      reasons.push("trend continuation", "pullback confirmation");
    } else if (trendDown && bearReject && r >= 28 && r <= 50 && !overExtendedDown) {
      signal = "SELL"; confidence = strategy.minConfidence - 5;
      reasons.push("trend continuation", "pullback confirmation");
    }
  } else if (trendUp && bullReject && r >= 48 && r <= 70 && !overExtendedUp) {
    signal = "BUY"; confidence = strategy.minConfidence;
    reasons.push("adaptive trend", "pullback confirmation");
  } else if (trendDown && bearReject && r >= 30 && r <= 52 && !overExtendedDown) {
    signal = "SELL"; confidence = strategy.minConfidence;
    reasons.push("adaptive trend", "pullback confirmation");
  }

  if (range >= a * 2.4) {
    signal = "WAIT";
    reasons.push("abnormal volatility candle");
  }
  if ((signal === "BUY" && (r > 78 || overExtendedUp)) || (signal === "SELL" && (r < 22 || overExtendedDown))) {
    signal = "WAIT";
    reasons.push("late-entry filter");
  }
  if (signal === "WAIT" || confidence < strategy.minConfidence) {
    return { signal: "WAIT", confidence, reason: reasons.join(" · ") || "No confirmed setup", strategy };
  }

  const entry = last.close;
  const sl = signal === "BUY" ? entry - a * strategy.atrStop : entry + a * strategy.atrStop;
  const tp = signal === "BUY" ? entry + a * strategy.atrTarget : entry - a * strategy.atrTarget;
  return {
    signal, confidence: Math.min(96, confidence),
    reason: reasons.join(" · "),
    strategy, entry, stopLoss: sl, takeProfit: tp,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const trigger = req.headers.get("x-botvio-automation-secret") ?? "";
  const { data: expectedSecret, error: secretError } = await admin.rpc("get_botvio_automation_secret");
  if (secretError || !expectedSecret || trigger !== expectedSecret) {
    return new Response(JSON.stringify({ ok:false, error:"Unauthorized automation trigger" }), { status:401, headers:{...corsHeaders,"Content-Type":"application/json"} });
  }
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

          const candles = await fetchCandles(toDerivSymbol(inst.display_symbol), 60, 80);
          const sig = buildSignal(candles, inst.display_symbol);
          if (sig.signal === "WAIT" || sig.confidence < Math.max(inst.min_confidence ?? 70, sig.strategy.minConfidence)) {
            skipped++; continue;
          }

          const idempotencyKey = `auto:${userId}:${inst.instrument_key}:${Math.floor(Date.now() / (5 * 60 * 1000))}`;

          // Auto-post the signal to the public feed (best-effort, non-blocking on failure)
          if (inst.auto_post !== false) {
            try {
              const lastClose = candles[candles.length - 1]?.close ?? 0;
              const sl = sig.stopLoss ?? lastClose;
              const tp = sig.takeProfit ?? lastClose;
              await admin.from("trading_signals").insert({
                strategy_name: sig.strategy.label,
                symbol: inst.display_symbol,
                timeframe: "M1",
                direction: sig.signal,
                entry_price: Number(lastClose.toFixed(5)),
                stop_loss: Number(sl.toFixed(5)),
                take_profit: Number(tp.toFixed(5)),
                reason: `Cloud worker · ${sig.strategy.id} · ${sig.reason}`,
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
            // Use the symbol-specific ATR bracket generated by the strategy.
            const slPx = sig.stopLoss != null ? Number(sig.stopLoss.toFixed(5)) : undefined;
            const tpPx = sig.takeProfit != null ? Number(sig.takeProfit.toFixed(5)) : undefined;
            const command: Record<string, unknown> = {
              action: "OPEN",
              symbol: inst.display_symbol, // synthetic-hub already passes broker MT5 symbol
              type: sig.signal,
              volume: Number(inst.stake) > 0 ? Number(inst.stake) : Number(terminal.default_lot) || 0.01,
              source: "auto-trade-worker",
              requested_at: new Date().toISOString(),
              idempotency_key: idempotencyKey,
            };
            if (slPx) command.sl = slPx;
            if (tpPx) command.tp = tpPx;
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