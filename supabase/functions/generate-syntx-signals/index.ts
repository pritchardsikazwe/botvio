import { createClient } from "npm:@supabase/supabase-js@2";
async function decryptSecret(enc:string,secret:string):Promise<string>{const bytes=Uint8Array.from(atob(enc.replace(/^v1:/,"")),(c)=>c.charCodeAt(0));const raw=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret));const k=await crypto.subtle.importKey("raw",raw,"AES-GCM",false,["decrypt"]);const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12)},k,bytes.slice(12));return new TextDecoder().decode(pt)}
type Candle={time:number;open:number;high:number;low:number;close:number};
const FAMILIES=[
{symbols:["Boom 300 Index","Boom 500 Index","Boom 600 Index","Boom 900 Index","Boom 1000 Index"],family:"Boom",bias:"BUY"},
{symbols:["Crash 300 Index","Crash 500 Index","Crash 600 Index","Crash 900 Index","Crash 1000 Index"],family:"Crash",bias:"SELL"},
{symbols:["Volatility 10 Index","Volatility 25 Index","Volatility 50 Index","Volatility 75 Index","Volatility 100 Index","Volatility 150 Index","Volatility 250 Index"],family:"Volatility",bias:"BOTH"},
{symbols:["Volatility 10 (1s) Index","Volatility 15 (1s) Index","Volatility 30 (1s) Index","Volatility 50 (1s) Index","Volatility 75 (1s) Index","Volatility 90 (1s) Index","Volatility 100 (1s) Index"],family:"Volatility 1s",bias:"BOTH"},
{symbols:["Range Break 100 Index","Range Break 200 Index"],family:"Range Break",bias:"BOTH"},
{symbols:["GainX 400","GainX 600","GainX 800"],family:"GainX",bias:"SELL"},
{symbols:["PainX 400","PainX 600","PainX 800"],family:"PainX",bias:"BUY"},
{symbols:["FlipX 1","FlipX 2","FlipX 3","FlipX 4","FlipX 5"],family:"FlipX",bias:"BOTH"},
{symbols:["SwitchX 600","SwitchX 1200","SwitchX 1800"],family:"SwitchX",bias:"BOTH"},
{symbols:["FX VOL 20","FX VOL 40","FX VOL 80"],family:"FX Vol.",bias:"BOTH"}
];
const STRATEGY_BY_SYMBOL:Record<string,{min:number;stop:number;target:number;label:string}>=Object.fromEntries(
FAMILIES.flatMap(f=>f.symbols.map(symbol=>{
const s=symbol.toUpperCase();
const n=Number(s.match(/(?:BOOM|CRASH|VOLATILITY)\s*(?:\(1S\)\s*)?(\d+)/)?.[1]||0);
if(s.includes("BOOM")) return [symbol,{min:n>=900?82:n>=500?79:77,stop:1.15,target:2.35,label:`Boom ${n} Spike Hunter`}];
if(s.includes("CRASH")) return [symbol,{min:n>=900?82:n>=500?79:77,stop:1.15,target:2.35,label:`Crash ${n} Spike Hunter`}];
if(s.includes("RANGE BREAK")) return [symbol,{min:78,stop:1.25,target:2.5,label:s.replace(" INDEX","")+" Expansion"}];
if(s.includes("VOLATILITY")) return [symbol,{min:s.includes("(1S)")?82:n>=100?79:76,stop:n>=100?1.5:1.35,target:n>=100?2.75:2.5,label:s.replace(" INDEX","")+" Momentum"}];
return [symbol,{min:74,stop:1.4,target:2.2,label:`${f.family} Adaptive MTF`}];
}))
);
const TF:Record<string,number>={M1:1,M15:15,H1:60,D1:1440,D3:1440};

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
function frameSignal(c:Candle[],bias:string,profile:{min:number;stop:number;target:number;label:string}){if(c.length<60)return null;const closes=c.map(x=>x.close),e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50),a=atr(c),rs=rsi(c),last=c.at(-1)!;if(e9==null||e21==null||a==null||a<=0||rs==null)return null;const up=e9>e21&&(e50==null||last.close>e50),down=e9<e21&&(e50==null||last.close<e50),expanded=last.high-last.low>a*1.8;let d:null|"BUY"|"SELL"=null;if(bias==="BUY"&&up&&!expanded)d="BUY";if(bias==="SELL"&&down&&!expanded)d="SELL";if(bias==="BOTH"){const hi=Math.max(...c.slice(-20,-1).map(x=>x.high)),lo=Math.min(...c.slice(-20,-1).map(x=>x.low));if(rs<32&&last.close<lo+a*.5)d="BUY";else if(rs>68&&last.close>hi-a*.5)d="SELL";else if(up&&!expanded)d="BUY";else if(down&&!expanded)d="SELL"}if(!d)return null;const score=Math.min(96,60+(up||down?8:0)+(d==="BUY"&&rs>50&&rs<75?6:d==="SELL"&&rs<50&&rs>25?6:0)+(expanded?5:0));if(score<profile.min)return null;return{direction:d,score,entry:last.close,sl:d==="BUY"?last.close-a*profile.stop:last.close+a*profile.stop,tp:d==="BUY"?last.close+a*profile.target:last.close-a*profile.target}}
function moderateLevels(c:Candle[],direction:"BUY"|"SELL",tf:string){
 const a=atr(c)??0;
 const m=tf==="1m"?{sl:.90,tp:1.35}:tf==="15m"?{sl:1.00,tp:1.60}:tf==="1H"?{sl:1.15,tp:1.85}:tf==="1D"?{sl:1.30,tp:2.10}:{sl:1.50,tp:2.30};
 const entry=c.at(-1)!.close;
 return {sl:direction==="BUY"?entry-a*m.sl:entry+a*m.sl,tp:direction==="BUY"?entry+a*m.tp:entry-a*m.tp};
}
function unwrap(x:unknown):unknown{if(x&&typeof x==="object"){const o=x as Record<string,unknown>;return o.data??x}return x}
function bars(x:unknown):Candle[]{const r=unwrap(x);const list=Array.isArray(r)?r:(r&&typeof r==="object"?Object.values(r as Record<string,unknown>).find(Array.isArray)??[]:[]);return(list as unknown[]).map(v=>{const b=v as Record<string,unknown>;const t=Number(b.time??b.Time??b.timestamp??b.Timestamp??0);return{time:t>1e12?Math.floor(t/1000):t,open:Number(b.open??b.Open),high:Number(b.high??b.High),low:Number(b.low??b.Low),close:Number(b.close??b.Close)}}).filter(x=>Number.isFinite(x.time)&&[x.open,x.high,x.low,x.close].every(Number.isFinite))}
async function api(base:string,key:string,path:string,q:Record<string,string|number|undefined>){const u=new URL(base+path);for(const[k,v]of Object.entries(q))if(v!==undefined)u.searchParams.set(k,String(v));const r=await fetch(u,{headers:{ApiKey:key,Accept:"application/json, text/plain"},signal:AbortSignal.timeout(20000)});const t=await r.text();let b:unknown=t;try{b=JSON.parse(t)}catch{}if(!r.ok)throw new Error(`API Studio ${r.status}`);return b}
Deno.serve(async(req)=>{if(req.method!=="POST")return new Response("POST required",{status:405});try{const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const trigger=req.headers.get("x-botvio-automation-secret")??"";
const {data:expectedSecret,error:secretError}=await db.rpc("get_botvio_automation_secret");
if(secretError||!expectedSecret||trigger!==expectedSecret)return new Response(JSON.stringify({success:false,error:"Unauthorized automation trigger"}),{status:401,headers:{"Content-Type":"application/json"}});const key=Deno.env.get("MT5_API_STUDIO_API_KEY")||Deno.env.get("TRADECOPY_API_KEY");if(!key)throw new Error("MT5 API Studio API key is not configured");const base=(Deno.env.get("MT5_API_STUDIO_BASE_URL")||"https://mt5full3.mtapi.io").replace(/\/+$/,"");const body=await req.json().catch(()=>({}));const wanted=body?.symbol?String(body.symbol):null;const{data:connections,error}=await db.from("syntx_api_connections").select("*").eq("broker","Weltrade");if(error)throw new Error(error.message);const published:any[]=[];for(const c of connections??[]){let session=String(c.session_id||"");try{if(!session){const pw=await decryptSecret(c.password_encrypted,Deno.env.get("TOKEN_ENCRYPTION_KEY")!);const id=crypto.randomUUID();const raw=await api(base,key,"/ConnectEx",{user:c.login,password:pw,server:c.server,id,connectTimeoutSeconds:60,connectTimeoutClusterMemberSeconds:20});session=typeof raw==="string"?raw.replace(/"/g,""):id;await db.from("syntx_api_connections").update({session_id:session,connection_status:"connected",last_error:null,last_connected_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",c.id)}}catch(e){await db.from("syntx_api_connections").update({connection_status:"error",last_error:String(e),updated_at:new Date().toISOString()}).eq("id",c.id);continue}
const families=wanted?FAMILIES.filter(f=>f.symbols.includes(wanted)):FAMILIES;for(const f of families)for(const symbol of f.symbols){const frames:any[]=[];const profile=STRATEGY_BY_SYMBOL[symbol]??{min:74,stop:1.4,target:2.2,label:`${f.family} Adaptive MTF`};for(const[name,mins]of Object.entries(TF)){try{
  const fetchMinutes=name==="D3"?1440:mins;
  const fetchBars=name==="D3"?300:500;
  const raw=bars(await api(base,key,"/PriceHistory",{id:session,symbol,from:new Date(Date.now()-fetchBars*fetchMinutes*60000).toISOString(),to:new Date().toISOString(),timeFrame:fetchMinutes}));
  const data=name==="D3"?aggregateDays(raw,3):raw;
  frames.push({n:name,data,sig:frameSignal(data,f.bias,profile)});
}catch{frames.push({n:name,sig:null})}}

const get=(name:string)=>frames.find(x=>x.n===name)?.sig??null;
const bias15=get("M15"), biasH1=get("H1"), biasD1=get("D1"), biasD3=get("D3"), scalp=get("M1");
const setups=[
  {tf:"1m",label:"SCALPING 1M",type:"SCALPING",setup:scalp,confirm:[bias15,biasH1],min:Math.max(profile.min,78),expiry:300,backup:600},
  {tf:"15m",label:"INTRADAY 15M",type:"INTRADAY",setup:bias15,confirm:[biasH1,biasD1],min:Math.max(profile.min,profile.min+1),expiry:3600,backup:5400},
  {tf:"1H",label:"SWING 1H",type:"SWING",setup:biasH1,confirm:[biasD1],min:Math.max(profile.min,profile.min+2),expiry:14400,backup:21600},
  {tf:"1D",label:"POSITION 1D",type:"POSITION",setup:biasD1,confirm:[],min:Math.max(profile.min,profile.min+4),expiry:259200,backup:432000},
  {tf:"3D",label:"POSITION 3D",type:"POSITION",setup:biasD3,confirm:[biasD1],min:Math.max(profile.min,profile.min+3),expiry:777600,backup:1209600}
];

for(const plan of setups){
  if(!plan.setup) continue;
  const confirmations=plan.confirm.filter(Boolean);
  const same=confirmations.filter((x:any)=>x.direction===plan.setup.direction).length;
  const conflict=confirmations.some((x:any)=>x.direction!==plan.setup.direction);
  if(conflict) continue;
  const required=plan.tf==="1m"?1:plan.tf==="15m"?1:plan.tf==="1H"?1:0;
  if(same<required || plan.setup.score<plan.min) continue;
  const entry=plan.setup.entry;
  const levels=moderateLevels(frames.find((x:any)=>x.n===plan.tf)?.data??frames.find((x:any)=>x.n===plan.tf)?.candles??[],plan.setup.direction,plan.tf);
  const sl=levels.sl,tp=levels.tp;
  const strategyLabel=`${profile.label} · ${plan.label}`;
  const expiresAt=new Date(Date.now()+plan.expiry*1000).toISOString();
  const {data:recent}=await db.from("trading_signals").select("id").eq("symbol",symbol).eq("strategy_name",strategyLabel).eq("direction",plan.setup.direction).gte("created_at",new Date(Date.now()-Math.max(10,plan.tf==="1m"?5:plan.tf==="15m"?30:120)*60000).toISOString()).limit(1);
  if(recent?.length) continue;
  const {data:row,error:ins}=await db.from("trading_signals").insert({
    symbol,direction:plan.setup.direction,entry_price:entry,stop_loss:sl,take_profit:tp,timeframe:plan.tf,
    strategy_name:strategyLabel,signal_type:plan.type,confidence:Math.round(plan.setup.score),broker:["weltrade"],category:"syntx",
    status:"ACTIVE",is_manual:false,expiry_seconds:plan.expiry,best_expiry:plan.expiry,backup_expiry:plan.backup,expires_at:expiresAt,
    reason:`${f.family} ${plan.label}: entry confirmed with ${same}/${confirmations.length} higher-timeframe confirmations`,
    explanation_json:{
      engine:"SyntX MTF Engine v5",strategy_id:profile.label,source:"Weltrade SyntX API Studio",signal_type:plan.type,expiry_seconds:plan.expiry,expires_at:expiresAt,
      entry_style:plan.label,timeframes:Object.fromEntries(frames.map(x=>[x.n,x.sig?.direction??"WAIT"])),
      higher_timeframe_confirmation:same,confirmation_count:confirmations.length
    }
  }).select("id,symbol,direction,confidence,timeframe").single();
  if(!ins&&row)published.push(row);
}}}return new Response(JSON.stringify({success:true,published,count:published.length,generated_at:new Date().toISOString(),source:"Weltrade SyntX API Studio"}),{headers:{"Content-Type":"application/json"}})}catch(e){return new Response(JSON.stringify({success:false,error:e instanceof Error?e.message:String(e)}),{status:500,headers:{"Content-Type":"application/json"}})}});