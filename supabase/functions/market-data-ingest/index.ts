import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALL_SYMBOLS = [
  "XAU/USD", "XAG/USD", "BTC/USD", "GBP/USD", "USD/JPY", "EUR/USD", "AUD/USD",
];
const TIMEFRAMES = ["1h", "4h"];

// Forex session windows (UTC hours)
const SESSIONS = [
  { name: "Sydney", open: 22, close: 7 },
  { name: "Tokyo", open: 0, close: 9 },
  { name: "London", open: 8, close: 17 },
  { name: "New York", open: 13, close: 22 },
];

const SESSION_ORDER = ["Sydney", "Tokyo", "London", "New York"];

// Currency relevance for news
const SYMBOL_CURRENCIES: Record<string, string[]> = {
  "XAU/USD": ["USD"],
  "XAG/USD": ["USD"],
  "BTC/USD": ["USD"],
  "GBP/USD": ["GBP", "USD"],
  "USD/JPY": ["USD", "JPY"],
  "EUR/USD": ["EUR", "USD"],
  "AUD/USD": ["AUD", "USD"],
};

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
  return { macd: ema12 - ema26, signal: null };
}

function detectTrend(ema20: number | null, ema50: number | null, rsi14: number | null): string {
  if (ema20 == null || ema50 == null || rsi14 == null) return "neutral";
  if (ema20 > ema50 && rsi14 >= 55) return "bullish";
  if (ema20 < ema50 && rsi14 <= 45) return "bearish";
  return "neutral";
}

// ---- Session Logic ----
function getSessionInfo(nowUtc: Date) {
  const hour = nowUtc.getUTCHours();
  
  const isInSession = (s: typeof SESSIONS[0]) => {
    if (s.open < s.close) return hour >= s.open && hour < s.close;
    return hour >= s.open || hour < s.close;
  };

  const active = SESSIONS.filter(isInSession).map(s => s.name);
  const currentSession = active.length > 0 ? active[active.length - 1] : "Off-hours";

  // Find next session to open
  let nextSession = "";
  let nextOpenAt: Date | null = null;
  
  for (const s of SESSION_ORDER) {
    const sess = SESSIONS.find(x => x.name === s)!;
    if (!isInSession(sess)) {
      nextSession = s;
      const openDate = new Date(nowUtc);
      openDate.setUTCHours(sess.open, 0, 0, 0);
      if (openDate <= nowUtc) openDate.setUTCDate(openDate.getUTCDate() + 1);
      nextOpenAt = openDate;
      break;
    }
  }

  return { currentSession, nextSession, nextOpenAt };
}

// ---- 4H Block Logic ----
function get4HBlock(nowUtc: Date) {
  const hour = nowUtc.getUTCHours();
  const blockStart = Math.floor(hour / 4) * 4;
  const blockEnd = blockStart + 4;
  return `${String(blockStart).padStart(2, '0')}:00–${String(blockEnd % 24).padStart(2, '0')}:00 UTC`;
}

// ---- Tip Logic ----
function buildMarketTip(price: number, s1: number, r1: number, atr: number | null, trend: string, minutesToNews: number | null): string {
  const atrVal = atr || 0;
  const nearSupport = atrVal > 0 && Math.abs(price - s1) <= atrVal * 0.15;
  const nearResistance = atrVal > 0 && Math.abs(price - r1) <= atrVal * 0.15;

  if (minutesToNews != null && minutesToNews <= 30) return "⚠️ News risk soon — reduce position size or wait.";
  if (trend === "bullish" && nearResistance) return "Breakout watch at resistance. A clean break may extend higher.";
  if (trend === "bullish" && nearSupport) return "Support bounce watch. Good risk/reward for longs if support holds.";
  if (trend === "bearish" && nearSupport) return "Support may fail. Watch for a breakdown below key levels.";
  if (trend === "bearish" && nearResistance) return "Resistance rejection watch. Look for short entries.";
  if (nearResistance) return "Price pressing intraday resistance. Wait for confirmation.";
  if (nearSupport) return "Price near support zone. Watch for reaction.";
  return "Range or mixed structure — wait for clearer setups.";
}

// ---- FCS Economic Calendar ----
async function fetchNextHighImpactEvent(fcsApiKey: string, currencies: string[]): Promise<{
  title: string; currency: string; impact: string; time: Date;
} | null> {
  if (!fcsApiKey) return null;
  
  try {
    const url = `https://fcsapi.com/api-v3/forex/economy_cal?access_key=${fcsApiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    
    if (!json.response || !Array.isArray(json.response)) return null;
    
    const now = new Date();
    const events = json.response
      .filter((e: any) => {
        const eventCurrency = (e.country || "").toUpperCase();
        const impact = (e.impact || e.importance || "").toLowerCase();
        const eventTime = new Date(e.date + " " + (e.time || "00:00"));
        return currencies.includes(eventCurrency) && 
               (impact === "high" || impact === "3") &&
               eventTime > now;
      })
      .sort((a: any, b: any) => {
        const ta = new Date(a.date + " " + (a.time || "00:00")).getTime();
        const tb = new Date(b.date + " " + (b.time || "00:00")).getTime();
        return ta - tb;
      });

    if (events.length === 0) return null;
    
    const e = events[0];
    return {
      title: e.title || e.event || "Economic Event",
      currency: (e.country || "").toUpperCase(),
      impact: "high",
      time: new Date(e.date + " " + (e.time || "00:00")),
    };
  } catch (err) {
    console.error("FCS calendar fetch error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const tdApiKey = Deno.env.get("TWELVE_DATA_API_KEY") ?? "";
  const fcsApiKey = Deno.env.get("FCS_API_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!tdApiKey) {
    return new Response(
      JSON.stringify({ error: "TWELVE_DATA_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: any = {};
    try { body = await req.json(); } catch {}
    
    let symbolIndex = body.symbol_index;
    if (symbolIndex == null) {
      symbolIndex = new Date().getMinutes() % ALL_SYMBOLS.length;
    }
    
    const symbol = ALL_SYMBOLS[symbolIndex % ALL_SYMBOLS.length];
    console.log(`Processing symbol: ${symbol} (index ${symbolIndex})`);

    const { data: assets, error: assetsErr } = await supabase
      .from("assets")
      .select("id,symbol,provider_symbol")
      .eq("symbol", symbol)
      .eq("is_active", true)
      .limit(1);
    if (assetsErr) throw assetsErr;
    
    const asset = assets?.[0];
    if (!asset) {
      return new Response(
        JSON.stringify({ error: `Asset ${symbol} not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nowUtc = new Date();

    // 1. Fetch price (1 API credit)
    const priceUrl = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(asset.provider_symbol)}&apikey=${tdApiKey}`;
    const priceRes = await fetch(priceUrl);
    const priceJson = await priceRes.json();
    const price = toNumber(priceJson?.price);
    
    if (price != null) {
      await supabase.from("market_quotes").insert({ asset_id: asset.id, price });
    }

    // 2. Fetch candles for each timeframe
    let candlesFetched = 0;
    let latestIndicators: any = null;
    let allCandles1h: any[] = [];
    
    for (const tf of TIMEFRAMES) {
      try {
        const tsUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(asset.provider_symbol)}&interval=${tf}&outputsize=120&format=JSON&apikey=${tdApiKey}`;
        const tsRes = await fetch(tsUrl);
        const tsJson = await tsRes.json();
        
        if (tsJson.status === "error") {
          console.error(`Twelve Data error for ${symbol} ${tf}: ${tsJson.message}`);
          continue;
        }

        const values = tsJson.values || [];
        if (!values.length) continue;

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

        const candles = values
          .map((v: any) => ({
            datetime: v.datetime,
            open: toNumber(v.open) || 0,
            high: toNumber(v.high) || 0,
            low: toNumber(v.low) || 0,
            close: toNumber(v.close) || 0,
            volume: toNumber(v.volume) || 0,
          }))
          .reverse();

        if (tf === "1h") allCandles1h = candles;

        const closes = candles.map((c: any) => c.close);
        const ema20 = calculateEMA(closes, 20);
        const ema50 = calculateEMA(closes, 50);
        const rsi14 = calculateRSI(closes, 14);
        const atr14 = calculateATR(candles, 14);
        const { macd, signal: macdSignal } = calculateMACD(closes);
        const trend = detectTrend(ema20, ema50, rsi14);

        // Support/Resistance from recent swing points
        const recent = candles.slice(-20);
        const lows = recent.map((c: any) => c.low).sort((a: number, b: number) => a - b);
        const highs = recent.map((c: any) => c.high).sort((a: number, b: number) => b - a);
        
        const support1 = lows[0];
        const support2 = lows.length > 2 ? lows[2] : lows[0];
        const resistance1 = highs[0];
        const resistance2 = highs.length > 2 ? highs[2] : highs[0];
        
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

        if (tf === "1h") {
          latestIndicators = { ema20, ema50, rsi14, atr14, trend, support1, support2, resistance1, resistance2 };
        }
      } catch (e) {
        console.error(`Error processing ${symbol} ${tf}:`, e);
      }
    }

    // 3. Compute card metrics
    const { currentSession, nextSession, nextOpenAt } = getSessionInfo(nowUtc);
    const current4hBlock = get4HBlock(nowUtc);

    // Day high/low from 1h candles (last 24h)
    let dayLow: number | null = null;
    let dayHigh: number | null = null;
    let h4High: number | null = null;
    let h4Low: number | null = null;

    if (allCandles1h.length > 0) {
      const last24 = allCandles1h.slice(-24);
      dayLow = Math.min(...last24.map((c: any) => c.low));
      dayHigh = Math.max(...last24.map((c: any) => c.high));
      
      // Current 4H block high/low (last 4 hourly candles)
      const last4 = allCandles1h.slice(-4);
      h4High = Math.max(...last4.map((c: any) => c.high));
      h4Low = Math.min(...last4.map((c: any) => c.low));
    }

    // Fetch economic calendar news
    const currencies = SYMBOL_CURRENCIES[symbol] || ["USD"];
    const newsEvent = await fetchNextHighImpactEvent(fcsApiKey, currencies);
    
    let minutesToNews: number | null = null;
    if (newsEvent) {
      minutesToNews = (newsEvent.time.getTime() - nowUtc.getTime()) / 60000;
    }

    // Build market tip
    const s1 = latestIndicators?.support1 ?? dayLow ?? 0;
    const r1 = latestIndicators?.resistance1 ?? dayHigh ?? 0;
    const tip = price != null
      ? buildMarketTip(price, s1, r1, latestIndicators?.atr14, latestIndicators?.trend || "neutral", minutesToNews)
      : "Awaiting price data.";

    // Upsert card metrics
    const metricsRow = {
      asset_id: asset.id,
      timeframe: "15min",
      snapshot_time: nowUtc.toISOString(),
      current_session: currentSession,
      next_session: nextSession,
      next_session_open_at: nextOpenAt?.toISOString() || null,
      next_high_impact_event: newsEvent?.title || null,
      next_high_impact_currency: newsEvent?.currency || null,
      next_high_impact_level: newsEvent?.impact || null,
      next_high_impact_time: newsEvent?.time.toISOString() || null,
      day_low: dayLow,
      day_high: dayHigh,
      current_4h_block: current4hBlock,
      current_4h_high: h4High,
      current_4h_low: h4Low,
      support_1: latestIndicators?.support1 || null,
      support_2: latestIndicators?.support2 || null,
      resistance_1: latestIndicators?.resistance1 || null,
      resistance_2: latestIndicators?.resistance2 || null,
      market_tip: tip,
    };

    await supabase.from("market_card_metrics").insert(metricsRow);

    console.log(`Done: ${symbol} - ${candlesFetched} candles, price=${price}, session=${currentSession}`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        price_saved: price != null,
        candles_fetched: candlesFetched,
        session: currentSession,
        news: newsEvent?.title || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Market ingestion error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
