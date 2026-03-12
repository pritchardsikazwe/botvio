import { MarketPageLayout } from "@/components/markets/MarketPageLayout";
import { MarketSignalCard } from "@/components/markets/MarketSignalCard";
import { MarketSentimentGauge } from "@/components/markets/MarketSentimentGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BINANCE = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU";

const CRYPTO_SIGNALS = [
  { instrument: "Bitcoin", symbol: "BTCUSD", price: "72,100", change: "+1,250", changePercent: "+1.76%", signal: "BUY" as const, entry: "71800", stopLoss: "70200", takeProfit: "74500", strategy: "Halving Momentum", session: "24/7", confidence: 84, bias: "Bullish" as const },
  { instrument: "Ethereum", symbol: "ETHUSD", price: "3,820", change: "+65", changePercent: "+1.73%", signal: "BUY" as const, entry: "3800", stopLoss: "3700", takeProfit: "4000", strategy: "ETF Flow Breakout", session: "24/7", confidence: 79, bias: "Bullish" as const },
  { instrument: "Solana", symbol: "SOLUSD", price: "185.40", change: "+8.20", changePercent: "+4.63%", signal: "BUY" as const, entry: "183.00", stopLoss: "175.00", takeProfit: "200.00", strategy: "Meme Season Momentum", session: "24/7", confidence: 72, bias: "Bullish" as const },
  { instrument: "BNB", symbol: "BNBUSD", price: "620.50", change: "+12.0", changePercent: "+1.97%", signal: "BUY" as const, entry: "618.00", stopLoss: "600.00", takeProfit: "650.00", strategy: "Exchange Token Play", session: "24/7", confidence: 70, bias: "Bullish" as const },
  { instrument: "XRP", symbol: "XRPUSD", price: "0.6280", change: "-0.012", changePercent: "-1.88%", signal: "SELL" as const, entry: "0.6300", stopLoss: "0.6450", takeProfit: "0.6050", strategy: "Legal Uncertainty", session: "24/7", confidence: 63, bias: "Bearish" as const },
  { instrument: "Cardano", symbol: "ADAUSD", price: "0.4850", change: "+0.015", changePercent: "+3.19%", signal: "HOLD" as const, entry: "0.4800", stopLoss: "0.4600", takeProfit: "0.5200", strategy: "Accumulation Zone", session: "24/7", confidence: 58, bias: "Neutral" as const, isPremium: true },
];

const CryptoMarket = () => (
  <MarketPageLayout title="Crypto Market Dashboard" description="Bitcoin, Ethereum, Solana, BNB trading signals and crypto market intelligence." emoji="₿">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Crypto Overview</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Bitcoin", val: "$72,100", pct: "+1.76%" },
            { name: "Ethereum", val: "$3,820", pct: "+1.73%" },
            { name: "Total Market Cap", val: "$2.68T", pct: "+1.45%" },
            { name: "BTC Dominance", val: "52.3%", pct: "+0.12%" },
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

    {/* Fear & Greed */}
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Fear & Greed Index</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-extrabold text-success">72</div>
          <div>
            <p className="font-bold text-success text-sm">Greed</p>
            <p className="text-xs text-muted-foreground">Market is showing greed — potential overextension</p>
          </div>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-destructive via-warning to-success rounded-full" style={{ width: "72%" }} />
        </div>
      </CardContent>
    </Card>

    <MarketSentimentGauge bullish={68} label="Crypto Sentiment" />

    <div>
      <h2 className="text-lg font-extrabold text-foreground mb-3">📊 Trading Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CRYPTO_SIGNALS.map((s) => <MarketSignalCard key={s.symbol} {...s} brokerName="Binance" brokerUrl={BINANCE} />)}
      </div>
    </div>
  </MarketPageLayout>
);

export default CryptoMarket;
