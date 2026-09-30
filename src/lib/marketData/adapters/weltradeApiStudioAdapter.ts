import { supabase } from "@/integrations/supabase/client";
import { timeframeSeconds, type AdapterConfig, type AdapterHandlers, type MarketDataAdapter, type NormalizedCandle } from "../types";

type Quote = { bid: number | null; ask: number | null; last: number | null; symbol?: string };

const TF_API: Record<string, string> = {
  "1m": "QhPeriodM1",
  "3m": "QhPeriodM5",
  "5m": "QhPeriodM5",
  "15m": "QhPeriodM15",
  "30m": "QhPeriodM30",
  "1H": "QhPeriodH1",
  "4H": "QhPeriodH4",
  "1D": "QhPeriodD1",
};

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("syntx-api-studio", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message || "SyntX API Studio request failed");
  if (!data?.ok) throw new Error(data?.error || "SyntX API Studio request failed");
  return data as T;
}

export function createWeltradeApiStudioAdapter(config: AdapterConfig): MarketDataAdapter {
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  return {
    id: "weltrade-api-studio",
    label: "Weltrade SyntX · API Studio",
    start(handlers: AdapterHandlers) {
      stopped = false;
      handlers.onStatus("connecting", { wsState: "POLLING", apiStatus: "connecting" });

      const load = async () => {
        try {
          const history = await invoke<{ candles: NormalizedCandle[] }>("history", {
            symbol: config.feedSymbol,
            timeframe: TF_API[config.timeframe] ?? "QhPeriodM5",
            from: new Date(Date.now() - config.historyLimit! * timeframeSeconds(config.timeframe) * 1000).toISOString(),
            to: new Date().toISOString(),
          });
          if (stopped) return;
          handlers.onSnapshot((history.candles ?? []).slice(-Math.min(config.historyLimit ?? 400, 800)));
          handlers.onStatus("live", { wsState: "POLLING", apiStatus: "connected" });

          const poll = async () => {
            if (stopped) return;
            try {
              const result = await invoke<{ quote: Quote }>("quote", { symbol: config.feedSymbol });
              if (stopped) return;
              const q = result.quote;
              const price = q.last ?? q.bid ?? q.ask;
              if (price == null) throw new Error("API returned no bid/ask/last price");
              handlers.onTick({
                time: Math.floor(Date.now() / 1000),
                price,
                bid: q.bid,
                ask: q.ask,
              });
              handlers.onStatus("live", { wsState: "POLLING", apiStatus: "connected" });
            } catch (error) {
              if (!stopped) handlers.onStatus("delayed", { wsState: "POLLING", apiStatus: "error", error: (error as Error).message });
            }
          };

          await poll();
          timer = setInterval(poll, 2500);
        } catch (error) {
          if (!stopped) handlers.onStatus("error", { wsState: "POLLING", apiStatus: "error", error: (error as Error).message });
        }
      };

      void load();
    },
    stop() {
      stopped = true;
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
