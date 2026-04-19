import { MarketPageLayout } from "@/components/markets/MarketPageLayout";
import { MarketSignalCard } from "@/components/markets/MarketSignalCard";
import { MarketSentimentGauge } from "@/components/markets/MarketSentimentGauge";
import { EconomicEventsCard } from "@/components/markets/EconomicEventsCard";
import { SectorHeatmap } from "@/components/markets/SectorHeatmap";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import { InstitutionalFlowCard } from "@/components/markets/InstitutionalFlowCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXNESS = "https://one.exness-track.com/a/ts1kvs1k";

const AFRICA_SIGNALS = [
  { instrument: "JSE Top 40", symbol: "JSE40", price: "74,820", change: "+486", changePercent: "+0.65%", signal: "BUY" as const, entry: "74700", stopLoss: "74100", takeProfit: "75800", strategy: "Mining Momentum", session: "Johannesburg", confidence: 74, bias: "Bullish" as const },
  { instrument: "Anglo American", symbol: "AGL.JO", price: "R560", change: "+8.50", changePercent: "+1.54%", signal: "BUY" as const, entry: "R555", stopLoss: "R540", takeProfit: "R610", strategy: "Commodity Play", session: "Johannesburg", confidence: 78, bias: "Bullish" as const },
  { instrument: "Naspers", symbol: "NPN.JO", price: "R3,450", change: "-25", changePercent: "-0.72%", signal: "SELL" as const, entry: "R3,460", stopLoss: "R3,520", takeProfit: "R3,350", strategy: "Tech Weakness", session: "Johannesburg", confidence: 65, bias: "Bearish" as const },
  { instrument: "NGX All Share", symbol: "NGXASI", price: "102,500", change: "+1,125", changePercent: "+1.10%", signal: "BUY" as const, entry: "102300", stopLoss: "101500", takeProfit: "104000", strategy: "Banking Accumulation", session: "Lagos", confidence: 72, bias: "Bullish" as const },
  { instrument: "Dangote Cement", symbol: "DANGCEM", price: "₦285", change: "+5.50", changePercent: "+1.97%", signal: "BUY" as const, entry: "₦283", stopLoss: "₦275", takeProfit: "₦300", strategy: "Infrastructure Growth", session: "Lagos", confidence: 70, bias: "Bullish" as const },
  { instrument: "LuSE All Share", symbol: "LUSEAS", price: "9,850", change: "+39", changePercent: "+0.40%", signal: "HOLD" as const, entry: "9840", stopLoss: "9750", takeProfit: "10000", strategy: "Copper Correlation", session: "Lusaka", confidence: 58, bias: "Neutral" as const },
];

const AfricaMarket = () => (
  <MarketPageLayout seoKey="marketsAfrica" title="Africa Market Dashboard" description="JSE, NGX, LuSE market signals. South Africa, Nigeria, Zambia stock trading intelligence." emoji="🌍">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">African Exchanges</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "🇿🇦 JSE Top 40", val: "74,820", pct: "+0.65%", desc: "Johannesburg Stock Exchange" },
            { name: "🇳🇬 NGX All Share", val: "102,500", pct: "+1.10%", desc: "Nigerian Exchange" },
            { name: "🇿🇲 LuSE All Share", val: "9,850", pct: "+0.40%", desc: "Lusaka Securities Exchange" },
          ].map((idx) => (
            <div key={idx.name} className="p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-sm font-bold text-foreground">{idx.name}</p>
              <p className="text-xs text-muted-foreground">{idx.desc}</p>
              <p className="text-xl font-extrabold font-mono text-foreground mt-1">{idx.val}</p>
              <p className={`text-xs font-bold ${idx.pct.startsWith("+") ? "text-success" : "text-destructive"}`}>{idx.pct}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">⛏️ Commodity Impact on Africa</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded bg-success/10">
            <p className="text-[10px] text-muted-foreground">Gold</p>
            <p className="font-extrabold text-foreground font-mono">$2,348</p>
            <p className="text-[10px] text-success">Bullish for JSE miners</p>
          </div>
          <div className="p-2 rounded bg-success/10">
            <p className="text-[10px] text-muted-foreground">Copper</p>
            <p className="font-extrabold text-foreground font-mono">$13,304/t</p>
            <p className="text-[10px] text-success">Bullish for LuSE</p>
          </div>
          <div className="p-2 rounded bg-success/10">
            <p className="text-[10px] text-muted-foreground">Brent Oil</p>
            <p className="font-extrabold text-foreground font-mono">$84.20</p>
            <p className="text-[10px] text-success">Positive for NGX</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MarketSentimentGauge bullish={64} label="Africa Market Sentiment" />
      <InstitutionalFlowCard
        title="Cross-Border Flows"
        flows={[
          { label: "Foreign (JSE)", value: "R1.2B", direction: "in" },
          { label: "Foreign (NGX)", value: "₦8.5B", direction: "in" },
          { label: "Local Retail (LuSE)", value: "K12M", direction: "out" },
        ]}
        bias="Net Foreign Inflow"
      />
    </div>

    <div>
      <h2 className="text-lg font-extrabold text-foreground mb-3">📊 Trading Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AFRICA_SIGNALS.map((s) => <MarketSignalCard key={s.symbol} {...s} brokerName="Exness" brokerUrl={EXNESS} />)}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EconomicEventsCard events={[
        { time: "08:00 GMT", currency: "ZAR", event: "SARB Rate Decision", impact: "HIGH" },
        { time: "10:00 GMT", currency: "NGN", event: "CBN Policy Rate", impact: "HIGH" },
        { time: "09:00 GMT", currency: "ZMW", event: "BOZ Rate Decision", impact: "MEDIUM" },
        { time: "08:30 GMT", currency: "ZAR", event: "SA GDP q/q", impact: "HIGH" },
      ]} />
      <SectorHeatmap sectors={[
        { name: "Mining", change: 1.2 }, { name: "Banking", change: 0.8 },
        { name: "Telecom", change: 0.4 }, { name: "Consumer", change: -0.2 },
        { name: "Energy", change: 0.9 }, { name: "Real Estate", change: 0.3 },
      ]} title="Africa Sector Performance" />
    </div>

    <TradingTipsCard
      title="Africa Market Do's & Don'ts"
      dos={[
        "Track commodity prices daily — gold drives JSE, copper drives LuSE, oil drives NGX",
        "Focus on dividend-paying stocks in Zambia (ZCCM, CEC) for steady returns",
        "Watch ZAR strength — weak Rand boosts JSE exporters (miners, Naspers)",
        "Use JSE Top 40 as a proxy for overall African market health",
      ]}
      donts={[
        "Don't trade NGX stocks without understanding Naira FX restrictions",
        "Don't ignore load-shedding risk for South African industrial stocks",
        "Avoid illiquid LuSE stocks — some trade only a few times per week",
        "Don't hold large ZAR positions through SARB announcements without a hedge",
        "Don't assume African markets follow US direction — commodities drive them",
      ]}
      proTip="When gold breaks above a key level, JSE mining stocks (Anglo American, Gold Fields, Sibanye) tend to outperform by 2-5x the percentage move in gold."
    />
  </MarketPageLayout>
);

export default AfricaMarket;
