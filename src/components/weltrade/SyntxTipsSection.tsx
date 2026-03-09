import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import {
  Shield, TrendingUp, AlertTriangle, BookOpen, ChevronDown, ChevronRight,
  Target, DollarSign, Clock, Layers, BarChart3, Zap, Activity,
} from "lucide-react";

const ANALYSIS_TOPICS = [
  {
    title: "Understanding PainX vs GainX",
    icon: Activity,
    content: "PainX indices are designed with a bearish bias — they spike down frequently, making them ideal for sell-side scalping. GainX indices have a bullish bias with upward spikes. Understanding this built-in directional bias is crucial for profitable trading.",
  },
  {
    title: "Volatility Index Mechanics",
    icon: BarChart3,
    content: "FX Volatility and SFX Volatility indices simulate forex-like price action with synthetic volatility. Higher numbers (100, 200, 1200) mean more volatility. Use lower indices for learning and higher ones for aggressive strategies.",
  },
  {
    title: "Best Timeframes for SyntX",
    icon: Clock,
    content: "For PainX/GainX spike trading, use 1m-5m charts. For TrendX trend-following, use 15m-1H. For BreakX/FlipX, use 5m-15m. Match your timeframe to the index's natural behavior pattern.",
  },
];

const TIPS_BEGINNER = [
  { icon: Shield, title: "Start with GainX 10", desc: "GainX 10 has the gentlest moves of all SyntX indices. Perfect for learning the mechanics without heavy drawdowns." },
  { icon: TrendingUp, title: "Trade with the Bias", desc: "PainX = look for sells. GainX = look for buys. Don't fight the built-in directional bias — it's the key to consistent profits." },
  { icon: AlertTriangle, title: "Fixed Lot Sizes Only", desc: "Never use martingale on SyntX. Spikes can be extreme. Use fixed, small lot sizes and accept small losses as part of the strategy." },
  { icon: Layers, title: "Demo First, Always", desc: "Weltrade offers demo accounts. Trade SyntX in demo for at least 2 weeks before going live. Learn the spike patterns and timing." },
];

const TIPS_PRO = [
  { icon: BarChart3, title: "Spike Drought Detection", desc: "Count candles since the last spike on PainX. After 30-50 calm candles, spike probability increases. This is the foundation of the Hauza Spike Scalper strategy." },
  { icon: Zap, title: "Cross-Index Correlation", desc: "PainX 50 and PainX 100 often spike within minutes of each other. Use the lower-numbered index as a leading indicator for the higher one." },
  { icon: Target, title: "Volume Profile on TrendX", desc: "TrendX respects volume-weighted levels. Mark high-volume zones as support/resistance for better entry precision." },
  { icon: DollarSign, title: "Session-Based Edge", desc: "SyntX liquidity peaks during European hours (08:00-16:00 GMT). Spikes are more predictable during this window. Avoid late-night trading." },
];

const GLOSSARY = [
  { term: "PainX", def: "Synthetic index with bearish bias and sharp downward spikes. Available in 10, 25, 50, 75, 100, 200, 300, 600, 900, 1200 volatility levels." },
  { term: "GainX", def: "Synthetic index with bullish bias and upward momentum spikes. Mirrors PainX structure but in the opposite direction." },
  { term: "TrendX", def: "Directional synthetic index with built-in trend continuation bias. Ideal for breakout and momentum strategies." },
  { term: "FX Volatility", def: "Synthetic index simulating forex-like price action. Available in 10, 25, 50, 75, 100, 150, 250 volatility levels." },
  { term: "SFX Volatility", def: "Super FX Volatility — higher volatility variant of FX Vol indices. Available in 50, 100, 200, 300 levels." },
  { term: "FlipX", def: "Synthetic index that randomly reverses direction. Designed for mean-reversion and range-bound strategies." },
  { term: "SwitchX", def: "Synthetic index that alternates between trending and ranging phases. Requires adaptive strategy switching." },
  { term: "BreakX", def: "Synthetic index designed around breakout mechanics. Consolidates then makes sharp directional moves." },
  { term: "Spike", def: "A sudden, sharp price move characteristic of PainX/GainX indices. Can be 50-200+ pips in seconds." },
];

export function SyntxTipsSection() {
  const [openAnalysis, setOpenAnalysis] = useState<number | null>(0);

  return (
    <div className="space-y-8">
      {/* Analysis */}
      <section>
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> SyntX Market Analysis
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
          <Zap className="h-5 w-5 text-primary" /> Pro SyntX Strategies
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
          <BookOpen className="h-5 w-5 text-warning" /> SyntX Glossary
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
              SyntX indices are synthetic products with extreme volatility. Past performance is not indicative of future results.
              Never risk more than you can afford to lose. Always use stop-losses and practice on demo accounts first.
              The information on this page is for educational purposes only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
