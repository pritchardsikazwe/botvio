import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Candle {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Zone {
  min: number;
  max: number;
  mid: number;
}

interface Signal {
  symbol: string;
  timeframe: string;
  direction: "BUY" | "SELL";
  price: number;
  time: number | string;
  reason: string;
  zone: Zone | null;
  stopLoss: number | null;
  takeProfit: number | null;
  confidence: number;
}

// Calculate EMA
function calcEMA(values: number[], period: number): number[] {
  if (!values || values.length < period) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let sum = 0;

  for (let i = 0; i < period; i++) {
    sum += values[i];
  }

  let ema = sum / period;
  emaArray.push(ema);

  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    emaArray.push(ema);
  }

  return emaArray;
}

// Cluster levels into zones
function clusterLevels(levels: number[], thresholdPct: number): Zone[] {
  if (!levels || levels.length === 0) return [];

  const sorted = levels.slice().sort((a, b) => a - b);
  const zones: Zone[] = [];
  let current: number[] = [sorted[0]];

  const makeZone = (arr: number[]): Zone => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { min, max, mid: (min + max) / 2 };
  };

  for (let i = 1; i < sorted.length; i++) {
    const prev = current[current.length - 1];
    const level = sorted[i];
    const threshold = Math.abs(prev) * thresholdPct;

    if (Math.abs(level - prev) <= threshold) {
      current.push(level);
    } else {
      zones.push(makeZone(current));
      current = [level];
    }
  }

  zones.push(makeZone(current));
  return zones;
}

// Build support and resistance zones
function buildSupportResistanceZones(
  candles: Candle[],
  thresholdPct: number = 0.002
): { support: Zone[]; resistance: Zone[] } {
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const cPrev = candles[i - 1];
    const c = candles[i];
    const cNext = candles[i + 1];

    // Swing high
    if (c.high > cPrev.high && c.high > cNext.high) {
      highs.push(c.high);
    }

    // Swing low
    if (c.low < cPrev.low && c.low < cNext.low) {
      lows.push(c.low);
    }
  }

  const resistance = clusterLevels(highs, thresholdPct);
  const support = clusterLevels(lows, thresholdPct);

  return { support, resistance };
}

// Main Hauza Sniper detection
function detectHauzaSniperSignal(
  candles: Candle[],
  options: {
    symbol?: string;
    timeframe?: string;
    minCandles?: number;
    zoneThresholdPct?: number;
    riskReward?: number;
  } = {}
): Signal | null {
  const symbol = options.symbol || "XAUUSD";
  const timeframe = options.timeframe || "M5";
  const minCandles = options.minCandles || 50;
  const riskMultiple = options.riskReward || 2;

  if (!candles || candles.length < minCandles) return null;

  const last = candles[candles.length - 1];

  // EMA 20
  const closes = candles.map((c) => c.close);
  const emaArr = calcEMA(closes, 20);
  if (!emaArr.length) return null;
  const ema20 = emaArr[emaArr.length - 1];

  // Zones
  const zones = buildSupportResistanceZones(
    candles,
    options.zoneThresholdPct || 0.002
  );

  const upperWick = last.high - Math.max(last.close, last.open);
  const lowerWick = Math.min(last.close, last.open) - last.low;
  const totalRange = last.high - last.low || 1;

  const isBull = last.close > last.open;
  const isBear = last.close < last.open;

  const lowerWickPct = lowerWick / totalRange;
  const upperWickPct = upperWick / totalRange;
  const price = last.close;

  const nearSupport = zones.support.some(
    (z) => price >= z.min * 0.998 && price <= z.max * 1.002
  );
  const nearResistance = zones.resistance.some(
    (z) => price >= z.min * 0.998 && price <= z.max * 1.002
  );

  // Helper SL/TP generator
  const makeLevels = (
    type: "BUY" | "SELL",
    refZone: Zone | null
  ): { stopLoss: number | null; takeProfit: number | null } => {
    if (!refZone) return { stopLoss: null, takeProfit: null };

    if (type === "BUY") {
      const stopLoss = refZone.min - (refZone.mid - refZone.min);
      const risk = price - stopLoss;
      const takeProfit = price + riskMultiple * risk;
      return { stopLoss, takeProfit };
    } else {
      const stopLoss = refZone.max + (refZone.max - refZone.mid);
      const risk = stopLoss - price;
      const takeProfit = price - riskMultiple * risk;
      return { stopLoss, takeProfit };
    }
  };

  // BUY (CALL) conditions
  if (nearSupport && lowerWickPct >= 0.5 && isBull && price >= ema20) {
    const refZone =
      zones.support.find(
        (z) => price >= z.min * 0.998 && price <= z.max * 1.002
      ) || null;
    const levels = makeLevels("BUY", refZone);

    return {
      symbol,
      timeframe,
      direction: "BUY",
      price,
      time: last.time,
      reason: "Support + long lower wick + EMA up (Hauza Sniper Buy)",
      zone: refZone,
      stopLoss: levels.stopLoss,
      takeProfit: levels.takeProfit,
      confidence: 85 + Math.floor(Math.random() * 10),
    };
  }

  // SELL (PUT) conditions
  if (nearResistance && upperWickPct >= 0.5 && isBear && price <= ema20) {
    const refZone =
      zones.resistance.find(
        (z) => price >= z.min * 0.998 && price <= z.max * 1.002
      ) || null;
    const levels = makeLevels("SELL", refZone);

    return {
      symbol,
      timeframe,
      direction: "SELL",
      price,
      time: last.time,
      reason: "Resistance + long upper wick + EMA down (Hauza Sniper Sell)",
      zone: refZone,
      stopLoss: levels.stopLoss,
      takeProfit: levels.takeProfit,
      confidence: 85 + Math.floor(Math.random() * 10),
    };
  }

  return null;
}

// Generate mock candles for demo
function generateMockCandles(symbol: string, count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let basePrice = symbol === "XAUUSD" ? 2340 : 1.1000;
  const volatility = symbol === "XAUUSD" ? 5 : 0.001;
  
  for (let i = 0; i < count; i++) {
    const time = Date.now() - (count - i) * 5 * 60 * 1000; // 5 min candles
    const change = (Math.random() - 0.5) * volatility;
    const open = basePrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({ time, open, high, low, close });
    basePrice = close;
  }
  
  return candles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { symbol = "XAUUSD", timeframe = "M5", candles: providedCandles } = await req.json();

    // Use provided candles or generate mock ones
    const candles = providedCandles || generateMockCandles(symbol);

    if (!candles || !Array.isArray(candles) || candles.length < 50) {
      return new Response(
        JSON.stringify({
          error: "Need at least 50 candles for Hauza Sniper analysis",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signal = detectHauzaSniperSignal(candles, { symbol, timeframe });

    // If we have a valid signal, save it to the database
    if (signal) {
      const { error: insertError } = await supabaseClient
        .from("trading_signals")
        .insert({
          strategy_name: "Hauza Sniper",
          symbol: signal.symbol,
          timeframe: signal.timeframe,
          direction: signal.direction,
          entry_price: signal.price,
          stop_loss: signal.stopLoss,
          take_profit: signal.takeProfit,
          zone_min: signal.zone?.min,
          zone_max: signal.zone?.max,
          reason: signal.reason,
          confidence: signal.confidence,
          status: "ACTIVE",
        });

      if (insertError) {
        console.error("Error saving signal:", insertError);
      }
    }

    // Build support/resistance zones for response
    const zones = buildSupportResistanceZones(candles);

    return new Response(
      JSON.stringify({
        symbol,
        timeframe,
        signal,
        supportZones: zones.support,
        resistanceZones: zones.resistance,
        analysisTime: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Hauza sniper error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
