import { useEffect, useRef, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Maximize2, BarChart3 } from "lucide-react";

interface TradingViewEmbedProps {
  tvSymbol: string;
  displaySymbol: string;
  timeframe?: string;
  height?: number;
}

const TF_MAP: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "D",
  "1w": "W",
};

function TradingViewEmbedInner({ tvSymbol, displaySymbol, timeframe = "1h", height = 520 }: TradingViewEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: TF_MAP[timeframe] || "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(42, 46, 57, 0.3)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: true,
      calendar: true,
      support_host: "https://www.tradingview.com",
      studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
      container_id: widgetId.current,
    });

    const widgetDiv = document.createElement("div");
    widgetDiv.id = widgetId.current;
    widgetDiv.style.height = `${height}px`;
    widgetDiv.style.width = "100%";

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [tvSymbol, timeframe, height]);

  return (
    <Card className="bg-card border-border/50 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{displaySymbol}</span>
          <Badge variant="outline" className="text-[10px]">TradingView</Badge>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://www.tradingview.com/chart/?symbol=${tvSymbol}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
              <Maximize2 className="h-3 w-3 mr-1" /> Fullscreen
            </Button>
          </a>
        </div>
      </div>

      {/* Chart container */}
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: `${height}px`, width: "100%" }}
        />
      </CardContent>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Chart powered by TradingView • Analyze on Botvio, Trade on WELTRADE
        </span>
        <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="h-6 text-[10px] bg-success hover:bg-success/90 text-success-foreground font-bold">
            <ExternalLink className="h-3 w-3 mr-1" /> Trade on WELTRADE
          </Button>
        </a>
      </div>
    </Card>
  );
}

export const TradingViewEmbed = memo(TradingViewEmbedInner);
