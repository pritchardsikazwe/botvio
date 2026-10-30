import { useEffect, useMemo, useRef, useState } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBinaryCandleFeed } from "@/hooks/useBinaryCandleFeed";
import { analyzeBinary, binaryRiskStop, type BinaryLimits, type BinaryResult, type BinarySetup, type BinaryStrategy } from "@/lib/binaryStrategies";
import { fetchActiveSymbols } from "@/services/deriv/derivSymbols";
import { BinaryCandleChart } from "./BinaryCandleChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, OctagonX, ScanLine, ShieldCheck } from "lucide-react";
import type { Timeframe } from "@/lib/marketData/types";

function ScanRow({symbol,name,strategy,onSelect}:{symbol:string;name:string;strategy:BinaryStrategy;onSelect:()=>void}) {
  const feed=useBinaryCandleFeed(symbol);
  const setup=useMemo(()=>analyzeBinary(feed.candles,strategy),[feed.candles,strategy]);
  return <Button variant="outline" onClick={onSelect} className="h-auto min-h-20 flex-col items-start whitespace-normal p-3 text-left">
    <span className="flex w-full items-center justify-between gap-2"><strong className="text-xs">{name}</strong><Badge variant="outline" className={setup.direction==="RISE"?"text-success":setup.direction==="FALL"?"text-destructive":"text-muted-foreground"}>{feed.status==="live"?setup.direction:"NO TRADE"}</Badge></span>
    <span className="mt-2 text-xs text-muted-foreground">{feed.price??"—"} · {setup.trend} · RSI {setup.rsi?.toFixed(1)??"—"}</span>
    <span className="text-xs text-muted-foreground">{feed.error?"Data unavailable":setup.reason}</span>
  </Button>;
}

export function BinaryStrategyWorkspace({automation=false,onApply}:{automation?:boolean;onApply?:(symbol:string,duration:3|5)=>void}) {
  const {user}=useAuth();
  const deriv=useDeriv();
  const [markets,setMarkets]=useState<{symbol:string;name:string}[]>([]);
  const [symbol,setSymbol]=useState("R_75");
  const [strategy,setStrategy]=useState<BinaryStrategy>("precision");
  const [both,setBoth]=useState(false);
  const [timeframe,setTimeframe]=useState<Timeframe>("1m");
  const [chartMode,setChartMode]=useState<"ticks"|"candles">("ticks");
  const [scanner,setScanner]=useState(false);
  const [selected,setSelected]=useState<string[]>(["R_75"]);
  const [on,setOn]=useState(false);
  const [stake,setStake]=useState(1);
  const [limits,setLimits]=useState<BinaryLimits>({hourly:5,consecutiveLosses:3,dailyLoss:10,quality:80});
  const [message,setMessage]=useState<string|null>(null);
  const [ledger,setLedger]=useState<{entries:number[];results:BinaryResult[];pending:number|null}>({entries:[],results:[],pending:null});
  const feed=useBinaryCandleFeed(symbol,"1m");
  const displayFeed=useBinaryCandleFeed(symbol,timeframe,timeframe!=="1m");
  const precision=useMemo(()=>analyzeBinary(feed.candles,"precision"),[feed.candles]);
  const trend=useMemo(()=>analyzeBinary(feed.candles,"trend"),[feed.candles]);
  const setup=strategy==="precision"?precision:trend;
  const storageKey=`botvio_binary_risk:${user?.id}:${deriv.accountId}`;
  useEffect(()=>{
    setOn(false); setLedger({entries:[],results:[],pending:null});
    try { const raw=sessionStorage.getItem(storageKey); if(raw) {const saved=JSON.parse(raw); if(Array.isArray(saved.entries)&&Array.isArray(saved.results)) setLedger(saved);} } catch {setMessage("Risk history unavailable; automation stays off");}
  },[storageKey]);
  useEffect(()=>{if(user&&deriv.accountId) sessionStorage.setItem(storageKey,JSON.stringify(ledger));},[ledger,storageKey,user,deriv.accountId]);
  useEffect(()=>{
    let alive=true;
    fetchActiveSymbols().then(rows=>{if(alive) setMarkets(Object.values(rows).filter(r=>!Number(r.is_trading_suspended??0)&&Number(r.exchange_is_open??1)).map(r=>({symbol:r.symbol,name:r.display_name})));}).catch(()=>setMessage("Deriv instrument catalogue unavailable. Retry when the feed recovers."));
    return ()=>{alive=false;};
  },[]);
  useEffect(()=>deriv.onContractUpdate(update=>{
    if(!["won","lost","sold"].includes(update.status)) return;
    const profit=Number(update.profit); if(!Number.isFinite(profit)) {setOn(false);setMessage("Return unavailable. Automation stopped.");return;}
    setLedger(old=>old.pending!==update.contract_id?old:{...old,pending:null,results:[{id:update.contract_id,time:Date.now(),profit},...old.results.filter(r=>r.id!==update.contract_id)].slice(0,100)});
  }),[deriv.onContractUpdate]);
  const stopReason=binaryRiskStop(limits,ledger.results,ledger.entries);
  useEffect(()=>{if(on && (stopReason || !deriv.isDerivConnected || deriv.accountType!=="DEMO" || !selected.includes(symbol))) {setOn(false);setMessage(stopReason||"Account or instrument changed; automation stopped");}},[on,stopReason,deriv.isDerivConnected,deriv.accountType,selected,symbol]);

  const chartFeed=timeframe==="1m"?feed:displayFeed;
  const current=feed.candles.at(-1);
  const marketName=markets.find(m=>m.symbol===symbol)?.name??symbol;
  return <section className="space-y-4" aria-label="Rise Fall strategy workspace">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold"><ScanLine className="h-5 w-5 text-primary" />Rise / Fall Strategies</h2><Badge variant="outline">{feed.status==="live"?"Live market data":feed.status}</Badge></div>
    <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="binary-instrument">Instrument</Label><Select value={symbol} onValueChange={v=>{setOn(false);setSymbol(v);}}><SelectTrigger id="binary-instrument"><SelectValue /></SelectTrigger><SelectContent>{markets.length?markets.map(m=><SelectItem key={m.symbol} value={m.symbol}>{m.name}</SelectItem>):<SelectItem value="R_75">Volatility 75 · checking availability</SelectItem>}</SelectContent></Select></div><div><Label>Strategy expiry</Label><div className="grid grid-cols-2 gap-2"><Button variant={strategy==="precision"?"default":"outline"} onClick={()=>{setOn(false);setStrategy("precision");}}>3m Precision</Button><Button variant={strategy==="trend"?"default":"outline"} onClick={()=>{setOn(false);setStrategy("trend");}}>5m Trend Confirmation</Button></div></div></div>
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-1"><Button size="sm" variant={chartMode==="ticks"?"secondary":"ghost"} onClick={()=>setChartMode("ticks")}>Ticks</Button><Button size="sm" variant={chartMode==="candles"?"secondary":"ghost"} onClick={()=>setChartMode("candles")}>Candles</Button>{chartMode==="candles"&&(["1m","3m","5m","15m"] as Timeframe[]).map(tf=><Button key={tf} size="sm" variant={timeframe===tf?"secondary":"ghost"} onClick={()=>setTimeframe(tf)}>{tf}</Button>)}</div><Button size="sm" variant="outline" onClick={()=>{feed.refresh();displayFeed.refresh();}}><RefreshCw className="mr-2 h-4 w-4" />Refresh chart</Button></div>
    <BinaryCandleChart key={symbol} candles={chartFeed.candles} analysisCandles={feed.candles} ticks={feed.ticks} mode={chartMode} setup={setup} />
    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{marketName} · {chartMode==="ticks"?`${feed.ticks.length} live ticks`:`${timeframe} candles`} · Closed 1m strategy / RSI 14</span><span>RSI {setup.rsi?.toFixed(1)??"—"} · Price {feed.price??"—"}</span><span>{current?`O ${current.open} · H ${current.high} · L ${current.low} · C ${current.close}`:"Data unavailable"}</span></div>
    <div className="grid gap-3 md:grid-cols-[1fr_2fr]"><div className="border-l-4 border-primary bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{setup.duration}-minute expiry · quality, not win probability</p><h3 className={`mt-2 text-2xl font-bold ${setup.direction==="RISE"?"text-success":setup.direction==="FALL"?"text-destructive":"text-muted-foreground"}`}>{feed.status==="live"?setup.direction:"NO TRADE"}</h3><p className="mt-2 text-sm">{setup.quality}/100 · {setup.confirmations.length} confirmations</p><p className="mt-2 text-xs text-muted-foreground">{setup.time?new Date(setup.time*1000).toLocaleTimeString()+` · Entry ${setup.entry}`:setup.reason}</p></div><div className="grid grid-cols-2 gap-3">{[["Trend",setup.trend],["RSI 14",setup.rsi?.toFixed(1)??"—"],["Support",setup.support??"—"],["Resistance",setup.resistance??"—"],["M / W pattern",setup.pattern],["Trendline",setup.trendline]].map(([label,value])=><div key={label} className="border-b border-border py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div>)}</div></div>
    <p className="text-sm text-muted-foreground">{feed.error||setup.reason}</p>
    {setup.confirmations.length>0&&<ul className="flex flex-wrap gap-2" aria-label="Strategy confirmations">{setup.confirmations.map(c=><li key={c}><Badge variant="outline">{c}</Badge></li>)}</ul>}
    <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={()=>setScanner(v=>!v)}><ScanLine className="mr-2 h-4 w-4" />{scanner?"Stop scanner":"Scan selected instruments"}</Button><span className="text-xs text-muted-foreground">Up to 4 selected instruments at once</span>{onApply&&<Button onClick={()=>onApply(symbol,setup.duration)}>Use {setup.duration}m setup in trade form</Button>}</div>
    <div className="flex flex-wrap gap-2">{markets.slice(0,40).map(m=><Button key={m.symbol} size="sm" variant={selected.includes(m.symbol)?"secondary":"outline"} disabled={on} onClick={()=>setSelected(old=>old.includes(m.symbol)?old.filter(s=>s!==m.symbol):old.length<4?[...old,m.symbol]:old)}>{m.name}</Button>)}</div>
    {scanner&&<div className="grid gap-3 md:grid-cols-2">{selected.map(s=><ScanRow key={s} symbol={s} name={markets.find(m=>m.symbol===s)?.name??s} strategy={strategy} onSelect={()=>{setOn(false);setSymbol(s);}} />)}</div>}
    {automation&&<section className="border-t border-border pt-4" aria-label="Strategy automation">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-success" />Demo strategy automation</h3><div className="flex items-center gap-2"><Label htmlFor="binary-auto">OFF</Label><Switch id="binary-auto" checked={false} disabled /><Button variant="destructive" size="sm" onClick={()=>{setOn(false);setMessage("Stopped. Existing contracts remain visible in My trades.");}}><OctagonX className="mr-2 h-4 w-4" />Emergency STOP</Button></div></div>
      <p className="mt-2 text-xs text-warning">New strategy execution is disabled until server-side risk enforcement and connected-demo acceptance are verified. These controls do not start the existing cloud multiplier bot.</p>
      <div className="mt-3 flex items-center gap-2"><Switch id="binary-both" checked={both} disabled={on} onCheckedChange={setBoth}/><Label htmlFor="binary-both">Use both strategies (conflicting directions rejected)</Label></div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{[{id:"stake",label:`Stake (${deriv.currency??"USD"})`,value:stake,set:setStake,min:0.35,max:100,step:0.01},{id:"hourly",label:"Max trades per hour",value:limits.hourly,set:(v:number)=>setLimits(l=>({...l,hourly:v})),min:1,max:20,step:1},{id:"loss-streak",label:"Max consecutive losses",value:limits.consecutiveLosses,set:(v:number)=>setLimits(l=>({...l,consecutiveLosses:v})),min:1,max:10,step:1},{id:"daily-loss",label:`Daily loss limit (${deriv.currency??"USD"})`,value:limits.dailyLoss,set:(v:number)=>setLimits(l=>({...l,dailyLoss:v})),min:1,max:50,step:1},{id:"quality",label:"Minimum quality",value:limits.quality,set:(v:number)=>setLimits(l=>({...l,quality:v})),min:75,max:95,step:1}].map(field=><div key={field.id}><Label htmlFor={`binary-${field.id}`} className="text-xs">{field.label}</Label><Input id={`binary-${field.id}`} type="number" inputMode="decimal" value={field.value} min={field.min} max={field.max} step={field.step} disabled={on} onChange={e=>field.set(Number(e.target.value))}/></div>)}</div>
      <p className="mt-3 text-xs text-muted-foreground">1 open contract · 20 trades/day maximum · fixed stake · no martingale · no automatic retries</p>
      <p className="mt-2 text-sm" role="status">{message||stopReason||"Automation is off until you enable it."}</p>
      {ledger.pending&&<p className="mt-2 font-semibold">Contract #{ledger.pending} running · awaiting broker result</p>}
      {ledger.results.length>0&&<div className="mt-3 space-y-2">{ledger.results.slice(0,5).map(r=><div key={r.id} className="flex justify-between border-b border-border py-2 text-sm"><span>#{r.id} · {new Date(r.time).toLocaleTimeString()}</span><span className={r.profit>=0?"text-success":"text-destructive"}>{r.profit>0?"Win":r.profit<0?"Loss":"Flat"} · {r.profit.toFixed(2)} {deriv.currency}</span></div>)}</div>}
    </section>}
    <p className="border-t border-border pt-3 text-xs text-muted-foreground">Rule-based market analysis, not a forecast or profit guarantee. Practise on demo. The entire stake can be lost.</p>
  </section>;
}