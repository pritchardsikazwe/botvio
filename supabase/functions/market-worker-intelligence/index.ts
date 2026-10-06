import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";

type Candle={epoch:number;open:number;high:number;low:number;close:number};
type Direction="BUY"|"SELL"|"NEUTRAL";

const CORE_SYMBOLS=[
  {symbol:"frxXAUUSD",worker:"gold"},
  {symbol:"cryBTCUSD",worker:"bitcoin"},
  {symbol:"frxXAGUSD",worker:"commodity"},
  {symbol:"frxEURUSD",worker:"forex"},
  {symbol:"frxGBPUSD",worker:"forex"},
  {symbol:"frxUSDJPY",worker:"forex"},
  {symbol:"frxAUDUSD",worker:"forex"},
  {symbol:"cryETHUSD",worker:"crypto"},
  {symbol:"OTC_NDX",worker:"index"},
  {symbol:"OTC_DJI",worker:"index"},
  {symbol:"OTC_SPX",worker:"index"},
  {symbol:"OTC_DAX",worker:"index"},
  {symbol:"OTC_FTSE",worker:"index"},
  {symbol:"OTC_OIL",worker:"commodity"},
  {symbol:"OTC_BRENT",worker:"commodity"}
] as const;
const FRAMES=[{tf:"1m",g:60,n:220},{tf:"5m",g:300,n:220},{tf:"15m",g:900,n:180},{tf:"1H",g:3600,n:160},{tf:"1D",g:86400,n:180}];

function ema(a:number[],p:number){if(a.length<p)return null;let e=a.slice(0,p).reduce((x,y)=>x+y,0)/p,k=2/(p+1);for(let i=p;i<a.length;i++)e+=(a[i]-e)*k;return e}
function atr(c:Candle[],p=14){if(c.length<=p)return null;const tr=c.slice(1).map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-c[i].close),Math.abs(x.low-c[i].close)));return tr.slice(-p).reduce((a,b)=>a+b,0)/Math.min(p,tr.length)}
function rsi(c:Candle[],p=14){if(c.length<=p)return null;let g=0,l=0;for(let i=c.length-p;i<c.length;i++){const d=c[i].close-c[i-1].close;if(d>0)g+=d;else l-=d}if(l===0)return 100;return 100-100/(1+(g/p)/(l/p))}
function structure(c:Candle[]){const recent=c.slice(-60);if(recent.length<20)return "INSUFFICIENT";const highs=recent.map(x=>x.high),lows=recent.map(x=>x.low);const h1=Math.max(...highs.slice(0,30)),h2=Math.max(...highs.slice(-30)),l1=Math.min(...lows.slice(0,30)),l2=Math.min(...lows.slice(-30));if(h2>h1&&l2>l1)return "HIGHER_HIGH_HIGHER_LOW";if(h2<h1&&l2<l1)return "LOWER_HIGH_LOWER_LOW";return "RANGE";
}
function strategies(c:Candle[],dir:Direction,tf:string){if(c.length<25)return [];const x=c.at(-1)!,p=c.slice(-21,-1),hi=Math.max(...p.map(z=>z.high)),lo=Math.min(...p.map(z=>z.low)),a=atr(c)??0,body=Math.abs(x.close-x.open),upper=x.high-Math.max(x.open,x.close),lower=Math.min(x.open,x.close)-x.low,out:string[]=[];if(dir==="BUY"&&x.close>hi||dir==="SELL"&&x.close<lo)out.push("BREAKOUT");if(dir==="BUY"&&Math.abs(x.low-lo)<=a*.4)out.push("SUPPORT");if(dir==="SELL"&&Math.abs(x.high-hi)<=a*.4)out.push("RESISTANCE");if(dir==="BUY"&&lower>body*1.2)out.push("REJECTION");if(dir==="SELL"&&upper>body*1.2)out.push("REJECTION");const cl=c.map(z=>z.close),e9=ema(cl,9),e21=ema(cl,21),e50=ema(cl,50);if((dir==="BUY"&&e9!=null&&e21!=null&&e50!=null&&e9>e21&&e21>e50)||(dir==="SELL"&&e9!=null&&e21!=null&&e50!=null&&e9<e21&&e21<e50))out.push("TREND");if(["1m","5m","15m"].includes(tf))out.push("SCALPING");return [...new Set(out)];
}
function analyse(c:Candle[],tf:string,worker:string){if(c.length<60)return null;const cl=c.map(x=>x.close),last=c.at(-1)!,e9=ema(cl,9),e21=ema(cl,21),e50=ema(cl,50),rs=rsi(c),a=atr(c);if(e9==null||e21==null||e50==null||rs==null||a==null||a<=0)return null;let dir:Direction="NEUTRAL";if(e9>e21&&last.close>e50&&rs>=45&&rs<=78)dir="BUY";if(e9<e21&&last.close<e50&&rs>=22&&rs<=55)dir="SELL";const s=structure(c),p=c.slice(-21,-1),support=Math.min(...p.map(x=>x.low)),resistance=Math.max(...p.map(x=>x.high));const breakout=(dir==="BUY"&&last.close>resistance)||(dir==="SELL"&&last.close<support);const vol=(last.high-last.low)/a;let score=dir==="NEUTRAL"?50:70;if(breakout)score+=8;if((worker==="gold"||worker==="bitcoin")&&vol>1.2)score+=5;if((dir==="BUY"&&s==="HIGHER_HIGH_HIGHER_LOW")||(dir==="SELL"&&s==="LOWER_HIGH_LOWER_LOW"))score+=8;score=Math.min(96,score);const regime=breakout?"BREAKOUT":s==="RANGE"?"RANGE":vol>1.8?"HIGH_VOLATILITY": "TRENDING";return {direction:dir,confidence:score,market_regime:regime,structure:s,support,resistance,breakout_level:breakout?(dir==="BUY"?resistance:support):null,rejection_level:dir==="BUY"?support:dir==="SELL"?resistance:null,atr:a,strategy_types:strategies(c,dir,tf),payload:{worker,tf,last_close:last.close,ema9:e9,ema21:e21,ema50:e50,rsi:rs,volatility_ratio:vol}};
}
function req(ws:WebSocket,payload:Record<string,unknown>,timeout=15000){return new Promise<any>((resolve,reject)=>{const id=Math.floor(Math.random()*1e9),t=setTimeout(()=>{ws.removeEventListener("message",h);reject(new Error("Deriv request timeout"))},timeout);const h=(e:MessageEvent)=>{try{const d=JSON.parse(String(e.data));if(d.req_id!==id)return;clearTimeout(t);ws.removeEventListener("message",h);if(d.error)reject(new Error(d.error.message));else resolve(d)}catch{}};ws.addEventListener("message",h);ws.send(JSON.stringify({...payload,req_id:id}))})}
async function activeSymbols(ws:WebSocket){
  const d=await req(ws,{active_symbols:"full"});
  return (d.active_symbols??[]).map((x:any)=>({
    symbol:String(x.underlying_symbol||x.symbol||""),
    name:String(x.underlying_symbol_name||x.display_name||""),
    type:String(x.underlying_symbol_type||x.symbol_type||""),
    market:String(x.market||""),
    submarket:String(x.submarket||""),
    subgroup:String(x.subgroup||""),
    open:Number(x.exchange_is_open??1),
    suspended:Number(x.is_trading_suspended??0)
  })).filter((x:any)=>x.symbol && !x.suspended);
}
function classifyActive(x:any){
  const s=[x.symbol,x.name,x.type,x.market,x.submarket,x.subgroup].join(" ").toLowerCase();
  if(x.type==="synthetic_index" || /synthetic|volatility|boom|crash|step|jump|range.?break|drift|bull|bear|dex/.test(s)) return "synthetic";
  if(/gold|xau/.test(s)) return "gold";
  if(/bitcoin|btc/.test(s)) return "bitcoin";
  if(/silver|xag|oil|brent/.test(s)) return "commodity";
  if(/ethereum|eth|crypto/.test(s)) return "crypto";
  if(/forex|eur|gbp|jpy|aud|usd|cad|chf|nzd/.test(s)) return "forex";
  if(/index|nas|dow|spx|dax|ftse|otc/.test(s)) return "index";
  return "";
}
async function candles(ws:WebSocket,symbol:string,granularity:number,count:number){const d=await req(ws,{ticks_history:symbol,end:"latest",style:"candles",granularity,count,adjust_start_time:1});return (d.candles??[]).map((x:any)=>({epoch:Number(x.epoch),open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close)})).filter((x:Candle)=>Number.isFinite(x.close))}
Deno.serve(async req0=>{if(req0.method!=="POST")return new Response("POST required",{status:405});if(!assertAutomationKey(req0))return new Response(JSON.stringify({success:false,error:"Unauthorized automation trigger"}),{status:401});const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);const body=await req0.json().catch(()=>({}));const wanted=body?.symbol as string|undefined;
const ws=new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error("WebSocket timeout")),12000);ws.addEventListener("open",()=>{clearTimeout(t);resolve()},{once:true});ws.addEventListener("error",()=>{clearTimeout(t);reject(new Error("WebSocket failed"))},{once:true})});const started=new Date().toISOString(),results:any[]=[];
try{
 const discovered=await activeSymbols(ws);
 const dynamic=discovered.map((x:any)=>({symbol:x.symbol,worker:classifyActive(x)})).filter((x:any)=>x.worker);
 const merged=[...CORE_SYMBOLS,...dynamic.filter((x:any)=>!CORE_SYMBOLS.some((c:any)=>c.symbol===x.symbol))];
 const synthetic=merged.filter((x:any)=>x.worker==="synthetic").slice(0,30);
 const preferred=merged.filter((x:any)=>x.worker!=="synthetic");
 const list=wanted?merged.filter(x=>x.symbol===wanted):[...preferred,...synthetic];
 for(const p of list){for(const f of FRAMES){try{const c=await candles(ws,p.symbol,f.g,f.n);const a=analyse(c,f.tf,p.worker);if(!a)continue;results.push({symbol:p.symbol,worker:p.worker,timeframe:f.tf,...a});}catch(e){results.push({symbol:p.symbol,worker:p.worker,timeframe:f.tf,error:String(e)})}}}const rows=results.filter(x=>!x.error).flatMap(x=>{
 const base={...x,observed_at:new Date().toISOString(),expires_at:new Date(Date.now()+60*60*1000).toISOString()};
 const names:string[]=[];
 if(["1H","1D"].includes(x.timeframe)) names.push("htf");
 names.push(x.worker);
 if(x.worker==="gold") names.push("gold_structure","gold_volatility","gold_breakout");
 if(x.worker==="bitcoin") names.push("bitcoin_structure","bitcoin_momentum","bitcoin_volatility");
 for(const s of x.strategy_types??[]) names.push(s.toLowerCase());
 names.push("market_regime","market_memory","risk","confluence","validation");
 return [...new Set(names)].map(worker=>({...base,worker}));
});if(rows.length){const {error}=await db.from("market_worker_insights").insert(rows);if(error)throw error;}
 await db.from("market_worker_runs").insert({worker:"market-worker-intelligence",symbols_processed:list.length,insights_written:rows.length,errors:results.filter(x=>x.error).length,started_at:started,finished_at:new Date().toISOString(),payload:{discovered_symbols:discovered.length,timeframes:FRAMES.map(x=>x.tf),synthetic_symbols:list.filter((x:any)=>x.worker==="synthetic").map((x:any)=>x.symbol)}});
try{ws.close()}catch{}return new Response(JSON.stringify({success:true,started_at:started,finished_at:new Date().toISOString(),discovered_symbols:discovered.length,processed_symbols:list.length,synthetic_symbols:synthetic.length,workers:["htf","gold","bitcoin","forex","synthetic","index","crypto","commodity","trend","trendline","support","resistance","breakout","breakout_retest","rejection","scalping","momentum","range","fakeout","pullback","reversal","confluence","risk","validation","market_regime","market_memory"],insights:rows.length}),{headers:{"Content-Type":"application/json"}})}catch(e){try{ws.close()}catch{}return new Response(JSON.stringify({success:false,error:String(e)}),{status:500,headers:{"Content-Type":"application/json"}})}});
