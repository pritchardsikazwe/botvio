import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Calculator,
  Scale,
  Coins,
  Percent,
  TrendingUp,
  ArrowDownRight,
  Newspaper,
  Clock,
  Layers,
  BarChart3,
  Zap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageBanner } from "@/components/layout/PageBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PositionSizeCalculator,
  PipCalculator,
  ProfitCalculator,
  MarginCalculator,
  RiskRewardCalculator,
  CompoundingPlanner,
  DrawdownRecoveryCalculator,
} from "@/components/tools/Calculators";

const CALCULATORS = [
  { id: "position", label: "Position Size", icon: Scale, node: <PositionSizeCalculator />, blurb: "Convert account risk into a lot size using your stop distance." },
  { id: "risk", label: "Risk / Reward", icon: Percent, node: <RiskRewardCalculator />, blurb: "Check the R multiple and the win rate a setup needs to break even." },
  { id: "pip", label: "Pip Value", icon: Calculator, node: <PipCalculator />, blurb: "Value of a pip or index point for your instrument and lot size." },
  { id: "profit", label: "Profit / Loss", icon: TrendingUp, node: <ProfitCalculator />, blurb: "Model the outcome of a long or short before you place it." },
  { id: "margin", label: "Margin", icon: Coins, node: <MarginCalculator />, blurb: "Required margin and notional exposure for a leveraged position." },
  { id: "compound", label: "Compounding", icon: BarChart3, node: <CompoundingPlanner />, blurb: "Growth maths for a fixed percentage gain per period." },
  { id: "drawdown", label: "Drawdown Recovery", icon: ArrowDownRight, node: <DrawdownRecoveryCalculator />, blurb: "How much you must gain to climb out of a drawdown." },
];

/** UTC-clock based session windows — derived from the real clock, not mock data. */
const SESSIONS = [
  { name: "Sydney", open: 21, close: 6 },
  { name: "Tokyo", open: 0, close: 9 },
  { name: "London", open: 7, close: 16 },
  { name: "New York", open: 12, close: 21 },
];

const isOpen = (hour: number, open: number, close: number) =>
  open < close ? hour >= open && hour < close : hour >= open || hour < close;

const SessionClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const hour = now.getUTCHours();
  const weekday = now.getUTCDay();
  const weekend = weekday === 6 || (weekday === 0 && hour < 21);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" aria-hidden />
          Market Sessions
          <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
            {now.toISOString().slice(11, 16)} UTC
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {weekend && (
          <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            Forex and CFD markets are closed for the weekend. Deriv synthetic indices trade 24/7.
          </p>
        )}
        {SESSIONS.map((s) => {
          const open = !weekend && isOpen(hour, s.open, s.close);
          return (
            <div key={s.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {String(s.open).padStart(2, "0")}:00 – {String(s.close).padStart(2, "0")}:00 UTC
                </p>
              </div>
              <Badge variant="outline" className={open ? "border-success/40 text-success" : "text-muted-foreground"}>
                {open ? "Open" : "Closed"}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const RELATED = [
  { label: "Economic Calendar", to: "/news-calendar", icon: Newspaper, blurb: "High-impact releases and event-driven strategy cards." },
  { label: "Trade Modes", to: "/trade-modes", icon: Zap, blurb: "The eight Botvio trade modes and how each one is used." },
  { label: "Performance Transparency", to: "/performance-transparency", icon: BarChart3, blurb: "Published results, methodology and reporting rules." },
  { label: "Strategy Marketplace", to: "/marketplace", icon: Layers, blurb: "Strategies, bots and signal packs from the Botvio catalogue." },
  { label: "AI Chart Analysis", to: "/chart/XAUUSD", icon: TrendingUp, blurb: "Upload a chart and get structure, levels and an entry zone." },
  { label: "Signals Center", to: "/signals", icon: Wrench, blurb: "Every live Botvio signal in one filterable feed." },
];

const Tools = () => {
  const [tab, setTab] = useState(CALCULATORS[0].id);
  const active = CALCULATORS.find((c) => c.id === tab) ?? CALCULATORS[0];

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <SEOHead
        title="Trading Tools & Calculators — Position Size, Pip Value, Risk"
        description="Free trading calculators from Botvio: position size, pip value, margin, profit/loss, risk-reward, compounding and drawdown recovery, plus live market session times."
      />
      <Header />

      <main className="container mx-auto px-4 py-6">
        <PageBanner
          title="Trading"
          accent="Tools"
          description="Practical calculators for sizing, risk and exposure, plus the session clock and the calendar you need before an entry. Every result is computed from the values you enter."
          crumbs={[{ label: "Botvio", to: "/" }, { label: "Tools" }]}
          features={[
            { icon: Scale, label: "Position sizing", sub: "Risk % to lots" },
            { icon: Percent, label: "Risk / reward", sub: "R and break-even" },
            { icon: Coins, label: "Margin & pips", sub: "Exposure per lot" },
            { icon: Clock, label: "Sessions", sub: "Live UTC clock" },
          ]}
          className="mb-6"
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card/60 p-1">
                {CALCULATORS.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger key={id} value={id} className="gap-1.5 text-xs">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CALCULATORS.map((c) => (
                <TabsContent key={c.id} value={c.id} className="mt-4">
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{c.label} Calculator</CardTitle>
                      <p className="text-sm text-muted-foreground">{c.blurb}</p>
                    </CardHeader>
                    <CardContent>{c.node}</CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            <Card className="glass-card mt-6 border-warning/30">
              <CardContent className="flex gap-3 py-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  These calculators are educational aids. Trading leveraged products carries a high risk of loss and the
                  figures here exclude spread, commission, swaps and slippage. Confirm every number in your broker
                  terminal before risking capital. Botvio does not provide investment advice.
                </p>
              </CardContent>
            </Card>

            <section className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Continue in the platform</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {RELATED.map(({ label, to, icon: Icon, blurb }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group glass-card flex items-start gap-3 rounded-xl p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="rounded-lg bg-primary/15 p-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        {label}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{blurb}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <SessionClock />
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Using {active.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>{active.blurb}</p>
                <p>
                  Botvio signals publish entry, stop and target levels — paste those into the sizing and risk tools to
                  keep every trade inside your own risk plan.
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/signals">Open Signals Center</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Tools;
