import { useEffect, useRef, memo, useState } from "react";

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
 *
 * Uses the official `tradingview.com/widgetembed` iframe (more robust than
 * the script-based widget across CSP / ad-blockers / mobile browsers) so
 * the chart renders consistently on every market intelligence page.
 *
 * When `withHauza` is true, pre-loads EMA20, EMA50, RSI, MACD, and
 * Bollinger Bands to mirror Botvio's "Hauza" technical-analysis preset.
 */
function TradingViewAdvancedChartImpl({
  symbol,
  label,
  height = 460,
  interval = "60",
  withHauza = true,
}: TradingViewAdvancedChartProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Map our internal interval values to TradingView widgetembed values.
  // (Both formats happen to be identical for most values.)
  const tvInterval = interval;

  const studies = withHauza
    ? ["MAExp@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"]
    : [];

  const params = new URLSearchParams({
    symbol,
    interval: tvInterval,
    hidesidetoolbar: "0",
    symboledit: "1",
    saveimage: "1",
    toolbarbg: "1A1A2E",
    studies: JSON.stringify(studies),
    theme: "dark",
    style: "1",
    timezone: "Etc/UTC",
    withdateranges: "1",
    studies_overrides: "{}",
    overrides: "{}",
    enabled_features: "[]",
    disabled_features: "[]",
    locale: "en",
    utm_source: "botvio.live",
    utm_medium: "widget",
  });

  const iframeSrc = `https://s.tradingview.com/widgetembed/?${params.toString()}`;

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    const t = setTimeout(() => {
      // If the iframe never reports a load event in 8s assume it was blocked
      if (!loaded) setErrored(true);
    }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval]);

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      {label && (
        <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {symbol} • {interval === "D" ? "Daily" : `${interval}m`}{withHauza ? " • Hauza" : ""}
          </span>
        </div>
      )}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <iframe
          ref={iframeRef}
          title={label || symbol}
          src={iframeSrc}
          loading="lazy"
          allow="fullscreen"
          referrerPolicy="origin"
          onLoad={() => setLoaded(true)}
          className="w-full h-full border-0 bg-card"
        />
        {errored && !loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-center p-6 gap-2">
            <p className="text-sm font-bold text-foreground">Live chart unavailable</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Open <span className="font-mono text-foreground">{symbol}</span> directly on TradingView for the live chart with full indicators.
            </p>
            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-primary underline mt-1"
            >
              Open on TradingView ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export const TradingViewAdvancedChart = memo(TradingViewAdvancedChartImpl);
