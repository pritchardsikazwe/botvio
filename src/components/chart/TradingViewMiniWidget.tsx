import { useEffect, useRef } from "react";

interface TradingViewMiniWidgetProps {
  symbol: string;
  height?: number;
}

export function TradingViewMiniWidget({ symbol, height = 200 }: TradingViewMiniWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    const tvSymbol = symbol.replace("/", "");
    const mapped =
      tvSymbol === "XAUUSD" ? "OANDA:XAUUSD" :
      tvSymbol === "XAGUSD" ? "OANDA:XAGUSD" :
      tvSymbol === "BTCUSD" ? "COINBASE:BTCUSD" :
      tvSymbol === "EURUSD" ? "FX:EURUSD" :
      tvSymbol === "GBPUSD" ? "FX:GBPUSD" :
      tvSymbol === "USDJPY" ? "FX:USDJPY" :
      tvSymbol === "AUDUSD" ? "FX:AUDUSD" :
      `FX:${tvSymbol}`;

    script.innerHTML = JSON.stringify({
      symbol: mapped,
      width: "100%",
      height,
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      noTimeScale: false,
    });

    containerRef.current.appendChild(script);
  }, [symbol, height]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden tradingview-widget-container"
      style={{ height: `${height}px` }}
    />
  );
}
