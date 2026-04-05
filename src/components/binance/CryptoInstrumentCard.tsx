import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Lightbulb } from "lucide-react";

interface CryptoInstrumentCardProps {
  symbol: string;
  displayName: string;
  tip: string;
}

export function CryptoInstrumentCard({ symbol, displayName, tip }: CryptoInstrumentCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);

  // Live price via Binance WebSocket
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const p = parseFloat(data.p);
        setPrice((prev) => {
          setPrevPrice(prev);
          return p;
        });
      } catch {}
    };
    return () => ws.close();
  }, [symbol]);

  // TradingView mini chart
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol: `BINANCE:${symbol}`,
      width: "100%",
      height: 160,
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      noTimeScale: false,
    });
    chartRef.current.appendChild(script);
  }, [symbol]);

  const isUp = price !== null && prevPrice !== null && price >= prevPrice;
  const changeColor = isUp ? "text-emerald-500" : "text-red-500";

  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{displayName}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">SPOT</Badge>
          </div>
          <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${changeColor}`}>
            {price !== null ? (
              <>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}
              </>
            ) : (
              <span className="text-muted-foreground text-xs">Loading…</span>
            )}
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef} className="h-[160px] overflow-hidden" />

        {/* Tip */}
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-start gap-2 bg-secondary/40 rounded-lg p-2.5">
            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{tip}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
