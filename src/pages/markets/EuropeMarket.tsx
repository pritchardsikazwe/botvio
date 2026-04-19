import { MarketPageLayout } from "@/components/markets/MarketPageLayout";
import { MarketSignalCard } from "@/components/markets/MarketSignalCard";
import { MarketSentimentGauge } from "@/components/markets/MarketSentimentGauge";
import { EconomicEventsCard } from "@/components/markets/EconomicEventsCard";
import { SectorHeatmap } from "@/components/markets/SectorHeatmap";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import { InstitutionalFlowCard } from "@/components/markets/InstitutionalFlowCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXNESS = "https://one.exness-track.com/a/ts1kvs1k";

const EU_SIGNALS = [
  { instrument: "DAX 40", symbol: "DE40", price: "18,450", change: "+92.0", changePercent: "+0.50%", signal: "BUY" as const, entry: "18420", stopLoss: "18320", takeProfit: "18600", strategy: "Trend Continuation", session: "London", confidence: 78, bias: "Bullish" as const },
  { instrument: "FTSE 100", symbol: "UK100", price: "8,120", change: "-18.0", changePercent: "-0.22%", signal: "SELL" as const, entry: "8130", stopLoss: "8180", takeProfit: "8050", strategy: "Resistance Rejection", session: "London", confidence: 71, bias: "Bearish" as const },
  { instrument: "CAC 40", symbol: "FR40", price: "7,890", change: "+25.0", changePercent: "+0.32%", signal: "BUY" as const, entry: "7880", stopLoss: "7840", takeProfit: "7960", strategy: "Breakout Strategy", session: "London", confidence: 74, bias: "Bullish" as const },
  { instrument: "EUR/USD", symbol: "EURUSD", price: "1.0860", change: "-0.0012", changePercent: "-0.11%", signal: "SELL" as const, entry: "1.0870", stopLoss: "1.0920", takeProfit: "1.0815", strategy: "Mean Reversion", session: "London/NY", confidence: 69, bias: "Bearish" as const },
  { instrument: "GBP/USD", symbol: "GBPUSD", price: "1.2940", change: "+0.0018", changePercent: "+0.14%", signal: "BUY" as const, entry: "1.2930", stopLoss: "1.2880", takeProfit: "1.3010", strategy: "Support Bounce", session: "London", confidence: 73, bias: "Bullish" as const },
  { instrument: "Euro Stoxx 50", symbol: "EU50", price: "5,015", change: "+20.0", changePercent: "+0.40%", signal: "HOLD" as const, entry: "5010", stopLoss: "4980", takeProfit: "5060", strategy: "Range Consolidation", session: "London", confidence: 55, bias: "Neutral" as const, isPremium: true },
];

const EuropeMarket = () => (
  <MarketPageLayout seoKey="marketsEurope" title="Europe Market Dashboard" description="DAX, FTSE 100, CAC 40, EUR/USD trading signals and European market intelligence." emoji="🇪🇺">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">European Indices</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "DAX 40", val: "18,450", pct: "+0.50%" },
            { name: "FTSE 100", val: "8,120", pct: "-0.22%" },
            { name: "CAC 40", val: "7,890", pct: "+0.32%" },
            { name: "Euro Stoxx 50", val: "5,015", pct: "+0.40%" },
          ].map((idx) => (
            <div key={idx.name} className="p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-xs text-muted-foreground">{idx.name}</p>
              <p className="text-lg font-extrabold font-mono text-foreground">{idx.val}</p>
              <p className={`text-xs font-bold ${idx.pct.startsWith("+") ? "text-success" : "text-destructive"}`}>{idx.pct}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <MarketSentimentGauge bullish={58} />

    <div>
      <h2 className="text-lg font-extrabold text-foreground mb-3">📊 Trading Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EU_SIGNALS.map((s) => <MarketSignalCard key={s.symbol} {...s} brokerName="Exness" brokerUrl={EXNESS} />)}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InstitutionalFlowCard
        flows={[
          { label: "ECB Bond Buying", value: "€1.2B", direction: "in" },
          { label: "Foreign Outflow", value: "€420M", direction: "out" },
          { label: "ETF Inflows", value: "€680M", direction: "in" },
        ]}
        bias="Net Positive"
      />
      <EconomicEventsCard events={[
        { time: "10:00 GMT", currency: "EUR", event: "German Factory Orders", impact: "HIGH" },
        { time: "12:00 GMT", currency: "GBP", event: "BOE Rate Decision", impact: "HIGH" },
        { time: "09:30 GMT", currency: "EUR", event: "ECB Press Conference", impact: "HIGH" },
        { time: "07:00 GMT", currency: "EUR", event: "German CPI", impact: "MEDIUM" },
      ]} />
    </div>

    <SectorHeatmap sectors={[
      { name: "Automotive", change: 1.1 }, { name: "Luxury", change: 0.6 },
      { name: "Banking", change: -0.3 }, { name: "Energy", change: 0.9 },
      { name: "Pharma", change: 0.2 }, { name: "Telecom", change: -0.1 },
    ]} />

    <TradingTipsCard
      title="Europe Market Do's & Don'ts"
      dos={[
        "Trade London session (08:00-16:30 GMT) for peak EUR/GBP liquidity",
        "Watch ECB rhetoric for EUR direction — even hints move markets",
        "DAX follows US futures — check pre-market S&P for direction",
        "Use EUR/GBP as a relative strength gauge between EUR and GBP",
      ]}
      donts={[
        "Don't trade EUR/USD during thin Asian hours — spreads widen",
        "Don't hold GBP positions through BOE meetings without protection",
        "Avoid German DAX if you haven't checked US futures first",
        "Don't ignore Brexit-related regulatory risks for UK stocks",
      ]}
      proTip="The London-New York overlap (13:00-16:30 GMT) is the highest-volume window for EUR and GBP pairs."
    />
  </MarketPageLayout>
);

export default EuropeMarket;
