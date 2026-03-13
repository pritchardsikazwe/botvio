import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Globe, Activity, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

const REGIONS = [
  { emoji: "🇺🇸", name: "U.S. Market", path: "/markets/us", desc: "S&P 500, Nasdaq, Dow, Gold, Oil", indices: ["SPX +0.31%", "NAS +0.16%", "DJI -0.20%"], sentiment: 62 },
  { emoji: "🇪🇺", name: "Europe Market", path: "/markets/europe", desc: "DAX, FTSE 100, CAC 40, EUR/USD", indices: ["DAX +0.50%", "FTSE -0.22%", "CAC +0.32%"], sentiment: 58 },
  { emoji: "🇸🇦", name: "Middle East", path: "/markets/middle-east", desc: "Tadawul, DFM, Aramco, Al Rajhi", indices: ["TASI +0.45%", "DFM +0.75%", "OIL +1.26%"], sentiment: 71 },
  { emoji: "🌏", name: "Asia Market", path: "/markets/asia", desc: "Nikkei, Hang Seng, ASX, USD/JPY", indices: ["NKY +0.45%", "HSI -0.49%", "ASX +0.28%"], sentiment: 54 },
  { emoji: "₿", name: "Crypto Market", path: "/markets/crypto", desc: "Bitcoin, Ethereum, Solana, BNB", indices: ["BTC +1.76%", "ETH +1.73%", "SOL +4.63%"], sentiment: 68 },
  { emoji: "🌍", name: "Africa Market", path: "/markets/africa", desc: "JSE, NGX, LuSE — SA, Nigeria, Zambia", indices: ["JSE +0.65%", "NGX +1.10%", "LuSE +0.40%"], sentiment: 64 },
];

const GlobalMarkets = () => {
  const { isBasicOrAbove, isLoading } = useSubscriptionGate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Global Market Intelligence Dashboard" description="US, Europe, Middle East, Asia, Crypto & Africa market signals, analysis & trading intelligence." />
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Global Market Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">Quick market intelligence • Actionable trading signals • One-click chart analysis</p>
        </div>

        {/* Global Risk Pulse — always visible */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-extrabold text-foreground mb-3">🌐 Global Risk Pulse</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {REGIONS.map((r) => (
                <div key={r.path} className={`p-2 rounded text-center text-xs font-bold ${r.sentiment > 65 ? "bg-success/10 text-success" : r.sentiment > 55 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <span className="text-lg">{r.emoji}</span>
                  <p className="mt-1">{r.sentiment > 65 ? "Bullish" : r.sentiment > 55 ? "Mixed" : "Cautious"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gated content */}
        {!isBasicOrAbove && !isLoading ? (
          <UpgradePrompt feature="Global Market Intelligence" requiredPlan="Basic" />
        ) : (
          <>
            {/* Cross-Market Correlation */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-warning" /> Cross-Market Correlations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { trigger: "Oil ↑", effect: "Saudi / NGX positive, CAD strengthens" },
                    { trigger: "Gold ↑", effect: "JSE miners positive, USD weakens" },
                    { trigger: "DXY ↑", effect: "EM equities pressured, commodities down" },
                    { trigger: "VIX ↑", effect: "Risk-off: equities sell, bonds/gold rally" },
                    { trigger: "US Yields ↑", effect: "USD strengthens, gold/EM pressured" },
                    { trigger: "BTC ↑", effect: "Risk-on signal, positive for Nasdaq" },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs p-2 rounded bg-secondary/50">
                      <span className="font-bold text-primary w-24 shrink-0">{c.trigger}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{c.effect}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Region Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REGIONS.map((r) => (
                <Link key={r.path} to={r.path} className="block">
                  <Card className="h-full hover:border-primary/50 hover:scale-[1.02] transition-all cursor-pointer">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{r.emoji}</span>
                        <div>
                          <h3 className="font-extrabold text-foreground">{r.name}</h3>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.indices.map((idx) => {
                          const isPos = idx.includes("+");
                          return (
                            <Badge key={idx} variant="outline" className={`text-[10px] font-mono ${isPos ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
                              {idx}
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Sentiment</span>
                          <span className={`font-bold ${r.sentiment > 60 ? "text-success" : "text-muted-foreground"}`}>{r.sentiment}% Bullish</span>
                        </div>
                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: `${r.sentiment}%` }} />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        View Dashboard <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Opportunity Radar */}
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <h2 className="text-sm font-extrabold text-foreground mb-3">🎯 Opportunity Radar — Top 5 Trades Now</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { name: "Gold", dir: "BUY", c: "85%" },
                    { name: "Nasdaq", dir: "BUY", c: "82%" },
                    { name: "Aramco", dir: "BUY", c: "81%" },
                    { name: "EUR/USD", dir: "SELL", c: "69%" },
                    { name: "Bitcoin", dir: "BUY", c: "84%" },
                  ].map((t) => (
                    <div key={t.name} className={`p-3 rounded-lg text-center ${t.dir === "BUY" ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
                      <p className="font-bold text-foreground text-sm">{t.name}</p>
                      <p className={`text-xs font-extrabold ${t.dir === "BUY" ? "text-success" : "text-destructive"}`}>{t.dir}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Conf: {t.c}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Global Trading Tips */}
            <TradingTipsCard
              title="Global Market Do's & Don'ts"
              dos={[
                "Diversify across regions — don't put everything in one market",
                "Check cross-market correlations before entering trades",
                "Trade during peak session hours for best liquidity",
                "Always check the economic calendar before market open",
              ]}
              donts={[
                "Don't ignore currency risk when trading foreign markets",
                "Don't assume one market's trend applies to all regions",
                "Avoid trading illiquid markets during off-hours",
                "Never ignore geopolitical risks in emerging markets",
              ]}
              proTip="The best global traders focus on 2-3 markets they understand deeply rather than spreading thin across all regions."
            />
          </>
        )}
      </main>
    </div>
  );
};

export default GlobalMarkets;
