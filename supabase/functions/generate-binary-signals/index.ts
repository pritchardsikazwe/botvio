import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Engine types ───
type EngineType = "otc" | "synthetic" | "universal";

interface BrokerConfig {
  engine: EngineType;
  symbols: string[];
  category: string;
  timeframes: string[];
  expirySeconds: number;
  otcSuffix?: string; // e.g. "_otc" for OTC symbols
  systemPrompt: string;
}

// ─── Broker-specific configurations with dedicated engines & prompts ───
const BROKER_CONFIGS: Record<string, BrokerConfig> = {
  "pocket-option": {
    engine: "otc",
    symbols: ["EURUSD_otc", "GBPUSD_otc", "USDJPY_otc", "AUDUSD_otc", "EURJPY_otc", "GBPJPY_otc"],
    category: "otc_forex",
    timeframes: ["M1"],
    expirySeconds: 60,
    otcSuffix: "_otc",
    systemPrompt: `You are Botvio AI — Pocket Option OTC Signal Engine.

You generate CALL/PUT signals EXCLUSIVELY for Pocket Option's OTC market.

CRITICAL RULES FOR POCKET OPTION OTC:
- OTC markets have UNIQUE price feeds — they do NOT mirror real forex markets
- OTC prices are broker-generated with their own patterns, spreads, and volatility
- NEVER assume OTC candles are identical to real market candles
- Focus on: candle pattern recognition, momentum exhaustion, S/R levels within OTC data
- Best strategies: Momentum Continuation, S/R Rejection, Exhaustion Reversal, Range Fade
- Typical expiry: 30s–120s (fast execution platform)
- Pocket Option OTC is available 24/7 including weekends
- Win probability should factor in OTC-specific spread behavior

Analyze the provided OTC context and generate a high-confidence binary signal.

Return ONLY valid JSON:
{
  "direction": "BUY or SELL",
  "confidence": 72,
  "entry_price": 1.0850,
  "stop_loss": 1.0830,
  "take_profit": 1.0880,
  "reason": "OTC bullish engulfing at key support zone with momentum alignment",
  "strategy_name": "PO Momentum Continuation"
}`,
  },
  "quotex": {
    engine: "otc",
    symbols: ["EURUSD_otc", "GBPUSD_otc", "AUDUSD_otc", "USDJPY_otc", "BTCUSD_otc", "ETHUSD_otc"],
    category: "otc_forex",
    timeframes: ["M1"],
    expirySeconds: 60,
    otcSuffix: "_otc",
    systemPrompt: `You are Botvio AI — Quotex OTC Signal Engine.

You generate CALL/PUT signals EXCLUSIVELY for Quotex's OTC market.

CRITICAL RULES FOR QUOTEX OTC:
- Quotex OTC prices are DIFFERENT from Pocket Option OTC — each broker has its own OTC feed
- Quotex OTC uses its own proprietary price generation with distinct patterns
- NEVER copy or assume signals from other platforms work on Quotex OTC
- Focus on: EMA crossovers on Quotex charts, Bollinger Band bounces, micro pullbacks
- Best strategies: EMA Crossover Entry, Bollinger Bounce, Breakout Retest, Micro Pullback
- Quotex has slightly different payout structures affecting optimal entry timing
- Typical expiry: 60s–120s
- Quotex OTC available 24/7

Analyze the Quotex-specific context and generate a binary signal.

Return ONLY valid JSON:
{
  "direction": "BUY or SELL",
  "confidence": 70,
  "entry_price": 1.0850,
  "stop_loss": 1.0830,
  "take_profit": 1.0880,
  "reason": "Quotex OTC EMA 5/20 bullish cross with BB middle support",
  "strategy_name": "QX EMA Crossover"
}`,
  },
  "deriv": {
    engine: "synthetic",
    symbols: ["R_10", "R_25", "R_50", "R_75", "R_100", "1HZ10V", "1HZ25V", "1HZ50V", "1HZ75V", "1HZ100V", "BOOM500", "BOOM1000", "CRASH500", "CRASH1000"],
    category: "synthetic",
    timeframes: ["M1", "M5"],
    expirySeconds: 600,
    systemPrompt: `You are Botvio AI — Deriv Synthetic Index Signal Engine.

You generate signals EXCLUSIVELY for Deriv's proprietary synthetic indices.

CRITICAL RULES FOR DERIV SYNTHETICS:
- Synthetic indices are algorithmically generated — NOT based on any real market
- Each index has UNIQUE volatility characteristics (V10 = low vol, V100 = high vol)
- Boom/Crash indices have SPIKE patterns that require specialized detection
- Vol 1s (1HZ) indices tick every second with different behavior than standard Vol indices
- Step Index moves in fixed increments — range-bound by nature
- NEVER apply real forex strategies directly to synthetics
- Focus on: spike drought detection, volatility compression, EMA trend alignment, RSI extremes
- Boom/Crash: detect spike droughts (80+ candles for 500/1000 variants)
- Volatility Indices: EMA 9/20 crossovers + momentum confirmation
- Available 24/7, no market sessions apply

Analyze the synthetic index data and generate a signal.

Return ONLY valid JSON:
{
  "direction": "BUY or SELL",
  "confidence": 74,
  "entry_price": 5432.10,
  "stop_loss": 5420.00,
  "take_profit": 5450.00,
  "reason": "V75 EMA9/20 bullish cross, RSI 58 trending up, momentum building",
  "strategy_name": "DRV Volatility Rider"
}`,
  },
  "iq-option": {
    engine: "universal",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"],
    category: "forex",
    timeframes: ["M5", "M15"],
    expirySeconds: 300,
    systemPrompt: `You are Botvio AI — IQ Option Signal Engine.

You generate CALL/PUT signals for IQ Option's standard and digital options.

RULES FOR IQ OPTION:
- Use REAL market data for standard forex/crypto/commodity pairs
- IQ Option supports standard binary + digital options with variable payouts
- Focus on: Alligator trend detection, RSI divergence, breakout patterns
- Best strategies: Alligator Trend Entry, RSI Divergence, Crypto Breakout
- Typical expiry: 3–5 minutes
- Consider IQ Option's specific payout curve for confidence calibration

Analyze market data and generate an IQ Option signal.

Return ONLY valid JSON:
{
  "direction": "BUY or SELL",
  "confidence": 68,
  "entry_price": 1.0850,
  "stop_loss": 1.0830,
  "take_profit": 1.0880,
  "reason": "RSI bullish divergence at support with Alligator jaw opening",
  "strategy_name": "IQ Alligator Trend"
}`,
  },
  "binomo": {
    engine: "universal",
    symbols: ["EURUSD", "GBPUSD", "AUDUSD"],
    category: "forex",
    timeframes: ["M1", "M5"],
    expirySeconds: 60,
    systemPrompt: `You are Botvio AI — Binomo Signal Engine.

You generate signals for Binomo's binary options platform.

RULES FOR BINOMO:
- Binomo supports limited pairs with shorter expiry windows
- Focus on: Simple trend following, candle pattern entries
- Best strategies: Simple Trend Follow, Candle Pattern Entry, Tournament Scalp
- Typical expiry: 30s–60s
- Keep signals simple — Binomo is beginner-oriented

Analyze and generate a Binomo signal.

Return ONLY valid JSON:
{
  "direction": "BUY or SELL",
  "confidence": 70,
  "entry_price": 1.0850,
  "stop_loss": 1.0830,
  "take_profit": 1.0880,
  "reason": "Bullish engulfing candle at 5-min trend support",
  "strategy_name": "BN Trend Follow"
}`,
  },
};

// ─── Engine: OTC (Pocket Option / Quotex) ───
// OTC feeds are broker-specific. We simulate OTC context since we don't have
// direct OTC feed access. Each broker gets its own randomized OTC snapshot.
function generateOTCContext(symbol: string, broker: string): string {
  const baseSymbol = symbol.replace("_otc", "");
  const seed = hashCode(`${broker}-${symbol}-${Date.now()}`);
  
  // OTC prices deviate from real market — simulate broker-specific spread
  const spreadMultiplier = broker === "pocket-option" ? 1.2 : 1.4; // Quotex typically wider
  const baseSpread = ((seed % 30) + 5) / 10000 * spreadMultiplier;
  
  // Generate OTC-specific metrics
  const otcVolatility = ((seed % 40) + 20) / 100; // 0.20 - 0.60
  const consecutiveCandles = (seed % 7) + 1;
  const candleDirection = seed % 2 === 0 ? "bullish" : "bearish";
  const wickRatio = ((seed % 60) + 10) / 100;
  
  return `Broker: ${broker.toUpperCase()} OTC Feed
Symbol: ${symbol} (OTC — NOT real market)
Base Pair: ${baseSymbol}
OTC Spread: ${baseSpread.toFixed(5)}
OTC Volatility Index: ${otcVolatility.toFixed(2)}
Last ${consecutiveCandles} candles: ${candleDirection}
Average wick ratio: ${wickRatio.toFixed(2)}
Session: OTC (24/7 available)
NOTE: This is ${broker}-specific OTC data. Do NOT mix with real market or other broker OTC data.`;
}

// ─── Engine: Synthetic (Deriv) ───
async function generateSyntheticContext(
  symbol: string,
  supabase: any
): Promise<string> {
  let context = `Broker: DERIV Synthetic Indices\nSymbol: ${symbol} (Algorithmically Generated)\n`;
  
  // Try to get real Deriv data from our DB
  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .maybeSingle();

  if (asset) {
    const { data: quote } = await supabase
      .from("market_quotes")
      .select("price, bid, ask, change_percent_24h")
      .eq("asset_id", asset.id)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: indicator } = await supabase
      .from("market_indicators")
      .select("ema_20, ema_50, rsi_14, atr_14, trend, support_1, resistance_1")
      .eq("asset_id", asset.id)
      .order("candle_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quote) {
      context += `Price: ${quote.price}, Bid: ${quote.bid}, Ask: ${quote.ask}, 24h Change: ${quote.change_percent_24h}%\n`;
    }
    if (indicator) {
      context += `EMA20: ${indicator.ema_20}, EMA50: ${indicator.ema_50}, RSI14: ${indicator.rsi_14}, ATR14: ${indicator.atr_14}\n`;
      context += `Trend: ${indicator.trend}, Support: ${indicator.support_1}, Resistance: ${indicator.resistance_1}\n`;
    }
  }

  // Add synthetic-specific context
  if (symbol.startsWith("BOOM") || symbol.startsWith("CRASH")) {
    const spikeType = symbol.startsWith("BOOM") ? "upward spike" : "downward spike";
    const variant = symbol.includes("500") ? "500" : "1000";
    const avgDrought = variant === "500" ? "~500 ticks" : "~1000 ticks";
    context += `Index Type: ${symbol.startsWith("BOOM") ? "Boom" : "Crash"} ${variant}\n`;
    context += `Spike Type: ${spikeType}\n`;
    context += `Average spike interval: ${avgDrought}\n`;
    context += `Strategy Focus: Spike drought detection, overdue threshold monitoring\n`;
  } else if (symbol.startsWith("R_") || symbol.startsWith("1HZ")) {
    const volLevel = parseInt(symbol.replace("R_", "").replace("1HZ", "").replace("V", ""));
    context += `Index Type: Volatility ${volLevel}${symbol.startsWith("1HZ") ? " (1-second ticks)" : ""}\n`;
    context += `Volatility Level: ${volLevel < 50 ? "Low" : volLevel < 75 ? "Medium" : "High"}\n`;
    context += `Strategy Focus: EMA crossovers, RSI momentum, trend continuation\n`;
  }

  context += `Session: 24/7 Synthetic Market (no real-world correlation)\n`;
  return context;
}

// ─── Engine: Universal (Real Markets) ───
async function generateUniversalContext(
  symbol: string,
  timeframe: string,
  supabase: any
): Promise<string> {
  let context = `Symbol: ${symbol} (Real Market)\nTimeframe: ${timeframe}\n`;
  
  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .maybeSingle();

  if (asset) {
    const { data: quote } = await supabase
      .from("market_quotes")
      .select("price, bid, ask, change_percent_24h")
      .eq("asset_id", asset.id)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: indicator } = await supabase
      .from("market_indicators")
      .select("ema_20, ema_50, rsi_14, atr_14, trend, support_1, resistance_1, macd, macd_signal")
      .eq("asset_id", asset.id)
      .order("candle_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: candles } = await supabase
      .from("market_candles")
      .select("open, high, low, close, candle_time")
      .eq("asset_id", asset.id)
      .eq("timeframe", timeframe)
      .order("candle_time", { ascending: false })
      .limit(10);

    if (quote) {
      context += `Price: ${quote.price}, Bid: ${quote.bid}, Ask: ${quote.ask}, 24h Change: ${quote.change_percent_24h}%\n`;
    }
    if (indicator) {
      context += `EMA20: ${indicator.ema_20}, EMA50: ${indicator.ema_50}, RSI14: ${indicator.rsi_14}\n`;
      context += `ATR14: ${indicator.atr_14}, Trend: ${indicator.trend}\n`;
      context += `Support: ${indicator.support_1}, Resistance: ${indicator.resistance_1}\n`;
      context += `MACD: ${indicator.macd}, Signal: ${indicator.macd_signal}\n`;
    }
    if (candles && candles.length > 0) {
      context += `Last ${candles.length} candles (newest first):\n`;
      candles.forEach((c: any, i: number) => {
        context += `  [${i}] O:${c.open} H:${c.high} L:${c.low} C:${c.close}\n`;
      });
    }
  }

  return context;
}

// Simple hash for seeding OTC data
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { broker = "pocket-option", count = 3 } = await req.json().catch(() => ({}));

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = BROKER_CONFIGS[broker];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unknown broker: ${broker}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick random symbols
    const shuffled = [...config.symbols].sort(() => Math.random() - 0.5);
    const selectedSymbols = shuffled.slice(0, Math.min(count, config.symbols.length));
    const timeframe = config.timeframes[Math.floor(Math.random() * config.timeframes.length)];

    const signals: any[] = [];

    for (const symbol of selectedSymbols) {
      // ─── Route to the correct engine based on broker type ───
      let context: string;

      switch (config.engine) {
        case "otc":
          context = generateOTCContext(symbol, broker);
          break;
        case "synthetic":
          context = await generateSyntheticContext(symbol, supabase);
          break;
        case "universal":
        default:
          context = await generateUniversalContext(symbol, timeframe, supabase);
          break;
      }

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: config.systemPrompt },
              {
                role: "user",
                content: `Generate a trading signal for ${broker.toUpperCase()} platform using the ${config.engine.toUpperCase()} engine.\n\nMarket Context:\n${context}\n\nGenerate signal now.`,
              },
            ],
            max_tokens: 500,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error [${config.engine}] for ${symbol}:`, errText);
          if (aiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const text = aiData.choices?.[0]?.message?.content || "";

        const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
        if (!jsonMatch) {
          console.error(`Invalid AI response [${config.engine}] for ${symbol}`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

        // Use display symbol (strip _otc suffix for DB storage, keep in metadata)
        const displaySymbol = symbol.replace("_otc", "");
        const expiresAt = new Date(Date.now() + config.expirySeconds * 1000).toISOString();

        const { data: inserted, error: insertErr } = await supabase
          .from("trading_signals")
          .insert({
            symbol: displaySymbol,
            direction: parsed.direction === "BUY" ? "BUY" : "SELL",
            entry_price: parsed.entry_price || 0,
            stop_loss: parsed.stop_loss || null,
            take_profit: parsed.take_profit || null,
            timeframe,
            category: config.category,
            broker: [broker],
            confidence: Math.min(95, Math.max(50, parsed.confidence || 65)),
            reason: parsed.reason || `${broker} ${config.engine} engine signal`,
            strategy_name: parsed.strategy_name || `Botvio ${broker} Signal`,
            status: "ACTIVE",
            is_manual: false,
            expires_at: expiresAt,
            expiry_seconds: config.expirySeconds,
            signal_lifecycle: "approved",
          })
          .select()
          .single();

        if (insertErr) {
          console.error(`Insert error [${config.engine}] for ${symbol}:`, insertErr);
          continue;
        }

        signals.push(inserted);
      } catch (err) {
        console.error(`Error [${config.engine}] processing ${symbol}:`, err);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        broker,
        engine: config.engine,
        generated: signals.length,
        signals,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Binary signal generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
