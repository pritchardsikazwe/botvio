import { createClient } from "npm:@supabase/supabase-js@2";

type Candle={epoch:number;open:number;high:number;low:number;close:number};
type Sig={direction:"BUY"|"SELL";score:number;entry:number;sl:number;tp:number};

const PLAN=[
 {tf:"1m",type:"SCALPING",g:60,count:220,expiry:300,backup:600,boost:2,confirm:["15m","1H"]},
 {tf:"15m",type:"INTRADAY",g:900,count:140,expiry:3600,backup:5400,boost:3,confirm:["1H","1D"]},
 {tf:"1H",type:"SWING",g:3600,count:120,expiry:14400,backup:21600,boost:5,confirm:["1D"]},
 {tf:"1D",type:"POSITION",g:86400,count:120,expiry:259200,backup:432000,boost:7,confirm:[]}
];

function ema(a:number[],p:number){if(a.length<p)return null;let e=a.slice(0,p).reduce((x,y)=>x+y,0)/p,k=2/(p+1);for(let i=p;i<a.length;i++)e+=(a[i]-e)*k;return e}
function atr(c:Candle[],p=14){if(c.length<=p)return null;const tr=c.slice(1).map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-c[i].close),Math.abs(x.low-c[i].close)));return tr.slice(-p).reduce((a,b)=>a+b,0)/Math.min(p,tr.length)}
function rsi(c:Candle[],p=14){if(c.length<=p)return null;let g=0,l=0;for(let i=c.length-p;i<c.length;i++){const d=c[i].close-c[i-1].close;if(d>0)g+=d;else l-=d}if(l===0)return 100;return 100-100/(1+(g/p)/(l/p))}
function makeSignal(c:Candle[],bias:"BUY"|"SELL"|"BOTH"):Sig|null{
 if(c.length<60)return null;const last=c.at(-1)!;const closes=c.map(x=>x.close),e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50),a=atr(c),rs=rsi(c);
 if(e9==null||e21==null||e50==null||a==null||rs==null||a<=0)return null;
 const up=e9>e21&&last.close>e50,down=e9<e21&&last.close<e50,range=last.high-last.low;
 const hi=Math.max(...c.slice(-21,-1).map(x=>x.high)),lo=Math.min(...c.slice(-21,-1).map(x=>x.low));
 const breakoutUp=last.close>hi,breakoutDown=last.close<lo,stretched=range>a*2.2;
 let d:null|"BUY"|"SELL"=null;
 if(bias!=="SELL"&&(up||breakoutUp)&&rs>48&&rs<78&&!stretched)d="BUY";
 if(bias!=="BUY"&&(down||breakoutDown)&&rs<52&&rs>22&&!stretched)d="SELL";
 if(!d)return null;
 const score=Math.min(96,65+(up||down?10:0)+(breakoutUp||breakoutDown?8:0)+((d==="BUY"&&rs>=52&&rs<=68)||(d==="SELL"&&rs>=32&&rs<=48)?8:4)+5);
 return{direction:d,score,entry:last.close,sl:d==="BUY"?last.close-a*1.25:last.close+a*1.25,tp:d==="BUY"?last.close+a*2.5:last.close-a*2.5};
}
function request(ws:WebSocket,payload:Record<string,unknown>,timeout=15000){return new Promise<any>((resolve,reject)=>{const req_id=Math.floor(Math.random()*1e9),timer=setTimeout(()=>{ws.removeEventListener("message",h);reject(new Error("Deriv timeout"))},timeout);const h=(e:MessageEvent)=>{try{const x=JSON.parse(String(e.data));if(x.req_id!==req_id)return;clearTimeout(timer);ws.removeEventListener("message",h);x.error?reject(new Error(x.error.message||"Deriv error")):resolve(x)}catch{}};ws.addEventListener("message",h);ws.send(JSON.stringify({...payload,req_id}))})}
async function getCandles(ws:WebSocket,symbol:string,p:{g:number;count:number}){const x=await request(ws,{ticks_history:symbol,end:"latest",style:"candles",granularity:p.g,count:p.count,subscribe:0,adjust_start_time:1});return(x.candles??[]).map((v:any)=>({epoch:+v.epoch,open:+v.open,high:+v.high,low:+v.low,close:+v.close})).filter((v:Candle)=>[v.epoch,v.open,v.high,v.low,v.close].every(Number.isFinite))}

Deno.serve(async(req)=>{
 if(req.method!=="POST")return new Response("POST required",{status:405});
 try{
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const secret=req.headers.get("x-botvio-automation-secret")??"";const {data:expected}=await db.rpc("get_botvio_automation_secret");
  if(!expected||secret!==expected)return new Response(JSON.stringify({success:false,error:"Unauthorized automation trigger"}),{status:401});
  await db.from("trading_signals").update({status:"EXPIRED"}).eq("status","ACTIVE").lt("expires_at",new Date().toISOString());
  const ws=new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
  await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error("Deriv WebSocket timeout")),12000);ws.addEventListener("open",()=>{clearTimeout(t);resolve()},{once:true});ws.addEventListener("error",()=>{clearTimeout(t);reject(new Error("Deriv WebSocket failed"))},{once:true})});
  const active=await request(ws,{active_symbols:"brief"});
  const symbols=(active.active_symbols??[]).map((x:any)=>({code:String(x.underlying_symbol??x.symbol),name:String(x.underlying_symbol_name??x.display_name??x.symbol),market:String(x.market??"")}))
    .filter((x:any)=>/synthetic|volatility|boom|crash|range break|step|jump|drift|dex/i.test(x.name+" "+x.market))
    .filter((x:any)=>!/1HZ|1M/i.test(x.code+" "+x.name));
  const body=await req.json().catch(()=>({}));const wanted=body?.symbol?String(body.symbol):null;
  const list=wanted?symbols.filter((x:any)=>x.code===wanted||x.name===wanted):symbols;
  const published:any[]=[];
  for(const s of list.slice(0,50)){
   const upper=s.name.toUpperCase();const bias=upper.includes("BOOM")?"BUY":upper.includes("CRASH")?"SELL":"BOTH";
   const frames=new Map<string,Candle[]>();await Promise.all(PLAN.map(async p=>{try{frames.set(p.tf,await getCandles(ws,s.code,p))}catch{frames.set(p.tf,[])}}));
   const sigs=new Map<string,Sig|null>();for(const p of PLAN)sigs.set(p.tf,makeSignal(frames.get(p.tf)??[],bias as any));
   for(const p of PLAN){
    const setup=sigs.get(p.tf);if(!setup)continue;const conf=p.confirm.map(x=>sigs.get(x)).filter(Boolean) as Sig[];
    if(conf.some(x=>x.direction!==setup.direction)||conf.filter(x=>x.direction===setup.direction).length<(p.confirm.length?1:0)||setup.score<76+p.boost)continue;
    const type=p.type,strategy=`Deriv Synthetic MTF · ${type} ${p.tf}`,expiresAt=new Date(Date.now()+p.expiry*1000).toISOString();
    const {data:recent}=await db.from("trading_signals").select("id").eq("symbol",s.name).eq("strategy_name",strategy).eq("direction",setup.direction).gte("created_at",new Date(Date.now()-(p.tf==="1m"?5:p.tf==="15m"?30:120)*60000).toISOString()).limit(1);
    if(recent?.length)continue;
    const {data:row,error}=await db.from("trading_signals").insert({
      symbol:s.name,direction:setup.direction,entry_price:setup.entry,stop_loss:setup.sl,take_profit:setup.tp,timeframe:p.tf,signal_type:type,
      strategy_name:strategy,confidence:Math.round(setup.score),broker:["deriv"],category:"synthetic",status:"ACTIVE",is_manual:false,
      expiry_seconds:p.expiry,best_expiry:p.expiry,backup_expiry:p.backup,expires_at:expiresAt,
      reason:`${s.name} ${type}: ${conf.filter(x=>x.direction===setup.direction).length}/${conf.length} higher-timeframe confirmations`,
      explanation_json:{engine:"Botvio Deriv Synthetic MTF Engine v1",signal_type:type,timeframe:p.tf,expiry_seconds:p.expiry,expires_at:expiresAt,source:"Deriv active_symbols + ticks_history"}
    }).select("id,symbol,direction,timeframe,signal_type,expiry_seconds,expires_at,confidence").single();
    if(!error&&row)published.push(row);
   }
  }
  try{ws.close()}catch{}
  return new Response(JSON.stringify({success:true,published,count:published.length,scanned:list.length,generated_at:new Date().toISOString()}),{headers:{"Content-Type":"application/json"}});
 }catch(e){return new Response(JSON.stringify({success:false,error:e instanceof Error?e.message:String(e)}),{status:500,headers:{"Content-Type":"application/json"}})}
});