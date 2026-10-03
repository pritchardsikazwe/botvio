import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, AreaChart, BarChart3, LineChart, Maximize2, Minimize2, WifiOff } from "lucide-react";
import { computeIndicators, type IndicatorSet } from "@/lib/marketData/indicators";
import type { EngineSignal } from "@/lib/marketData/signalEngine";
import { TIMEFRAMES, type FeedStatus, type NormalizedCandle, type Timeframe } from "@/lib/marketData/types";

export type ChartType = "candles" | "line" | "area";

export interface TradingChartOverlays {
  signals: boolean;
  levels: boolean;
  indicators: boolean;
  rsi: boolean;
}

export interface TradingChartProps {
  /** Normalized OHLC — the chart never receives broker-specific payloads. */
  candles: NormalizedCandle[];
  indicators?: IndicatorSet;
  status: FeedStatus;
  sourceLabel: string;
  brokerLabel: string;
  symbolLabel: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  price: number | null;
  bid?: number | null;
  ask?: number | null;
  decimals?: number;
  signals?: EngineSignal[];
  activeSignal?: EngineSignal | null;
  /** Scroll/zoom the chart to this signal's candle. */
  focusSignal?: EngineSignal | null;
  height?: number;
  unavailableMessage?: string;
  errorDetail?: string | null;
  /** Hauza-style pivot support/resistance overlay. */
  showHauza?: boolean;
}

const STATUS_META: Record<FeedStatus, { label: string; className: string }> = {
  idle: { label: "IDLE", className: "border-border text-muted-foreground" },
  connecting: { label: "CONNECTING", className: "border-warning/40 text-warning" },
  live: { label: "LIVE", className: "border-success/40 text-success bg-success/10" },
  reconnecting: { label: "RECONNECTING", className: "border-warning/40 text-warning bg-warning/10" },
  delayed: { label: "DATA DELAYED", className: "border-warning/50 text-warning bg-warning/10" },
  unavailable: { label: "NO DATA", className: "border-destructive/40 text-destructive bg-destructive/10" },
  error: { label: "FEED ERROR", className: "border-destructive/40 text-destructive bg-destructive/10" },
};

function fmt(value: number | null | undefined, decimals: number) {
  return value == null || !Number.isFinite(value) ? "—" : value.toFixed(decimals);
}

function TradingChartBase({
  candles,
  indicators,
  status,
  sourceLabel,
  brokerLabel,
  symbolLabel,
  timeframe,
  onTimeframeChange,
  price,
  bid,
  ask,
  decimals = 5,
  signals = [],
  activeSignal = null,
  focusSignal = null,
  height = 460,
  unavailableMessage = "Market data unavailable",
  errorDetail = null,
  showHauza = false,
}: TradingChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);
  const emaRefs = useRef<Record<string, ISeriesApi<"Line"> | null>>({});
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  const [chartType, setChartType] = useState<ChartType>("candles");
  const [overlays, setOverlays] = useState<TradingChartOverlays>({
    signals: true,
    levels: true,
    indicators: true,
    rsi: true,
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [hauzaOn, setHauzaOn] = useState(showHauza);
  const hauzaTrendRef = useRef<ISeriesApi<"Line"> | null>(null);
  const hauzaLinesRef = useRef<IPriceLine[]>([]);

  useEffect(() => setHauzaOn(showHauza), [showHauza]);

  const hauza = useMemo(() => {
    if (!hauzaOn || candles.length < 20) return null;
    const visible = candles.slice(-120);
    const left = 3;
    const right = 3;
    const supports: number[] = [];
    const resistances: number[] = [];
    for (let i = left; i < visible.length - right; i++) {
      const c = visible[i];
      let high = true;
      let low = true;
      for (let k = 1; k <= left; k++) {
        if (visible[i - k].high >= c.high) high = false;
        if (visible[i - k].low <= c.low) low = false;
      }
      for (let k = 1; k <= right; k++) {
        if (visible[i + k].high >= c.high) high = false;
        if (visible[i + k].low <= c.low) low = false;
      }
      if (high) resistances.push(c.high);
      if (low) supports.push(c.low);
    }
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    visible.forEach((c, i) => {
      sumX += i; sumY += c.close; sumXY += i * c.close; sumXX += i * i;
    });
    const denom = visible.length * sumXX - sumX * sumX;
    const slope = denom ? (visible.length * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / visible.length;
    return {
      s1: supports.at(-1) ?? null,
      s2: supports.at(-2) ?? null,
      r1: resistances.at(-1) ?? null,
      r2: resistances.at(-2) ?? null,
      trend: visible.map((c, i) => ({ time: c.time as UTCTimestamp, value: intercept + slope * i })),
    };
  }, [candles, hauzaOn]);

  const ind = useMemo(() => indicators ?? computeIndicators(candles), [indicators, candles]);
  const statusMeta = STATUS_META[status];
  const showBlocker = candles.length === 0 && (status === "unavailable" || status === "error");
  const chartHeight = fullscreen ? Math.max(320, window.innerHeight - 260) : height;
  const rsiHeight = overlays.rsi ? 96 : 0;

  // ── Chart creation (once per chart type / height) ────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(var(--muted-foreground))",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.10)", style: LineStyle.Dotted },
        horzLines: { color: "rgba(148,163,184,0.10)", style: LineStyle.Dotted },
      },
      crosshair: { mode: CrosshairMode.Normal },
      // Pin the locale: some browsers/OS locales report tags Intl rejects
      // (e.g. "en-US@posix"), which makes the chart throw while formatting axis
      // dates and renders a blank canvas.
      localization: { locale: "en-US" },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false, rightOffset: 4 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
      autoSize: false,
    });

    const priceSeries =
      chartType === "candles"
        ? chart.addSeries(CandlestickSeries, {
            upColor: "hsl(var(--success))",
            downColor: "hsl(var(--destructive))",
            borderUpColor: "hsl(var(--success))",
            borderDownColor: "hsl(var(--destructive))",
            wickUpColor: "hsl(var(--success))",
            wickDownColor: "hsl(var(--destructive))",
            priceLineVisible: true,
          })
        : chartType === "line"
          ? chart.addSeries(LineSeries, { color: "hsl(var(--primary))", lineWidth: 2 })
          : chart.addSeries(AreaSeries, {
              lineColor: "hsl(var(--primary))",
              topColor: "hsla(var(--primary), 0.35)",
              bottomColor: "hsla(var(--primary), 0.02)",
              lineWidth: 2,
            });

    const mkLine = (color: string, title: string) =>
      chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        title,
        priceLineVisible: false,
        lastValueVisible: false,
      });

    emaRefs.current = {
      ema9: mkLine("#22d3ee", "EMA 9"),
      ema21: mkLine("#f59e0b", "EMA 21"),
      ema50: mkLine("#a855f7", "EMA 50"),
      sma200: mkLine("#94a3b8", "SMA 200"),
    };

    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;
    markersRef.current = createSeriesMarkers(priceSeries, []);

    const resize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: chartHeight });
    };
    window.addEventListener("resize", resize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", resize);
      ro?.disconnect();
      priceLinesRef.current = [];
      hauzaLinesRef.current = [];
      hauzaTrendRef.current = null;
      markersRef.current = null;
      priceSeriesRef.current = null;
      emaRefs.current = {};
      chart.remove();
      chartRef.current = null;
    };
  }, [chartType, chartHeight]);

  // ── RSI pane (separate synced chart) ────────────────────────────────────
  useEffect(() => {
    const el = rsiContainerRef.current;
    if (!el || !overlays.rsi) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: rsiHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(var(--muted-foreground))",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(148,163,184,0.08)" },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { visible: false, borderVisible: false },
      localization: { locale: "en-US" },
      crosshair: { mode: CrosshairMode.Normal },
    });

    const series = chart.addSeries(LineSeries, {
      color: "hsl(var(--primary))",
      lineWidth: 2,
      priceLineVisible: false,
      title: "RSI 14",
    });
    series.createPriceLine({ price: 70, color: "hsl(var(--destructive))", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "70" });
    series.createPriceLine({ price: 30, color: "hsl(var(--success))", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "30" });

    rsiChartRef.current = chart;
    rsiSeriesRef.current = series;

    // Keep the RSI pane time-aligned with the main chart.
    const main = chartRef.current;
    const sync = main?.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) chart.timeScale().setVisibleLogicalRange(range);
    });

    const resize = () => {
      if (!rsiContainerRef.current || !rsiChartRef.current) return;
      rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth, height: rsiHeight });
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (sync !== undefined) {
        try { main?.timeScale().unsubscribeVisibleLogicalRangeChange(sync as never); } catch { /* noop */ }
      }
      rsiSeriesRef.current = null;
      chart.remove();
      rsiChartRef.current = null;
    };
  }, [overlays.rsi, rsiHeight, chartType]);

  // ── Incremental data updates ────────────────────────────────────────────
  useEffect(() => {
    const series = priceSeriesRef.current;
    if (!series) return;
    if (!candles.length) {
      series.setData([]);
      return;
    }

    if (chartType === "candles") {
      (series as ISeriesApi<"Candlestick">).setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
    } else {
      (series as ISeriesApi<"Line">).setData(
        candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close }))
      );
    }

    const setLine = (key: keyof typeof emaRefs.current, values: (number | null)[]) => {
      const s = emaRefs.current[key];
      if (!s) return;
      s.applyOptions({ visible: overlays.indicators });
      s.setData(
        candles
          .map((c, i) => ({ time: c.time as UTCTimestamp, value: values[i] }))
          .filter((p): p is { time: UTCTimestamp; value: number } => p.value != null)
      );
    };
    setLine("ema9", ind.ema9);
    setLine("ema21", ind.ema21);
    setLine("ema50", ind.ema50);
    setLine("sma200", ind.sma200);

    if (rsiSeriesRef.current) {
      rsiSeriesRef.current.setData(
        candles
          .map((c, i) => ({ time: c.time as UTCTimestamp, value: ind.rsi14[i] }))
          .filter((p): p is { time: UTCTimestamp; value: number } => p.value != null)
      );
    }
  }, [candles, ind, chartType, overlays.indicators]);

  // ── Hauza trend line + support/resistance levels ────────────────────────
  useEffect(() => {
    const trend = hauzaTrendRef.current;
    if (trend) {
      trend.applyOptions({ visible: !!hauzaOn && !!hauza });
      trend.setData(hauza?.trend ?? []);
    }

    const series = priceSeriesRef.current;
    if (!series) return;
    hauzaLinesRef.current.forEach((line) => {
      try { series.removePriceLine(line); } catch { /* noop */ }
    });
    hauzaLinesRef.current = [];
    if (!hauzaOn || !hauza) return;

    const add = (price: number | null, color: string, title: string) => {
      if (price == null || !Number.isFinite(price)) return null;
      return series.createPriceLine({
        price,
        color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title,
      });
    };
    const lines = [
      add(hauza.r2, "hsl(var(--destructive))", "R2"),
      add(hauza.r1, "hsl(var(--destructive))", "R1"),
      add(hauza.s1, "hsl(var(--success))", "S1"),
      add(hauza.s2, "hsl(var(--success))", "S2"),
    ].filter((line): line is IPriceLine => !!line);
    hauzaLinesRef.current = lines;
  }, [hauza, hauzaOn, chartType]);

  // ── Signal markers anchored to their own candle ─────────────────────────
  useEffect(() => {
    if (!markersRef.current) return;
    if (!overlays.signals) {
      markersRef.current.setMarkers([]);
      return;
    }
    const markers: SeriesMarker<Time>[] = signals.map((s) => ({
      time: s.time as UTCTimestamp,
      position: s.direction === "BUY" ? "belowBar" : "aboveBar",
      color: s.direction === "BUY" ? "hsl(var(--success))" : "hsl(var(--destructive))",
      shape: s.direction === "BUY" ? "arrowUp" : "arrowDown",
      text: `${s.direction} ${s.confidence}%`,
    }));
    markersRef.current.setMarkers(markers.sort((a, b) => Number(a.time) - Number(b.time)));
  }, [signals, overlays.signals]);

  // ── Entry / SL / TP price lines for the active signal ───────────────────
  useEffect(() => {
    const series = priceSeriesRef.current;
    if (!series) return;
    priceLinesRef.current.forEach((line) => {
      try { series.removePriceLine(line); } catch { /* noop */ }
    });
    priceLinesRef.current = [];

    if (!overlays.levels || !activeSignal) return;
    const add = (price: number, color: string, title: string) =>
      series.createPriceLine({
        price,
        color,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title,
      });
    priceLinesRef.current = [
      add(activeSignal.entry, "hsl(var(--primary))", `${activeSignal.direction} ${activeSignal.entry.toFixed(decimals)}`),
      add(activeSignal.stopLoss, "hsl(var(--destructive))", `SL ${activeSignal.stopLoss.toFixed(decimals)}`),
      add(activeSignal.takeProfit, "hsl(var(--success))", `TP ${activeSignal.takeProfit.toFixed(decimals)}`),
    ];
  }, [activeSignal, overlays.levels, decimals, chartType]);

  // ── Focus a historical signal's candle ─────────────────────────────────
  useEffect(() => {
    if (!focusSignal || !chartRef.current || !candles.length) return;
    const idx = candles.findIndex((c) => c.time === focusSignal.time);
    if (idx < 0) return;
    const from = Math.max(0, idx - 40);
    const to = Math.min(candles.length - 1, idx + 20);
    chartRef.current.timeScale().setVisibleLogicalRange({ from, to });
  }, [focusSignal, candles]);

  const autoFit = useCallback(() => chartRef.current?.timeScale().fitContent(), []);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      setFullscreen((f) => !f);
    }
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <Card ref={wrapperRef} className="overflow-hidden border-border/60 bg-card max-w-full">
      {/* Terminal header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-background/60 p-2 sm:p-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">{brokerLabel}</span>
          <span className="text-muted-foreground">|</span>
          <span className="truncate text-sm font-black text-foreground">{symbolLabel}</span>
          <span className="text-muted-foreground">|</span>
          <span className="font-mono text-xs font-bold text-primary">{timeframe}</span>
          <Badge variant="outline" className={cn("ml-1 text-[9px] font-bold", statusMeta.className)}>
            <Activity className="mr-1 h-2.5 w-2.5" />
            {statusMeta.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right leading-tight">
            <p className="font-mono text-sm font-black text-foreground">{fmt(price, decimals)}</p>
            {(bid != null || ask != null) && (
              <p className="font-mono text-[10px] text-muted-foreground">
                B {fmt(bid, decimals)} · A {fmt(ask, decimals)}
              </p>
            )}
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={autoFit} title="Auto-fit">
            <BarChart3 className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={toggleFullscreen} title="Fullscreen">
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Timeframes + chart type + overlay toggles */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/40 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf.value}
              size="sm"
              variant={tf.value === timeframe ? "secondary" : "ghost"}
              className="h-6 px-2 text-[10px] font-bold"
              onClick={() => onTimeframeChange(tf.value)}
            >
              {tf.label}
            </Button>
          ))}
        </div>
        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <div className="flex items-center gap-0.5">
          {([
            { type: "candles" as ChartType, icon: BarChart3, label: "Candles" },
            { type: "line" as ChartType, icon: LineChart, label: "Line" },
            { type: "area" as ChartType, icon: AreaChart, label: "Area" },
          ]).map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              size="icon"
              variant={chartType === type ? "secondary" : "ghost"}
              className="h-6 w-6"
              title={label}
              onClick={() => setChartType(type)}
            >
              <Icon className="h-3 w-3" />
            </Button>
          ))}
        </div>
        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <div className="flex flex-wrap items-center gap-1">
          {([
            ["signals", "Signals"],
            ["levels", "Entry/SL/TP"],
            ["indicators", "EMA/SMA"],
            ["rsi", "RSI"],
          ] as [keyof TradingChartOverlays, string][]).map(([key, label]) => (
            <Toggle
              key={key}
              size="sm"
              pressed={overlays[key]}
              onPressedChange={(v) => setOverlays((o) => ({ ...o, [key]: v }))}
              className="h-6 px-2 text-[10px] font-bold data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
            >
              {label}
            </Toggle>
          ))}
        </div>
      </div>

      {/* Chart surface */}
      <div className="relative w-full overflow-hidden" style={{ height: chartHeight, touchAction: "pan-y" }}>
        <div ref={containerRef} className="absolute inset-0" />
        {showBlocker && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
            <div className="max-w-md text-center">
              <WifiOff className="mx-auto mb-2 h-8 w-8 text-destructive" />
              <p className="mb-1 text-sm font-black text-foreground">{unavailableMessage}</p>
              {errorDetail && <p className="text-xs leading-relaxed text-muted-foreground">{errorDetail}</p>}
            </div>
          </div>
        )}
        {!showBlocker && candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <p className="animate-pulse text-xs font-bold text-muted-foreground">Loading {symbolLabel} candles…</p>
          </div>
        )}
      </div>

      {overlays.rsi && (
        <div className="relative w-full border-t border-border/40" style={{ height: rsiHeight }}>
          <div ref={rsiContainerRef} className="absolute inset-0" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 px-2 py-1.5">
        <p className="text-[10px] text-muted-foreground">
          Feed: <span className="font-mono text-foreground">{sourceLabel}</span> · {candles.length} candles
        </p>
        {status === "delayed" && (
          <p className="flex items-center gap-1 text-[10px] font-bold text-warning">
            <AlertTriangle className="h-3 w-3" /> Data delayed — prices may not be current
          </p>
        )}
      </div>
    </Card>
  );
}

export const TradingChart = memo(TradingChartBase);