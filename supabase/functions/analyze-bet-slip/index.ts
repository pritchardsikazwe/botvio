import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, marketType, matchName, league } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert football betting analyst specializing in statistical analysis. 
When analyzing a bet slip image or bet details, provide a comprehensive analysis covering ALL of these areas:

1. **CORNERS ANALYSIS** (4+, 7+, 12+ corners):
   - Probability of Over/Under 4.5, 7.5, 9.5, 12.5 total corners
   - Which team is likely to win the corner count
   - Corner strategy recommendation (best value bet)

2. **OVER/UNDER GOALS**:
   - Probability for Over/Under 0.5, 1.5, 2.5, 3.5 goals
   - Which half is likely to see more goals
   - Best goals line to bet on

3. **MATCH RESULT (1X2)**:
   - Win probability for Home, Draw, Away
   - Confidence level and reasoning

4. **BOTH TEAMS TO SCORE (BTTS)**:
   - BTTS Yes/No probability
   - Key factors affecting BTTS outcome

5. **WINNING TEAMS ASSESSMENT**:
   - Overall pick confidence (1-10)
   - Risk level (Low/Medium/High)
   - Recommended stake percentage

6. **STRATEGY VERDICT**:
   - Best single bet from this slip
   - Best combo/accumulator picks
   - What to AVOID on this slip
   - Bankroll management advice

Format your response with clear headers, percentages, and actionable recommendations. Be specific with numbers.`;

    const userMessage = imageUrl 
      ? `Analyze this bet slip image and provide full analysis across all markets (corners 4+/7+/12+, over/under goals, match result, BTTS, winning teams). Match: ${matchName || 'See image'}. League: ${league || 'See image'}. Market focus: ${marketType || 'all'}.`
      : `Analyze this bet: Match: ${matchName}. League: ${league || 'Unknown'}. Market: ${marketType || 'all'}. Provide full analysis across corners (4+/7+/12+), over/under goals, match result, BTTS, and winning teams assessment.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Analysis unavailable";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("analyze-bet-slip error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
