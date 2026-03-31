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
    const { imageUrl, matches, marketType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Also try to get live scores for context
    const FOOTBALL_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY") || "";
    let liveScoresContext = "";
    if (FOOTBALL_API_KEY) {
      try {
        const resp = await fetch("https://api.football-data.org/v4/matches?status=IN_PLAY,PAUSED,FINISHED", {
          headers: { "X-Auth-Token": FOOTBALL_API_KEY },
        });
        if (resp.ok) {
          const data = await resp.json();
          const liveMatches = (data.matches || []).slice(0, 30).map((m: any) => {
            const home = m.homeTeam?.name || "Home";
            const away = m.awayTeam?.name || "Away";
            const ht = m.score?.halfTime;
            const ft = m.score?.fullTime;
            const status = m.status;
            const minute = m.minute || "";
            return `${home} vs ${away} | Status: ${status} ${minute ? `(${minute}')` : ""} | HT: ${ht?.home ?? "?"}-${ht?.away ?? "?"} | FT: ${ft?.home ?? "?"}-${ft?.away ?? "?"}`;
          }).join("\n");
          if (liveMatches) {
            liveScoresContext = `\n\nLIVE/RECENT MATCH SCORES:\n${liveMatches}`;
          }
        }
      } catch (e) {
        console.warn("Live scores fetch failed:", e);
      }
    }

    const matchesText = Array.isArray(matches) && matches.length > 0
      ? matches.map((m: any) => `Match: ${m.match_name} | Market: ${m.market_type} | Prediction: ${m.prediction} | League: ${m.league || "Unknown"}`).join("\n")
      : "See the uploaded bet slip image for match details.";

    const systemPrompt = `You are an expert live football betting analyst. The user has uploaded a bet slip (either as an image or match list) and wants to know the LIVE STATUS of their bets.

Your job is to provide a REAL-TIME PROGRESS REPORT including:

1. **MATCH STATUS** — For each match on the slip:
   - Current score (or final score if finished)
   - Current minute / half
   - Is the bet currently WINNING or LOSING?

2. **CORNERS TRACKER** (if corners bet):
   - How many corners so far for each team
   - Total corners so far vs the line (e.g., "7/9.5 — need 3 more")
   - Projected final corners based on current pace
   - Corner pace per minute and likelihood of hitting the line

3. **GOALS TRACKER** (if over/under goals):
   - Goals scored so far vs the line
   - "2 goals scored, need 1 more for Over 2.5"
   - Goal pace and projection
   - xG if available

4. **BTTS TRACKER** (if BTTS bet):
   - Has each team scored? ✅/❌
   - If not, attacking momentum analysis

5. **MATCH RESULT TRACKER** (if 1X2 bet):
   - Current standing vs prediction
   - Momentum shifts

6. **OVERALL SLIP STATUS**:
   - 🟢 ON TRACK / 🟡 AT RISK / 🔴 LOST
   - How many legs won, lost, pending
   - Estimated payout if current results hold
   - Cash-out recommendation (if applicable)

7. **WHAT'S REMAINING**:
   - Minutes remaining in each match
   - What needs to happen for the slip to win
   - Probability estimate of the slip winning

Use emojis for quick visual scanning. Be specific with numbers. If you don't have live data for a specific match, say so and provide your best estimate based on team form.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    const userContent = `Check the status of my bet slip. Tell me if it's winning or losing, how many corners/goals so far, and what's remaining.

${matches ? `MY BET SLIP SELECTIONS:\n${matchesText}` : "See attached bet slip image."}
${marketType ? `Primary market focus: ${marketType}` : "Check all markets."}
${liveScoresContext}`;

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userContent },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userContent });
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
      throw new Error("AI check failed");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "Check unavailable";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("check-bet-slip error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
