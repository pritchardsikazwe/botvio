import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, TrendingUp, Zap, ArrowUpDown, Activity } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { MultiAssetScalpRobot } from "@/components/chart/MultiAssetScalpRobot";
import { AutoTradePanel } from "@/components/trading/AutoTradePanel";

const WELTRADE_LINK = "https://gowt.net/ib67505";

/* ─── Live Charts (standard pairs available on Weltrade) ─── */
interface ChartSymbol {
  label: string;
  tvSymbol: string;
  category: string;
}

const CHART_SYMBOLS: ChartSymbol[] = [
  { label: "XAU/USD", tvSymbol: "OANDA:XAUUSD", category: "Metal" },
  { label: "EUR/USD", tvSymbol: "OANDA:EURUSD", category: "Forex" },
  { label: "GBP/USD", tvSymbol: "OANDA:GBPUSD", category: "Forex" },
  { label: "BTC/USD", tvSymbol: "BITSTAMP:BTCUSD", category: "Crypto" },
  { label: "USD/JPY", tvSymbol: "OANDA:USDJPY", category: "Forex" },
  { label: "GBP/JPY", tvSymbol: "OANDA:GBPJPY", category: "Forex" },
];

function LiveChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "5",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      studies: [
        "MAExp@tv-basicstudies",
        "RSI@tv-basicstudies",
        "BB@tv-basicstudies",
      ],
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container rounded-lg overflow-hidden border border-border/50" style={{ height: 420 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

/* ─── SyntX Index Catalog ─── */
interface SyntxIndex {
  label: string;
  category: "PainX" | "GainX" | "TrendX" | "Specialty";
  description: string;
  volatility: "Extreme" | "High" | "Medium";
  bestFor: string;
}

const SYNTX_INDICES: SyntxIndex[] = [
  { label: "PainX 10", category: "PainX", description: "Low-tier volatility spikes", volatility: "Medium", bestFor: "Beginners, small accounts" },
  { label: "PainX 50", category: "PainX", description: "Mid-tier spike index", volatility: "High", bestFor: "Scalping, quick entries" },
  { label: "PainX 100", category: "PainX", description: "Aggressive spike bursts", volatility: "Extreme", bestFor: "Experienced scalpers" },
  { label: "PainX 200", category: "PainX", description: "Ultra-volatile spikes", volatility: "Extreme", bestFor: "High-risk traders" },
  { label: "GainX 10", category: "GainX", description: "Gentle trending momentum", volatility: "Medium", bestFor: "Swing trading" },
  { label: "GainX 50", category: "GainX", description: "Steady trend moves", volatility: "Medium", bestFor: "Trend following" },
  { label: "GainX 100", category: "GainX", description: "Strong directional moves", volatility: "High", bestFor: "Momentum trading" },
  { label: "TrendX 10", category: "TrendX", description: "Light trend bias index", volatility: "Medium", bestFor: "Breakout setups" },
  { label: "TrendX 50", category: "TrendX", description: "Medium trend bias", volatility: "High", bestFor: "Continuation trades" },
  { label: "FlipX", category: "Specialty", description: "Sudden direction reversals", volatility: "Extreme", bestFor: "Reversal traders" },
  { label: "SwitchX", category: "Specialty", description: "Alternating trend phases", volatility: "High", bestFor: "Range & breakout" },
  { label: "BreakX", category: "Specialty", description: "Consolidation breakouts", volatility: "High", bestFor: "Breakout strategies" },
];

const CATEGORIES = ["All", "PainX", "GainX", "TrendX", "Specialty"] as const;

const volatilityColor: Record<string, string> = {
  Extreme: "text-destructive",
  High: "text-warning",
  Medium: "text-success",
};

export function SyntxChartSection() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeChart, setActiveChart] = useState(0);

  const filtered = activeCategory === "All"
    ? SYNTX_INDICES
    : SYNTX_INDICES.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* ── Live Charts ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Live Charts (Weltrade Markets)
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {CHART_SYMBOLS.map((cs, i) => (
            <Button
              key={i}
              size="sm"
              variant={activeChart === i ? "default" : "outline"}
              className={`text-xs h-7 px-3 font-bold ${activeChart === i ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setActiveChart(i)}
            >
              {cs.label}
              <Badge variant="outline" className="ml-1.5 text-[9px] py-0 px-1">{cs.category}</Badge>
            </Button>
          ))}
        </div>
        <LiveChart symbol={CHART_SYMBOLS[activeChart].tvSymbol} />
        <p className="text-[10px] text-muted-foreground">
          💡 SyntX proprietary indices (PainX, GainX, etc.) are only available on Weltrade's platform. These charts show standard markets also tradeable on Weltrade.
        </p>
      </section>

      {/* ── Botvio Scalp Robot — Currencies (1m / 5m breakouts & S/R breaks) ── */}
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Botvio Scalp Robot — Currencies
        </h3>
        <MultiAssetScalpRobot
          title="Currency Scalp Robot"
          assets={[
            { displaySymbol: "EUR/USD", label: "EUR/USD", emoji: "🇪🇺" },
            { displaySymbol: "GBP/USD", label: "GBP/USD", emoji: "🇬🇧" },
            { displaySymbol: "USD/JPY", label: "USD/JPY", emoji: "🇯🇵" },
            { displaySymbol: "AUD/USD", label: "AUD/USD", emoji: "🇦🇺" },
          ]}
        />

        {/* Auto-Trade Engine — Currencies */}
        <AutoTradePanel
          scope="Currencies"
          availableAssets={[
            { displaySymbol: "EUR/USD", label: "EUR/USD", emoji: "🇪🇺" },
            { displaySymbol: "GBP/USD", label: "GBP/USD", emoji: "🇬🇧" },
            { displaySymbol: "USD/JPY", label: "USD/JPY", emoji: "🇯🇵" },
            { displaySymbol: "AUD/USD", label: "AUD/USD", emoji: "🇦🇺" },
          ]}
        />
      </section>

      {/* ── SyntX Catalog ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-warning" /> SyntX Index Catalog
        </h3>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-bold">Filter:</span>
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={activeCategory === c ? "default" : "outline"}
              className={`text-xs h-7 px-3 font-bold ${activeCategory === c ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        {/* Indices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((idx) => (
            <Card key={idx.label} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-foreground">{idx.label}</span>
                  <Badge variant="outline" className="text-[10px]">{idx.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{idx.description}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    Volatility: <span className={`font-bold ${volatilityColor[idx.volatility]}`}>{idx.volatility}</span>
                  </span>
                  <span className="text-muted-foreground">Best: <span className="font-bold text-foreground">{idx.bestFor}</span></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">PainX Indices</p>
              <p className="text-xs text-muted-foreground">High-volatility with sharp spikes. BUY bias — price drifts up, crashes down. Ideal for buy scalping.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">GainX Indices</p>
              <p className="text-xs text-muted-foreground">SELL bias — price drifts down, spikes up. Great for sell scalping and trend-following.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <ArrowUpDown className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Specialty Indices</p>
              <p className="text-xs text-muted-foreground">FlipX (random), SwitchX (mode changes), BreakX (breakouts) — unique algorithms for advanced strategies.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broker CTA */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Ready to trade SyntX?</h3>
            <p className="text-xs text-muted-foreground">Open a Weltrade account to access PainX, GainX, TrendX and more with live charts.</p>
          </div>
          <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Weltrade Account
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
