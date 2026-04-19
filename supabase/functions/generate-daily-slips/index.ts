import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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
    const { slipSize, marketType, slipType, leagueFilter, dayRange } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth user
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce daily limit (admins/VIP get unlimited via RPC logic)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: limitCheck, error: limitErr } = await adminClient.rpc("increment_slip_generation", {
      _user_id: user.id,
    });
    if (limitErr) {
      console.error("Limit check failed:", limitErr);
      return new Response(JSON.stringify({ error: "Limit check failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const row = Array.isArray(limitCheck) ? limitCheck[0] : limitCheck;
    if (!row?.allowed) {
      return new Response(JSON.stringify({
        error: `Daily limit reached (${row?.used ?? 0}/${row?.daily_limit ?? 0}). Try again tomorrow or upgrade to VIP.`,
        limitReached: true,
        used: row?.used,
        daily_limit: row?.daily_limit,
      }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute date range — only FUTURE games (now → end of range)
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    let dateFrom = todayStr;
    let dateTo = todayStr;

    if (dayRange === "tomorrow") {
      const tmrw = new Date(Date.now() + 86400000);
      dateFrom = tmrw.toISOString().split("T")[0];
      dateTo = dateFrom;
    } else if (dayRange === "weekend") {
      const dayOfWeek = now.getDay();
      const daysToSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek);
      const sat = new Date(Date.now() + daysToSat * 86400000);
      const sun = new Date(sat.getTime() + 86400000);
      dateFrom = sat.toISOString().split("T")[0];
      dateTo = sun.toISOString().split("T")[0];
    } else if (dayRange === "weekly") {
      dateTo = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    } else {
      dateTo = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    }

    const dayLabel = dayRange === "tomorrow" ? "tomorrow"
      : dayRange === "weekend" ? "this weekend"
      : dayRange === "weekly" ? "the next 7 days"
      : "today/upcoming";

    let fixturesData: any = { matches: [] };
    if (FOOTBALL_API_KEY) {
      try {
        const resp = await fetch(`${BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
          headers: { "X-Auth-Token": FOOTBALL_API_KEY },
        });
        if (resp.ok) fixturesData = await resp.json();
      } catch (e) {
        console.warn("Fixtures fetch failed, using AI knowledge:", e);
      }
    }

    let filteredMatches = fixturesData.matches || [];

    // CRITICAL: only future / scheduled / timed games — never finished or in-play
    filteredMatches = filteredMatches.filter((m: any) => {
      const ts = m.utcDate ? new Date(m.utcDate).getTime() : 0;
      const status = m.status || "";
      return ts > now.getTime() && (status === "SCHEDULED" || status === "TIMED" || status === "POSTPONED");
    });

    if (leagueFilter) {
      const regex = new RegExp(leagueFilter, 'i');
      const leagueMatches = filteredMatches.filter((m: any) =>
        regex.test(m.competition?.name || '') || regex.test(m.competition?.area?.name || '')
      );
      if (leagueMatches.length > 0) filteredMatches = leagueMatches;
    }

    // Sort by kickoff time so earliest games appear first
    filteredMatches.sort((a: any, b: any) =>
      new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );

    const matchesSummary = filteredMatches.slice(0, 50).map((m: any) => {
      const dt = new Date(m.utcDate);
      const dateStr = dt.toISOString().slice(0, 16).replace("T", " ") + " UTC";
      return `${m.homeTeam?.name} vs ${m.awayTeam?.name} | ${m.competition?.name} (${m.competition?.area?.name || ''}) | Kickoff: ${dateStr}`;
    }).join("\n") || "No live fixtures available — use your knowledge of currently scheduled upcoming matches.";

    const size = parseInt(slipSize) || 3;
    const market = marketType || "mixed";
    const type = slipType || "combined";

    const marketDescriptor = market === "mixed"
      ? "Mix of corners, goals OVER 1.5 and UNDER 4.5 lines, BTTS, and match results"
      : market === "corners"
      ? "CORNERS ONLY (Over 4.5, 7.5, 9.5, 12.5)"
      : market === "over_under"
      ? "GOALS ONLY — use ONLY these two lines: 'Over 1.5 Goals' and 'Under 4.5 Goals'. Do NOT suggest any other goal lines (no 0.5, 2.5, 3.5, etc.)."
      : market === "btts"
      ? "BOTH TEAMS TO SCORE ONLY (Yes/No)"
      : "MATCH RESULT (1X2) ONLY";

    const systemPrompt = `You are an expert football betting tipster with a proven track record. Generate betting slip recommendations based on real fixture analysis.

RULES:
- Only suggest matches that have NOT yet kicked off (kickoff is in the future)
- Always include the exact kickoff time (UTC) for each pick
- For corners: specify exact lines (Over 4.5, 7.5, 9.5, 12.5)
- For goals: choose from Under 1.5, Over 1.5, Over 2.5, Under 2.5, Over 3.5, Over 4.5, Under 4.5
- For BTTS: specify Yes or No with confidence
- For match result: specify 1, X, or 2
- Rate each pick: ⭐ (risky) to ⭐⭐⭐⭐⭐ (very confident)
- Include combined odds estimate for accumulators
- Add bankroll management advice`;

    const userPrompt = `Generate a ${type === "single" ? "set of single bets" : "combined accumulator slip"} with exactly ${size} picks for ${dayLabel}.

Market focus: ${marketDescriptor}
${leagueFilter ? `\nIMPORTANT: Focus ONLY on ${leagueFilter} league matches. If no fixtures are available from the API, use your knowledge of current ${leagueFilter} fixtures that have not yet started.` : ''}

TIME PERIOD: ${dayLabel} (${dateFrom} to ${dateTo}). Only include matches scheduled within this date range that have NOT yet kicked off.

Available UPCOMING fixtures (sorted by kickoff time):
${matchesSummary}

For each pick provide:
1. Match name
2. League
3. **Kickoff time** (UTC) — REQUIRED, e.g. "Sat 19:30 UTC"
4. Market & prediction (e.g., "Over 9.5 Corners", "Under 1.5 Goals", "Over 4.5 Goals", "BTTS Yes", "Home Win")
5. Estimated odds
6. Confidence (1-5 stars)
7. Brief reasoning (1-2 sentences)

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

    return new Response(JSON.stringify({
      picks,
      matchesUsed: filteredMatches.length,
      used: row?.used,
      daily_limit: row?.daily_limit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("generate-daily-slips error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
