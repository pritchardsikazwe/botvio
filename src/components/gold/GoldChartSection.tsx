import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, TrendingUp, Layers, Target, Zap, Crosshair, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { GoldBotvioSignalButton } from "./GoldHauzaSignalButton";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import { MarketClosedBanner } from "@/components/trading/MarketClosedBanner";
import { BotvioRobotPromo } from "@/components/robot/BotvioRobotPromo";


const CHART_STRATEGIES = [
  {
    title: "S/R Bounce",
    icon: Target,
    tf: "15m / 1H",
    color: "text-success",
    bgColor: "bg-success/10",
    quickSteps: [
      "Price taps a current Daily S/R zone, recent swing level or psychological round number",
      "Wick rejection ≥ 50% of candle range",
      "EMA 20 confirms direction → Enter on candle close",
      "SL: beyond the invalidation level | TP: target the next structure zone with at least 1:2 RR",
    ],
  },
  {
    title: "Breakout Momentum",
    icon: Zap,
    tf: "1H / 4H",
    color: "text-warning",
    bgColor: "bg-warning/10",
    quickSteps: [
      "4H consolidation range (3+ candles tight range)",
      "Strong candle close beyond support/resistance",
      "RSI confirms: >60 for buys, <40 for sells",
      "Enter on retest of broken level — don't chase",
    ],
  },
  {
    title: "Liquidity Sweep",
    icon: Crosshair,
    tf: "5m / 15m",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    quickSteps: [
      "Mark prev day high/low + Asian session range",
      "Wait for sweep beyond level (stop hunt)",
      "Reversal candle within 2-3 candles after sweep",
      "SL above sweep wick → Target opposite liquidity",
    ],
  },
  {
    title: "MTF Trend Ride",
    icon: TrendingUp,
    tf: "4H / Daily",
    color: "text-primary",
    bgColor: "bg-primary/10",
    quickSteps: [
      "Daily EMA 50 confirms trend direction",
      "4H pullback to 20 EMA or demand/supply zone",
      "1H BOS (Break of Structure) in trend direction",
      "Trail with 20 EMA — hold 1-3 days",
    ],
  },
];

export function GoldChartSection() {
  const [activeStrat, setActiveStrat] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {/* Weekend / market-closed warning */}
      <MarketClosedBanner symbol="XAUUSD" />

      {/* Botvio Signal (driven by real candles) + Live XAU/USD Chart with Hauza overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <GoldBotvioSignalButton />
        </div>
        <div className="lg:col-span-3">
          <DerivLiveChart
            displaySymbol="XAU/USD"
            height={420}
            defaultGranularity={300}
            showHauza
          />
        </div>
      </div>

      {/* Current Botvio Robot workflow — replaces the legacy client-side scalp widgets. */}
      <BotvioRobotPromo
        compact
        productName="Gold Robot"
        marketFocus="XAU/USD"
        description="Use the current Botvio Gold Robot workflow for AI trade setups, structured entry/SL/TP levels, supported MT5 execution and risk controls."
      />

       {/* ── Botvio Strategy Quick-Reference ─────── */}
       <div>
         <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2 mb-3">
           <Crosshair className="h-4 w-4 text-primary" />
           Botvio AI Gold Strategies — Quick Reference
           <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Use with chart above</Badge>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {CHART_STRATEGIES.map((s, i) => {
            const Icon = s.icon;
            const isActive = activeStrat === i;
            return (
              <button
                key={i}
                onClick={() => setActiveStrat(isActive ? null : i)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isActive
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/50 bg-card hover:border-primary/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${s.bgColor} flex items-center justify-center mb-2`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xs font-bold text-foreground">{s.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">📊 {s.tf}</p>
              </button>
            );
          })}
        </div>

        {/* Expanded Strategy Steps */}
        {activeStrat !== null && (
          <Card className="bg-card border-primary/20 animate-in slide-in-from-top-2 duration-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = CHART_STRATEGIES[activeStrat].icon;
                    return <Icon className={`h-4 w-4 ${CHART_STRATEGIES[activeStrat].color}`} />;
                  })()}
                  <span className="text-sm font-bold text-foreground">{CHART_STRATEGIES[activeStrat].title}</span>
                  <Badge variant="outline" className="text-[10px]">{CHART_STRATEGIES[activeStrat].tf}</Badge>
                </div>
                <button onClick={() => setActiveStrat(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <ol className="space-y-2">
                {CHART_STRATEGIES[activeStrat].quickSteps.map((step, si) => (
                  <li key={si} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">{si + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                <span className="text-[10px] text-warning font-semibold">
                  {activeStrat === 0 && "Trade London/NY sessions only. Skip near high-impact news."}
                  {activeStrat === 1 && "Only take breakouts aligned with Daily trend. Skip low-ATR."}
                  {activeStrat === 2 && "Sweep must be clean. Min 1:2.5 RR. Watch DXY correlation."}
                  {activeStrat === 3 && "Only trade in Daily EMA 50 direction. Reduce size over weekend."}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Indicator Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">RSI (14)</p>
              <p className="text-xs text-muted-foreground">Measures overbought (&gt;70) or oversold (&lt;30) conditions. Use to time entries.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">MACD</p>
              <p className="text-xs text-muted-foreground">Signal line crossovers indicate trend changes. Histogram shows momentum strength.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Layers className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Bollinger Bands</p>
              <p className="text-xs text-muted-foreground">Price touching upper/lower bands signals potential reversals. Squeeze = breakout incoming.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broker CTA */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Ready to trade Gold?</h3>
            <p className="text-xs text-muted-foreground">Open your broker account and execute when your setup is confirmed.</p>
          </div>
          <div className="flex gap-2">
            <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Trade on Exness
              </Button>
            </a>
            <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="font-bold text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Weltrade
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
