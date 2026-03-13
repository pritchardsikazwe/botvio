import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Crosshair, Target, Zap, ShieldCheck, ChevronDown, ChevronRight,
  AlertTriangle, TrendingUp, BarChart3, Layers, Clock, ExternalLink,
} from "lucide-react";

const GOLD_STRATEGIES = [
  {
    title: "S/R Bounce Entry",
    icon: Target,
    difficulty: "Beginner",
    winRate: "65-72%",
    timeframe: "15m / 1H",
    steps: [
      "Identify Daily support/resistance zones — focus on round numbers ($2300, $2350, $2400)",
      "Wait for price to tap the zone on 15m or 1H chart",
      "Look for a wick rejection candle (wick ≥ 50% of total candle range)",
      "Confirm EMA 20 alignment — price must be on the right side",
      "Enter on the close of the rejection candle",
      "SL: 5-10 pips below/above the zone | TP1: 1:2 RR | TP2: Next major level",
    ],
    rules: [
      "Only trade during London (08:00-16:00 GMT) or NY session",
      "Skip if RSI is between 40-60 (indecision zone)",
      "Avoid 15 min before/after FOMC, NFP, CPI releases",
      "Don't stack more than 2 gold positions simultaneously",
    ],
  },
  {
    title: "Breakout Momentum",
    icon: Zap,
    difficulty: "Intermediate",
    winRate: "58-65%",
    timeframe: "1H / 4H",
    steps: [
      "Mark the 4H consolidation range (minimum 3 candles in tight range)",
      "Wait for a strong candle close above resistance or below support",
      "Confirm with RSI break above 60 (buys) or below 40 (sells)",
      "Enter on the retest of the broken level — don't chase",
      "SL: Inside the broken range | Trail with 20 EMA on 15m",
    ],
    rules: [
      "Only take breakouts aligned with the Daily trend direction",
      "Skip if ATR is below average (low volatility = false breakouts)",
      "Best entries occur at London open or New York open",
      "If retest doesn't happen within 6 candles, skip the trade",
    ],
  },
  {
    title: "Liquidity Sweep Reversal",
    icon: Crosshair,
    difficulty: "Advanced",
    winRate: "70-78%",
    timeframe: "5m / 15m",
    steps: [
      "Mark previous day high/low and Asian session high/low",
      "Wait for price to sweep above/below these levels (hunt stops)",
      "Look for immediate rejection — strong reversal candle within 2-3 candles",
      "Confirm with an order block or fair value gap at the sweep zone",
      "Enter after the sweep candle closes with SL above the sweep wick",
      "Target: Opposite liquidity pool (e.g., if swept high → target previous low)",
    ],
    rules: [
      "Best during London or early NY session for gold",
      "Sweep must be clean — price goes beyond level then snaps back",
      "Minimum 1:2.5 risk-reward required for this setup",
      "Watch DXY correlation for confluence",
    ],
  },
  {
    title: "Multi-Timeframe Trend Ride",
    icon: TrendingUp,
    difficulty: "Intermediate",
    winRate: "62-70%",
    timeframe: "4H / Daily",
    steps: [
      "Check Daily chart — determine trend with EMA 50 (above = bullish, below = bearish)",
      "On 4H chart, wait for a pullback to the 20 EMA or a demand/supply zone",
      "Switch to 1H for entry timing — look for BOS (Break of Structure) in trend direction",
      "Enter after BOS confirmation with SL below the pullback structure",
      "TP1 at recent swing high/low | TP2: Let it ride with trailing stop",
    ],
    rules: [
      "Only trade in the direction of the Daily EMA 50",
      "Patience is key — wait for proper pullback, don't force entries",
      "Best for swing trades (hold 1-3 days)",
      "Reduce position size if holding over weekend due to gap risk",
    ],
  },
];

const GOLD_ENHANCED_TIPS = [
  { icon: Clock, title: "Golden Hour", desc: "The 30 minutes after London open (08:00 GMT) and NY open (13:30 GMT) produce the strongest gold moves. Set alerts for these windows." },
  { icon: Layers, title: "DXY Divergence Alert", desc: "When gold and DXY move in the same direction, a reversal is likely. Use DXY as your leading indicator for gold entries." },
  { icon: BarChart3, title: "Volume Confirmation", desc: "Never enter a gold breakout without volume confirmation. Low-volume breakouts fail 60%+ of the time. Check the volume bar on the breakout candle." },
  { icon: ShieldCheck, title: "Spread Trap Avoidance", desc: "Gold spreads widen to 30-50 pips during news. Close positions or widen stops before high-impact USD events. Check your broker's spread before entry." },
];

export function GoldBotvioStrategy() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-8">
      {/* Strategy Header */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            Hauza Gold Sniper Strategies
          </h2>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold">4 Setups</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Battle-tested gold trading strategies with specific entry rules, risk management, and session timing. 
          Each setup is designed for different market conditions.
        </p>

        <div className="space-y-3">
          {GOLD_STRATEGIES.map((strat, idx) => {
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
                      </div>
                      {openIdx === idx ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 space-y-4">
                    {/* Steps */}
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

                    {/* Rules */}
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

      {/* Enhanced Pro Tips */}
      <section>
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Hauza Gold Pro Tips
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">Exclusive</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOLD_ENHANCED_TIPS.map((tip, idx) => {
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
        <Link to="/chart/XAUUSD" className="flex-1">
          <Button variant="gold" className="w-full font-bold">
            <BarChart3 className="h-4 w-4 mr-2" /> Open Gold Chart
          </Button>
        </Link>
        <Link to="/trade-modes" className="flex-1">
          <Button variant="outline" className="w-full font-bold border-primary/30 text-primary">
            <Crosshair className="h-4 w-4 mr-2" /> All Hauza Modes
          </Button>
        </Link>
      </div>

      {/* Risk Warning */}
      <Card className="border border-warning/30 bg-warning/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-bold text-warning">Risk Warning</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              These strategies are for educational purposes. Past performance doesn't guarantee future results.
              Always use proper risk management and never risk more than you can afford to lose.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
