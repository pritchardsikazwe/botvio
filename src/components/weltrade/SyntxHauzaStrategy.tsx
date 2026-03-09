import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Crosshair, Target, Zap, ShieldCheck, ChevronDown, ChevronRight,
  AlertTriangle, TrendingUp, TrendingDown, BarChart3, Activity, Layers, Clock,
  DollarSign, Eye, ArrowUpDown, Repeat, Flame, Gauge,
} from "lucide-react";

/* ─── Per-Instrument Strategies ─── */
const INSTRUMENT_STRATEGIES = [
  {
    title: "PainX — BUY Scalping",
    icon: TrendingUp,
    difficulty: "Easy",
    bias: "BUY",
    biasColor: "text-success",
    behavior: "Price slowly goes up, then drops suddenly. Algorithm is designed with upward drift + sudden crashes.",
    indicators: ["EMA 20", "EMA 50", "RSI 14"],
    entry: [
      "Price above EMA 50 (trend filter)",
      "Pullback to EMA 20 zone",
      "RSI > 50 (momentum confirmation)",
      "Bullish candle closes → enter BUY",
    ],
    exit: ["TP: 5–20 points (small, fast)", "SL: 10–20 points", "Close quickly before the big drop hits"],
    tip: "Never hold trades long — the algorithm will eventually drop. Many small wins beat one big hold.",
    timeframe: "M1 / M5",
    bestFor: "Quick BUY scalps, small accounts",
  },
  {
    title: "GainX — SELL Scalping",
    icon: TrendingDown,
    difficulty: "Easy",
    bias: "SELL",
    biasColor: "text-destructive",
    behavior: "Price mostly goes down, sometimes spikes upward sharply. Mirror of PainX in reverse.",
    indicators: ["EMA 20", "Bollinger Bands (20)"],
    entry: [
      "Wait for price to touch upper Bollinger Band",
      "Confirm with bearish engulfing or pin bar",
      "Enter SELL on candle close",
    ],
    exit: ["TP: small (5–15 points)", "SL: above Bollinger upper band", "Avoid holding during upward spikes"],
    tip: "GainX rewards patience — sell rallies, don't chase drops.",
    timeframe: "M1 / M5",
    bestFor: "Sell-side scalping",
  },
  {
    title: "FlipX — Range Trading",
    icon: ArrowUpDown,
    difficulty: "Hard",
    bias: "NEUTRAL",
    biasColor: "text-warning",
    behavior: "50/50 random movement every tick. Trend strategies fail here — mean-reversion works best.",
    indicators: ["Bollinger Bands (20)", "RSI 14"],
    entry: [
      "BUY at lower Bollinger Band when RSI < 30",
      "SELL at upper Bollinger Band when RSI > 70",
      "Wait for candle confirmation at band extremes",
    ],
    exit: ["TP: small scalps back to midline", "SL: beyond the band extreme", "Don't hold — exit at middle band"],
    tip: "FlipX is pure probability trading. Keep lots tiny and expect 50/50 outcomes.",
    timeframe: "M1 / M5",
    bestFor: "Range & probability trading",
  },
  {
    title: "SwitchX — Jump Reversal",
    icon: Repeat,
    difficulty: "Medium",
    bias: "ADAPTIVE",
    biasColor: "text-primary",
    behavior: "Switches between PainX mode (uptrend) and GainX mode (downtrend) after large jumps. Direction flips unpredictably.",
    indicators: ["EMA 50", "MACD (12,26,9)"],
    entry: [
      "Wait for a big spike or drop (the 'switch' event)",
      "Do NOT trade during the spike itself",
      "Wait for first pullback after the jump",
      "Identify new direction with EMA 50 slope",
      "Enter in the new direction after MACD confirmation",
    ],
    exit: ["TP: ride the new trend 20–50+ points", "SL: behind the pullback swing", "Exit if another jump occurs"],
    tip: "Big spike up → SELL trend likely next. Big drop → BUY trend likely. Trade AFTER the jump, not during.",
    timeframe: "M5 / M15",
    bestFor: "Jump reversal trading",
  },
  {
    title: "TrendX — Trend Following",
    icon: Flame,
    difficulty: "Medium",
    bias: "TREND",
    biasColor: "text-primary",
    behavior: "Detects trend based on recent price jumps and switches mode to follow it. Best SyntX index for trend traders.",
    indicators: ["EMA 50", "EMA 200", "ADX (14)"],
    entry: [
      "BUY: EMA 50 > EMA 200 and ADX > 20",
      "SELL: EMA 50 < EMA 200 and ADX > 20",
      "Enter on pullback to EMA 50 in direction of trend",
    ],
    exit: ["Hold trades longer than scalping (30min–2hrs)", "Trail SL with EMA 50", "Exit when ADX drops below 18"],
    tip: "TrendX rewards patience. Unlike PainX/GainX, you can hold positions — the trend persists.",
    timeframe: "M5 / M15",
    bestFor: "Trend following, longer holds",
  },
];

/* ─── $10→$100 Flip Strategy ─── */
const FLIP_STRATEGY = {
  title: "$10 → $100 Flip Strategy",
  subtitle: "SyntX Scalping Compounding Method",
  instruments: "PainX (buy), GainX (sell), SwitchX (reversal), TrendX (trend)",
  setup: {
    timeframe: "M1 or M5",
    indicators: ["EMA 20", "EMA 50", "RSI (14)", "Bollinger Bands (20)"],
  },
  entryExample: [
    "Price above EMA 50 (trend confirmed)",
    "Pullback to EMA 20 zone",
    "RSI above 50",
    "Bullish candle closes → enter immediately",
  ],
  exitRules: ["TP: 5–15 points", "SL: 10–20 points", "Goal: many small wins, compound 20% per trade"],
  progression: [
    { trade: "Start", balance: "$10" },
    { trade: "+20%", balance: "$12" },
    { trade: "+20%", balance: "$14.40" },
    { trade: "+20%", balance: "$17.28" },
    { trade: "+20%", balance: "$20.74" },
    { trade: "Continue", balance: "→ $100+" },
  ],
  riskTable: [
    { balance: "$10", lot: "0.01" },
    { balance: "$20", lot: "0.02" },
    { balance: "$50", lot: "0.05" },
    { balance: "$100", lot: "0.10" },
  ],
};

/* ─── MT5 Indicator Setup ─── */
const INDICATOR_SETUP = {
  title: "Powerful MT5 Indicator Setup",
  subtitle: "Used by experienced synthetic traders",
  indicators: [
    { name: "EMA 20 & EMA 50", purpose: "Short-term trend direction" },
    { name: "Bollinger Bands (20)", purpose: "Overextension detection" },
    { name: "RSI (14)", purpose: "Momentum confirmation" },
    { name: "ATR (14)", purpose: "Volatility measurement" },
  ],
  logic: [
    { label: "Trend Filter", desc: "Price above EMA 50 → only BUY. Below → only SELL." },
    { label: "Entry Timing", desc: "Pullback to EMA 20 or Bollinger midline." },
    { label: "Momentum Check", desc: "RSI 55–70 for buys, RSI 30–45 for sells." },
    { label: "Volatility Filter", desc: "ATR increasing = stronger moves, better entries." },
  ],
};

/* ─── Jump Detection ─── */
const JUMP_SIGNALS = [
  { sign: "Volatility Compression", desc: "Bollinger Bands become very tight. A big move often follows within 5–15 candles." },
  { sign: "Long Consolidation", desc: "Price moves sideways for 10–30 candles. Energy builds for a breakout." },
  { sign: "ATR Expansion", desc: "ATR suddenly increases after being flat. Movement is accelerating." },
  { sign: "Fake Breakout", desc: "Price breaks a level then quickly reverses. The next move is often very strong." },
];

/* ─── Best SyntX for Small Accounts ─── */
const BEST_FOR_SMALL = [
  { index: "PainX", difficulty: "Easy", style: "Buy scalping", color: "text-success" },
  { index: "GainX", difficulty: "Easy", style: "Sell scalping", color: "text-destructive" },
  { index: "SwitchX", difficulty: "Medium", style: "Jump reversal", color: "text-warning" },
  { index: "TrendX", difficulty: "Medium", style: "Trend trading", color: "text-primary" },
  { index: "FlipX", difficulty: "Hard", style: "Random range", color: "text-muted-foreground" },
];

export function SyntxHauzaStrategy() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [showFlip, setShowFlip] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showJump, setShowJump] = useState(false);

  return (
    <div className="space-y-8">
      {/* ── Section 1: Per-Instrument Strategies ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            SyntX Instrument Strategies
          </h2>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold">{INSTRUMENT_STRATEGIES.length} Setups</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Each SyntX index has unique price mechanics. Here are proven strategies matched to each instrument's behavior.
        </p>

        <div className="space-y-3">
          {INSTRUMENT_STRATEGIES.map((strat, idx) => {
            const Icon = strat.icon;
            const diffColor = strat.difficulty === "Easy" ? "text-success border-success/30" :
              strat.difficulty === "Hard" ? "text-destructive border-destructive/30" :
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
                          <Badge variant="outline" className={`text-[10px] ${strat.biasColor} border-current/30`}>{strat.bias}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">📊 {strat.timeframe}</span>
                          <span className="text-[10px] text-muted-foreground">🎯 {strat.bestFor}</span>
                        </div>
                      </div>
                      {openIdx === idx ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 space-y-4">
                    {/* Behavior */}
                    <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
                      <p className="text-[10px] font-bold text-primary uppercase mb-1">Behavior</p>
                      <p className="text-sm text-muted-foreground">{strat.behavior}</p>
                    </div>

                    {/* Indicators */}
                    <div>
                      <p className="text-xs font-bold text-primary uppercase mb-2">📐 Indicators</p>
                      <div className="flex flex-wrap gap-2">
                        {strat.indicators.map((ind, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">{ind}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Entry */}
                    <div>
                      <p className="text-xs font-bold text-success uppercase mb-2">📋 Entry Rules</p>
                      <ol className="space-y-2">
                        {strat.entry.map((step, si) => (
                          <li key={si} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <span className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center shrink-0 text-xs font-bold text-success">{si + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Exit */}
                    <div>
                      <p className="text-xs font-bold text-warning uppercase mb-2">🚪 Exit Rules</p>
                      <ul className="space-y-1.5">
                        {strat.exit.map((rule, ri) => (
                          <li key={ri} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pro Tip */}
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                      <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground"><span className="font-bold">Pro Tip:</span> {strat.tip}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </section>

      {/* ── Section 2: $10→$100 Flip Strategy ── */}
      <section>
        <Collapsible open={showFlip} onOpenChange={setShowFlip}>
          <CollapsibleTrigger className="w-full">
            <Card className="border-2 border-success/30 bg-gradient-to-r from-success/5 to-transparent hover:border-success/50 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-extrabold text-foreground">{FLIP_STRATEGY.title}</p>
                  <p className="text-xs text-muted-foreground">{FLIP_STRATEGY.subtitle}</p>
                </div>
                {showFlip ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-3 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Setup */}
                <Card className="bg-muted/20 border-border/30">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-bold text-primary uppercase">Chart Setup</p>
                    <p className="text-sm text-muted-foreground">Timeframe: <span className="font-bold text-foreground">{FLIP_STRATEGY.setup.timeframe}</span></p>
                    <div className="flex flex-wrap gap-1.5">
                      {FLIP_STRATEGY.setup.indicators.map((ind, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] font-mono">{ind}</Badge>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Best: {FLIP_STRATEGY.instruments}</p>
                  </CardContent>
                </Card>

                {/* Progression */}
                <Card className="bg-muted/20 border-border/30">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-bold text-success uppercase">Compounding Path</p>
                    <div className="space-y-1">
                      {FLIP_STRATEGY.progression.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{p.trade}</span>
                          <span className="font-bold font-mono text-foreground">{p.balance}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Entry Example */}
              <div>
                <p className="text-xs font-bold text-success uppercase mb-2">Entry Rules (PainX Example)</p>
                <ol className="space-y-1.5">
                  {FLIP_STRATEGY.entryExample.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-success">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Risk Table */}
              <div>
                <p className="text-xs font-bold text-warning uppercase mb-2">Lot Size Guide</p>
                <div className="grid grid-cols-4 gap-2">
                  {FLIP_STRATEGY.riskTable.map((r, i) => (
                    <div key={i} className="text-center bg-muted/30 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Balance</p>
                      <p className="text-xs font-bold text-foreground">{r.balance}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Lot</p>
                      <p className="text-xs font-bold font-mono text-primary">{r.lot}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">⚠️ Never risk more than 5–10% per trade</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* ── Section 3: MT5 Indicator Setup ── */}
      <section>
        <Collapsible open={showIndicators} onOpenChange={setShowIndicators}>
          <CollapsibleTrigger className="w-full">
            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent hover:border-primary/50 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Gauge className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-extrabold text-foreground">{INDICATOR_SETUP.title}</p>
                  <p className="text-xs text-muted-foreground">{INDICATOR_SETUP.subtitle}</p>
                </div>
                {showIndicators ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INDICATOR_SETUP.indicators.map((ind, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-lg p-3 border border-border/30">
                    <BarChart3 className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{ind.name}</p>
                      <p className="text-[10px] text-muted-foreground">{ind.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-primary uppercase">Template Logic</p>
                {INDICATOR_SETUP.logic.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground">{item.label}: </span>
                      <span className="text-muted-foreground">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* ── Section 4: Jump Detection ── */}
      <section>
        <Collapsible open={showJump} onOpenChange={setShowJump}>
          <CollapsibleTrigger className="w-full">
            <Card className="border-2 border-warning/30 bg-gradient-to-r from-warning/5 to-transparent hover:border-warning/50 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                  <Eye className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-extrabold text-foreground">Detecting the Jump (Secret Trick)</p>
                  <p className="text-xs text-muted-foreground">Warning signs before big spikes on SyntX indices</p>
                </div>
                {showJump ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {JUMP_SIGNALS.map((sig, i) => (
                  <Card key={i} className="bg-muted/20 border-border/30">
                    <CardContent className="p-3 space-y-1">
                      <p className="text-xs font-bold text-warning">{sig.sign}</p>
                      <p className="text-xs text-muted-foreground">{sig.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                <p className="text-xs font-bold text-foreground mb-1">Practical Jump Strategy (SwitchX)</p>
                <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Wait for big spike — do NOT trade it</li>
                  <li>Wait for first pullback</li>
                  <li>Enter in the new direction</li>
                  <li>This avoids getting caught in the spike itself</li>
                </ol>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* ── Best Timeframes ── */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Best Timeframes for SyntX
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-bold text-foreground">M1</p>
              <p className="text-[10px] text-muted-foreground">Scalping</p>
            </div>
            <div className="text-center bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-xs font-bold text-primary">M5 ★</p>
              <p className="text-[10px] text-muted-foreground">Best balance</p>
            </div>
            <div className="text-center bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-bold text-foreground">M15</p>
              <p className="text-[10px] text-muted-foreground">Trend trades</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Best for Small Accounts ── */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" /> Best SyntX for Small Accounts
          </p>
          <div className="space-y-2">
            {BEST_FOR_SMALL.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg p-2.5 border border-border/20">
                <span className={`text-xs font-bold ${item.color}`}>{item.index}</span>
                <Badge variant="outline" className={`text-[10px] ${
                  item.difficulty === "Easy" ? "text-success border-success/30" :
                  item.difficulty === "Hard" ? "text-destructive border-destructive/30" :
                  "text-warning border-warning/30"
                }`}>{item.difficulty}</Badge>
                <span className="text-xs text-muted-foreground">{item.style}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-success/5 border border-success/20 p-3">
            <p className="text-xs font-bold text-foreground">✅ Most Profitable Combo</p>
            <p className="text-[10px] text-muted-foreground mt-1">PainX → quick BUY scalps • SwitchX → spike reversal trades • TrendX → longer trend holds</p>
          </div>
        </CardContent>
      </Card>

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
              SyntX indices are algorithm-driven synthetic products — they simulate markets but don't represent real assets. 
              Use small lot sizes, take fast profits, and always use stop losses. Never risk more than you can afford to lose.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
