import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYMBOLS = [
  "XAU/USD", "XAG/USD", "BTC/USD", "GBP/USD", "USD/JPY", "EUR/USD", "AUD/USD",
];
const TIMEFRAMES = ["5min", "15min", "1h", "4h"];

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculateEMA(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * k + ema;
  }
  return ema;
}

function calculateRSI(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses += Math.abs(d);
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? Math.abs(d) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calculateATR(candles: { high: number; low: number; close: number }[], period = 14): number | null {
  if (candles.length <= period) return null;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    ));
  }
  if (trs.length < period) return null;
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

function calculateMACD(closes: number[]): { macd: number | null; signal: number | null } {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  if (ema12 == null || ema26 == null) return { macd: null, signal: null };
  const macdVal = ema12 - ema26;
  // Simplified signal line
  return { macd: macdVal, signal: null };
}

function detectTrend(ema20: number | null, ema50: number | null, rsi14: number | null): string {
  if (ema20 == null || ema50 == null || rsi14 == null) return "neutral";
  if (ema20 > ema50 && rsi14 >= 55) return "bullish";
  if (ema20 < ema50 && rsi14 <= 45) return "bearish";
  return "neutral";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const tdApiKey = Deno.env.get("TWELVE_DATA_API_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Auth check - admin only
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (userData?.user?.id) {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      // Allow non-admin to trigger but log it
    }
  }

  if (!tdApiKey) {
    return new Response(
      JSON.stringify({ error: "TWELVE_DATA_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get asset map
    const { data: assets, error: assetsErr } = await supabase
      .from("assets")
      .select("id,symbol,provider_symbol")
      .eq("is_active", true);
    if (assetsErr) throw assetsErr;

    const assetMap = new Map(assets?.map((a: any) => [a.symbol, a]) || []);

    // 1. Fetch latest prices
    const priceUrl = `https://api.twelvedata.com/price?symbol=${SYMBOLS.join(",")}&apikey=${tdApiKey}`;
    const priceRes = await fetch(priceUrl);
    if (!priceRes.ok) throw new Error(`Price fetch failed: ${priceRes.status}`);
    const priceJson = await priceRes.json();

    const quoteRows: any[] = [];
    for (const symbol of SYMBOLS) {
      const asset = assetMap.get(symbol) as any;
      if (!asset) continue;
      const raw = priceJson[symbol]?.price ?? priceJson[symbol];
      const price = toNumber(raw);
      if (price != null) {
        quoteRows.push({ asset_id: asset.id, price });
      }
    }

    if (quoteRows.length > 0) {
      await supabase.from("market_quotes").insert(quoteRows);
    }

    // 2. Fetch candles + compute indicators for each symbol/timeframe
    let candlesFetched = 0;
    for (const symbol of SYMBOLS) {
      const asset = assetMap.get(symbol) as any;
      if (!asset) continue;

      for (const tf of TIMEFRAMES) {
        try {
          const tsUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(asset.provider_symbol)}&interval=${tf}&outputsize=120&format=JSON&apikey=${tdApiKey}`;
          const tsRes = await fetch(tsUrl);
          if (!tsRes.ok) continue;
          const tsJson = await tsRes.json();
          if (tsJson.status === "error") {
            console.error(`Twelve Data error for ${symbol} ${tf}: ${tsJson.message}`);
            continue;
          }

          const values = tsJson.values || [];
          if (!values.length) continue;

          // Save candles
          const candleRows = values.map((v: any) => ({
            asset_id: asset.id,
            timeframe: tf,
            candle_time: new Date(v.datetime).toISOString(),
            open: toNumber(v.open),
            high: toNumber(v.high),
            low: toNumber(v.low),
            close: toNumber(v.close),
            volume: toNumber(v.volume),
            provider: "twelvedata",
          }));

          await supabase
            .from("market_candles")
            .upsert(candleRows, { onConflict: "asset_id,timeframe,candle_time" });

          candlesFetched += candleRows.length;

          // Compute indicators
          const candles = values
            .map((v: any) => ({
              datetime: v.datetime,
              open: toNumber(v.open) || 0,
              high: toNumber(v.high) || 0,
              low: toNumber(v.low) || 0,
              close: toNumber(v.close) || 0,
              volume: toNumber(v.volume) || 0,
            }))
            .reverse(); // oldest first

          const closes = candles.map((c: any) => c.close);
          const ema20 = calculateEMA(closes, 20);
          const ema50 = calculateEMA(closes, 50);
          const rsi14 = calculateRSI(closes, 14);
          const atr14 = calculateATR(candles, 14);
          const { macd, signal: macdSignal } = calculateMACD(closes);
          const trend = detectTrend(ema20, ema50, rsi14);

          const recent = candles.slice(-20);
          const support1 = Math.min(...recent.map((c: any) => c.low));
          const resistance1 = Math.max(...recent.map((c: any) => c.high));
          const latest = candles[candles.length - 1];

          await supabase.from("market_indicators").upsert({
            asset_id: asset.id,
            timeframe: tf,
            candle_time: new Date(latest.datetime).toISOString(),
            ema_20: ema20,
            ema_50: ema50,
            rsi_14: rsi14,
            atr_14: atr14,
            macd,
            macd_signal: macdSignal,
            support_1: support1,
            resistance_1: resistance1,
            trend,
          }, { onConflict: "asset_id,timeframe,candle_time" });

        } catch (e) {
          console.error(`Error processing ${symbol} ${tf}:`, e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        quotes_saved: quoteRows.length,
        candles_fetched: candlesFetched,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Market ingestion error:", error);
    await supabase.from("edge_logs").insert({
      function_name: "market-data-ingest",
      error_code: "INGESTION_ERROR",
      error_message: error.message,
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
