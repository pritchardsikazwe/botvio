import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
type Impact = "High" | "Medium" | "Low";
const MARKET_MAP: Record<string, string[]> = { USD:["XAUUSD","EURUSD","USDJPY","NAS100","US500"], EUR:["EURUSD"], GBP:["GBPUSD"], JPY:["USDJPY"], AUD:["SYNTHETICS"], NZD:["SYNTHETICS"], CAD:["XAUUSD"], CNY:["XAUUSD","SYNTHETICS"] };
function phaseFor(time:string){ const mins=(new Date(time).getTime()-Date.now())/60000; if(mins<=-30)return "PASSED"; if(mins<=15)return "POST-NEWS"; if(mins<=5)return "NEWS MODE"; if(mins<=60)return "APPROACHING"; return "UPCOMING"; }
function strategyFor(phase:string,impact:Impact){ if(phase==="NEWS MODE")return "PAUSE & REFRESH"; if(phase==="POST-NEWS")return "REASSESS"; if(impact==="High"&&phase==="APPROACHING")return "CAUTION"; return "NORMAL"; }
function currencyFor(country=""){ const map:Record<string,string>={US:"USD",GB:"GBP",EU:"EUR",JP:"JPY",AU:"AUD",NZ:"NZD",CA:"CAD",CN:"CNY"}; return map[country]||country||"—"; }
function eventKey(e:any){ return (String(e.time)+"|"+String(e.country||"")+"|"+String(e.currency||"")+"|"+String(e.event||"")).toLowerCase().replace(/[^a-z0-9|:-]/g,"-"); }
Deno.serve(async (req)=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:corsHeaders});
 try{
  const apiKey=Deno.env.get("FINNHUB_API_KEY"); if(!apiKey)throw new Error("FINNHUB_API_KEY missing");
  const today=new Date(), end=new Date(today.getTime()+30*24*3600*1000), fmt=(d:Date)=>d.toISOString().slice(0,10);
  const response=await fetch("https://finnhub.io/api/v1/calendar/economic?from="+fmt(today)+"&to="+fmt(end)+"&token="+apiKey);
  if(!response.ok)throw new Error("Finnhub returned "+response.status);
  const json=await response.json();
  const events=(json?.economicCalendar??[]).filter((e:any)=>["high","medium"].includes((e.impact??"medium").toLowerCase())).map((e:any)=>{
   const raw=(e.impact??"medium").toLowerCase(); const impact=(["high","medium","low"].includes(raw)?raw.charAt(0).toUpperCase()+raw.slice(1):"Medium") as Impact;
   const currency=currencyFor(e.country), phase=phaseFor(e.time), affectedMarkets=MARKET_MAP[currency]||["SYNTHETICS"];
   return {event_key:eventKey({...e,currency}),event_time:e.time,country:e.country??null,currency,event_name:e.event??"Economic event",impact,actual:e.actual??null,forecast:e.estimate??null,previous:e.prev??null,unit:e.unit??null,phase,strategy_state:strategyFor(phase,impact),affected_markets:affectedMarkets,source:"finnhub",refreshed_at:new Date().toISOString()};
  }).filter((e:any)=>e.phase!=="PASSED").sort((a:any,b:any)=>new Date(a.event_time).getTime()-new Date(b.event_time).getTime());
  const supabaseUrl=Deno.env.get("SUPABASE_URL"), serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); let persisted=false;
  if(supabaseUrl&&serviceRole){ const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false}}); const {error}=await admin.from("news_intelligence_events").upsert(events,{onConflict:"event_key"}); if(error)console.error("news state upsert failed",error); else persisted=true; }
  const active=events.filter((e:any)=>e.phase==="NEWS MODE");
  return new Response(JSON.stringify({ok:true,generated_at:new Date().toISOString(),persisted,worker_state:active.length?"NEWS MODE":"NORMAL",events:events.slice(0,250).map((e:any)=>({id:e.event_key,time:e.event_time,country:e.country,currency:e.currency,event:e.event_name,impact:e.impact,actual:e.actual,estimate:e.forecast,prev:e.previous,unit:e.unit,phase:e.phase,affectedMarkets:e.affected_markets,strategyState:e.strategy_state}))}),{headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}});
 }catch(error:any){ return new Response(JSON.stringify({ok:false,error:error?.message||"News worker failed"}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}}); }
});