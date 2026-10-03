import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
type Impact = "High" | "Medium" | "Low";

const MARKET_MAP: Record<string, string[]> = {
  USD: ["XAUUSD","EURUSD","USDJPY","NAS100","US500"],
  EUR: ["EURUSD"], GBP: ["GBPUSD"], JPY: ["USDJPY"],
  AUD: ["SYNTHETICS"], NZD: ["SYNTHETICS"], CAD: ["XAUUSD"],
  CNY: ["XAUUSD","SYNTHETICS"]
};

function phaseFor(time:string) {
  const mins = (new Date(time).getTime() - Date.now()) / 60000;
  if (mins <= -30) return "PASSED";
  if (mins < 0) return "POST-NEWS";
  if (mins <= 5) return "NEWS MODE";
  if (mins <= 60) return "APPROACHING";
  return "UPCOMING";
}
function strategyFor(phase:string, impact:Impact) {
  if (phase === "NEWS MODE") return "PAUSE & REFRESH";
  if (phase === "POST-NEWS") return "REASSESS";
  if (impact === "High" && phase === "APPROACHING") return "CAUTION";
  return "NORMAL";
}
function eventKey(e:any) {
  return (String(e.scheduledAt)+ "|" + String(e.source||"xoomar") + "|" + String(e.eventName||""))
    .toLowerCase().replace(/[^a-z0-9|:-]/g, "-");
}
function impactFor(value:string):Impact {
  const raw = String(value||"medium").toLowerCase();
  return raw === "high" ? "High" : raw === "low" ? "Low" : "Medium";
}

Deno.serve(async (req)=>{
  if(req.method === "OPTIONS") return new Response(null,{headers:corsHeaders});
  try {
    // XOOMAR is free and requires no API key for the base calendar endpoint.
    const today = new Date();
    const end = new Date(today.getTime() + 30*24*3600*1000);
    const fmt = (d:Date) => d.toISOString().slice(0,10);

    const url = "https://xoomar.com/api/markets/calendar?from=" + fmt(today) + "&to=" + fmt(end);
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error("XOOMAR returned " + response.status);
    const json = await response.json();

    const events = (json?.data ?? [])
      .filter((e:any) => ["high","med","medium"].includes(String(e.importance||"medium").toLowerCase()))
      .map((e:any) => {
        const impact = impactFor(e.importance);
        const eventTime = e.scheduledAt;
        const phase = phaseFor(eventTime);
        // XOOMAR's US calendar is USD-denominated; keep country explicit.
        const currency = "USD";
        const affectedMarkets = MARKET_MAP[currency];
        return {
          event_key: eventKey(e),
          event_time: eventTime,
          country: "US",
          currency,
          event_name: e.eventName ?? "Economic event",
          impact,
          actual: e.actual ?? null,
          forecast: e.forecast ?? null,
          previous: e.previous ?? null,
          unit: e.unit ?? null,
          phase,
          strategy_state: strategyFor(phase, impact),
          affected_markets: affectedMarkets,
          source: "xoomar",
          refreshed_at: new Date().toISOString()
        };
      })
      .filter((e:any) => e.phase !== "PASSED")
      .sort((a:any,b:any) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime());

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let persisted = false;
    if (supabaseUrl && serviceRole) {
      const admin = createClient(supabaseUrl, serviceRole, {auth:{persistSession:false}});
      const {error} = await admin.from("news_intelligence_events").upsert(events,{onConflict:"event_key"});
      if(error) console.error("news state upsert failed",error); else persisted = true;
    }

    const active = events.filter((e:any) => e.phase === "NEWS MODE");
    return new Response(JSON.stringify({
      ok:true, generated_at:new Date().toISOString(), persisted,
      source:"xoomar", worker_state:active.length ? "NEWS MODE" : "NORMAL",
      events:events.slice(0,250).map((e:any)=>({
        id:e.event_key,time:e.event_time,country:e.country,currency:e.currency,
        event:e.event_name,impact:e.impact,actual:e.actual,estimate:e.forecast,
        prev:e.previous,unit:e.unit,phase:e.phase,affectedMarkets:e.affected_markets,
        strategyState:e.strategy_state
      }))
    }),{headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}});
  } catch(error:any) {
    return new Response(JSON.stringify({ok:false,error:error?.message||"News worker failed"}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
  }
});