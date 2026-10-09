import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";import { loadPerformanceIndex, performanceGate } from "../_shared/performanceGate.ts";
async function decryptSecret(enc:string,secret:string):Promise<string>{const bytes=Uint8Array.from(atob(enc.replace(/^v1:/,"")),(c)=>c.charCodeAt(0));const raw=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret));const k=await crypto.subtle.importKey("raw",raw,"AES-GCM",false,["decrypt"]);const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12)},k,bytes.slice(12));return new TextDecoder().decode(pt)}
type Candle={time:number;open:number;high:number;low:number;close:number};
const FAMILIES=[
{symbols:["GainX 400","GainX 600","GainX 800","GainX 999","GainX 1200"],family:"GainX",bias:"SELL"},
{symbols:["PainX 400","PainX 600","PainX 800","PainX 999","PainX 1200"],family:"PainX",bias:"BUY"},
{symbols:["FlipX 1","FlipX 2","FlipX 3","FlipX 4","FlipX 5"],family:"FlipX",bias:"BOTH"},
{symbols:["SwitchX 600","SwitchX 1200","SwitchX 1800"],family:"SwitchX",bias:"BOTH"},
{symbols:["BreakX 600","BreakX 1200","BreakX 1800"],family:"BreakX",bias:"BOTH"},
{symbols:["TrendX 600","TrendX 1200","TrendX 1800"],family:"TrendX",bias:"BOTH"},
{symbols:["FX VOL 20","FX VOL 40","FX VOL 60","FX VOL 80","FX VOL 99"],family:"FX Vol.",bias:"BOTH"},
{symbols:["SFX VOL 20","SFX VOL 40","SFX VOL 60","SFX VOL 80","SFX VOL 99"],family:"SFX Vol.",bias:"BOTH"}
];
const STRATEGY_BY_SYMBOL:Record<string,{min:number;stop:number;target:number;label:string}>={
  "Boom 300 Index":{min:77,stop:1.15,target:2.35,label:"Boom 300 Spike Hunter"},
  "Boom 500 Index":{min:79,stop:1.15,target:2.35,label:"Boom 500 Spike Hunter"},
  "Boom 600 Index":{min:79,stop:1.15,target:2.35,label:"Boom 600 Spike Hunter"},
  "Boom 900 Index":{min:82,stop:1.15,target:2.35,label:"Boom 900 Spike Hunter"},
  "Boom 1000 Index":{min:82,stop:1.15,target:2.35,label:"Boom 1000 Spike Hunter"},
  "Crash 300 Index":{min:77,stop:1.15,target:2.35,label:"Crash 300 Spike Hunter"},
  "Crash 500 Index":{min:79,stop:1.15,target:2.35,label:"Crash 500 Spike Hunter"},
  "Crash 600 Index":{min:79,stop:1.15,target:2.35,label:"Crash 600 Spike Hunter"},
  "Crash 900 Index":{min:82,stop:1.15,target:2.35,label:"Crash 900 Spike Hunter"},
  "Crash 1000 Index":{min:82,stop:1.15,target:2.35,label:"Crash 1000 Spike Hunter"},
  "Volatility 10 Index":{min:76,stop:1.35,target:2.5,label:"Volatility 10 Momentum"},
  "Volatility 25 Index":{min:76,stop:1.35,target:2.5,label:"Volatility 25 Momentum"},
  "Volatility 50 Index":{min:76,stop:1.35,target:2.5,label:"Volatility 50 Momentum"},
  "Volatility 75 Index":{min:76,stop:1.35,target:2.5,label:"Volatility 75 Momentum"},
  "Volatility 100 Index":{min:79,stop:1.5,target:2.75,label:"Volatility 100 Momentum"},
  "Volatility 150 Index":{min:79,stop:1.5,target:2.75,label:"Volatility 150 Momentum"},
  "Volatility 250 Index":{min:79,stop:1.5,target:2.75,label:"Volatility 250 Momentum"},
  "Volatility 10 (1s) Index":{min:82,stop:1.5,target:2.75,label:"Volatility 10 1s Momentum"},
  "Volatility 15 (1s) Index":{min:82,stop:1.5,target:2.75,label:"Volatility 15 1s Momentum"},
  "Volatility 30 (1s) Index":{min:82,stop:1.5,target:2.75,label:"Volatility 30 1s Momentum"},
  "Volatility 50 (1s) Index":{min:82,stop:1.5,target:2.75,label:"Volatility 50 1s Momentum"},
  "Volatility 75 (1s) Index":{min:82,stop:1.5,target:2.75,label:"Volatility 75 1s Momentum"},
  "Volatility 90 (1s) Index":{min:82,stop:1.5,target:2.75,label:"Volatility 90 1s Momentum"},
  "Volatility 100 (1s) Index":{min:82,stop:1.5,target:2.75,label:"Volatility 100 1s Momentum"},
  "Range Break 100 Index":{min:78,stop:1.25,target:2.5,label:"Range Break 100 Expansion"},
  "Range Break 200 Index":{min:78,stop:1.25,target:2.5,label:"Range Break 200 Expansion"},
  "GainX 400":{min:74,stop:1.4,target:2.2,label:"GainX 400 Adaptive MTF"},
  "GainX 600":{min:74,stop:1.4,target:2.2,label:"GainX 600 Adaptive MTF"},
  "GainX 800":{min:74,stop:1.4,target:2.2,label:"GainX 800 Adaptive MTF"},
  "PainX 400":{min:74,stop:1.4,target:2.2,label:"PainX 400 Adaptive MTF"},
  "PainX 600":{min:74,stop:1.4,target:2.2,label:"PainX 600 Adaptive MTF"},
  "PainX 800":{min:74,stop:1.4,target:2.2,label:"PainX 800 Adaptive MTF"},
  "FlipX 1":{min:74,stop:1.4,target:2.2,label:"FlipX 1 Adaptive MTF"},
  "FlipX 2":{min:74,stop:1.4,target:2.2,label:"FlipX 2 Adaptive MTF"},
  "FlipX 3":{min:74,stop:1.4,target:2.2,label:"FlipX 3 Adaptive MTF"},
  "FlipX 4":{min:74,stop:1.4,target:2.2,label:"FlipX 4 Adaptive MTF"},
  "FlipX 5":{min:74,stop:1.4,target:2.2,label:"FlipX 5 Adaptive MTF"},
  "SwitchX 600":{min:74,stop:1.4,target:2.2,label:"SwitchX 600 Adaptive MTF"},
  "SwitchX 1200":{min:74,stop:1.4,target:2.2,label:"SwitchX 1200 Adaptive MTF"},
  "SwitchX 1800":{min:74,stop:1.4,target:2.2,label:"SwitchX 1800 Adaptive MTF"},
  "FX VOL 20":{min:74,stop:1.4,target:2.2,label:"FX VOL 20 Adaptive MTF"},
  "FX VOL 40":{min:74,stop:1.4,target:2.2,label:"FX VOL 40 Adaptive MTF"},
  "FX VOL 80":{min:74,stop:1.4,target:2.2,label:"FX VOL 80 Adaptive MTF"}
};
const TF:Record<string,number>={M1:1,M5:5,M15:15,H1:60,D1:1440,D3:1440};

function aggregateDays(c:Candle[],days:number):Candle[]{
 if(days<=1)return c;
 const buckets=new Map<number,Candle>();
 for(const x of c){
   const bucket=Math.floor(x.time/(86400*days))*(86400*days);
   const prev=buckets.get(bucket);
   if(!prev)buckets.set(bucket,{time:bucket,open:x.open,high:x.high,low:x.low,close:x.close});
   else {prev.high=Math.max(prev.high,x.high);prev.low=Math.min(prev.low,x.low);prev.close=x.close;}
 }
 return [...buckets.values()].sort((a,b)=>a.time-b.time);
}
function ema(a:number[],p:number){if(a.length<p)return null;let e=a.slice(0,p).reduce((x,y)=>x+y,0)/p,k=2/(p+1);for(let i=p;i<a.length;i++)e=(a[i]-e)*k+e;return e}
function atr(c:Candle[],p=14){if(c.length<=p)return null;const tr=c.slice(1).map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-c[i].close),Math.abs(x.low-c[i].close)));return tr.slice(-p).reduce((a,b)=>a+b,0)/Math.min(p,tr.length)}
function rsi(c:Candle[],p=14){if(c.length<=p)return null;let g=0,l=0;for(let i=c.length-p;i<c.length;i++){const d=c[i].close-c[i-1].close;if(d>0)g+=d;else l-=d}if(l===0)return 100;return 100-100/(1+(g/p)/(l/p))}
function directionalBias(c:Candle[]):"BUY"|"SELL"|null{
 if(c.length<60)return null;
 const closes=c.map(x=>x.close),last=c.at(-1)!;
 const e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50),rs=rsi(c);
 if(e9==null||e21==null||e50==null||rs==null)return null;
 if(e9>e21&&last.close>e50&&rs>=45&&rs<=75)return "BUY";
 if(e9<e21&&last.close<e50&&rs>=25&&rs<=55)return "SELL";
 return null;
}
function candleQuality(c:Candle[]):number{
 const last=c.at(-1)!;const a=atr(c)??0;const range=last.high-last.low;
 if(!a||range<=0)return 0;
 const body=Math.abs(last.close-last.open),ratio=body/range;
 if(range>a*2.0)return -6;
 if(ratio>=0.55&&range>=a*0.6)return 4;
 if(ratio>=0.35)return 2;
 return 0;
}

function frameSignal(c:Candle[],bias:string,profile:{min:number;stop:number;target:number;label:string}){if(c.length<60)return null;const closes=c.map(x=>x.close),e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50),a=atr(c),rs=rsi(c),last=c.at(-1)!;if(e9==null||e21==null||a==null||a<=0||rs==null)return null;const up=e9>e21&&(e50==null||last.close>e50),down=e9<e21&&(e50==null||last.close<e50),expanded=last.high-last.low>a*1.8;let d:null|"BUY"|"SELL"=null;if(bias==="BUY"&&up&&!expanded)d="BUY";if(bias==="SELL"&&down&&!expanded)d="SELL";if(bias==="BOTH"){const hi=Math.max(...c.slice(-20,-1).map(x=>x.high)),lo=Math.min(...c.slice(-20,-1).map(x=>x.low));if(rs<32&&last.close<lo+a*.5)d="BUY";else if(rs>68&&last.close>hi-a*.5)d="SELL";else if(up&&!expanded)d="BUY";else if(down&&!expanded)d="SELL"}if(!d)return null;const dbias=directionalBias(c);const alignment=dbias===d?6:dbias?-5:0;const score=Math.min(96,60+(up||down?8:0)+(d==="BUY"&&rs>50&&rs<75?6:d==="SELL"&&rs<50&&rs>25?6:0)+(expanded?5:0)+alignment+candleQuality(c));if(score<profile.min)return null;return{direction:d,score,entry:last.close,sl:d==="BUY"?last.close-a*profile.stop:last.close+a*profile.stop,tp:d==="BUY"?last.close+a*profile.target:last.close-a*profile.target}}
function moderateLevels(c:Candle[],direction:"BUY"|"SELL",tf:string){
 const a=atr(c)??0;
 const m=tf==="1m"?{sl:.90,tp:1.35}:tf==="5m"?{sl:.95,tp:1.45}:tf==="15m"?{sl:1.00,tp:1.60}:tf==="1H"?{sl:1.15,tp:1.85}:tf==="1D"?{sl:1.30,tp:2.10}:{sl:1.50,tp:2.30};
 const entry=c.at(-1)!.close;
 return {sl:direction==="BUY"?entry-a*m.sl:entry+a*m.sl,tp:direction==="BUY"?entry+a*m.tp:entry-a*m.tp};
}
function strategyTypes(c:Candle[],direction:"BUY"|"SELL",tf:string){
 const out:string[]=[]; if(c.length<25)return out;
 const last=c.at(-1)!; const prev=c.slice(-21,-1); const hi=Math.max(...prev.map(x=>x.high)); const lo=Math.min(...prev.map(x=>x.low)); const a=atr(c)??0;
 const body=Math.abs(last.close-last.open), range=last.high-last.low;
 const upper=last.high-Math.max(last.open,last.close), lower=Math.min(last.open,last.close)-last.low;
 const breakout=direction==="BUY"?last.close>hi:direction==="SELL"?last.close<lo:false;
 if(breakout && a>0) out.push("BREAKOUT");
 const nearSupport=a>0 && last.low<=lo+a*.35; const nearResistance=a>0 && last.high>=hi-a*.35;
 if(direction==="BUY" && nearSupport) out.push("SUPPORT");
 if(direction==="SELL" && nearResistance) out.push("RESISTANCE");
 if((direction==="BUY" && lower>body*1.25 && lower>upper) || (direction==="SELL" && upper>body*1.25 && upper>lower)) out.push("REJECTION");
 const closes=c.map(x=>x.close); const e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50);
 if(e9&&e21&&e50 && ((direction==="BUY"&&e9>e21&&e21>e50)||(direction==="SELL"&&e9<e21&&e21<e50))) out.push("TREND");
 if(e9&&e21 && ((direction==="BUY"&&last.close>e9&&e9>e21)||(direction==="SELL"&&last.close<e9&&e9<e21))) out.push("TRENDLINE");
 if(["1m","5m","15m"].includes(tf)) out.push("SCALPING");
 return [...new Set(out)];
}
async function workerConfluence(db:any,symbol:string,direction:"BUY"|"SELL"){
 const {data}=await db.from("market_worker_insights").select("worker,timeframe,direction,confidence,market_regime,structure,support,resistance,strategy_types")
   .eq("symbol",symbol).in("timeframe",["1H","1D"]).gt("expires_at",new Date().toISOString()).order("observed_at",{ascending:false}).limit(30);
 const rows=(data??[]) as any[];const latest=new Map<string,any>();
 for(const x of rows){const k=String(x.timeframe);if(!latest.has(k))latest.set(k,x);}
 const confirms=[latest.get("1H"),latest.get("1D")].filter(Boolean);
 const aligned=confirms.filter(x=>x.direction===direction).length;
 const conflict=confirms.some(x=>x.direction&&x.direction!==direction);
 const avg=confirms.length?Math.round(confirms.reduce((s,x)=>s+Number(x.confidence||0),0)/confirms.length):0;
 return {allow:!conflict&&(!confirms.length||aligned>0),bonus:aligned*4+(avg>=80?4:avg>=70?2:0)-(conflict?12:0),avg,regime:latest.get("1H")?.market_regime??latest.get("1D")?.market_regime??"UNKNOWN"};
}
function unwrap(x:unknown):unknown{if(x&&typeof x==="object"){const o=x as Record<string,unknown>;return o.data??x}return x}
function bars(x:unknown):Candle[]{const r=unwrap(x);const list=Array.isArray(r)?r:(r&&typeof r==="object"?Object.values(r as Record<string,unknown>).find(Array.isArray)??[]:[]);return(list as unknown[]).map(v=>{const b=v as Record<string,unknown>;const tv=b.time??b.Time??b.timestamp??b.Timestamp??0;let t=Number(tv);if(!Number.isFinite(t)||t===0)t=Date.parse(String(tv))||0;return{time:t>1e12?Math.floor(t/1000):t,open:Number(b.open??b.Open??b.openPrice??b.OpenPrice),high:Number(b.high??b.High??b.highPrice??b.HighPrice),low:Number(b.low??b.Low??b.lowPrice??b.LowPrice),close:Number(b.close??b.Close??b.closePrice??b.ClosePrice)}}).filter(x=>Number.isFinite(x.time)&&[x.open,x.high,x.low,x.close].every(Number.isFinite))}
async function api(base:string,key:string,path:string,q:Record<string,string|number|undefined>){const u=new URL(base+path);for(const[k,v]of Object.entries(q))if(v!==undefined)u.searchParams.set(k,String(v));const r=await fetch(u,{headers:{ApiKey:key,Accept:"application/json, text/plain"},signal:AbortSignal.timeout(20000)});const t=await r.text();let b:unknown=t;try{b=JSON.parse(t)}catch{}if(!r.ok)throw new Error(`API Studio ${r.status}`);return b}
Deno.serve(async(req)=>{if(req.method!=="POST")return new Response("POST required",{status:405});try{const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
if (!(await assertAutomationKey(req))) return new Response(JSON.stringify({ success: false, error: "Unauthorized automation trigger" }), { status: 401, headers: { "Content-Type": "application/json" } }); const performanceIndex = await loadPerformanceIndex(db);const key=Deno.env.get("MT5_API_STUDIO_API_KEY")||Deno.env.get("TRADECOPY_API_KEY");if(!key)throw new Error("MT5 API Studio API key is not configured");const base=(Deno.env.get("MT5_API_STUDIO_BASE_URL")||"https://mt5full3.mtapi.io").replace(/\/+$/,"");const body=await req.json().catch(()=>({}));const wanted=body?.symbol?String(body.symbol):null;const{data:connections,error}=await db.from("syntx_api_connections").select("*").eq("broker","Weltrade");if(error)throw new Error(error.message);const published:any[]=[];const diag:any[]=[];const tStart=Date.now();for(const c of (connections??[]).filter((x:any)=>x.connection_status!=="error"&&/weltrade/i.test(String(x.server||""))).slice(0,1)){let session=String(c.session_id||"");if(session){try{const chk=await api(base,key,"/Symbols",{id:session});const t=JSON.stringify(chk).slice(0,300);if(/INVALID_TOKEN|not found/i.test(t))session=""}catch{session=""}}try{if(!session){const pw=await decryptSecret(c.password_encrypted,Deno.env.get("TOKEN_ENCRYPTION_KEY")!);const id=crypto.randomUUID();const raw=await api(base,key,"/ConnectEx",{user:c.login,password:pw,server:c.server,id,connectTimeoutSeconds:60,connectTimeoutClusterMemberSeconds:20});session=typeof raw==="string"?raw.replace(/"/g,""):id;await db.from("syntx_api_connections").update({session_id:session,connection_status:"connected",last_error:null,last_connected_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",c.id)}}catch(e){await db.from("syntx_api_connections").update({connection_status:"error",last_error:String(e),updated_at:new Date().toISOString()}).eq("id",c.id);continue}
let brokerSymbols:string[]=[];try{const sr=unwrap(await api(base,key,"/Symbols",{id:session}));const arr=Array.isArray(sr)?sr:[];brokerSymbols=arr.map((x:any)=>typeof x==="string"?x:String(x?.symbol??x?.name??"")).filter(Boolean)}catch(e){diag.push({login:c.login,error:"Symbols: "+String(e)})}
try{const probe=await api(base,key,"/PriceHistory",{id:session,symbol:brokerSymbols.find(x=>/gainx\s*400/i.test(x))??"GainX 400",from:new Date(Date.now()-6*3600000).toISOString().slice(0,19),to:new Date().toISOString().slice(0,19),timeFrame:5});diag.unshift({probe:true,brokerSymbols:brokerSymbols.length,sample:brokerSymbols.filter(x=>/x/i.test(x)).slice(0,8),raw:JSON.stringify(probe).slice(0,200)})}catch(e){diag.unshift({probe:true,error:String(e)})}
const nk=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,"");const resolve=(r:string)=>brokerSymbols.find(s=>s.toLowerCase()===r.toLowerCase())??brokerSymbols.find(s=>nk(s)===nk(r))??r;
const families=wanted?FAMILIES.filter(f=>f.symbols.includes(wanted)):FAMILIES;const allSyms=families.flatMap(f=>f.symbols);const slot=Math.floor(Date.now()/300000)%4;const pick=new Set(wanted?allSyms:allSyms.filter((_,i)=>i%4===slot));const t0=Date.now();for(const f of families)for(const symbol of f.symbols){if(!pick.has(symbol))continue;if(Date.now()-t0>60000)break;const profile=STRATEGY_BY_SYMBOL[symbol]??{min:74,stop:1.4,target:2.2,label:`${f.family} Adaptive MTF`};const frames:any[]=(await Promise.all(Object.entries(TF).map(async([name,mins])=>{const out:any[]=[];try{
  const fetchMinutes=name==="D3"?1440:mins;
  const fetchBars=name==="D3"?300:500;
  const raw=bars(await api(base,key,"/PriceHistory",{id:session,symbol:resolve(symbol),from:new Date(Date.now()-fetchBars*fetchMinutes*60000).toISOString().slice(0,19),to:new Date().toISOString().slice(0,19),timeFrame:fetchMinutes}));
  const data=name==="D3"?aggregateDays(raw,3):raw;
  if(data.length<60&&diag.length<40)diag.push({symbol,resolved:resolve(symbol),tf:name,error:`only ${data.length} usable candles`});out.push({n:name,data,sig:frameSignal(data,f.bias,profile)});
}catch(e){if(diag.length<40)diag.push({symbol,resolved:resolve(symbol),tf:name,error:String(e)});out.push({n:name,sig:null})}return out}))).flat();

const get=(name:string)=>frames.find(x=>x.n===name)?.sig??null;
const bias15=get("M15"), biasH1=get("H1"), biasD1=get("D1"), biasD3=get("D3"), scalp=get("M1"), scalp5=get("M5");
const setups=[
  {tf:"1m",label:"SCALPING 1M",type:"SCALPING",setup:scalp,confirm:[bias15,biasH1],min:Math.max(profile.min,78),expiry:300,backup:600},
  {tf:"5m",label:"SCALPING 5M",type:"SCALPING",setup:scalp5,confirm:[bias15,biasH1],min:Math.max(profile.min,77),expiry:900,backup:1800},
  {tf:"15m",label:"SCALPING/INTRADAY 15M",type:"SCALPING_INTRADAY",setup:bias15,confirm:[biasH1,biasD1],min:Math.max(profile.min,profile.min+1),expiry:3600,backup:5400},
  {tf:"1H",label:"SWING 1H",type:"SWING",setup:biasH1,confirm:[biasD1],min:Math.max(profile.min,profile.min+2),expiry:14400,backup:21600},
  {tf:"1D",label:"POSITION 1D",type:"POSITION",setup:biasD1,confirm:[],min:Math.max(profile.min,profile.min+4),expiry:259200,backup:432000},
  {tf:"3D",label:"POSITION 3D",type:"POSITION",setup:biasD3,confirm:[biasD1],min:Math.max(profile.min,profile.min+3),expiry:777600,backup:1209600}
];

for(const plan of setups){
  if(!plan.setup) continue;
  const worker=await workerConfluence(db,symbol,plan.setup.direction);
  if(!worker.allow) continue;
  plan.setup.score=Math.min(96,plan.setup.score+worker.bonus);

  const confirmationDirections=plan.confirm.map((sig:any,index:number)=>{
    if(sig?.direction) return sig.direction;
    const names=plan.tf==="1m"?["M15","H1"]:plan.tf==="15m"?["H1","D1"]:plan.tf==="1H"?["D1"]:plan.tf==="3D"?["D1"]:[];
    const name=names[index];
    const frame=frames.find((x:any)=>x.n===name)?.data??[];
    return directionalBias(frame);
  }).filter(Boolean) as ("BUY"|"SELL")[];
  const same=confirmationDirections.filter(x=>x===plan.setup.direction).length;
  const conflict=confirmationDirections.some(x=>x!==plan.setup.direction);
  if(conflict) continue;
  const required=plan.tf==="1m"?1:plan.tf==="15m"?1:plan.tf==="1H"?1:plan.tf==="3D"?1:0;
  if(same<required || plan.setup.score<plan.min) continue;
  const entry=plan.setup.entry;
  const sourceFrame=frames.find((x:any)=>x.n===plan.tf);
  const sourceCandle=sourceFrame?.data?.at(-1)??null;
  const candleTime=Number(sourceCandle?.time??0);
  const tfSeconds=plan.tf==="1m"?60:plan.tf==="5m"?300:plan.tf==="15m"?900:plan.tf==="1H"?3600:plan.tf==="1D"?86400:259200;
  const candleClosed=Boolean(candleTime>0 && candleTime+tfSeconds<=Math.floor(Date.now()/1000));
  const levels=moderateLevels(sourceFrame?.data??sourceFrame?.candles??[],plan.setup.direction,plan.tf);
  const sl=levels.sl,tp=levels.tp;
  const detectedStrategies=strategyTypes(frames.find((x:any)=>x.n===plan.tf)?.data??[],plan.setup.direction,plan.tf);
  const strategyLabels=detectedStrategies.length?detectedStrategies:["TREND"];
  const strategyLabel=`${profile.label} · ${plan.label} · ${strategyLabels.join(" + ")}`;
  const gate=performanceGate(performanceIndex,symbol,plan.tf,strategyLabel);
  if(!gate.allowed) continue;
  if(plan.setup.score < plan.min + gate.scoreBoost) continue; // repeats blocked by timeframe guard
  const expiresAt=new Date(Date.now()+plan.expiry*1000).toISOString();
  const {data:recent}=await db.from("trading_signals").select("id").eq("symbol",symbol).eq("timeframe",plan.tf).gte("created_at",new Date(Date.now()-Math.max(10,plan.tf==="1m"?5:plan.tf==="15m"?30:120)*60000).toISOString()).limit(1);
  if(recent?.length) continue;
  const {data:row,error:ins}=await db.from("trading_signals").insert({
    symbol,direction:plan.setup.direction,entry_price:entry,stop_loss:sl,take_profit:tp,timeframe:plan.tf,
    strategy_name:strategyLabel,confidence:Math.round(plan.setup.score),broker:["weltrade"],category:"syntx",
    status:"ACTIVE",is_manual:false,expiry_seconds:plan.expiry,expires_at:expiresAt,
    reason:`${f.family} ${plan.label}: ${strategyLabels.join(", ")} confirmed with ${same}/${confirmationDirections.length} higher-timeframe confirmations`,
    explanation_json:{
      engine:"SyntX MTF Engine v5",strategy_id:profile.label,strategy_types:strategyLabels,source:"Weltrade SyntX API Studio + Botvio Worker Intelligence",signal_type:plan.type,expiry_seconds:plan.expiry,expires_at:expiresAt,
      entry_style:plan.label,timeframes:Object.fromEntries(frames.map(x=>[x.n,x.sig?.direction??"WAIT"])),
      higher_timeframe_confirmation:same,confirmation_count:confirmationDirections.length,worker_confluence:{score_bonus:worker.bonus,htf_average:worker.avg,market_regime:worker.regime},
      feed_audit:{source:"Weltrade SyntX API Studio",symbol,requested_timeframe:plan.tf,candle_time:candleTime,candle_closed:candleClosed,candle_ohlc:sourceCandle?{open:sourceCandle.open,high:sourceCandle.high,low:sourceCandle.low,close:sourceCandle.close}:null,entry_price:entry}
    }
  }).select("id,symbol,direction,confidence,timeframe").single();
  if(!ins&&row)published.push(row);
}}}console.log("syntx run",JSON.stringify({conns:(connections??[]).length,published:published.length,diag:diag.slice(0,6)}));return new Response(JSON.stringify({success:true,published,count:published.length,diagnostics:diag,generated_at:new Date().toISOString(),source:"Weltrade SyntX API Studio"}),{headers:{"Content-Type":"application/json"}})}catch(e){return new Response(JSON.stringify({success:false,error:e instanceof Error?e.message:String(e)}),{status:500,headers:{"Content-Type":"application/json"}})}});