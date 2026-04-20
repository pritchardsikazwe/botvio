import { useEffect, useRef, memo } from "react";

interface TradingViewAdvancedChartProps {
  /** TradingView symbol, e.g. "NASDAQ:NDX", "OANDA:XAUUSD", "TADAWUL:2222" */
  symbol: string;
  /** Display label shown in the header */
  label?: string;
  height?: number;
  interval?: "1" | "5" | "15" | "30" | "60" | "240" | "D" | "W";
  /** Studies (indicators) — Hauza-style: EMA20, EMA50, RSI, MACD, Bollinger */
  withHauza?: boolean;
}

/**
 * Full TradingView Advanced Chart — live data, indicators, drawing tools.
 * When `withHauza` is true, pre-loads EMA20, EMA50, RSI, MACD, and Bollinger Bands
 * to mirror Botvio's "Hauza" technical-analysis preset.
 */
function TradingViewAdvancedChartImpl({
  symbol,
  label,
  height = 460,
  interval = "60",
  withHauza = true,
}: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";

    const studies = withHauza
      ? [
          "STD;EMA",            // EMA 20
          "STD;EMA",            // EMA 50
          "STD;RSI",            // RSI 14
          "STD;MACD",           // MACD
          "STD;Bollinger_Bands",// BB 20
        ]
      : [];

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: false,
      calendar: true,
      studies,
      support_host: "https://www.tradingview.com",
      backgroundColor: "rgba(0,0,0,0)",
    });

    containerRef.current.appendChild(script);
  }, [symbol, interval, withHauza]);

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      {label && (
        <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{symbol} • {interval === "D" ? "Daily" : `${interval}m`}{withHauza ? " • Hauza" : ""}</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

export const TradingViewAdvancedChart = memo(TradingViewAdvancedChartImpl);
