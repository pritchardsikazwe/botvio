import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Crosshair, Target, Zap, ShieldCheck, ChevronDown, ChevronRight,
  AlertTriangle, TrendingUp, TrendingDown, BarChart3, Activity, Layers, Clock,
} from "lucide-react";

const SYNTX_STRATEGIES = [
  {
    title: "PainX Spike Scalper",
    icon: Zap,
    difficulty: "Advanced",
    winRate: "60-68%",
    timeframe: "1m / 5m",
    description: "Capture sharp price spikes on PainX indices using volatility compression detection.",
    steps: [
      "Monitor PainX 50 or PainX 100 on the 1m chart",
      "Wait for 5+ candles with decreasing range (volatility compression)",
      "When body size shrinks to <30% of average, prepare for spike",
      "Enter in the direction of the prevailing 15m trend",
      "SL: 2x the average candle range | TP: 3-5x average range",
      "Close immediately if spike doesn't happen within 10 candles",
    ],
    rules: [
      "Only trade PainX 10, 50, or 100 — other SyntX behave differently",
      "Maximum 3 attempts per session to avoid overtrading",
      "Use fixed lot size — never martingale on spikes",
      "Best results during high-activity hours (08:00-17:00 GMT)",
    ],
  },
  {
    title: "GainX Trend Rider",
    icon: TrendingUp,
    difficulty: "Beginner",
    winRate: "65-73%",
    timeframe: "15m / 1H",
    description: "Ride GainX trends using EMA pullbacks for low-risk entries.",
    steps: [
      "Identify trend direction on GainX 50 or 100 using EMA 20/50 on 1H chart",
      "Wait for price to pull back to the EMA 20 zone on 15m chart",
      "Look for a bounce candle (bullish pin bar in uptrend, bearish in downtrend)",
      "Enter on candle close with SL below the pullback swing",
      "TP1: Previous swing high/low | TP2: Trail with EMA 20",
    ],
    rules: [
      "Only trade in the direction of the 1H EMA 50",
      "GainX trends strongly — don't counter-trade",
      "Skip if EMA 20 and 50 are flat (ranging market)",
      "Best for swing positions (hold 2-8 hours)",
    ],
  },
  {
    title: "TrendX Breakout Catcher",
    icon: Target,
    difficulty: "Intermediate",
    winRate: "58-65%",
    timeframe: "5m / 15m",
    description: "Catch breakouts on TrendX indices after consolidation phases.",
    steps: [
      "Mark the consolidation range on TrendX 10 or 50 (min 8 candles tight range)",
      "Wait for a strong close above resistance or below support",
      "Confirm with RSI crossing above 55 (buys) or below 45 (sells)",
      "Enter on the breakout candle close — don't wait for retest (TrendX moves fast)",
      "SL: Middle of the broken range | TP: Range height x2",
    ],
    rules: [
      "TrendX has built-in directional bias — breakouts in that direction are stronger",
      "Skip breakouts against the daily bias direction",
      "If price pulls back inside the range within 3 candles, close at small loss",
      "Maximum risk: 1.5% per trade",
    ],
  },
  {
    title: "SyntX Volatility Scalper",
    icon: Activity,
    difficulty: "Advanced",
    winRate: "55-62%",
    timeframe: "1m / 5m",
    description: "Quick scalps on FX Volatility and SFX Volatility indices using momentum bursts.",
    steps: [
      "Use FX Vol 10/50 or SFX Vol 100/200 on 1m chart",
      "Wait for a series of 3+ consecutive same-direction candles",
      "Enter on the 4th candle if momentum is accelerating (each candle bigger than prior)",
      "SL: High/low of the first candle in the sequence",
      "TP: Exit after 2 opposing candles or at 1:1.5 RR",
    ],
    rules: [
      "Strict 1-minute scalping only — close within 5-10 minutes",
      "No holding positions on volatility indices overnight",
      "Maximum 5 trades per session on this strategy",
      "Keep stake size small — these indices move fast",
    ],
  },
];

const SYNTX_TIPS = [
  { icon: Clock, title: "Session Timing", desc: "SyntX indices run 24/5 but liquidity and spike frequency vary. Best trading hours are 08:00-17:00 GMT when Weltrade servers have peak activity." },
  { icon: Layers, title: "Index Selection Matters", desc: "Higher-numbered indices (100, 200, 1200) have wilder moves. Start with lower indices (10, 25) when learning, then scale up." },
  { icon: ShieldCheck, title: "Spread Awareness", desc: "SyntX spreads can widen during low-activity hours. Always check your effective spread before entering — it impacts your breakeven point." },
  { icon: BarChart3, title: "PainX vs GainX Psychology", desc: "PainX is designed to spike against you. GainX trends in your favor. Understand the built-in mechanics before trading." },
];

export function SyntxHauzaStrategy() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            Hauza SyntX Sniper Strategies
          </h2>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold">{SYNTX_STRATEGIES.length} Setups</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Specialized strategies for Weltrade SyntX indices — PainX, GainX, TrendX, and Volatility series.
          Each strategy is optimized for the unique mechanics of synthetic indices.
        </p>

        <div className="space-y-3">
          {SYNTX_STRATEGIES.map((strat, idx) => {
            const Icon = strat.icon;
            const diffColor = strat.difficulty === "Beginner" ? "text-success border-success/30" :
              strat.difficulty === "Advanced" ? "text-destructive border-destructive/30" :
              "text-warning border-warning/30";

            return (
              <Collapsible key={idx} open={openIdx === idx} onOpenChange={() => setOpenIdx(openIdx === idx ? null : idx)}>
                <CollapsibleTrigger className="w-full">
                  <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{strat.title}</span>
                          <Badge variant="outline" className={`text-[10px] ${diffColor}`}>{strat.difficulty}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">📊 {strat.timeframe}</span>
                          <span className="text-[10px] text-success font-semibold">🎯 {strat.winRate}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{strat.description}</p>
                      </div>
                      {openIdx === idx ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase mb-2">📋 Entry Steps</p>
                      <ol className="space-y-2">
                        {strat.steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{si + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-warning uppercase mb-2">⚡ Rules & Filters</p>
                      <ul className="space-y-1.5">
                        {strat.rules.map((rule, ri) => (
                          <li key={ri} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </section>

      {/* Tips */}
      <section>
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          SyntX Pro Tips
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">Exclusive</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SYNTX_TIPS.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <Card key={idx} className="bg-card border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="gold" className="w-full font-bold">
            <BarChart3 className="h-4 w-4 mr-2" /> Open Weltrade Account
          </Button>
        </a>
        <Link to="/trade-modes" className="flex-1">
          <Button variant="outline" className="w-full font-bold border-primary/30 text-primary">
            <Crosshair className="h-4 w-4 mr-2" /> All Hauza Modes
          </Button>
        </Link>
      </div>

      {/* Risk */}
      <Card className="border border-warning/30 bg-warning/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-bold text-warning">Risk Warning</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              SyntX indices are synthetic products with high volatility. Past performance doesn't guarantee future results.
              Never risk more than you can afford to lose. Start with small positions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
