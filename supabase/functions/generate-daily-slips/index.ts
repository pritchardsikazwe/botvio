import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FOOTBALL_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY") || "";
const BASE = "https://api.football-data.org/v4";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slipSize, marketType, slipType, leagueFilter } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch today's and tomorrow's fixtures
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    
    let fixturesData: any = { matches: [] };
    if (FOOTBALL_API_KEY) {
      try {
        const resp = await fetch(`${BASE}/matches?dateFrom=${today}&dateTo=${tomorrow}`, {
          headers: { "X-Auth-Token": FOOTBALL_API_KEY },
        });
        if (resp.ok) fixturesData = await resp.json();
      } catch (e) {
        console.warn("Fixtures fetch failed, using AI knowledge:", e);
      }
    }

    let filteredMatches = fixturesData.matches || [];
    if (leagueFilter) {
      const regex = new RegExp(leagueFilter, 'i');
      const leagueMatches = filteredMatches.filter((m: any) => 
        regex.test(m.competition?.name || '') || regex.test(m.competition?.area?.name || '')
      );
      if (leagueMatches.length > 0) filteredMatches = leagueMatches;
    }

    const matchesSummary = filteredMatches.slice(0, 40).map((m: any) => 
      `${m.homeTeam?.name} vs ${m.awayTeam?.name} (${m.competition?.name}, ${m.competition?.area?.name || ''}, ${m.utcDate})`
    ).join("\n") || "No live fixtures available — use your knowledge of today's scheduled matches.";

    const size = parseInt(slipSize) || 3;
    const market = marketType || "mixed";
    const type = slipType || "combined";

    const systemPrompt = `You are an expert football betting tipster with a proven track record. Generate betting slip recommendations based on real fixture analysis.

RULES:
- Always provide specific match predictions with reasoning
- Include odds estimates and confidence levels
- For corners: specify exact lines (Over 4.5, 7.5, 9.5, 12.5)
- For goals: specify exact lines (Over/Under 0.5, 1.5, 2.5, 3.5)
- For BTTS: specify Yes or No with confidence
- For match result: specify 1, X, or 2
- Rate each pick: ⭐ (risky) to ⭐⭐⭐⭐⭐ (very confident)
- Include combined odds estimate for accumulators
- Add bankroll management advice`;

    const userPrompt = `Generate a ${type === "single" ? "set of single bets" : "combined accumulator slip"} with exactly ${size} picks.

Market focus: ${market === "mixed" ? "Mix of corners, over/under goals, BTTS, and match results" : market === "corners" ? "CORNERS ONLY (4+, 7+, 12+ corners)" : market === "over_under" ? "OVER/UNDER GOALS ONLY" : market === "btts" ? "BOTH TEAMS TO SCORE ONLY" : "MATCH RESULT (1X2) ONLY"}

Today's available fixtures:
${matchesSummary}

For each pick provide:
1. Match name
2. League
3. Market & prediction (e.g., "Over 9.5 Corners", "BTTS Yes", "Home Win")
4. Estimated odds
5. Confidence (1-5 stars)
6. Brief reasoning (1-2 sentences)

Then provide:
- Total combined odds (if accumulator)
- Overall slip confidence rating
- Recommended stake as % of bankroll
- Risk assessment (Conservative/Moderate/Aggressive)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const picks = data.choices?.[0]?.message?.content || "No picks generated";

    return new Response(JSON.stringify({ picks, matchesUsed: fixturesData.matches?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("generate-daily-slips error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
