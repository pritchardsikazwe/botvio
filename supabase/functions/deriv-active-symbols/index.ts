import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeSymbol(sym: Record<string, unknown>) {
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
  return await new Promise<any>((resolve, reject) => {
    let settled = false;
    const finish = (fn: (v: any) => void, value: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      fn(value);
    };
    const timer = setTimeout(() => finish(reject, new Error("Deriv market-data request timed out")), 15000);
    ws.onopen = () => ws.send(JSON.stringify(payload));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data?.error) finish(reject, new Error(data.error.message || "Deriv request failed"));
        else finish(resolve, data);
      } catch (e) {
        finish(reject, e instanceof Error ? e : new Error("Invalid Deriv response"));
      }
    };
    ws.onerror = () => finish(reject, new Error("Deriv public WebSocket connection failed"));
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const data = await requestDeriv({ active_symbols: "brief" });
    const rows = Array.isArray(data?.active_symbols) ? data.active_symbols : [];
    const grouped: Record<string, any[]> = {};
    for (const raw of rows) {
      const row = normalizeSymbol(raw);
      if (!row.symbol) continue;
      const key = String(row.market ?? "Other");
      (grouped[key] ??= []).push(row);
    }
    return new Response(JSON.stringify({ symbols: grouped, cached: false, total: rows.length, api_version: "deriv-current" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Active symbols lookup failed";
    console.error("[deriv-active-symbols]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
