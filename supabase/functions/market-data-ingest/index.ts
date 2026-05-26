import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALL_SYMBOLS = [
  "XAU/USD", "XAG/USD", "BTC/USD", "GBP/USD", "USD/JPY", "EUR/USD", "AUD/USD",
];
const TIMEFRAMES = ["1h", "4h"];

const SESSIONS = [
  { name: "Sydney", open: 22, close: 7 },
  { name: "Tokyo", open: 0, close: 9 },
  { name: "London", open: 8, close: 17 },
  { name: "New York", open: 13, close: 22 },
];
const SESSION_ORDER = ["Sydney", "Tokyo", "London", "New York"];

const SYMBOL_CURRENCIES: Record<string, string[]> = {
  "XAU/USD": ["USD"],
  "XAG/USD": ["USD"],
  "BTC/USD": ["USD"],
  "GBP/USD": ["GBP", "USD"],
  "USD/JPY": ["USD", "JPY"],
  "EUR/USD": ["EUR", "USD"],
  "AUD/USD": ["AUD", "USD"],
};

// AlphaVantage symbol mapping
const AV_SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "XAUUSD",
  "XAG/USD": "XAGUSD",
  "BTC/USD": "BTCUSD",
  "GBP/USD": "GBPUSD",
  "USD/JPY": "USDJPY",
  "EUR/USD": "EURUSD",
  "AUD/USD": "AUDUSD",
};

// Finnhub symbol mapping
const FH_SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "OANDA:XAU_USD",
  "XAG/USD": "OANDA:XAG_USD",
  "BTC/USD": "BINANCE:BTCUSDT",
  "GBP/USD": "OANDA:GBP_USD",
  "USD/JPY": "OANDA:USD_JPY",
  "EUR/USD": "OANDA:EUR_USD",
  "AUD/USD": "OANDA:AUD_USD",
};

// Deriv symbol mapping (reliable fallback)
const DERIV_SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "frxXAUUSD",
  "XAG/USD": "frxXAGUSD",
  "BTC/USD": "cryBTCUSD",
  "GBP/USD": "frxGBPUSD",
  "USD/JPY": "frxUSDJPY",
  "EUR/USD": "frxEURUSD",
  "AUD/USD": "frxAUDUSD",
};

// AlphaVantage timeframe mapping
const AV_INTERVAL_MAP: Record<string, string> = {
  "1h": "60min",
  "4h": "60min", // AV doesn't have 4h; we'll aggregate from 60min
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

function getSessionInfo(nowUtc: Date) {
  const hour = nowUtc.getUTCHours();
  const isInSession = (s: typeof SESSIONS[0]) => {
    if (s.open < s.close) return hour >= s.open && hour < s.close;
    return hour >= s.open || hour < s.close;
  };
  const active = SESSIONS.filter(isInSession).map(s => s.name);
  const currentSession = active.length > 0 ? active[active.length - 1] : "Off-hours";
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

function get4HBlock(nowUtc: Date) {
  const hour = nowUtc.getUTCHours();
  const blockStart = Math.floor(hour / 4) * 4;
  const blockEnd = blockStart + 4;
  return `${String(blockStart).padStart(2, '0')}:00–${String(blockEnd % 24).padStart(2, '0')}:00 UTC`;
}

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
        return currencies.includes(eventCurrency) && (impact === "high" || impact === "3") && eventTime > now;
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

// ============ PROVIDER ABSTRACTION ============

type PriceResult = { price: number; provider: string };
type CandleResult = { candles: any[]; provider: string };

// --- TwelveData ---
async function fetchPriceTwelveData(providerSymbol: string, apiKey: string): Promise<PriceResult | null> {
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(providerSymbol)}&apikey=${apiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code === 429 || json.status === "error") {
    console.warn(`TwelveData price rate-limited or error: ${json.message || json.code}`);
    return null;
  }
  const price = toNumber(json?.price);
  return price != null ? { price, provider: "twelvedata" } : null;
}

async function fetchCandlesTwelveData(providerSymbol: string, tf: string, apiKey: string): Promise<CandleResult | null> {
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(providerSymbol)}&interval=${tf}&outputsize=120&format=JSON&apikey=${apiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code === 429 || json.status === "error") {
    console.warn(`TwelveData candles rate-limited or error for ${tf}: ${json.message || json.code}`);
    return null;
  }
  const values = json.values || [];
  if (!values.length) return null;
  const candles = values.map((v: any) => ({
    datetime: v.datetime,
    open: toNumber(v.open) || 0,
    high: toNumber(v.high) || 0,
    low: toNumber(v.low) || 0,
    close: toNumber(v.close) || 0,
    volume: toNumber(v.volume) || 0,
  })).reverse();
  return { candles, provider: "twelvedata" };
}

// --- AlphaVantage ---
async function fetchPriceAlphaVantage(symbol: string, apiKey: string): Promise<PriceResult | null> {
  const avSymbol = AV_SYMBOL_MAP[symbol];
  if (!avSymbol || !apiKey) return null;

  // Use GLOBAL_QUOTE for forex/crypto
  const isCrypto = symbol.includes("BTC") || symbol.includes("ETH");
  let url: string;
  if (isCrypto) {
    const base = avSymbol.replace("USD", "");
    url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=USD&apikey=${apiKey}`;
  } else {
    const from = avSymbol.substring(0, 3);
    const to = avSymbol.substring(3, 6);
    url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
  }

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json["Note"] || json["Information"]) {
      console.warn(`AlphaVantage rate-limited: ${json["Note"] || json["Information"]}`);
      return null;
    }
    const rateData = json["Realtime Currency Exchange Rate"];
    if (!rateData) return null;
    const price = toNumber(rateData["5. Exchange Rate"]);
    return price != null ? { price, provider: "alphavantage" } : null;
  } catch (e) {
    console.error("AlphaVantage price error:", e);
    return null;
  }
}

async function fetchCandlesAlphaVantage(symbol: string, tf: string, apiKey: string): Promise<CandleResult | null> {
  const avSymbol = AV_SYMBOL_MAP[symbol];
  if (!avSymbol || !apiKey) return null;

  const isCrypto = symbol.includes("BTC") || symbol.includes("ETH");
  const interval = AV_INTERVAL_MAP[tf] || "60min";

  let url: string;
  if (isCrypto) {
    const base = avSymbol.replace("USD", "");
    url = `https://www.alphavantage.co/query?function=CRYPTO_INTRADAY&symbol=${base}&market=USD&interval=${interval}&outputsize=full&apikey=${apiKey}`;
  } else {
    const from = avSymbol.substring(0, 3);
    const to = avSymbol.substring(3, 6);
    url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=${interval}&outputsize=full&apikey=${apiKey}`;
  }

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json["Note"] || json["Information"]) {
      console.warn(`AlphaVantage candles rate-limited: ${json["Note"] || json["Information"]}`);
      return null;
    }

    const tsKey = Object.keys(json).find(k => k.startsWith("Time Series"));
    if (!tsKey) return null;

    const series = json[tsKey];
    const entries = Object.entries(series).slice(0, 120);

    const candles = entries.map(([dt, v]: [string, any]) => ({
      datetime: dt,
      open: toNumber(v["1. open"]) || 0,
      high: toNumber(v["2. high"]) || 0,
      low: toNumber(v["3. low"]) || 0,
      close: toNumber(v["4. close"]) || 0,
      volume: toNumber(v["5. volume"] || v["6. volume"]) || 0,
    })).reverse();

    return candles.length > 0 ? { candles, provider: "alphavantage" } : null;
  } catch (e) {
    console.error("AlphaVantage candles error:", e);
    return null;
  }
}

// --- Finnhub ---
type FinnhubMarket = "forex" | "crypto";

function getFinnhubMarket(symbol: string): FinnhubMarket | null {
  const fhSymbol = FH_SYMBOL_MAP[symbol] || "";
  if (fhSymbol.startsWith("OANDA:")) return "forex";
  if (fhSymbol.startsWith("BINANCE:")) return "crypto";
  return null;
}

function aggregateCandlesTo4H(candles: any[]): any[] {
  if (!candles.length) return [];
  const bucketMs = 4 * 60 * 60 * 1000;
  const buckets = new Map<number, any[]>();

  for (const candle of candles) {
    const ts = new Date(candle.datetime).getTime();
    if (!Number.isFinite(ts)) continue;
    const bucketStart = Math.floor(ts / bucketMs) * bucketMs;
    if (!buckets.has(bucketStart)) buckets.set(bucketStart, []);
    buckets.get(bucketStart)!.push(candle);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucketStart, list]) => {
      const sorted = list.sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
      return {
        datetime: new Date(bucketStart).toISOString(),
        open: sorted[0].open,
        high: Math.max(...sorted.map((c) => c.high)),
        low: Math.min(...sorted.map((c) => c.low)),
        close: sorted[sorted.length - 1].close,
        volume: sorted.reduce((sum, c) => sum + (toNumber(c.volume) || 0), 0),
      };
    });
}

async function requestDeriv(payload: Record<string, unknown>, _preferredAppId?: string): Promise<any | null> {
  const result = await new Promise<any | null>((resolve) => {
    const ws = new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
    const timeout = setTimeout(() => {
        try { ws.close(); } catch {}
        resolve(null);
      }, 7000);

      ws.onopen = () => {
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          clearTimeout(timeout);
          try { ws.close(); } catch {}
          if (data?.error) {
            resolve(null);
            return;
          }
          resolve(data);
        } catch {
          clearTimeout(timeout);
          try { ws.close(); } catch {}
          resolve(null);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        try { ws.close(); } catch {}
        resolve(null);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
      };
    });

  return result;
}

async function fetchPriceDeriv(symbol: string, appId: string): Promise<PriceResult | null> {
  const derivSymbol = DERIV_SYMBOL_MAP[symbol];
  if (!derivSymbol) return null;

  const response = await requestDeriv({
    ticks_history: derivSymbol,
    count: 1,
    end: "latest",
    style: "ticks",
  }, appId);

  const price = toNumber(response?.history?.prices?.[0]);
  return price != null ? { price, provider: "deriv" } : null;
}

async function fetchCandlesDeriv(symbol: string, tf: string, appId: string): Promise<CandleResult | null> {
  const derivSymbol = DERIV_SYMBOL_MAP[symbol];
  if (!derivSymbol) return null;

  const response = await requestDeriv({
    ticks_history: derivSymbol,
    style: "candles",
    granularity: 3600,
    count: 240,
    end: "latest",
  }, appId);

  const baseCandles = Array.isArray(response?.candles)
    ? response.candles.map((c: any) => ({
        datetime: new Date(Number(c.epoch) * 1000).toISOString(),
        open: toNumber(c.open) || 0,
        high: toNumber(c.high) || 0,
        low: toNumber(c.low) || 0,
        close: toNumber(c.close) || 0,
        volume: toNumber(c.volume) || 0,
      }))
    : [];

  if (!baseCandles.length) return null;
  const candles = tf === "4h" ? aggregateCandlesTo4H(baseCandles) : baseCandles;
  return candles.length ? { candles, provider: "deriv" } : null;
}

async function fetchPriceFinnhub(symbol: string, apiKey: string): Promise<PriceResult | null> {
  const fhSymbol = FH_SYMBOL_MAP[symbol];
  const market = getFinnhubMarket(symbol);
  if (!fhSymbol || !apiKey || !market) return null;

  try {
    // 1) Fast path: quote endpoint (works for many symbols)
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(fhSymbol)}&token=${apiKey}`;
    const quoteRes = await fetch(quoteUrl);
    if (quoteRes.status !== 429) {
      const quoteJson = await quoteRes.json();
      const quotePrice = toNumber(quoteJson?.c);
      if (quotePrice != null && quotePrice > 0) {
        return { price: quotePrice, provider: "finnhub" };
      }
    } else {
      console.warn("Finnhub rate-limited");
      return null;
    }

    // 2) Fallback: derive latest price from candle close
    const now = Math.floor(Date.now() / 1000);
    const from = now - 24 * 3600;
    const candleUrl = `https://finnhub.io/api/v1/${market}/candle?symbol=${encodeURIComponent(fhSymbol)}&resolution=60&from=${from}&to=${now}&token=${apiKey}`;
    const candleRes = await fetch(candleUrl);
    if (candleRes.status === 429) {
      console.warn("Finnhub candles rate-limited while resolving price");
      return null;
    }

    const candleJson = await candleRes.json();
    if (candleJson?.s !== "ok" || !Array.isArray(candleJson?.c) || candleJson.c.length === 0) {
      return null;
    }

    const latestClose = toNumber(candleJson.c[candleJson.c.length - 1]);
    return latestClose != null && latestClose > 0
      ? { price: latestClose, provider: "finnhub" }
      : null;
  } catch (e) {
    console.error("Finnhub price error:", e);
    return null;
  }
}

async function fetchCandlesFinnhub(symbol: string, tf: string, apiKey: string): Promise<CandleResult | null> {
  const fhSymbol = FH_SYMBOL_MAP[symbol];
  const market = getFinnhubMarket(symbol);
  if (!fhSymbol || !apiKey || !market) return null;

  // Finnhub supports 1, 5, 15, 30, 60, D, W, M. Use 60 and aggregate to 4h.
  const resolution = "60";
  const now = Math.floor(Date.now() / 1000);
  const from = now - 14 * 24 * 3600; // 14 days hourly history

  try {
    const url = `https://finnhub.io/api/v1/${market}/candle?symbol=${encodeURIComponent(fhSymbol)}&resolution=${resolution}&from=${from}&to=${now}&token=${apiKey}`;
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn("Finnhub candles rate-limited");
      return null;
    }

    const json = await res.json();
    if (json?.s !== "ok" || !Array.isArray(json?.t) || !Array.isArray(json?.c) || json.c.length === 0) {
      return null;
    }

    const candles1h = json.t.map((t: number, i: number) => ({
      datetime: new Date(t * 1000).toISOString(),
      open: toNumber(json.o?.[i]) || 0,
      high: toNumber(json.h?.[i]) || 0,
      low: toNumber(json.l?.[i]) || 0,
      close: toNumber(json.c?.[i]) || 0,
      volume: toNumber(json.v?.[i]) || 0,
    }));

    const candles = tf === "4h" ? aggregateCandlesTo4H(candles1h) : candles1h;
    return candles.length > 0 ? { candles, provider: "finnhub" } : null;
  } catch (e) {
    console.error("Finnhub candles error:", e);
    return null;
  }
}

// ============ FALLBACK CHAIN ============

async function fetchPriceWithFallback(
  symbol: string,
  providerSymbol: string,
  keys: { td: string; av: string; fh: string; derivAppId: string }
): Promise<PriceResult | null> {
  // 1. TwelveData
  if (keys.td) {
    const result = await fetchPriceTwelveData(providerSymbol, keys.td);
    if (result) return result;
  }
  // 2. AlphaVantage
  if (keys.av) {
    const result = await fetchPriceAlphaVantage(symbol, keys.av);
    if (result) return result;
  }
  // 3. Finnhub
  if (keys.fh) {
    const result = await fetchPriceFinnhub(symbol, keys.fh);
    if (result) return result;
  }
  // 4. Deriv
  const derivResult = await fetchPriceDeriv(symbol, keys.derivAppId);
  if (derivResult) return derivResult;

  return null;
}

async function fetchCandlesWithFallback(
  symbol: string,
  providerSymbol: string,
  tf: string,
  keys: { td: string; av: string; fh: string; derivAppId: string }
): Promise<CandleResult | null> {
  if (keys.td) {
    const result = await fetchCandlesTwelveData(providerSymbol, tf, keys.td);
    if (result) return result;
  }
  if (keys.av) {
    const result = await fetchCandlesAlphaVantage(symbol, tf, keys.av);
    if (result) return result;
  }
  if (keys.fh) {
    const result = await fetchCandlesFinnhub(symbol, tf, keys.fh);
    if (result) return result;
  }

  const derivResult = await fetchCandlesDeriv(symbol, tf, keys.derivAppId);
  if (derivResult) return derivResult;

  return null;
}

// ============ MAIN ============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const tdApiKey = Deno.env.get("TWELVE_DATA_API_KEY") ?? "";
  const avApiKey = Deno.env.get("ALPHAVANTAGE_API_KEY") ?? "";
  const fhApiKey = Deno.env.get("FINNHUB_API_KEY") ?? "";
  const fcsApiKey = Deno.env.get("FCS_API_KEY") ?? "";
  const derivAppId = Deno.env.get("DERIV_APP_ID") ?? "1089";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const keys = { td: tdApiKey, av: avApiKey, fh: fhApiKey, derivAppId };

  if (!tdApiKey && !avApiKey && !fhApiKey && !derivAppId) {
    return new Response(
      JSON.stringify({ error: "No market data providers configured" }),
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

    // 1. Fetch price with fallback
    const priceResult = await fetchPriceWithFallback(symbol, asset.provider_symbol, keys);
    const price = priceResult?.price ?? null;
    const priceProvider = priceResult?.provider ?? "none";

    if (price != null) {
      await supabase.from("market_quotes").insert({ asset_id: asset.id, price });
    }

    console.log(`Price for ${symbol}: ${price} (via ${priceProvider})`);

    // 2. Fetch candles with fallback
    let candlesFetched = 0;
    let latestIndicators: any = null;
    let allCandles1h: any[] = [];
    let candleProvider = "none";

    for (const tf of TIMEFRAMES) {
      try {
        const candleResult = await fetchCandlesWithFallback(symbol, asset.provider_symbol, tf, keys);
        if (!candleResult) {
          console.warn(`No candle data for ${symbol} ${tf} from any provider`);
          continue;
        }

        candleProvider = candleResult.provider;
        const candles = candleResult.candles;

        const candleRows = candles.map((c: any) => ({
          asset_id: asset.id,
          timeframe: tf,
          candle_time: new Date(c.datetime).toISOString(),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          provider: candleProvider,
        }));

        await supabase
          .from("market_candles")
          .upsert(candleRows, { onConflict: "asset_id,timeframe,candle_time" });

        candlesFetched += candleRows.length;

        if (tf === "1h") allCandles1h = candles;

        const closes = candles.map((c: any) => c.close);
        const ema20 = calculateEMA(closes, 20);
        const ema50 = calculateEMA(closes, 50);
        const rsi14 = calculateRSI(closes, 14);
        const atr14 = calculateATR(candles, 14);
        const { macd, signal: macdSignal } = calculateMACD(closes);
        const trend = detectTrend(ema20, ema50, rsi14);

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

    let dayLow: number | null = null;
    let dayHigh: number | null = null;
    let h4High: number | null = null;
    let h4Low: number | null = null;

    if (allCandles1h.length > 0) {
      const last24 = allCandles1h.slice(-24);
      dayLow = Math.min(...last24.map((c: any) => c.low));
      dayHigh = Math.max(...last24.map((c: any) => c.high));
      const last4 = allCandles1h.slice(-4);
      h4High = Math.max(...last4.map((c: any) => c.high));
      h4Low = Math.min(...last4.map((c: any) => c.low));
    }

    const currencies = SYMBOL_CURRENCIES[symbol] || ["USD"];
    const newsEvent = await fetchNextHighImpactEvent(fcsApiKey, currencies);

    let minutesToNews: number | null = null;
    if (newsEvent) {
      minutesToNews = (newsEvent.time.getTime() - nowUtc.getTime()) / 60000;
    }

    const s1 = latestIndicators?.support1 ?? dayLow ?? 0;
    const r1 = latestIndicators?.resistance1 ?? dayHigh ?? 0;
    const tip = price != null
      ? buildMarketTip(price, s1, r1, latestIndicators?.atr14, latestIndicators?.trend || "neutral", minutesToNews)
      : "Awaiting price data.";

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

    // Trigger AI signal generation after fresh data ingestion
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const aiRes = await fetch(`${supabaseUrl}/functions/v1/generate-ai-signal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ symbol, timeframe: "1h" }),
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        console.log(`AI signal generated for ${symbol}: ${aiData?.signal?.signal} (confidence: ${aiData?.signal?.confidence})`);
      } else {
        console.warn(`AI signal generation failed for ${symbol}: ${aiRes.status}`);
      }
    } catch (aiErr: any) {
      console.warn(`AI signal trigger error for ${symbol}:`, aiErr.message);
    }

    console.log(`Done: ${symbol} - ${candlesFetched} candles (via ${candleProvider}), price=${price} (via ${priceProvider}), session=${currentSession}`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        price_saved: price != null,
        price_provider: priceProvider,
        candles_fetched: candlesFetched,
        candle_provider: candleProvider,
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
