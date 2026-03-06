import { useRef, useEffect, useCallback } from "react";
import { createChart, ColorType, LineSeries, CandlestickSeries } from "lightweight-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BarChart3, Eye, Newspaper, Clock } from "lucide-react";

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

    // Clear previous
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
      rightPriceScale: {
        borderColor: "hsl(220 15% 18%)",
      },
      timeScale: {
        borderColor: "hsl(220 15% 18%)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    // Candlestick series
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
        time: Math.floor(new Date(c.candle_time).getTime() / 1000) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeries.setData(data);

      // EMA 20
      if (candles.length >= 20) {
        const ema20Data = calculateEMA(candles, 20);
        const ema20Series = chart.addSeries(LineSeries, {
          color: "hsl(45 100% 51%)",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ema20Series.setData(ema20Data);
      }

      // EMA 50
      if (candles.length >= 50) {
        const ema50Data = calculateEMA(candles, 50);
        const ema50Series = chart.addSeries(LineSeries, {
          color: "hsl(200 80% 55%)",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ema50Series.setData(ema50Data);
      }

      // Support / Resistance lines
      if (showLevels && metrics) {
        const levels = [
          { price: metrics.support_1, color: "hsl(145 70% 45%)", label: "S1" },
          { price: metrics.support_2, color: "hsl(145 70% 35%)", label: "S2" },
          { price: metrics.resistance_1, color: "hsl(0 85% 55%)", label: "R1" },
          { price: metrics.resistance_2, color: "hsl(0 85% 45%)", label: "R2" },
        ];
        levels.forEach((lvl) => {
          if (lvl.price != null) {
            const lineSeries = chart.addSeries(LineSeries, {
              color: lvl.color,
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            const firstTime = Math.floor(new Date(candles[0].candle_time).getTime() / 1000) as any;
            const lastTime = Math.floor(new Date(candles[candles.length - 1].candle_time).getTime() / 1000) as any;
            lineSeries.setData([
              { time: firstTime, value: Number(lvl.price) },
              { time: lastTime, value: Number(lvl.price) },
            ]);
          }
        });
      }

      // Signal entry/SL/TP lines
      if (showLevels && signal) {
        const signalLines = [
          { price: signal.entry_price, color: "hsl(45 100% 51%)", label: "Entry" },
          { price: signal.stop_loss, color: "hsl(0 85% 55%)", label: "SL" },
          { price: signal.take_profit_1, color: "hsl(145 70% 45%)", label: "TP1" },
        ];
        signalLines.forEach((sl) => {
          if (sl.price != null) {
            const lineSeries = chart.addSeries(LineSeries, {
              color: sl.color,
              lineWidth: 2,
              lineStyle: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            const firstTime = Math.floor(new Date(candles[0].candle_time).getTime() / 1000) as any;
            const lastTime = Math.floor(new Date(candles[candles.length - 1].candle_time).getTime() / 1000) as any;
            lineSeries.setData([
              { time: firstTime, value: Number(sl.price) },
              { time: lastTime, value: Number(sl.price) },
            ]);
          }
        });
      }

      // Signal markers (lightweight-charts v5 uses attachPrimitive or we skip markers for compatibility)
      // Markers not available in v5 CandlestickSeries API; signal lines already shown above

      chart.timeScale().fitContent();
    }

    // Resize handler
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
        {/* Timeframe buttons */}
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

        {/* Toggles */}
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
        {showLevels && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-success inline-block rounded border-dashed" /> Support
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-destructive inline-block rounded" /> Resistance
            </span>
          </>
        )}
      </div>
    </Card>
  );
}

// Compute EMA
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
