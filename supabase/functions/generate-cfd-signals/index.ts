import { createClient } from "npm:@supabase/supabase-js@2";

type Candle={epoch:number;open:number;high:number;low:number;close:number};
type Sig={direction:"BUY"|"SELL";score:number;entry:number;sl:number;tp:number};

const SYMBOLS=[
  {symbol:"frxXAUUSD",name:"Gold",category:"gold",strategy:"Gold Structure + Liquidity",min:76,stop:1.35,target:2.45},
  {symbol:"frxXAGUSD",name:"Silver",category:"commodities",strategy:"Silver Structure + Momentum",min:75,stop:1.35,target:2.5},
  {symbol:"frxEURUSD",name:"EUR/USD",category:"forex",strategy:"FX Trend + Pullback",min:74,stop:1.25,target:2.2},
  {symbol:"frxGBPUSD",name:"GBP/USD",category:"forex",strategy:"GBP Momentum Pullback",min:75,stop:1.2,target:2.15},
  {symbol:"frxUSDJPY",name:"USD/JPY",category:"forex",strategy:"FX Trend + Pullback",min:74,stop:1.25,target:2.2},
  {symbol:"frxAUDUSD",name:"AUD/USD",category:"forex",strategy:"FX Trend + Pullback",min:74,stop:1.25,target:2.2},
  {symbol:"cryBTCUSD",name:"BTC/USD",category:"crypto",strategy:"Bitcoin Momentum Breakout",min:77,stop:1.55,target:2.8},
  {symbol:"cryETHUSD",name:"ETH/USD",category:"crypto",strategy:"Crypto Momentum",min:76,stop:1.5,target:2.7},
  {symbol:"OTC_NDX",name:"NAS100",category:"nasdaq",strategy:"NAS100 Breakout + Retest",min:77,stop:1.4,target:2.6},
  {symbol:"OTC_DJI",name:"US30",category:"indices",strategy:"US Index Breakout + Retest",min:76,stop:1.4,target:2.7},
  {symbol:"OTC_SPX",name:"US500",category:"indices",strategy:"US Index Breakout + Retest",min:76,stop:1.4,target:2.7},
  {symbol:"OTC_DAX",name:"GER40",category:"indices",strategy:"European Index Breakout + Retest",min:75,stop:1.35,target:2.5},
  {symbol:"OTC_FTSE",name:"UK100",category:"indices",strategy:"European Index Breakout + Retest",min:75,stop:1.35,target:2.5},
  {symbol:"OTC_OIL",name:"USOIL",category:"commodities",strategy:"Crude Oil Momentum + Pullback",min:76,stop:1.45,target:2.7},
  {symbol:"OTC_BRENT",name:"BRENT",category:"commodities",strategy:"Crude Oil Momentum + Pullback",min:76,stop:1.45,target:2.7}
] as const;

const PLANS=[
  {tf:"1m",type:"SCALPING",minutes:1,count:220,expiry:300,backup:600,minBoost:2,confirm:["15m","1H"]},
  {tf:"15m",type:"INTRADAY",minutes:15,count:180,expiry:3600,backup:5400,minBoost:1,confirm:["1H"]},
  {tf:"1H",type:"SWING",minutes:60,count:160,expiry:14400,backup:21600,minBoost:2,confirm:["1D"]},
  {tf:"1D",type:"POSITION",minutes:1440,count:180,expiry:259200,backup:432000,minBoost:4,confirm:[]},
  {tf:"3D",type:"POSITION",minutes:1440,count:300,expiry:777600,backup:1209600,minBoost:3,confirm:["1D"]}
] as const;

function ema(a:number[],p:number){if(a.length<p)return null;let e=a.slice(0,p).reduce((x,y)=>x+y,0)/p,k=2/(p+1);for(let i=p;i<a.length;i++)e=(a[i]-e)*k+e;return e}
function atr(c:Candle[],p=14){if(c.length<=p)return null;const tr=c.slice(1).map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-c[i].close),Math.abs(x.low-c[i].close)));return tr.slice(-p).reduce((a,b)=>a+b,0)/Math.min(p,tr.length)}
function rsi(c:Candle[],p=14){if(c.length<=p)return null;let g=0,l=0;for(let i=c.length-p;i<c.length;i++){const d=c[i].close-c[i-1].close;if(d>0)g+=d;else l-=d}if(l===0)return 100;return 100-100/(1+(g/p)/(l/p))}
function signal(c:Candle[],profile:typeof SYMBOLS[number]):Sig|null{
 if(c.length<60)return null;
 const closes=c.map(x=>x.close),last=c.at(-1)!;const e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50),a=atr(c),rs=rsi(c);
 if(e9==null||e21==null||e50==null||a==null||rs==null||a<=0)return null;
 const up=e9>e21&&last.close>e50,down=e9<e21&&last.close<e50;
 const hi=Math.max(...c.slice(-21,-1).map(x=>x.high)),lo=Math.min(...c.slice(-21,-1).map(x=>x.low));
 const breakoutUp=last.close>hi,breakoutDown=last.close<lo;
 const body=Math.abs(last.close-last.open),range=last.high-last.low;
 const stretched=range>a*2.2||body>a*1.6;
 let direction:null|"BUY"|"SELL"=null;
 if((up||breakoutUp)&&rs>48&&rs<78&&!stretched)direction="BUY";
 if((down||breakoutDown)&&rs<52&&rs>22&&!stretched)direction="SELL";
 if(!direction)return null;
 const trend=up||down?10:0,breakout=breakoutUp||breakoutDown?8:0,rsScore=(direction==="BUY"&&rs>=52&&rs<=68)||(direction==="SELL"&&rs>=32&&rs<=48)?7:3;
 const score=Math.min(96,65+trend+breakout+rsScore+(stretched?0:5));
 if(score<profile.min)return null;
 return{direction,score,entry:last.close,sl:direction==="BUY"?last.close-a*profile.stop:last.close+a*profile.stop,tp:direction==="BUY"?last.close+a*profile.target:last.close-a*profile.target};
}

function isForexMarketOpen(now = new Date()): boolean {
  // Standard FX market: opens Sunday 22:00 UTC and closes Friday 22:00 UTC.
  const day = now.getUTCDay();
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (day === 6) return false; // Saturday
  if (day === 0) return minutes >= 22 * 60;
  if (day === 5) return minutes < 22 * 60;
  return true;
}

function request(ws:WebSocket,payload:Record<string,unknown>,timeout=15000){
 return new Promise<any>((resolve,reject)=>{
   const req_id=Math.floor(Math.random()*1e9);
   const timer=setTimeout(()=>{cleanup();reject(new Error("Deriv request timeout"))},timeout);
   const handler=(event:MessageEvent)=>{try{const data=JSON.parse(String(event.data));if(data.req_id!==req_id)return;cleanup();if(data.error)reject(new Error(data.error.message||"Deriv API error"));else resolve(data)}catch{}};
   const cleanup=()=>{clearTimeout(timer);ws.removeEventListener("message",handler)};
   ws.addEventListener("message",handler);
   ws.send(JSON.stringify({...payload,req_id}));
 });
}

async function candles(ws:WebSocket,symbol:string,granularity:number,count:number):Promise<Candle[]>{
 const data=await request(ws,{ticks_history:symbol,end:"latest",style:"candles",granularity,count,subscribe:0,adjust_start_time:1});
 return (data.candles??[]).map((x:any)=>({epoch:Number(x.epoch),open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close)}))
   .filter((x:Candle)=>Number.isFinite(x.epoch)&&[x.open,x.high,x.low,x.close].every(Number.isFinite));
}

function aggregateCandles(c:Candle[], days:number):Candle[]{
 if(days<=1)return c;
 const buckets=new Map<number,Candle>();
 for(const x of c){
   const bucket=Math.floor(x.epoch/(86400*days))*(86400*days);
   const prev=buckets.get(bucket);
   if(!prev)buckets.set(bucket,{epoch:bucket,open:x.open,high:x.high,low:x.low,close:x.close});
   else {prev.high=Math.max(prev.high,x.high);prev.low=Math.min(prev.low,x.low);prev.close=x.close;}
 }
 return [...buckets.values()].sort((a,b)=>a.epoch-b.epoch);
}

Deno.serve(async(req)=>{
 if(req.method!=="POST")return new Response("POST required",{status:405});
 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
 try{
  const secret=req.headers.get("x-botvio-automation-secret")??"";
  const {data:expected}=await db.rpc("get_botvio_automation_secret");
  if(!expected||secret!==expected)return new Response(JSON.stringify({success:false,error:"Unauthorized automation trigger"}),{status:401});
  await db.from("trading_signals").update({status:"EXPIRED"}).eq("status","ACTIVE").lt("expires_at",new Date().toISOString());

  const ws=new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
  await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error("Deriv WebSocket timeout")),12000);ws.addEventListener("open",()=>{clearTimeout(t);resolve()},{once:true});ws.addEventListener("error",()=>{clearTimeout(t);reject(new Error("Deriv WebSocket connection failed"))},{once:true})});
  const active=await request(ws,{active_symbols:"brief"});
  const activeSet=new Set((active.active_symbols??[]).map((x:any)=>String(x.underlying_symbol??x.symbol)));
  const published:any[]=[];const skipped:any[]=[];const wanted=(await req.json().catch(()=>({})))?.symbol as string|undefined;
  const profiles=wanted?SYMBOLS.filter(x=>x.symbol===wanted):SYMBOLS;

  for(const profile of profiles){
   if(profile.category==="forex" && !isForexMarketOpen()){
    skipped.push({symbol:profile.symbol,reason:"forex market closed"});
    continue;
   }
   if(!activeSet.has(profile.symbol)){skipped.push({symbol:profile.symbol,reason:"not active on Deriv"});continue}
   const frames=new Map<string,Candle[]>();
   await Promise.all(PLANS.map(async p=>{try{
  const raw=await candles(ws,profile.symbol,p.minutes*60,p.count);
  frames.set(p.tf,p.tf==="3D"?aggregateCandles(raw,3):raw);
}catch{frames.set(p.tf,[])}}));
   const sigs=new Map<string,Sig|null>();
   for(const p of PLANS)sigs.set(p.tf,signal(frames.get(p.tf)??[],profile));
   for(const p of PLANS){
    const setup=sigs.get(p.tf);if(!setup||setup.score<profile.min+p.minBoost)continue;
    const confirmations=p.confirm.map(tf=>sigs.get(tf)).filter(Boolean) as Sig[];
    const same=confirmations.filter(x=>x.direction===setup.direction).length;
    const conflict=confirmations.some(x=>x.direction!==setup.direction);
    const required=p.tf==="15m"||p.tf==="1H"||p.tf==="3D"?1:(p.confirm.length?1:0);
    if(conflict||same<required)continue;
    const expiresAt=new Date(Date.now()+p.expiry*1000).toISOString();
    const strategyName=`${profile.strategy} · ${p.type} ${p.tf}`;
    const cooldown=p.tf==="1m"?5:p.tf==="15m"?30:120;
    const {data:recent}=await db.from("trading_signals").select("id").eq("symbol",profile.symbol).eq("strategy_name",strategyName).eq("direction",setup.direction).gte("created_at",new Date(Date.now()-cooldown*60000).toISOString()).limit(1);
    if(recent?.length)continue;
    const {data:row,error}=await db.from("trading_signals").insert({
      symbol:profile.name,direction:setup.direction,entry_price:setup.entry,stop_loss:setup.sl,take_profit:setup.tp,
      timeframe:p.tf,signal_type:p.type,strategy_name:strategyName,confidence:Math.round(setup.score),broker:["deriv"],
      category:profile.category,status:"ACTIVE",is_manual:false,expiry_seconds:p.expiry,best_expiry:p.expiry,backup_expiry:p.backup,
      expires_at:expiresAt,reason:`${profile.name} ${p.type} entry: ${same}/${confirmations.length} higher-timeframe confirmations`,
      explanation_json:{engine:"Botvio CFD MTF Engine v1",signal_type:p.type,timeframe:p.tf,expiry_seconds:p.expiry,expires_at:expiresAt,
        source:"Deriv active_symbols + ticks_history",higher_timeframe_confirmation:same,confirmation_count:confirmations.length}
    }).select("id,symbol,direction,timeframe,signal_type,expiry_seconds,expires_at,confidence").single();
    if(error)skipped.push({symbol:profile.name,timeframe:p.tf,error:error.message});else published.push(row);
   }
  }
  try{ws.close()}catch{}
  return new Response(JSON.stringify({success:true,published,count:published.length,skipped,generated_at:new Date().toISOString(),source:"Deriv MTF CFD Engine"}),{headers:{"Content-Type":"application/json"}});
 }catch(e){return new Response(JSON.stringify({success:false,error:e instanceof Error?e.message:String(e)}),{status:500,headers:{"Content-Type":"application/json"}})}
});