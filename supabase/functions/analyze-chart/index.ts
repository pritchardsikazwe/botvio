import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      await logError(supabase, "analyze-chart", null, ERROR_CODES.UNAUTHORIZED, "Missing auth header", null, 401);
      return new Response(
        JSON.stringify({ error: "Unauthorized", error_code: ERROR_CODES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { imageUrl, symbol, timeframe, analysisType, jobId } = await req.json();

    if (!imageUrl) {
      await logError(supabase, "analyze-chart", null, ERROR_CODES.MISSING_IMAGE, "Image URL required", null, 400);
      return new Response(
        JSON.stringify({ error: "Image URL is required", error_code: ERROR_CODES.MISSING_IMAGE }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user via getUser
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      await logError(supabase, "analyze-chart", null, ERROR_CODES.UNAUTHORIZED, "Invalid token", null, 401);
      return new Response(
        JSON.stringify({ error: "Unauthorized", error_code: ERROR_CODES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    userId = userData.user.id;

    // If jobId provided, update job status to running
    if (jobId) {
      await supabase
        .from("analysis_jobs")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    // Check subscription
    const { data: subscription } = await supabase
      .from("user_plan_subscriptions")
      .select("pricing_plan_id, pricing_plans(code)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const planCode = (subscription?.pricing_plans as any)?.code;
    const isPremium = planCode && planCode !== "free" && planCode !== "starter";

    // Check daily limit for non-premium
    if (!isPremium) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("chart_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", `${today}T00:00:00Z`);

      if ((count || 0) >= 3) {
        if (jobId) {
          await supabase
            .from("analysis_jobs")
            .update({ 
              status: "failed", 
              error_code: ERROR_CODES.DAILY_LIMIT,
              error_message: "Daily limit reached. Upgrade to Premium for unlimited analyses.",
              completed_at: new Date().toISOString()
            })
            .eq("id", jobId);
        }
        return new Response(
          JSON.stringify({ 
            error: "Daily limit reached", 
            error_code: ERROR_CODES.DAILY_LIMIT,
            message: "Free users can only analyze 3 charts per day. Upgrade to Premium for unlimited analyses."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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

    const analysisPrompt = `You are an expert forex and trading chart analyst. Analyze this trading chart image and provide:

1. **Trend Analysis**: Is the market bullish, bearish, or ranging?
2. **Key Levels**: Identify major support and resistance levels
3. **Pattern Recognition**: Any chart patterns visible (head & shoulders, triangles, flags, etc.)
4. **Entry Recommendation**: BUY, SELL, or WAIT with entry price range
5. **Stop Loss**: Suggested stop loss level
6. **Take Profit**: Suggested take profit levels (TP1, TP2, TP3)
7. **Risk Assessment**: Low, Medium, or High risk trade
8. **Confidence Score**: 1-100%
9. **Timeframe Suggestion**: Best timeframe for this setup

${symbol ? `Symbol: ${symbol}` : ""}
${timeframe ? `Current Timeframe: ${timeframe}` : ""}

Provide actionable trading advice in a structured format.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let aiResponse;
    try {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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

    const analysisResult = {
      raw_analysis: analysisText,
      trend: analysisText.toLowerCase().includes("bullish") ? "BULLISH" : 
             analysisText.toLowerCase().includes("bearish") ? "BEARISH" : "RANGING",
      recommendation: analysisText.includes("BUY") ? "BUY" : 
                      analysisText.includes("SELL") ? "SELL" : "WAIT",
      analyzed_at: new Date().toISOString(),
    };

    // Save to chart_analyses
    const { error: saveError } = await supabase
      .from("chart_analyses")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        symbol: symbol || null,
        timeframe: timeframe || null,
        analysis_result: analysisResult,
        ai_response: analysisText,
        is_premium_analysis: isPremium,
      });

    if (saveError) {
      console.error("Error saving analysis:", saveError);
      await logError(supabase, "analyze-chart", userId, ERROR_CODES.DB_ERROR, saveError.message, { symbol }, 500);
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

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisText,
        structured: analysisResult,
        is_premium: isPremium,
        remaining_today: isPremium ? "unlimited" : Math.max(0, 3 - ((await supabase.from("chart_analyses").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", `${new Date().toISOString().split("T")[0]}T00:00:00Z`)).count || 0) - 1),
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
