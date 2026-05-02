import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, TrendingUp, Zap, ArrowUpDown, Activity, Target, Brain } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { MultiAssetScalpRobot } from "@/components/chart/MultiAssetScalpRobot";
import { SyntxBridgeChart } from "@/components/weltrade/SyntxBridgeChart";

const WELTRADE_LINK = "https://gowt.net/ib67505";

/* ─── Live Charts (Weltrade SyntX + standard markets) ─── */
interface ChartSymbol {
  label: string;
  tvSymbol: string;
  category: string;
}

const CHART_SYMBOLS: ChartSymbol[] = [
  // SyntX is proprietary to Weltrade — not on TradingView's public feed.
  // We use closest-behaviour Deriv proxies on TradingView so users still get a live chart.
  // PainX (BUY bias, crash-style drops) → Crash indices
  { label: "PainX 10 (proxy)",  tvSymbol: "DERIV:CRASH300N",  category: "PainX" },
  { label: "PainX 50 (proxy)",  tvSymbol: "DERIV:CRASH500",   category: "PainX" },
  { label: "PainX 100 (proxy)", tvSymbol: "DERIV:CRASH1000",  category: "PainX" },
  { label: "PainX 200 (proxy)", tvSymbol: "DERIV:CRASH600",   category: "PainX" },
  // GainX (SELL bias, boom-style rises) → Boom indices
  { label: "GainX 10 (proxy)",  tvSymbol: "DERIV:BOOM300N",   category: "GainX" },
  { label: "GainX 50 (proxy)",  tvSymbol: "DERIV:BOOM500",    category: "GainX" },
  { label: "GainX 100 (proxy)", tvSymbol: "DERIV:BOOM1000",   category: "GainX" },
  // TrendX (trending) → Volatility indices
  { label: "TrendX 10 (proxy)", tvSymbol: "DERIV:VOLATILITY10",  category: "TrendX" },
  { label: "TrendX 50 (proxy)", tvSymbol: "DERIV:VOLATILITY50",  category: "TrendX" },
  // Standard markets
  { label: "XAU/USD", tvSymbol: "OANDA:XAUUSD", category: "Metal" },
  { label: "EUR/USD", tvSymbol: "OANDA:EURUSD", category: "Forex" },
  { label: "GBP/USD", tvSymbol: "OANDA:GBPUSD", category: "Forex" },
  { label: "BTC/USD", tvSymbol: "BITSTAMP:BTCUSD", category: "Crypto" },
];

function LiveChart({ symbol, compact = false }: { symbol: string; compact?: boolean }) {
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
      interval: compact ? "15" : "5",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: compact,
      hide_legend: compact,
      hide_side_toolbar: compact,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      studies: compact ? ["MAExp@tv-basicstudies"] : [
        "MAExp@tv-basicstudies",
        "RSI@tv-basicstudies",
        "BB@tv-basicstudies",
      ],
    });
    containerRef.current.appendChild(script);
  }, [symbol, compact]);

  return (
    <div className="tradingview-widget-container rounded-lg overflow-hidden border border-border/50" style={{ height: compact ? "100%" : 420 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

/* ─── SyntX Index Catalog ─── */
interface SyntxIndex {
  label: string;
  tvSymbol?: string;
  category: "PainX" | "GainX" | "TrendX" | "Specialty";
  description: string;
  volatility: "Extreme" | "High" | "Medium";
  bestFor: string;
  strategy: string;
  signalEngine: string;
}

const SYNTX_INDICES: SyntxIndex[] = [
  { label: "PainX 10",  tvSymbol: "DERIV:CRASH300N", category: "PainX", description: "Low-tier volatility spikes (chart proxy: Crash 300)", volatility: "Medium", bestFor: "Beginners, small accounts", strategy: "BUY-only scalp on pullbacks; tight SL above wicks", signalEngine: "Botvio Spike Engine — RSI(14) + EMA(20/50) bias, 1m breakout" },
  { label: "PainX 50",  tvSymbol: "DERIV:CRASH500",  category: "PainX", description: "Mid-tier spike index (chart proxy: Crash 500)", volatility: "High", bestFor: "Scalping, quick entries", strategy: "BUY pullbacks to EMA20 on 1m; exit on RSI > 75", signalEngine: "Botvio Spike Engine — Donchian(20) breakout, ATR-scaled SL" },
  { label: "PainX 100", tvSymbol: "DERIV:CRASH1000", category: "PainX", description: "Aggressive spike bursts (chart proxy: Crash 1000)", volatility: "Extreme", bestFor: "Experienced scalpers", strategy: "BUY momentum bursts; trail SL aggressively", signalEngine: "Botvio Spike Engine — Volatility-adjusted Donchian breakout" },
  { label: "PainX 200", tvSymbol: "DERIV:CRASH600",  category: "PainX", description: "Ultra-volatile spikes (chart proxy: Crash 600)", volatility: "Extreme", bestFor: "High-risk traders", strategy: "BUY only on confirmed momentum; small lot sizes", signalEngine: "Botvio Spike Engine — wide ATR filter, 5m confirmation" },
  { label: "GainX 10",  tvSymbol: "DERIV:BOOM300N",  category: "GainX", description: "Gentle trending momentum (chart proxy: Boom 300)", volatility: "Medium", bestFor: "Swing trading", strategy: "SELL rallies into EMA50; multi-hour holds", signalEngine: "Botvio Trend Engine — EMA(20/50) cross, MACD confirmation" },
  { label: "GainX 50",  tvSymbol: "DERIV:BOOM500",   category: "GainX", description: "Steady trend moves (chart proxy: Boom 500)", volatility: "Medium", bestFor: "Trend following", strategy: "SELL on lower-high rejections; ride trend", signalEngine: "Botvio Trend Engine — EMA pullback + RSI bear cross" },
  { label: "GainX 100", tvSymbol: "DERIV:BOOM1000",  category: "GainX", description: "Strong directional moves (chart proxy: Boom 1000)", volatility: "High", bestFor: "Momentum trading", strategy: "SELL strong impulses; ATR-based TP at 1:2 R:R", signalEngine: "Botvio Trend Engine — Donchian(20) reverse breakout" },
  { label: "TrendX 10", tvSymbol: "DERIV:VOLATILITY10", category: "TrendX", description: "Light trend bias index (chart proxy: Volatility 10)", volatility: "Medium", bestFor: "Breakout setups", strategy: "Trade range breaks both directions on 5m", signalEngine: "Botvio Breakout Engine — Bollinger squeeze + volume" },
  { label: "TrendX 50", tvSymbol: "DERIV:VOLATILITY50", category: "TrendX", description: "Medium trend bias (chart proxy: Volatility 50)", volatility: "High", bestFor: "Continuation trades", strategy: "Buy/Sell continuation after pullback to EMA20", signalEngine: "Botvio Breakout Engine — EMA stack + ADX > 20" },
  { label: "FlipX",     category: "Specialty", description: "Sudden direction reversals", volatility: "Extreme", bestFor: "Reversal traders", strategy: "Trade post-flip in new direction; very small lots", signalEngine: "Botvio Reversal Engine — RSI divergence + flip detector" },
  { label: "SwitchX",   category: "Specialty", description: "Alternating trend phases", volatility: "High", bestFor: "Range & breakout", strategy: "Range trade until phase switch confirmed", signalEngine: "Botvio Phase Engine — regime classifier (trend vs range)" },
  { label: "BreakX",    category: "Specialty", description: "Consolidation breakouts", volatility: "High", bestFor: "Breakout strategies", strategy: "Enter on confirmed breakout candle close", signalEngine: "Botvio Breakout Engine — Donchian(20) + ATR filter" },
];

const CATEGORIES = ["All", "PainX", "GainX", "TrendX", "Specialty"] as const;

/** Symbols streamed by BOTVIO_BridgeEA from a Weltrade MT5 terminal. */
const BRIDGE_SYMBOLS = [
  "GainX 100", "GainX 50", "GainX 10",
  "PainX 100", "PainX 50", "PainX 10", "PainX 200",
  "TrendX 100", "TrendX 50", "TrendX 10",
] as const;

const volatilityColor: Record<string, string> = {
  Extreme: "text-destructive",
  High: "text-warning",
  Medium: "text-success",
};

export function SyntxChartSection() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeChart, setActiveChart] = useState(0);
  const [activeBridgeSymbol, setActiveBridgeSymbol] = useState<string>("GainX 100");

  const filtered = activeCategory === "All"
    ? SYNTX_INDICES
    : SYNTX_INDICES.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* ── Live Bridge Feed (real Weltrade SyntX prices via MT5 EA) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" /> Live SyntX Feed (Weltrade Bridge)
          </h3>
          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
            Real Weltrade prices via MT5 Bridge EA
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {BRIDGE_SYMBOLS.map((sym) => (
            <Button
              key={sym}
              size="sm"
              variant={activeBridgeSymbol === sym ? "default" : "outline"}
              className={`text-[11px] h-7 px-2.5 font-bold ${activeBridgeSymbol === sym ? "bg-emerald-500 hover:bg-emerald-500/90 text-white" : ""}`}
              onClick={() => setActiveBridgeSymbol(sym)}
            >
              {sym}
            </Button>
          ))}
        </div>
        <SyntxBridgeChart symbol={activeBridgeSymbol} label={activeBridgeSymbol} height={340} />
        <div className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
          <p>
            🔌 <span className="font-bold text-foreground">How to enable:</span> Download <span className="font-mono">BOTVIO_BridgeEA.mq5</span> from <a className="text-primary underline" href="/install">Install</a>, attach it to any chart in your <span className="font-bold">Weltrade MT5</span> terminal, and add SyntX symbols (GainX, PainX, TrendX) to Market Watch. The EA pushes live prices to Botvio every 3 seconds.
          </p>
          <p>
            ⚙️ The EA's <span className="font-mono">InpTickSymbols</span> input controls which symbols stream. Default covers all common SyntX indices.
          </p>
        </div>
      </section>

      {/* ── Live Charts ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Live Charts (TradingView proxies)
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
          💡 SyntX (PainX, GainX, TrendX) are proprietary to Weltrade and not on TradingView's public feed. Charts shown are closest-behaviour Deriv proxies (Crash/Boom/Volatility) — the strategy logic transfers cleanly. For exact SyntX prices, use the Weltrade MT4/MT5 terminal.
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

        {/* Indices Grid — each card embeds a TradingView chart + strategy + signal engine */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((idx) => (
            <Card key={idx.label} className="bg-card border-border/50 hover:border-primary/30 transition-colors overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-foreground">{idx.label}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{idx.category}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${volatilityColor[idx.volatility]}`}>{idx.volatility}</Badge>
                  </div>
                </div>

                {idx.tvSymbol ? (
                  <div className="rounded-lg overflow-hidden border border-border/50" style={{ height: 260 }}>
                    <LiveChart symbol={idx.tvSymbol} compact />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4 text-center">
                    <p className="text-[11px] text-muted-foreground">Chart unavailable on TradingView — view live on Weltrade MT4/MT5.</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{idx.description}</p>

                <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 space-y-1">
                  <p className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <Target className="h-3 w-3" /> Strategy
                  </p>
                  <p className="text-[11px] text-foreground leading-snug">{idx.strategy}</p>
                </div>

                <div className="rounded-md border border-warning/20 bg-warning/5 p-2.5 space-y-1">
                  <p className="text-[10px] font-bold text-warning flex items-center gap-1">
                    <Brain className="h-3 w-3" /> Signal Engine
                  </p>
                  <p className="text-[11px] text-foreground leading-snug">{idx.signalEngine}</p>
                </div>

                <div className="text-[10px] text-muted-foreground">
                  Best for: <span className="font-bold text-foreground">{idx.bestFor}</span>
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
