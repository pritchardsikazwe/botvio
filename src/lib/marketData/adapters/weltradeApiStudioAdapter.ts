import { supabase } from "@/integrations/supabase/client";
import { timeframeSeconds, type AdapterConfig, type AdapterHandlers, type MarketDataAdapter, type NormalizedCandle } from "../types";

type Quote = { bid?: number | string | null; ask?: number | string | null; last?: number | string | null; symbol?: string };
type HistoryResponse = { candles?: unknown };
type DiagnosticsResponse = {
  diagnostics?: {
    quoteError?: string;
    historyError?: string;
    symbolSample?: string[];
    symbolCount?: number;
  };
};

const TF_API: Record<string, string> = {
  "1m": "QhPeriodM1",
  // API Studio has no documented 3-minute period; request M1 and normalize
  // into 3-minute buckets locally rather than silently displaying M5 candles.
  "3m": "QhPeriodM1",
  "5m": "QhPeriodM5",
  "15m": "QhPeriodM15",
  "30m": "QhPeriodM30",
  "1H": "QhPeriodH1",
  "4H": "QhPeriodH4",
  "1D": "QhPeriodD1",
  "3D": "QhPeriodD1",
};

const asFinite = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

function normalizeCandles(value: unknown, timeframe: AdapterConfig["timeframe"]): NormalizedCandle[] {
  if (!Array.isArray(value)) return [];
  const seconds = timeframeSeconds(timeframe);
  const byTime = new Map<number, NormalizedCandle>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const rawTime = asFinite(raw.time ?? raw.timestamp ?? raw.epoch ?? raw.date);
    const open = asFinite(raw.open);
    const high = asFinite(raw.high);
    const low = asFinite(raw.low);
    const close = asFinite(raw.close);
    if (rawTime === null || open === null || high === null || low === null || close === null) continue;
    // API history timestamps can arrive as milliseconds or seconds.
    const epoch = Math.floor(rawTime > 10_000_000_000 ? rawTime / 1000 : rawTime);
    if (epoch <= 0 || high < low) continue;
    const time = epoch - (epoch % seconds);
    const candle: NormalizedCandle = {
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
    };
    const volume = asFinite(raw.volume);
    if (volume !== null && volume >= 0) candle.volume = volume;
    const previous = byTime.get(time);
    if (!previous) byTime.set(time, candle);
    else byTime.set(time, {
      time,
      open: previous.open,
      high: Math.max(previous.high, candle.high),
      low: Math.min(previous.low, candle.low),
      close: candle.close,
      ...(previous.volume !== undefined || candle.volume !== undefined
        ? { volume: (previous.volume ?? 0) + (candle.volume ?? 0) }
        : {}),
    });
  }
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) throw new Error("Sign in and connect your Weltrade feed to see live Weltrade data");
  const { data, error } = await supabase.functions.invoke("syntx-api-studio", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message || "SyntX API Studio request failed");
  if (!data?.ok) throw new Error(data?.error || "SyntX API Studio request failed");
  return data as T;
}

export function createWeltradeApiStudioAdapter(config: AdapterConfig): MarketDataAdapter {
  let stopped = false;
  let quoteTimer: ReturnType<typeof setInterval> | null = null;
  let historyTimer: ReturnType<typeof setInterval> | null = null;
  let quoteBusy = false;
  let historyBusy = false;
  let historyLoaded = false;

  const timeframe = config.timeframe;
  const apiTimeframe = TF_API[timeframe] ?? "QhPeriodM5";
  const limit = Math.min(Math.max(config.historyLimit ?? 400, 50), 800);

  return {
    id: "weltrade-api-studio",
    label: "Weltrade SyntX · TradeCopy / MT5 API Studio",
    start(handlers: AdapterHandlers) {
      stopped = false;
      historyLoaded = false;
      handlers.onStatus("connecting", { wsState: "POLLING", apiStatus: "connecting" });

      // History and live quotes are independent. A history timeout/error must
      // not prevent live quotes from arriving or the signal UI from recovering.
      const loadHistory = async () => {
        if (stopped || historyBusy) return;
        historyBusy = true;
        try {
          const from = new Date(Date.now() - limit * timeframeSeconds(timeframe) * 1000).toISOString();
          const response = await invoke<HistoryResponse>("history", {
            symbol: config.feedSymbol,
            timeframe: apiTimeframe,
            from,
            to: new Date().toISOString(),
          });
          if (stopped) return;
          const candles = normalizeCandles(response.candles, timeframe).slice(-limit);
          if (!candles.length) throw new Error("Weltrade history returned no valid OHLC candles for " + config.feedSymbol);
          handlers.onSnapshot(candles);
          historyLoaded = true;
          handlers.onStatus("live", { wsState: "POLLING", apiStatus: "connected", error: null });
        } catch (error) {
          if (!stopped) {
            const message = error instanceof Error ? error.message : String(error);
            handlers.onStatus("delayed", {
              wsState: "POLLING",
              apiStatus: "history-error",
              error: "Candle history unavailable: " + message,
            });
          }
        } finally {
          historyBusy = false;
        }
      };

      const pollQuote = async () => {
        if (stopped || quoteBusy) return;
        quoteBusy = true;
        try {
          const result = await invoke<{ quote?: Quote }>("quote", { symbol: config.feedSymbol });
          if (stopped) return;
          const q = result?.quote;
          const bid = asFinite(q?.bid);
          const ask = asFinite(q?.ask);
          const last = asFinite(q?.last);
          const price = last ?? bid ?? ask;
          if (price === null || price <= 0) throw new Error("API returned no valid bid/ask/last price for " + config.feedSymbol);
          handlers.onTick({
            time: Math.floor(Date.now() / 1000),
            price,
            bid,
            ask,
          });
          handlers.onStatus(historyLoaded ? "live" : "delayed", {
            wsState: "POLLING",
            apiStatus: historyLoaded ? "connected" : "history-pending",
            error: historyLoaded ? null : "Live quote connected; candle history is still loading.",
          });
        } catch (error) {
          if (!stopped) {
            const message = error instanceof Error ? error.message : String(error);
            handlers.onStatus("delayed", {
              wsState: "POLLING",
              apiStatus: "quote-error",
              error: "Weltrade live quote unavailable: " + message,
            });
          }
        } finally {
          quoteBusy = false;
        }
      };

      const loadDiagnostics = async () => {
        try {
          const response = await invoke<DiagnosticsResponse>("diagnostics", {
            symbol: config.feedSymbol,
            timeframe: apiTimeframe,
          });
          const d = response?.diagnostics;
          const detail = d?.historyError || d?.quoteError;
          if (!stopped && detail) {
            const symbols = d?.symbolSample?.length
              ? " Matching symbols: " + d.symbolSample.join(", ") + "."
              : " API symbols reported: " + (d?.symbolCount ?? 0) + ".";
            handlers.onStatus("delayed", {
              wsState: "POLLING",
              apiStatus: "diagnostic",
              error: detail + symbols,
            });
          }
        } catch {
          // Diagnostics are best-effort; preserve the original actionable error.
        }
      };

      void loadHistory();
      void pollQuote();
      quoteTimer = setInterval(() => void pollQuote(), 2500);
      // Retry failed history independently; it must never block live quotes.
      historyTimer = setInterval(() => {
        if (!historyLoaded) void loadHistory();
      }, 30_000);
      void loadDiagnostics();
    },
    stop() {
      stopped = true;
      if (quoteTimer) clearInterval(quoteTimer);
      if (historyTimer) clearInterval(historyTimer);
      quoteTimer = null;
      historyTimer = null;
      quoteBusy = false;
      historyBusy = false;
    },
  };
}
