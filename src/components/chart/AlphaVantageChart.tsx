import { useEffect, useRef, useState, useMemo } from "react";
import { createChart, IChartApi, CandlestickSeries, LineSeries, CandlestickData, Time } from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, TrendingUp, TrendingDown, Shield, Zap, RefreshCw } from "lucide-react";

type Interval = "1min" | "5min" | "15min" | "30min" | "60min" | "daily" | "weekly";

const INTERVAL_LABELS: Record<Interval, string> = {
  "1min": "1m",
  "5min": "5m",
  "15min": "15m",
  "30min": "30m",
  "60min": "1H",
  "daily": "D",
  "weekly": "W",
};

interface Props {
  symbol?: string;
  displaySymbol?: string;
  showHauzaStrategy?: boolean;
}

interface HauzaSignal {
  type: "BUY" | "SELL" | "WAIT";
  entry: number | null;
  sl: number | null;
  tp: number | null;
  confidence: number;
  reason: string;
}

function computeEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prev = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[0]);
      continue;
    }
    prev = data[i] * k + prev * (1 - k);
    ema.push(prev);
  }
  return ema;
}

function computeRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function computeHauzaSignal(candles: CandlestickData<Time>[]): HauzaSignal {
  if (candles.length < 50) return { type: "WAIT", entry: null, sl: null, tp: null, confidence: 0, reason: "Insufficient data" };

  const closes = candles.map(c => c.close as number);
  const ema20 = computeEMA(closes, 20);
  const ema50 = computeEMA(closes, 50);
  const rsi = computeRSI(closes);
  const lastIdx = closes.length - 1;
  const lastClose = closes[lastIdx];
  const lastEma20 = ema20[lastIdx];
  const lastEma50 = ema50[lastIdx];
  const lastRsi = rsi[lastIdx];
  const prevEma20 = ema20[lastIdx - 1];
  const prevEma50 = ema50[lastIdx - 1];

  // Botvio AI Strategy: EMA crossover + RSI confirmation
  const bullishCross = prevEma20 <= prevEma50 && lastEma20 > lastEma50;
  const bearishCross = prevEma20 >= prevEma50 && lastEma20 < lastEma50;
  const bullishTrend = lastEma20 > lastEma50 && lastClose > lastEma20;
  const bearishTrend = lastEma20 < lastEma50 && lastClose < lastEma20;

  // Calculate ATR for SL/TP
  let atrSum = 0;
  for (let i = Math.max(1, candles.length - 14); i < candles.length; i++) {
    const h = candles[i].high as number;
    const l = candles[i].low as number;
    const pc = candles[i - 1].close as number;
    atrSum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  const atr = atrSum / Math.min(14, candles.length - 1);

  if (bullishCross && lastRsi > 50 && lastRsi < 70) {
    return {
      type: "BUY",
      entry: lastClose,
      sl: +(lastClose - atr * 1.5).toFixed(2),
      tp: +(lastClose + atr * 2.5).toFixed(2),
      confidence: Math.min(85, 60 + (lastRsi - 50)),
      reason: "EMA 20/50 bullish crossover with RSI confirmation",
    };
  }
  if (bearishCross && lastRsi < 50 && lastRsi > 30) {
    return {
      type: "SELL",
      entry: lastClose,
      sl: +(lastClose + atr * 1.5).toFixed(2),
      tp: +(lastClose - atr * 2.5).toFixed(2),
      confidence: Math.min(85, 60 + (50 - lastRsi)),
      reason: "EMA 20/50 bearish crossover with RSI confirmation",
    };
  }
  if (bullishTrend && lastRsi > 55) {
    return {
      type: "BUY",
      entry: lastClose,
      sl: +(lastClose - atr * 1.2).toFixed(2),
      tp: +(lastClose + atr * 2).toFixed(2),
      confidence: Math.min(78, 55 + (lastRsi - 55) * 0.5),
      reason: "Bullish trend continuation — price above EMA 20 & 50",
    };
  }
  if (bearishTrend && lastRsi < 45) {
    return {
      type: "SELL",
      entry: lastClose,
      sl: +(lastClose + atr * 1.2).toFixed(2),
      tp: +(lastClose - atr * 2).toFixed(2),
      confidence: Math.min(78, 55 + (45 - lastRsi) * 0.5),
      reason: "Bearish trend continuation — price below EMA 20 & 50",
    };
  }

  return { type: "WAIT", entry: null, sl: null, tp: null, confidence: 30, reason: "No clear setup — wait for EMA crossover or trend confirmation" };
}

export function AlphaVantageChart({ symbol = "XAUUSD", displaySymbol, showHauzaStrategy = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [interval, setInterval_] = useState<Interval>("60min");
  const [hauzaSignal, setHauzaSignal] = useState<HauzaSignal | null>(null);

  // Map symbol for Alpha Vantage
  const avSymbol = useMemo(() => {
    const map: Record<string, { from: string; to: string }> = {
      XAUUSD: { from: "XAU", to: "USD" },
      XAGUSD: { from: "XAG", to: "USD" },
      EURUSD: { from: "EUR", to: "USD" },
      GBPUSD: { from: "GBP", to: "USD" },
      USDJPY: { from: "USD", to: "JPY" },
      AUDUSD: { from: "AUD", to: "USD" },
      BTCUSD: { from: "BTC", to: "USD" },
      ETHUSD: { from: "ETH", to: "USD" },
    };
    return map[symbol.replace("/", "")] || { from: symbol.slice(0, 3), to: symbol.slice(3, 6) || "USD" };
  }, [symbol]);

  const isIntraday = !["daily", "weekly"].includes(interval);

  const { data: candles, isLoading, refetch } = useQuery({
    queryKey: ["av-chart", avSymbol.from, avSymbol.to, interval],
    queryFn: async () => {
      const fn = isIntraday ? "FX_INTRADAY" : interval === "daily" ? "FX_DAILY" : "FX_WEEKLY";
      const params = new URLSearchParams({
        function: fn,
        from_symbol: avSymbol.from,
        to_symbol: avSymbol.to,
        apikey: "MFDKRYAY4WAZLR2T",
        outputsize: "compact",
      });
      if (isIntraday) params.set("interval", interval);

      const res = await fetch(`https://www.alphavantage.co/query?${params}`);
      const json = await res.json();

      // Find the time series key
      const tsKey = Object.keys(json).find(k => k.startsWith("Time Series"));
      if (!tsKey || !json[tsKey]) return [];

      const series = json[tsKey];
      const result: CandlestickData<Time>[] = [];

      for (const [dateStr, values] of Object.entries(series) as [string, any][]) {
        const o = parseFloat(values["1. open"]);
        const h = parseFloat(values["2. high"]);
        const l = parseFloat(values["3. low"]);
        const c = parseFloat(values["4. close"]);
        if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) continue;
        
        // Convert to timestamp
        const time = (Math.floor(new Date(dateStr).getTime() / 1000)) as Time;
        result.push({ time, open: o, high: h, low: l, close: c });
      }

      return result.sort((a, b) => (a.time as number) - (b.time as number));
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Render chart
  useEffect(() => {
    if (!containerRef.current || !candles?.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.6)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "rgba(255, 255, 255, 0.1)" },
      timeScale: { borderColor: "rgba(255, 255, 255, 0.1)", timeVisible: isIntraday },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(142, 76%, 36%)",
      downColor: "hsl(0, 84%, 60%)",
      borderUpColor: "hsl(142, 76%, 36%)",
      borderDownColor: "hsl(0, 84%, 60%)",
      wickUpColor: "hsl(142, 76%, 36%)",
      wickDownColor: "hsl(0, 84%, 60%)",
    });

    candleSeries.setData(candles);

    // Add EMA 20 & 50 overlays
    if (candles.length >= 50) {
      const closes = candles.map(c => c.close as number);
      const ema20 = computeEMA(closes, 20);
      const ema50 = computeEMA(closes, 50);

      const ema20Series = chart.addSeries(LineSeries, {
        color: "hsl(45, 100%, 51%)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      ema20Series.setData(candles.map((c, i) => ({ time: c.time, value: ema20[i] })));

      const ema50Series = chart.addSeries(LineSeries, {
        color: "hsl(271, 91%, 65%)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      ema50Series.setData(candles.map((c, i) => ({ time: c.time, value: ema50[i] })));
    }

    chart.timeScale().fitContent();

    // Compute Hauza signal
    if (showHauzaStrategy && candles.length >= 20) {
      const signal = computeHauzaSignal(candles);
      setHauzaSignal(signal);

      // Draw SL/TP lines
      if (signal.entry && signal.sl && signal.tp) {
        const slLine = chart.addSeries(LineSeries, {
          color: "hsl(0, 84%, 60%)",
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        slLine.setData([
          { time: candles[candles.length - 10]?.time || candles[candles.length - 1].time, value: signal.sl },
          { time: candles[candles.length - 1].time, value: signal.sl },
        ]);

        const tpLine = chart.addSeries(LineSeries, {
          color: "hsl(142, 76%, 36%)",
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        tpLine.setData([
          { time: candles[candles.length - 10]?.time || candles[candles.length - 1].time, value: signal.tp },
          { time: candles[candles.length - 1].time, value: signal.tp },
        ]);
      }
    }

    const handleResize = () => chart.applyOptions({ width: containerRef.current!.clientWidth });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, isIntraday, showHauzaStrategy]);

  return (
    <div className="space-y-3">
      {/* Timeframe Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-bold">Timeframe:</span>
        {(Object.keys(INTERVAL_LABELS) as Interval[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={interval === t ? "default" : "outline"}
            className={`text-xs h-7 px-3 font-bold ${interval === t ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setInterval_(t)}
          >
            {INTERVAL_LABELS[t]}
          </Button>
        ))}
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3" />
        </Button>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary ml-auto">
          Alpha Vantage Live
        </Badge>
      </div>

      {/* Hauza Signal Banner */}
      {showHauzaStrategy && hauzaSignal && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${
          hauzaSignal.type === "BUY" 
            ? "border-success/50 bg-success/5" 
            : hauzaSignal.type === "SELL" 
            ? "border-destructive/50 bg-destructive/5" 
            : "border-warning/50 bg-warning/5"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hauzaSignal.type === "BUY" ? "bg-success/20" : hauzaSignal.type === "SELL" ? "bg-destructive/20" : "bg-warning/20"
            }`}>
              {hauzaSignal.type === "BUY" ? <TrendingUp className="h-5 w-5 text-success" /> :
               hauzaSignal.type === "SELL" ? <TrendingDown className="h-5 w-5 text-destructive" /> :
               <Shield className="h-5 w-5 text-warning" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Crosshair className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Botvio AI Strategy</span>
              </div>
              <span className={`text-lg font-black ${
                hauzaSignal.type === "BUY" ? "text-success" : hauzaSignal.type === "SELL" ? "text-destructive" : "text-warning"
              }`}>
                {hauzaSignal.type} {displaySymbol || symbol}
              </span>
              <p className="text-[10px] text-muted-foreground">{hauzaSignal.reason}</p>
            </div>
          </div>
          {hauzaSignal.entry && (
            <div className="text-right space-y-0.5 shrink-0">
              <div className="text-[10px]"><span className="text-muted-foreground">Entry </span><span className="font-mono font-bold text-foreground">{hauzaSignal.entry}</span></div>
              <div className="text-[10px]"><span className="text-muted-foreground">SL </span><span className="font-mono font-bold text-destructive">{hauzaSignal.sl}</span></div>
              <div className="text-[10px]"><span className="text-muted-foreground">TP </span><span className="font-mono font-bold text-success">{hauzaSignal.tp}</span></div>
              <Badge variant="outline" className="text-[10px]">{hauzaSignal.confidence}% conf</Badge>
            </div>
          )}
        </div>
      )}

      {/* Chart Container */}
      <Card className="bg-card border-border/50 overflow-hidden">
        {isLoading ? (
          <Skeleton className="w-full h-[60vh] min-h-[400px]" />
        ) : (
          <div ref={containerRef} className="w-full h-[60vh] min-h-[400px] max-h-[700px]" />
        )}
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(45,100%,51%)] inline-block" /> EMA 20</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(271,91%,65%)] inline-block" /> EMA 50</span>
        {showHauzaStrategy && (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-destructive inline-block border-dashed" /> Stop Loss</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-success inline-block border-dashed" /> Take Profit</span>
          </>
        )}
      </div>
    </div>
  );
}
