import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

const BRIDGE_SHARED_SECRET = Deno.env.get("BRIDGE_SHARED_SECRET");

interface IncomingTick {
  symbol: string;
  bid?: number;
  ask?: number;
  last?: number;
  ts?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bridgeSecret = req.headers.get("x-bridge-secret");
    if (!BRIDGE_SHARED_SECRET || bridgeSecret !== BRIDGE_SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const terminal_uid: string = body?.terminal_uid;
    const broker: string | undefined = body?.broker ?? "Weltrade";
    const ticks: IncomingTick[] = Array.isArray(body?.ticks) ? body.ticks : [];

    if (!terminal_uid || ticks.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing terminal_uid or ticks" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Cap to 200 ticks per push to prevent abuse
    const capped = ticks.slice(0, 200);
    const rows = capped
      .filter((t) => t && typeof t.symbol === "string" && t.symbol.length > 0)
      .map((t) => ({
        terminal_uid,
        symbol: t.symbol,
        broker,
        bid: typeof t.bid === "number" ? t.bid : null,
        ask: typeof t.ask === "number" ? t.ask : null,
        last_price:
          typeof t.last === "number"
            ? t.last
            : typeof t.bid === "number" && typeof t.ask === "number"
              ? (t.bid + t.ask) / 2
              : (t.bid ?? t.ask ?? null),
        ts: t.ts ? new Date(t.ts).toISOString() : new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: true, inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("bridge_ticks").insert(rows);
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, inserted: rows.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    console.error("bridge-push-ticks error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});