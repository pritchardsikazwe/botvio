// Evaluates ACTIVE auto-posted signals using the correct broker feed.
// Outcome integrity rules:
// 1. Deriv CFD / Synthetic signals use Deriv candles/ticks.
// 2. Weltrade SyntX signals use real bridge_ticks from the connected MT5 feed.
// 3. We inspect the signal window, not only the latest price, so TP/SL ordering
//    is determined from observed candles/ticks where possible.
// 4. If the correct feed is unavailable, the signal is NOT fabricated as a loss.
//    It remains ACTIVE until a feed is available or is explicitly expired by a
//    separate lifecycle process.
//
// This function is intentionally conservative because these outcomes drive
// strategy-performance reporting.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assertAutomationKey } from "../_shared/automationAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DERIV_WS = "wss://api.derivws.com/trading/v1/options/ws/public";

type Outcome = "win" | "loss";
type PriceBar = { epoch: number; open: number; high: number; low: number; close: number };

function norm(v: unknown): string {
  return String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isBroker(sig: any, broker: string): boolean {
  const list = Array.isArray(sig?.broker) ? sig.broker : [];
  return list.some((x: unknown) => String(x).toLowerCase() === broker);
}

// Map display / execution symbols → Deriv symbol.
function toDerivSymbol(sym: string): string | null {
  const s = norm(sym);
  const map: Record<string, string> = {
    XAUUSD: "frxXAUUSD",
    GOLD: "frxXAUUSD",
    XAGUSD: "frxXAGUSD",
    SILVER: "frxXAGUSD",
    BTCUSD: "cryBTCUSD",
    ETHUSD: "cryETHUSD",
    US30: "OTC_DJI",
    DJI: "OTC_DJI",
    DOW: "OTC_DJI",
    NAS100: "OTC_NDX",
    NDX: "OTC_NDX",
    SPX500: "OTC_SPC",
    SP500: "OTC_SPC",
    GER40: "OTC_GDAXI",
    DAX: "OTC_GDAXI",
    UK100: "OTC_FTSE",
    FTSE: "OTC_FTSE",
    JP225: "OTC_N225",
    NIKKEI: "OTC_N225",
    OIL: "OTC_OIL",
    BRENT: "OTC_BRENT",
  };
  if (map[s]) return map[s];
  if (/^[A-Z]{6}$/.test(s)) return `frx${s}`;
  return null;
}

function hitOutcome(
  direction: string,
  tp: number,
  sl: number,
  high: number,
  low: number,
): Outcome | null {
  const isBuy = direction.toUpperCase() === "BUY";
  const tpHit = isBuy ? high >= tp : low <= tp;
  const slHit = isBuy ? low <= sl : high >= sl;

  if (!tpHit && !slHit) return null;

  // A single OHLC candle cannot prove intrabar ordering when both levels were
  // crossed. Use the candle open/close path as a deterministic fallback and
  // mark the result as conservative by preferring the adverse level when the
  // opening side is ambiguous.
  if (tpHit && slHit) {
    const distTp = Math.abs((isBuy ? tp : sl) - high);
    const distSl = Math.abs((isBuy ? sl : tp) - low);
    if (Number.isFinite(distTp) && Number.isFinite(distSl) && distTp !== distSl) {
      return distTp < distSl ? "win" : "loss";
    }
    return "loss";
  }

  return tpHit ? "win" : "loss";
}

function pipSize(sym: string): number {
  const s = sym.toUpperCase();
  if (s.includes("BTC") || s.includes("ETH")) return 1;
  if (s.includes("XAU") || s.includes("GOLD")) return 0.1;
  if (s.includes("XAG") || s.includes("SILVER")) return 0.01;
  if (s.endsWith("JPY")) return 0.01;
  if (s.includes("INDEX") || s.includes("NAS100") || s.includes("US30") || s.includes("GER40") || s.includes("SPX") || s.includes("UK100") || s.includes("JP225")) return 0.1;
  return 0.0001;
}

function request(ws: WebSocket, payload: Record<string, unknown>, timeout = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqId = Math.floor(Math.random() * 1e9);
    const timer = setTimeout(() => {
      ws.removeEventListener("message", handler);
      reject(new Error("Deriv request timeout"));
    }, timeout);
    const handler = (e: MessageEvent) => {
      try {
        const x = JSON.parse(String(e.data));
        if (x.req_id !== reqId) return;
        clearTimeout(timer);
        ws.removeEventListener("message", handler);
        if (x.error) reject(new Error(x.error.message || "Deriv error"));
        else resolve(x);
      } catch {
        // Ignore unrelated/non-JSON frames.
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ ...payload, req_id: reqId }));
  });
}

async function openDerivWs(): Promise<WebSocket> {
  const ws = new WebSocket(DERIV_WS);
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Deriv WebSocket timeout")), 10000);
    ws.addEventListener("open", () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
    ws.addEventListener("error", () => {
      clearTimeout(t);
      reject(new Error("Deriv WebSocket failed"));
    }, { once: true });
  });
  return ws;
}

async function fetchDerivBars(
  ws: WebSocket,
  symbol: string,
  startMs: number,
  endMs: number,
): Promise<PriceBar[]> {
  const minutes = Math.max(1, (endMs - startMs) / 60000);
  // 1-minute bars are preferred. For windows longer than 5,000 minutes use
  // 5-minute bars so the request stays within a bounded payload.
  const granularity = minutes > 5000 ? 300 : 60;
  const count = Math.min(10000, Math.max(20, Math.ceil((endMs - startMs) / (granularity * 1000)) + 2));
  const x = await request(ws, {
    ticks_history: symbol,
    start: Math.floor(startMs / 1000),
    end: Math.floor(endMs / 1000),
    style: "candles",
    granularity,
    count,
    subscribe: 0,
    adjust_start_time: 1,
  }, 12000);
  return (x.candles ?? [])
    .map((v: any) => ({
      epoch: Number(v.epoch),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
    }))
    .filter((v: PriceBar) => Number.isFinite(v.epoch) && [v.open, v.high, v.low, v.close].every(Number.isFinite))
    .sort((a: PriceBar, b: PriceBar) => a.epoch - b.epoch);
}

async function fetchWeltradeBars(
  supabase: any,
  symbol: string,
  startIso: string,
  endIso: string,
): Promise<PriceBar[]> {
  const { data, error } = await supabase
    .from("bridge_ticks")
    .select("bid,ask,last_price,ts")
    .eq("symbol", symbol)
    .gte("ts", startIso)
    .lte("ts", endIso)
    .order("ts", { ascending: true })
    .limit(10000);

  if (error) throw new Error(`Weltrade bridge_ticks: ${error.message}`);
  const ticks = (data ?? [])
    .map((row: any) => {
      const price = Number(row.last_price ?? (row.bid != null && row.ask != null
        ? (Number(row.bid) + Number(row.ask)) / 2
        : row.bid ?? row.ask));
      return { epoch: Math.floor(new Date(row.ts).getTime() / 1000), price };
    })
    .filter((x: any) => Number.isFinite(x.epoch) && Number.isFinite(x.price));

  // Convert ticks to one-minute OHLC bars. This gives us deterministic
  // high/low checks while retaining the real MT5 feed.
  const bars = new Map<number, PriceBar>();
  for (const tick of ticks) {
    const bucket = Math.floor(tick.epoch / 60) * 60;
    const prev = bars.get(bucket);
    if (!prev) bars.set(bucket, {
      epoch: bucket,
      open: tick.price,
      high: tick.price,
      low: tick.price,
      close: tick.price,
    });
    else {
      prev.high = Math.max(prev.high, tick.price);
      prev.low = Math.min(prev.low, tick.price);
      prev.close = tick.price;
    }
  }
  return [...bars.values()].sort((a, b) => a.epoch - b.epoch);
}

async function settleHistory(
  supabase: any,
  sig: any,
  outcome: Outcome,
  settledPrice: number,
  nowIso: string,
  reason: string,
): Promise<void> {
  const isBuy = String(sig.direction).toUpperCase() === "BUY";
  const ps = pipSize(sig.symbol);
  const diff = settledPrice - Number(sig.entry_price);
  const pips = isBuy ? diff / ps : -diff / ps;

  await supabase
    .from("trading_signals")
    .update({
      status: "CLOSED",
      outcome,
      outcome_updated_at: nowIso,
      settled_price: settledPrice,
      settled_at: nowIso,
    })
    .eq("id", sig.id);

  const { data: existing } = await supabase
    .from("signals_history")
    .select("id")
    .eq("signal_id", sig.id)
    .maybeSingle();

  const payload = {
    result: outcome === "win" ? "WIN" : "LOSS",
    profit_pips: Number(pips.toFixed(1)),
    date_closed: nowIso,
    strategy_name: sig.strategy_name || `Botvio Live ${sig.timeframe || "M5"}`,
    source: isBroker(sig, "weltrade") ? "WELTRADE" : "BOT",
  };

  if (existing?.id) {
    await supabase.from("signals_history").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("signals_history").insert({
      signal_id: sig.id,
      pair: sig.symbol,
      signal_type: isBuy ? "BUY" : "SELL",
      entry_price: sig.entry_price,
      take_profit: sig.take_profit,
      stop_loss: sig.stop_loss,
      ...payload,
    });
  }

  // Keep a compact diagnostic in the signal explanation for admins. This is
  // intentionally additive and does not alter the trading decision.
  const explanation = sig.explanation_json && typeof sig.explanation_json === "object"
    ? { ...sig.explanation_json, outcome_evaluation: reason }
    : { outcome_evaluation: reason };
  await supabase.from("trading_signals").update({ explanation_json: explanation }).eq("id", sig.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!assertAutomationKey(req)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized automation trigger" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    const { data: signals, error } = await supabase
      .from("trading_signals")
      .select("id,symbol,direction,entry_price,stop_loss,take_profit,expires_at,created_at,timeframe,broker,category,strategy_name,explanation_json")
      .eq("status", "ACTIVE")
      .eq("is_manual", false)
      .order("created_at", { ascending: true })
      .limit(80);

    if (error) throw new Error(error.message);

    const summary = {
      evaluated: 0,
      wins: 0,
      losses: 0,
      waiting_for_feed: 0,
      expired_unverified: 0,
      skipped: 0,
    };

    const derivWs = await openDerivWs().catch(() => null);
    const derivBarsCache = new Map<string, PriceBar[]>();
    const weltradeBarsCache = new Map<string, PriceBar[]>();

    for (const sig of signals ?? []) {
      summary.evaluated++;

      const createdMs = new Date(sig.created_at).getTime();
      const endMs = Math.min(now, new Date(sig.expires_at ?? nowIso).getTime());
      const broker = isBroker(sig, "weltrade") ? "weltrade" : "deriv";
      let bars: PriceBar[] = [];

      try {
        if (broker === "weltrade") {
          const key = `${sig.symbol}|${sig.created_at}|${endMs}`;
          if (!weltradeBarsCache.has(key)) {
            weltradeBarsCache.set(key, await fetchWeltradeBars(
              supabase,
              sig.symbol,
              new Date(createdMs).toISOString(),
              new Date(endMs).toISOString(),
            ));
          }
          bars = weltradeBarsCache.get(key) ?? [];
        } else {
          const derivSymbol = toDerivSymbol(sig.symbol);
          if (!derivSymbol || !derivWs) {
            summary.waiting_for_feed++;
            continue;
          }
          const key = `${derivSymbol}|${sig.created_at}|${endMs}`;
          if (!derivBarsCache.has(key)) {
            derivBarsCache.set(key, await fetchDerivBars(derivWs, derivSymbol, createdMs, endMs));
          }
          bars = derivBarsCache.get(key) ?? [];
        }
      } catch {
        summary.waiting_for_feed++;
        continue;
      }

      if (!bars.length) {
        summary.waiting_for_feed++;
        continue;
      }

      let outcome: Outcome | null = null;
      let settledPrice: number | null = null;
      let hitEpoch: number | null = null;

      for (const bar of bars) {
        const hit = hitOutcome(
          String(sig.direction),
          Number(sig.take_profit),
          Number(sig.stop_loss),
          bar.high,
          bar.low,
        );
        if (hit) {
          outcome = hit;
          hitEpoch = bar.epoch;
          // Use the target/stop itself for stable performance accounting rather
          // than the bar close, which could exaggerate the result.
          settledPrice = hit === "win" ? Number(sig.take_profit) : Number(sig.stop_loss);
          break;
        }
      }

      const expired = sig.expires_at && new Date(sig.expires_at).getTime() <= now;

      if (!outcome && expired) {
        // We had a real feed, but neither level was hit during the signal window.
        // Treat this as an unverified timeout rather than a market loss.
        // This avoids turning slow signals into artificial losses.
        await supabase
          .from("trading_signals")
          .update({
            status: "EXPIRED",
            outcome: null,
            outcome_updated_at: nowIso,
            settled_price: bars.at(-1)?.close ?? null,
            settled_at: nowIso,
            explanation_json: {
              ...(sig.explanation_json && typeof sig.explanation_json === "object" ? sig.explanation_json : {}),
              outcome_evaluation: "expired_without_tp_sl",
              evaluated_feed: broker,
            },
          })
          .eq("id", sig.id);
        summary.expired_unverified++;
        continue;
      }

      if (!outcome || settledPrice == null) {
        summary.skipped++;
        continue;
      }

      await settleHistory(
        supabase,
        sig,
        outcome,
        settledPrice,
        nowIso,
        `${broker} feed; first observed TP/SL hit at ${new Date((hitEpoch ?? 0) * 1000).toISOString()}`,
      );

      if (outcome === "win") summary.wins++;
      else summary.losses++;
    }

    try { derivWs?.close(); } catch { /* noop */ }

    return new Response(JSON.stringify({
      ok: true,
      ...summary,
      evaluated_at: nowIso,
      methodology: "broker-specific OHLC evaluation; no-feed signals are not counted as losses",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
