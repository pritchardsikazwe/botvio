import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Map a Botvio "display symbol" or "persist symbol" to the broker's MT5 symbol.
 * Most Deriv MT5 brokers use plain tickers (XAUUSD, BTCUSD, EURUSD).
 * Some brokers append a suffix (e.g. "EURUSD.r", "XAUUSDm") — the EA tries the
 * exact symbol; if you use a suffix-broker, you can override per terminal later.
 */
function mapToMt5Symbol(input: string): string {
  const s = input.toUpperCase().replace(/[\/\s_-]/g, "");
  // Common aliases
  const aliases: Record<string, string> = {
    "XAUUSD": "XAUUSD",
    "GOLD": "XAUUSD",
    "XAGUSD": "XAGUSD",
    "SILVER": "XAGUSD",
    "BTCUSD": "BTCUSD",
    "BITCOIN": "BTCUSD",
    "ETHUSD": "ETHUSD",
    "EURUSD": "EURUSD",
    "GBPUSD": "GBPUSD",
    "USDJPY": "USDJPY",
    "USDCAD": "USDCAD",
    "USDCHF": "USDCHF",
    "AUDUSD": "AUDUSD",
    "NZDUSD": "NZDUSD",
    "EURJPY": "EURJPY",
    "EURGBP": "EURGBP",
  };
  return aliases[s] ?? s;
}

/**
 * Deriv MT5 broker minimum lot per symbol.
 * Boom/Crash, Volatility, Step, Range Break, Jump indices each have different
 * minimums. If the user's default_lot is below the minimum, MT5 rejects the
 * order with error 4756 ("invalid volume"). We clamp UP to the symbol minimum
 * so the trade actually executes.
 */
const SYMBOL_MIN_LOT: Record<string, number> = {
  // Boom indices
  "BOOM300": 1.00,
  "BOOM500": 0.20,
  "BOOM600": 0.20,
  "BOOM900": 0.20,
  "BOOM1000": 0.20,
  "BOOM1500": 0.20,
  "BOOM50": 4.00,
  "BOOM150": 1.00,
  // Crash indices
  "CRASH300": 0.50,
  "CRASH500": 0.20,
  "CRASH600": 0.20,
  "CRASH900": 0.20,
  "CRASH1000": 0.20,
  "CRASH1500": 0.20,
  "CRASH50": 4.00,
  "CRASH150": 1.00,
  // Volatility indices
  "VOLATILITY10": 0.50,
  "VOLATILITY10(1S)": 0.50,
  "VOLATILITY25": 0.50,
  "VOLATILITY25(1S)": 0.01,
  "VOLATILITY50": 4.00,
  "VOLATILITY50(1S)": 0.01,
  "VOLATILITY75": 0.001,
  "VOLATILITY75(1S)": 0.05,
  "VOLATILITY100": 0.50,
  "VOLATILITY100(1S)": 0.20,
  // Forex / Metals (most Deriv MT5 brokers)
  "XAUUSD": 0.01,
  "XAGUSD": 0.01,
  "EURUSD": 0.01,
  "GBPUSD": 0.01,
  "USDJPY": 0.01,
  "USDCAD": 0.01,
  "USDCHF": 0.01,
  "AUDUSD": 0.01,
  "NZDUSD": 0.01,
  "EURJPY": 0.01,
  "EURGBP": 0.01,
  // Crypto
  "BTCUSD": 0.01,
  "ETHUSD": 0.01,
};

function getSymbolMinLot(mt5Symbol: string): number {
  const key = mt5Symbol.toUpperCase().replace(/[\s_-]/g, "");
  return SYMBOL_MIN_LOT[key] ?? 0.01;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const {
      symbol,
      direction,        // "BUY" | "SELL"
      lot,              // optional override; falls back to terminal default_lot
      sl,               // optional stop-loss price
      tp,               // optional take-profit price
      source,           // optional string (e.g. "gold-hub", "btc-hub")
      terminal_uid,     // optional explicit terminal; default = first auto_execute=true
    } = body ?? {};

    if (!symbol || typeof symbol !== "string") {
      return new Response(JSON.stringify({ error: "Missing symbol" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (direction !== "BUY" && direction !== "SELL") {
      return new Response(JSON.stringify({ error: "Invalid direction" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Find the user's MT5 terminal — prefer explicit terminal_uid, else first auto_execute=true
    let terminal:
      | { terminal_uid: string; default_lot: number; auto_execute: boolean }
      | null = null;

    if (terminal_uid) {
      const { data } = await adminClient
        .from("user_mt5_terminals")
        .select("terminal_uid, default_lot, auto_execute")
        .eq("user_id", userId)
        .eq("terminal_uid", terminal_uid)
        .maybeSingle();
      terminal = data ?? null;
    } else {
      const { data } = await adminClient
        .from("user_mt5_terminals")
        .select("terminal_uid, default_lot, auto_execute")
        .eq("user_id", userId)
        .eq("auto_execute", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      terminal = data ?? null;
    }

    if (!terminal) {
      return new Response(
        JSON.stringify({
          error: "No MT5 terminal linked or auto-execute disabled",
          hint: "Add your Bridge EA Terminal UID under Connections → MT5 Bridge and enable auto-execute.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mt5Symbol = mapToMt5Symbol(symbol);
    const requested = Number(lot) > 0 ? Number(lot) : Number(terminal.default_lot) || 0.01;
    const minLot = getSymbolMinLot(mt5Symbol);
    // Clamp UP to broker minimum so MT5 doesn't reject with error 4756 ("invalid volume").
    const volume = requested < minLot ? minLot : requested;

    const command: Record<string, unknown> = {
      action: "OPEN",
      symbol: mt5Symbol,
      type: direction,
      volume,
      source: source ?? "hub-signal",
      requested_at: new Date().toISOString(),
    };
    if (typeof sl === "number" && sl > 0) command.sl = sl;
    if (typeof tp === "number" && tp > 0) command.tp = tp;

    const { data: inserted, error: insErr } = await adminClient
      .from("mt5_commands")
      .insert({
        terminal_uid: terminal.terminal_uid,
        command,
        status: "QUEUED",
      })
      .select("id")
      .maybeSingle();

    if (insErr) {
      console.error("Insert error:", insErr);
      return new Response(JSON.stringify({ error: "Failed to queue command" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        command_id: inserted?.id,
        terminal_uid: terminal.terminal_uid,
        symbol: mt5Symbol,
        direction,
        volume,
        min_lot: minLot,
        adjusted: volume !== requested,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("queue-hub-trade error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
