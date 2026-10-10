import { Link } from "react-router-dom";
import { Activity, ArrowRight, Bot, Check, CircleStop, Gauge, Link2, Pause, Play, ShieldCheck, SlidersHorizontal, Target, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const signalMarkets = ["Weltrade GainX 600", "Deriv Boom & Crash", "Deriv Volatility Indices", "Gold", "Bitcoin"];
const tradePlan = [
  { label: "Entry", icon: TrendingUp },
  { label: "Stop-loss", icon: ShieldCheck },
  { label: "Take-profit", icon: Target },
  { label: "Market analysis", icon: Activity },
];
const copySteps = [
  { title: "Connect MT5", text: "Link a supported MT5 account through Botvio's existing secure connection flow.", icon: Link2 },
  { title: "Choose a source", text: "Select Botvio Robot or an approved signal provider available to your account.", icon: Users },
  { title: "Set your controls", text: "Choose instruments and review risk and lot-size settings before copying.", icon: SlidersHorizontal },
  { title: "Control and monitor", text: "Start, pause or stop copying, then monitor broker-returned trades and status.", icon: Gauge },
];

export function HomeTradingPathways() {
  return (
    <div className="border-y border-border/50 bg-card/20">
      <section className="container mx-auto grid gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center" aria-labelledby="home-ai-signals-title">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">AI SIGNALS & MARKET ANALYSIS</Badge>
          <h2 id="home-ai-signals-title" className="text-3xl font-black sm:text-4xl">Structured setups across the markets you trade.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Botvio analyses available market data for Weltrade GainX 600, Deriv Boom and Crash, Deriv Volatility Indices, Gold and Bitcoin. When a valid setup is available, the signal can include an entry, stop-loss, take-profit and supporting analysis.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {signalMarkets.map((market) => <span key={market} className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs font-semibold">{market}</span>)}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning" />Signals are decision-support tools, not guaranteed outcomes. Levels and analysis appear only when the underlying market data supports them.</p>
          <Button asChild className="mt-6 font-bold"><Link to="/signals">Explore signals <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid grid-cols-2 gap-3" aria-label="Signal details">
          {tradePlan.map(({ label, icon: Icon }, index) => <div key={label} className="min-h-32 rounded-xl border border-border/60 bg-background/70 p-5"><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${index === 1 ? "bg-destructive/10 text-destructive" : index === 2 ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}><Icon className="h-5 w-5" /></span><p className="mt-5 text-sm font-bold">{label}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Shown where available for the selected market setup.</p></div>)}
        </div>
      </section>

      <section className="border-t border-border/50 bg-background/50" aria-labelledby="home-copy-mt5-title">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary">COPY TRADING TO MT5</Badge>
            <h2 id="home-copy-mt5-title" className="text-3xl font-black sm:text-4xl">You stay in control of every copied trade.</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Connect MT5, choose Botvio Robot or an approved provider, set the instruments and risk controls that fit your account, and monitor the resulting trades.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copySteps.map(({ title, text, icon: Icon }, index) => <div key={title} className="relative border-t border-border/70 pt-5"><span className="absolute -top-3 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">{index + 1}</span><Icon className="h-6 w-6 text-primary" /><h3 className="mt-4 text-base font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></div>)}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-start"><span className="flex items-center gap-1.5"><Play className="h-3.5 w-3.5 text-success" />Start</span><span className="flex items-center gap-1.5"><Pause className="h-3.5 w-3.5 text-warning" />Pause</span><span className="flex items-center gap-1.5"><CircleStop className="h-3.5 w-3.5 text-destructive" />Stop</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />Monitor</span></div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"><Button asChild className="font-bold"><Link to="/copy-trading">Explore copy trading <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link to="/connections"><Bot className="mr-2 h-4 w-4" />Connect MT5</Link></Button></div>
          </div>
          <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">Copy trading involves risk. Execution depends on your connected account, selected settings and provider availability; profits are not guaranteed.</p>
        </div>
      </section>
    </div>
  );
}