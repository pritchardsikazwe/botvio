import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Crosshair,
  Wifi,
  WifiOff,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { getDerivPublicWebSocketUrl } from "@/config/derivEnv";
import { mapToDerivSymbol } from "@/hooks/useDerivLiveTicks";
import { useMarketSession } from "@/hooks/useMarketSession";
import { detectSupportResistance, detectBreakouts, type PriceLevel } from "@/lib/chartAnalysis";
import { useSendScalpSignal } from "@/hooks/useSendScalpSignal";

interface Candle {
  candle_time: string;
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

type ScalpSignal = {
  id: string;
  time: number;
  type: "breakout_up" | "breakout_down" | "support_break" | "resistance_break";
  level: number;
  price: number;
  tf: "1m" | "5m";
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  confidence: number;
};

const TIMEFRAMES: { label: "1m" | "5m"; seconds: number }[] = [
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
];

interface BotvioScalpRobotProps {
  displaySymbol: string;        // e.g. "XAU/USD", "EUR/USD", "BTC/USD", "XAG/USD"
  assetLabel?: string;          // friendly label, e.g. "Gold", "Silver", "Bitcoin"
  cryptoAlwaysOpen?: boolean;   // if true, ignore market-session gating (crypto trades 24/7)
}

/**
 * Botvio Scalp Robot — fetches 1m & 5m candles from Deriv, detects:
 *   - Breakouts (close above recent high / below recent low)
 *   - Support / Resistance breaks (using pivot S/R clustering)
 * Generates ready-to-execute scalp setups with SL/TP based on ATR-style range.
 */
export function BotvioScalpRobot({ displaySymbol, assetLabel, cryptoAlwaysOpen = false }: BotvioScalpRobotProps) {
  const derivSymbol = useMemo(() => mapToDerivSymbol(displaySymbol), [displaySymbol]);
  const sessionSymbol = useMemo(() => displaySymbol.replace("/", ""), [displaySymbol]);
  const { isMarketOpen, marketType } = useMarketSession(sessionSymbol);
  const isClosed = !cryptoAlwaysOpen && !isMarketOpen && (marketType === "forex" || marketType === "indices");
  const { sendToMt5, sendToDeriv, busyMt5, busyDeriv } = useSendScalpSignal();

  const [activeTf, setActiveTf] = useState<"1m" | "5m">("1m");
  const [candlesByTf, setCandlesByTf] = useState<Record<string, Candle[]>>({ "1m": [], "5m": [] });
  const [signals, setSignals] = useState<ScalpSignal[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seenSignalIds = useRef<Set<string>>(new Set());

  // ── WebSocket: subscribe to 1m + 5m candle streams ──
  useEffect(() => {
    if (!derivSymbol || isClosed) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const open = () => {
      if (cancelled) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(getDerivPublicWebSocketUrl());
      } catch {
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        // Request initial history + subscribe for both TFs
        TIMEFRAMES.forEach((tf, idx) => {
          ws.send(
            JSON.stringify({
              ticks_history: derivSymbol,
              adjust_start_time: 1,
              count: 80,
              end: "latest",
              granularity: tf.seconds,
              style: "candles",
              subscribe: 1,
              req_id: 1000 + idx, // 1000 = 1m, 1001 = 5m
            })
          );
        });
        // Live last price
        ws.send(JSON.stringify({ ticks: derivSymbol, subscribe: 1, req_id: 999 }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          // Live tick
          if (msg.msg_type === "tick" && msg.tick?.quote != null) {
            setLastPrice(Number(msg.tick.quote));
            return;
          }

          // Initial candles batch
          if (msg.msg_type === "candles" && Array.isArray(msg.candles)) {
            const tfLabel: "1m" | "5m" = msg.req_id === 1000 ? "1m" : "5m";
            const mapped: Candle[] = msg.candles.map((c: any) => ({
              epoch: c.epoch,
              candle_time: new Date(c.epoch * 1000).toISOString(),
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
            }));
            setCandlesByTf((prev) => ({ ...prev, [tfLabel]: mapped }));
            return;
          }

          // Live OHLC update
          if (msg.msg_type === "ohlc" && msg.ohlc) {
            const o = msg.ohlc;
            const tfLabel: "1m" | "5m" = Number(o.granularity) === 60 ? "1m" : "5m";
            const newCandle: Candle = {
              epoch: Number(o.open_time),
              candle_time: new Date(Number(o.open_time) * 1000).toISOString(),
              open: Number(o.open),
              high: Number(o.high),
              low: Number(o.low),
              close: Number(o.close),
            };
            setCandlesByTf((prev) => {
              const arr = [...(prev[tfLabel] ?? [])];
              const lastIdx = arr.length - 1;
              if (lastIdx >= 0 && arr[lastIdx].epoch === newCandle.epoch) {
                arr[lastIdx] = newCandle;
              } else {
                arr.push(newCandle);
                if (arr.length > 120) arr.shift();
              }
              return { ...prev, [tfLabel]: arr };
            });
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(open, 3000);
        }
      };
      ws.onerror = () => {
        try { ws.close(); } catch { /* noop */ }
      };
    };

    open();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { wsRef.current?.close(); } catch { /* noop */ }
      wsRef.current = null;
    };
  }, [derivSymbol, isClosed]);

  // ── Detect signals whenever candles update ──
  useEffect(() => {
    const newSignals: ScalpSignal[] = [];

    (["1m", "5m"] as const).forEach((tf) => {
      const candles = candlesByTf[tf];
      if (!candles || candles.length < 20) return;

      // S/R levels for this TF (tighter tolerance for scalping)
      const levels: PriceLevel[] = detectSupportResistance(candles, tf === "1m" ? 3 : 4, 0.0005);

      // Recent N-bar high/low breakout (Donchian-style)
      const lookback = tf === "1m" ? 15 : 12;
      const recent = candles.slice(-lookback - 2, -2); // exclude current + last closed
      const lastClosed = candles[candles.length - 2];
      const current = candles[candles.length - 1];
      if (!lastClosed || !current || recent.length < 5) return;

      const recentHigh = Math.max(...recent.map((c) => c.high));
      const recentLow = Math.min(...recent.map((c) => c.low));

      // ATR-ish range for SL/TP sizing
      const ranges = candles.slice(-14).map((c) => c.high - c.low);
      const atr = ranges.reduce((s, r) => s + r, 0) / Math.max(ranges.length, 1);
      const slDist = Math.max(atr * 0.8, 0.0001);

      // ── Donchian breakout ──
      if (lastClosed.close > recentHigh) {
        const id = `${tf}-bo-up-${lastClosed.epoch}`;
        const entry = lastClosed.close;
        newSignals.push({
          id,
          time: lastClosed.epoch,
          type: "breakout_up",
          level: recentHigh,
          price: entry,
          tf,
          entry,
          sl: entry - slDist,
          tp1: entry + slDist * 1.5,
          tp2: entry + slDist * 2.5,
          confidence: 78,
        });
      }
      if (lastClosed.close < recentLow) {
        const id = `${tf}-bo-dn-${lastClosed.epoch}`;
        const entry = lastClosed.close;
        newSignals.push({
          id,
          time: lastClosed.epoch,
          type: "breakout_down",
          level: recentLow,
          price: entry,
          tf,
          entry,
          sl: entry + slDist,
          tp1: entry - slDist * 1.5,
          tp2: entry - slDist * 2.5,
          confidence: 78,
        });
      }

      // ── S/R break (price closes through a clustered S/R level) ──
      const breakouts = detectBreakouts(candles.slice(-10), levels, 0.0003);
      breakouts.forEach((b) => {
        const id = `${tf}-srbreak-${b.direction}-${b.time}`;
        const entry = current.close ?? lastClosed.close;
        const isUp = b.direction === "up";
        newSignals.push({
          id,
          time: b.time,
          type: isUp ? "resistance_break" : "support_break",
          level: b.price,
          price: entry,
          tf,
          entry,
          sl: isUp ? entry - slDist : entry + slDist,
          tp1: isUp ? entry + slDist * 1.5 : entry - slDist * 1.5,
          tp2: isUp ? entry + slDist * 2.5 : entry - slDist * 2.5,
          confidence: 82,
        });
      });
    });

    if (newSignals.length === 0) return;

    setSignals((prev) => {
      const merged = [...prev];
      newSignals.forEach((sig) => {
        if (!seenSignalIds.current.has(sig.id)) {
          seenSignalIds.current.add(sig.id);
          merged.unshift(sig);
        }
      });
      // Cap at 8 most recent
      return merged.slice(0, 8);
    });
  }, [candlesByTf]);

  // ── Filter signals by active TF ──
  const visibleSignals = useMemo(
    () => signals.filter((s) => s.tf === activeTf),
    [signals, activeTf]
  );

  const formatPrice = (p: number) => p.toFixed(displaySymbol.includes("JPY") ? 3 : 2);
  const timeAgo = (epoch: number) => {
    const diff = Math.floor(Date.now() / 1000 - epoch);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const signalMeta = (type: ScalpSignal["type"]) => {
    switch (type) {
      case "breakout_up":
        return { label: "BREAKOUT ↑", color: "text-success", bg: "bg-success/10", border: "border-success/30", icon: ArrowUpRight, side: "BUY" as const };
      case "breakout_down":
        return { label: "BREAKOUT ↓", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: ArrowDownRight, side: "SELL" as const };
      case "resistance_break":
        return { label: "RESISTANCE BREAK", color: "text-success", bg: "bg-success/10", border: "border-success/30", icon: TrendingUp, side: "BUY" as const };
      case "support_break":
        return { label: "SUPPORT BREAK", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: TrendingDown, side: "SELL" as const };
    }
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-primary/30">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                Botvio Scalp Robot{assetLabel ? ` · ${assetLabel}` : ""}
                <Badge variant="outline" className="text-[9px] border-primary/40 text-primary px-1.5 py-0">AI</Badge>
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {displaySymbol} · Breakout & S/R break · 1m / 5m
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isClosed ? (
              <Badge variant="outline" className="text-[10px] border-warning/40 text-warning gap-1">
                <Clock className="h-3 w-3" /> CLOSED
              </Badge>
            ) : connected ? (
              <Badge variant="outline" className="text-[10px] border-success/40 text-success gap-1 animate-pulse">
                <Wifi className="h-3 w-3" /> LIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground gap-1">
                <WifiOff className="h-3 w-3" /> CONNECTING…
              </Badge>
            )}
            {lastPrice != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                ${formatPrice(lastPrice)}
              </Badge>
            )}
          </div>
        </div>

        {/* TF switcher */}
        <div className="flex items-center gap-2">
          {TIMEFRAMES.map((tf) => {
            const isActive = activeTf === tf.label;
            const count = signals.filter((s) => s.tf === tf.label).length;
            return (
              <Button
                key={tf.label}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTf(tf.label)}
                className={`h-8 text-xs font-bold gap-1.5 ${isActive ? "bg-primary text-primary-foreground" : ""}`}
              >
                <Zap className="h-3 w-3" />
                {tf.label} Scalp
                {count > 0 && (
                  <span className={`ml-1 text-[10px] px-1.5 py-0 rounded-full ${isActive ? "bg-primary-foreground/20" : "bg-primary/15 text-primary"}`}>
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Closed banner */}
        {isClosed && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-warning">Market Closed</p>
              <p className="text-[10px] text-muted-foreground">
                Scalp robot pauses on weekends. Resumes Monday at market open.
              </p>
            </div>
          </div>
        )}

        {/* Signals list */}
        {!isClosed && (
          <div className="space-y-2">
            {visibleSignals.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Scanning {activeTf} candles…</p>
                  <p className="text-[10px] text-muted-foreground">
                    Waiting for breakout above recent high or break of S/R zone.
                  </p>
                </div>
              </div>
            ) : (
              visibleSignals.map((sig) => {
                const meta = signalMeta(sig.type);
                const Icon = meta.icon;
                return (
                  <div
                    key={sig.id}
                    className={`rounded-lg border ${meta.border} ${meta.bg} p-3 animate-in fade-in slide-in-from-top-1`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                        <span className={`text-xs font-extrabold ${meta.color}`}>{meta.label}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{sig.tf}</Badge>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${meta.side === "BUY" ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}`}
                        >
                          {meta.side}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(sig.time)}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[10px]">
                      <div>
                        <p className="text-muted-foreground">Entry</p>
                        <p className="font-mono font-bold text-foreground">${formatPrice(sig.entry)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Level</p>
                        <p className="font-mono font-bold text-foreground">${formatPrice(sig.level)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SL</p>
                        <p className="font-mono font-bold text-destructive">${formatPrice(sig.sl)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">TP1 / TP2</p>
                        <p className="font-mono font-bold text-success">
                          ${formatPrice(sig.tp1)} / ${formatPrice(sig.tp2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground">
                          Confidence <span className="font-bold text-primary">{sig.confidence}%</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        RR ≈ 1:1.5 / 1:2.5
                      </span>
                    </div>

                    {/* Execute buttons */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busyMt5}
                        className="h-7 text-[10px] flex-1 font-bold"
                        onClick={() =>
                          sendToMt5({
                            displaySymbol,
                            derivSymbol,
                            direction: meta.side,
                            entry: sig.entry,
                            sl: sig.sl,
                            tp: sig.tp1,
                            source: `scalp-${displaySymbol.replace("/", "")}-${sig.tf}`,
                          })
                        }
                      >
                        <Zap className="h-3 w-3 mr-1" /> Send to MT5
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyDeriv || !derivSymbol}
                        className="h-7 text-[10px] flex-1 font-bold border-primary/40 text-primary hover:bg-primary/10"
                        onClick={() =>
                          sendToDeriv({
                            displaySymbol,
                            derivSymbol,
                            direction: meta.side,
                            entry: sig.entry,
                            sl: sig.sl,
                            tp: sig.tp1,
                            defaultStake: 1,
                            defaultMultiplier: 100,
                            source: `scalp-${displaySymbol.replace("/", "")}-${sig.tf}`,
                          })
                        }
                      >
                        <Target className="h-3 w-3 mr-1" /> Trade on Deriv
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-start gap-2 pt-2 border-t border-border/40">
          <Crosshair className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">How it works:</span> The robot watches live {activeTf} candles, flags breakouts above the last {activeTf === "1m" ? "15" : "12"}-bar high/low and clean breaks of clustered support/resistance. SL/TP auto-sized from ATR. Use only during London/NY sessions for best fills.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
