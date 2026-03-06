import { useRef, useEffect, useCallback } from "react";
import { createChart, ColorType, LineSeries, CandlestickSeries } from "lightweight-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BarChart3, Eye, Newspaper, Clock, TrendingUp } from "lucide-react";
import {
  detectSupportResistance,
  detectWickRejections,
  detectBreakouts,
  detectTrendlines,
  candleTime,
} from "@/lib/chartAnalysis";

interface Candle {
  candle_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartViewProps {
  candles: Candle[];
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  showSessions: boolean;
  showLevels: boolean;
  showNews: boolean;
  onToggleSessions: () => void;
  onToggleLevels: () => void;
  onToggleNews: () => void;
  metrics: any;
  signal: any;
}

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h"];

export function ChartView({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
  showSessions,
  showLevels,
  showNews,
  onToggleSessions,
  onToggleLevels,
  onToggleNews,
  metrics,
  signal,
}: ChartViewProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  const buildChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(220 10% 55%)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "hsl(220 15% 14%)" },
        horzLines: { color: "hsl(220 15% 14%)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "hsl(45 100% 51%)", width: 1, style: 2, labelBackgroundColor: "hsl(45 100% 51%)" },
        horzLine: { color: "hsl(45 100% 51%)", width: 1, style: 2, labelBackgroundColor: "hsl(45 100% 51%)" },
      },
      rightPriceScale: { borderColor: "hsl(220 15% 18%)" },
      timeScale: { borderColor: "hsl(220 15% 18%)", timeVisible: true, secondsVisible: false },
      width: container.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    // ── Candlestick series ────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(145 70% 45%)",
      downColor: "hsl(0 85% 55%)",
      borderUpColor: "hsl(145 70% 45%)",
      borderDownColor: "hsl(0 85% 55%)",
      wickUpColor: "hsl(145 70% 55%)",
      wickDownColor: "hsl(0 85% 65%)",
    });

    if (candles.length > 0) {
      const data = candles.map((c) => ({
        time: candleTime(c) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeries.setData(data);

      const firstTime = candleTime(candles[0]) as any;
      const lastTime = candleTime(candles[candles.length - 1]) as any;

      // helper to draw a horizontal line
      const drawHLine = (price: number, color: string, width: number, style: number) => {
        const s = chart.addSeries(LineSeries, {
          color,
          lineWidth: width as any,
          lineStyle: style,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData([
          { time: firstTime, value: price },
          { time: lastTime, value: price },
        ]);
      };

      // ── EMA 20 & 50 ──────────────────────────────────────────────────
      if (candles.length >= 20) {
      const ema20Series = chart.addSeries(LineSeries, {
          color: "hsl(45 100% 51%)",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          title: "EMA20",
        });
        ema20Series.setData(calculateEMA(candles, 20));
      }
      if (candles.length >= 50) {
        const ema50Series = chart.addSeries(LineSeries, {
          color: "hsl(200 80% 55%)",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ema50Series.setData(calculateEMA(candles, 50));
      }

      // ── Auto-detected S/R (bold lines) ───────────────────────────────
      if (showLevels) {
        const autoLevels = detectSupportResistance(candles);

        autoLevels.forEach((lvl) => {
          const color = lvl.type === "support" ? "hsl(145 70% 45%)" : "hsl(0 85% 55%)";
          const width = lvl.strength === "strong" ? 3 : lvl.strength === "moderate" ? 2 : 1;
          drawHLine(lvl.price, color, width, lvl.strength === "strong" ? 0 : 2);
        });

        // Metrics-based S/R (if available, draw as bold dashed)
        if (metrics) {
          const mLevels = [
            { price: metrics.support_1, color: "hsl(145 80% 50%)" },
            { price: metrics.support_2, color: "hsl(145 60% 40%)" },
            { price: metrics.resistance_1, color: "hsl(0 90% 60%)" },
            { price: metrics.resistance_2, color: "hsl(0 70% 50%)" },
          ];
          mLevels.forEach((m) => {
            if (m.price != null) drawHLine(Number(m.price), m.color, 2, 2);
          });
        }

        // ── Breakout markers ──────────────────────────────────────────────
        const breakouts = detectBreakouts(candles, autoLevels);
        breakouts.forEach((bo) => {
          const color = bo.direction === "up" ? "hsl(145 90% 55%)" : "hsl(0 90% 60%)";
          const s = chart.addSeries(LineSeries, {
            color,
            lineWidth: 3,
            lineStyle: 0,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          // Draw a short bold horizontal dash at breakout point
          const halfSpan = Math.max(1, Math.floor((lastTime - firstTime) / candles.length));
          s.setData([
            { time: (bo.time - halfSpan * 2) as any, value: bo.price },
            { time: (bo.time + halfSpan * 2) as any, value: bo.price },
          ]);
        });

        // ── Wick rejections (small horizontal markers) ──────────────────
        const rejections = detectWickRejections(candles);
        rejections.forEach((rej) => {
          const color = rej.type === "wick_rejection_high"
            ? "hsl(280 80% 65%)"  // purple for upper wick rejections
            : "hsl(180 80% 55%)"; // cyan for lower wick rejections
          const s = chart.addSeries(LineSeries, {
            color,
            lineWidth: 1,
            lineStyle: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          const halfSpan = Math.max(1, Math.floor((lastTime - firstTime) / candles.length));
          s.setData([
            { time: (rej.time - halfSpan) as any, value: rej.price },
            { time: (rej.time + halfSpan) as any, value: rej.price },
          ]);
        });
      }

      // ── Auto trendlines ──────────────────────────────────────────────
      if (showLevels) {
        const trendlines = detectTrendlines(candles);
        trendlines.forEach((tl) => {
          const color = tl.type === "ascending" ? "hsl(145 70% 55%)" : "hsl(0 70% 60%)";
          const s = chart.addSeries(LineSeries, {
            color,
            lineWidth: 2,
            lineStyle: 0,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          s.setData(tl.points.map((p) => ({ time: p.time as any, value: p.value })));
        });
      }

      // ── Signal entry/SL/TP lines ──────────────────────────────────────
      if (showLevels && signal) {
        const signalLines = [
          { price: signal.entry_price, color: "hsl(45 100% 51%)", w: 2 },
          { price: signal.stop_loss, color: "hsl(0 85% 55%)", w: 2 },
          { price: signal.take_profit_1, color: "hsl(145 70% 45%)", w: 2 },
        ];
        signalLines.forEach((sl) => {
          if (sl.price != null) drawHLine(Number(sl.price), sl.color, sl.w, 1);
        });
      }

      // ── Day High / Day Low pins (bold dashed) ──────────────────────────
      if (metrics) {
        if (metrics.day_high != null) {
          drawHLine(Number(metrics.day_high), "hsl(0 85% 60%)", 2, 1); // red dashed
        }
        if (metrics.day_low != null) {
          drawHLine(Number(metrics.day_low), "hsl(145 70% 50%)", 2, 1); // green dashed
        }
      }

      // ── Session open vertical lines ────────────────────────────────────
      if (showSessions && candles.length > 1) {
        const SESSION_HOURS: { name: string; utcHour: number; color: string }[] = [
          { name: "Sydney",  utcHour: 22, color: "hsl(280 60% 55%)" },  // purple
          { name: "Tokyo",   utcHour: 0,  color: "hsl(350 80% 55%)" },  // pink
          { name: "London",  utcHour: 8,  color: "hsl(200 80% 55%)" },  // blue
          { name: "New York",utcHour: 13, color: "hsl(30 90% 55%)" },   // orange
        ];

        // Find candles at session opens and draw vertical markers
        candles.forEach((c) => {
          const d = new Date(c.candle_time);
          const utcH = d.getUTCHours();
          const utcM = d.getUTCMinutes();

          SESSION_HOURS.forEach((sess) => {
            // Match candle whose hour equals session open (within the timeframe granularity)
            if (utcH === sess.utcHour && utcM === 0) {
              const t = candleTime(c);
              // Draw a tall vertical line using a LineSeries from day_low to day_high (or candle range)
              const lo = metrics?.day_low != null ? Number(metrics.day_low) : c.low;
              const hi = metrics?.day_high != null ? Number(metrics.day_high) : c.high;
              const s = chart.addSeries(LineSeries, {
                color: sess.color,
                lineWidth: 1,
                lineStyle: 2, // dashed
                priceLineVisible: false,
                lastValueVisible: false,
              });
              s.setData([
                { time: t as any, value: lo },
                { time: (t + 1) as any, value: hi },
              ]);
            }
          });
        });
      }

      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [candles, showLevels, showSessions, showNews, metrics, signal]);

  useEffect(() => {
    const cleanup = buildChart();
    return () => {
      cleanup?.();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [buildChart]);

  return (
    <Card className="bg-card border-border/50 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={timeframe === tf ? "default" : "ghost"}
              className={`text-xs font-bold h-7 px-3 ${
                timeframe === tf
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Switch checked={showSessions} onCheckedChange={onToggleSessions} className="h-4 w-7" />
            <Label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" /> Sessions
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch checked={showLevels} onCheckedChange={onToggleLevels} className="h-4 w-7" />
            <Label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> S/R
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch checked={showNews} onCheckedChange={onToggleNews} className="h-4 w-7" />
            <Label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Newspaper className="h-3 w-3" /> News
            </Label>
          </div>
        </div>
      </div>

      {/* Chart */}
      <CardContent className="p-0">
        <div ref={chartContainerRef} className="w-full" style={{ minHeight: 500 }} />
        {candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Eye className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Awaiting candle data…</p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-border/30 flex flex-wrap gap-4 text-[10px] font-bold">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[hsl(45_100%_51%)] inline-block rounded" /> EMA 20
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[hsl(200_80%_55%)] inline-block rounded" /> EMA 50
        </span>
        {metrics && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-destructive inline-block rounded" style={{ borderTop: '2px dashed' }} /> Day High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-success inline-block rounded" style={{ borderTop: '2px dashed' }} /> Day Low
            </span>
          </>
        )}
        {showSessions && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-2 h-3 border-l-2 border-dashed border-[hsl(280_60%_55%)] inline-block" /> Sydney
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-3 border-l-2 border-dashed border-[hsl(350_80%_55%)] inline-block" /> Tokyo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-3 border-l-2 border-dashed border-[hsl(200_80%_55%)] inline-block" /> London
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-3 border-l-2 border-dashed border-[hsl(30_90%_55%)] inline-block" /> New York
            </span>
          </>
        )}
        {showLevels && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-success inline-block rounded" /> Support
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-destructive inline-block rounded" /> Resistance
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[hsl(145_70%_55%)] inline-block rounded" />
              <TrendingUp className="h-3 w-3" /> Trendline
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[hsl(280_80%_65%)] inline-block rounded" /> Wick Reject
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[hsl(145_90%_55%)] inline-block rounded" style={{ height: 3 }} /> Breakout
            </span>
          </>
        )}
      </div>
    </Card>
  );
}

function calculateEMA(candles: { candle_time: string; close: number }[], period: number) {
  const k = 2 / (period + 1);
  const result: { time: any; value: number }[] = [];
  let ema = candles[0].close;

  for (let i = 0; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    if (i >= period - 1) {
      result.push({
        time: Math.floor(new Date(candles[i].candle_time).getTime() / 1000) as any,
        value: ema,
      });
    }
  }
  return result;
}
