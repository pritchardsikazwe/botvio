import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, TrendingUp, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SYNTX_SYMBOLS = [
  { symbol: "WELTRADE:PAINX10", label: "PainX 10" },
  { symbol: "WELTRADE:PAINX50", label: "PainX 50" },
  { symbol: "WELTRADE:PAINX100", label: "PainX 100" },
  { symbol: "WELTRADE:GAINX10", label: "GainX 10" },
  { symbol: "WELTRADE:GAINX50", label: "GainX 50" },
  { symbol: "WELTRADE:GAINX100", label: "GainX 100" },
  { symbol: "WELTRADE:TRENDX10", label: "TrendX 10" },
  { symbol: "WELTRADE:TRENDX50", label: "TrendX 50" },
];

const TIMEFRAMES = ["1", "5", "15", "60", "D"] as const;
const TF_LABELS: Record<string, string> = { "1": "1m", "5": "5m", "15": "15m", "60": "1H", "D": "Daily" };

const WELTRADE_LINK = "https://gowt.net/ib67505";

export function SyntxChartSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState<string>("15");
  const [activeSymbol, setActiveSymbol] = useState(SYNTX_SYMBOLS[0]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activeSymbol.symbol,
      interval: tf,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(255, 255, 255, 0.04)",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      calendar: false,
      studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);
  }, [tf, activeSymbol]);

  return (
    <div className="space-y-4">
      {/* Symbol Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-bold">Symbol:</span>
        {SYNTX_SYMBOLS.map((s) => (
          <Button
            key={s.symbol}
            size="sm"
            variant={activeSymbol.symbol === s.symbol ? "default" : "outline"}
            className={`text-xs h-7 px-3 font-bold ${activeSymbol.symbol === s.symbol ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setActiveSymbol(s)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-bold">Timeframe:</span>
        {TIMEFRAMES.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tf === t ? "default" : "outline"}
            className={`text-xs h-7 px-3 font-bold ${tf === t ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setTf(t)}
          >
            {TF_LABELS[t]}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-card border-border/50 overflow-hidden">
        <div ref={containerRef} className="w-full h-[500px] md:h-[600px]" />
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">PainX Indices</p>
              <p className="text-xs text-muted-foreground">High-volatility synthetic indices with sharp spikes. Ideal for scalping strategies.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">GainX Indices</p>
              <p className="text-xs text-muted-foreground">Trending synthetic indices with steady momentum. Great for swing and trend-following.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Layers className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">TrendX Indices</p>
              <p className="text-xs text-muted-foreground">Directional indices with built-in trend bias. Best for breakout and continuation setups.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broker CTA */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Ready to trade SyntX?</h3>
            <p className="text-xs text-muted-foreground">Open a Weltrade account to access PainX, GainX, TrendX and more.</p>
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
