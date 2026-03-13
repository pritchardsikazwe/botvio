import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import {
  Crosshair, TrendingUp, TrendingDown, ShieldCheck, ChevronDown, ChevronRight,
  Target, Zap, BarChart3, Activity, Layers, AlertTriangle,
} from "lucide-react";

interface BotvioStrategyCardProps {
  symbol: string;
  signal?: string | null;
  trend?: string | null;
  rsi?: number | null;
  confidence?: number | null;
}

function getAssetType(symbol: string) {
  if (symbol.includes("XAU") || symbol.includes("XAG")) return "metals";
  if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("SOL") || symbol.includes("BNB") || symbol.includes("XRP") || symbol.includes("DOGE")) return "crypto";
  if (symbol.includes("BOOM") || symbol.includes("CRASH") || symbol.includes("R_") || symbol.includes("1HZ")) return "synthetic";
  return "forex";
}

const STRATEGIES: Record<string, { title: string; icon: typeof Crosshair; steps: string[]; rules: string[]; riskNote: string }[]> = {
  metals: [
    {
      title: "Botvio Gold — S/R Bounce",
      icon: Target,
      steps: [
        "Identify Daily support/resistance zones (round numbers: $2300, $2350, $2400)",
        "Wait for price to tap the zone on 15m/1H with a wick rejection (wick ≥ 50% of candle range)",
        "Confirm with EMA 20 alignment — price should be on the right side of the EMA",
        "Enter on the close of the rejection candle with SL below/above the zone",
        "TP1 at 1:2 RR, TP2 at next major level",
      ],
      rules: [
        "Only trade during London or NY session (highest gold liquidity)",
        "Skip if RSI is between 40-60 (indecision zone)",
        "Avoid 15 min before/after FOMC, NFP, or CPI releases",
        "Minimum confidence: 65% from AI signal",
      ],
      riskNote: "Risk 1-2% per trade. Gold moves fast — always use a stop loss.",
    },
    {
      title: "Botvio Gold — Breakout Momentum",
      icon: Zap,
      steps: [
        "Mark the 4H consolidation range (at least 3 candles in a tight range)",
        "Wait for a strong candle close above resistance or below support",
        "Confirm volume spike or RSI break above 60 / below 40",
        "Enter on retest of broken level with tight SL inside the range",
        "Trail stop using the 20 EMA on 15m chart",
      ],
      rules: [
        "Only take breakouts in the direction of the Daily trend",
        "Skip if ATR is below average (low volatility = false breakouts)",
        "Best during London open or NY open",
      ],
      riskNote: "Breakouts can fail. Wait for confirmation candle before entry.",
    },
  ],
  forex: [
    {
      title: "Botvio Forex — EMA Pullback",
      icon: TrendingUp,
      steps: [
        "Determine Daily trend using EMA 50 — above = bullish, below = bearish",
        "On 1H chart, wait for price to pull back to the 20 EMA zone",
        "Look for a bullish/bearish engulfing or pin bar at the EMA",
        "Enter on candle close with SL below the pullback low/high",
        "TP1 at recent swing high/low, TP2 at 1:3 RR",
      ],
      rules: [
        "Only trade in the direction of the Daily EMA 50",
        "Skip pairs with spread > 3 pips during entry",
        "Best during London-NY overlap for major pairs",
        "Avoid during major news events",
      ],
      riskNote: "Risk 1% per trade on forex. Majors have tighter spreads.",
    },
    {
      title: "Botvio Forex — Liquidity Sweep",
      icon: Crosshair,
      steps: [
        "Mark previous day high/low and session highs/lows",
        "Wait for price to sweep above/below these levels (hunt stops)",
        "Look for immediate rejection with a strong reversal candle",
        "Enter after the sweep candle closes with SL above the sweep wick",
        "Target the opposite liquidity pool (previous low if swept high)",
      ],
      rules: [
        "Best on EUR/USD, GBP/USD, and USD/JPY",
        "Confirm with order block or fair value gap at the sweep zone",
        "Minimum 1:2 risk-reward required",
      ],
      riskNote: "Liquidity sweeps are high-probability but require patience.",
    },
  ],
  crypto: [
    {
      title: "Botvio Crypto — Momentum Surge",
      icon: Activity,
      steps: [
        "Check 4H trend direction using EMA 20/50 crossover",
        "Wait for RSI to dip to 40-45 in uptrend (or rise to 55-60 in downtrend)",
        "Enter when RSI bounces back with a bullish/bearish 1H candle",
        "SL below the recent swing low/high, TP at 1:2 then trail",
        "Move SL to breakeven after TP1 is hit",
      ],
      rules: [
        "Only trade BTC, ETH, SOL during high-volume hours",
        "Skip if market is ranging (ADX < 20)",
        "Watch for BTC dominance shifts before trading altcoins",
      ],
      riskNote: "Crypto is volatile. Use smaller position sizes (0.5-1% risk).",
    },
  ],
  synthetic: [
    {
      title: "Botvio Boom/Crash — AI Spike Catcher",
      icon: Zap,
      steps: [
        "Count candles since last spike (drought detection)",
        "AI scores spike probability based on drought + compression + momentum",
        "When AI probability ≥ 78% AND drought threshold met, enter",
        "Enter with small stake when overdue threshold is reached",
        "Max 3-5 attempts per session",
      ],
      rules: [
        "Only on Boom 1000/500 and Crash 1000/500",
        "Never chase spikes — wait for AI confirmation",
        "Maximum daily loss: 10% of account",
        "AI + rules must both agree before entry",
      ],
      riskNote: "Synthetics are 24/7 but can be addictive. Set session limits. 1-2% risk per trade.",
    },
    {
      title: "Botvio Digits — Fast DIFFERS Strategy",
      icon: BarChart3,
      steps: [
        "Watch last 5 ticks digits for repeating patterns",
        "If 3-4 of the same digit appear, enter DIFFERS",
        "Duration: 1 tick only",
        "Stake: 1-2% balance. Martingale off or 1 level max",
        "Expected win rate: 85-92%",
      ],
      rules: [
        "Only on Volatility 10/25/50/75/100 indices",
        "Minimum 5-tick sample before decisions",
        "DIFFER signals take priority over MATCH when both trigger",
      ],
      riskNote: "Digit trading is statistical. Losses are part of the edge — don't overtrade.",
    },
  ],
};

export function HauzaStrategyCard({ symbol, signal, trend, rsi, confidence }: HauzaStrategyCardProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const assetType = getAssetType(symbol);
  const strategies = STRATEGIES[assetType] || STRATEGIES.forex;

  const contextBadge = signal === "buy" ? "bg-success/20 text-success" :
    signal === "sell" ? "bg-destructive/20 text-destructive" :
    "bg-warning/20 text-warning";

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-primary" />
            Hauza Sniper Strategy
          </h3>
          <Badge className={`text-[10px] font-bold ${contextBadge}`}>
            {signal?.toUpperCase() || "WATCH"}
          </Badge>
        </div>

        {/* Live context */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/30 rounded-lg py-1.5">
            <div className="text-[9px] text-muted-foreground font-semibold uppercase">Trend</div>
            <div className={`text-xs font-bold capitalize ${trend === "bullish" ? "text-success" : trend === "bearish" ? "text-destructive" : "text-muted-foreground"}`}>
              {trend || "Neutral"}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg py-1.5">
            <div className="text-[9px] text-muted-foreground font-semibold uppercase">RSI</div>
            <div className={`text-xs font-bold font-mono ${rsi && rsi > 70 ? "text-destructive" : rsi && rsi < 30 ? "text-success" : "text-foreground"}`}>
              {rsi ? rsi.toFixed(1) : "—"}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg py-1.5">
            <div className="text-[9px] text-muted-foreground font-semibold uppercase">Conf</div>
            <div className="text-xs font-bold text-primary font-mono">{confidence ? `${Math.round(confidence)}%` : "—"}</div>
          </div>
        </div>

        {/* Strategy cards */}
        <div className="space-y-2">
          {strategies.map((strat, idx) => {
            const Icon = strat.icon;
            return (
              <Collapsible key={idx} open={openIdx === idx} onOpenChange={() => setOpenIdx(openIdx === idx ? null : idx)}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-foreground flex-1 text-left">{strat.title}</span>
                    {openIdx === idx ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 space-y-3">
                    {/* Steps */}
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase mb-1.5">📋 Entry Steps</p>
                      <ol className="space-y-1.5">
                        {strat.steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">{si + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Rules */}
                    <div>
                      <p className="text-[10px] font-bold text-warning uppercase mb-1.5">⚡ Rules</p>
                      <ul className="space-y-1">
                        {strat.rules.map((rule, ri) => (
                          <li key={ri} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk */}
                    <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/15 rounded-lg p-2.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground">{strat.riskNote}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
