// deno-lint-ignore-file no-explicit-any
// 24/7 server-side Botvio Scalp Robot → MT5 worker.
// Mirrors the client BotvioScalpRobot detector (Donchian breakout on 1m/5m
// closed candles) and queues BUY/SELL commands to each user's auto_execute
// MT5 terminal so signals fire even when no hub page is open.
//
// Trigger: pg_cron every minute.
// Selection: users with `auto_trade_settings.enabled = true` who also own at
//   least one `user_mt5_terminals.auto_execute = true` terminal.
// Cooldown: 5 minutes per (user, displaySymbol, side).
// Dedupe:    unique(user_id, signal_id) on scalp_mt5_sends.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BRIDGE_SHARED_SECRET = Deno.env.get("BRIDGE_SHARED_SECRET") ?? "";
const DERIV_APP_ID = Deno.env.get("DERIV_APP_ID") || "99139";
const DERIV_WS = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

const COOLDOWN_MS = 5 * 60 * 1000;

const SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "frxXAUUSD",
  "XAG/USD": "frxXAGUSD",
  "EUR/USD": "frxEURUSD",
  "GBP/USD": "frxGBPUSD",
  "USD/JPY": "frxUSDJPY",
  "AUD/USD": "frxAUDUSD",
  "USD/CAD": "frxUSDCAD",
  "USD/CHF": "frxUSDCHF",
  "NZD/USD": "frxNZDUSD",
  "BTC/USD": "cryBTCUSD",
  "ETH/USD": "cryETHUSD",
};

interface Candle { epoch: number; open: number; high: number; low: number; close: number; }

function isMarketOpen(displaySymbol: string): boolean {
  if (displaySymbol.startsWith("BTC") || displaySymbol.startsWith("ETH")) return true;
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false;
  if (day === 0 && hour < 21) return false;
  if (day === 5 && hour >= 21) return false;
  return true;
}

async function fetchCandles(symbol: string, granularity: number, count = 60): Promise<Candle[]> {
  return new Promise((resolve) => {
    let ws: WebSocket;
    try { ws = new WebSocket(DERIV_WS); } catch { resolve([]); return; }
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

type ScalpSignal = {
  side: "BUY" | "SELL";
  type: "breakout_up" | "breakout_down";
  entry: number;
  sl: number;
  tp: number;
  level: number;
  tf: "1m" | "5m";
  signal_id: string; // tf + side + lastClosed.epoch (mirrors client)
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
      side: "BUY", type: "breakout_up", entry: lastClosed.close,
      sl: lastClosed.close - slDist, tp: lastClosed.close + slDist * 2,
      level: recentHigh, tf,
      signal_id: `${tf}-bo-up-${lastClosed.epoch}`,
    };
  }
  if (lastClosed.close < recentLow) {
    return {
      side: "SELL", type: "breakout_down", entry: lastClosed.close,
      sl: lastClosed.close + slDist, tp: lastClosed.close - slDist * 2,
      level: recentLow, tf,
      signal_id: `${tf}-bo-dn-${lastClosed.epoch}`,
    };
  }
  return null;
}

async function queueMt5Trade(args: {
  userId: string;
  displaySymbol: string;
  side: "BUY" | "SELL";
  sl: number;
  tp: number;
}): Promise<{ ok: boolean; error?: string; volume?: number }> {
  const symbolForBridge = args.displaySymbol.replace("/", "");
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/queue-hub-trade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "x-internal-secret": BRIDGE_SHARED_SECRET,
      "x-internal-user-id": args.userId,
    },
    body: JSON.stringify({
      symbol: symbolForBridge,
      direction: args.side,
      sl: args.sl,
      tp: args.tp,
      source: "scalp-mt5-worker",
    }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) return { ok: false, error: json?.error ?? `HTTP ${resp.status}` };
  return { ok: true, volume: json?.volume };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Find users with at least one auto_execute MT5 terminal
    const { data: terminals } = await supabase
      .from("user_mt5_terminals")
      .select("user_id")
      .eq("auto_execute", true)
      .eq("route", "mt5");
    const eligibleUserIds = Array.from(new Set((terminals ?? []).map((t: any) => t.user_id)));
    if (eligibleUserIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0, reason: "no_eligible_terminals" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Pull their auto-trade settings (enabled + asset list)
    const { data: settingsList } = await supabase
      .from("auto_trade_settings")
      .select("user_id, enabled, enabled_assets, min_confidence")
      .in("user_id", eligibleUserIds)
      .eq("enabled", true);

    if (!settingsList || settingsList.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0, reason: "no_enabled_settings" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Aggregate the union of assets to scan once (efficient)
    const assetSet = new Set<string>();
    for (const s of settingsList) {
      for (const a of (s.enabled_assets ?? [])) {
        if (SYMBOL_MAP[a] && isMarketOpen(a)) assetSet.add(a);
      }
    }
    const candleCache: Record<string, ScalpSignal | null> = {};
    for (const displaySymbol of assetSet) {
      const derivSymbol = SYMBOL_MAP[displaySymbol];
      const [c1m, c5m] = await Promise.all([
        fetchCandles(derivSymbol, 60, 60),
        fetchCandles(derivSymbol, 300, 60),
      ]);
      // Prefer 5m (stronger), fallback to 1m
      const sig = detectScalpSignal(c5m, "5m") ?? detectScalpSignal(c1m, "1m");
      candleCache[displaySymbol] = sig;
    }

    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();
    const results: any[] = [];

    // 4. For each eligible user, evaluate each of their assets
    for (const settings of settingsList) {
      const userId = settings.user_id;
      for (const displaySymbol of (settings.enabled_assets ?? [])) {
        const sig = candleCache[displaySymbol];
        if (!sig) continue;

        // Cooldown check (5 min per asset+side)
        const { data: recent } = await supabase
          .from("scalp_mt5_sends")
          .select("id")
          .eq("user_id", userId)
          .eq("display_symbol", displaySymbol)
          .eq("side", sig.side)
          .gte("sent_at", cooldownCutoff)
          .limit(1);
        if (recent && recent.length > 0) {
          results.push({ userId, displaySymbol, skipped: "cooldown" });
          continue;
        }

        // Reserve send slot via unique signal_id (atomic)
        const { error: insErr } = await supabase
          .from("scalp_mt5_sends")
          .insert({
            user_id: userId,
            display_symbol: displaySymbol,
            side: sig.side,
            signal_id: sig.signal_id,
            tf: sig.tf,
          });
        if (insErr) {
          // Duplicate signal_id => already sent for this candle
          results.push({ userId, displaySymbol, skipped: "duplicate_signal" });
          continue;
        }

        // Queue MT5 trade
        const r = await queueMt5Trade({
          userId, displaySymbol, side: sig.side, sl: sig.sl, tp: sig.tp,
        });
        results.push({ userId, displaySymbol, side: sig.side, tf: sig.tf, ...r });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[scalp-mt5-worker] error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});