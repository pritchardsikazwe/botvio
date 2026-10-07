import type { IndicatorSet } from "./indicators";
import type { EngineSignal, SignalEngineOptions } from "./signalEngine";
import type { NormalizedCandle } from "./types";
import { getSyntxProfile, type SyntxFamily, type SyntxStrategyMode } from "./syntxStrategy";

const PROGRESSION = new Set<SyntxFamily>(["plusx","fibox","quadx","max-painx","max-gainx"]);

function structure(c:NormalizedCandle[],i:number,d:"BUY"|"SELL"){if(i<6)return 0;const a=c[i-2],b=c[i-4],z=c[i-6];return d==="BUY"?(a.high>b.high&&b.high>z.high&&a.low>b.low&&b.low>z.low?12:0):(a.high<b.high&&b.high<z.high&&a.low<b.low&&b.low<z.low?12:0)}
function rejection(c:NormalizedCandle[],i:number,d:"BUY"|"SELL",atr:number){const x=c[i],body=Math.abs(x.close-x.open),lo=Math.min(x.open,x.close)-x.low,hi=x.high-Math.max(x.open,x.close);return d==="BUY"&&lo>body*1.2&&lo>atr*.25?8:d==="SELL"&&hi>body*1.2&&hi>atr*.25?8:0}
function result(c:NormalizedCandle[],i:number,d:"BUY"|"SELL",sl:number,tp:number){for(let j=i+1;j<c.length;j++){if(d==="BUY"){if(c[j].low<=sl)return"LOSS" as const;if(c[j].high>=tp)return"WIN" as const}else{if(c[j].high>=sl)return"LOSS" as const;if(c[j].low<=tp)return"WIN" as const}}return"OPEN" as const}

type Regime = "BUY" | "SELL" | "NEUTRAL";

function regimeAt(c:NormalizedCandle[],i:number,ind:IndicatorSet):Regime {
  const e9=ind.ema9[i],e21=ind.ema21[i],e50=ind.ema50[i],prev21=ind.ema21[i-3];
  if(e9==null||e21==null||prev21==null) return "NEUTRAL";
  const price=c[i].close;
  const slope=e21-prev21;
  const bull=e9>e21&&(e50==null||e21>=e50)&&price>=e21&&slope>=0;
  const bear=e9<e21&&(e50==null||e21<=e50)&&price<=e21&&slope<=0;
  return bull?"BUY":bear?"SELL":"NEUTRAL";
}

function regimeAligned(regime:Regime,d:"BUY"|"SELL"){return regime===d;}

export interface SyntxEngineOptions extends SignalEngineOptions { family:SyntxFamily; mode:SyntxStrategyMode }

export function computeSyntxSignalsV2(candles:NormalizedCandle[],opts:SyntxEngineOptions,ind:IndicatorSet):EngineSignal[]{
 if(candles.length<80||PROGRESSION.has(opts.family))return[];
 const out:EngineSignal[]=[];const min=opts.minConfidence??65;
 for(let i=40;i<candles.length;i++){
  const x=candles[i],e9=ind.ema9[i],e21=ind.ema21[i],e50=ind.ema50[i],rsi=ind.rsi14[i],atr=ind.atr14[i];
  if(e9==null||e21==null||rsi==null||atr==null||atr<=0)continue;
  const up=e9>e21&&(e50==null||x.close>e50),down=e9<e21&&(e50==null||x.close<e50),expanded=x.high-x.low>atr*1.8;
  const regime=regimeAt(candles,i,ind);
  const hi=Math.max(...candles.slice(i-20,i).map(v=>v.high)),lo=Math.min(...candles.slice(i-20,i).map(v=>v.low));
  let d:"BUY"|"SELL"|null=null,score=0,reason="";
  if(opts.family==="painx"&&up&&!expanded&&(opts.mode==="trend"||x.low<=e9&&x.close>e9)){d="BUY";score=68+structure(candles,i,"BUY")+rejection(candles,i,"BUY",atr);reason="PainX buy-bias · directional structure and pullback evidence";}
  else if(opts.family==="gainx"&&down&&!expanded&&(opts.mode==="trend"||x.high>=e9&&x.close<e9)){d="SELL";score=68+structure(candles,i,"SELL")+rejection(candles,i,"SELL",atr);reason="GainX sell-bias · directional structure and pullback evidence";}
  else if(opts.family==="flipx"&&rsi<=32&&x.close<=lo+atr*.45&&regime!=="SELL"){d="BUY";score=72+rejection(candles,i,"BUY",atr);reason="FlipX · support rejection and RSI extreme · regime aligned";}
  else if(opts.family==="flipx"&&rsi>=68&&x.close>=hi-atr*.45&&regime!=="BUY"){d="SELL";score=72+rejection(candles,i,"SELL",atr);reason="FlipX · resistance rejection and RSI extreme · regime aligned";}
  else if(opts.family==="trendx"){const u=structure(candles,i,"BUY")>=12&&regime!=="SELL",s=structure(candles,i,"SELL")>=12&&regime!=="BUY";if(u){d="BUY";score=78;reason="TrendX · higher-high/higher-low structure confirmed · regime aligned"}else if(s){d="SELL";score=78;reason="TrendX · lower-high/lower-low structure confirmed · regime aligned"}}
  else if(opts.family==="switchx"){const u=structure(candles,i,"BUY")>=12&&regime!=="SELL",s=structure(candles,i,"SELL")>=12&&regime!=="BUY";if(u||s){d=u?"BUY":"SELL";score=75;reason="SwitchX · post-switch directional structure observed · regime aligned"}}
  else if(opts.family==="breakx"){const jumps=candles.slice(Math.max(0,i-40),i).map(v=>v.high-v.low).filter(v=>v>atr*.8),a=jumps.at(-1)??0,b=jumps.at(-2)??0;const candidate=x.close>x.open?"BUY":"SELL";if(a>b&&regimeAligned(regime,candidate)){d=candidate;score=77;reason="BreakX · larger observed jump followed by candle confirmation · regime aligned"}}
  else if((opts.family==="fx-vol"||opts.family==="sfx-vol")&&!expanded&&(up||down)){d=up?"BUY":"SELL";score=66+structure(candles,i,d);reason=opts.family==="sfx-vol"?"SFX Vol · trend setup without spike expansion · regime aligned":"FX Vol · volatility trend structure confirmed · regime aligned"}
  if(!d||score<min)continue;
  // Hard counter-trend gate: never publish a signal against a confirmed EMA regime.
  if(regimeAligned(regime,d)===false && regime!=="NEUTRAL")continue;
  const entry=x.close,sl=d==="BUY"?entry-atr*1.5:entry+atr*1.5,tp=d==="BUY"?entry+atr*2.2:entry-atr*2.2;
  out.push({id:`${opts.symbol}-${opts.timeframe}-${x.time}-${d}-v2`,symbol:opts.symbol,label:opts.label,timeframe:opts.timeframe,direction:d,strategy:`${getSyntxProfile(opts.family)?.label??"SyntX"} · ${opts.mode} · Engine v2`,confidence:Math.min(96,Math.round(score)),entry,stopLoss:sl,takeProfit:tp,time:x.time,index:i,result:result(candles,i,d,sl,tp),reason});
 }
 return out.slice(-(opts.maxSignals??40));
}

export function getSyntxStateV2(c:NormalizedCandle[],family:SyntxFamily,ind:IndicatorSet){
 if(c.length<40)return{label:"Data unavailable",detail:"More live Weltrade MT5 candles are required."};
 const i=c.length-1,a=ind.atr14[i],e9=ind.ema9[i],e21=ind.ema21[i];if(a==null||e9==null||e21==null)return{label:"Warming up",detail:"Indicators are still warming up."};
 if(PROGRESSION.has(family))return{label:"Tick sequence required",detail:"Botvio will not invent a progression signal from candles."};
 const u=structure(c,i,"BUY")>=12,d=structure(c,i,"SELL")>=12;
 if(family==="painx")return{label:u?"BUY structure observed":"PainX buy-bias",detail:"Weltrade-compatible directional evidence only; drops remain possible."};
 if(family==="gainx")return{label:d?"SELL structure observed":"GainX sell-bias",detail:"Weltrade-compatible directional evidence only; jumps remain possible."};
 if(family==="flipx")return{label:"Range observed",detail:"Support/resistance and RSI are used; the next step is not predicted."};
 if(family==="switchx")return{label:u?"Up regime":d?"Down regime":"Transition",detail:"Only observable post-switch structure is classified."};
 if(family==="breakx")return{label:"Jump comparison active",detail:"Visible jump ranges are compared; incomplete tick history reduces confidence."};
 if(family==="trendx")return{label:u?"Confirmed up structure":d?"Confirmed down structure":"No confirmed trend",detail:"Trend state requires structural evidence."};
 return{label:e9>e21?"Uptrend observed":"Downtrend observed",detail:"Derived from real Weltrade MT5 candles."};
}