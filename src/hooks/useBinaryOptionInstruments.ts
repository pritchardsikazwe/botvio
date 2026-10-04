import { useEffect, useState } from "react";

export interface BinaryOptionInstrument {
  symbol: string;
  displayName: string;
  market?: string;
  submarket?: string;
  open?: boolean;
}

const PUBLIC_WS = "wss://api.derivws.com/trading/v1/options/ws/public";

const CONTRACT_FILTERS: Record<string, string[]> = {
  momentum: ["CALL", "PUT"],
  barrier: ["HIGHER", "LOWER", "ONETOUCH", "NOTOUCH"],
  digits: ["DIGITEVEN", "DIGITODD", "DIGITOVER", "DIGITUNDER", "DIGITMATCH", "DIGITDIFF"],
};

export const useBinaryOptionInstruments = (family: "momentum" | "barrier" | "digits") => {
  const [instruments, setInstruments] = useState<BinaryOptionInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;

    setLoading(true);
    setError(null);

    try {
      ws = new WebSocket(PUBLIC_WS);

      const timeout = window.setTimeout(() => {
        if (!cancelled) {
          setError("Instrument list timed out");
          setLoading(false);
          ws?.close();
        }
      }, 10000);

      ws.onopen = () => {
        ws?.send(JSON.stringify({
          active_symbols: "brief",
          contract_type: CONTRACT_FILTERS[family],
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data));
          if (data?.error) throw new Error(data.error.message || "Unable to load instruments");

          if (data?.msg_type === "active_symbols") {
            const rows = Array.isArray(data.active_symbols) ? data.active_symbols : [];
            const next = rows
              .map((x: any) => ({
                symbol: String(x.underlying_symbol ?? x.symbol ?? ""),
                displayName: String(x.underlying_symbol_name ?? x.display_name ?? x.underlying_symbol ?? x.symbol ?? ""),
                market: x.market,
                submarket: x.submarket,
                open: Number(x.is_trading_suspended ?? 0) === 0 && Number(x.exchange_is_open ?? 1) === 1,
              }))
              .filter((x: BinaryOptionInstrument) => x.symbol && x.open !== false)
              .sort((a: BinaryOptionInstrument, b: BinaryOptionInstrument) => a.displayName.localeCompare(b.displayName));

            if (!cancelled) {
              clearTimeout(timeout);
              setInstruments(next);
              setLoading(false);
              ws?.close();
            }
          }
        } catch (e) {
          if (!cancelled) {
            clearTimeout(timeout);
            setError(e instanceof Error ? e.message : "Invalid instrument response");
            setLoading(false);
            ws?.close();
          }
        }
      };

      ws.onerror = () => {
        if (!cancelled) {
          clearTimeout(timeout);
          setError("Deriv public market connection failed");
          setLoading(false);
        }
      };

      ws.onclose = () => {
        if (!cancelled) setLoading(false);
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect to Deriv");
      setLoading(false);
    }

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [family]);

  return { instruments, loading, error };
};
