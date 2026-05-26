// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DERIV_WS = `wss://api.derivws.com/trading/v1/options/ws/public`;

// ── Display symbol → Deriv symbol map ───────────────────────────────
const SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "frxXAUUSD",
  "XAG/USD": "frxXAGUSD",
  "EUR/USD": "frxEURUSD",
  "GBP/USD": "frxGBPUSD",
  "USD/JPY": "frxUSDJPY",
  "AUD/USD": "frxAUDUSD",
  "BTC/USD": "cryBTCUSD",
};

interface Candle { epoch: number; open: number; high: number; low: number; close: number; }

// ── Fetch candles from Deriv (no auth needed for ticks_history) ─────
async function fetchCandles(symbol: string, granularity: number, count = 60): Promise<Candle[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(DERIV_WS);
    const out: Candle[] = [];
    const t = setTimeout(() => { try { ws.close(); } catch { /* noop */ } resolve(out); }, 12000);
    ws.onopen = () => ws.send(JSON.stringify({
      ticks_history: symbol, adjust_start_time: 1, count, end: "latest",
      granularity, style: "candles",
    }));
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.candles) {
          for (const c of m.candles) out.push({
            epoch: Number(c.epoch), open: +c.open, high: +c.high, low: +c.low, close: +c.close,
          });
          clearTimeout(t); ws.close(); resolve(out);
        } else if (m.error) { clearTimeout(t); ws.close(); resolve(out); }
      } catch { /* noop */ }
    };
    ws.onerror = () => { clearTimeout(t); resolve(out); };
  });
}

// ── Donchian + ATR scalp signal detector (mirrors BotvioScalpRobot) ──
type ScalpSignal = {
  type: "breakout_up" | "breakout_down";
  side: "BUY" | "SELL";
  entry: number;
  sl: number;
  tp: number;
  level: number;
  atr: number;
  confidence: number;
  tf: "1m" | "5m";
};

function detectScalpSignal(candles: Candle[], tf: "1m" | "5m"): ScalpSignal | null {
  if (candles.length < 20) return null;
  const lookback = tf === "1m" ? 15 : 12;
  const recent = candles.slice(-lookback - 2, -2);
  const lastClosed = candles[candles.length - 2];
  if (!lastClosed || recent.length < 5) return null;

  const recentHigh = Math.max(...recent.map((c) => c.high));
  const recentLow = Math.min(...recent.map((c) => c.low));
  const ranges = candles.slice(-14).map((c) => c.high - c.low);
  const atr = ranges.reduce((s, r) => s + r, 0) / Math.max(ranges.length, 1);
  const slDist = Math.max(atr * 0.8, 0.0001);

  if (lastClosed.close > recentHigh) {
    return {
      type: "breakout_up", side: "BUY", entry: lastClosed.close,
      sl: lastClosed.close - slDist, tp: lastClosed.close + slDist * 2,
      level: recentHigh, atr, confidence: 78, tf,
    };
  }
  if (lastClosed.close < recentLow) {
    return {
      type: "breakout_down", side: "SELL", entry: lastClosed.close,
      sl: lastClosed.close + slDist, tp: lastClosed.close - slDist * 2,
      level: recentLow, atr, confidence: 78, tf,
    };
  }
  return null;
}

// ── Forex/Metals market hours (UTC) ─────────────────────────────────
function isMarketOpen(displaySymbol: string): boolean {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const hour = now.getUTCHours();

  // Crypto: always open
  if (displaySymbol.startsWith("BTC") || displaySymbol.startsWith("ETH")) return true;

  // Forex/Metals: closed Sat all day, closed Sun until 21:00 UTC, closed Fri after 21:00 UTC
  if (day === 6) return false;
  if (day === 0 && hour < 21) return false;
  if (day === 5 && hour >= 21) return false;
  return true;
}

// ── Run a single user's auto-trade pass ─────────────────────────────
async function runForUser(supabase: any, settings: any) {
  const userId = settings.user_id;
  const log = (msg: string, extra?: any) => console.log(`[auto-trade ${userId.slice(0,8)}] ${msg}`, extra || "");

  // 1) Daily kill-switch check
  const { data: pnlRow } = await supabase.rpc("get_auto_trade_today_pnl", { _user_id: userId });
  const todayPnl = Number(pnlRow?.[0]?.realized_pnl_usd ?? 0);
  const lossLimitUsd = -(settings.stake_usd * settings.daily_loss_limit_pct);
  if (todayPnl <= lossLimitUsd && todayPnl < 0) {
    log(`kill-switch: PnL ${todayPnl} ≤ limit ${lossLimitUsd}`);
    return { skipped: "daily_loss_limit_hit", pnl: todayPnl };
  }

  // 2) Find user's active Deriv connection matching account_type
  const { data: connections } = await supabase
    .from("deriv_connections")
    .select("id, login_id, account_type, is_connected, env")
    .eq("user_id", userId)
    .eq("is_connected", true);

  const conn = (connections || []).find((c: any) => {
    const isVirtual = c.env === "demo" || (c.login_id && c.login_id.startsWith("VRT"));
    return settings.account_type === "demo" ? isVirtual : !isVirtual;
  });

  if (!conn) { log(`no ${settings.account_type} Deriv connection`); return { skipped: "no_connection" }; }

  // 3) Iterate enabled assets
  const results: any[] = [];
  for (const displaySymbol of settings.enabled_assets) {
    const derivSymbol = SYMBOL_MAP[displaySymbol];
    if (!derivSymbol) continue;
    if (!isMarketOpen(displaySymbol)) { results.push({ displaySymbol, skipped: "market_closed" }); continue; }

    // Skip if already open
    const { data: hasOpen } = await supabase.rpc("has_open_auto_trade", {
      _user_id: userId, _display_symbol: displaySymbol,
    });
    if (hasOpen === true) { results.push({ displaySymbol, skipped: "already_open" }); continue; }

    // Pull 1m + 5m candles, prefer the strongest signal
    const [c1m, c5m] = await Promise.all([
      fetchCandles(derivSymbol, 60, 60),
      fetchCandles(derivSymbol, 300, 60),
    ]);
    const sig = detectScalpSignal(c5m, "5m") ?? detectScalpSignal(c1m, "1m");
    if (!sig) { results.push({ displaySymbol, skipped: "no_signal" }); continue; }
    if (sig.confidence < settings.min_confidence) {
      results.push({ displaySymbol, skipped: `confidence_${sig.confidence}<${settings.min_confidence}` });
      continue;
    }

    // 4) Insert pending execution row first (so we have a record even if execute fails)
    const { data: execRow, error: execErr } = await supabase
      .from("auto_trade_executions")
      .insert({
        user_id: userId,
        display_symbol: displaySymbol,
        deriv_symbol: derivSymbol,
        side: sig.side,
        signal_type: sig.type,
        signal_tf: sig.tf,
        confidence: sig.confidence,
        entry_price: sig.entry,
        stop_loss: sig.sl,
        take_profit: sig.tp,
        stake_usd: settings.stake_usd,
        multiplier: settings.multiplier,
        account_type: settings.account_type,
        status: "pending",
      })
      .select("id")
      .single();
    if (execErr) { log(`insert failed ${displaySymbol}`, execErr); continue; }

    // 5) Call deriv-trade-execute
    const slDistance = Math.abs(sig.entry - sig.sl);
    const tpDistance = Math.abs(sig.tp - sig.entry);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/deriv-trade-execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "apikey": SERVICE_KEY,
          "x-internal-user-id": userId,
        },
        body: JSON.stringify({
          connection_id: conn.id,
          contract_family: "MULTIPLIERS",
          payload: {
            symbol: derivSymbol,
            contract_type: sig.side === "BUY" ? "MULTUP" : "MULTDOWN",
            stake: settings.stake_usd,
            currency: "USD",
            multiplier: settings.multiplier,
            limit_order: {
              stop_loss: Number(slDistance.toFixed(6)),
              take_profit: Number(tpDistance.toFixed(6)),
            },
          },
          idempotency_key: `auto-${execRow.id}`,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        await supabase.from("auto_trade_executions").update({
          status: "rejected", error_message: data?.error || `HTTP ${resp.status}`, raw_response: data,
        }).eq("id", execRow.id);
        results.push({ displaySymbol, rejected: data?.error });
      } else {
        await supabase.from("auto_trade_executions").update({
          status: "filled", contract_id: data.contract_id || null, raw_response: data,
        }).eq("id", execRow.id);
        results.push({ displaySymbol, filled: true, contract_id: data.contract_id });
      }
    } catch (e: any) {
      await supabase.from("auto_trade_executions").update({
        status: "failed", error_message: e?.message || String(e),
      }).eq("id", execRow.id);
      results.push({ displaySymbol, failed: e?.message });
    }
  }

  return { user: userId, results };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: settingsList, error } = await supabase
      .from("auto_trade_settings")
      .select("*")
      .eq("enabled", true);
    if (error) throw error;

    const all = [];
    for (const s of (settingsList || [])) {
      if (!s.enabled_assets || s.enabled_assets.length === 0) continue;
      try { all.push(await runForUser(supabase, s)); }
      catch (e: any) { all.push({ user: s.user_id, error: e?.message }); }
    }

    return new Response(JSON.stringify({ ok: true, processed: all.length, results: all }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[auto-trade-scalp] error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
