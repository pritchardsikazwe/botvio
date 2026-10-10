import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const cache = new Map<string, { at: number; data: any }>();
const CACHE_MS = 10 * 60 * 1000;

async function requestDerivCached(symbol: string) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  try {
    const data = await requestDerivCached(symbol);
    cache.set(symbol, { at: Date.now(), data });
    return data;
  } catch (e) {
    if (hit) return hit.data; // serve stale data when Deriv is rate limiting
    throw e;
  }
}

async function requestDeriv(symbol: string) {
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
    const timer = setTimeout(() => finish(reject, new Error("Deriv contracts_for timed out")), 15000);
    ws.onopen = () => ws.send(JSON.stringify({ contracts_for: symbol }));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data?.error) finish(reject, new Error(data.error.message || ("Invalid symbol: " + symbol)));
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
    const body = await req.json();
    const symbol = String(body?.symbol ?? "").trim();
    if (!/^[A-Za-z0-9_]{2,30}$/.test(symbol)) {
      return new Response(JSON.stringify({ error: "Invalid symbol format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await requestDerivCached(symbol);
    const contracts = data?.contracts_for ?? {};
    const available = Array.isArray(contracts.available) ? contracts.available : [];
    const grouped: Record<string, any[]> = {};
    for (const c of available) {
      const category = String(c.contract_category_display ?? c.contract_category ?? "Other");
      (grouped[category] ??= []).push({
        contract_type: c.contract_type,
        display_name: c.contract_display ?? c.contract_type,
        category: c.contract_category ?? null,
        min_stake: c.min_stake ?? null,
        max_stake: c.max_stake ?? null,
        min_contract_duration: c.min_contract_duration ?? null,
        max_contract_duration: c.max_contract_duration ?? null,
        expiry_type: c.expiry_type ?? null,
        multiplier_range: c.multiplier_range ?? null,
        growth_rate_range: c.growth_rate_range ?? null,
        barriers: c.barriers ?? null,
        underlying_symbol: c.underlying_symbol ?? symbol,
        market: c.market ?? null,
        submarket: c.submarket ?? null,
      });
    }
    return new Response(JSON.stringify({
      symbol: contracts.underlying_symbol ?? symbol,
      display_name: contracts.underlying_symbol_name ?? symbol,
      market: contracts.market ?? null,
      contracts: grouped,
      available,
      raw: contracts,
      api_version: "deriv-current",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contracts lookup failed";
    console.error("[deriv-contracts-for-symbol]", message);
    const rateLimited = /rate limit/i.test(message);
    return new Response(JSON.stringify({ error: rateLimited ? "Deriv is busy right now. Please try again in a minute." : message, rate_limited: rateLimited }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
