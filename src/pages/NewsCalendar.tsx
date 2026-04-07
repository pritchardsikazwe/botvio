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
  // Week 1: Apr 7–11
  { date: "Apr 7 (Mon)", currency: "EUR", event: "Eurozone Sentix Investor Confidence", impact: "Medium", implication: "EUR pairs — early-week sentiment gauge" },
  { date: "Apr 7 (Mon)", currency: "USD", event: "Consumer Credit", impact: "Medium", implication: "Household borrowing trends — consumer demand outlook" },
  { date: "Apr 8 (Tue)", currency: "USD", event: "NFIB Small Business Index", impact: "Medium", implication: "Small business optimism — economic health" },
  { date: "Apr 8 (Tue)", currency: "AUD", event: "RBA Rate Decision", impact: "High", implication: "AUD pairs — interest rate direction" },
  { date: "Apr 9 (Wed)", currency: "USD", event: "FOMC Meeting Minutes", impact: "High", implication: "Key Fed insight — ALL USD pairs + Gold" },
  { date: "Apr 9 (Wed)", currency: "NZD", event: "RBNZ Rate Decision", impact: "High", implication: "NZD pairs — monetary policy direction" },
  { date: "Apr 10 (Thu)", currency: "USD", event: "CPI (Consumer Price Index)", impact: "High", implication: "THE inflation report — USD, Gold, Indices" },
  { date: "Apr 10 (Thu)", currency: "USD", event: "Unemployment Claims", impact: "Medium", implication: "Weekly labour market pulse" },
  { date: "Apr 11 (Fri)", currency: "USD", event: "PPI (Producer Price Index)", impact: "High", implication: "Wholesale inflation — upstream price pressure" },
  { date: "Apr 11 (Fri)", currency: "GBP", event: "UK GDP m/m", impact: "High", implication: "GBP pairs — economic growth direction" },
  { date: "Apr 11 (Fri)", currency: "CAD", event: "Canada Employment Change", impact: "High", implication: "USD/CAD directional trigger" },
  // Week 2: Apr 14–18
  { date: "Apr 14 (Mon)", currency: "CNY", event: "China Trade Balance", impact: "High", implication: "Risk sentiment — AUD, NZD, commodities" },
  { date: "Apr 14 (Mon)", currency: "EUR", event: "Eurozone Industrial Production", impact: "Medium", implication: "EUR manufacturing health" },
  { date: "Apr 15 (Tue)", currency: "USD", event: "Retail Sales m/m", impact: "High", implication: "Consumer spending — USD pairs + Indices" },
  { date: "Apr 15 (Tue)", currency: "USD", event: "Empire State Manufacturing", impact: "Medium", implication: "Regional factory gauge for USD" },
  { date: "Apr 16 (Wed)", currency: "GBP", event: "UK CPI y/y", impact: "High", implication: "GBP inflation — BOE rate path" },
  { date: "Apr 16 (Wed)", currency: "EUR", event: "ECB Rate Decision", impact: "High", implication: "EUR pairs — major rate event" },
  { date: "Apr 17 (Thu)", currency: "USD", event: "Housing Starts & Building Permits", impact: "Medium", implication: "Real estate sector — economic outlook" },
  { date: "Apr 17 (Thu)", currency: "USD", event: "Philly Fed Manufacturing", impact: "Medium", implication: "Regional manufacturing index" },
  { date: "Apr 18 (Fri)", currency: "USD", event: "Good Friday — Markets Closed", impact: "High", implication: "Low liquidity — close positions before weekend" },
];

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted/30 text-muted-foreground border-border",
};

const WEEKLY_PLAN = [
  { day: "Monday 7th", focus: "Sentix Confidence + Consumer Credit — set EUR/USD bias early.", risk: "Medium", emoji: "📊" },
  { day: "Tuesday 8th", focus: "RBA Rate Decision — AUD pairs will move. NFIB sets USD tone.", risk: "High", emoji: "🔥" },
  { day: "Wednesday 9th", focus: "FOMC Minutes + RBNZ — double central bank day. Key directional setup.", risk: "High", emoji: "⚡" },
  { day: "Thursday 10th", focus: "US CPI (BIG ONE) — THE inflation event. All USD pairs + Gold will move.", risk: "High", emoji: "🎯" },
  { day: "Friday 11th", focus: "PPI + UK GDP + Canada Jobs — triple impact day. Close before weekend.", risk: "High", emoji: "💥" },
  { day: "Monday 14th", focus: "China Trade Balance — risk sentiment + commodity currencies.", risk: "Medium", emoji: "🇨🇳" },
  { day: "Tuesday 15th", focus: "US Retail Sales — consumer spending = economy direction.", risk: "High", emoji: "🛒" },
  { day: "Wednesday 16th", focus: "UK CPI + ECB Decision — double impact. EUR & GBP pairs.", risk: "High", emoji: "🏦" },
  { day: "Thursday 17th", focus: "Housing data + Philly Fed — position for long weekend.", risk: "Medium", emoji: "🏠" },
  { day: "Friday 18th", focus: "Good Friday — markets closed. No trading. Enjoy rest.", risk: "Low", emoji: "🕊️" },
];

const THIS_WEEK_FOCUS = [
  { title: "🎯 US CPI Thursday", desc: "Consumer Price Index — THE inflation event. Hot = USD rally, Gold dip. Cool = rate cut hopes, Gold rally.", pairs: "EUR/USD, XAU/USD, USD/JPY, US30" },
  { title: "📜 FOMC Minutes Wed", desc: "Fed meeting minutes reveal rate path thinking. Hawkish = USD strength. Dovish = risk-on rally.", pairs: "EUR/USD, XAU/USD, NAS100" },
  { title: "🏦 ECB Decision Apr 16", desc: "European Central Bank rate decision. Rate cut = EUR weakness. Hold = EUR strength.", pairs: "EUR/USD, EUR/GBP, DAX" },
  { title: "🇦🇺 RBA Decision Tue", desc: "Reserve Bank of Australia rate call. Hold = AUD neutral. Cut = AUD weakness.", pairs: "AUD/USD, AUD/JPY, NZD/USD" },
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
                <Flame className="h-4 w-4 text-destructive" /> Non-Farm Payrolls (Friday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>THE <span className="text-foreground font-semibold">biggest USD event of the month</span>. Expected ~200K jobs added.</p>
              <p>Strong NFP → USD rally, Gold dip. Weak NFP → rate cut bets soar, Gold + equities rally.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">EUR/USD • XAU/USD • US30</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> ISM Manufacturing PMI (Tuesday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Factory sector health. <span className="text-foreground font-semibold">Above 50 = expansion</span>. Below 50 = contraction.</p>
              <p>Strong reading = USD bullish + equities supported. Weak = risk-off.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">EUR/USD • USD/JPY • NAS100</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" /> ADP Employment (Wednesday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Private payrolls — <span className="text-foreground font-semibold">NFP preview</span>. Sets expectations for Friday.</p>
              <p>Strong ADP → markets position for strong NFP. Weak → early positioning for dovish Fed.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">XAU/USD • GBP/USD • EUR/USD</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-warning" /> Eurozone CPI Flash (Monday)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Sets EUR direction for the week. Hot CPI = ECB stays hawkish → EUR strength.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">EUR/USD • EUR/GBP • DAX</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Calendar Table */}
        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> 📊 Full Week Calendar — Mar 31 – Apr 4, 2026
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
                <CalendarDays className="h-4 w-4 text-primary" /> 📅 Weekly Trading Plan — Mar 31 – Apr 4
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
              "Don't hold large positions overnight before NFP Friday",
              "Never remove your stop loss during news volatility",
              "Don't chase the spike — wait for pullback confirmation",
              "Don't trade every news event — focus only on HIGH impact",
            ]}
            proTip="Friday's NFP is THE event this week. Plan everything around it. Close risky positions Thursday night."
          />

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Pairs Most Affected This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { event: "NFP (Fri)", pairs: "EUR/USD, GBP/USD, XAU/USD, USD/JPY, US30" },
                { event: "ISM Mfg (Tue)", pairs: "EUR/USD, USD/JPY, NAS100" },
                { event: "ADP (Wed)", pairs: "XAU/USD, GBP/USD, EUR/USD" },
                { event: "EU CPI (Mon)", pairs: "EUR/USD, EUR/GBP, DAX" },
                { event: "ISM Services (Thu)", pairs: "US30, NAS100, USD pairs" },
                { event: "Canada Jobs (Fri)", pairs: "USD/CAD, CAD/JPY" },
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
              <div className="flex items-start gap-2"><Zap className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">NFP Whipsaw:</span> Friday NFP can cause sharp USD spikes before settling. Don't chase the first candle.</p></div>
              <div className="flex items-start gap-2"><TrendingDown className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">Q2 Start Flows:</span> New quarter rebalancing can cause erratic moves. Watch for institutional positioning.</p></div>
              <div className="flex items-start gap-2"><Globe className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">Geopolitical:</span> Middle East tensions ongoing. Oil-sensitive pairs (CAD, NOK) may gap on headlines.</p></div>
              <div className="flex items-start gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><p><span className="text-foreground font-semibold">Liquidity:</span> Thin liquidity around NFP and ISM releases can widen spreads by 20-50x.</p></div>
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
              <p>• <span className="text-foreground font-medium">Monday:</span> Set weekly bias from Eurozone CPI. Mark key S/R levels on USD pairs.</p>
              <p>• <span className="text-foreground font-medium">Tuesday:</span> ISM Manufacturing + JOLTS — trade the reaction, set NFP expectations.</p>
              <p>• <span className="text-foreground font-medium">Wednesday:</span> ADP Employment — NFP preview. Position for Friday based on ADP outcome.</p>
              <p>• <span className="text-foreground font-medium">Friday:</span> NFP — THE event. Wait for initial spike, trade the reaction, close before weekend.</p>
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
                <p>Place buy stop above resistance and sell stop below support before NFP release.</p>
                <p>Best for <span className="text-foreground font-semibold">Friday NFP and ISM Services</span>.</p>
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
                <p>Wait for NFP spike → if price overshoots → fade when exhaustion candle prints.</p>
                <p>Example: Strong NFP → USD spikes → <span className="text-foreground font-semibold">fade when exhausted</span>.</p>
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
                <p>If NFP aligns with USD trend → ride momentum after retracement.</p>
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
              <p>• <span className="text-foreground font-medium">Use Smaller Lot Sizes:</span> NFP and ISM can widen spreads significantly — reduce by 50%.</p>
              <p>• <span className="text-foreground font-medium">Set Wider Stops:</span> Use 1.5-2x normal SL on Friday NFP.</p>
              <p>• <span className="text-foreground font-medium">Avoid Overtrading:</span> 1-2 trades per event is enough.</p>
              <p>• <span className="text-foreground font-medium">Close Before Weekend:</span> NFP Friday — close all by 4pm EST.</p>
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
              <p><span className="text-foreground font-medium">Event:</span> Non-Farm Payrolls (Friday Apr 4)</p>
              <p><span className="text-foreground font-medium">Forecast:</span> ~200K jobs | <span className="text-foreground font-medium">If Actual:</span> 250K+ (stronger)</p>
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
                  ✅ <strong>Week Summary:</strong> NFP on Friday is THE event. Use Mon-Wed to set bias with ISM + ADP, Thu to confirm direction, and Fri NFP for the big move. Close everything before the weekend — Q2 just started and positioning will be aggressive.
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
