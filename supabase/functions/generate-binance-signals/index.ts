import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BINANCE_SYMBOLS = [
  { symbol: "BTCUSDT", display: "BTCUSD", category: "crypto" },
  { symbol: "ETHUSDT", display: "ETHUSD", category: "crypto" },
  { symbol: "SOLUSDT", display: "SOLUSD", category: "crypto" },
  { symbol: "BNBUSDT", display: "BNBUSD", category: "crypto" },
  { symbol: "XRPUSDT", display: "XRPUSD", category: "crypto" },
  { symbol: "ADAUSDT", display: "ADAUSD", category: "crypto" },
  { symbol: "DOGEUSDT", display: "DOGEUSD", category: "crypto" },
  { symbol: "DOTUSDT", display: "DOTUSD", category: "crypto" },
];

const SYSTEM_PROMPT = `You are Botvio AI Crypto Analyst specializing in Binance spot trading.

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
    let symbols = BINANCE_SYMBOLS;
    
    // Allow targeting specific symbols
    try {
      const body = await req.json();
      if (body.symbols && Array.isArray(body.symbols)) {
        symbols = BINANCE_SYMBOLS.filter(s => body.symbols.includes(s.symbol) || body.symbols.includes(s.display));
      }
    } catch { /* no body or invalid JSON — use defaults */ }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    for (const sym of symbols) {
      try {
        const klines = await fetchBinanceKlines(sym.symbol, "1h", 30);
        const currentPrice = klines[klines.length - 1]?.close ?? 0;

        const userPrompt = `Instrument: ${sym.display} (Binance Spot)
Current price: ${currentPrice}

Recent 1H candles (last 30):
${JSON.stringify(klines.slice(-15), null, 2)}

Generate the crypto trading signal now.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
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

        // Only post actionable signals (buy/sell with decent confidence)
        if ((parsed.signal === "buy" || parsed.signal === "sell") && parsed.confidence >= 45) {
          const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4h expiry

          const { error: insertErr } = await supabase.from("trading_signals").insert({
            symbol: sym.display,
            direction: parsed.signal.toUpperCase(),
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
            strategy_name: parsed.strategy_name || "Binance AI Signal",
            expires_at: expiresAt,
          });

          if (insertErr) {
            console.error(`Failed to save signal for ${sym.display}:`, insertErr.message);
          } else {
            results.push({ symbol: sym.display, signal: parsed.signal, confidence: parsed.confidence });
            console.log(`Signal posted: ${sym.display} ${parsed.signal} (${parsed.confidence}%)`);
          }
        } else {
          console.log(`Skipped ${sym.display}: ${parsed.signal} (confidence: ${parsed.confidence})`);
        }

        // Small delay between API calls
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
