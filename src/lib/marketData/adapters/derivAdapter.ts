import { getDerivPublicWebSocketUrl } from "@/config/derivEnv";
import { timeframeSeconds, type AdapterConfig, type AdapterHandlers, type MarketDataAdapter, type NormalizedCandle } from "../types";

const HEARTBEAT_MS = 20_000;
const STALE_MS = 60_000;

/**
 * Deriv public WebSocket adapter — the proven feed used by the Synthetic
 * Signals charts. Streams real OHLC (`ohlc` subscription) plus ticks, with
 * heartbeat, exponential reconnect and staleness detection.
 */
export function createDerivAdapter(config: AdapterConfig): MarketDataAdapter {
  const tfSeconds = timeframeSeconds(config.timeframe);
  const historyLimit = Math.min(config.historyLimit ?? 500, 1000);

  let ws: WebSocket | null = null;
  let handlers: AdapterHandlers | null = null;
  let stopped = false;
  let attempt = 0;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let watchdog: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastDataAt = 0;
  let receivedHistory = false;

  const wsStateLabel = () => {
    if (!ws) return "CLOSED";
    return ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][ws.readyState] ?? "UNKNOWN";
  };

  const clearTimers = () => {
    if (heartbeat) clearInterval(heartbeat);
    if (watchdog) clearInterval(watchdog);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    heartbeat = null;
    watchdog = null;
    reconnectTimer = null;
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    attempt += 1;
    const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 30_000);
    handlers?.onStatus("reconnecting", { wsState: wsStateLabel(), apiStatus: `retry in ${Math.round(delay / 1000)}s` });
    reconnectTimer = setTimeout(connect, delay);
  };

  const connect = () => {
    if (stopped) return;
    handlers?.onStatus("connecting", { wsState: "CONNECTING", apiStatus: "opening socket" });
    try {
      ws = new WebSocket(getDerivPublicWebSocketUrl());
    } catch (err) {
      handlers?.onStatus("error", { error: err instanceof Error ? err.message : "WebSocket blocked", wsState: "CLOSED" });
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      if (stopped) return;
      attempt = 0;
      lastDataAt = Date.now();
      handlers?.onStatus("connecting", { wsState: "OPEN", apiStatus: "requesting history" });
      ws?.send(
        JSON.stringify({
          ticks_history: config.feedSymbol,
          adjust_start_time: 1,
          count: historyLimit,
          end: "latest",
          granularity: tfSeconds,
          style: "candles",
          subscribe: 1,
        })
      );
      ws?.send(JSON.stringify({ ticks: config.feedSymbol, subscribe: 1 }));

      heartbeat = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify({ ping: 1 })); } catch { /* noop */ }
        }
      }, HEARTBEAT_MS);

      watchdog = setInterval(() => {
        if (!receivedHistory) return;
        if (Date.now() - lastDataAt > STALE_MS) {
          handlers?.onStatus("delayed", {
            wsState: wsStateLabel(),
            apiStatus: `no data for ${Math.round((Date.now() - lastDataAt) / 1000)}s`,
          });
        }
      }, 10_000);
    };

    ws.onmessage = (event) => {
      if (stopped) return;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (data.error) {
        const message = (data.error as { message?: string })?.message ?? "Deriv API error";
        handlers?.onStatus(receivedHistory ? "error" : "unavailable", {
          error: message,
          wsState: wsStateLabel(),
          apiStatus: "error",
        });
        return;
      }

      if (data.pong || data.ping) return;

      if (Array.isArray(data.candles)) {
        const parsed: NormalizedCandle[] = (data.candles as Record<string, number>[])
          .map((c) => ({
            time: Number(c.epoch),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
          }))
          .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close));
        receivedHistory = true;
        lastDataAt = Date.now();
        if (!parsed.length) {
          handlers?.onStatus("unavailable", { error: "No historical candles returned", apiStatus: "empty history" });
          return;
        }
        handlers?.onSnapshot(parsed);
        handlers?.onStatus("live", { wsState: wsStateLabel(), apiStatus: "history + stream OK", error: null });
        return;
      }

      if (data.ohlc) {
        const o = data.ohlc as Record<string, string | number>;
        lastDataAt = Date.now();
        handlers?.onCandle({
          time: Number(o.open_time),
          open: Number(o.open),
          high: Number(o.high),
          low: Number(o.low),
          close: Number(o.close),
        });
        handlers?.onStatus("live", {
          wsState: wsStateLabel(),
          apiStatus: "streaming",
          error: null,
          serverTimeMs: Number(o.epoch) * 1000,
        });
        return;
      }

      if (data.tick) {
        const t = data.tick as Record<string, number>;
        lastDataAt = Date.now();
        handlers?.onTick({ time: Number(t.epoch), price: Number(t.quote) });
        handlers?.onStatus("live", {
          wsState: wsStateLabel(),
          apiStatus: "streaming",
          error: null,
          serverTimeMs: Number(t.epoch) * 1000,
        });
      }
    };

    ws.onerror = () => {
      handlers?.onStatus("reconnecting", { error: "WebSocket error", wsState: wsStateLabel() });
      try { ws?.close(); } catch { /* noop */ }
    };

    ws.onclose = () => {
      clearTimers();
      if (stopped) return;
      scheduleReconnect();
    };
  };

  return {
    id: "deriv",
    label: "Deriv public market feed",
    start(h) {
      handlers = h;
      stopped = false;
      receivedHistory = false;
      connect();
    },
    stop() {
      stopped = true;
      clearTimers();
      const socket = ws;
      if (socket?.readyState === WebSocket.OPEN) {
        try { socket.send(JSON.stringify({ forget_all: "ticks" })); } catch { /* noop */ }
        try { socket.send(JSON.stringify({ forget_all: "candles" })); } catch { /* noop */ }
      }
      try { socket?.close(); } catch { /* noop */ }
      ws = null;
      handlers = null;
    },
  };
}