// Evaluates ACTIVE auto-posted live signals every minute.
import { assertAutomationKey } from "../_shared/automationAuth.ts";
// For each signal, fetches latest Deriv tick to determine if TP/SL was hit.
// - Hit TP → status=CLOSED, outcome=win, signals_history.result=WIN
// - Hit SL → status=CLOSED, outcome=loss, signals_history.result=LOSS
// - Past expires_at without hit → status=EXPIRED, outcome=loss (timed out),
//   signals_history.result=LOSS (counts as miss for honest stats).
//
// This drives the public profitability tracker on the home page.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DERIV_WS = `wss://api.derivws.com/trading/v1/options/ws/public`;

// Map our display symbol → Deriv WS symbol.
function toDerivSymbol(sym: string): string | null {
  const s = sym.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s === "XAUUSD" || s === "GOLD") return "frxXAUUSD";
  if (s === "XAGUSD" || s === "SILVER") return "frxXAGUSD";
  if (s === "BTCUSD") return "cryBTCUSD";
  if (s === "ETHUSD") return "cryETHUSD";
  if (/^[A-Z]{6}$/.test(s)) return `frx${s}`;
  return null;
}

// Fetch latest tick price via short-lived WS.
async function fetchLatestPrice(derivSymbol: string, timeoutMs = 4000): Promise<number | null> {
  return await new Promise((resolve) => {
    let settled = false;
    const ws = new WebSocket(DERIV_WS);
    const t = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { ws.close(); } catch { /* noop */ }
        resolve(null);
      }
    }, timeoutMs);

    ws.onopen = () => {
      ws.send(JSON.stringify({ ticks_history: derivSymbol, count: 1, end: "latest", style: "ticks" }));
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.error) {
          if (!settled) { settled = true; clearTimeout(t); try { ws.close(); } catch { /* noop */ } resolve(null); }
          return;
        }
        const prices: number[] = data.history?.prices ?? [];
        const last = prices.length ? Number(prices[prices.length - 1]) : null;
        if (!settled) {
          settled = true;
          clearTimeout(t);
          try { ws.close(); } catch { /* noop */ }
          resolve(Number.isFinite(last) ? last : null);
        }
      } catch {
        if (!settled) { settled = true; clearTimeout(t); try { ws.close(); } catch { /* noop */ } resolve(null); }
      }
    };
    ws.onerror = () => {
      if (!settled) { settled = true; clearTimeout(t); try { ws.close(); } catch { /* noop */ } resolve(null); }
    };
  });
}

// Pip size per symbol for profit-pip calc (rough but consistent for display).
function pipSize(sym: string): number {
  const s = sym.toUpperCase();
  if (s.includes("BTC") || s.includes("ETH")) return 1;
  if (s.includes("XAU") || s.includes("GOLD")) return 0.1;
  if (s.includes("XAG") || s.includes("SILVER")) return 0.01;
  if (s.endsWith("JPY")) return 0.01;
  return 0.0001;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!assertAutomationKey(req)) return new Response(JSON.stringify({ success: false, error: "Unauthorized automation trigger" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const nowIso = new Date().toISOString();

    // Pull ACTIVE auto-posted signals (is_manual=false). Limit batch.
    const { data: signals, error } = await supabase
      .from("trading_signals")
      .select("id, symbol, direction, entry_price, stop_loss, take_profit, expires_at, created_at, timeframe")
      .eq("status", "ACTIVE")
      .eq("is_manual", false)
      .order("created_at", { ascending: true })
      .limit(80);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = { evaluated: 0, wins: 0, losses: 0, expired: 0, skipped: 0 };

    // Cache prices per symbol within this run.
    const priceCache = new Map<string, number | null>();

    for (const sig of signals || []) {
      summary.evaluated++;
      const isExpired = sig.expires_at && new Date(sig.expires_at).getTime() <= Date.now();

      const derivSym = toDerivSymbol(sig.symbol);
      let price: number | null = null;
      if (derivSym) {
        if (priceCache.has(derivSym)) price = priceCache.get(derivSym) ?? null;
        else {
          price = await fetchLatestPrice(derivSym);
          priceCache.set(derivSym, price);
        }
      }

      const isBuy = (sig.direction || "").toUpperCase() === "BUY";
      let outcome: "win" | "loss" | null = null;
      let settledPrice: number | null = null;

      if (price != null && sig.take_profit != null && sig.stop_loss != null) {
        if (isBuy) {
          if (price >= Number(sig.take_profit)) { outcome = "win"; settledPrice = price; }
          else if (price <= Number(sig.stop_loss)) { outcome = "loss"; settledPrice = price; }
        } else {
          if (price <= Number(sig.take_profit)) { outcome = "win"; settledPrice = price; }
          else if (price >= Number(sig.stop_loss)) { outcome = "loss"; settledPrice = price; }
        }
      }

      if (!outcome && isExpired) {
        // Timed out — count as loss (miss) for honest stats. Use last-known price if available.
        outcome = "loss";
        settledPrice = price ?? Number(sig.entry_price);
        summary.expired++;
      }

      if (!outcome) {
        summary.skipped++;
        continue;
      }

      if (outcome === "win") summary.wins++;
      else if (outcome === "loss" && !isExpired) summary.losses++;

      const newStatus = isExpired && outcome === "loss" ? "EXPIRED" : "CLOSED";

      await supabase
        .from("trading_signals")
        .update({
          status: newStatus,
          outcome,
          outcome_updated_at: nowIso,
          settled_price: settledPrice,
          settled_at: nowIso,
        })
        .eq("id", sig.id);

      // Mirror into signals_history.
      const ps = pipSize(sig.symbol);
      const diff = settledPrice != null ? (Number(settledPrice) - Number(sig.entry_price)) : 0;
      const pips = isBuy ? diff / ps : -diff / ps;

      // Upsert by signal_id (best-effort: try update, fall back to insert).
      const { data: existing } = await supabase
        .from("signals_history")
        .select("id")
        .eq("signal_id", sig.id)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("signals_history")
          .update({
            result: outcome === "win" ? "WIN" : "LOSS",
            profit_pips: +pips.toFixed(1),
            date_closed: nowIso,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("signals_history").insert({
          signal_id: sig.id,
          pair: sig.symbol,
          signal_type: isBuy ? "BUY" : "SELL",
          entry_price: sig.entry_price,
          take_profit: sig.take_profit,
          stop_loss: sig.stop_loss,
          result: outcome === "win" ? "WIN" : "LOSS",
          profit_pips: +pips.toFixed(1),
          source: "BOT",
          strategy_name: `Botvio Live ${sig.timeframe || "M5"}`,
          date_closed: nowIso,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
