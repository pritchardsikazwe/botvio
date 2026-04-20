import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Wifi, WifiOff, Lock, Crosshair } from "lucide-react";
import { getDerivWebSocketUrl } from "@/config/derivEnv";
import { mapToDerivSymbol } from "@/hooks/useDerivLiveTicks";
import { useMarketSession } from "@/hooks/useMarketSession";

interface Candle {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const GRANULARITIES: { label: string; value: number }[] = [
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1H", value: 3600 },
  { label: "4H", value: 14400 },
];

interface DerivLiveChartProps {
  displaySymbol: string; // e.g. "XAU/USD"
  height?: number;
  defaultGranularity?: number;
  showHauza?: boolean; // Hauza strategy overlay (S/R, breakouts, trend)
}

export function DerivLiveChart({
  displaySymbol,
  height = 420,
  defaultGranularity = 900,
  showHauza = true,
}: DerivLiveChartProps) {
  const derivSymbol = useMemo(() => mapToDerivSymbol(displaySymbol), [displaySymbol]);
  const [granularity, setGranularity] = useState(defaultGranularity);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [hauzaOn, setHauzaOn] = useState(showHauza);
  const wsRef = useRef<WebSocket | null>(null);

  // Map display symbol → market session symbol (e.g. "XAU/USD" → "XAUUSD")
  const sessionSymbol = useMemo(() => displaySymbol.replace("/", ""), [displaySymbol]);
  const { isMarketOpen, marketType } = useMarketSession(sessionSymbol);
  const isClosed = !isMarketOpen && (marketType === "forex" || marketType === "indices");

  useEffect(() => {
    if (!derivSymbol) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const open = () => {
      if (cancelled) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(getDerivWebSocketUrl());
      } catch {
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        // Request initial candles
        ws.send(
          JSON.stringify({
            ticks_history: derivSymbol,
            adjust_start_time: 1,
            count: 120,
            end: "latest",
            granularity,
            style: "candles",
          })
        );
        // Subscribe to live ticks for last price overlay
        ws.send(JSON.stringify({ ticks: derivSymbol, subscribe: 1 }));
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.error) return;
          if (data.candles) {
            const parsed: Candle[] = data.candles.map((c: { epoch: number; open: number; high: number; low: number; close: number }) => ({
              epoch: c.epoch,
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
            }));
            setCandles(parsed);
            if (parsed.length) setLastPrice(parsed[parsed.length - 1].close);
          }
          if (data.tick) {
            const price = Number(data.tick.quote);
            setLastPrice(price);
            // Update the last candle live
            setCandles((prev) => {
              if (!prev.length) return prev;
              const next = [...prev];
              const last = { ...next[next.length - 1] };
              last.close = price;
              if (price > last.high) last.high = price;
              if (price < last.low) last.low = price;
              next[next.length - 1] = last;
              return next;
            });
          }
        } catch {
          /* noop */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (cancelled) return;
        reconnectTimer = setTimeout(open, 3000);
      };

      ws.onerror = () => {
        try { ws.close(); } catch { /* noop */ }
      };
    };

    open();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ forget_all: "ticks" })); } catch { /* noop */ }
        try { ws.send(JSON.stringify({ forget_all: "candles" })); } catch { /* noop */ }
      }
      try { ws?.close(); } catch { /* noop */ }
      wsRef.current = null;
    };
  }, [derivSymbol, granularity]);

  // Chart geometry (always compute hooks before any return)
  const W = 900;
  const H = height - 60;
  const padding = { top: 10, right: 60, bottom: 20, left: 10 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;

  const visible = candles.slice(-100);
  const minP = visible.length ? Math.min(...visible.map((c) => c.low)) : 0;
  const maxP = visible.length ? Math.max(...visible.map((c) => c.high)) : 1;
  const range = maxP - minP || 1;
  const candleW = visible.length ? (chartW / visible.length) * 0.7 : 0;
  const step = visible.length ? chartW / visible.length : 0;

  const yFor = (p: number) =>
    padding.top + chartH - ((p - minP) / range) * chartH;

  const priceLabels = useMemo(() => {
    if (!visible.length) return [] as number[];
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => minP + (range * i) / steps);
  }, [minP, range, visible.length]);

  const change = visible.length >= 2
    ? visible[visible.length - 1].close - visible[0].open
    : 0;
  const changePct = visible.length >= 2
    ? (change / visible[0].open) * 100
    : 0;
  const isUp = change >= 0;

  // ─── Hauza Strategy Overlay ───────────────────────────────────────────
  // Pivot-based S/R + linear regression trend line + breakout markers
  const hauza = useMemo(() => {
    if (!hauzaOn || visible.length < 20) return null;

    const left = 3;
    const right = 3;
    const supports: { price: number; idx: number }[] = [];
    const resistances: { price: number; idx: number }[] = [];

    for (let i = left; i < visible.length - right; i++) {
      const c = visible[i];
      let isPivotHigh = true;
      let isPivotLow = true;
      for (let k = 1; k <= left; k++) {
        if (visible[i - k].high >= c.high) isPivotHigh = false;
        if (visible[i - k].low <= c.low) isPivotLow = false;
      }
      for (let k = 1; k <= right; k++) {
        if (visible[i + k].high >= c.high) isPivotHigh = false;
        if (visible[i + k].low <= c.low) isPivotLow = false;
      }
      if (isPivotHigh) resistances.push({ price: c.high, idx: i });
      if (isPivotLow) supports.push({ price: c.low, idx: i });
    }

    // Keep top 2 most recent of each
    const topSup = supports.slice(-2);
    const topRes = resistances.slice(-2);

    // Linear regression trend on closes
    const n = visible.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    visible.forEach((c, i) => {
      sumX += i; sumY += c.close; sumXY += i * c.close; sumXX += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const trendStart = intercept;
    const trendEnd = intercept + slope * (n - 1);
    const trendDir: "up" | "down" | "flat" =
      Math.abs(slope) < (range / n) * 0.05 ? "flat" : slope > 0 ? "up" : "down";

    // Breakout detection: last candle closes beyond most recent S/R
    const last = visible[n - 1];
    const lastRes = topRes[topRes.length - 1];
    const lastSup = topSup[topSup.length - 1];
    const breakouts: { type: "up" | "down"; idx: number; price: number }[] = [];
    if (lastRes && last.close > lastRes.price && visible[n - 2]?.close <= lastRes.price) {
      breakouts.push({ type: "up", idx: n - 1, price: last.close });
    }
    if (lastSup && last.close < lastSup.price && visible[n - 2]?.close >= lastSup.price) {
      breakouts.push({ type: "down", idx: n - 1, price: last.close });
    }

    return { supports: topSup, resistances: topRes, trendStart, trendEnd, trendDir, breakouts };
  }, [hauzaOn, visible, range]);

  if (!derivSymbol) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          {displaySymbol} is not available on Deriv live feed.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground truncate">
              {displaySymbol} · Deriv Live
            </span>
            {lastPrice !== null && (
              <span className={`text-xs font-bold tabular-nums ${isUp ? "text-success" : "text-destructive"}`}>
                {lastPrice.toFixed(displaySymbol.startsWith("XAU") || displaySymbol.startsWith("BTC") ? 2 : 5)}
              </span>
            )}
            {visible.length >= 2 && (
              <Badge
                variant="outline"
                className={`text-[10px] ${isUp ? "border-success/30 text-success" : "border-destructive/30 text-destructive"}`}
              >
                {isUp ? "▲" : "▼"} {changePct.toFixed(2)}%
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {GRANULARITIES.map((g) => (
              <Button
                key={g.value}
                size="sm"
                variant={granularity === g.value ? "default" : "ghost"}
                className="h-6 text-[10px] px-2"
                onClick={() => setGranularity(g.value)}
              >
                {g.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={hauzaOn ? "default" : "ghost"}
              className={`h-6 text-[10px] px-2 ml-1 ${hauzaOn ? "bg-primary/90 hover:bg-primary text-primary-foreground" : ""}`}
              onClick={() => setHauzaOn((v) => !v)}
              title="Toggle Hauza Strategy overlay (S/R, Trend, Breakouts)"
            >
              <Crosshair className="h-2.5 w-2.5 mr-1" />
              Hauza
            </Button>
            {isClosed ? (
              <Badge variant="outline" className="text-[10px] ml-1 border-warning/40 text-warning">
                <Lock className="h-2.5 w-2.5 mr-1" />
                Market Closed
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={`text-[10px] ml-1 ${connected ? "border-success/30 text-success" : "border-muted text-muted-foreground"}`}
              >
                {connected ? <Wifi className="h-2.5 w-2.5 mr-1" /> : <WifiOff className="h-2.5 w-2.5 mr-1" />}
                {connected ? "Live" : "..."}
              </Badge>
            )}
          </div>
        </div>

        {/* SVG Chart */}
        <div style={{ height }} className="relative">
          {isClosed && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-warning mb-2" />
              <p className="text-sm font-bold text-foreground">Market Closed (Weekend)</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center px-4">
                {displaySymbol} reopens Sunday 22:00 UTC. Trade Synthetic Indices (24/7) meanwhile.
              </p>
            </div>
          )}
          {visible.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              {isClosed ? "Last close shown when market reopens" : "Connecting to Deriv live feed..."}
            </div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
              {/* Grid */}
              {priceLabels.map((p, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    x2={padding.left + chartW}
                    y1={yFor(p)}
                    y2={yFor(p)}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.3}
                    strokeDasharray="2,3"
                  />
                  <text
                    x={padding.left + chartW + 4}
                    y={yFor(p) + 3}
                    fontSize="10"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {p.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Candles */}
              {visible.map((c, i) => {
                const x = padding.left + i * step + (step - candleW) / 2;
                const cx = x + candleW / 2;
                const isGreen = c.close >= c.open;
                const color = isGreen ? "hsl(var(--success))" : "hsl(var(--destructive))";
                const bodyTop = yFor(Math.max(c.open, c.close));
                const bodyH = Math.max(1, Math.abs(yFor(c.open) - yFor(c.close)));
                return (
                  <g key={c.epoch}>
                    <line x1={cx} x2={cx} y1={yFor(c.high)} y2={yFor(c.low)} stroke={color} strokeWidth={1} />
                    <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={color} />
                  </g>
                );
              })}

              {/* Last price line */}
              {lastPrice !== null && (
                <g>
                  <line
                    x1={padding.left}
                    x2={padding.left + chartW}
                    y1={yFor(lastPrice)}
                    y2={yFor(lastPrice)}
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    strokeDasharray="4,3"
                  />
                  <rect
                    x={padding.left + chartW}
                    y={yFor(lastPrice) - 8}
                    width={56}
                    height={16}
                    fill="hsl(var(--primary))"
                  />
                  <text
                    x={padding.left + chartW + 28}
                    y={yFor(lastPrice) + 4}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="hsl(var(--primary-foreground))"
                  >
                    {lastPrice.toFixed(2)}
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
