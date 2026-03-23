import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight, Globe, Activity, Shield, Flame, BarChart3, Zap, Clock, Eye, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

const REGIONS = [
  { emoji: "🇺🇸", name: "U.S. Market", path: "/markets/us", desc: "S&P 500, Nasdaq, Dow, Gold, Oil", indices: ["SPX +0.42%", "NAS +0.68%", "DJI -0.15%"], sentiment: 64, session: "NY Open", trend: "Bullish" },
  { emoji: "🇪🇺", name: "Europe Market", path: "/markets/europe", desc: "DAX, FTSE 100, CAC 40, EUR/USD", indices: ["DAX +0.55%", "FTSE +0.18%", "CAC +0.36%"], sentiment: 58, session: "London", trend: "Mixed" },
  { emoji: "🇸🇦", name: "Middle East", path: "/markets/middle-east", desc: "Tadawul, DFM, Aramco, Al Rajhi", indices: ["TASI +0.60%", "DFM +0.82%", "OIL +1.45%"], sentiment: 72, session: "Active", trend: "Bullish" },
  { emoji: "🌏", name: "Asia Market", path: "/markets/asia", desc: "Nikkei, Hang Seng, ASX, USD/JPY", indices: ["NKY +0.38%", "HSI -0.32%", "ASX +0.24%"], sentiment: 53, session: "Closed", trend: "Cautious" },
  { emoji: "₿", name: "Crypto Market", path: "/markets/crypto", desc: "Bitcoin, Ethereum, Solana, BNB", indices: ["BTC +2.14%", "ETH +1.85%", "SOL +5.20%"], sentiment: 70, session: "24/7", trend: "Bullish" },
  { emoji: "🌍", name: "Africa Market", path: "/markets/africa", desc: "JSE, NGX, LuSE — SA, Nigeria, Zambia", indices: ["JSE +0.72%", "NGX +1.25%", "LuSE +0.38%"], sentiment: 65, session: "Active", trend: "Bullish" },
];

const LIVE_MARKET_DATA = [
  { symbol: "XAU/USD", price: "3,024.50", change: "+0.82%", dir: "up" },
  { symbol: "EUR/USD", price: "1.0842", change: "-0.15%", dir: "down" },
  { symbol: "BTC/USD", price: "87,420", change: "+2.14%", dir: "up" },
  { symbol: "US30", price: "42,185", change: "+0.31%", dir: "up" },
  { symbol: "GBP/USD", price: "1.2938", change: "+0.22%", dir: "up" },
  { symbol: "OIL", price: "69.85", change: "+1.45%", dir: "up" },
  { symbol: "NAS100", price: "18,520", change: "+0.68%", dir: "up" },
  { symbol: "USD/JPY", price: "149.65", change: "-0.18%", dir: "down" },
];

const GlobalMarkets = () => {
  const { isBasicOrAbove, isLoading } = useSubscriptionGate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Global Market Intelligence — Week of Mar 24-28 | Botvio" description="US, Europe, Middle East, Asia, Crypto & Africa market signals, analysis & trading intelligence." />
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Global Market Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">Week of Mar 24-28, 2026 • Core PCE Friday • Q1 End Flows</p>
        </div>

        {/* Live Ticker Strip */}
        <div className="overflow-x-auto animate-fade-in">
          <div className="flex gap-2 min-w-max pb-2">
            {LIVE_MARKET_DATA.map((m) => (
              <div key={m.symbol} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${m.dir === "up" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                <span className="font-bold text-foreground">{m.symbol}</span>
                <span className="font-mono text-foreground">{m.price}</span>
                <span className={`font-bold ${m.dir === "up" ? "text-success" : "text-destructive"}`}>
                  {m.dir === "up" ? <TrendingUp className="h-3 w-3 inline mr-0.5" /> : <TrendingDown className="h-3 w-3 inline mr-0.5" />}
                  {m.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Risk Pulse */}
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <h2 className="text-sm font-extrabold text-foreground mb-3">🌐 Global Risk Pulse</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {REGIONS.map((r) => (
                <div key={r.path} className={`p-2 rounded text-center text-xs font-bold ${r.sentiment > 65 ? "bg-success/10 text-success" : r.sentiment > 55 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <span className="text-lg">{r.emoji}</span>
                  <p className="mt-1">{r.trend}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{r.session}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* This Week's Focus */}
        <Card className="border-primary/30 animate-fade-in">
          <CardContent className="p-4">
            <h2 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> 🔥 This Week's Market Focus
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Core PCE Friday", desc: "Fed's preferred inflation gauge — THE event of the week. All USD pairs + Gold.", badge: "HIGH", color: "border-destructive/30" },
                { title: "US GDP Thursday", desc: "Final Q4 revision. Confirms economic strength or weakness.", badge: "HIGH", color: "border-warning/30" },
                { title: "UK CPI Tuesday", desc: "BOE rate path depends on this. GBP/USD key mover.", badge: "HIGH", color: "border-primary/30" },
                { title: "Q1 End Flows", desc: "Quarter-end rebalancing = erratic moves. Be cautious Thursday-Friday.", badge: "CAUTION", color: "border-warning/30" },
              ].map((f, i) => (
                <div key={i} className={`rounded-lg border ${f.color} p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{f.title}</span>
                    <Badge variant="outline" className="text-[9px]">{f.badge}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {!isBasicOrAbove && !isLoading ? (
          <UpgradePrompt feature="Global Market Intelligence" requiredPlan="Basic" />
        ) : (
          <>
            {/* Cross-Market Correlations */}
            <Card className="animate-fade-in">
              <CardContent className="p-4">
                <h2 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-warning" /> Cross-Market Correlations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { trigger: "Oil ↑", effect: "Saudi / NGX positive, CAD strengthens, NOK rallies" },
                    { trigger: "Gold ↑", effect: "JSE miners positive, USD weakens, risk-off signal" },
                    { trigger: "DXY ↑", effect: "EM equities pressured, commodities fall, Gold drops" },
                    { trigger: "VIX ↑", effect: "Risk-off: equities sell, bonds/gold rally, JPY strengthens" },
                    { trigger: "US Yields ↑", effect: "USD strengthens, gold pressured, EM currencies weaken" },
                    { trigger: "BTC ↑", effect: "Risk-on signal, positive for Nasdaq, ETH follows" },
                    { trigger: "PCE Hot ↑", effect: "USD rallies, Gold drops, rate cut bets shrink" },
                    { trigger: "GDP Miss ↓", effect: "Risk-off, equities sell, bonds rally, USD mixed" },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
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
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {r.session}</span>
                        <Badge variant="outline" className={`text-[9px] ${r.trend === "Bullish" ? "text-success border-success/30" : r.trend === "Mixed" ? "text-warning border-warning/30" : "text-muted-foreground"}`}>
                          {r.trend}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Sentiment</span>
                          <span className={`font-bold ${r.sentiment > 60 ? "text-success" : "text-muted-foreground"}`}>{r.sentiment}% Bullish</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${r.sentiment}%` }} />
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

            {/* Binary Options OTC Markets */}
            <Card className="border-warning/30 animate-fade-in">
              <CardContent className="p-4">
                <h2 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" /> 🎯 Binary Options — Live OTC Markets
                </h2>
                <p className="text-xs text-muted-foreground mb-3">OTC assets available 24/7 across Pocket Option, IQ Option, and Binomo — even when main markets are closed.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pocket Option */}
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔵</span>
                      <h3 className="font-bold text-foreground text-sm">Pocket Option OTC</h3>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { pair: "EUR/USD OTC", payout: "92%", trend: "↑ Bullish" },
                        { pair: "GBP/USD OTC", payout: "90%", trend: "↓ Bearish" },
                        { pair: "USD/JPY OTC", payout: "88%", trend: "→ Ranging" },
                        { pair: "AUD/CAD OTC", payout: "85%", trend: "↑ Bullish" },
                        { pair: "EUR/GBP OTC", payout: "87%", trend: "↓ Bearish" },
                        { pair: "NZD/USD OTC", payout: "84%", trend: "→ Ranging" },
                      ].map(p => (
                        <div key={p.pair} className="flex items-center justify-between text-xs p-1.5 rounded bg-background/50">
                          <span className="font-semibold text-foreground">{p.pair}</span>
                          <span className="text-success font-bold">{p.payout}</span>
                          <span className="text-muted-foreground text-[10px]">{p.trend}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full text-xs" asChild>
                      <Link to="/binary-options">View Signals <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </div>

                  {/* IQ Option */}
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟡</span>
                      <h3 className="font-bold text-foreground text-sm">IQ Option OTC</h3>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { pair: "EUR/USD OTC", payout: "95%", trend: "↑ Bullish" },
                        { pair: "GBP/JPY OTC", payout: "90%", trend: "↑ Bullish" },
                        { pair: "USD/CHF OTC", payout: "88%", trend: "↓ Bearish" },
                        { pair: "AUD/USD OTC", payout: "87%", trend: "→ Ranging" },
                        { pair: "EUR/JPY OTC", payout: "91%", trend: "↑ Bullish" },
                        { pair: "GBP/CAD OTC", payout: "86%", trend: "↓ Bearish" },
                      ].map(p => (
                        <div key={p.pair} className="flex items-center justify-between text-xs p-1.5 rounded bg-background/50">
                          <span className="font-semibold text-foreground">{p.pair}</span>
                          <span className="text-success font-bold">{p.payout}</span>
                          <span className="text-muted-foreground text-[10px]">{p.trend}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full text-xs" asChild>
                      <Link to="/binary-options">View Signals <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </div>

                  {/* Binomo */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟣</span>
                      <h3 className="font-bold text-foreground text-sm">Binomo OTC</h3>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { pair: "EUR/USD OTC", payout: "90%", trend: "↑ Bullish" },
                        { pair: "GBP/USD OTC", payout: "87%", trend: "→ Ranging" },
                        { pair: "USD/JPY OTC", payout: "85%", trend: "↓ Bearish" },
                        { pair: "AUD/USD OTC", payout: "83%", trend: "↑ Bullish" },
                        { pair: "Crypto OTC", payout: "80%", trend: "↑ Bullish" },
                        { pair: "Commodities OTC", payout: "82%", trend: "→ Ranging" },
                      ].map(p => (
                        <div key={p.pair} className="flex items-center justify-between text-xs p-1.5 rounded bg-background/50">
                          <span className="font-semibold text-foreground">{p.pair}</span>
                          <span className="text-success font-bold">{p.payout}</span>
                          <span className="text-muted-foreground text-[10px]">{p.trend}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full text-xs" asChild>
                      <Link to="/binary-options">View Signals <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opportunity Radar */}
            <Card className="border-primary/30 animate-fade-in">
              <CardContent className="p-4">
                <h2 className="text-sm font-extrabold text-foreground mb-3">🎯 Opportunity Radar — Top Trades This Week</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { name: "Gold", dir: "BUY", c: "87%", reason: "Safe-haven + PCE play" },
                    { name: "Nasdaq", dir: "BUY", c: "82%", reason: "Tech momentum strong" },
                    { name: "GBP/USD", dir: "BUY", c: "78%", reason: "If UK CPI hot" },
                    { name: "EUR/USD", dir: "SELL", c: "71%", reason: "Weak German data" },
                    { name: "Bitcoin", dir: "BUY", c: "85%", reason: "Risk-on continuation" },
                  ].map((t) => (
                    <div key={t.name} className={`p-3 rounded-lg text-center ${t.dir === "BUY" ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
                      <p className="font-bold text-foreground text-sm">{t.name}</p>
                      <p className={`text-xs font-extrabold ${t.dir === "BUY" ? "text-success" : "text-destructive"}`}>{t.dir}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Conf: {t.c}</p>
                      <p className="text-[9px] text-muted-foreground">{t.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Global Trading Tips */}
            <TradingTipsCard
              title="Global Market Do's & Don'ts — This Week"
              dos={[
                "Focus on Core PCE Friday — it's THE event of the week",
                "Use Mon-Wed to set directional bias based on PMI + CPI data",
                "Check cross-market correlations before every trade",
                "Trade during peak London/NY overlap for best liquidity",
                "Close positions before weekend — Q1 end flows are unpredictable",
              ]}
              donts={[
                "Don't hold large positions through Thursday GDP + Friday PCE",
                "Don't ignore UK CPI Tuesday — GBP pairs will move sharply",
                "Avoid trading illiquid markets during off-hours this week",
                "Don't assume Q1 end flows are directional — they're often chaotic",
                "Never risk more than 1-2% on a single news-driven trade",
              ]}
              proTip="This week is all about Friday Core PCE. Everything before that is positioning. Keep risk tight Mon-Thu and save capital for the main event."
            />
          </>
        )}
      </main>
    </div>
  );
};

export default GlobalMarkets;
