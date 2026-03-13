import { MarketPageLayout } from "@/components/markets/MarketPageLayout";
import { MarketSignalCard } from "@/components/markets/MarketSignalCard";
import { MarketSentimentGauge } from "@/components/markets/MarketSentimentGauge";
import { EconomicEventsCard } from "@/components/markets/EconomicEventsCard";
import { SectorHeatmap } from "@/components/markets/SectorHeatmap";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import { InstitutionalFlowCard } from "@/components/markets/InstitutionalFlowCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EXNESS = "https://one.exness-track.com/a/ts1kvs1k";

const ME_SIGNALS = [
  { instrument: "Tadawul (TASI)", symbol: "TASI", price: "12,420", change: "+55.0", changePercent: "+0.45%", signal: "BUY" as const, entry: "12400", stopLoss: "12300", takeProfit: "12600", strategy: "Oil Momentum", session: "Riyadh", confidence: 79, bias: "Bullish" as const },
  { instrument: "Saudi Aramco", symbol: "2222.SR", price: "32.80", change: "+0.40", changePercent: "+1.23%", signal: "BUY" as const, entry: "32.60", stopLoss: "31.90", takeProfit: "34.20", strategy: "Oil Momentum Breakout", session: "Riyadh", confidence: 81, bias: "Bullish" as const },
  { instrument: "Al Rajhi Bank", symbol: "1120.SR", price: "98.50", change: "+1.20", changePercent: "+1.23%", signal: "BUY" as const, entry: "98.00", stopLoss: "96.50", takeProfit: "101.00", strategy: "Banking Momentum", session: "Riyadh", confidence: 76, bias: "Bullish" as const },
  { instrument: "DFM Index", symbol: "DFM", price: "4,260", change: "+32.0", changePercent: "+0.75%", signal: "BUY" as const, entry: "4240", stopLoss: "4200", takeProfit: "4320", strategy: "Opening Range Breakout", session: "Dubai", confidence: 74, bias: "Bullish" as const },
  { instrument: "Emaar Properties", symbol: "EMAAR", price: "7.45", change: "+0.12", changePercent: "+1.64%", signal: "BUY" as const, entry: "7.40", stopLoss: "7.20", takeProfit: "7.90", strategy: "Real Estate Momentum", session: "Dubai", confidence: 72, bias: "Bullish" as const },
  { instrument: "ACWA Power", symbol: "2082.SR", price: "185.00", change: "+3.50", changePercent: "+1.93%", signal: "BUY" as const, entry: "183.50", stopLoss: "179.00", takeProfit: "192.00", strategy: "Vision 2030 Growth", session: "Riyadh", confidence: 77, bias: "Bullish" as const, isPremium: true },
];

const MiddleEastMarket = () => (
  <MarketPageLayout title="Middle East Market Dashboard" description="Saudi Tadawul, Dubai DFM, Aramco, Al Rajhi trading signals. Foreign investors now welcome." emoji="🇸🇦">
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <h3 className="font-extrabold text-foreground text-sm">Saudi Market Now Open to All Foreign Investors</h3>
            <p className="text-xs text-muted-foreground mt-1">As of Feb 1, 2026, Saudi Arabia abolished QFI restrictions. All foreign investors can now trade directly on Tadawul — the largest exchange in the Middle East (market cap &gt; $2.5T).</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">Vision 2030</Badge>
              <Badge variant="outline" className="text-[10px]">Energy</Badge>
              <Badge variant="outline" className="text-[10px]">Banking</Badge>
              <Badge variant="outline" className="text-[10px]">Real Estate</Badge>
              <Badge variant="outline" className="text-[10px]">Renewables</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Market Overview</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Tadawul (TASI)", val: "12,420", pct: "+0.45%" },
            { name: "DFM Index", val: "4,260", pct: "+0.75%" },
            { name: "ADX Index", val: "9,380", pct: "+0.30%" },
            { name: "Brent Oil", val: "$84.20", pct: "+1.26%" },
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

    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">🛢️ Oil Market Impact</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded bg-success/10">
            <p className="text-[10px] text-muted-foreground">Brent Oil</p>
            <p className="font-extrabold text-foreground font-mono">$84.20</p>
          </div>
          <div className="p-2 rounded bg-success/10">
            <p className="text-[10px] text-muted-foreground">Impact</p>
            <p className="font-bold text-success text-sm">Bullish</p>
          </div>
          <div className="p-2 rounded bg-secondary/50">
            <p className="text-[10px] text-muted-foreground">Top Beneficiaries</p>
            <p className="font-bold text-foreground text-xs">Aramco, SABIC</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <MarketSentimentGauge bullish={71} label="Middle East Sentiment" />

    <div>
      <h2 className="text-lg font-extrabold text-foreground mb-3">📊 Trading Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ME_SIGNALS.map((s) => <MarketSignalCard key={s.symbol} {...s} brokerName="Exness" brokerUrl={EXNESS} />)}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InstitutionalFlowCard
        title="Saudi Institutional Flow"
        flows={[
          { label: "Foreign Investors", value: "+120M SAR", direction: "in" },
          { label: "Local Institutions", value: "+85M SAR", direction: "in" },
          { label: "Retail", value: "-60M SAR", direction: "out" },
        ]}
        bias="Institutional Accumulation"
      />
      <EconomicEventsCard events={[
        { time: "12:00 GMT", currency: "SAR", event: "Saudi Interest Rate", impact: "HIGH" },
        { time: "14:00 GMT", currency: "OIL", event: "OPEC Meeting", impact: "HIGH" },
        { time: "10:00 GMT", currency: "AED", event: "UAE GDP Release", impact: "MEDIUM" },
        { time: "08:00 GMT", currency: "SAR", event: "Saudi GDP q/q", impact: "MEDIUM" },
      ]} />
    </div>

    <SectorHeatmap sectors={[
      { name: "Energy", change: 1.8 }, { name: "Banking", change: 1.1 },
      { name: "Real Estate", change: 0.7 }, { name: "Telecom", change: 0.3 },
      { name: "Petrochemicals", change: 1.4 }, { name: "Infrastructure", change: 0.9 },
    ]} />

    <TradingTipsCard
      title="Middle East Market Do's & Don'ts"
      dos={[
        "Always check oil prices before trading Saudi/UAE stocks — 80% correlation",
        "Trade during Riyadh session (07:00-12:00 GMT) for Saudi stocks",
        "Focus on Vision 2030 sectors: renewable energy, tourism, fintech",
        "Watch OPEC meeting dates — they move the entire region",
      ]}
      donts={[
        "Don't ignore SAR currency peg risk (pegged to USD at 3.75)",
        "Don't trade Gulf stocks during Ramadan — reduced hours & volume",
        "Avoid holding through OPEC surprises without a stop loss",
        "Don't assume Dubai = Saudi — different exchanges, different dynamics",
      ]}
      proTip="Saudi Aramco trades like an oil proxy. When Brent breaks above $85, Aramco tends to rally 2-3% in the following week."
    />
  </MarketPageLayout>
);

export default MiddleEastMarket;
