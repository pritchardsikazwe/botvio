import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS - only allow botvio.live in production
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Credentials": "true",
};

// Error codes for detailed logging
const ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  MISSING_IMAGE: "missing_image",
  MISSING_AI_KEY: "missing_ai_key",
  RATE_LIMITED: "rate_limited",
  PAYMENT_REQUIRED: "payment_required",
  AI_TIMEOUT: "ai_timeout",
  AI_ERROR: "ai_error",
  DB_ERROR: "db_error",
  DAILY_LIMIT: "daily_limit",
  INVALID_SYMBOL: "invalid_symbol",
};

async function logError(
  supabase: any,
  functionName: string,
  userId: string | null,
  errorCode: string,
  errorMessage: string,
  requestPayload?: any,
  responseStatus?: number
) {
  try {
    await supabase.from("edge_logs").insert({
      function_name: functionName,
      user_id: userId,
      error_code: errorCode,
      error_message: errorMessage,
      request_payload: requestPayload,
      response_status: responseStatus,
    });
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | null = null;
  let isGuest = false;

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const { imageUrl, symbol, timeframe, analysisType, jobId } = await req.json();

    if (!imageUrl) {
      await logError(supabase, "analyze-chart", null, ERROR_CODES.MISSING_IMAGE, "Image URL required", null, 400);
      return new Response(
        JSON.stringify({ error: "Image URL is required", error_code: ERROR_CODES.MISSING_IMAGE }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to authenticate - guests are allowed
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (!userError && userData?.user?.id) {
          userId = userData.user.id;
        } else {
          isGuest = true;
        }
      } catch {
        isGuest = true;
      }
    } else {
      isGuest = true;
    }

    // If jobId provided, update job status to running
    if (jobId) {
      await supabase
        .from("analysis_jobs")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    // Check if user has an active premium entitlement (signal_pack product)
    let isPremium = false;
    if (userId) {
      const { data: entitlement } = await supabase
        .from("entitlements")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      isPremium = !!entitlement;
    }

    // Enforce 10 uploads/day limit for non-premium users
    const MAX_FREE_DAILY = 10;
    if (!isPremium) {
      const today = new Date().toISOString().split("T")[0];
      if (userId) {
        const { count } = await supabase
          .from("chart_analyses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", `${today}T00:00:00Z`);
        if ((count || 0) >= MAX_FREE_DAILY) {
          await logError(supabase, "analyze-chart", userId, ERROR_CODES.DAILY_LIMIT, "Daily free limit reached", null, 403);
          if (jobId) {
            await supabase.from("analysis_jobs").update({ status: "failed", error_code: ERROR_CODES.DAILY_LIMIT, error_message: "Daily limit reached", completed_at: new Date().toISOString() }).eq("id", jobId);
          }
          return new Response(
            JSON.stringify({ error: "You've reached your daily limit of 10 free analyses. Subscribe to Premium Signals for unlimited access.", error_code: ERROR_CODES.DAILY_LIMIT, redirect: "/billing" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Guest — we can't enforce server-side, client handles it
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await logError(supabase, "analyze-chart", userId, ERROR_CODES.MISSING_AI_KEY, "LOVABLE_API_KEY not configured", null, 500);
      if (jobId) {
        await supabase
          .from("analysis_jobs")
          .update({ 
            status: "failed", 
            error_code: ERROR_CODES.MISSING_AI_KEY,
            error_message: "AI service not configured",
            completed_at: new Date().toISOString()
          })
          .eq("id", jobId);
      }
      return new Response(
        JSON.stringify({ error: "AI service unavailable", error_code: ERROR_CODES.MISSING_AI_KEY }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map symbol codes to readable names
    const SYMBOL_NAME_MAP: Record<string, string> = {
      "XAUUSD": "Gold", "XAU/USD": "Gold",
      "XAGUSD": "Silver", "XAG/USD": "Silver",
      "EURUSD": "EUR/USD", "GBPUSD": "GBP/USD", "USDJPY": "USD/JPY",
      "AUDUSD": "AUD/USD", "NZDUSD": "NZD/USD", "USDCAD": "USD/CAD",
      "USDCHF": "USD/CHF", "GBPJPY": "GBP/JPY", "EURJPY": "EUR/JPY",
      "NAS100": "NASDAQ", "US30": "US30", "SPX500": "S&P 500",
      "BTCUSD": "Bitcoin", "ETHUSD": "Ethereum",
      "BOOM1000": "Boom 1000", "BOOM500": "Boom 500",
      "CRASH1000": "Crash 1000", "CRASH500": "Crash 500",
      "Volatility_75_Index": "Volatility 75", "R_75": "Volatility 75",
      "R_100": "Volatility 100", "R_50": "Volatility 50",
      "R_25": "Volatility 25", "R_10": "Volatility 10",
    };
    const resolvedSymbol = symbol ? (SYMBOL_NAME_MAP[symbol] || symbol) : null;

    const timeframeInstruction = `
**Timeframe**: <detected timeframe from chart, e.g. M1, M5, M15, M30, H1, H4, D1, W1. Look at the chart's time axis, candle spacing, or any timeframe label visible on the chart. This is REQUIRED.>`;

    const analysisPrompt = resolvedSymbol
      ? `You are an expert trading chart analyst. The user has uploaded a chart for **${resolvedSymbol}**. This is confirmed — do NOT identify or guess a different instrument. The instrument IS ${resolvedSymbol}.

**Instrument**: ${resolvedSymbol}

Analyze the chart and provide:
**Direction**: BUY or SELL
**Entry Price**: <exact number from chart>
**Stop Loss**: <exact number>
**Take Profit 1**: <exact number>
**Take Profit 2**: <exact number> (if applicable)
**Take Profit 3**: <exact number> (if applicable)
**Confidence**: <number>%
${timeframeInstruction}

1. **Trend Analysis**: Bullish, Bearish, or Ranging
2. **Key Levels**: Support and resistance
3. **Pattern Recognition**: Chart patterns visible
4. **Risk Assessment**: Low, Medium, or High
${timeframe ? `Current Timeframe: ${timeframe}` : ""}

Keep the response structured and actionable.`
      : `You are an expert trading chart analyst. Analyze this chart image carefully.

FIRST LINE MUST BE exactly: **Instrument**: <NAME>
Rules for instrument name:
- Use ONLY the short trading name: Gold, EUR/USD, Crash 500, Volatility 75, NASDAQ, Bitcoin, US30, GBP/JPY, Step Index, Boom 1000, Crude Oil, Silver etc.
- Look at the chart title, axis labels, watermarks, and price range to identify the instrument
- Common price ranges: 1800-3500 = Gold (XAU/USD), 0.5-2.0 = Forex pairs, 30000-45000 = US30/Dow, 15000-22000 = NASDAQ, 50000-120000 = Bitcoin

REQUIRED STRUCTURED DATA (use exact format):
**Direction**: BUY or SELL
**Entry Price**: <exact number from chart>
**Stop Loss**: <exact number>
**Take Profit 1**: <exact number>
**Take Profit 2**: <exact number> (if applicable)
**Take Profit 3**: <exact number> (if applicable)
**Confidence**: <number>%
${timeframeInstruction}

1. **Trend Analysis**: Bullish, Bearish, or Ranging
2. **Key Levels**: Support and resistance
3. **Pattern Recognition**: Chart patterns visible
4. **Risk Assessment**: Low, Medium, or High
${timeframe ? `Current Timeframe: ${timeframe}` : ""}

Keep the response structured and actionable.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let aiResponse;
    try {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: analysisPrompt },
                { type: "image_url", image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === "AbortError") {
        await logError(supabase, "analyze-chart", userId, ERROR_CODES.AI_TIMEOUT, "AI request timed out", { symbol, timeframe }, 504);
        if (jobId) {
          await supabase
            .from("analysis_jobs")
            .update({ 
              status: "failed", 
              error_code: ERROR_CODES.AI_TIMEOUT,
              error_message: "Analysis timed out. Please try again.",
              completed_at: new Date().toISOString()
            })
            .eq("id", jobId);
        }
        return new Response(
          JSON.stringify({ error: "Analysis timed out", error_code: ERROR_CODES.AI_TIMEOUT }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }
    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        await logError(supabase, "analyze-chart", userId, ERROR_CODES.RATE_LIMITED, "AI rate limited", { symbol }, 429);
        if (jobId) {
          await supabase
            .from("analysis_jobs")
            .update({ 
              status: "failed", 
              error_code: ERROR_CODES.RATE_LIMITED,
              error_message: "Rate limit exceeded. Please try again later.",
              completed_at: new Date().toISOString()
            })
            .eq("id", jobId);
        }
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", error_code: ERROR_CODES.RATE_LIMITED }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        await logError(supabase, "analyze-chart", userId, ERROR_CODES.PAYMENT_REQUIRED, "AI payment required", { symbol }, 402);
        if (jobId) {
          await supabase
            .from("analysis_jobs")
            .update({ 
              status: "failed", 
              error_code: ERROR_CODES.PAYMENT_REQUIRED,
              error_message: "Service temporarily unavailable.",
              completed_at: new Date().toISOString()
            })
            .eq("id", jobId);
        }
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable", error_code: ERROR_CODES.PAYMENT_REQUIRED }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logError(supabase, "analyze-chart", userId, ERROR_CODES.AI_ERROR, errorText, { symbol }, aiResponse.status);
      if (jobId) {
        await supabase
          .from("analysis_jobs")
          .update({ 
            status: "failed", 
            error_code: ERROR_CODES.AI_ERROR,
            error_message: "AI analysis failed",
            completed_at: new Date().toISOString()
          })
          .eq("id", jobId);
      }
      return new Response(
        JSON.stringify({ error: "AI analysis failed", error_code: ERROR_CODES.AI_ERROR }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "Analysis not available";

    // Extract price targets first (needed for instrument price-range fallback)
    const entryMatch = analysisText.match(/\*\*Entry\s*(?:Price)?\*\*[:\s]*\$?([\d,]+\.?\d*)/i) 
                    || analysisText.match(/Entry\s*(?:Price)?[:\s]*\$?([\d,]+\.?\d*)/i);
    const slMatch = analysisText.match(/\*\*Stop\s*Loss\*\*[:\s]*\$?([\d,]+\.?\d*)/i)
                 || analysisText.match(/Stop\s*Loss[:\s]*\$?([\d,]+\.?\d*)/i);
    const tp1Match = analysisText.match(/\*\*Take\s*Profit\s*1?\*\*[:\s]*\$?([\d,]+\.?\d*)/i)
                  || analysisText.match(/Take\s*Profit\s*1?[:\s]*\$?([\d,]+\.?\d*)/i)
                  || analysisText.match(/TP\s*1?[:\s]*\$?([\d,]+\.?\d*)/i);
    const tp2Match = analysisText.match(/\*\*Take\s*Profit\s*2\*\*[:\s]*\$?([\d,]+\.?\d*)/i)
                  || analysisText.match(/Take\s*Profit\s*2[:\s]*\$?([\d,]+\.?\d*)/i)
                  || analysisText.match(/TP\s*2[:\s]*\$?([\d,]+\.?\d*)/i);
    const tp3Match = analysisText.match(/\*\*Take\s*Profit\s*3\*\*[:\s]*\$?([\d,]+\.?\d*)/i)
                  || analysisText.match(/Take\s*Profit\s*3[:\s]*\$?([\d,]+\.?\d*)/i)
                  || analysisText.match(/TP\s*3[:\s]*\$?([\d,]+\.?\d*)/i);
    const confMatch = analysisText.match(/\*\*Confidence\*\*[:\s]*(\d+)/i)
                   || analysisText.match(/Confidence[:\s]*(\d+)/i);
    const dirMatch = analysisText.match(/\*\*Direction\*\*[:\s]*(BUY|SELL)/i);

    // Extract instrument name — always trust user-provided symbol
    let detectedInstrument = resolvedSymbol || null;
    if (!detectedInstrument) {
      const instrumentLineMatch = analysisText.match(/\*\*Instrument\*\*[:\s]*(.+?)(?:\n|$)/i);
      if (instrumentLineMatch) {
        detectedInstrument = instrumentLineMatch[1]
          .trim()
          .replace(/\*+/g, '')
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/\s*-\s*Inferred.*$/i, '')
          .replace(/\s*-\s*Based on.*$/i, '')
          .replace(/\s*Futures?\s*$/i, '')
          .trim();
      }
      
      if (!detectedInstrument || detectedInstrument === "Unknown" || detectedInstrument.length > 25) {
        const knownPatterns: [RegExp, string][] = [
          [/\b(?:Gold|XAUUSD|XAU\/USD)\b/i, "Gold"],
          [/\bCrash\s*(\d+)\b/i, "Crash $1"],
          [/\bBoom\s*(\d+)\b/i, "Boom $1"],
          [/\bVolatility\s*(\d+)(?:\s*(?:Index|1s))?\b/i, "Volatility $1"],
          [/\b(V75|V100|V50|V25|V10)\b/i, "$1"],
          [/\b(?:EUR\/USD|EURUSD)\b/i, "EUR/USD"],
          [/\b(?:GBP\/USD|GBPUSD)\b/i, "GBP/USD"],
          [/\b(?:USD\/JPY|USDJPY)\b/i, "USD/JPY"],
          [/\b(?:GBP\/JPY|GBPJPY)\b/i, "GBP/JPY"],
          [/\b(?:AUD\/USD|AUDUSD)\b/i, "AUD/USD"],
          [/\b(?:EUR\/JPY|EURJPY)\b/i, "EUR/JPY"],
          [/\b(?:USD\/CAD|USDCAD)\b/i, "USD/CAD"],
          [/\b(?:USD\/CHF|USDCHF)\b/i, "USD/CHF"],
          [/\b(?:NZD\/USD|NZDUSD)\b/i, "NZD/USD"],
          [/\b(?:NASDAQ|NAS100|NAS\s*100)\b/i, "NASDAQ"],
          [/\b(?:US30|Dow\s*Jones|DJI)\b/i, "US30"],
          [/\b(?:S&P\s*500|SPX500|SP500)\b/i, "S&P 500"],
          [/\b(?:Bitcoin|BTC\/USD|BTCUSD)\b/i, "Bitcoin"],
          [/\b(?:Ethereum|ETH\/USD|ETHUSD)\b/i, "Ethereum"],
          [/\b(?:Step\s*Index)\b/i, "Step Index"],
          [/\b(?:Jump\s*(\d+))\b/i, "Jump $1"],
          [/\b(?:Range\s*Break)\b/i, "Range Break"],
          [/\b(?:Crude\s*Oil|WTI|USOIL)\b/i, "Crude Oil"],
          [/\b(?:Silver|XAGUSD|XAG\/USD)\b/i, "Silver"],
          [/\b(?:Natural\s*Gas|NATGAS)\b/i, "Natural Gas"],
          [/\b(?:US\s*(?:10|30|5)[- ]?(?:Year|yr))/i, "US Treasury Bond"],
          [/\bDE40\b/i, "DE40"], [/\bUK100\b/i, "UK100"], [/\bJP225\b/i, "JP225"],
          [/\bPainX\s*(\d+)\b/i, "PainX $1"], [/\bGainX\s*(\d+)\b/i, "GainX $1"],
          [/\bTrendX\s*(\d+)\b/i, "TrendX $1"],
          [/\bFlipX\b/i, "FlipX"], [/\bSwitchX\b/i, "SwitchX"], [/\bBreakX\b/i, "BreakX"],
        ];
        for (const [pattern, replacement] of knownPatterns) {
          const m = analysisText.match(pattern);
          if (m) {
            detectedInstrument = replacement.includes("$") 
              ? replacement.replace(/\$(\d+|&)/g, (_, g) => g === "&" ? m[0] : (m[parseInt(g)] || ""))
              : replacement;
            break;
          }
        }
      }
      
      // Price-range fallback
      if (!detectedInstrument || detectedInstrument === "Unknown") {
        const priceVal = entryMatch ? parseFloat(entryMatch[1].replace(/,/g, '')) : null;
        if (priceVal) {
          if (priceVal > 1800 && priceVal < 3000) detectedInstrument = "Gold";
          else if (priceVal > 30000 && priceVal < 50000) detectedInstrument = "US30";
          else if (priceVal > 14000 && priceVal < 25000) detectedInstrument = "NASDAQ";
          else if (priceVal > 50000 && priceVal < 120000) detectedInstrument = "Bitcoin";
          else if (priceVal > 15 && priceVal < 35) detectedInstrument = "Silver";
          else if (priceVal > 60 && priceVal < 120) detectedInstrument = "Crude Oil";
        }
      }
      if (!detectedInstrument) detectedInstrument = "Unknown";
    }

    // Broker symbol metadata for Deriv, Weltrade, Exness
    const brokerSymbolMap: Record<string, Record<string, string>> = {
      "Gold": { deriv: "frxXAUUSD", weltrade: "XAUUSD", exness: "XAUUSDm" },
      "EUR/USD": { deriv: "frxEURUSD", weltrade: "EURUSD", exness: "EURUSDm" },
      "GBP/USD": { deriv: "frxGBPUSD", weltrade: "GBPUSD", exness: "GBPUSDm" },
      "USD/JPY": { deriv: "frxUSDJPY", weltrade: "USDJPY", exness: "USDJPYm" },
      "GBP/JPY": { deriv: "frxGBPJPY", weltrade: "GBPJPY", exness: "GBPJPYm" },
      "AUD/USD": { deriv: "frxAUDUSD", weltrade: "AUDUSD", exness: "AUDUSDm" },
      "EUR/JPY": { deriv: "frxEURJPY", weltrade: "EURJPY", exness: "EURJPYm" },
      "USD/CAD": { deriv: "frxUSDCAD", weltrade: "USDCAD", exness: "USDCADm" },
      "USD/CHF": { deriv: "frxUSDCHF", weltrade: "USDCHF", exness: "USDCHFm" },
      "NZD/USD": { deriv: "frxNZDUSD", weltrade: "NZDUSD", exness: "NZDUSDm" },
      "Bitcoin": { deriv: "cryBTCUSD", weltrade: "BTCUSD", exness: "BTCUSDm" },
      "Ethereum": { deriv: "cryETHUSD", weltrade: "ETHUSD", exness: "ETHUSDm" },
      "NASDAQ": { deriv: "OTC_NDX", weltrade: "NAS100", exness: "NAS100m" },
      "US30": { deriv: "OTC_DJI", weltrade: "US30", exness: "US30m" },
      "Crash 500": { deriv: "CRASH500", weltrade: "Crash500", exness: "" },
      "Crash 1000": { deriv: "CRASH1000", weltrade: "Crash1000", exness: "" },
      "Boom 500": { deriv: "BOOM500", weltrade: "Boom500", exness: "" },
      "Boom 1000": { deriv: "BOOM1000", weltrade: "Boom1000", exness: "" },
      "Volatility 75": { deriv: "R_75", weltrade: "V75", exness: "" },
      "Volatility 100": { deriv: "R_100", weltrade: "V100", exness: "" },
      "Volatility 50": { deriv: "R_50", weltrade: "V50", exness: "" },
      "Volatility 25": { deriv: "R_25", weltrade: "V25", exness: "" },
      "Volatility 10": { deriv: "R_10", weltrade: "V10", exness: "" },
      "Step Index": { deriv: "stpRNG", weltrade: "StepIndex", exness: "" },
      "Silver": { deriv: "frxXAGUSD", weltrade: "XAGUSD", exness: "XAGUSDm" },
      "Crude Oil": { deriv: "frxBROUSD", weltrade: "USOIL", exness: "USOILm" },
    };
    const brokerMeta = brokerSymbolMap[detectedInstrument] || null;

    const analysisResult = {
      raw_analysis: analysisText,
      instrument: detectedInstrument,
      broker_symbols: brokerMeta,
      trend: analysisText.toLowerCase().includes("bullish") ? "BULLISH" : 
             analysisText.toLowerCase().includes("bearish") ? "BEARISH" : "RANGING",
      recommendation: dirMatch ? dirMatch[1].toUpperCase() :
                      analysisText.includes("BUY") ? "BUY" : 
                      analysisText.includes("SELL") ? "SELL" : "WAIT",
      entry_price: entryMatch ? entryMatch[1].replace(/,/g, '') : null,
      stop_loss: slMatch ? slMatch[1].replace(/,/g, '') : null,
      take_profit: tp1Match ? tp1Match[1].replace(/,/g, '') : null,
      take_profit_2: tp2Match ? tp2Match[1].replace(/,/g, '') : null,
      take_profit_3: tp3Match ? tp3Match[1].replace(/,/g, '') : null,
      confidence: confMatch ? confMatch[1] : null,
      analyzed_at: new Date().toISOString(),
    };

    // Save to chart_analyses (only for authenticated users)
    if (userId) {
      const { error: saveError } = await supabase
        .from("chart_analyses")
        .insert({
          user_id: userId,
          image_url: imageUrl,
          symbol: symbol || detectedInstrument || null,
          timeframe: timeframe || null,
          analysis_result: analysisResult,
          ai_response: analysisText,
          is_premium_analysis: isPremium,
        });

      if (saveError) {
        console.error("Error saving analysis:", saveError);
        await logError(supabase, "analyze-chart", userId, ERROR_CODES.DB_ERROR, saveError.message, { symbol }, 500);
      }
    }

    // Update job if provided
    if (jobId) {
      await supabase
        .from("analysis_jobs")
        .update({ 
          status: "completed", 
          result_json: analysisResult,
          ai_response: analysisText,
          completed_at: new Date().toISOString()
        })
        .eq("id", jobId);
    }

    let remainingToday: string | number = "unlimited";
    if (userId && !isPremium) {
      const { count } = await supabase.from("chart_analyses").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", `${new Date().toISOString().split("T")[0]}T00:00:00Z`);
      remainingToday = Math.max(0, MAX_FREE_DAILY - (count || 0));
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisText,
        structured: analysisResult,
        is_premium: isPremium,
        is_guest: isGuest,
        remaining_today: remainingToday,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chart analysis error:", error);
    await logError(supabase, "analyze-chart", userId, "unknown_error", (error as Error).message, null, 500);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Analysis failed", error_code: "unknown_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
