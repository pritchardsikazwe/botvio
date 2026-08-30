import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight, Globe, Activity, Zap, Clock, Sparkles, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { TradingTipsCard } from "@/components/markets/TradingTipsCard";
import { SessionMarketsBlock, type SessionInstrument } from "@/components/markets/SessionMarketsBlock";

// Determine if a market is currently open based on UTC day/hour
type RegionKey = "us" | "europe" | "middleEast" | "asia" | "crypto" | "africa";

function getMarketStatus(key: RegionKey): { isOpen: boolean; session: string } {
  const now = new Date();
  const day = now.getUTCDay(); // 0 Sun – 6 Sat
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const isWeekday = day >= 1 && day <= 5;

  switch (key) {
    case "us":
      // NYSE 13:30–20:00 UTC
      return { isOpen: isWeekday && hour >= 13.5 && hour < 20, session: isWeekday && hour >= 13.5 && hour < 20 ? "NY Open" : "NY Closed" };
    case "europe":
      // LSE / Euronext 07:00–15:30 UTC
      return { isOpen: isWeekday && hour >= 7 && hour < 15.5, session: isWeekday && hour >= 7 && hour < 15.5 ? "London Open" : "London Closed" };
    case "middleEast":
      // Tadawul Sun–Thu 07:00–12:00 UTC
      const meDay = day >= 0 && day <= 4;
      return { isOpen: meDay && hour >= 7 && hour < 12, session: meDay && hour >= 7 && hour < 12 ? "Riyadh Open" : "Riyadh Closed" };
    case "asia":
      // Tokyo 00:00–06:00 UTC
      return { isOpen: isWeekday && hour >= 0 && hour < 6, session: isWeekday && hour >= 0 && hour < 6 ? "Tokyo Open" : "Tokyo Closed" };
    case "crypto":
      return { isOpen: true, session: "24/7" };
    case "africa":
      // JSE 07:00–15:00 UTC
      return { isOpen: isWeekday && hour >= 7 && hour < 15, session: isWeekday && hour >= 7 && hour < 15 ? "JSE Open" : "JSE Closed" };
  }
}

const BASE_REGIONS: Array<{ key: RegionKey; emoji: string; name: string; path: string; desc: string; indices: string[]; sentiment: number; trend: string }> = [
  { key: "us", emoji: "🇺🇸", name: "U.S. Market", path: "/markets/us", desc: "S&P 500, Nasdaq, Dow, Gold, Oil", indices: ["SPX +0.58%", "NAS +0.92%", "DJI +0.27%"], sentiment: 62, trend: "Bullish" },
  { key: "europe", emoji: "🇪🇺", name: "Europe Market", path: "/markets/europe", desc: "DAX, FTSE 100, CAC 40, EUR/USD", indices: ["DAX +0.34%", "FTSE -0.12%", "CAC +0.48%"], sentiment: 55, trend: "Mixed" },
  { key: "middleEast", emoji: "🇸🇦", name: "Middle East", path: "/markets/middle-east", desc: "Tadawul, DFM, Aramco, Al Rajhi", indices: ["TASI +0.75%", "DFM +0.90%", "OIL -0.85%"], sentiment: 68, trend: "Bullish" },
  { key: "asia", emoji: "🌏", name: "Asia Market", path: "/markets/asia", desc: "Nikkei, Hang Seng, ASX, USD/JPY", indices: ["NKY -0.45%", "HSI +0.22%", "ASX +0.35%"], sentiment: 50, trend: "Cautious" },
  { key: "crypto", emoji: "₿", name: "Crypto Market", path: "/markets/crypto", desc: "Bitcoin, Ethereum, Solana, BNB", indices: ["BTC +3.20%", "ETH +2.45%", "SOL +6.10%"], sentiment: 74, trend: "Bullish" },
  { key: "africa", emoji: "🌍", name: "Africa Market", path: "/markets/africa", desc: "JSE, NGX, LuSE — SA, Nigeria, Zambia", indices: ["JSE +0.85%", "NGX +1.40%", "LuSE +0.55%"], sentiment: 67, trend: "Bullish" },
];

const REGIONS = BASE_REGIONS.map((r) => {
  const status = getMarketStatus(r.key);
  return { ...r, isOpen: status.isOpen, session: status.session };
});

const LIVE_MARKET_DATA = [
  { symbol: "XAU/USD", price: "3,085.20", change: "+1.15%", dir: "up" },
  { symbol: "EUR/USD", price: "1.0918", change: "+0.28%", dir: "up" },
  { symbol: "BTC/USD", price: "91,250", change: "+3.20%", dir: "up" },
  { symbol: "US30", price: "42,540", change: "+0.27%", dir: "up" },
  { symbol: "GBP/USD", price: "1.3012", change: "+0.35%", dir: "up" },
  { symbol: "OIL", price: "67.45", change: "-0.85%", dir: "down" },
  { symbol: "NAS100", price: "18,890", change: "+0.92%", dir: "up" },
  { symbol: "USD/JPY", price: "148.20", change: "-0.42%", dir: "down" },
];

// ── New York session instruments (NYSE / NASDAQ-listed mega-caps + Gold) ──
const NY_INSTRUMENTS: SessionInstrument[] = [
  {
    tvSymbol: "NASDAQ:NDX",
    label: "NASDAQ 100",
    symbolBadge: "NAS100",
    outlook: {
      market: "NASDAQ 100",
      emoji: "💻",
      bias: "Bullish",
      bestSession: "NY 13:30–20:00 UTC",
      technical: "Price above EMA20 & EMA50 on 1H, RSI 58 (room to run). Higher highs / higher lows structure intact above 22,500 swing-low. MACD histogram expanding bullish.",
      fundamental: "Strong Q2 tech earnings momentum (NVDA, AAPL, MSFT). Falling 10Y yields support growth multiples. Watch CPI Wednesday — soft print = breakout fuel.",
      hauza: "Breakout Momentum: long on close > 22,800 with retest entry. Stop below 22,640. TP1 22,920 / TP2 23,150 (1:2 R:R). Skip if VIX > 22.",
      levels: [
        { label: "Support", value: "22,640" },
        { label: "Pivot", value: "22,733" },
        { label: "Resistance", value: "22,920" },
      ],
      newTraderTip: "Don't chase the open. Wait for the first 30-min candle (13:30–14:00 UTC) to close, then trade in its direction with a 1:2 risk-reward.",
    },
  },
  {
    tvSymbol: "SP:SPX",
    label: "S&P 500",
    symbolBadge: "SPX500",
    outlook: {
      market: "S&P 500",
      emoji: "🇺🇸",
      bias: "Bullish",
      bestSession: "NY 13:30–20:00 UTC",
      technical: "5,830 holding as dynamic support (rising 20-EMA). RSI 56, no divergence. Bullish flag breakout above 5,855 opens 5,890.",
      fundamental: "Banks beat estimates, financials leading rally. Fed rate-cut bets at 70% for June. Lower DXY supports multi-nationals' earnings translation.",
      hauza: "Trend Continuation: long pullbacks to 5,830 with 20-EMA confluence. Stop 5,805. TP 5,890. Avoid holding through 14:30 CPI release.",
      levels: [
        { label: "Support", value: "5,830" },
        { label: "Pivot", value: "5,842" },
        { label: "Resistance", value: "5,890" },
      ],
      newTraderTip: "S&P leads global sentiment — when SPX is bullish, EM equities (JSE, NGX) usually follow within 24h. Use SPX as your overall risk gauge.",
    },
  },
  {
    tvSymbol: "OANDA:XAUUSD",
    label: "Gold",
    symbolBadge: "XAU/USD",
    outlook: {
      market: "Gold (XAU/USD)",
      emoji: "🥇",
      bias: "Bullish",
      bestSession: "London/NY Overlap 13:30–17:00 UTC",
      technical: "Higher lows from 2,335 with EMA20 > EMA50 alignment. RSI 62 — strong but not overbought. Bullish flag targeting 2,375.",
      fundamental: "Geopolitical tensions + Fed dovishness + central bank gold buying = triple tailwind. Soft CPI = explosive upside. Hot CPI = drop to 2,330.",
      hauza: "S/R Bounce: long on rejection at 2,345 zone with bullish wick. Stop 2,330. TP1 2,365 / TP2 2,375. Tighten stops over US data releases.",
      levels: [
        { label: "Support", value: "2,330" },
        { label: "Pivot", value: "2,348" },
        { label: "Resistance", value: "2,375" },
      ],
      newTraderTip: "Gold respects round numbers ($2,300, $2,350, $2,400) more than any other asset. Use them as your primary entry/exit framework.",
    },
  },
];

// ── London session instruments (FTSE / DAX / EUR & GBP majors) ──
const LONDON_INSTRUMENTS: SessionInstrument[] = [
  {
    tvSymbol: "XETR:DAX",
    label: "DAX 40",
    symbolBadge: "GER40",
    outlook: {
      market: "DAX 40",
      emoji: "🇩🇪",
      bias: "Bullish",
      bestSession: "London 07:00–15:30 UTC",
      technical: "Breaking above 18,400 resistance with strong volume. EMA20 sloping up. RSI 64 — momentum confirmed but watch overbought levels.",
      fundamental: "ECB rate cut expectations. German manufacturing PMI improving. Auto sector recovery driving index. Watch ZEW sentiment data.",
      hauza: "Breakout Momentum: enter on retest of 18,400. Stop 18,280. TP1 18,580 / TP2 18,750. Avoid Friday holds — gap risk over weekend.",
      levels: [
        { label: "Support", value: "18,280" },
        { label: "Pivot", value: "18,400" },
        { label: "Resistance", value: "18,580" },
      ],
      newTraderTip: "DAX moves fastest in the first 90 min after London open (07:00–08:30 UTC). Use a 5m chart and trade only the dominant direction.",
    },
  },
  {
    tvSymbol: "OANDA:UK100GBP",
    label: "FTSE 100",
    symbolBadge: "UK100",
    outlook: {
      market: "FTSE 100",
      emoji: "🇬🇧",
      bias: "Neutral",
      bestSession: "London 07:00–15:30 UTC",
      technical: "Range-bound 8,200–8,360. EMA20 flat. RSI 50 — no edge. Wait for clean break + retest before committing capital.",
      fundamental: "BoE on hold, sticky UK inflation. Energy & mining majors tracking oil. Brexit-era trade flows still pressuring growth.",
      hauza: "Range Trading: long 8,200 support / short 8,360 resistance. Stop 30 pts beyond zone. Skip mid-range entries — chop kills capital.",
      levels: [
        { label: "Support", value: "8,200" },
        { label: "Pivot", value: "8,280" },
        { label: "Resistance", value: "8,360" },
      ],
      newTraderTip: "FTSE has the lowest volatility of major Western indices. It's perfect for learning range-bound strategies before tackling NAS100.",
    },
  },
  {
    tvSymbol: "FX:EURUSD",
    label: "EUR/USD",
    symbolBadge: "EURUSD",
    outlook: {
      market: "EUR/USD",
      emoji: "💶",
      bias: "Bullish",
      bestSession: "London/NY Overlap 13:30–17:00 UTC",
      technical: "Bullish reversal off 1.0850 support with bullish engulfing on 4H. EMA20 crossing above EMA50. RSI 56, momentum building.",
      fundamental: "Dovish Fed pivot bets weighing on USD. ECB hawkish hold supportive. Soft US CPI Wednesday could push toward 1.0980.",
      hauza: "MTF Trend Ride: long pullbacks to 1.0900. Stop 1.0870. TP1 1.0960 / TP2 1.0998. Skip during 14:30 US data releases.",
      levels: [
        { label: "Support", value: "1.0870" },
        { label: "Pivot", value: "1.0918" },
        { label: "Resistance", value: "1.0960" },
      ],
      newTraderTip: "EUR/USD is the most-traded pair globally — tight spreads make it ideal for beginners. Always check DXY before entering: DXY ↑ = EUR/USD ↓.",
    },
  },
];

const GlobalMarkets = () => {
  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Global Market Intelligence — Live Forex, Stocks, Crypto & Commodities Signals",
    description:
      "Real-time global market dashboard covering US, Europe, Middle East, Asia, Crypto and Africa. Live indices, sentiment, economic events, AI trading signals and cross-market correlations.",
    keywords: [
      "global market intelligence",
      "live forex signals",
      "US stock market signals",
      "European market analysis",
      "Middle East Tadawul signals",
      "Asia market dashboard",
      "crypto signals BTC ETH",
      "Africa JSE NGX trading",
      "real-time trading signals",
      "AI market intelligence",
      "cross-market correlations",
      "CPI FOMC trading",
      "Botvio signals",
    ].join(", "),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="markets"
        title="Global Market Intelligence — Live Forex, Stocks, Crypto & Commodities Signals"
        description="Real-time market intelligence across US, Europe, Middle East, Asia, Crypto & Africa. Live signals, sentiment, economic events and AI trading insights — free for everyone."
        jsonLd={seoJsonLd}
      />
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <PageBanner
          title="Global Market"
          accent="Intelligence"
          description="Live intelligence across US, Europe, Middle East, Asia, Crypto and Africa — sessions, sentiment, economic events and AI trading insights in one place."
          crumbs={[{ label: "Home", to: "/" }, { label: "Markets" }]}
          features={[
            { icon: Globe, label: "6 regions", sub: "US, EU, ME, Asia, Crypto, Africa" },
            { icon: Activity, label: "Live sessions", sub: "Open/closed status in UTC" },
            { icon: Zap, label: "AI signals", sub: "Botvio AI bias per market" },
            { icon: Clock, label: "Event risk", sub: "High-impact calendar focus" },
          ]}
          stats={REGIONS.slice(0, 4).map((r) => ({
            value: `${r.emoji} ${r.isOpen ? r.trend : "Closed"}`,
            label: `${r.name} • ${r.session}`,
          }))}
        />


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
                <div key={r.path} className={`relative p-2 rounded text-center text-xs font-bold ${!r.isOpen ? "bg-muted/60 text-muted-foreground opacity-70" : r.sentiment > 65 ? "bg-success/10 text-success" : r.sentiment > 55 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <span className="text-lg">{r.emoji}</span>
                  <p className="mt-1">{r.isOpen ? r.trend : "Closed"}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center justify-center gap-0.5">
                    {!r.isOpen && <Lock className="h-2.5 w-2.5" />} {r.session}
                  </p>
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
                { title: "US CPI Wednesday", desc: "Consumer inflation — THE key driver for Fed rate expectations. All USD pairs + Gold + Indices.", badge: "HIGH", color: "border-destructive/30" },
                { title: "FOMC Minutes Wed", desc: "Detailed Fed discussion from March meeting. Watch for hawkish/dovish language shifts.", badge: "HIGH", color: "border-warning/30" },
                { title: "PPI Thursday", desc: "Producer price data — leading indicator for CPI trends. Watch for upstream inflation.", badge: "HIGH", color: "border-primary/30" },
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

        {(
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
                    { trigger: "NFP Strong ↑", effect: "USD rallies, equities mixed, Gold pressured" },
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
                        {r.isOpen ? (
                          <Badge variant="outline" className={`text-[9px] ${r.trend === "Bullish" ? "text-success border-success/30" : r.trend === "Mixed" ? "text-warning border-warning/30" : "text-muted-foreground"}`}>
                            {r.trend}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground border-muted-foreground/30 gap-1">
                            <Lock className="h-2.5 w-2.5" /> Market Closed
                          </Badge>
                        )}
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

            {/* ── NEW YORK SESSION — Live TradingView charts + daily outlook ── */}
            <SessionMarketsBlock
              sessionEmoji="🗽"
              sessionName="New York Trading Session"
              sessionHours="13:30 – 20:00 UTC"
              isOpen={REGIONS.find((r) => r.key === "us")?.isOpen ?? false}
              description="Live charts for NASDAQ 100, S&P 500 and Gold with technical + fundamental + Hauza strategy outlooks. Highest liquidity for US equities & metals."
              instruments={NY_INSTRUMENTS}
            />

            {/* ── LONDON SESSION — Live TradingView charts + daily outlook ── */}
            <SessionMarketsBlock
              sessionEmoji="🇬🇧"
              sessionName="London Trading Session"
              sessionHours="07:00 – 15:30 UTC"
              isOpen={REGIONS.find((r) => r.key === "europe")?.isOpen ?? false}
              description="Live charts for DAX 40, FTSE 100 and EUR/USD with technical + fundamental + Hauza strategy outlooks. Best liquidity for European indices & FX majors."
              instruments={LONDON_INSTRUMENTS}
            />

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
                    { name: "Gold", dir: "BUY", c: "89%", reason: "CPI play + safe-haven demand" },
                    { name: "Nasdaq", dir: "BUY", c: "84%", reason: "Tech momentum pre-earnings" },
                    { name: "GBP/USD", dir: "BUY", c: "76%", reason: "USD weakness if CPI soft" },
                    { name: "EUR/USD", dir: "BUY", c: "73%", reason: "Dovish Fed pivot bets rising" },
                    { name: "Bitcoin", dir: "BUY", c: "88%", reason: "Risk-on + ETF inflows strong" },
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
                "Focus on CPI Wednesday — it's THE event of the week",
                "Use FOMC Minutes for clues on June rate decision",
                "Check Gold momentum — safe-haven flows rising with geopolitical tension",
                "Trade during peak London/NY overlap for best liquidity",
                "Position for Q2 earnings season starting next week",
              ]}
              donts={[
                "Don't hold large USD positions through CPI release",
                "Don't ignore PPI Thursday — upstream inflation matters",
                "Avoid overleveraging ahead of FOMC Minutes release",
                "Don't fight the trend if CPI surprises — it moves fast",
                "Never risk more than 1-2% on a single news-driven trade",
              ]}
              proTip="CPI Wednesday is the main event. If inflation comes in soft, expect Gold + Tech rally. If hot, USD rips higher and equities sell. Position Mon-Tue, react Wed-Thu."
            />
          </>
        )}
      </main>
    </div>
  );
};

export default GlobalMarkets;
