import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Botvio AI Market Analyst.

Your task is to generate a cautious, structured trading analysis for one instrument at one timeframe.

Rules:
- You are not a financial advisor.
- Do not promise profits.
- Use only the provided market data.
- Prefer "hold" or "avoid" when the setup is weak or mixed.
- Keep the analysis practical and short.
- Respect the trend, RSI, EMA relationship, ATR volatility, and support/resistance.
- If price is near resistance in an uptrend, be cautious about chasing.
- If price is near support in a downtrend, be cautious about catching a falling knife.
- Confidence must be 0 to 100.
- Risk/reward should usually be at least 1.5 for buy or sell signals.
- If no clean setup exists, return signal = "avoid" or "hold".

Return ONLY valid JSON with this structure:
{
  "signal": "buy|sell|hold|avoid",
  "confidence": 0,
  "entry_price": 0,
  "stop_loss": 0,
  "take_profit_1": 0,
  "take_profit_2": 0,
  "risk_reward": 0,
  "ai_summary": "string",
  "reasoning_json": {
    "trend": "bullish|bearish|neutral",
    "ema_alignment": "bullish|bearish|mixed",
    "rsi_state": "overbought|oversold|neutral|bullish|bearish",
    "volatility_state": "low|normal|high",
    "support_resistance_context": "string",
    "setup_quality": "high|medium|low"
  }
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
    // Parse request
    const { symbol, timeframe = "15min" } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "symbol is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get asset
    const { data: asset, error: assetErr } = await supabase
      .from("assets")
      .select("id,symbol")
      .eq("symbol", symbol)
      .single();
    if (assetErr || !asset) {
      return new Response(
        JSON.stringify({ error: `Asset not found: ${symbol}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get latest quote
    const { data: quote } = await supabase
      .from("market_quotes")
      .select("*")
      .eq("asset_id", asset.id)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    // Get latest indicators
    const { data: indicator } = await supabase
      .from("market_indicators")
      .select("*")
      .eq("asset_id", asset.id)
      .eq("timeframe", timeframe)
      .order("candle_time", { ascending: false })
      .limit(1)
      .single();

    // Get recent candles
    const { data: candles } = await supabase
      .from("market_candles")
      .select("candle_time,open,high,low,close,volume")
      .eq("asset_id", asset.id)
      .eq("timeframe", timeframe)
      .order("candle_time", { ascending: false })
      .limit(30);

    const recentCandles = [...(candles || [])].reverse();

    const userPrompt = `Instrument: ${symbol}
Timeframe: ${timeframe}

Latest price: ${quote?.price ?? "N/A"}
EMA20: ${indicator?.ema_20 ?? "N/A"}
EMA50: ${indicator?.ema_50 ?? "N/A"}
RSI14: ${indicator?.rsi_14 ?? "N/A"}
ATR14: ${indicator?.atr_14 ?? "N/A"}
Support 1: ${indicator?.support_1 ?? "N/A"}
Resistance 1: ${indicator?.resistance_1 ?? "N/A"}
Detected trend: ${indicator?.trend ?? "N/A"}

Recent candle summary:
${JSON.stringify(recentCandles, null, 2)}

Generate the trading analysis now.`;

    // Call Lovable AI
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
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 402 || aiResponse.status === 429) {
        const msg = aiResponse.status === 402
          ? "AI signals are temporarily unavailable (AI credits exhausted)."
          : "AI signals are rate limited. Please try again shortly.";
        return new Response(
          JSON.stringify({ ok: false, error: msg, code: aiResponse.status === 402 ? "credits_exhausted" : "rate_limited" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI analysis failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const text = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "AI returned invalid format", raw: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    // Save to ai_signals
    const { error: saveErr } = await supabase.from("ai_signals").insert({
      asset_id: asset.id,
      timeframe,
      signal: parsed.signal,
      confidence: parsed.confidence,
      entry_price: parsed.entry_price,
      stop_loss: parsed.stop_loss,
      take_profit_1: parsed.take_profit_1,
      take_profit_2: parsed.take_profit_2,
      risk_reward: parsed.risk_reward,
      ai_summary: parsed.ai_summary,
      reasoning_json: parsed.reasoning_json,
      provider_snapshot_time: quote?.provider_timestamp || null,
    });

    if (saveErr) {
      console.error("Failed to save signal:", saveErr);
    }

    return new Response(
      JSON.stringify({ success: true, signal: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Signal generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
