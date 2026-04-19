import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPOT_SYMBOLS = [
  { symbol: "BTCUSDT", display: "BTCUSD", category: "crypto" },
  { symbol: "ETHUSDT", display: "ETHUSD", category: "crypto" },
  { symbol: "SOLUSDT", display: "SOLUSD", category: "crypto" },
  { symbol: "BNBUSDT", display: "BNBUSD", category: "crypto" },
  { symbol: "XRPUSDT", display: "XRPUSD", category: "crypto" },
  { symbol: "ADAUSDT", display: "ADAUSD", category: "crypto" },
  { symbol: "DOGEUSDT", display: "DOGEUSD", category: "crypto" },
  { symbol: "DOTUSDT", display: "DOTUSD", category: "crypto" },
];

const FUTURES_SYMBOLS = [
  { symbol: "BTCUSDT", display: "BTC/USDT", category: "futures" },
  { symbol: "ETHUSDT", display: "ETH/USDT", category: "futures" },
  { symbol: "SOLUSDT", display: "SOL/USDT", category: "futures" },
  { symbol: "BNBUSDT", display: "BNB/USDT", category: "futures" },
  { symbol: "XRPUSDT", display: "XRP/USDT", category: "futures" },
  { symbol: "DOGEUSDT", display: "DOGE/USDT", category: "futures" },
];

const SCALP_SYMBOLS = [
  { symbol: "BTCUSDT", display: "BTC/USDT", category: "scalp" },
  { symbol: "ETHUSDT", display: "ETH/USDT", category: "scalp" },
  { symbol: "SOLUSDT", display: "SOL/USDT", category: "scalp" },
  { symbol: "BNBUSDT", display: "BNB/USDT", category: "scalp" },
  { symbol: "XRPUSDT", display: "XRP/USDT", category: "scalp" },
  { symbol: "DOGEUSDT", display: "DOGE/USDT", category: "scalp" },
];

const SPOT_PROMPT = `You are Botvio AI Crypto Analyst specializing in Binance spot trading.

Your task: generate a structured crypto trading signal based on recent kline (candlestick) data.

Rules:
- You are not a financial advisor. Do not promise profits.
- Use only the provided market data (klines with OHLCV).
- Prefer "hold" or "avoid" when no clean setup exists.
- Confidence must be 0 to 100.
- Risk/reward should usually be at least 1.5 for buy or sell signals.
- Consider volume, trend direction, support/resistance from recent candles.

Return ONLY valid JSON:
{
  "signal": "buy|sell|hold|avoid",
  "confidence": 0,
  "entry_price": 0,
  "stop_loss": 0,
  "take_profit": 0,
  "risk_reward": 0,
  "reason": "Short analysis summary",
  "strategy_name": "Binance AI Signal"
}`;

const FUTURES_PROMPT = `You are Botvio AI Futures Analyst specializing in Binance perpetual futures.

Your task: generate a structured FUTURES trading signal with leverage recommendation.

Rules:
- You are not a financial advisor. Do not promise profits.
- Use only the provided market data (klines with OHLCV).
- Signal can be "long", "short", "hold", or "avoid".
- Confidence must be 0 to 100.
- Include leverage suggestion between x3 and x20 based on volatility.
- Lower leverage for higher volatility. Higher leverage for strong clear trends.
- Risk/reward should usually be at least 2.0 for futures.
- Consider trend, volume, support/resistance, and volatility.

Return ONLY valid JSON:
{
  "signal": "long|short|hold|avoid",
  "confidence": 0,
  "leverage": 10,
  "entry_price": 0,
  "stop_loss": 0,
  "take_profit": 0,
  "risk_reward": 0,
  "reason": "Short analysis summary. Include: Leverage: x10",
  "strategy_name": "Binance Futures AI Signal"
}`;

// ── Scalping detector: pure technical (1m + 5m). No AI for speed. ─────
type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };

function ema(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}

function detectScalp(c1m: Candle[], c5m: Candle[]): {
  side: "BUY" | "SELL";
  confidence: number;
  entry: number;
  sl: number;
  tp: number;
  reason: string;
} | null {
  if (c1m.length < 25 || c5m.length < 25) return null;

  const closes5 = c5m.map((c) => c.close);
  const ema9_5 = ema(closes5, 9);
  const ema21_5 = ema(closes5, 21);
  const trend5 =
    ema9_5.at(-1)! > ema21_5.at(-1)! ? "up" : ema9_5.at(-1)! < ema21_5.at(-1)! ? "down" : "flat";

  const lookback = c1m.slice(-16, -1);
  const last = c1m.at(-2)!;
  if (!last || lookback.length < 10) return null;
  const recentHigh = Math.max(...lookback.map((c) => c.high));
  const recentLow = Math.min(...lookback.map((c) => c.low));

  const ranges = c1m.slice(-14).map((c) => c.high - c.low);
  const atr = ranges.reduce((s, r) => s + r, 0) / Math.max(ranges.length, 1);
  const slDist = Math.max(atr * 0.9, last.close * 0.0008);

  const avgVol = lookback.reduce((s, c) => s + c.volume, 0) / lookback.length;
  const volBoost = last.volume > avgVol * 1.2;

  if (last.close > recentHigh && trend5 !== "down") {
    const conf = Math.min(70 + (volBoost ? 10 : 0) + (trend5 === "up" ? 8 : 0), 92);
    return {
      side: "BUY",
      confidence: conf,
      entry: last.close,
      sl: +(last.close - slDist).toFixed(8),
      tp: +(last.close + slDist * 1.8).toFixed(8),
      reason: `1m breakout above 15-bar high (${recentHigh.toFixed(4)})${volBoost ? ", volume surge" : ""}, 5m trend ${trend5}.`,
    };
  }
  if (last.close < recentLow && trend5 !== "up") {
    const conf = Math.min(70 + (volBoost ? 10 : 0) + (trend5 === "down" ? 8 : 0), 92);
    return {
      side: "SELL",
      confidence: conf,
      entry: last.close,
      sl: +(last.close + slDist).toFixed(8),
      tp: +(last.close - slDist * 1.8).toFixed(8),
      reason: `1m breakdown below 15-bar low (${recentLow.toFixed(4)})${volBoost ? ", volume surge" : ""}, 5m trend ${trend5}.`,
    };
  }
  return null;
}

async function fetchBinanceKlines(symbol: string, interval = "1h", limit = 30): Promise<any[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const data = await res.json();
  return data.map((k: any[]) => ({
    time: new Date(k[0]).toISOString(),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let signalType = "spot"; // default
    let targetSymbols: string[] | null = null;

    try {
      const body = await req.json();
      if (body.signal_type) signalType = body.signal_type;
      if (body.symbols && Array.isArray(body.symbols)) targetSymbols = body.symbols;
    } catch { /* no body or invalid JSON — use defaults */ }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isFutures = signalType === "futures";
    const isScalp = signalType === "scalp";
    let symbols = isScalp ? SCALP_SYMBOLS : isFutures ? FUTURES_SYMBOLS : SPOT_SYMBOLS;
    const systemPrompt = isFutures ? FUTURES_PROMPT : SPOT_PROMPT;

    if (targetSymbols) {
      symbols = symbols.filter(s => targetSymbols!.includes(s.symbol) || targetSymbols!.includes(s.display));
    }

    // ── SCALP MODE: technical-only, fast loop, 30-min expiry ──
    if (isScalp) {
      const results: any[] = [];
      for (const sym of symbols) {
        try {
          const [c1m, c5m] = await Promise.all([
            fetchBinanceKlines(sym.symbol, "1m", 30),
            fetchBinanceKlines(sym.symbol, "5m", 30),
          ]);
          const sig = detectScalp(c1m, c5m);
          if (!sig) {
            console.log(`Scalp skip ${sym.display}: no breakout`);
            continue;
          }

          const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          const { error: insertErr } = await supabase.from("trading_signals").insert({
            symbol: sym.display,
            direction: sig.side,
            entry_price: sig.entry,
            stop_loss: sig.sl,
            take_profit: sig.tp,
            timeframe: "M1",
            category: "scalp",
            broker: ["binance"],
            confidence: sig.confidence,
            reason: sig.reason,
            is_manual: false,
            status: "ACTIVE",
            strategy_name: "Binance Scalp Robot",
            expires_at: expiresAt,
          });
          if (insertErr) {
            console.error(`Scalp insert failed ${sym.display}:`, insertErr.message);
          } else {
            results.push({ symbol: sym.display, signal: sig.side, confidence: sig.confidence });
            console.log(`Scalp signal: ${sym.display} ${sig.side} (${sig.confidence}%)`);
          }
        } catch (e: any) {
          console.error(`Scalp error ${sym.display}:`, e.message);
        }
      }
      return new Response(
        JSON.stringify({ success: true, signals_posted: results.length, results, mode: "scalp" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    for (const sym of symbols) {
      try {
        const klines = await fetchBinanceKlines(sym.symbol, "1h", 30);
        const currentPrice = klines[klines.length - 1]?.close ?? 0;

        const userPrompt = `Instrument: ${sym.display} (Binance ${isFutures ? "Futures" : "Spot"})
Current price: ${currentPrice}

Recent 1H candles (last 15):
${JSON.stringify(klines.slice(-15), null, 2)}

Generate the ${isFutures ? "futures" : "crypto"} trading signal now.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 1000,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${sym.display}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const text = aiData.choices?.[0]?.message?.content || "";

        const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
        if (!jsonMatch) {
          console.error(`Invalid AI response for ${sym.display}`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        const actionableSignals = isFutures
          ? ["long", "short"]
          : ["buy", "sell"];

        if (actionableSignals.includes(parsed.signal) && parsed.confidence >= 45) {
          const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

          const direction = isFutures
            ? parsed.signal.toUpperCase()
            : parsed.signal.toUpperCase();

          const { error: insertErr } = await supabase.from("trading_signals").insert({
            symbol: sym.display,
            direction,
            entry_price: parsed.entry_price || currentPrice,
            stop_loss: parsed.stop_loss || null,
            take_profit: parsed.take_profit || null,
            timeframe: "H1",
            category: sym.category,
            broker: ["binance"],
            confidence: parsed.confidence,
            reason: parsed.reason || `Binance AI: ${parsed.signal} signal for ${sym.display}`,
            is_manual: false,
            status: "ACTIVE",
            strategy_name: parsed.strategy_name || (isFutures ? "Binance Futures AI Signal" : "Binance AI Signal"),
            expires_at: expiresAt,
          });

          if (insertErr) {
            console.error(`Failed to save signal for ${sym.display}:`, insertErr.message);
          } else {
            results.push({
              symbol: sym.display,
              signal: parsed.signal,
              confidence: parsed.confidence,
              leverage: parsed.leverage || null,
            });
            console.log(`Signal posted: ${sym.display} ${parsed.signal} (${parsed.confidence}%)`);
          }
        } else {
          console.log(`Skipped ${sym.display}: ${parsed.signal} (confidence: ${parsed.confidence})`);
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (symErr: any) {
        console.error(`Error processing ${sym.display}:`, symErr.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, signals_posted: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Binance signal generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
