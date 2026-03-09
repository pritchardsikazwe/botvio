import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import {
  Shield, TrendingUp, AlertTriangle, BookOpen, ChevronDown, ChevronRight,
  Target, DollarSign, Clock, Layers, BarChart3, Zap,
} from "lucide-react";

const ANALYSIS_TOPICS = [
  {
    title: "Key Support & Resistance Zones",
    icon: Target,
    content: "Gold typically respects major round numbers ($2300, $2350, $2400). Watch for price reactions at these levels. Previous day high/low and weekly open are critical zones for intraday setups.",
  },
  {
    title: "Gold vs USD Correlation",
    icon: DollarSign,
    content: "Gold moves inversely to the US Dollar. When DXY drops, gold tends to rise. Monitor USD news events (FOMC, NFP, CPI) as they directly impact gold prices.",
  },
  {
    title: "Best Trading Sessions for Gold",
    icon: Clock,
    content: "London session (08:00–16:00 GMT) and New York overlap (13:00–17:00 GMT) offer the highest liquidity and biggest moves. Avoid trading during low-volume Asian sessions unless scalping.",
  },
];

const TIPS_BEGINNER = [
  { icon: Shield, title: "Risk Only 1-2% Per Trade", desc: "Never risk more than 2% of your account on a single gold trade. Gold's volatility can cause rapid drawdowns if position sizing is wrong." },
  { icon: TrendingUp, title: "Follow the Trend", desc: "Gold trends strongly. Use the 50 EMA on the 1H chart — if price is above it, look for buys. Below it, look for sells. Don't fight the trend." },
  { icon: AlertTriangle, title: "Avoid News Spikes", desc: "Don't open trades 15 minutes before or after major USD news events. Spreads widen and price whipsaws can stop you out instantly." },
  { icon: Layers, title: "Use Multiple Timeframes", desc: "Check the Daily chart for direction, 4H for structure, and 15m/1H for entry timing. Multi-timeframe analysis reduces false signals." },
];

const TIPS_PRO = [
  { icon: BarChart3, title: "Volume Profile Analysis", desc: "Use volume profile to identify point of control (POC) and value area. Gold respects these levels as institutional traders accumulate positions there." },
  { icon: Zap, title: "Liquidity Sweep Entries", desc: "Wait for price to sweep above/below key highs/lows before entering. Smart money often hunts stop losses before reversing. Enter after the sweep confirms." },
  { icon: Target, title: "Fibonacci Confluence", desc: "Combine Fibonacci 61.8% and 78.6% retracements with order blocks for high-probability entries. Confluence zones significantly increase win rates." },
  { icon: DollarSign, title: "Hedge with Correlated Assets", desc: "Watch DXY, US10Y bonds, and Silver (XAGUSD) for confirmation. If all align with your gold bias, the trade has higher conviction." },
];

const GLOSSARY = [
  { term: "Order Block", def: "A zone of institutional buying/selling activity, often seen before a strong impulse move." },
  { term: "Fair Value Gap (FVG)", def: "An imbalance in price created by a 3-candle formation where the wicks don't overlap, indicating unmitigated orders." },
  { term: "Liquidity", def: "Clusters of stop-loss orders above highs or below lows that smart money targets before reversing." },
  { term: "Break of Structure (BOS)", def: "When price breaks a recent swing high/low, confirming a shift in market structure." },
  { term: "Change of Character (CHOCH)", def: "The first sign of a potential trend reversal — an internal structure break against the current trend." },
  { term: "Bollinger Band Squeeze", def: "When Bollinger Bands contract tightly, signaling low volatility and an upcoming breakout." },
  { term: "RSI Divergence", def: "When price makes a new high/low but RSI doesn't, indicating weakening momentum and potential reversal." },
  { term: "Golden Cross / Death Cross", def: "When the 50 MA crosses above (Golden) or below (Death) the 200 MA — a major trend signal." },
];

export function GoldTipsSection() {
  const [openAnalysis, setOpenAnalysis] = useState<number | null>(0);

  return (
    <div className="space-y-8">
      {/* Market Analysis */}
      <section>
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Gold Market Analysis
        </h2>
        <div className="space-y-3">
          {ANALYSIS_TOPICS.map((topic, idx) => (
            <Collapsible key={idx} open={openAnalysis === idx} onOpenChange={() => setOpenAnalysis(openAnalysis === idx ? null : idx)}>
              <CollapsibleTrigger className="w-full">
                <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <topic.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-foreground flex-1 text-left">{topic.title}</span>
                    {openAnalysis === idx ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">{topic.content}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>

      {/* Beginner Tips */}
      <section>
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-success" /> Tips for Beginners
          <Badge variant="outline" className="text-xs border-success/30 text-success">Essential</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIPS_BEGINNER.map((tip, idx) => (
            <Card key={idx} className="bg-card border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <tip.icon className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pro Tips */}
      <section>
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Pro Trading Strategies
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">Advanced</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIPS_PRO.map((tip, idx) => (
            <Card key={idx} className="bg-card border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <tip.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Glossary */}
      <section>
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-warning" /> Trading Glossary
        </h2>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 divide-y divide-border/50">
            {GLOSSARY.map((item, idx) => (
              <div key={idx} className={`py-3 ${idx === 0 ? "pt-0" : ""} ${idx === GLOSSARY.length - 1 ? "pb-0" : ""}`}>
                <p className="text-sm font-bold text-foreground">{item.term}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.def}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Risk Warning */}
      <Card className="border border-warning/30 bg-warning/5">
        <CardContent className="p-5 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
          <div>
            <p className="text-sm font-bold text-warning">Risk Disclaimer</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Gold trading involves significant risk. Past performance is not indicative of future results. 
              Never risk more than you can afford to lose. Always use stop-losses and practice proper risk management. 
              The information on this page is for educational purposes only and should not be considered financial advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
