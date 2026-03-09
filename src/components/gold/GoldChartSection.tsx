import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, TrendingUp, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TIMEFRAMES = ["1", "5", "15", "60", "D", "W"] as const;
const TIMEFRAME_LABELS: Record<string, string> = { "1": "1m", "5": "5m", "15": "15m", "60": "1H", "D": "Daily", "W": "Weekly" };

export function GoldChartSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState<string>("60");

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "OANDA:XAUUSD",
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
      studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);
  }, [tf]);

  return (
    <div className="space-y-4">
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
            {TIMEFRAME_LABELS[t]}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-card border-border/50 overflow-hidden">
        <div ref={containerRef} className="w-full h-[500px] md:h-[600px]" />
      </Card>

      {/* Indicator Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">RSI (14)</p>
              <p className="text-xs text-muted-foreground">Measures overbought (&gt;70) or oversold (&lt;30) conditions. Use to time entries.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">MACD</p>
              <p className="text-xs text-muted-foreground">Signal line crossovers indicate trend changes. Histogram shows momentum strength.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Layers className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Bollinger Bands</p>
              <p className="text-xs text-muted-foreground">Price touching upper/lower bands signals potential reversals. Squeeze = breakout incoming.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broker CTA */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Ready to trade Gold?</h3>
            <p className="text-xs text-muted-foreground">Open your broker account and execute when your setup is confirmed.</p>
          </div>
          <div className="flex gap-2">
            <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Trade on Exness
              </Button>
            </a>
            <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="font-bold text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Weltrade
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
