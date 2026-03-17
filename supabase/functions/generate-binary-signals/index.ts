import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Broker-specific market configs
const BROKER_MARKETS: Record<string, { symbols: string[]; category: string; timeframes: string[]; expirySeconds: number }> = {
  "pocket-option": {
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "EURJPY", "GBPJPY", "XAUUSD", "BTCUSD"],
    category: "forex",
    timeframes: ["M1", "M5"],
    expirySeconds: 300,
  },
  "quotex": {
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "XAUUSD", "BTCUSD", "ETHUSD"],
    category: "forex",
    timeframes: ["M1", "M5"],
    expirySeconds: 300,
  },
  "deriv": {
    symbols: ["R_10", "R_25", "R_50", "R_75", "R_100", "BOOM500", "CRASH500", "XAUUSD"],
    category: "synthetic",
    timeframes: ["M1", "M5"],
    expirySeconds: 600,
  },
  "iq-option": {
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"],
    category: "forex",
    timeframes: ["M5", "M15"],
    expirySeconds: 300,
  },
  "binomo": {
    symbols: ["EURUSD", "GBPUSD", "AUDUSD"],
    category: "forex",
    timeframes: ["M1", "M5"],
    expirySeconds: 60,
  },
};

const SYSTEM_PROMPT = `You are Botvio AI Binary Options Signal Generator.

Generate a binary options trading signal (CALL/PUT) for the given instrument.

Rules:
- Analyze the price action pattern to determine short-term direction
- confidence must be 50-95 (be realistic)
- direction must be "BUY" (CALL) or "SELL" (PUT)
- Provide clear entry_price, stop_loss, take_profit
- Keep reason under 120 characters
- Return ONLY valid JSON

Return this exact JSON structure:
{
  "direction": "BUY or SELL",
  "confidence": 72,
  "entry_price": 1.0850,
  "stop_loss": 1.0830,
  "take_profit": 1.0880,
  "reason": "Bullish engulfing at support with RSI divergence",
  "strategy_name": "Momentum Continuation"
}`;

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

    const config = BROKER_MARKETS[broker];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unknown broker: ${broker}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick random symbols (up to count)
    const shuffled = [...config.symbols].sort(() => Math.random() - 0.5);
    const selectedSymbols = shuffled.slice(0, Math.min(count, config.symbols.length));
    const timeframe = config.timeframes[Math.floor(Math.random() * config.timeframes.length)];

    const signals: any[] = [];

    for (const symbol of selectedSymbols) {
      // Try to get real market data
      let priceContext = `Symbol: ${symbol}, Timeframe: ${timeframe}`;

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
          priceContext += `\nPrice: ${quote.price}, Bid: ${quote.bid}, Ask: ${quote.ask}, 24h Change: ${quote.change_percent_24h}%`;
        }
        if (indicator) {
          priceContext += `\nEMA20: ${indicator.ema_20}, EMA50: ${indicator.ema_50}, RSI14: ${indicator.rsi_14}, ATR14: ${indicator.atr_14}`;
          priceContext += `\nTrend: ${indicator.trend}, Support: ${indicator.support_1}, Resistance: ${indicator.resistance_1}`;
        }
      }

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Generate a binary options signal for ${broker} platform.\n\n${priceContext}\n\nGenerate signal now.` },
            ],
            max_tokens: 500,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${symbol}:`, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const text = aiData.choices?.[0]?.message?.content || "";

        const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
        if (!jsonMatch) {
          console.error(`Invalid AI response for ${symbol}`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

        // Calculate expiry
        const expiresAt = new Date(Date.now() + config.expirySeconds * 1000).toISOString();

        // Insert into trading_signals
        const { data: inserted, error: insertErr } = await supabase
          .from("trading_signals")
          .insert({
            symbol,
            direction: parsed.direction === "BUY" ? "BUY" : "SELL",
            entry_price: parsed.entry_price || 0,
            stop_loss: parsed.stop_loss || null,
            take_profit: parsed.take_profit || null,
            timeframe,
            category: config.category,
            broker: [broker],
            confidence: Math.min(95, Math.max(50, parsed.confidence || 65)),
            reason: parsed.reason || "AI-generated binary signal",
            strategy_name: parsed.strategy_name || "Botvio AI Signal",
            status: "ACTIVE",
            is_manual: false,
            expires_at: expiresAt,
            expiry_seconds: config.expirySeconds,
            signal_lifecycle: "approved",
          })
          .select()
          .single();

        if (insertErr) {
          console.error(`Insert error for ${symbol}:`, insertErr);
          continue;
        }

        signals.push(inserted);
      } catch (err) {
        console.error(`Error processing ${symbol}:`, err);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ success: true, broker, generated: signals.length, signals }),
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
