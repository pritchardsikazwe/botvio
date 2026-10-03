import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SymbolRow = {
  symbol: string;
  display_name: string;
  market: unknown;
  submarket: unknown;
  pip: unknown;
  is_trading_suspended: unknown;
  exchange_is_open: unknown;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeSymbol(sym: Record<string, unknown>): SymbolRow {
  const symbol = String(sym.underlying_symbol ?? sym.symbol ?? "");
  return {
    symbol,
    display_name: String(sym.underlying_symbol_name ?? sym.display_name ?? symbol),
    market: sym.market ?? null,
    submarket: sym.submarket ?? null,
    pip: sym.pip_size ?? sym.pip ?? null,
    is_trading_suspended: sym.is_trading_suspended ?? 0,
    exchange_is_open: sym.exchange_is_open ?? 1,
  };
}

async function requestDeriv(payload: Record<string, unknown>) {
  const ws = new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");

  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      reject(new Error("Deriv market-data request timed out"));
    }, 15000);

    const finish = (handler: (value: any) => void, value: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      handler(value);
    };

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify(payload));
      } catch (error) {
        finish(reject, error instanceof Error ? error : new Error("Unable to send Deriv request"));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (data?.error) {
          const error = data.error as Record<string, unknown>;
          finish(reject, new Error(String(error.message ?? "Deriv request failed")));
          return;
        }
        finish(resolve, data);
      } catch (error) {
        finish(reject, error instanceof Error ? error : new Error("Invalid Deriv response"));
      }
    };

    ws.onerror = () => finish(reject, new Error("Deriv public WebSocket connection failed"));
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const data = await requestDeriv({ active_symbols: "brief" });
    const rows = Array.isArray(data?.active_symbols) ? data.active_symbols : [];

    const grouped: Record<string, SymbolRow[]> = {};
    for (const raw of rows) {
      if (!raw || typeof raw !== "object") continue;
      const row = normalizeSymbol(raw as Record<string, unknown>);
      if (!row.symbol) continue;
      const key = String(row.market ?? "Other");
      (grouped[key] ??= []).push(row);
    }

    return json({
      symbols: grouped,
      cached: false,
      degraded: false,
      total: rows.length,
      api_version: "deriv-current",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Active symbols lookup failed";
    console.error("[deriv-active-symbols]", message);

    // Keep the application usable when Deriv market data is temporarily unavailable.
    // The caller can retry without treating the function failure as a fatal page error.
    return json({
      symbols: {},
      cached: false,
      degraded: true,
      total: 0,
      api_version: "deriv-current",
      error: message,
    });
  }
});
