import { useMemo, useState } from "react";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Flame, RefreshCw, Target, TrendingUp, Activity } from "lucide-react";

type Market = { symbol: string; name: string; direction: "BUY" | "SELL"; setup: string; strength: number; timeframe: string; note: string };
const synthetic: Market[] = [
  { symbol: "Volatility 75", name: "V75 Index", direction: "BUY", setup: "H4 breakout", strength: 92, timeframe: "H4", note: "Momentum above recent range" },
  { symbol: "Boom 1000", name: "Boom 1000", direction: "SELL", setup: "H4 pullback", strength: 88, timeframe: "H4", note: "Bearish pressure after spike" },
  { symbol: "Crash 1000", name: "Crash 1000", direction: "SELL", setup: "D1 trend", strength: 86, timeframe: "D1", note: "Lower highs remain in control" },
  { symbol: "Volatility 25", name: "V25 Index", direction: "BUY", setup: "H4 breakout", strength: 84, timeframe: "H4", note: "Range expansion watch" },
  { symbol: "Step Index", name: "Step Index", direction: "BUY", setup: "H4 continuation", strength: 82, timeframe: "H4", note: "Higher-low structure" },
];
const weltrade: Market[] = [
  { symbol: "XAUUSD", name: "Gold", direction: "BUY", setup: "H4 breakout", strength: 94, timeframe: "H4", note: "Resistance break watch" },
  { symbol: "USOIL", name: "WTI Crude", direction: "BUY", setup: "H4 breakout", strength: 89, timeframe: "H4", note: "Bullish range expansion" },
  { symbol: "NAS100", name: "Nasdaq 100", direction: "SELL", setup: "D1 reversal", strength: 87, timeframe: "D1", note: "Daily supply zone nearby" },
  { symbol: "BTCUSD", name: "Bitcoin", direction: "BUY", setup: "H4 continuation", strength: 85, timeframe: "H4", note: "Trend continuation candidate" },
  { symbol: "AUDUSD", name: "Aussie / USD", direction: "SELL", setup: "H4 breakdown", strength: 82, timeframe: "H4", note: "Support breakdown watch" },
];
const forex: Market[] = [
  { symbol: "EURUSD", name: "Euro / USD", direction: "BUY", setup: "H4 breakout", strength: 90, timeframe: "H4", note: "Resistance retest candidate" },
  { symbol: "GBPUSD", name: "Pound / USD", direction: "BUY", setup: "H4 continuation", strength: 88, timeframe: "H4", note: "Higher-timeframe bullish bias" },
  { symbol: "USDJPY", name: "USD / Yen", direction: "SELL", setup: "H4 breakdown", strength: 86, timeframe: "H4", note: "Lower range boundary in focus" },
  { symbol: "AUDUSD", name: "Aussie / USD", direction: "BUY", setup: "H4 breakout", strength: 84, timeframe: "H4", note: "Compression breakout watch" },
  { symbol: "USDCAD", name: "USD / CAD", direction: "SELL", setup: "D1 reversal", strength: 83, timeframe: "D1", note: "Daily reversal candidate" },
];
const all = [...synthetic, ...weltrade, ...forex];
function MarketTable({ title, markets, color }: { title: string; markets: Market[]; color: string }) {
  return <Card className="border-border/70 bg-card/80"><CardHeader className="pb-3"><CardTitle className={`flex items-center gap-2 text-base ${color}`}><Activity className="h-4 w-4" />{title}</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y text-muted-foreground"><th className="px-4 py-2 text-left">Market</th><th className="px-3 py-2 text-left">Flow</th><th className="px-3 py-2 text-left">HTF setup</th><th className="px-4 py-2 text-right">Strength</th></tr></thead><tbody>{markets.map(m => <tr key={m.symbol} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3"><div className="font-medium">{m.symbol}</div><div className="text-xs text-muted-foreground">{m.name}</div></td><td className="px-3 py-3"><span className={m.direction === "BUY" ? "inline-flex items-center gap-1 font-semibold text-emerald-500" : "inline-flex items-center gap-1 font-semibold text-rose-500"}>{m.direction === "BUY" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}{m.direction}</span></td><td className="px-3 py-3"><div>{m.setup}</div><div className="text-xs text-muted-foreground">{m.note}</div></td><td className="px-4 py-3 text-right"><Badge variant="outline" className="border-emerald-500/40 text-emerald-500">{m.strength}%</Badge></td></tr>)}</tbody></table></div></CardContent></Card>;
}
export default function TrendingMarkets() {
  const [group, setGroup] = useState("All Markets");
  const [timeframe, setTimeframe] = useState("H4");
  const [updated, setUpdated] = useState(new Date());
  const groups = [{ label: "All Markets", data: all }, { label: "Synthetic Indices", data: synthetic }, { label: "Weltrade (MT5)", data: weltrade }, { label: "Major Currencies", data: forex }];
  const filtered = useMemo(() => groups.find(g => g.label === group)?.data ?? all, [group]);
  const buys = filtered.filter(m => m.direction === "BUY").length;
  const sells = filtered.length - buys;
  const breakouts = filtered.filter(m => m.setup.toLowerCase().includes("breakout")).length;
  const top = [...filtered].sort((a,b) => b.strength-a.strength).slice(0,3);
  return <div className="min-h-screen bg-background"><Header /><main className="container mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Subscription <span className="mx-2">›</span> Trending Markets</p><h1 className="mt-2 flex items-center gap-2 text-2xl font-bold md:text-3xl"><Flame className="h-7 w-7 text-amber-500" />Trending Markets</h1><p className="mt-1 text-sm text-muted-foreground">Market pressure, higher-timeframe breakouts and watchlist setups.</p></div><Button variant="outline" size="sm" onClick={() => setUpdated(new Date())}><RefreshCw className="mr-2 h-4 w-4" />Refresh view</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-full bg-emerald-500/15 p-3 text-emerald-500"><ArrowUp /></div><div><p className="text-sm text-muted-foreground">Massive Buying</p><p className="text-2xl font-bold">{buys}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-full bg-rose-500/15 p-3 text-rose-500"><ArrowDown /></div><div><p className="text-sm text-muted-foreground">Massive Selling</p><p className="text-2xl font-bold">{sells}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-full bg-amber-500/15 p-3 text-amber-500"><TrendingUp /></div><div><p className="text-sm text-muted-foreground">HTF Breakout Watch</p><p className="text-2xl font-bold">{breakouts}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-full bg-violet-500/15 p-3 text-violet-500"><Target /></div><div><p className="text-sm text-muted-foreground">Top Setups</p><p className="text-2xl font-bold">{top.length}</p></div></CardContent></Card></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{groups.map(g => <Button key={g.label} size="sm" variant={group===g.label?"default":"outline"} onClick={() => setGroup(g.label)}>{g.label}</Button>)}</div><div className="flex items-center gap-2 text-sm text-muted-foreground">HTF {["H1","H4","D1","W1"].map(t => <Button key={t} size="sm" variant={timeframe===t?"default":"outline"} onClick={() => setTimeframe(t)}>{t}</Button>)}</div></div>
    <div className="grid gap-4 xl:grid-cols-3"><MarketTable title="5 Synthetic Indices · Trending" markets={group==="All Markets"||group==="Synthetic Indices"?synthetic:filtered.slice(0,5)} color="text-violet-500" /><MarketTable title="5 Weltrade Markets · Trending" markets={group==="All Markets"||group==="Weltrade (MT5)"?weltrade:filtered.slice(0,5)} color="text-sky-500" /><MarketTable title="5 Major Currencies · Trending" markets={group==="All Markets"||group==="Major Currencies"?forex:filtered.slice(0,5)} color="text-emerald-500" /></div>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-emerald-500" />Top Breakout Setups ({timeframe})</CardTitle></CardHeader><CardContent className="space-y-3">{[...filtered].filter(m=>m.setup.toLowerCase().includes("breakout")||m.setup.toLowerCase().includes("breakdown")).sort((a,b)=>b.strength-a.strength).slice(0,4).map(m=><div key={m.symbol} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><div className="font-semibold">{m.symbol} <Badge variant="outline">{timeframe}</Badge></div><div className="text-xs text-muted-foreground">{m.setup} · {m.note}</div></div><Badge className={m.direction==="BUY"?"bg-emerald-600":"bg-rose-600"}>{m.direction} · {m.strength}%</Badge></div>)}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-amber-500" />AI Top Trading Setups</CardTitle></CardHeader><CardContent className="space-y-3">{top.map(m=><div key={m.symbol} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border p-3"><div><div className="font-semibold">{m.symbol} <span className="text-xs text-muted-foreground">{m.setup}</span></div><div className="text-xs text-muted-foreground">{m.note}</div></div><Badge className={m.direction==="BUY"?"bg-emerald-600":"bg-rose-600"}>{m.direction} · {m.strength}%</Badge></div>)}</CardContent></Card></div>
    <p className="text-xs text-muted-foreground">Last view refresh: {updated.toLocaleString()} · These are illustrative UI watchlist values, not live market data or verified trading signals. The selected timeframe is a display filter; live feed and signal-engine integration is a separate step.</p>
  </main></div>;
}
