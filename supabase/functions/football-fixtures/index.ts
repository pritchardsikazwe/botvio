import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY") || "";
const BASE = "https://api.football-data.org/v4";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, competitionId, matchday, dateFrom, dateTo } = await req.json();

    if (!API_KEY) {
      throw new Error("FOOTBALL_DATA_API_KEY not configured");
    }

    const headers = { "X-Auth-Token": API_KEY };
    let url = "";

    switch (action) {
      case "fixtures": {
        // Get upcoming matches — optionally filter by competition
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (competitionId) {
          url = `${BASE}/competitions/${competitionId}/matches?${params}`;
        } else {
          url = `${BASE}/matches?${params}`;
        }
        break;
      }
      case "standings": {
        if (!competitionId) throw new Error("competitionId required");
        url = `${BASE}/competitions/${competitionId}/standings`;
        break;
      }
      case "match": {
        const { matchId } = await req.json().catch(() => ({}));
        if (!matchday) throw new Error("matchId required");
        url = `${BASE}/matches/${matchday}`;
        break;
      }
      case "competitions": {
        url = `${BASE}/competitions?plan=TIER_ONE`;
        break;
      }
      case "team_matches": {
        const { teamId } = await req.json().catch(() => ({}));
        const p = new URLSearchParams({ status: "FINISHED", limit: "10" });
        url = `${BASE}/teams/${teamId || 1}/matches?${p}`;
        break;
      }
      default:
        // Default: today's matches
        url = `${BASE}/matches`;
    }

    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Football-Data API ${resp.status}: ${errText}`);
    }

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Football fixtures error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
