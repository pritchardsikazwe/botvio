import { MarketPageLayout } from "@/components/markets/MarketPageLayout";
import { MarketSignalCard } from "@/components/markets/MarketSignalCard";
import { MarketSentimentGauge } from "@/components/markets/MarketSentimentGauge";
import { EconomicEventsCard } from "@/components/markets/EconomicEventsCard";
import { SectorHeatmap } from "@/components/markets/SectorHeatmap";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import { VolatilityCard } from "@/components/markets/VolatilityCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXNESS = "https://one.exness-track.com/a/ts1kvs1k";

const ASIA_SIGNALS = [
  { instrument: "Nikkei 225", symbol: "JP225", price: "39,850", change: "+180", changePercent: "+0.45%", signal: "BUY" as const, entry: "39800", stopLoss: "39550", takeProfit: "40200", strategy: "Trend Continuation", session: "Tokyo", confidence: 76, bias: "Bullish" as const },
  { instrument: "Hang Seng", symbol: "HK50", price: "17,420", change: "-85", changePercent: "-0.49%", signal: "SELL" as const, entry: "17450", stopLoss: "17600", takeProfit: "17200", strategy: "Resistance Rejection", session: "Hong Kong", confidence: 71, bias: "Bearish" as const },
  { instrument: "ASX 200", symbol: "AU200", price: "7,890", change: "+22", changePercent: "+0.28%", signal: "BUY" as const, entry: "7880", stopLoss: "7840", takeProfit: "7950", strategy: "Support Bounce", session: "Sydney", confidence: 73, bias: "Bullish" as const },
  { instrument: "USD/JPY", symbol: "USDJPY", price: "151.20", change: "+0.35", changePercent: "+0.23%", signal: "BUY" as const, entry: "151.00", stopLoss: "150.40", takeProfit: "152.00", strategy: "BOJ Policy Play", session: "Tokyo", confidence: 68, bias: "Bullish" as const },
  { instrument: "AUD/USD", symbol: "AUDUSD", price: "0.6580", change: "-0.0015", changePercent: "-0.23%", signal: "SELL" as const, entry: "0.6590", stopLoss: "0.6630", takeProfit: "0.6520", strategy: "China Slowdown", session: "Sydney", confidence: 65, bias: "Bearish" as const },
  { instrument: "China A50", symbol: "CN50", price: "12,150", change: "+45", changePercent: "+0.37%", signal: "HOLD" as const, entry: "12130", stopLoss: "12050", takeProfit: "12300", strategy: "Range Consolidation", session: "Shanghai", confidence: 52, bias: "Neutral" as const, isPremium: true },
];

const AsiaMarket = () => (
  <MarketPageLayout title="Asia Market Dashboard" description="Nikkei 225, Hang Seng, ASX 200, USD/JPY signals and Asian market intelligence." emoji="🌏">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Asian Indices</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Nikkei 225", val: "39,850", pct: "+0.45%" },
            { name: "Hang Seng", val: "17,420", pct: "-0.49%" },
            { name: "ASX 200", val: "7,890", pct: "+0.28%" },
            { name: "China A50", val: "12,150", pct: "+0.37%" },
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MarketSentimentGauge bullish={54} label="Asia Sentiment" />
      <VolatilityCard label="Asia Volatility" value="18.5" level="Medium" description="Moderate volatility — standard position sizing appropriate." />
    </div>

    <div>
      <h2 className="text-lg font-extrabold text-foreground mb-3">📊 Trading Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ASIA_SIGNALS.map((s) => <MarketSignalCard key={s.symbol} {...s} brokerName="Exness" brokerUrl={EXNESS} />)}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EconomicEventsCard events={[
        { time: "00:30 GMT", currency: "JPY", event: "BOJ Rate Decision", impact: "HIGH" },
        { time: "02:00 GMT", currency: "CNY", event: "China CPI y/y", impact: "HIGH" },
        { time: "00:30 GMT", currency: "AUD", event: "RBA Rate Statement", impact: "HIGH" },
        { time: "01:30 GMT", currency: "JPY", event: "Average Cash Earnings", impact: "MEDIUM" },
        { time: "04:30 GMT", currency: "AUD", event: "Employment Change", impact: "HIGH" },
      ]} />
      <SectorHeatmap sectors={[
        { name: "Technology", change: 0.8 }, { name: "Automotive", change: 0.5 },
        { name: "Banking", change: -0.4 }, { name: "Real Estate", change: -1.2 },
        { name: "Consumer", change: 0.3 }, { name: "Mining", change: 1.1 },
      ]} />
    </div>

    <TradingTipsCard
      title="Asia Market Do's & Don'ts"
      dos={[
        "Trade USD/JPY during Tokyo session (00:00-06:00 GMT) for best JPY liquidity",
        "Watch China data releases — they move AUD, NZD, and copper",
        "Use Nikkei as a leading indicator for European equity opens",
        "Monitor BOJ intervention levels — JPY often reverses sharply at 150-155",
      ]}
      donts={[
        "Don't ignore BOJ verbal intervention — they warn before they act",
        "Don't trade China A50 without understanding capital controls",
        "Avoid AUD/USD when China PMI data is pending",
        "Don't short USD/JPY aggressively — BOJ intervention risk is real",
      ]}
      proTip="When Nikkei futures gap up overnight, European indices (DAX, CAC) tend to follow at their open — use this for early positioning."
    />
  </MarketPageLayout>
);

export default AsiaMarket;
