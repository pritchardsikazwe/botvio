// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DERIV_WS = "wss://api.derivws.com/trading/v1/options/ws/public";

const SYMBOL_MAP: Record<string, string> = {
  // Deriv synthetic indices used by the Options command center.
  "Volatility 10": "R_10",
  "Volatility 75": "R_75",
  "Volatility 100": "R_100",
  "Vol 100 (1s)": "1HZ100V",
  "Boom 1000": "BOOM1000",
  "Crash 1000": "CRASH1000",
  "XAU/USD": "frxXAUUSD",
  "XAG/USD": "frxXAGUSD",
  "EUR/USD": "frxEURUSD",
  "GBP/USD": "frxGBPUSD",
  "USD/JPY": "frxUSDJPY",
  "AUD/USD": "frxAUDUSD",
  "BTC/USD": "cryBTCUSD",
  "ETH/USD": "cryETHUSD",
  "NAS100": "OTC_NDX",
  "NASDAQ": "OTC_NDX",
  "US30": "OTC_DJI",
  "DJ30": "OTC_DJI",
  "US500": "OTC_SPX",
  "SP500": "OTC_SPX",
  "GER40": "OTC_DAX",
  "UK100": "OTC_FTSE",
  "USOIL": "OTC_OIL",
  "XBRUSD": "OTC_BRENT",
};

interface Candle { epoch:number; open:number; high:number; low:number; close:number; }

type StrategyProfile = {
  id:string; label:string; minConfidence:number; stop:number; target:number;
  lookback1m:number; lookback5m:number; maxExtension:number;
  rsiBuyMin:number; rsiBuyMax:number; rsiSellMin:number; rsiSellMax:number;
};

const STRATEGIES: Record<string, StrategyProfile> = {
  "XAU/USD": {id:"GOLD_SCALP",label:"Gold Structure + Liquidity Scalper",minConfidence:82,stop:1.05,target:2.2,lookback1m:18,lookback5m:16,maxExtension:1.2,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "XAG/USD": {id:"SILVER_BREAKOUT",label:"Silver Breakout + Retest",minConfidence:80,stop:1.1,target:2.15,lookback1m:18,lookback5m:16,maxExtension:1.25,rsiBuyMin:47,rsiBuyMax:73,rsiSellMin:27,rsiSellMax:53},
  "BTC/USD": {id:"BTC_MOMENTUM",label:"Bitcoin Volatility Momentum",minConfidence:83,stop:1.35,target:2.7,lookback1m:20,lookback5m:18,maxExtension:1.5,rsiBuyMin:50,rsiBuyMax:76,rsiSellMin:24,rsiSellMax:50},
  "ETH/USD": {id:"CRYPTO_MOMENTUM",label:"Ethereum Momentum",minConfidence:81,stop:1.3,target:2.55,lookback1m:20,lookback5m:18,maxExtension:1.45,rsiBuyMin:49,rsiBuyMax:75,rsiSellMin:25,rsiSellMax:51},
  "NAS100": {id:"NAS100_BREAK_RETEST",label:"NAS100 Breakout + Retest",minConfidence:82,stop:1.15,target:2.5,lookback1m:16,lookback5m:14,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "NASDAQ": {id:"NAS100_BREAK_RETEST",label:"NAS100 Breakout + Retest",minConfidence:82,stop:1.15,target:2.5,lookback1m:16,lookback5m:14,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "GBP/USD": {id:"GBP_PULLBACK",label:"GBP Momentum Pullback",minConfidence:80,stop:1.0,target:2.1,lookback1m:18,lookback5m:16,maxExtension:1.15,rsiBuyMin:48,rsiBuyMax:70,rsiSellMin:30,rsiSellMax:52},
  "EUR/USD": {id:"FX_PULLBACK",label:"EUR Trend + Pullback",minConfidence:79,stop:1.0,target:2.0,lookback1m:18,lookback5m:16,maxExtension:1.2,rsiBuyMin:48,rsiBuyMax:70,rsiSellMin:30,rsiSellMax:52},
  "USD/JPY": {id:"FX_PULLBACK",label:"JPY Trend + Pullback",minConfidence:79,stop:1.0,target:2.0,lookback1m:18,lookback5m:16,maxExtension:1.2,rsiBuyMin:48,rsiBuyMax:70,rsiSellMin:30,rsiSellMax:52},
  "AUD/USD": {id:"FX_PULLBACK",label:"AUD Trend + Pullback",minConfidence:78,stop:1.0,target:2.0,lookback1m:18,lookback5m:16,maxExtension:1.2,rsiBuyMin:48,rsiBuyMax:70,rsiSellMin:30,rsiSellMax:52},
  "US30": {id:"US_INDEX_BREAKOUT",label:"US30 Breakout + Retest",minConfidence:81,stop:1.35,target:2.6,lookback1m:18,lookback5m:16,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "DJ30": {id:"US_INDEX_BREAKOUT",label:"Dow Breakout + Retest",minConfidence:81,stop:1.35,target:2.6,lookback1m:18,lookback5m:16,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "US500": {id:"US_INDEX_BREAKOUT",label:"US500 Breakout + Retest",minConfidence:80,stop:1.3,target:2.55,lookback1m:18,lookback5m:16,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "SP500": {id:"US_INDEX_BREAKOUT",label:"S&P 500 Breakout + Retest",minConfidence:80,stop:1.3,target:2.55,lookback1m:18,lookback5m:16,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "GER40": {id:"EU_INDEX_BREAKOUT",label:"GER40 Breakout + Retest",minConfidence:79,stop:1.3,target:2.5,lookback1m:18,lookback5m:16,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "UK100": {id:"EU_INDEX_BREAKOUT",label:"UK100 Breakout + Retest",minConfidence:79,stop:1.3,target:2.5,lookback1m:18,lookback5m:16,maxExtension:1.3,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52},
  "USOIL": {id:"OIL_MOMENTUM",label:"US Oil Momentum + Pullback",minConfidence:80,stop:1.4,target:2.65,lookback1m:18,lookback5m:16,maxExtension:1.4,rsiBuyMin:48,rsiBuyMax:73,rsiSellMin:27,rsiSellMax:52},
  "XBRUSD": {id:"OIL_MOMENTUM",label:"Brent Momentum + Pullback",minConfidence:80,stop:1.4,target:2.65,lookback1m:18,lookback5m:16,maxExtension:1.4,rsiBuyMin:48,rsiBuyMax:73,rsiSellMin:27,rsiSellMax:52},
};

function strategyFor(symbol:string):StrategyProfile {
  return STRATEGIES[symbol] ?? {id:"ADAPTIVE_BREAKOUT",label:"Adaptive Breakout + Pullback",minConfidence:80,stop:1.1,target:2.1,lookback1m:18,lookback5m:16,maxExtension:1.25,rsiBuyMin:48,rsiBuyMax:72,rsiSellMin:28,rsiSellMax:52};
}

async function fetchCandles(symbol:string, granularity:number, count=80):Promise<Candle[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(DERIV_WS); const out:Candle[]=[];
    const t=setTimeout(()=>{try{ws.close()}catch{} resolve(out)},12000);
    ws.onopen=()=>ws.send(JSON.stringify({ticks_history:symbol,adjust_start_time:1,count,end:"latest",granularity,style:"candles"}));
    ws.onmessage=(ev)=>{
      try {
        const m=JSON.parse(ev.data);
        if(m.candles){ for(const c of m.candles) out.push({epoch:Number(c.epoch),open:+c.open,high:+c.high,low:+c.low,close:+c.close}); clearTimeout(t); ws.close(); resolve(out); }
        else if(m.error){clearTimeout(t);ws.close();resolve(out)}
      } catch {}
    };
    ws.onerror=()=>{clearTimeout(t);resolve(out)};
  });
}

function ema(values:number[],period:number):number|null {
  if(values.length<period)return null;
  let e=values.slice(0,period).reduce((a,b)=>a+b,0)/period, k=2/(period+1);
  for(let i=period;i<values.length;i++) e=(values[i]-e)*k+e;
  return e;
}
function rsi(c:Candle[],period=14):number|null {
  if(c.length<=period)return null; let g=0,l=0;
  for(let i=c.length-period;i<c.length;i++){const d=c[i].close-c[i-1].close;if(d>0)g+=d;else l-=d}
  if(l===0)return 100; return 100-100/(1+(g/period)/(l/period));
}
function atr(c:Candle[],period=14):number|null {
  if(c.length<=period)return null;
  const tr=c.slice(1).map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-c[i].close),Math.abs(x.low-c[i].close)));
  return tr.slice(-period).reduce((a,b)=>a+b,0)/period;
}

type ScalpSignal={type:string;side:"BUY"|"SELL";entry:number;sl:number;tp:number;level:number;atr:number;confidence:number;tf:"1m"|"5m";strategy:string};

function detectScalpSignal(candles:Candle[], tf:"1m"|"5m", profile:StrategyProfile):ScalpSignal|null {
  if(candles.length<60)return null;
  const closed=candles.slice(0,-1), last=closed.at(-1)!;
  const closes=closed.map(c=>c.close), e9=ema(closes,9),e21=ema(closes,21),e50=ema(closes,50),a=atr(closed),rs=rsi(closed);
  if(e9==null||e21==null||e50==null||a==null||a<=0||rs==null)return null;
  const lookback=tf==="1m"?profile.lookback1m:profile.lookback5m;
  const prior=closed.slice(-lookback-2,-2);
  if(prior.length<8)return null;
  const hi=Math.max(...prior.map(c=>c.high)),lo=Math.min(...prior.map(c=>c.low));
  const range=last.high-last.low, body=Math.abs(last.close-last.open);
  const upper=last.high-Math.max(last.open,last.close),lower=Math.min(last.open,last.close)-last.low;
  const bullReject=last.close>last.open && lower>Math.max(body*.8,a*.18);
  const bearReject=last.close<last.open && upper>Math.max(body*.8,a*.18);
  const trendUp=e9>e21&&e21>e50&&last.close>e50,trendDown=e9<e21&&e21<e50&&last.close<e50;
  const breakoutUp=last.close>hi&&closed.at(-2)!.close<=hi,breakoutDown=last.close<lo&&closed.at(-2)!.close>=lo;
  const extensionUp=(last.close-e9)/a,extensionDown=(e9-last.close)/a;
  if(range>=a*2.25||extensionUp>profile.maxExtension||extensionDown>profile.maxExtension)return null;

  let side:"BUY"|"SELL"|null=null,confidence=0,type="";
  if(breakoutUp&&trendUp&&rs>=profile.rsiBuyMin&&rs<=profile.rsiBuyMax){side="BUY";confidence=78;type="breakout_retest";} 
  else if(breakoutDown&&trendDown&&rs>=profile.rsiSellMin&&rs<=profile.rsiSellMax){side="SELL";confidence=78;type="breakout_retest";}
  else if(trendUp&&bullReject&&rs>=profile.rsiBuyMin&&rs<=profile.rsiBuyMax){side="BUY";confidence=74;type="trend_pullback";}
  else if(trendDown&&bearReject&&rs>=profile.rsiSellMin&&rs<=profile.rsiSellMax){side="SELL";confidence=74;type="trend_pullback";}
  if(!side)return null;

  const priorRange=Math.max(...closed.slice(-8).map(c=>c.high-c.low));
  if(range>priorRange*1.25)confidence+=4;
  if(tf==="5m")confidence+=4;
  if(side==="BUY"&&last.close>last.open)confidence+=3;
  if(side==="SELL"&&last.close<last.open)confidence+=3;
  if(confidence<profile.minConfidence)return null;

  const slDist=Math.max(a*profile.stop,Math.abs(last.close-e21)*0.8);
  return {
    type,side,entry:last.close,
    sl:side==="BUY"?last.close-slDist:last.close+slDist,
    tp:side==="BUY"?last.close+slDist*profile.target:last.close-slDist*profile.target,
    level:side==="BUY"?hi:lo,atr:a,confidence:Math.min(96,confidence),tf,strategy:profile.label
  };
}

function isMarketOpen(symbol:string):boolean {
  const now=new Date(),day=now.getUTCDay(),hour=now.getUTCHours();
  if(symbol.startsWith("BTC")||symbol.startsWith("ETH"))return true;
  if(day===6)return false;
  if(day===0&&hour<21)return false;
  if(day===5&&hour>=21)return false;
  return true;
}

async function runForUser(supabase:any,settings:any){
  const userId=settings.user_id;
  const log=(msg:string,extra?:any)=>console.log(`[auto-trade-scalp ${userId.slice(0,8)}] ${msg}`,extra||"");
  const {data:pnlRow}=await supabase.rpc("get_auto_trade_today_pnl",{_user_id:userId});
  const todayPnl=Number(pnlRow?.[0]?.realized_pnl_usd??0);
  const lossLimitUsd=-(settings.stake_usd*settings.daily_loss_limit_pct);
  if(todayPnl<=lossLimitUsd&&todayPnl<0)return{skipped:"daily_loss_limit_hit",pnl:todayPnl};

  const {data:connections}=await supabase.from("deriv_connections").select("id,login_id,account_type,is_connected,env").eq("user_id",userId).eq("is_connected",true);
  const conn=(connections||[]).find((c:any)=>{
    const virtual=c.env==="demo"||(c.login_id&&c.login_id.startsWith("VRT"));
    return settings.account_type==="demo"?virtual:!virtual;
  });
  if(!conn)return{skipped:"no_connection"};

  const results:any[]=[];
  for(const displaySymbol of settings.enabled_assets){
    const derivSymbol=SYMBOL_MAP[displaySymbol]; if(!derivSymbol)continue;
    if(!isMarketOpen(displaySymbol)){results.push({displaySymbol,skipped:"market_closed"});continue;}
    const {data:hasOpen}=await supabase.rpc("has_open_auto_trade",{_user_id:userId,_display_symbol:displaySymbol});
    if(hasOpen===true){results.push({displaySymbol,skipped:"already_open"});continue;}

    const profile=strategyFor(displaySymbol);
    const [c1m,c5m,c15m,c1h,c1d]=await Promise.all([
      fetchCandles(derivSymbol,60,120),fetchCandles(derivSymbol,300,120),
      fetchCandles(derivSymbol,900,120),fetchCandles(derivSymbol,3600,120),
      fetchCandles(derivSymbol,86400,120)
    ]);
    const s5=detectScalpSignal(c5m,"5m",profile),s1=detectScalpSignal(c1m,"1m",profile);
    const s15=detectScalpSignal(c15m,"5m",profile),s1h=detectScalpSignal(c1h,"5m",profile),s1d=detectScalpSignal(c1d,"5m",profile);
    const candidates=[s5,s1,s15,s1h,s1d].filter(Boolean) as ScalpSignal[];
    const sig=candidates.sort((a,b)=>b.confidence-a.confidence)[0]??null;
    if(!sig){results.push({displaySymbol,skipped:"no_strategy_setup",strategy:profile.id});continue;}
    if(sig.confidence<Math.max(settings.min_confidence??0,profile.minConfidence)){results.push({displaySymbol,skipped:"confidence_gate",confidence:sig.confidence,strategy:profile.id});continue;}

    // Multi-timeframe confirmation: 1m entries must respect 15m/1H direction;
    // 15m/5m entries should respect 1H when available. Daily is a macro filter.
    const htf = [s15,s1h,s1d].filter(Boolean) as ScalpSignal[];
    const conflicts = htf.filter(x=>x.side!==sig.side).length;
    if(conflicts >= 2){results.push({displaySymbol,skipped:"higher_tf_conflict",strategy:profile.id});continue;}
    const agreement = htf.filter(x=>x.side===sig.side).length;
    const requiredAgreement = sig.tf==="5m" ? (s1h ? 1 : 0) : 0;
    if(agreement < requiredAgreement){results.push({displaySymbol,skipped:"higher_tf_not_confirmed",strategy:profile.id});continue;}

    const {data:recent}=await supabase.from("auto_trade_executions").select("id").eq("user_id",userId).eq("display_symbol",displaySymbol).in("status",["pending","filled"]).gte("created_at",new Date(Date.now()-5*60*1000).toISOString()).limit(1);
    if(recent?.length){results.push({displaySymbol,skipped:"cooldown"});continue;}

    const {data:execRow,error:execErr}=await supabase.from("auto_trade_executions").insert({
      user_id:userId,display_symbol:displaySymbol,deriv_symbol:derivSymbol,side:sig.side,signal_type:sig.type,
      signal_tf:sig.tf,confidence:sig.confidence,entry_price:sig.entry,stop_loss:sig.sl,take_profit:sig.tp,
      stake_usd:settings.stake_usd,multiplier:settings.multiplier,account_type:settings.account_type,status:"pending"
    }).select("id").single();
    if(execErr){log("insert failed",execErr);continue;}

    const slDistance=Math.abs(sig.entry-sig.sl),tpDistance=Math.abs(sig.tp-sig.entry);
    try{
      const resp=await fetch(`${SUPABASE_URL}/functions/v1/deriv-trade-execute`,{
        method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${SERVICE_KEY}`,"apikey":SERVICE_KEY,"x-internal-user-id":userId},
        body:JSON.stringify({connection_id:conn.id,contract_family:"MULTIPLIERS",payload:{symbol:derivSymbol,contract_type:sig.side==="BUY"?"MULTUP":"MULTDOWN",stake:settings.stake_usd,currency:"USD",multiplier:settings.multiplier,limit_order:{stop_loss:Number(slDistance.toFixed(6)),take_profit:Number(tpDistance.toFixed(6))}},idempotency_key:`auto-${execRow.id}`})
      });
      const data=await resp.json();
      if(!resp.ok||!data?.success){
        await supabase.from("auto_trade_executions").update({status:"rejected",error_message:data?.error||`HTTP ${resp.status}`,raw_response:data}).eq("id",execRow.id);
        results.push({displaySymbol,rejected:data?.error});
      }else{
        await supabase.from("auto_trade_executions").update({status:"filled",contract_id:data.contract_id||null,raw_response:data}).eq("id",execRow.id);
        results.push({displaySymbol,filled:true,contract_id:data.contract_id,strategy:profile.id,confidence:sig.confidence});
      }
    }catch(e:any){
      await supabase.from("auto_trade_executions").update({status:"failed",error_message:e?.message||String(e)}).eq("id",execRow.id);
      results.push({displaySymbol,failed:e?.message});
    }
  }
  return{user:userId,results};
}

serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const supabase=createClient(SUPABASE_URL,SERVICE_KEY);
    const trigger=req.headers.get("x-botvio-automation-secret")??"";
    const {data:expectedSecret,error:secretError}=await supabase.rpc("get_botvio_automation_secret");
    if(secretError||!expectedSecret||trigger!==expectedSecret)return new Response(JSON.stringify({ok:false,error:"Unauthorized automation trigger"}),{status:401,headers:{...corsHeaders,"Content-Type":"application/json"}});
    const {data:settingsList,error}=await supabase.from("auto_trade_settings").select("*").eq("enabled",true);
    if(error)throw error;
    const all=[]; for(const s of settingsList||[]){if(!s.enabled_assets?.length)continue;try{all.push(await runForUser(supabase,s))}catch(e:any){all.push({user:s.user_id,error:e?.message})}}
    return new Response(JSON.stringify({ok:true,processed:all.length,results:all}),{headers:{...corsHeaders,"Content-Type":"application/json"}});
  }catch(e:any){console.error("[auto-trade-scalp] error:",e);return new Response(JSON.stringify({ok:false,error:e?.message}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}})}
});
