import { useEffect, useMemo, useRef, useState } from "react";
import { applyTick, trimCandles, upsertCandle } from "@/lib/marketData/candles";
import { createMarketDataAdapter } from "@/lib/marketData/registry";
import {
  timeframeSeconds,
  type FeedDiagnostics,
  type FeedStatus,
  type MarketDataSource,
  type NormalizedCandle,
  type NormalizedTick,
  type Timeframe,
} from "@/lib/marketData/types";

interface UseMarketFeedArgs {
  source: MarketDataSource;
  feedSymbol: string | null;
  timeframe: Timeframe;
  historyLimit?: number;
  /** UI flush interval — keeps React re-renders bounded on fast feeds. */
  flushMs?: number;
  enabled?: boolean;
}

const MAX_CANDLES = 1000;

/**
 * Subscribes to a market-data adapter and exposes the normalized dataset that
 * the chart, indicators and signal engine all share.
 *
 * Incoming ticks mutate a ref and are flushed to React on an interval, so a
 * high-frequency feed never triggers a render per tick and history is never
 * re-fetched on a tick.
 */
export function useMarketFeed({
  source,
  feedSymbol,
  timeframe,
  historyLimit = 400,
  flushMs = 400,
  enabled = true,
}: UseMarketFeedArgs) {
  const [candles, setCandles] = useState<NormalizedCandle[]>([]);
  const [lastTick, setLastTick] = useState<NormalizedTick | null>(null);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [meta, setMeta] = useState<{
    sourceLabel: string;
    wsState: string;
    apiStatus: string;
    lastError: string | null;
    serverTimeMs: number | null;
    reconnects: number;
    droppedTicks: number;
    lastTickAt: number | null;
  }>({
    sourceLabel: "",
    wsState: "CLOSED",
    apiStatus: "idle",
    lastError: null,
    serverTimeMs: null,
    reconnects: 0,
    droppedTicks: 0,
    lastTickAt: null,
  });

  const bufferRef = useRef<NormalizedCandle[]>([]);
  const dirtyRef = useRef(false);
  const tfSecondsRef = useRef(timeframeSeconds(timeframe));
  tfSecondsRef.current = timeframeSeconds(timeframe);

  useEffect(() => {
    if (!enabled || !feedSymbol) {
      bufferRef.current = [];
      setCandles([]);
      setStatus("idle");
      return;
    }

    // Timeframe / symbol switch: clear the previous dataset safely before the
    // new history lands (never mix two datasets on one chart).
    bufferRef.current = [];
    dirtyRef.current = true;
    setCandles([]);
    setLastTick(null);
    setStatus("connecting");

    const adapter = createMarketDataAdapter(source, { feedSymbol, timeframe, historyLimit });

    adapter.start({
      onSnapshot: (next) => {
        bufferRef.current = trimCandles(next, MAX_CANDLES);
        dirtyRef.current = true;
      },
      onCandle: (candle) => {
        bufferRef.current = trimCandles(upsertCandle(bufferRef.current, candle), MAX_CANDLES);
        dirtyRef.current = true;
      },
      onTick: (tick) => {
        bufferRef.current = trimCandles(
          applyTick(bufferRef.current, tick, tfSecondsRef.current),
          MAX_CANDLES
        );
        dirtyRef.current = true;
        setLastTick(tick);
        setMeta((m) => (m.lastTickAt === tick.time * 1000 ? m : { ...m, lastTickAt: tick.time * 1000 }));
      },
      onStatus: (next, detail) => {
        setStatus((prev) => {
          if (prev !== "reconnecting" && next === "reconnecting") {
            setMeta((m) => ({ ...m, reconnects: m.reconnects + 1 }));
          }
          return next;
        });
        setMeta((m) => ({
          ...m,
          sourceLabel: adapter.label,
          wsState: detail?.wsState ?? m.wsState,
          apiStatus: detail?.apiStatus ?? m.apiStatus,
          lastError: detail?.error === undefined ? m.lastError : detail.error,
          serverTimeMs: detail?.serverTimeMs ?? m.serverTimeMs,
        }));
      },
    });

    const flush = setInterval(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      setCandles(bufferRef.current);
    }, flushMs);

    return () => {
      clearInterval(flush);
      adapter.stop();
    };
  }, [source, feedSymbol, timeframe, historyLimit, flushMs, enabled]);

  const diagnostics = useMemo<FeedDiagnostics>(() => {
    const last = candles[candles.length - 1] ?? null;
    return {
      source,
      sourceLabel: meta.sourceLabel || source,
      feedSymbol: feedSymbol ?? "—",
      timeframe,
      status,
      wsState: meta.wsState,
      apiStatus: meta.apiStatus,
      lastTickAt: meta.lastTickAt,
      lastCandleAt: last ? last.time * 1000 : null,
      candleCount: candles.length,
      currentPrice: lastTick?.price ?? last?.close ?? null,
      serverTimeMs: meta.serverTimeMs,
      clientTimeMs: Date.now(),
      lastError: meta.lastError,
      reconnects: meta.reconnects,
      droppedTicks: meta.droppedTicks,
    };
  }, [candles, lastTick, meta, source, feedSymbol, timeframe, status]);

  return {
    candles,
    lastTick,
    price: lastTick?.price ?? candles[candles.length - 1]?.close ?? null,
    status,
    diagnostics,
    isEmpty: candles.length === 0,
  };
}