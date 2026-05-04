import { useEffect, useMemo, useRef } from "react";
import { createChart, ColorType, LineStyle, type IChartApi, type ISeriesApi, type UTCTimestamp, CandlestickSeries } from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, WifiOff, Wifi } from "lucide-react";
import { useBridgeTicks } from "@/hooks/useBridgeTicks";

interface Props {
  symbol: string;        // MT5 symbol, e.g. "GainX 100"
  label?: string;        // Display label
  height?: number;
}

/**
 * Live SyntX chart fed by the BOTVIO Bridge EA running inside the user's
 * Weltrade MT5 terminal. Renders 30-second candlesticks aggregated from real
 * Weltrade tick prices.
 */
export function SyntxBridgeChart({ symbol, label, height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const { ticks, latest, hasFeed } = useBridgeTicks(symbol, 2000);

  // Aggregate ticks into 30-second OHLC candles
  const candleData = useMemo(() => {
    const BUCKET = 30; // seconds
    if (!ticks.length) return [];
    const ordered = [...ticks]
      .filter((t) => t.last_price != null)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    const buckets = new Map<number, { open: number; high: number; low: number; close: number }>();
    for (const t of ordered) {
      const sec = Math.floor(new Date(t.ts).getTime() / 1000);
      const bucket = sec - (sec % BUCKET);
      const px = Number(t.last_price);
      const c = buckets.get(bucket);
      if (!c) buckets.set(bucket, { open: px, high: px, low: px, close: px });
      else {
        c.high = Math.max(c.high, px);
        c.low = Math.min(c.low, px);
        c.close = px;
      }
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([epoch, v]) => ({ time: epoch as UTCTimestamp, ...v }));
  }, [ticks]);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.08)", style: LineStyle.Dotted },
        horzLines: { color: "rgba(148,163,184,0.08)", style: LineStyle.Dotted },
      },
      timeScale: { timeVisible: true, secondsVisible: true },
      rightPriceScale: { borderVisible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Update data
  useEffect(() => {
    if (!seriesRef.current) return;
    if (candleData.length === 0) return;
    seriesRef.current.setData(candleData);
  }, [candleData]);

  return (
    <Card className="overflow-hidden border-border/60">
      <div className="flex items-center justify-between p-3 border-b border-border/40 bg-background/60">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold text-foreground">{label ?? symbol}</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {symbol}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {latest?.last_price != null && (
            <span className="text-sm font-mono font-bold text-emerald-400">
              {Number(latest.last_price).toFixed(4)}
            </span>
          )}
          {hasFeed ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
              <Wifi className="h-3 w-3 mr-1" /> Bridge LIVE
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              <WifiOff className="h-3 w-3 mr-1" /> No feed
            </Badge>
          )}
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <div ref={containerRef} className="absolute inset-0" />
        {!hasFeed && candleData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center max-w-md p-4">
              <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground mb-1">Bridge not streaming</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Open MT5 (Weltrade) → attach <span className="font-mono text-foreground">BOTVIO_BridgeEA</span> to a chart →
                ensure <span className="font-mono">{symbol}</span> is in the Market Watch panel.
                Live SyntX prices will appear here within a few seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}