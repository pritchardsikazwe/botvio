import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bell, CalendarDays, Globe2, Radio, ScanSearch, Settings2, ShieldAlert, Sparkles, Target, Timer, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import { useDerivLiveSignal } from "@/hooks/useDerivLiveSignal";
import { cn } from "@/lib/utils";

type ScanPhase = "pre" | "live" | "post";

const MARKETS = [
  { symbol: "XAUUSD", name: "XAU/USD", bias: "Bullish", status: "Ready", strength: 92 },
  { symbol: "EURUSD", name: "EUR/USD", bias: "Bearish", status: "Watch", strength: 78 },
  { symbol: "GBPUSD", name: "GBP/USD", bias: "Bearish", status: "Setup", strength: 84 },
  { symbol: "USDJPY", name: "USD/JPY", bias: "Bullish", status: "Ready", strength: 81 },
  { symbol: "US500", name: "US500", bias: "Bullish", status: "Watch", strength: 76 },
  { symbol: "NAS100", name: "NAS100", bias: "Volatile", status: "Setup", strength: 88 },
  { symbol: "Vol75", name: "Volatility 75", bias: "Volatile", status: "Ready", strength: 86 },
  { symbol: "Boom500", name: "Boom 500", bias: "Bullish", status: "Watch", strength: 73 },
];

const NEWS = [
  { time: "10:00", currency: "GBP", event: "London Session Open", impact: "session", note: "Session scan starts" },
  { time: "11:30", currency: "GBP", event: "Manufacturing PMI", impact: "high", note: "Momentum check" },
  { time: "12:00", currency: "EUR", event: "CPI (YoY)", impact: "high", note: "Euro volatility" },
  { time: "13:30", currency: "USD", event: "Non-Farm Payrolls (NFP)", impact: "high", note: "Fast-news mode" },
  { time: "13:30", currency: "USD", event: "Unemployment Rate", impact: "high", note: "Confirm release" },
  { time: "15:00", currency: "USD", event: "ISM Services PMI", impact: "medium", note: "Continuation scan" },
  { time: "19:00", currency: "USD", event: "FOMC Member Speech", impact: "high", note: "Headline risk" },
];

const SIGNALS = [
  { time: "07:28", market: "XAUUSD", direction: "BUY", entry: "2,346.20", tp1: "2,350.50", tp2: "2,354.00", sl: "2,344.00", phase: "Session", confidence: 82 },
  { time: "07:25", market: "GBPUSD", direction: "SELL", entry: "1.2510", tp1: "1.2470", tp2: "1.2450", sl: "1.2535", phase: "Pre-News", confidence: 78 },
  { time: "07:21", market: "EURUSD", direction: "BUY", entry: "1.0726", tp1: "1.0708", tp2: "1.0690", sl: "1.0738", phase: "Session", confidence: 75 },
  { time: "07:18", market: "US500", direction: "BUY", entry: "5,482.0", tp1: "5,500.0", tp2: "5,512.0", sl: "5,470.0", phase: "Pre-News", confidence: 80 },
  { time: "07:15", market: "BTCUSD", direction: "SELL", entry: "62,450", tp1: "61,800", tp2: "61,200", sl: "63,150", phase: "Session", confidence: 72 },
];

const sessions = [
  { name: "Sydney", time: "07:00–16:00", state: "Closed" },
  { name: "Tokyo", time: "08:00–17:00", state: "Closed" },
  { name: "London Open", time: "10:00–19:00", state: "Botvio scan" },
  { name: "New York", time: "15:00–24:00", state: "Upcoming" },
  { name: "London–NY", time: "15:00–19:00", state: "Overlap" },
];

function catTime() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lusaka", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
}

function nextLondonOpenCountdown() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lusaka", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(now);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  const target = new Date(Date.UTC(get("year"), get("month") - 1, get("day"), 10, 0, 0));
  const current = new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")));
  if (target <= current) target.setUTCDate(target.getUTCDate() + 1);
  const seconds = Math.max(0, Math.floor((target.getTime() - current.getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

const NewsTraderHub = () => {
  const [phase, setPhase] = useState<ScanPhase>("pre");
  const [autoScan, setAutoScan] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState("XAUUSD");
  const [cat, setCat] = useState(catTime());
  const [countdown, setCountdown] = useState(nextLondonOpenCountdown());
  const gold = useDerivLiveSignal("XAU/USD", 300);
  const selected = MARKETS.find(m => m.symbol === selectedMarket) ?? MARKETS[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCat(catTime());
      setCountdown(nextLondonOpenCountdown());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const scanLabel = phase === "pre" ? "PRE-NEWS SCAN" : phase === "live" ? "LIVE NEWS SCAN" : "POST-NEWS SCAN";
  const scanDescription = phase === "pre" ? "Scanning 30–180 minutes before major releases for levels and setups." : phase === "live" ? "Fast reaction mode: monitoring breakout, rejection and momentum changes." : "Scanning for continuation, pullback and reversal after the first move.";
  const liveDirection = gold.signal === "BUY" || gold.signal === "SELL" ? gold.signal : "WAIT";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Market & News Trader Hub | Botvio AI Trading" description="Botvio Market & News Trader Hub scans high-impact economic news, trading sessions and live markets for structured trade setups." />
      <Header />
      <main className="container mx-auto max-w-[1600px] space-y-5 px-3 py-5 md:px-5">
        <section className="grid gap-4 xl:grid-cols-[1fr_430px]">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="border-primary/30 bg-primary/15 text-primary">BOTVIO AI</Badge>
                  <Badge variant="outline" className="border-success/30 text-success"><span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-success" />SCANNING LIVE</Badge>
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">MARKET & <span className="text-success">NEWS TRADER HUB</span></h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Scan markets before, during and after high-impact news and key trading sessions. AI-assisted market context, structured entries, TP/SL and MT5 workflow.</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2">
                <ScanSearch className="h-5 w-5 text-success" />
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Market Scan Engine</p><p className="font-mono text-sm font-bold text-success">LIVE • 120+ markets</p></div>
              </div>
            </div>
          </div>
          <Card className="border-primary/20 bg-card/80">
            <CardContent className="flex h-full items-center gap-4 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><Zap className="h-7 w-7" /></div>
              <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Next High Impact Event</p><h2 className="mt-1 truncate font-black">U.S. Non-Farm Payrolls (NFP)</h2><p className="text-xs text-muted-foreground">USD • High Impact • 13:30 CAT</p></div>
              <div className="grid grid-cols-3 gap-1 text-center"><div className="rounded-lg border border-border/50 px-2 py-1"><b className="font-mono text-lg">02</b><span className="block text-[8px] text-muted-foreground">DAYS</span></div><div className="rounded-lg border border-border/50 px-2 py-1"><b className="font-mono text-lg">15</b><span className="block text-[8px] text-muted-foreground">HRS</span></div><div className="rounded-lg border border-border/50 px-2 py-1"><b className="font-mono text-lg">32</b><span className="block text-[8px] text-muted-foreground">MIN</span></div></div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {sessions.map((s, i) => <Card key={s.name} className={cn("border-border/50 bg-card/80", i === 2 && "border-success/50 bg-success/5")}><CardContent className="p-4"><div className="flex items-center justify-between"><Globe2 className={cn("h-4 w-4", i === 2 ? "text-success" : "text-muted-foreground")} /><span className={cn("text-[10px] font-bold", i === 2 ? "text-success" : "text-muted-foreground")}>{s.state}</span></div><p className="mt-2 text-sm font-black">{s.name}</p><p className="font-mono text-xs text-muted-foreground">{s.time} CAT</p>{i === 2 && <p className="mt-2 font-mono text-lg font-black text-success">{countdown}</p>}</CardContent></Card>)}
        </section>

        <section className="grid gap-3 lg:grid-cols-4">
          {[
            ["pre", "1", "PRE-NEWS SCAN", "30–180 min before event", ScanSearch, "Finds setups, levels and volatility"],
            ["live", "2", "LIVE NEWS SCAN", "Fast reaction during release", Zap, "Rapid entry confirmation"],
            ["post", "3", "POST-NEWS SCAN", "After the first move", TrendingUp, "Continuation or reversal"],
          ].map(([key, num, title, subtitle, Icon, detail]) => <button key={String(key)} type="button" onClick={() => setPhase(key as ScanPhase)} className={cn("rounded-2xl border p-4 text-left transition-all", phase === key ? "border-primary/50 bg-primary/10" : "border-border/50 bg-card/70 hover:border-primary/30")}><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-black text-primary">{num}</span><Icon className="h-5 w-5 text-primary" /><div><p className="font-black">{title}</p><p className="text-[11px] text-muted-foreground">{subtitle}</p></div></div><p className="mt-3 text-xs text-muted-foreground">{detail}</p></button>)}
          <Card className="border-success/30 bg-success/5"><CardContent className="flex h-full items-center justify-between gap-3 p-4"><div><p className="text-xs font-black">SESSION SCAN MODE</p><p className="mt-1 text-[11px] text-muted-foreground">Next: London Open at 10:00 CAT</p></div><Switch checked={autoScan} onCheckedChange={setAutoScan} /></CardContent></Card>
        </section>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"><div className="flex flex-wrap items-center gap-3"><Radio className="h-4 w-4 text-primary" /><b>{scanLabel}</b><span className="text-muted-foreground">{scanDescription}</span><Badge variant="outline" className="ml-auto">{autoScan ? "Auto Scan ON" : "Manual Scan"}</Badge></div></div>

        <section className="grid gap-5 xl:grid-cols-[1fr_1.55fr_350px]">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" /> High Impact News Calendar</CardTitle></CardHeader>
            <CardContent className="p-0"><div className="max-h-[510px] overflow-auto">{NEWS.map(n => <div key={n.time + n.event} className="border-t border-border/40 px-4 py-3 hover:bg-secondary/40"><div className="flex items-center gap-3"><span className="w-11 font-mono text-xs font-black">{n.time}</span><Badge variant="outline" className="w-12 justify-center text-[10px]">{n.currency}</Badge><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{n.event}</p><p className="text-[10px] text-muted-foreground">{n.note}</p></div><span className={cn("h-2.5 w-2.5 rounded-full", n.impact === "high" ? "bg-destructive" : n.impact === "medium" ? "bg-warning" : "bg-primary")} /></div></div>)}</div></CardContent>
          </Card>

          <Card className="overflow-hidden border-border/50 bg-card/80">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><div><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-success" /> {selected.name} Session & News Analysis</CardTitle><p className="mt-1 text-[10px] text-muted-foreground">London Open 10:00 CAT • {scanLabel}</p></div><Select value={selectedMarket} onValueChange={setSelectedMarket}><SelectTrigger className="w-[125px]"><SelectValue /></SelectTrigger><SelectContent>{MARKETS.map(m => <SelectItem key={m.symbol} value={m.symbol}>{m.name}</SelectItem>)}</SelectContent></Select></CardHeader>
            <CardContent className="p-3">{selectedMarket === "XAUUSD" ? <DerivLiveChart displaySymbol="XAU/USD" height={430} defaultGranularity={300} showHauza signalMarker={liveDirection === "WAIT" ? null : { direction: liveDirection as "BUY" | "SELL", confidence: gold.confidence }} /> : <div className="chart-grid flex h-[430px] items-center justify-center rounded-xl border border-border/40 bg-background/40"><div className="text-center"><Activity className="mx-auto h-10 w-10 text-primary" /><p className="mt-3 font-bold">{selected.name} analysis workspace</p><p className="text-xs text-muted-foreground">Market scanner selected. Connect the relevant live feed for this symbol.</p></div></div>}</CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" /> Trade Setup</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Badge className={liveDirection === "SELL" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}>{liveDirection}</Badge><Badge variant="outline">{phase === "pre" ? "Pre-News" : phase === "live" ? "News" : "Post-News"}</Badge></div>
              <div className="grid grid-cols-2 gap-2 text-xs">{[["Entry Zone","2,346.20–2,347.80"],["Stop Loss","2,344.00"],["TP1","2,350.50"],["TP2","2,354.00"]].map(([label,value]) => <div key={label} className="rounded-lg border border-border/50 p-3"><span className="text-muted-foreground">{label}</span><b className={cn("mt-1 block font-mono", label === "Stop Loss" ? "text-destructive" : label.startsWith("TP") ? "text-success" : "text-foreground")}>{value}</b></div>)}</div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs"><div className="flex justify-between"><span>Invalidation</span><b className="font-mono">2,343.50</b></div><div className="mt-2 flex justify-between"><span>Risk : Reward</span><b>1 : 2.1</b></div><div className="mt-2 flex justify-between"><span>Signal confidence</span><b>{gold.confidence ? gold.confidence + "%" : "Building..."}</b></div></div>
              <Button className="w-full font-black"><Zap className="mr-2 h-4 w-4" /> Send Setup to MT5</Button>
              <p className="flex gap-2 text-[10px] text-warning"><ShieldAlert className="h-3 w-3 shrink-0" /> News volatility can cause spread expansion and slippage. Setups are not guaranteed.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <Card className="border-border/50 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ScanSearch className="h-4 w-4 text-success" /> AI Opportunity Scanner</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full text-xs"><thead><tr className="border-b border-border/40 text-left text-muted-foreground"><th className="px-4 py-3">Market</th><th>Pre-News Bias</th><th>Session Bias</th><th>Setup</th><th>Strength</th></tr></thead><tbody>{MARKETS.map(m => <tr key={m.symbol} className="border-b border-border/30"><td className="px-4 py-3 font-bold">{m.name}</td><td className={m.bias === "Bearish" ? "text-destructive" : "text-success"}>{m.bias}</td><td className="text-success">Bullish</td><td><span className="mr-2 inline-block h-2 w-2 rounded-full bg-success" />{m.status}</td><td className="font-mono text-primary">{"★".repeat(Math.round(m.strength / 20))}{"☆".repeat(5 - Math.round(m.strength / 20))}</td></tr>)}</tbody></table></CardContent></Card>
          <Card className="border-border/50 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4 text-primary" /> Live Trade Signals</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full text-xs"><thead><tr className="border-b border-border/40 text-left text-muted-foreground"><th className="px-4 py-3">Time</th><th>Market</th><th>Direction</th><th>Entry</th><th>TP1</th><th>TP2</th><th>SL</th><th>Phase</th><th>Conf.</th></tr></thead><tbody>{SIGNALS.map(s => <tr key={s.time+s.market} className="border-b border-border/30"><td className="px-4 py-3 font-mono">{s.time}</td><td className="font-bold">{s.market}</td><td className={s.direction === "BUY" ? "font-black text-success" : "font-black text-destructive"}>{s.direction === "BUY" ? <TrendingUp className="mr-1 inline h-3 w-3" /> : <TrendingDown className="mr-1 inline h-3 w-3" />}{s.direction}</td><td className="font-mono">{s.entry}</td><td className="font-mono text-success">{s.tp1}</td><td className="font-mono text-success">{s.tp2}</td><td className="font-mono text-destructive">{s.sl}</td><td><Badge variant="outline" className="text-[9px]">{s.phase}</Badge></td><td className="font-mono">{s.confidence}%</td></tr>)}</tbody></table></CardContent></Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="flex items-center gap-3 p-4"><Timer className="h-5 w-5 text-primary" /><div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your Time (CAT)</p><p className="font-mono text-xl font-black">{cat}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Bell className="h-5 w-5 text-warning" /><div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">News Alerts</p><p className="text-sm font-bold">High-impact events ready</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Settings2 className="h-5 w-5 text-success" /><div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Scanner Status</p><p className="text-sm font-bold text-success">{autoScan ? "Automatic scanning enabled" : "Manual mode"}</p></div></CardContent></Card>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
          <div><p className="font-bold">Need deeper chart analysis?</p><p className="text-xs text-muted-foreground">Open Botvio AI Chart Analysis for structure, support/resistance and trade-plan analysis.</p></div>
          <div className="flex gap-2"><Button variant="outline" asChild><Link to="/news-calendar"><CalendarDays className="mr-2 h-4 w-4" />Full News Calendar</Link></Button><Button asChild><Link to="/chart/XAUUSD"><Sparkles className="mr-2 h-4 w-4" />AI Chart Analysis</Link></Button></div>
        </div>
      </main>
    </div>
  );
};

export default NewsTraderHub;
