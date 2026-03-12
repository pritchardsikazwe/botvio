import { MarketPageLayout } from "@/components/markets/MarketPageLayout";
import { MarketSignalCard } from "@/components/markets/MarketSignalCard";
import { MarketSentimentGauge } from "@/components/markets/MarketSentimentGauge";
import { EconomicEventsCard } from "@/components/markets/EconomicEventsCard";
import { SectorHeatmap } from "@/components/markets/SectorHeatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EXNESS = "https://one.exness-track.com/a/ts1kvs1k";

const US_SIGNALS = [
  { instrument: "NASDAQ", symbol: "NAS100", price: "22,733", change: "+36.4", changePercent: "+0.16%", signal: "BUY" as const, entry: "22710", stopLoss: "22640", takeProfit: "22920", strategy: "Tech Momentum Breakout", session: "New York", confidence: 82, bias: "Bullish" as const },
  { instrument: "S&P 500", symbol: "SPX500", price: "5,842", change: "+18.2", changePercent: "+0.31%", signal: "BUY" as const, entry: "5830", stopLoss: "5805", takeProfit: "5890", strategy: "Trend Continuation", session: "New York", confidence: 76, bias: "Bullish" as const },
  { instrument: "Dow Jones", symbol: "US30", price: "42,580", change: "-85.0", changePercent: "-0.20%", signal: "SELL" as const, entry: "42600", stopLoss: "42750", takeProfit: "42300", strategy: "Mean Reversion", session: "New York", confidence: 68, bias: "Bearish" as const },
  { instrument: "Gold", symbol: "XAUUSD", price: "2,348", change: "+12.5", changePercent: "+0.53%", signal: "BUY" as const, entry: "2345", stopLoss: "2330", takeProfit: "2375", strategy: "Support Bounce", session: "London/NY", confidence: 85, bias: "Bullish" as const },
  { instrument: "Crude Oil WTI", symbol: "WTI", price: "84.20", change: "+1.05", changePercent: "+1.26%", signal: "BUY" as const, entry: "83.80", stopLoss: "82.50", takeProfit: "86.00", strategy: "Breakout Strategy", session: "New York", confidence: 72, bias: "Bullish" as const },
  { instrument: "US Dollar Index", symbol: "DXY", price: "99.12", change: "+0.29", changePercent: "+0.29%", signal: "HOLD" as const, entry: "99.00", stopLoss: "98.50", takeProfit: "99.80", strategy: "Range Consolidation", session: "All Sessions", confidence: 55, bias: "Neutral" as const, isPremium: true },
];

const US_EVENTS = [
  { time: "14:30 GMT", currency: "USD", event: "CPI Release", impact: "HIGH" as const },
  { time: "15:00 GMT", currency: "USD", event: "Fed Chair Speech", impact: "HIGH" as const },
  { time: "20:00 GMT", currency: "USD", event: "FOMC Minutes", impact: "HIGH" as const },
  { time: "14:30 GMT", currency: "USD", event: "Retail Sales", impact: "MEDIUM" as const },
];

const US_SECTORS = [
  { name: "Technology", change: 1.3 }, { name: "Energy", change: 0.8 },
  { name: "Banking", change: -0.2 }, { name: "Healthcare", change: 0.5 },
  { name: "Consumer", change: -0.4 }, { name: "Industrials", change: 0.3 },
];

const USMarket = () => (
  <MarketPageLayout title="U.S. Market Dashboard" description="Real-time US market signals, S&P 500, Nasdaq, Dow Jones, Gold & Oil trading intelligence." emoji="🇺🇸">
    {/* Market Overview */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "S&P 500", val: "5,842", pct: "+0.31%" },
            { name: "Nasdaq", val: "22,733", pct: "+0.16%" },
            { name: "Dow Jones", val: "42,580", pct: "-0.20%" },
            { name: "Russell 2000", val: "2,215", pct: "+0.42%" },
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

    {/* Mini Metrics */}
    <div className="grid grid-cols-3 gap-3">
      {[{ l: "VIX", v: "24.74" }, { l: "10Y Yield", v: "4.10%" }, { l: "DXY", v: "99.12" }].map((m) => (
        <Card key={m.l}>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">{m.l}</p>
            <p className="text-lg font-extrabold font-mono text-foreground">{m.v}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <MarketSentimentGauge bullish={62} />

    {/* Signal Cards */}
    <div>
      <h2 className="text-lg font-extrabold text-foreground mb-3">📊 Trading Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {US_SIGNALS.map((s) => (
          <MarketSignalCard key={s.symbol} {...s} brokerName="Exness" brokerUrl={EXNESS}
            metrics={[{ label: "VIX", value: "24.74" }, { label: "DXY", value: "99.12" }]} />
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EconomicEventsCard events={US_EVENTS} title="High Impact Events" />
      <SectorHeatmap sectors={US_SECTORS} />
    </div>
  </MarketPageLayout>
);

export default USMarket;
