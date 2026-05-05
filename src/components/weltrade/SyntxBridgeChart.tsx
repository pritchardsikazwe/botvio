import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";
import { createSeriesMarkers, type SeriesMarker, type ISeriesMarkersPluginApi } from "lightweight-charts";
import type { Time } from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, WifiOff, Wifi, TrendingUp, TrendingDown } from "lucide-react";
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
  const supportRef = useRef<ISeriesApi<"Line"> | null>(null);
  const resistanceRef = useRef<ISeriesApi<"Line"> | null>(null);
  const trendlineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

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

  // Compute support / resistance / trendline / breakout markers from candles
  const overlays = useMemo(() => {
    if (candleData.length < 12) {
      return { support: [] as { time: UTCTimestamp; value: number }[], resistance: [] as { time: UTCTimestamp; value: number }[], trend: [] as { time: UTCTimestamp; value: number }[], markers: [] as SeriesMarker<Time>[] };
    }
    const window = candleData.slice(-60);
    // Pivots (3-bar fractal)
    const highs: { time: UTCTimestamp; price: number }[] = [];
    const lows: { time: UTCTimestamp; price: number }[] = [];
    for (let i = 2; i < window.length - 2; i++) {
      const c = window[i];
      if (c.high > window[i-1].high && c.high > window[i-2].high && c.high > window[i+1].high && c.high > window[i+2].high) {
        highs.push({ time: c.time, price: c.high });
      }
      if (c.low < window[i-1].low && c.low < window[i-2].low && c.low < window[i+1].low && c.low < window[i+2].low) {
        lows.push({ time: c.time, price: c.low });
      }
    }
    const resistanceLevel = highs.length ? Math.max(...highs.slice(-3).map(h => h.price)) : Math.max(...window.map(c => c.high));
    const supportLevel = lows.length ? Math.min(...lows.slice(-3).map(l => l.price)) : Math.min(...window.map(c => c.low));
    const start = window[0].time;
    const end = window[window.length - 1].time;
    const support = [{ time: start, value: supportLevel }, { time: end, value: supportLevel }];
    const resistance = [{ time: start, value: resistanceLevel }, { time: end, value: resistanceLevel }];

    // Trendline: linear regression on closes (last 30)
    const reg = window.slice(-30);
    const n = reg.length;
    const sumX = (n * (n - 1)) / 2;
    const sumX2 = reg.reduce((a, _, i) => a + i * i, 0);
    const sumY = reg.reduce((a, c) => a + c.close, 0);
    const sumXY = reg.reduce((a, c, i) => a + i * c.close, 0);
    const denom = n * sumX2 - sumX * sumX;
    const slope = denom ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;
    const trend = [
      { time: reg[0].time, value: intercept },
      { time: reg[n - 1].time, value: intercept + slope * (n - 1) },
    ];

    // Breakout markers: candle that closes beyond S/R line
    const markers: SeriesMarker<Time>[] = [];
    for (let i = 1; i < window.length; i++) {
      const c = window[i];
      const prev = window[i - 1];
      if (c.close > resistanceLevel && prev.close <= resistanceLevel) {
        markers.push({ time: c.time, position: "belowBar", color: "#10b981", shape: "arrowUp", text: "BO↑" });
      } else if (c.close < supportLevel && prev.close >= supportLevel) {
        markers.push({ time: c.time, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: "BO↓" });
      }
    }
    return { support, resistance, trend, markers };
  }, [candleData]);

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

    const support = chart.addSeries(LineSeries, {
      color: "#10b981",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "Support",
    });
    const resistance = chart.addSeries(LineSeries, {
      color: "#ef4444",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "Resistance",
    });
    const trend = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "Trend",
    });

    chartRef.current = chart;
    seriesRef.current = series;
    supportRef.current = support;
    resistanceRef.current = resistance;
    trendlineRef.current = trend;
    markersRef.current = createSeriesMarkers(series, []);

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
      supportRef.current = null;
      resistanceRef.current = null;
      trendlineRef.current = null;
      markersRef.current = null;
    };
  }, [height]);

  // Update data
  useEffect(() => {
    if (!seriesRef.current) return;
    if (candleData.length === 0) return;
    seriesRef.current.setData(candleData);
    if (supportRef.current && overlays.support.length) supportRef.current.setData(overlays.support);
    if (resistanceRef.current && overlays.resistance.length) resistanceRef.current.setData(overlays.resistance);
    if (trendlineRef.current && overlays.trend.length) trendlineRef.current.setData(overlays.trend);
    if (markersRef.current) {
      markersRef.current.setMarkers(overlays.markers);
    }
  }, [candleData, overlays]);

  return (
    <Card className="overflow-hidden border-border/60">
      <div className="flex items-center justify-between p-3 border-b border-border/40 bg-background/60">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold text-foreground">{label ?? symbol}</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {symbol}
          </Badge>
          <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 hidden sm:inline-flex">
            <TrendingUp className="h-2.5 w-2.5 mr-1" /> S/R
          </Badge>
          <Badge variant="outline" className="text-[9px] border-blue-500/40 text-blue-400 hidden sm:inline-flex">
            Trendline
          </Badge>
          <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400 hidden sm:inline-flex">
            <TrendingDown className="h-2.5 w-2.5 mr-1" /> Breakouts
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