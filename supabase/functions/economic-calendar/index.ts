import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns ~30 days of high/medium-impact economic events.
 * Source: Finnhub /calendar/economic (free tier).
 * Cached upstream; we just shape + filter.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("FINNHUB_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "FINNHUB_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const today = new Date();
    const end = new Date(today.getTime() + 30 * 24 * 3600 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://finnhub.io/api/v1/calendar/economic?from=${fmt(today)}&to=${fmt(end)}&token=${apiKey}`;
    const r = await fetch(url);
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${r.status}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await r.json();
    const raw: any[] = json?.economicCalendar ?? [];
    const events = raw
      .filter((e) => (e.impact ?? "").toLowerCase() !== "low")
      .map((e) => ({
        time: e.time,                          // ISO datetime
        country: e.country,                    // e.g. "US"
        currency: countryToCurrency(e.country),
        event: e.event,
        impact: capitalize(e.impact || "Medium"),
        actual: e.actual ?? null,
        estimate: e.estimate ?? null,
        prev: e.prev ?? null,
        unit: e.unit ?? null,
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return new Response(JSON.stringify({ events, generated_at: new Date().toISOString() }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900", // 15 min CDN cache
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

function countryToCurrency(c: string): string {
  const map: Record<string, string> = {
    US: "USD", EU: "EUR", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
    GB: "GBP", JP: "JPY", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF",
    CN: "CNY", IN: "INR", BR: "BRL", MX: "MXN", ZA: "ZAR", RU: "RUB",
  };
  return map[c?.toUpperCase()] ?? c ?? "—";
}