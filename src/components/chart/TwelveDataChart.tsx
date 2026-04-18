import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createChart, IChartApi, CandlestickSeries, LineSeries, CandlestickData, Time } from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, TrendingUp, TrendingDown, Shield, RefreshCw } from "lucide-react";

const TWELVE_DATA_KEY = "a98523fef754463f9853d7ce1e9c2994";

type Interval = "1min" | "5min" | "15min" | "30min" | "1h" | "4h" | "1day" | "1week";

const INTERVAL_LABELS: Record<Interval, string> = {
  "1min": "1m", "5min": "5m", "15min": "15m", "30min": "30m",
  "1h": "1H", "4h": "4H", "1day": "D", "1week": "W",
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
    if (i === 0) { ema.push(data[0]); continue; }
    prev = data[i] * k + prev * (1 - k);
    ema.push(prev);
  }
  return ema;
}

function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
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
  const last = closes.length - 1;
  const lc = closes[last], le20 = ema20[last], le50 = ema50[last], lr = rsi[last];
  const pe20 = ema20[last - 1], pe50 = ema50[last - 1];
  let atrSum = 0;
  for (let i = Math.max(1, candles.length - 14); i < candles.length; i++) {
    const h = candles[i].high as number, l = candles[i].low as number, pc = candles[i - 1].close as number;
    atrSum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  const atr = atrSum / Math.min(14, candles.length - 1);

  if (pe20 <= pe50 && le20 > le50 && lr > 50 && lr < 70) return { type: "BUY", entry: lc, sl: +(lc - atr * 1.5).toFixed(2), tp: +(lc + atr * 2.5).toFixed(2), confidence: Math.min(85, 60 + (lr - 50)), reason: "EMA 20/50 bullish crossover with RSI confirmation" };
  if (pe20 >= pe50 && le20 < le50 && lr < 50 && lr > 30) return { type: "SELL", entry: lc, sl: +(lc + atr * 1.5).toFixed(2), tp: +(lc - atr * 2.5).toFixed(2), confidence: Math.min(85, 60 + (50 - lr)), reason: "EMA 20/50 bearish crossover with RSI confirmation" };
  if (le20 > le50 && lc > le20 && lr > 55) return { type: "BUY", entry: lc, sl: +(lc - atr * 1.2).toFixed(2), tp: +(lc + atr * 2).toFixed(2), confidence: Math.min(78, 55 + (lr - 55) * 0.5), reason: "Bullish trend continuation — price above EMA 20 & 50" };
  if (le20 < le50 && lc < le20 && lr < 45) return { type: "SELL", entry: lc, sl: +(lc + atr * 1.2).toFixed(2), tp: +(lc - atr * 2).toFixed(2), confidence: Math.min(78, 55 + (45 - lr) * 0.5), reason: "Bearish trend continuation — price below EMA 20 & 50" };
  return { type: "WAIT", entry: null, sl: null, tp: null, confidence: 30, reason: "No clear setup — wait for EMA crossover or trend confirmation" };
}

// Persistent cache using localStorage + in-memory map
const CACHE_TTL = 60_000; // 1 minute for API calls
const STORAGE_TTL = 24 * 60 * 60 * 1000; // 24h localStorage cache
const requestCache = new Map<string, { data: CandlestickData<Time>[]; timestamp: number }>();

function loadFromStorage(key: string): CandlestickData<Time>[] | null {
  try {
    const raw = localStorage.getItem(`td-${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > STORAGE_TTL) { localStorage.removeItem(`td-${key}`); return null; }
    return parsed.data;
  } catch { return null; }
}

function saveToStorage(key: string, data: CandlestickData<Time>[]) {
  try { localStorage.setItem(`td-${key}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

function generateFallbackCandles(symbol: string): CandlestickData<Time>[] {
  const basePrices: Record<string, number> = {
    "XAU/USD": 2650, "XAG/USD": 31, "EUR/USD": 1.085, "GBP/USD": 1.27,
    "USD/JPY": 150, "AUD/USD": 0.66, "BTC/USD": 68000, "ETH/USD": 3800,
  };
  const base = basePrices[symbol] || 100;
  const volatility = base * 0.003;
  const now = Math.floor(Date.now() / 1000);
  const candles: CandlestickData<Time>[] = [];
  let price = base;
  for (let i = 99; i >= 0; i--) {
    const time = (now - i * 3600) as Time;
    const change = (Math.random() - 0.48) * volatility;
    const open = price;
    const close = +(open + change).toFixed(5);
    const high = +(Math.max(open, close) + Math.random() * volatility * 0.5).toFixed(5);
    const low = +(Math.min(open, close) - Math.random() * volatility * 0.5).toFixed(5);
    candles.push({ time, open, high, low, close });
    price = close;
  }
  return candles;
}

export function TwelveDataChart({ symbol = "XAU/USD", displaySymbol, showHauzaStrategy = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [interval, setInterval_] = useState<Interval>("1h");
  const [hauzaSignal, setHauzaSignal] = useState<HauzaSignal | null>(null);

  // Map to Twelve Data symbol format
  const tdSymbol = useMemo(() => {
    const s = symbol.replace("/", "");
    const map: Record<string, string> = {
      XAUUSD: "XAU/USD", XAGUSD: "XAG/USD", BTCUSD: "BTC/USD", ETHUSD: "ETH/USD",
      EURUSD: "EUR/USD", GBPUSD: "GBP/USD", USDJPY: "USD/JPY", AUDUSD: "AUD/USD",
    };
    return map[s] || symbol;
  }, [symbol]);

  const isIntraday = !["1day", "1week"].includes(interval);

  const [dataSource, setDataSource] = useState<"live" | "cached" | "simulated">("live");

  const { data: candles, isLoading, refetch } = useQuery({
    queryKey: ["td-chart", tdSymbol, interval],
    queryFn: async () => {
      const cacheKey = `${tdSymbol}-${interval}`;

      // 1. Check in-memory cache
      const memCached = requestCache.get(cacheKey);
      if (memCached && Date.now() - memCached.timestamp < CACHE_TTL) {
        setDataSource("cached");
        return memCached.data;
      }

      // 2. Try API
      try {
        const params = new URLSearchParams({
          symbol: tdSymbol, interval, outputsize: "100", apikey: TWELVE_DATA_KEY,
        });
        const res = await fetch(`https://api.twelvedata.com/time_series?${params}`);
        const json = await res.json();

        if (json.status !== "error" && json.values && Array.isArray(json.values)) {
          const result: CandlestickData<Time>[] = json.values.map((v: any) => ({
            time: (Math.floor(new Date(v.datetime).getTime() / 1000)) as Time,
            open: parseFloat(v.open), high: parseFloat(v.high),
            low: parseFloat(v.low), close: parseFloat(v.close),
          })).filter((c: any) => !isNaN(c.open)).sort((a: any, b: any) => (a.time as number) - (b.time as number));

          requestCache.set(cacheKey, { data: result, timestamp: Date.now() });
          saveToStorage(cacheKey, result);
          setDataSource("live");
          return result;
        }
        console.warn("TwelveData API:", json.message || "No values");
      } catch (e) {
        console.warn("TwelveData fetch error:", e);
      }

      // 3. Fallback: localStorage cache
      const stored = loadFromStorage(cacheKey);
      if (stored && stored.length > 0) {
        requestCache.set(cacheKey, { data: stored, timestamp: Date.now() });
        setDataSource("cached");
        return stored;
      }

      // 4. Fallback: simulated data so chart always renders
      const fallback = generateFallbackCandles(tdSymbol);
      requestCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
      setDataSource("simulated");
      return fallback;
    },
    staleTime: CACHE_TTL,
    refetchInterval: 90_000,
    retry: 1,
  });

  useEffect(() => {
    if (!containerRef.current || !candles?.length) return;
    if (chartRef.current) chartRef.current.remove();

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "rgba(255, 255, 255, 0.6)", attributionLogo: false },
      grid: { vertLines: { color: "rgba(255, 255, 255, 0.04)" }, horzLines: { color: "rgba(255, 255, 255, 0.04)" } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "rgba(255, 255, 255, 0.1)" },
      timeScale: { borderColor: "rgba(255, 255, 255, 0.1)", timeVisible: isIntraday },
    });
    chartRef.current = chart;

    const cs = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(142, 76%, 36%)", downColor: "hsl(0, 84%, 60%)",
      borderUpColor: "hsl(142, 76%, 36%)", borderDownColor: "hsl(0, 84%, 60%)",
      wickUpColor: "hsl(142, 76%, 36%)", wickDownColor: "hsl(0, 84%, 60%)",
    });
    cs.setData(candles);

    if (candles.length >= 50) {
      const closes = candles.map(c => c.close as number);
      const ema20 = computeEMA(closes, 20);
      const ema50 = computeEMA(closes, 50);
      const e20s = chart.addSeries(LineSeries, { color: "hsl(45, 100%, 51%)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      e20s.setData(candles.map((c, i) => ({ time: c.time, value: ema20[i] })));
      const e50s = chart.addSeries(LineSeries, { color: "hsl(271, 91%, 65%)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      e50s.setData(candles.map((c, i) => ({ time: c.time, value: ema50[i] })));
    }

    chart.timeScale().fitContent();

    if (showHauzaStrategy && candles.length >= 20) {
      const signal = computeHauzaSignal(candles);
      setHauzaSignal(signal);
      if (signal.entry && signal.sl && signal.tp) {
        const lastTime = candles[candles.length - 1].time;
        const refTime = candles[Math.max(0, candles.length - 10)].time;
        const slLine = chart.addSeries(LineSeries, { color: "hsl(0, 84%, 60%)", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: true });
        slLine.setData([{ time: refTime, value: signal.sl }, { time: lastTime, value: signal.sl }]);
        const tpLine = chart.addSeries(LineSeries, { color: "hsl(142, 76%, 36%)", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: true });
        tpLine.setData([{ time: refTime, value: signal.tp }, { time: lastTime, value: signal.tp }]);
      }
    }

    const handleResize = () => chart.applyOptions({ width: containerRef.current!.clientWidth });
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); chart.remove(); chartRef.current = null; };
  }, [candles, isIntraday, showHauzaStrategy]);

  return (
    <div className="space-y-3">
      {/* Timeframe Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-bold">Timeframe:</span>
        {(Object.keys(INTERVAL_LABELS) as Interval[]).map((t) => (
          <Button key={t} size="sm" variant={interval === t ? "default" : "outline"}
            className={`text-xs h-7 px-3 font-bold ${interval === t ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setInterval_(t)}>{INTERVAL_LABELS[t]}</Button>
        ))}
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3" />
        </Button>
        <Badge variant="outline" className={`text-[10px] ml-auto ${dataSource === "live" ? "border-success/30 text-success" : dataSource === "cached" ? "border-primary/30 text-primary" : "border-warning/30 text-warning"}`}>
          {dataSource === "live" ? "● Live" : dataSource === "cached" ? "● Cached" : "● Simulated"}
        </Badge>
      </div>

      {/* Hauza Signal Banner */}
      {showHauzaStrategy && hauzaSignal && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${
          hauzaSignal.type === "BUY" ? "border-success/50 bg-success/5" : hauzaSignal.type === "SELL" ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"
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
              }`}>{hauzaSignal.type} {displaySymbol || symbol}</span>
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
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-destructive inline-block" /> Stop Loss</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-success inline-block" /> Take Profit</span>
          </>
        )}
      </div>
    </div>
  );
}
