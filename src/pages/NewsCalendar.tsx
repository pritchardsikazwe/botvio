import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import {
  Newspaper, AlertTriangle, TrendingUp, TrendingDown, Shield,
  Clock, Target, Zap, BarChart3, Flame, Globe, ArrowRight,
  CalendarDays, CheckCircle, XCircle, Lightbulb, Timer
} from "lucide-react";
import { useEffect, useState } from "react";

const CALENDAR_EVENTS = [
  { date: "Mar 8", currency: "JPY", event: "Average Cash Earnings y/y", impact: "Medium", implication: "Affects JPY strength" },
  { date: "Mar 9", currency: "EUR", event: "German Factory Orders m/m", impact: "High", implication: "EUR volatility" },
  { date: "Mar 9", currency: "USD", event: "Trump Speech", impact: "High", implication: "USD & oil-linked pairs" },
  { date: "Mar 10", currency: "CNY", event: "CPI y/y", impact: "High", implication: "Impacts risk sentiment, AUD/CAD" },
  { date: "Mar 11", currency: "USD", event: "CPI Release", impact: "High", implication: "Major USD volatility" },
  { date: "Mar 12", currency: "USD", event: "PPI Data", impact: "Medium", implication: "Inflation expectations" },
  { date: "Mar 13", currency: "USD", event: "Jobless Claims", impact: "Medium", implication: "Labour market health" },
  { date: "Mar 14", currency: "GBP", event: "UK GDP m/m", impact: "High", implication: "GBP/USD volatility" },
  { date: "Mar 18", currency: "USD", event: "Retail Sales", impact: "High", implication: "Consumer spending gauge" },
  { date: "Mar 19", currency: "USD", event: "FOMC Rate Decision", impact: "High", implication: "All USD pairs & gold" },
  { date: "Mar 20", currency: "GBP", event: "BOE Rate Decision", impact: "High", implication: "GBP pairs sharp moves" },
  { date: "Mar 21", currency: "JPY", event: "BOJ Rate Decision", impact: "High", implication: "JPY pairs, Nikkei" },
];

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted/30 text-muted-foreground border-border",
};

const WEEKLY_PLAN = [
  { day: "Monday", focus: "Review weekly calendar, mark key events, set alerts", risk: "Low" },
  { day: "Tuesday", focus: "Trade Asian/London sessions, avoid pre-CPI positioning", risk: "Medium" },
  { day: "Wednesday", focus: "CPI / Fed day — trade the reaction, not the prediction", risk: "High" },
  { day: "Thursday", focus: "Jobless Claims + PPI — follow-through or reversal setups", risk: "Medium" },
  { day: "Friday", focus: "GDP/NFP day — close positions before weekend gaps", risk: "High" },
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
        title="Forex News Calendar & Trading Strategies | Botvio"
        description="High-impact forex factory calendar events, CPI, NFP, Fed decisions. Best strategies to trade news events with entry levels and risk management."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-5xl">
        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Newspaper className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl md:text-3xl font-black text-foreground">
              High-Impact News Calendar
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Track the most market-moving economic events. CPI, NFP, Fed decisions & geopolitical catalysts — with Hauza trading strategies.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <LiveClock />
          </div>
        </section>

        {/* Top News Catalysts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive" /> U.S. CPI (Inflation Data)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Latest release showed <span className="text-foreground font-semibold">+0.3% MoM</span> in February 2026, slightly above January's +0.2%.</p>
              <p>Inflation data directly influences Fed policy, making USD pairs (EUR/USD, GBP/USD, USD/JPY) <span className="text-destructive font-semibold">highly volatile</span>.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">EUR/USD • GBP/USD • XAU/USD</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Non-Farm Payrolls (NFP)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Scheduled monthly, this report on U.S. job creation is one of the <span className="text-foreground font-semibold">most traded events</span>.</p>
              <p>Stronger-than-expected NFP usually strengthens the USD, while weaker data weakens it.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">First Friday Monthly</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" /> Federal Reserve Rate Decisions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Traders watch for rate hikes or dovish signals. Even small changes in tone can move USD, gold, and equities <span className="text-foreground font-semibold">sharply</span>.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">8 meetings/year</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-warning" /> Geopolitical News (Oil & Middle East)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Current tensions in the Middle East have pushed oil prices higher. This impacts oil-sensitive currencies like <span className="text-foreground font-semibold">CAD and NOK</span>, and risk sentiment overall.</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={IMPACT_COLORS["High"]}>High Impact</Badge>
                <Badge variant="outline" className="text-[10px]">CAD • NOK • OIL</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Calendar Table */}
        <section>
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> 📊 Extended Calendar Highlights
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
                        <td className="px-3 py-2.5 font-mono font-semibold text-foreground">{evt.date}</td>
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
        <section>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> 📅 Weekly Trading Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {WEEKLY_PLAN.map((w, i) => (
                <div key={i} className="flex items-center gap-3 text-xs p-2 rounded bg-secondary/50">
                  <span className="font-bold text-foreground w-20 shrink-0">{w.day}</span>
                  <span className="text-muted-foreground flex-1">{w.focus}</span>
                  <Badge variant="outline" className={`text-[9px] ${IMPACT_COLORS[w.risk]}`}>{w.risk} Risk</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Do's & Don'ts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              "Don't hold large positions overnight before NFP/CPI",
              "Never remove your stop loss during news volatility",
              "Don't chase the spike — wait for pullback confirmation",
              "Don't trade every news event — focus only on HIGH impact",
            ]}
            proTip="The most profitable news traders only take 1-2 trades per major event. Quality over quantity wins."
          />

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Pairs Most Affected by Event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { event: "CPI / PPI", pairs: "EUR/USD, GBP/USD, XAU/USD, USD/JPY" },
                { event: "NFP", pairs: "EUR/USD, USD/CAD, GBP/USD, US30" },
                { event: "FOMC / Fed", pairs: "All USD pairs, Gold, S&P 500" },
                { event: "BOE", pairs: "GBP/USD, EUR/GBP, FTSE 100" },
                { event: "BOJ", pairs: "USD/JPY, EUR/JPY, Nikkei 225" },
                { event: "Oil/OPEC", pairs: "USD/CAD, WTI, Brent, NOK" },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/50">
                  <span className="font-bold text-foreground">{p.event}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">{p.pairs}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Risks & Considerations */}
        <section>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> ⚠️ Risks & Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Zap className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                <p><span className="text-foreground font-semibold">Whipsaw Movements:</span> High-impact events often cause sharp spikes before settling.</p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingDown className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                <p><span className="text-foreground font-semibold">Liquidity Risks:</span> Thin liquidity around announcements can widen spreads by 10-50x.</p>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p><span className="text-foreground font-semibold">Geopolitical Uncertainty:</span> Oil-related headlines can override calendar events, especially during Middle East tensions.</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p><span className="text-foreground font-semibold">Slippage:</span> Market orders during news can fill 20-100 pips away from expected price.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trading Strategies */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Best Strategies to Trade News Events
          </h2>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">📌 Pre-News Preparation</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>• <span className="text-foreground font-medium">Mark the Event:</span> Know the exact release time and currency affected.</p>
              <p>• <span className="text-foreground font-medium">Check Forecast vs. Previous:</span> Markets move based on the difference between forecast and actual.</p>
              <p>• <span className="text-foreground font-medium">Identify Key Levels:</span> Support/resistance on major pairs act as magnets during volatility.</p>
              <p>• <span className="text-foreground font-medium">Set Alerts:</span> Use price alerts at key S/R zones so you don't miss the move.</p>
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
                <p>Place buy stop above resistance and sell stop below support just before release.</p>
                <p>Works best for <span className="text-foreground font-semibold">NFP and CPI</span> where volatility is guaranteed.</p>
                <p className="text-destructive/80">⚠️ Risk: Slippage and whipsaws can hit both orders.</p>
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
                <p>Wait for the first sharp move. If price overshoots, enter opposite direction once momentum stalls.</p>
                <p>Example: CPI comes in hot → USD spikes → <span className="text-foreground font-semibold">fade when exhausted</span>.</p>
                <p className="text-destructive/80">⚠️ Risk: Requires patience; don't jump too early.</p>
                <p className="text-success text-[10px] font-semibold mt-1">✅ Best for: Experienced traders with patience</p>
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
                <p>If news aligns with broader trend (e.g., strong CPI in USD uptrend), ride the momentum.</p>
                <p>Enter after <span className="text-foreground font-semibold">retracement</span> to avoid chasing the spike.</p>
                <p className="text-destructive/80">⚠️ Risk: False breakouts if sentiment shifts.</p>
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
              <p>• <span className="text-foreground font-medium">Use Smaller Lot Sizes:</span> News spikes can widen spreads significantly — reduce by 50%.</p>
              <p>• <span className="text-foreground font-medium">Set Wider Stops:</span> Use 1.5-2x normal SL to avoid noise stop-outs.</p>
              <p>• <span className="text-foreground font-medium">Avoid Overtrading:</span> One or two well-managed trades per event is enough.</p>
              <p>• <span className="text-foreground font-medium">Check Correlated Assets:</span> Gold, oil, and indices often react alongside currencies.</p>
              <p>• <span className="text-foreground font-medium">Max Risk per Event:</span> Never risk more than 1-2% of account on a single news trade.</p>
            </CardContent>
          </Card>

          {/* Actionable Example */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <Target className="h-4 w-4" /> 🎯 Actionable Example
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p><span className="text-foreground font-medium">Event:</span> U.S. CPI Release</p>
              <p><span className="text-foreground font-medium">Forecast:</span> +0.3% | <span className="text-foreground font-medium">Actual:</span> +0.5% (higher inflation)</p>
              <p><span className="text-foreground font-medium">Reaction:</span> USD strengthens → EUR/USD drops sharply</p>
              <p><span className="text-foreground font-medium">Strategy:</span> Enter short EUR/USD after retracement to resistance, targeting next support.</p>
              <p><span className="text-foreground font-medium">Risk:</span> SL 30 pips above entry, TP 60 pips below = 1:2 RR</p>
            </CardContent>
          </Card>
        </section>

        {/* Takeaway */}
        <section>
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4">
              <p className="text-xs text-foreground font-semibold flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>
                  ✅ <strong>Actionable Takeaway:</strong> The most consistent approach is to wait for the initial spike, confirm direction, and trade with the trend. Prioritize U.S. CPI, NFP, Fed decisions, and geopolitical oil news — these events consistently deliver the strongest volatility across major currency pairs.
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
