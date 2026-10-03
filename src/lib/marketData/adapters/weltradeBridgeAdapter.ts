import { supabase } from "@/integrations/supabase/client";
import { aggregateTicks } from "../candles";
import { timeframeSeconds, type AdapterConfig, type AdapterHandlers, type MarketDataAdapter } from "../types";

/** Feed is considered stale after this long without a fresh Weltrade tick. */
const DELAYED_MS = 90_000;
/** Beyond this the Bridge EA is treated as offline — we show "unavailable",
 *  never synthetic candles. */
const UNAVAILABLE_MS = 15 * 60_000;
const MAX_TICKS = 4000;

interface BridgeTickRow {
  symbol: string;
  bid: number | null;
  ask: number | null;
  last_price: number | null;
  ts: string;
}

function toTick(row: BridgeTickRow) {
  const price = row.last_price ?? (row.bid != null && row.ask != null ? (row.bid + row.ask) / 2 : row.bid ?? row.ask);
  const time = Math.floor(new Date(row.ts).getTime() / 1000);
  return price != null && Number.isFinite(time) ? { time, price: Number(price), bid: row.bid, ask: row.ask } : null;
}

/**
 * Weltrade / MT5 adapter. Real Weltrade tick prices are pushed into
 * `bridge_ticks` by the BOTVIO Bridge EA running in the user's MT5 terminal;
 * this adapter backfills history, aggregates ticks into normalized candles for
 * the requested timeframe and streams live updates over Postgres realtime.
 *
 * Data-integrity rule: if the bridge is not streaming, the adapter reports
 * `unavailable` — it never fabricates candles.
 */
export function createWeltradeBridgeAdapter(config: AdapterConfig): MarketDataAdapter {
  const tfSeconds = timeframeSeconds(config.timeframe);
  const historyLimit = Math.min(config.historyLimit ?? 500, 1000);

  let handlers: AdapterHandlers | null = null;
  let stopped = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let watchdog: ReturnType<typeof setInterval> | null = null;
  let lastTickMs = 0;
  let channelState = "CLOSED";

  const backfill = async () => {
    handlers?.onStatus("connecting", { apiStatus: "loading Weltrade history", wsState: channelState });
    // Pull enough ticks to build `historyLimit` candles for this timeframe.
    const sinceMs = Date.now() - tfSeconds * historyLimit * 1000;
    const { data, error } = await supabase
      .from("bridge_ticks")
      .select("symbol,bid,ask,last_price,ts")
      .eq("symbol", config.feedSymbol)
      .gte("ts", new Date(sinceMs).toISOString())
      .order("ts", { ascending: false })
      .limit(MAX_TICKS);

    if (stopped) return;

    if (error) {
      handlers?.onStatus("error", {
        error: `${error.message} (bridge_ticks read failed)`,
        apiStatus: "select error",
        wsState: channelState,
      });
      return;
    }

    const rows = (data ?? []) as BridgeTickRow[];
    const ticks = rows.map(toTick).filter((t): t is NonNullable<ReturnType<typeof toTick>> => !!t);

    if (!ticks.length) {
      // No recent data at all — check whether the symbol has EVER streamed so we
      // can give the user an accurate diagnostic.
      const { data: any_data } = await supabase
        .from("bridge_ticks")
        .select("ts")
        .eq("symbol", config.feedSymbol)
        .order("ts", { ascending: false })
        .limit(1);
      const lastEver = any_data?.[0]?.ts ? new Date(any_data[0].ts as string) : null;
      handlers?.onSnapshot([]);
      handlers?.onStatus("unavailable", {
        apiStatus: "no ticks in window",
        wsState: channelState,
        error: lastEver
          ? `Bridge EA last streamed ${config.feedSymbol} on ${lastEver.toISOString()}`
          : `No Weltrade market data has ever been received for ${config.feedSymbol}`,
      });
      return;
    }

    const candles = aggregateTicks(ticks, tfSeconds);
    // Rows were fetched newest-first, so ticks[0] is the most recent.
    const newest = ticks.reduce((a, b) => (b.time > a.time ? b : a), ticks[0]);
    lastTickMs = newest.time * 1000;
    handlers?.onSnapshot(candles);
    handlers?.onTick(newest);

    const age = Date.now() - lastTickMs;
    handlers?.onStatus(age > UNAVAILABLE_MS ? "unavailable" : age > DELAYED_MS ? "delayed" : "live", {
      apiStatus: `${ticks.length} ticks → ${candles.length} candles`,
      wsState: channelState,
      serverTimeMs: lastTickMs,
      error:
        age > UNAVAILABLE_MS
          ? `Weltrade market data unavailable — last tick was ${Math.round(age / 60000)} min ago`
          : null,
    });
  };

  const subscribe = () => {
    channel = supabase
      .channel(`weltrade-feed-${config.feedSymbol}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bridge_ticks", filter: `symbol=eq.${config.feedSymbol}` },
        (payload) => {
          if (stopped) return;
          const tick = toTick(payload.new as BridgeTickRow);
          if (!tick) return;
          // Duplicate / out-of-order protection.
          const ms = tick.time * 1000;
          if (ms < lastTickMs - 5000) return;
          lastTickMs = Math.max(lastTickMs, ms);
          handlers?.onTick(tick);
          handlers?.onStatus("live", {
            apiStatus: "streaming",
            wsState: channelState,
            serverTimeMs: ms,
            error: null,
          });
        }
      )
      .subscribe((status) => {
        channelState = status;
        if (stopped) return;
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          handlers?.onStatus("reconnecting", { wsState: status, apiStatus: "realtime channel retrying" });
        }
      });
  };

  return {
    id: "weltrade-bridge",
    label: "Weltrade MT5 (BOTVIO Bridge EA)",
    start(h) {
      handlers = h;
      stopped = false;
      void backfill();
      subscribe();
      watchdog = setInterval(() => {
        if (!lastTickMs) return;
        const age = Date.now() - lastTickMs;
        if (age > UNAVAILABLE_MS) {
          handlers?.onStatus("unavailable", {
            apiStatus: "feed offline",
            wsState: channelState,
            error: `Weltrade market data unavailable — last tick ${Math.round(age / 60000)} min ago`,
          });
        } else if (age > DELAYED_MS) {
          handlers?.onStatus("delayed", {
            apiStatus: `last tick ${Math.round(age / 1000)}s ago`,
            wsState: channelState,
          });
        }
      }, 15_000);
    },
    stop() {
      stopped = true;
      if (watchdog) clearInterval(watchdog);
      watchdog = null;
      if (channel) supabase.removeChannel(channel);
      channel = null;
      handlers = null;
    },
  };
}