import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import {
  Newspaper, AlertTriangle, TrendingUp, TrendingDown, Shield,
  Clock, Target, Zap, BarChart3, Flame, Globe, ArrowRight,
  CalendarDays, CheckCircle, XCircle, Lightbulb, Timer, Sparkles, Eye
} from "lucide-react";
import { useEffect, useState } from "react";

const CALENDAR_EVENTS = [
  { date: "Mar 31 (Mon)", currency: "EUR", event: "Eurozone CPI Flash y/y", impact: "High", implication: "EUR pairs — inflation direction for ECB" },
  { date: "Mar 31 (Mon)", currency: "USD", event: "Chicago PMI", impact: "Medium", implication: "Regional manufacturing gauge for USD" },
  { date: "Apr 1 (Tue)", currency: "USD", event: "ISM Manufacturing PMI", impact: "High", implication: "Major USD mover — manufacturing health" },
  { date: "Apr 1 (Tue)", currency: "USD", event: "JOLTS Job Openings", impact: "High", implication: "Labour market demand — Fed watch" },
  { date: "Apr 2 (Wed)", currency: "USD", event: "ADP Non-Farm Employment", impact: "High", implication: "NFP preview — USD pairs + Gold" },
  { date: "Apr 2 (Wed)", currency: "EUR", event: "Eurozone Unemployment Rate", impact: "Medium", implication: "EUR sentiment indicator" },
  { date: "Apr 3 (Thu)", currency: "USD", event: "ISM Services PMI", impact: "High", implication: "Services sector — key for GDP outlook" },
  { date: "Apr 3 (Thu)", currency: "USD", event: "Unemployment Claims", impact: "Medium", implication: "Weekly labour market pulse" },
  { date: "Apr 4 (Fri)", currency: "USD", event: "Non-Farm Payrolls (NFP)", impact: "High", implication: "THE event — ALL USD pairs + Gold + Indices" },
  { date: "Apr 4 (Fri)", currency: "USD", event: "Unemployment Rate", impact: "High", implication: "Fed rate path — risk sentiment" },
  { date: "Apr 4 (Fri)", currency: "CAD", event: "Canada Employment Change", impact: "High", implication: "USD/CAD directional trigger" },
];

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted/30 text-muted-foreground border-border",
};

const WEEKLY_PLAN = [
  { day: "Monday 31st", focus: "Eurozone CPI Flash + Chicago PMI — set EUR/USD bias for the week.", risk: "Medium", emoji: "📊" },
  { day: "Tuesday 1st", focus: "ISM Manufacturing + JOLTS — USD pairs will move sharply. Key direction setter.", risk: "High", emoji: "🔥" },
  { day: "Wednesday 2nd", focus: "ADP Employment — NFP preview. Position for Friday but don't overcommit.", risk: "High", emoji: "⚡" },
  { day: "Thursday 3rd", focus: "ISM Services PMI — confirms economic health. Fine-tune Friday positioning.", risk: "Medium", emoji: "⏳" },
  { day: "Friday 4th", focus: "NFP (BIG ONE) + Canada Employment — THE event of the month. Close all before weekend.", risk: "High", emoji: "🎯" },
];

const THIS_WEEK_FOCUS = [
  { title: "🎯 NFP Friday", desc: "Non-Farm Payrolls — THE biggest USD event of the month. Strong = USD rally, Gold dip. Weak = rate cut hopes, Gold rally.", pairs: "EUR/USD, XAU/USD, USD/JPY, US30" },
  { title: "📈 ISM Manufacturing Tue", desc: "Factory health check. Below 50 = contraction worry. Above 50 = USD strength.", pairs: "EUR/USD, USD/CAD, NAS100" },
  { title: "👷 ADP Wednesday", desc: "Private payroll preview for NFP. Sets expectations and early positioning.", pairs: "XAU/USD, EUR/USD, GBP/USD" },
  { title: "🇪🇺 Eurozone CPI Monday", desc: "Flash inflation data. Hot = ECB stays hawkish → EUR strength. Cool = rate cut bets.", pairs: "EUR/USD, EUR/GBP, DAX" },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span className="font-mono text-xs text-muted-foreground">
      {time.toUTCString().slice(17, 25)} UTC
    </span>
  );
}

const NewsCalendar = () => {
  return (
    <div className="min-h-screen bg-background">
        <SEOHead
          title="Forex News Calendar — Week of Mar 31 – Apr 4, 2026 | Botvio"
          description="This week's high-impact forex events: NFP, ISM Manufacturing, ADP, Eurozone CPI. Trading strategies, entry levels, and risk management."
        />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-5xl">
        {/* Hero */}
        <section className="text-center space-y-3 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <Newspaper className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl md:text-3xl font-black text-foreground">
              News Calendar — Week of Mar 31 – Apr 4
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            This week's biggest market movers: NFP Friday, ISM Manufacturing, ADP Employment & Eurozone CPI. Plan your trades with Botvio AI strategies.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <LiveClock />
            </div>
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 animate-pulse">
              <Flame className="h-3 w-3 mr-1" /> NFP Week — 5 High-Impact Events
            </Badge>
          </div>
        </section>

        {/* This Week's Focus */}
        <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">🔥 This Week's Key Focus</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THIS_WEEK_FOCUS.map((f, i) => (
              <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>{f.desc}</p>
                  <Badge variant="outline" className="text-[10px]">{f.pairs}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Top News Catalysts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive" /> Core PCE Price Index (Friday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>The Fed's <span className="text-foreground font-semibold">preferred inflation gauge</span>. Expected +0.3% MoM for February.</p>
              <p>Hot reading → USD strength, Gold weakness. Cool reading → rate cut bets rise, Gold + equities rally.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">EUR/USD • GBP/USD • XAU/USD</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> US GDP Final (Thursday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Final Q4 2025 GDP revision. Expected <span className="text-foreground font-semibold">+2.3% annualized</span>.</p>
              <p>Upward revision = USD strength + equity support. Downward = risk-off sentiment.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">US30 • NAS100 • USD pairs</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" /> UK CPI (Tuesday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>UK inflation data. If <span className="text-foreground font-semibold">sticky above target</span>, BOE delays rate cuts → GBP strength.</p>
              <p>Below forecast → rate cut expectations rise, GBP weakens.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">GBP/USD • EUR/GBP</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-warning" /> German Ifo + Flash PMIs (Monday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Sets the tone for the week. Weak German data = EUR under pressure. Strong PMIs = risk-on.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">EUR/USD • DAX • S&P500</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Calendar Table */}
        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> 📊 Full Week Calendar — Mar 24-28, 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Currency</th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Event</th>
                      <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Impact</th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Trading Implication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CALENDAR_EVENTS.map((evt, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">{evt.date}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-[9px] font-bold">{evt.currency}</Badge>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{evt.event}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className={`text-[9px] ${IMPACT_COLORS[evt.impact]}`}>{evt.impact}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{evt.implication}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Weekly Trading Planner */}
        <section className="animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> 📅 Weekly Trading Plan — Mar 24-28
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {WEEKLY_PLAN.map((w, i) => (
                <div key={i} className="flex items-center gap-3 text-xs p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                  <span className="text-lg">{w.emoji}</span>
                  <span className="font-bold text-foreground w-28 shrink-0">{w.day}</span>
                  <span className="text-muted-foreground flex-1">{w.focus}</span>
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${IMPACT_COLORS[w.risk]}`}>{w.risk}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Do's & Don'ts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <TradingTipsCard
            title="News Trading Do's & Don'ts"
            dos={[
              "Wait for candle close after news before entering",
              "Use pending orders with defined SL/TP before high-impact events",
              "Trade the reaction, not the prediction — let the market show direction",
              "Reduce position size by 50% during red-folder events",
              "Check correlated assets (Gold moves with USD weakness)",
            ]}
            donts={[
              "Don't trade 5 minutes before or after release — spreads widen",
              "Don't hold large positions overnight before GDP/PCE",
              "Never remove your stop loss during news volatility",
              "Don't chase the spike — wait for pullback confirmation",
              "Don't trade every news event — focus only on HIGH impact",
            ]}
            proTip="Friday's Core PCE is THE event this week. Plan everything around it. Close risky positions Thursday night."
          />

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Pairs Most Affected This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { event: "Core PCE (Fri)", pairs: "EUR/USD, GBP/USD, XAU/USD, USD/JPY" },
                { event: "US GDP (Thu)", pairs: "US30, NAS100, EUR/USD, USD/CAD" },
                { event: "UK CPI (Tue)", pairs: "GBP/USD, EUR/GBP, FTSE 100" },
                { event: "German Ifo (Mon)", pairs: "EUR/USD, DAX, EUR/GBP" },
                { event: "Canada GDP (Fri)", pairs: "USD/CAD, CAD/JPY" },
                { event: "Flash PMIs (Mon)", pairs: "EUR/USD, GBP/USD, S&P 500" },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/50">
                  <span className="font-bold text-foreground">{p.event}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">{p.pairs}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Risks */}
        <section className="animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> ⚠️ This Week's Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2"><Zap className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">Core PCE Whipsaw:</span> Friday PCE can cause sharp USD spikes before settling. Don't chase the first candle.</p></div>
              <div className="flex items-start gap-2"><TrendingDown className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">End-of-Quarter Flows:</span> Q1 rebalancing may cause erratic moves across equities and bonds mid-week.</p></div>
              <div className="flex items-start gap-2"><Globe className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">Geopolitical:</span> Middle East tensions ongoing. Oil-sensitive pairs (CAD, NOK) may gap on headlines.</p></div>
              <div className="flex items-start gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">Liquidity:</span> Thin liquidity around GDP and PCE releases can widen spreads by 20-50x.</p></div>
            </CardContent>
          </Card>
        </section>

        {/* Strategies */}
        <section className="space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Best Strategies for This Week
          </h2>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">📌 Pre-Week Preparation</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>• <span className="text-foreground font-medium">Monday:</span> Set weekly bias based on PMI + Ifo data. Mark key S/R levels.</p>
              <p>• <span className="text-foreground font-medium">Tue-Wed:</span> Trade UK CPI reaction. Scalp opportunities on quieter Wednesday.</p>
              <p>• <span className="text-foreground font-medium">Thursday:</span> GDP trade — position for Friday PCE based on GDP outcome.</p>
              <p>• <span className="text-foreground font-medium">Friday:</span> Core PCE — THE event. Wait for initial spike, trade the reaction, close before weekend.</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" /> A. Straddle Strategy
                </CardTitle>
                <Badge variant="outline" className="text-[8px] w-fit border-primary/30 text-primary">Before News</Badge>
              </CardHeader>
              <CardContent className="text-[11px] text-muted-foreground space-y-1.5">
                <p>Place buy stop above resistance and sell stop below support before GDP/PCE release.</p>
                <p>Best for <span className="text-foreground font-semibold">Thursday GDP and Friday PCE</span>.</p>
                <p className="text-destructive/80">⚠️ Risk: Slippage and whipsaws.</p>
                <p className="text-success text-[10px] font-semibold mt-1">✅ Best for: Guaranteed volatility events</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-success/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <TrendingDown className="h-3.5 w-3.5 text-success" /> B. Fade the Spike
                </CardTitle>
                <Badge variant="outline" className="text-[8px] w-fit border-success/30 text-success">After News</Badge>
              </CardHeader>
              <CardContent className="text-[11px] text-muted-foreground space-y-1.5">
                <p>Wait for PCE spike → if price overshoots → fade when exhaustion candle prints.</p>
                <p>Example: Hot PCE → USD spikes → <span className="text-foreground font-semibold">fade when exhausted</span>.</p>
                <p className="text-destructive/80">⚠️ Risk: Patience required.</p>
                <p className="text-success text-[10px] font-semibold mt-1">✅ Best for: Experienced traders</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-warning/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-warning" /> C. Trend Continuation
                </CardTitle>
                <Badge variant="outline" className="text-[8px] w-fit border-warning/30 text-warning">Post News</Badge>
              </CardHeader>
              <CardContent className="text-[11px] text-muted-foreground space-y-1.5">
                <p>If PCE aligns with USD trend → ride momentum after retracement.</p>
                <p>Enter after <span className="text-foreground font-semibold">retracement</span> to avoid chasing.</p>
                <p className="text-destructive/80">⚠️ Risk: False breakouts.</p>
                <p className="text-success text-[10px] font-semibold mt-1">✅ Best for: Trend-following traders</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" /> 🛡️ Risk Management Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>• <span className="text-foreground font-medium">Use Smaller Lot Sizes:</span> PCE and GDP can widen spreads significantly — reduce by 50%.</p>
              <p>• <span className="text-foreground font-medium">Set Wider Stops:</span> Use 1.5-2x normal SL on Thursday/Friday events.</p>
              <p>• <span className="text-foreground font-medium">Avoid Overtrading:</span> 1-2 trades per event is enough.</p>
              <p>• <span className="text-foreground font-medium">Close Before Weekend:</span> Q1 end + PCE Friday — close all by 4pm EST.</p>
              <p>• <span className="text-foreground font-medium">Max Risk per Event:</span> Never risk more than 1-2% on a single news trade.</p>
            </CardContent>
          </Card>

          {/* Actionable Example */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <Target className="h-4 w-4" /> 🎯 This Week's Actionable Example
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p><span className="text-foreground font-medium">Event:</span> Core PCE Price Index (Friday Mar 28)</p>
              <p><span className="text-foreground font-medium">Forecast:</span> +0.3% MoM | <span className="text-foreground font-medium">If Actual:</span> +0.4% (hotter)</p>
              <p><span className="text-foreground font-medium">Reaction:</span> USD strengthens → EUR/USD drops, Gold falls</p>
              <p><span className="text-foreground font-medium">Strategy:</span> Short EUR/USD after retracement to broken support, target next level.</p>
              <p><span className="text-foreground font-medium">Risk:</span> SL 25 pips above entry, TP 50 pips below = 1:2 RR</p>
            </CardContent>
          </Card>
        </section>

        {/* Takeaway */}
        <section className="animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4">
              <p className="text-xs text-foreground font-semibold flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>
                  ✅ <strong>Week Summary:</strong> Core PCE on Friday is THE event. Use Mon-Wed to set bias, Thu GDP to confirm direction, and Fri PCE for the big move. Close everything before the weekend — it's quarter-end and liquidity will be thin.
                </span>
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default NewsCalendar;
