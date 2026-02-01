import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, symbol, timeframe, userId, isAnonymous } = await req.json();

    if (!imageUrl || !userId) {
      return new Response(
        JSON.stringify({ error: "Image URL and user ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check user's subscription for premium status
    const { data: subscription } = await supabase
      .from("user_plan_subscriptions")
      .select("pricing_plan_id, pricing_plans(code)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    // Handle the joined data - pricing_plans comes as an object when using select with ()
    const planCode = (subscription?.pricing_plans as any)?.code;
    const isPremium = planCode && planCode !== "free";

    // Check daily upload limit for non-premium users
    if (!isPremium) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("chart_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", `${today}T00:00:00Z`);

      if ((count || 0) >= 1) {
        return new Response(
          JSON.stringify({ 
            error: "Daily limit reached", 
            message: "Free users can only analyze 1 chart per day. Upgrade to Premium for unlimited analyses."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI with chart image for analysis
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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to analyze chart");
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "Analysis not available";

    // Parse the AI response to extract structured data
    const analysisResult = {
      raw_analysis: analysisText,
      trend: analysisText.includes("bullish") ? "BULLISH" : 
             analysisText.includes("bearish") ? "BEARISH" : "RANGING",
      recommendation: analysisText.includes("BUY") ? "BUY" : 
                      analysisText.includes("SELL") ? "SELL" : "WAIT",
      analyzed_at: new Date().toISOString(),
    };

    // Save analysis to database (only for authenticated users)
    if (!isAnonymous && userId && !userId.startsWith('anonymous_')) {
      const { data: savedAnalysis, error: saveError } = await supabase
        .from("chart_analyses")
        .insert({
          user_id: userId,
          image_url: imageUrl,
          symbol: symbol || null,
          timeframe: timeframe || null,
          analysis_result: analysisResult,
          ai_response: analysisText,
          is_premium_analysis: isPremium,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving analysis:", saveError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisText,
        structured: analysisResult,
        is_premium: isPremium,
        remaining_today: isPremium ? "unlimited" : 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chart analysis error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
