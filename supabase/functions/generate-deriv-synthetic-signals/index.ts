import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";
import { loadPerformanceIndex, performanceGate } from "../_shared/performanceGate.ts";

type Candle={epoch:number;open:number;high:number;low:number;close:number};
type Sig={direction:"BUY"|"SELL";score:number;entry:number;sl:number;tp:number};

const PLAN=[
 {tf:"1m",type:"SCALPING",g:60,count:220,expiry:300,backup:600,boost:2,confirm:["15m","1H"]},
 {tf:"15m",type:"INTRADAY",g:900,count:180,expiry:3600,backup:5400,boost:1,confirm:["1H"]},
 {tf:"1H",type:"SWING",g:3600,count:160,expiry:14400,backup:21600,boost:2,confirm:["1D"]},
 {tf:"1D",type:"POSITION",g:86400,count:180,expiry:259200,backup:432000,boost:4,confirm:[]},
 {tf:"3D",type:"POSITION",g:86400,count:300,expiry:777600,backup:1209600,boost:3,confirm:["1D"]}
];

function ema(a:number[],p:number){if(a.length<p)return null;let e=a.slice(0,p).reduce((x,y)=>x+y,0)/p,k=2/(p+1);for(let i=p;i<a.length;i++)e+=(a[i]-e)*k;return e}
function atr(c:Candle[],p=14){if(c.length<=p)return null;const tr=c.slice(1).map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-c[i].close),Math.abs(x.low-c[i].close)));return tr.slice(-p).reduce((a,b)=>a+b,0)/Math.min(p,tr.length)}
function rsi(c:Candle[],p=14){if(c.length<=p)return null;let g=0,l=0;for(let i=c.length-p;i<c.length;i++){const d=c[i].close-c[i-1].close;if(d>0)g+=d;else l-=d}if(l===0)return 100;return 100-100/(1+(g/p)/(l/p))}
function bollinger(c:Candle[],p=20,m=2){if(c.length<p)return null;const x=c.slice(-p).map(v=>v.close),mean=x.reduce((a,b)=>a+b,0)/p;const variance=x.reduce((a,b)=>a+(b-mean)**2,0)/p;const sd=Math.sqrt(variance);return{mean,upper:mean+m*sd,lower:mean-m*sd,sd};}
type StrategyFamily="BOOM"|"CRASH"|"VOLATILITY"|"RANGE_BREAK"|"STEP"|"JUMP"|"DRIFT"|"DEX";

function classifyStrategy(name:string,code:string):{family:StrategyFamily;label:string;bias:"BUY"|"SELL"|"BOTH"}{
 const x=(name+" "+code).toUpperCase();
 if(x.includes("BOOM"))return{family:"BOOM",label:"Spike Continuation + Pullback",bias:"BUY"};
 if(x.includes("CRASH"))return{family:"CRASH",label:"Spike Continuation + Pullback",bias:"SELL"};
 if(x.includes("RANGE BREAK")||x.includes("RDB"))return{family:"RANGE_BREAK",label:"Range Expansion + Retest",bias:"BOTH"};
 if(x.includes("STEP")||x.includes("STPRNG"))return{family:"STEP",label:"Step Trend + Mean Reversion",bias:"BOTH"};
 if(x.includes("JUMP"))return{family:"JUMP",label:"Jump Momentum + Reversal Filter",bias:"BOTH"};
 if(x.includes("DRIFT"))return{family:"DRIFT",label:"Drift Trend + Pullback",bias:"BOTH"};
 if(x.includes("DEX"))return{family:"DEX",label:"DEX Momentum + Structure",bias:"BOTH"};
 return{family:"VOLATILITY",label:"Volatility Trend + Breakout",bias:"BOTH"};
}

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

function strategySignal(c:Candle[],strategy:{family:StrategyFamily;label:string;bias:"BUY"|"SELL"|"BOTH"}):Sig|null{
 if(c.length<80)return null;
 const last=c.at(-1)!,prev=c.at(-2)!;
 const closes=c.map(x=>x.close);
 const e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50);
 const e100=ema(closes,100),a=atr(c),rs=rsi(c);
 if([e9,e21,e50,a,rs].some(v=>v==null)||a!<=0)return null;
 const range=last.high-last.low,body=Math.abs(last.close-last.open);
 const upper=last.high-Math.max(last.open,last.close),lower=Math.min(last.open,last.close)-last.low;
 const bullish=last.close>e21!&&e9!>e21!&&e21!>e50!;
 const bearish=last.close<e21!&&e9!<e21!&&e21!<e50!;
 const momentumUp=last.close>prev.close&&e9!>e21!;
 const momentumDown=last.close<prev.close&&e9!<e21!;
 const hi=Math.max(...c.slice(-21,-1).map(x=>x.high));
 const lo=Math.min(...c.slice(-21,-1).map(x=>x.low));
 const breakoutUp=last.close>hi,breakoutDown=last.close<lo;
 const pullbackBuy=lower>Math.max(body*0.7,a!*0.25)&&last.close>last.open;
 const pullbackSell=upper>Math.max(body*0.7,a!*0.25)&&last.close<last.open;
 const stretched=range>a!*2.4;
 if(stretched)return null;

 let d:null|"BUY"|"SELL"=null;
 let score=0;
 const why:string[]=[strategy.label];

 if(strategy.family==="BOOM"){
   if(bullish&&momentumUp&&rs!<76&&(pullbackBuy||breakoutUp)){d="BUY";score=74;why.push("upward spike bias","EMA trend alignment","bullish trigger");}
   else if(strategy.bias==="BUY"&&bullish&&rs!>=50&&rs!<=70){d="BUY";score=70;why.push("trend continuation");}
 } else if(strategy.family==="CRASH"){
   if(bearish&&momentumDown&&rs!>24&&(pullbackSell||breakoutDown)){d="SELL";score=74;why.push("downward spike bias","EMA trend alignment","bearish trigger");}
   else if(strategy.bias==="SELL"&&bearish&&rs!>=30&&rs!<=50){d="SELL";score=70;why.push("trend continuation");}
 } else if(strategy.family==="RANGE_BREAK"){
   if(breakoutUp&&momentumUp&&rs!>=52&&rs!<=78){d="BUY";score=82;why.push("range breakout","momentum confirmation");}
   else if(breakoutDown&&momentumDown&&rs!>=22&&rs!<=48){d="SELL";score=82;why.push("range breakdown","momentum confirmation");}
 } else if(strategy.family==="STEP"){
   const nearMean=Math.abs(last.close-e21!)/a!<0.8;
   if(bullish&&momentumUp&&nearMean&&rs!>=48&&rs!<=68){d="BUY";score=76;why.push("step trend","mean-reversion entry");}
   else if(bearish&&momentumDown&&nearMean&&rs!>=32&&rs!<=52){d="SELL";score=76;why.push("step trend","mean-reversion entry");}
 } else if(strategy.family==="JUMP"){
   const impulse=range>a!*1.25;
   if(bullish&&momentumUp&&impulse&&rs!<75){d="BUY";score=78;why.push("jump momentum","controlled impulse");}
   else if(bearish&&momentumDown&&impulse&&rs!>25){d="SELL";score=78;why.push("jump momentum","controlled impulse");}
 } else if(strategy.family==="DRIFT"){
   if(bullish&&pullbackBuy&&rs!>=48&&rs!<=68){d="BUY";score=78;why.push("drift trend","pullback confirmation");}
   else if(bearish&&pullbackSell&&rs!>=32&&rs!<=52){d="SELL";score=78;why.push("drift trend","pullback confirmation");}
 } else if(strategy.family==="DEX"){
   const structureUp=last.close>hi||last.close>e50!;
   const structureDown=last.close<lo||last.close<e50!;
   if(structureUp&&momentumUp&&rs!>=50&&rs!<=76){d="BUY";score=76;why.push("DEX structure","momentum confirmation");}
   else if(structureDown&&momentumDown&&rs!>=24&&rs!<=50){d="SELL";score=76;why.push("DEX structure","momentum confirmation");}
 } else {
   const bb=bollinger(c,20,2);
   if(bb && bb.sd>0){
     const lowerExtreme=last.close<=bb.lower && rs!<=35 && lower>body*0.6 && last.close>last.open;
     const upperExtreme=last.close>=bb.upper && rs!>=65 && upper>body*0.6 && last.close<last.open;
     if(lowerExtreme){d="BUY";score=80;why.push("volatility mean reversion","lower Bollinger extreme","bullish rejection");}
     else if(upperExtreme){d="SELL";score=80;why.push("volatility mean reversion","upper Bollinger extreme","bearish rejection");}
   }
 }

 if(!d)return null;
 const bias=strategy.family==="VOLATILITY"?null:directionalBias(c);
 score += bias===d?6:bias?-5:0;
 score += candleQuality(c);
 if(score<70)return null;
 if((d==="BUY"&&rs!>78)||(d==="SELL"&&rs!<22))return null;
 const stopMult=strategy.family==="RANGE_BREAK"?1.35:strategy.family==="STEP"?1.0:strategy.family==="BOOM"||strategy.family==="CRASH"?1.2:1.3;
 const targetMult=strategy.family==="RANGE_BREAK"?2.8:strategy.family==="STEP"?1.8:strategy.family==="BOOM"||strategy.family==="CRASH"?2.4:2.5;
 const entry=last.close;
 const sl=d==="BUY"?entry-a!*stopMult:entry+a!*stopMult;
 const tp=d==="BUY"?entry+a!*targetMult:entry-a!*targetMult;
 return{direction:d,score:Math.min(96,score),entry,sl,tp};
}

function moderateLevels(c:Candle[],direction:"BUY"|"SELL",tf:string){
 const a=atr(c)??0;
 const m=tf==="1m"?{sl:.90,tp:1.35}:tf==="15m"?{sl:1.00,tp:1.60}:tf==="1H"?{sl:1.15,tp:1.85}:tf==="1D"?{sl:1.30,tp:2.10}:{sl:1.50,tp:2.30};
 const entry=c.at(-1)!.close;
 return {sl:direction==="BUY"?entry-a*m.sl:entry+a*m.sl,tp:direction==="BUY"?entry+a*m.tp:entry-a*m.tp};
}
function request(ws:WebSocket,payload:Record<string,unknown>,timeout=15000){return new Promise<any>((resolve,reject)=>{const req_id=Math.floor(Math.random()*1e9),timer=setTimeout(()=>{ws.removeEventListener("message",h);reject(new Error("Deriv timeout"))},timeout);const h=(e:MessageEvent)=>{try{const x=JSON.parse(String(e.data));if(x.req_id!==req_id)return;clearTimeout(timer);ws.removeEventListener("message",h);x.error?reject(new Error(x.error.message||"Deriv error")):resolve(x)}catch{}};ws.addEventListener("message",h);ws.send(JSON.stringify({...payload,req_id}))})}
async function getContracts(ws:WebSocket,symbol:string){
 const x=await request(ws,{contracts_for:symbol});
 return new Set<string>((x.contracts_for?.available??[]).map((v:any)=>String(v.contract_type)).filter(Boolean));
}
async function getCandles(ws:WebSocket,symbol:string,p:{g:number;count:number;tf?:string}){const x=await request(ws,{ticks_history:symbol,end:"latest",style:"candles",granularity:p.g,count:p.count,subscribe:0,adjust_start_time:1});const raw=(x.candles??[]).map((v:any)=>({epoch:+v.epoch,open:+v.open,high:+v.high,low:+v.low,close:+v.close})).filter((v:Candle)=>[v.epoch,v.open,v.high,v.low,v.close].every(Number.isFinite));if(p.tf!=="3D")return raw;const buckets=new Map<number,Candle>();for(const v of raw){const key=Math.floor(v.epoch/259200)*259200;const prev=buckets.get(key);if(!prev)buckets.set(key,{epoch:key,open:v.open,high:v.high,low:v.low,close:v.close});else{prev.high=Math.max(prev.high,v.high);prev.low=Math.min(prev.low,v.low);prev.close=v.close}}return[...buckets.values()].sort((a,b)=>a.epoch-b.epoch)}

Deno.serve(async(req)=>{
 if(req.method!=="POST")return new Response("POST required",{status:405});
 try{
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (!assertAutomationKey(req)) return new Response(JSON.stringify({ success: false, error: "Unauthorized automation trigger" }), { status: 401, headers: { "Content-Type": "application/json" } }); const performanceIndex = await loadPerformanceIndex(db);
  await db.from("trading_signals").update({status:"EXPIRED"}).eq("status","ACTIVE").lt("expires_at",new Date().toISOString());
  const ws=new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
  await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error("Deriv WebSocket timeout")),12000);ws.addEventListener("open",()=>{clearTimeout(t);resolve()},{once:true});ws.addEventListener("error",()=>{clearTimeout(t);reject(new Error("Deriv WebSocket failed"))},{once:true})});
  const active=await request(ws,{active_symbols:"brief"});
  const symbols=(active.active_symbols??[]).map((x:any)=>({code:String(x.underlying_symbol??x.symbol),name:String(x.underlying_symbol_name??x.display_name??x.symbol),market:String(x.market??"")}))
    .filter((x:any)=>/synthetic|volatility|boom|crash|range break|step|jump|drift|dex/i.test(x.name+" "+x.market))
    ;
  const body=await req.json().catch(()=>({}));const wanted=body?.symbol?String(body.symbol):null;
  const list=wanted?symbols.filter((x:any)=>x.code===wanted||x.name===wanted):symbols;
  const published:any[]=[];
  for(const s of list.slice(0,50)){
   let contracts:Set<string>;
   try{contracts=await getContracts(ws,s.code)}catch{continue}
   const directional=["CALL","PUT","HIGHER","LOWER","UPORDOWN","MULTUP","MULTDOWN","ACCU"].some(x=>contracts.has(x));
   if(!directional)continue;
   const strategy=classifyStrategy(s.name,s.code);
   const frames=new Map<string,Candle[]>();await Promise.all(PLAN.map(async p=>{try{frames.set(p.tf,await getCandles(ws,s.code,{...p,tf:p.tf}))}catch{frames.set(p.tf,[])}}));
   const sigs=new Map<string,Sig|null>();for(const p of PLAN)sigs.set(p.tf,strategySignal(frames.get(p.tf)??[],strategy));
   for(const p of PLAN){
    const setup=sigs.get(p.tf);if(!setup)continue;
    const strategyName = `${strategy.family} · ${strategy.label} · ${p.type} ${p.tf}`;
    const gate=performanceGate(performanceIndex,s.name,p.tf,strategyName);
    if(!gate.allowed)continue;
    const conf=p.confirm.map(x=>sigs.get(x));
    const confDirections=p.confirm.map((tf,i)=>{
      const sig=conf[i];
      if(sig?.direction)return sig.direction;
      return directionalBias(frames.get(tf)??[]);
    }).filter(Boolean) as ("BUY"|"SELL")[];
    if(confDirections.some(x=>x!==setup.direction)||confDirections.filter(x=>x===setup.direction).length<(p.confirm.length?1:0)||setup.score<(p.tf==="15m"?76:p.tf==="1H"?77:p.tf==="3D"?77:76)+p.boost+gate.scoreBoost)continue;
    const levels=moderateLevels(frames.get(p.tf)??[],setup.direction,p.tf);
    setup.sl=levels.sl; setup.tp=levels.tp;
    const type=p.type,expiresAt=new Date(Date.now()+p.expiry*1000).toISOString();
    const {data:recent}=await db.from("trading_signals").select("id").eq("symbol",s.name).eq("strategy_name",strategyName).eq("direction",setup.direction).gte("created_at",new Date(Date.now()-(p.tf==="1m"?5:p.tf==="15m"?30:120)*60000).toISOString()).limit(1);
    if(recent?.length)continue;
    const {data:row,error}=await db.from("trading_signals").insert({
      symbol:s.name,direction:setup.direction,entry_price:setup.entry,stop_loss:setup.sl,take_profit:setup.tp,timeframe:p.tf,signal_type:type,
      strategy_name:strategyName,confidence:Math.round(setup.score),broker:["deriv"],category:"synthetic",status:"ACTIVE",is_manual:false,
      expiry_seconds:p.expiry,best_expiry:p.expiry,backup_expiry:p.backup,expires_at:expiresAt,
      reason:`${s.name} · ${strategy.label} · ${type}: ${confDirections.filter(x=>x===setup.direction).length}/${confDirections.length} higher-timeframe confirmations`,
      explanation_json:{engine:"Botvio Deriv Synthetic Strategy Engine v2",strategy_family:strategy.family,strategy_label:strategy.label,signal_type:type,timeframe:p.tf,expiry_seconds:p.expiry,expires_at:expiresAt,source:"Deriv active_symbols + ticks_history"}
    }).select("id,symbol,direction,timeframe,signal_type,expiry_seconds,expires_at,confidence").single();
    if(!error&&row)published.push(row);
   }
  }
  try{ws.close()}catch{}
  return new Response(JSON.stringify({success:true,published,count:published.length,scanned:list.length,generated_at:new Date().toISOString()}),{headers:{"Content-Type":"application/json"}});
 }catch(e){return new Response(JSON.stringify({success:false,error:e instanceof Error?e.message:String(e)}),{status:500,headers:{"Content-Type":"application/json"}})}
});