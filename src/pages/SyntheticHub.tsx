import { useMemo, useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Sparkles, Rocket, Bomb, Zap, Activity, Radio, ArrowRight, Lock, Crown } from "lucide-react";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import { SyntheticSignalCard } from "@/components/synthetic/SyntheticSignalCard";
import { SYNTHETICS, findSynthetic, type SyntheticCategory } from "@/config/synthetics";
import { Mt5AutoExecuteCard } from "@/components/broker/Mt5AutoExecuteCard";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { MultiAssetScalpRobot } from "@/components/chart/MultiAssetScalpRobot";

const CATEGORY_META: Record<SyntheticCategory, { label: string; icon: typeof Rocket; tone: string }> = {
  boom: { label: "Boom", icon: Rocket, tone: "text-emerald-400 border-emerald-500/40" },
  crash: { label: "Crash", icon: Bomb, tone: "text-red-400 border-red-500/40" },
  volatility: { label: "Volatility", icon: Activity, tone: "text-blue-400 border-blue-500/40" },
  step: { label: "Step", icon: Zap, tone: "text-amber-400 border-amber-500/40" },
};

export default function SyntheticHub() {
  const FREE_KEY = "boom-500";
  const [activeKey, setActiveKey] = useState<string>(FREE_KEY);
  const [chartMarker, setChartMarker] = useState<{ direction: "BUY" | "SELL"; confidence: number } | null>(null);
  const [filter, setFilter] = useState<SyntheticCategory | "all">("all");
  const { isPaid, isLoading: gateLoading } = useSubscriptionGate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const locked = !gateLoading && !isPaid && !isAdmin && !isSuperAdmin;

  const active = useMemo(() => findSynthetic(activeKey) ?? SYNTHETICS[0], [activeKey]);
  const chartSymbol = active.derivSymbol ?? active.chartProxy ?? null;
  const isProxy = !active.derivSymbol && !!active.chartProxy;

  const filtered = useMemo(
    () => (filter === "all" ? SYNTHETICS : SYNTHETICS.filter((s) => s.category === filter)),
    [filter],
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Deriv Synthetic Hub – Auto Signals on Boom, Crash, Volatility & Step"
        description="Live BUY/SELL signals plotted directly on synthetic index charts. Boom 500, Crash 150-900, Volatility 10/25/75, Step Index. Auto-execute via Deriv API or MT5 Bridge."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">SYNTHETIC INDICES</Badge>
              <Badge variant="outline" className="border-success/40 text-success text-xs">24/7 Market</Badge>
              <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Auto Signals on Charts
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Deriv Synthetic <span className="text-primary">Trading Hub</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Real-time BUY / SELL signals plotted directly on Boom, Crash, Volatility & Step index charts.
              Multi-timeframe entries (H4 → M15/M5), S/R zones and spike pattern detection. Auto-execute via
              your Deriv account or your MT5 Bridge EA — your choice per signal.
            </p>
          </div>
        </div>

        {/* Active chart + signal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <SyntheticSignalCard
              key={active.key}
              instrument={active}
              onSignalChange={setChartMarker}
            />
          </div>
          <div className="lg:col-span-3">
            {chartSymbol ? (
              <div className="space-y-2">
                {isProxy && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
                    <Badge variant="outline" className="text-[10px] border-warning/40 text-warning font-mono">
                      REFERENCE CHART
                    </Badge>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      <strong className="text-foreground">{active.label}</strong> doesn't stream on Deriv's
                      public feed. Signals are computed from the closest streamable proxy
                      (<span className="font-mono text-warning">{active.chartProxy}</span>) — execute on
                      your MT5 terminal via <strong className="text-foreground">Send to MT5</strong>.
                    </p>
                  </div>
                )}
                <DerivLiveChart
                  displaySymbol={chartSymbol}
                  height={isProxy ? 420 : 460}
                  defaultGranularity={300}
                  showHauza
                  signalMarker={chartMarker}
                />
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center text-center rounded-xl border border-warning/30 bg-gradient-to-br from-warning/5 via-card to-card p-8"
                style={{ minHeight: 460 }}
              >
                <div className="p-3 rounded-full bg-warning/10 border border-warning/30 mb-3">
                  <Radio className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-base font-extrabold text-foreground">
                  {active.label} — MT5-Only Instrument
                </h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-md">
                  This index does not stream on Deriv's public WebSocket feed, so we don't show a
                  misleading chart from a different symbol. Open the live chart inside your MT5
                  terminal and use <strong className="text-foreground">Send to MT5</strong> to
                  auto-execute Botvio signals via your Bridge EA.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="text-[10px] border-warning/40 text-warning font-mono">
                    MT5 Symbol: {active.mt5Symbol}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                    Bias: {active.bias === "buy" ? "Buy" : active.bias === "sell" ? "Sell" : "Both"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground/80 mt-4 flex items-center gap-1">
                  Use the signal card on the left <ArrowRight className="h-3 w-3" /> tap “Send to MT5”
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Category filter */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-card border border-border/50 h-10">
            <TabsTrigger value="all" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> All</TabsTrigger>
            <TabsTrigger value="boom" className="text-xs gap-1.5"><Rocket className="h-3.5 w-3.5" /> Boom</TabsTrigger>
            <TabsTrigger value="crash" className="text-xs gap-1.5"><Bomb className="h-3.5 w-3.5" /> Crash</TabsTrigger>
            <TabsTrigger value="volatility" className="text-xs gap-1.5"><Activity className="h-3.5 w-3.5" /> Volatility</TabsTrigger>
            <TabsTrigger value="step" className="text-xs gap-1.5"><Zap className="h-3.5 w-3.5" /> Step</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Instrument grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((inst) => {
            const meta = CATEGORY_META[inst.category];
            const CatIcon = meta.icon;
            const isActive = inst.key === active.key;
            const isLockedInst = locked && inst.key !== FREE_KEY;
            return (
              <button
                key={inst.key}
                onClick={() => {
                  if (isLockedInst) return;
                  setActiveKey(inst.key);
                  setChartMarker(null);
                }}
                aria-disabled={isLockedInst}
                tabIndex={isLockedInst ? -1 : 0}
                className={`relative text-left rounded-xl border-2 p-3 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : isLockedInst
                      ? "border-border/40 bg-card/60 opacity-60 cursor-not-allowed"
                      : "border-border/50 bg-card hover:border-primary/40"
                }`}
              >
                {isLockedInst && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-warning/15 border border-warning/40 px-1.5 py-0.5 text-[9px] font-bold text-warning">
                    <Lock className="h-2.5 w-2.5" /> VIP
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <CatIcon className={`h-4 w-4 ${meta.tone.split(" ")[0]} shrink-0`} />
                    <span className="text-xs font-bold text-foreground truncate">{inst.label}</span>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${meta.tone} font-mono shrink-0`}>
                    {meta.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{inst.blurb}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {inst.derivSymbol ? (
                    <Badge variant="outline" className="text-[9px] border-success/40 text-success">Live Chart</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] border-warning/40 text-warning">MT5 Only</Badge>
                  )}
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase">
                    {inst.bias === "buy" ? "Buy bias" : inst.bias === "sell" ? "Sell bias" : "Both"}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>

        {locked && (
          <Card className="border-2 border-warning/40 bg-gradient-to-r from-warning/10 to-amber-500/5">
            <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-warning/15 border border-warning/30">
                <Lock className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-base font-extrabold text-foreground">Only Boom 500 is unlocked on the free preview</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Upgrade to a paid plan to unlock every Boom, Crash, Volatility and Step index with
                  live auto-signals and MT5 auto-execute.
                </p>
              </div>
              <Button asChild variant="default" className="bg-warning text-warning-foreground hover:bg-warning/90 font-bold">
                <Link to="/billing">
                  <Crown className="h-4 w-4 mr-2" /> Upgrade
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* MT5 auto-execute setup */}
        <Mt5AutoExecuteCard />

        {/* Botvio Scalp Robot — auto signals with Entry / SL / TP */}
        <MultiAssetScalpRobot
          title="Botvio Scalp Robot · Synthetics"
          assets={[
            { displaySymbol: "BOOM500", label: "Boom 500", emoji: "🚀", cryptoAlwaysOpen: true },
            { displaySymbol: "BOOM1000", label: "Boom 1000", emoji: "🚀", cryptoAlwaysOpen: true },
            { displaySymbol: "CRASH500", label: "Crash 500", emoji: "💥", cryptoAlwaysOpen: true },
            { displaySymbol: "CRASH1000", label: "Crash 1000", emoji: "💥", cryptoAlwaysOpen: true },
            { displaySymbol: "R_75", label: "Vol 75", emoji: "📈", cryptoAlwaysOpen: true },
            { displaySymbol: "R_100", label: "Vol 100", emoji: "📊", cryptoAlwaysOpen: true },
            { displaySymbol: "stpRNG", label: "Step Index", emoji: "🪜", cryptoAlwaysOpen: true },
          ]}
        />

        {/* How it works */}
        <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-primary" /> Auto Signals on Charts
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time BUY / SELL signals plotted directly on the active chart with confidence-pulse rings.
                No guessing — entries are visible the moment they fire.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-warning" /> Smart Entry Guidance
              </h3>
              <p className="text-xs text-muted-foreground">
                Multi-timeframe confirmation (H4 direction → M15/M5 sniper), S/R zones, spike-pattern logic
                tuned for Boom/Crash and clean structure on Volatility/Step.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-success" /> Dual Execution
              </h3>
              <p className="text-xs text-muted-foreground">
                Tap <strong>Trade on Deriv</strong> for instant CFD-multiplier execution, or
                <strong> Send to MT5</strong> to queue the trade onto your Bridge EA terminal.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}