import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Flame, RefreshCw, Activity } from "lucide-react";
import { createMarketDataAdapter } from "@/lib/marketData/registry";
import type { FeedStatus, NormalizedCandle, Timeframe } from "@/lib/marketData/types";

type Market = { symbol: string; name: string; source: "deriv" | "weltrade-api-studio"; feedSymbol: string };
type LiveMarket = Market & { status: FeedStatus; candles: NormalizedCandle[]; price: number | null; lastUpdate: number | null; error?: string | null };
const synthetic: Market[] = [
  { symbol: "Volatility 75", name: "V75 Index", source: "deriv", feedSymbol: "R_75" },
  { symbol: "Boom 1000", name: "Boom 1000", source: "deriv", feedSymbol: "BOOM1000" },
  { symbol: "Crash 1000", name: "Crash 1000", source: "deriv", feedSymbol: "CRASH1000" },
  { symbol: "Volatility 25", name: "V25 Index", source: "deriv", feedSymbol: "R_25" },
  { symbol: "Step Index", name: "Step Index", source: "deriv", feedSymbol: "stpRNG" },
];
const weltrade: Market[] = [
  { symbol: "XAUUSD", name: "Gold", source: "weltrade-api-studio", feedSymbol: "XAUUSD" },
  { symbol: "USOIL", name: "WTI Crude", source: "weltrade-api-studio", feedSymbol: "USOIL" },
  { symbol: "NAS100", name: "Nasdaq 100", source: "weltrade-api-studio", feedSymbol: "NAS100" },
  { symbol: "BTCUSD", name: "Bitcoin", source: "weltrade-api-studio", feedSymbol: "BTCUSD" },
  { symbol: "AUDUSD", name: "Aussie / USD", source: "weltrade-api-studio", feedSymbol: "AUDUSD" },
];
const forex: Market[] = [
  { symbol: "EURUSD", name: "Euro / USD", source: "weltrade-api-studio", feedSymbol: "EURUSD" },
  { symbol: "GBPUSD", name: "Pound / USD", source: "weltrade-api-studio", feedSymbol: "GBPUSD" },
  { symbol: "USDJPY", name: "USD / Yen", source: "weltrade-api-studio", feedSymbol: "USDJPY" },
  { symbol: "AUDUSD", name: "Aussie / USD", source: "weltrade-api-studio", feedSymbol: "AUDUSD" },
  { symbol: "USDCAD", name: "USD / CAD", source: "weltrade-api-studio", feedSymbol: "USDCAD" },
];
const all = [...synthetic, ...weltrade, ...forex];
const statusLabel: Record<FeedStatus, string> = { idle: "Idle", connecting: "Connecting", live: "LIVE", reconnecting: "Reconnecting", delayed: "Delayed", unavailable: "Unavailable", error: "Feed error" };
function analyze(candles: NormalizedCandle[]) {
  if (candles.length < 50) return { direction: "WAIT" as const, strength: null, setup: "Collecting candles", note: "Need at least 50 live-feed candles" };
  const closes = candles.map(c => c.close);
  const ema = (period: number) => {
    const k = 2 / (period + 1); let value = closes.slice(0, period).reduce((a,b)=>a+b,0) / period;
    for (let i=period;i<closes.length;i++) value = closes[i] * k + value * (1-k);
    return value;
  };
  const e9 = ema(9), e21 = ema(21), e50 = ema(50), last = candles[candles.length-1];
  const direction = e9 > e21 && last.close > e50 ? "BUY" : e9 < e21 && last.close < e50 ? "SELL" : "WAIT";
  const separation = Math.abs(e9-e21) / Math.max(Math.abs(last.close), 1e-8) * 10000;
  const strength = direction === "WAIT" ? null : Math.min(99, Math.round(50 + separation * 3 + Math.abs(last.close-e50)/Math.max(Math.abs(last.close),1e-8)*1000));
  const priorHigh = Math.max(...candles.slice(-21,-1).map(c=>c.high));
  const priorLow = Math.min(...candles.slice(-21,-1).map(c=>c.low));
  const setup = last.close > priorHigh ? "Live breakout" : last.close < priorLow ? "Live breakdown" : direction === "WAIT" ? "No aligned trend" : "EMA trend alignment";
  return { direction, strength, setup, note: `EMA 9/21/50 · last candle ${new Date(last.time*1000).toLocaleTimeString()}` };
}
function MarketTable({ title, markets }: { title: string; markets: LiveMarket[] }) {
  return <Card className="border-border/70 bg-card/80"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y text-muted-foreground"><th className="px-4 py-2 text-left">Market</th><th className="px-3 py-2 text-left">Live price</th><th className="px-3 py-2 text-left">Bias / setup</th><th className="px-4 py-2 text-right">Feed</th></tr></thead><tbody>{markets.map(m => { const a=analyze(m.candles); return <tr key={m.symbol+m.feedSymbol} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3"><div className="font-medium">{m.symbol}</div><div className="text-xs text-muted-foreground">{m.name}</div></td><td className="px-3 py-3 tabular-nums">{m.price == null ? "—" : m.price.toLocaleString(undefined,{maximumFractionDigits:5})}</td><td className="px-3 py-3"><div className={a.direction==="BUY"?"font-semibold text-emerald-500":a.direction==="SELL"?"font-semibold text-rose-500":"font-medium text-muted-foreground"}>{a.direction==="BUY"?<ArrowUp className="mr-1 inline h-3.5 w-3.5"/>:a.direction==="SELL"?<ArrowDown className="mr-1 inline h-3.5 w-3.5"/>:null}{a.direction}{a.strength == null ? "" : ` · ${a.strength}%`}</div><div className="text-xs text-muted-foreground">{a.setup}</div></td><td className="px-4 py-3 text-right"><Badge variant={m.status==="live"?"default":"outline"}>{statusLabel[m.status]}</Badge>{m.error && <div className="mt-1 max-w-36 text-xs text-rose-500">{m.error}</div>}</td></tr>; })}</tbody></table></div></CardContent></Card>;
}
export default function TrendingMarkets() {
  const [group, setGroup] = useState("All Markets");
  const [timeframe, setTimeframe] = useState<Timeframe>("4H");
  const [refreshKey, setRefreshKey] = useState(0);
  const [live, setLive] = useState<LiveMarket[]>(all.map(m=>({...m,status:"idle",candles:[],price:null,lastUpdate:null})));
  useEffect(() => {
    let mounted=true;
    const adapters: ReturnType<typeof createMarketDataAdapter>[]=[];
    const initial=all.map(m=>({...m,status:"connecting" as FeedStatus,candles:[],price:null,lastUpdate:null,error:null}));
    setLive(initial);
    all.forEach((market,index)=>{
      let candles: NormalizedCandle[]=[];
      const adapter=createMarketDataAdapter(market.source,{feedSymbol:market.feedSymbol,timeframe,historyLimit:250});
      adapters.push(adapter);
      adapter.start({
        onSnapshot(next){candles=next; if(mounted)setLive(prev=>prev.map((row,i)=>i===index?{...row,candles:next,price:next.at(-1)?.close??row.price,lastUpdate:Date.now()}:row));},
        onCandle(c){candles=[...candles.filter(x=>x.time!==c.time),c].sort((a,b)=>a.time-b.time).slice(-250); if(mounted)setLive(prev=>prev.map((row,i)=>i===index?{...row,candles,price:c.close,lastUpdate:Date.now()}:row));},
        onTick(t){if(mounted)setLive(prev=>prev.map((row,i)=>i===index?{...row,price:t.price,lastUpdate:Date.now()}:row));},
        onStatus(status,detail){if(mounted)setLive(prev=>prev.map((row,i)=>i===index?{...row,status,error:detail?.error??null}:row));}
      });
    });
    return ()=>{mounted=false;adapters.forEach(a=>a.stop());};
  },[timeframe,refreshKey]);
  const groups = [{ label: "All Markets", data: all }, { label: "Synthetic Indices", data: synthetic }, { label: "Weltrade (MT5)", data: weltrade }, { label: "Major Currencies", data: forex }];
  const filtered = useMemo(()=>live.filter(m=>group==="All Markets"||groups.find(g=>g.label===group)?.data.some(x=>x.feedSymbol===m.feedSymbol&&x.source===m.source)),[group,live]);
  const buys=filtered.filter(m=>analyze(m.candles).direction==="BUY").length;
  const sells=filtered.filter(m=>analyze(m.candles).direction==="SELL").length;
  const liveCount=filtered.filter(m=>m.status==="live").length;
  const byMarkets=(list:Market[])=>list.map(m=>live.find(x=>x.source===m.source&&x.feedSymbol===m.feedSymbol)!).filter(Boolean);
  return <div className="min-h-screen bg-background"><Header/><main className="container mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Subscription <span className="mx-2">›</span> Trending Markets</p><h1 className="mt-2 flex items-center gap-2 text-2xl font-bold md:text-3xl"><Flame className="h-7 w-7 text-amber-500"/>Live Trending Markets</h1><p className="mt-1 text-sm text-muted-foreground">Streaming quotes and candle-derived trend bias. Signals are technical indicators, not guarantees.</p></div><Button variant="outline" size="sm" onClick={()=>setRefreshKey(k=>k+1)}><RefreshCw className="mr-2 h-4 w-4"/>Reconnect feeds</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Live feeds</p><p className="text-2xl font-bold">{liveCount}<span className="text-sm font-normal text-muted-foreground"> / {filtered.length}</span></p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Live BUY bias</p><p className="text-2xl font-bold text-emerald-500">{buys}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Live SELL bias</p><p className="text-2xl font-bold text-rose-500">{sells}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Last update</p><p className="text-base font-semibold">{filtered.reduce((n,m)=>Math.max(n,m.lastUpdate??0),0)?new Date(filtered.reduce((n,m)=>Math.max(n,m.lastUpdate??0),0)).toLocaleTimeString():"Waiting…"}</p></CardContent></Card></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{groups.map(g=><Button key={g.label} size="sm" variant={group===g.label?"default":"outline"} onClick={()=>setGroup(g.label)}>{g.label}</Button>)}</div><div className="flex items-center gap-2 text-sm text-muted-foreground">Timeframe {(["1H","4H","1D"] as Timeframe[]).map(t=><Button key={t} size="sm" variant={timeframe===t?"default":"outline"} onClick={()=>setTimeframe(t)}>{t}</Button>)}</div></div>
    <div className="grid gap-4 xl:grid-cols-3"><MarketTable title="Synthetic Indices · Live" markets={group==="All Markets"||group==="Synthetic Indices"?byMarkets(synthetic):filtered.slice(0,5)}/><MarketTable title="Weltrade MT5 · Live" markets={group==="All Markets"||group==="Weltrade (MT5)"?byMarkets(weltrade):filtered.slice(0,5)}/><MarketTable title="Major FX · Live" markets={group==="All Markets"||group==="Major Currencies"?byMarkets(forex):filtered.slice(0,5)}/></div>
    <p className="text-xs text-muted-foreground">Feed status is sourced from the connected market-data adapter. BUY/SELL bias is computed from the latest received candles (EMA 9/21/50); unavailable symbols remain visibly unavailable. Prices and signals may be delayed by the broker or network.</p>
  </main></div>;
}
