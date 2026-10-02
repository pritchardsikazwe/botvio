import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBots, useBotInstances, useTradingAccounts, useCreateBotInstance, useUpdateBotInstance } from "@/hooks/useBotvio";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/trading/Header";
import { useNavigate, Link } from "react-router-dom";
import { Bot, Play, Pause, Square, Settings2, ArrowRight, ShieldCheck, Sparkles, Zap, Bell, Eye, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/seo/SEOHead";

type Mode = "auto" | "signals" | "watch";
type Risk = "conservative" | "balanced" | "aggressive";
type Market = "gold" | "forex" | "indices" | "crypto" | "synthetic";

const MARKETS: { id: Market; label: string; sub: string }[] = [
  { id: "gold", label: "Gold / XAUUSD", sub: "MT5" },
  { id: "forex", label: "Forex", sub: "MT5" },
  { id: "indices", label: "Indices", sub: "MT5" },
  { id: "crypto", label: "Crypto", sub: "Broker / exchange" },
  { id: "synthetic", label: "Synthetic Indices", sub: "Deriv" },
];

const RISK: Record<Risk, { label: string; description: string; risk: number; loss: number; trades: number }> = {
  conservative: { label: "Conservative", description: "Lower exposure and tighter limits", risk: 0.5, loss: 2, trades: 2 },
  balanced: { label: "Balanced", description: "Moderate exposure and limits", risk: 1, loss: 5, trades: 3 },
  aggressive: { label: "Aggressive", description: "Higher exposure and limits", risk: 2, loss: 8, trades: 5 },
};

const Bots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bots } = useBots();
  const { data: instances, isLoading: instancesLoading } = useBotInstances();
  const { data: accounts } = useTradingAccounts();
  const createInstance = useCreateBotInstance();
  const updateInstance = useUpdateBotInstance();
  const { data: entitlements } = useEntitlements();

  const [step, setStep] = useState(1);
  const [market, setMarket] = useState<Market>("synthetic");
  const [mode, setMode] = useState<Mode>("signals");
  const [risk, setRisk] = useState<Risk>("balanced");
  const [accountId, setAccountId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedBot = useMemo(() => bots?.find((b: any) => b.code === "botvio") ?? bots?.[0] ?? null, [bots]);
  const currentRisk = RISK[risk];
  const demoAccounts = useMemo(() => (accounts ?? []).filter((a: any) => a.broker === "deriv"), [accounts]);
  const selectedAccount = demoAccounts.find((a: any) => a.id === accountId) ?? demoAccounts[0];

  const userOwnsBotProduct = () => {
    if (!entitlements) return false;
    return entitlements.some((e: any) => e.products?.type === "bot" && e.status === "active");
  };

  if (!user) {
    return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto px-4 py-16 text-center space-y-4"><Bot className="mx-auto h-14 w-14 text-primary" /><h1 className="text-2xl font-bold">Sign in to create an AI Bot</h1><Button onClick={() => navigate("/")}>Go to Home</Button></div></div>;
  }

  const finish = async () => {
    if (!selectedBot) {
      toast.error("Botvio AI is not available yet. Please try again shortly.");
      return;
    }
    if (selectedBot.is_premium && !userOwnsBotProduct()) {
      toast.error("Activate the required Botvio plan first.");
      navigate("/billing");
      return;
    }
    if (!selectedAccount) {
      toast.error("Connect a Deriv account first. MT5/CFD accounts are handled from normal MT5 connections.");
      navigate("/connections");
      return;
    }
    try {
      const created: any = await createInstance.mutateAsync({
        bot_id: selectedBot.id,
        trading_account_id: selectedAccount.id,
        name: "Botvio AI · " + (MARKETS.find((m) => m.id === market)?.label ?? "Trading"),
        markets: market === "synthetic" ? ["Volatility 75 Index", "Boom/Crash"] : [MARKETS.find((m) => m.id === market)?.label ?? market],
        risk_per_trade_percent: currentRisk.risk,
        max_daily_loss_percent: currentRisk.loss,
        max_open_trades: currentRisk.trades,
        max_stake: 10,
        config_json: {
          onboarding_version: "2026",
          mode,
          risk_profile: risk,
          market,
          demo_first: true,
          advanced_hidden_by_default: true,
        },
      });
      if (created?.id) await updateInstance.mutateAsync({ id: created.id, status: "paused" });
      toast.success("AI Bot created in paused/demo-first mode.");
      setStep(1);
      setMode("signals");
      setRisk("balanced");
      setShowAdvanced(false);
    } catch (error: any) {
      toast.error(error?.message || "Could not create the bot");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="bots" title="Botvio AI Bots — Simple Automated Trading" description="Create one Botvio AI Bot and choose your market, trading mode and risk. Advanced strategy controls stay hidden until you need them." />
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-6 space-y-5">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-success/5 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3"><Sparkles className="mr-1 h-3 w-3" /> BOTVIO AI</Badge>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">AI BOTS</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">One simple bot experience. Choose what you trade, how Botvio should work, and your risk. The underlying engines stay in place — Botvio selects the right one for you.</p>
            </div>
            <div className="rounded-2xl border bg-background/60 p-4 text-sm">
              <div className="flex items-center gap-2 text-success font-semibold"><ShieldCheck className="h-4 w-4" /> Demo-first</div>
              <p className="mt-1 text-xs text-muted-foreground">New bots are created paused. Start them only when you're ready.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2">{["Market", "Mode", "Risk", "Review"].map((label, i) => <div key={label} className={"h-1.5 rounded-full transition-all " + (step > i ? "bg-primary" : "bg-muted")} />)}</div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">{["Market", "Mode", "Risk", "Review"].map((x) => <span key={x}>{x}</span>)}</div>
        </section>

        {step === 1 && <Card className="glass-card"><CardHeader><CardTitle>1. What do you want to trade?</CardTitle><CardDescription>Botvio chooses the appropriate engine automatically.</CardDescription></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{MARKETS.map((m) => <button key={m.id} type="button" onClick={() => { setMarket(m.id); setStep(2); }} className={"rounded-2xl border p-4 text-left transition-all hover:border-primary/50 hover:-translate-y-0.5 " + (market === m.id ? "border-primary bg-primary/10" : "bg-background/40")}><div className="flex items-center justify-between"><span className="font-bold">{m.label}</span><Badge variant="outline">{m.sub}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{m.id === "synthetic" ? "Volatility, Boom, Crash and other Deriv markets." : "Botvio manages the strategy layer; account connection stays simple."}</p></button>)}</CardContent></Card>}

        {step === 2 && <Card className="glass-card"><CardHeader><CardTitle>2. How should Botvio work?</CardTitle><CardDescription>Keep it simple. You can change this later.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{([["auto","Auto Trade","Botvio executes eligible trades.",Zap],["signals","Signals","Get Botvio's trade ideas without execution.",Bell],["watch","Watch","Analyse markets without placing trades.",Eye]] as const).map(([id,label,desc,Icon]) => <button key={id} type="button" onClick={() => { setMode(id); setStep(3); }} className={"rounded-2xl border p-5 text-left hover:border-primary/50 transition-all " + (mode === id ? "border-primary bg-primary/10" : "")}><Icon className="h-6 w-6 text-primary" /><h3 className="mt-3 font-bold">{label}</h3><p className="mt-1 text-xs text-muted-foreground">{desc}</p></button>)}</CardContent></Card>}

        {step === 3 && <Card className="glass-card"><CardHeader><CardTitle>3. Choose your risk</CardTitle><CardDescription>These are starting limits, not promises of performance.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-3">{(Object.keys(RISK) as Risk[]).map((id) => <button key={id} type="button" onClick={() => setRisk(id)} className={"rounded-2xl border p-5 text-left transition-all hover:border-primary/50 " + (risk === id ? "border-primary bg-primary/10" : "")}><div className="flex items-center justify-between"><span className="font-bold">{RISK[id].label}</span><TrendingUp className="h-4 w-4 text-primary" /></div><p className="mt-1 text-xs text-muted-foreground">{RISK[id].description}</p><p className="mt-3 text-xs">Risk/trade <b>{RISK[id].risk}%</b> · Daily limit <b>{RISK[id].loss}%</b></p></button>)}</div><div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(2)}>Back</Button><Button onClick={() => setStep(4)}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button></div></CardContent></Card>}

        {step === 4 && <Card className="glass-card"><CardHeader><CardTitle>4. Review & connect</CardTitle><CardDescription>We'll keep the new bot paused until you start it.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">Market</p><p className="font-bold">{MARKETS.find((m) => m.id === market)?.label}</p></div><div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">Mode</p><p className="font-bold">{mode === "auto" ? "Auto Trade" : mode === "signals" ? "Signals" : "Watch"}</p></div><div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">Risk</p><p className="font-bold">{currentRisk.label}</p></div><div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">Account</p><p className="font-bold">{selectedAccount ? selectedAccount.label : "Not connected"}</p></div></div><div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-xs text-muted-foreground">For Deriv Synthetic markets, connect your Deriv account below. Forex/Gold/Indices/CFD execution continues through normal MT5 account onboarding.</div><Select value={accountId || selectedAccount?.id || ""} onValueChange={setAccountId}><SelectTrigger><SelectValue placeholder="Select Deriv account" /></SelectTrigger><SelectContent>{demoAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.label}{a.login_id ? " · " + a.login_id : ""}</SelectItem>)}</SelectContent></Select><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigate("/connections")}>Connect account</Button><Button onClick={finish} disabled={createInstance.isPending}>{createInstance.isPending ? "Creating…" : "Create Demo Bot"}</Button></div><button type="button" className="text-xs text-muted-foreground underline" onClick={() => setShowAdvanced((v) => !v)}><Settings2 className="inline h-3 w-3 mr-1" /> {showAdvanced ? "Hide" : "Show"} advanced settings</button>{showAdvanced && <div className="rounded-2xl border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1"><p>Advanced controls remain available through the bot instance settings.</p><p>Strategy engine, sessions, max trades, stop loss/take profit and symbol mapping are intentionally hidden from first-time setup.</p></div>}<div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(3)}>Back</Button></div></CardContent></Card>}

        <Card className="border-primary/10"><CardHeader><CardTitle className="text-sm">My Bots</CardTitle><CardDescription>Existing bot instances and their status.</CardDescription></CardHeader><CardContent>{instancesLoading ? <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : instances && instances.length ? <div className="space-y-3">{instances.map((instance: any) => <div key={instance.id} className="rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className={"h-2.5 w-2.5 rounded-full " + (instance.status === "active" ? "bg-success animate-pulse" : instance.status === "paused" ? "bg-warning" : "bg-muted-foreground")} /><div><p className="font-semibold">{instance.name}</p><p className="text-xs text-muted-foreground">{instance.bot?.name} · {instance.markets?.join(", ")}</p></div></div><div className="flex items-center gap-2"><Badge variant="outline">{instance.status}</Badge><Button variant="outline" size="icon" onClick={() => updateInstance.mutate({id: instance.id, status: instance.status === "active" ? "paused" : "active"})}>{instance.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button><Button variant="outline" size="icon" onClick={() => updateInstance.mutate({id: instance.id, status: "stopped"})}><Square className="h-4 w-4" /></Button></div></div>)}</div> : <div className="py-8 text-center text-sm text-muted-foreground"><Bot className="mx-auto mb-3 h-10 w-10" />No bots yet. Start the 4-step setup above.</div>}</CardContent></Card>

        <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/copy-trading"><span className="mr-2">👥</span> Copy Trading</Link></Button><Button variant="outline" asChild><Link to="/rise-fall"><Zap className="mr-2 h-4 w-4" /> Deriv Options</Link></Button></div>
      </main>
    </div>
  );
};

export default Bots;
