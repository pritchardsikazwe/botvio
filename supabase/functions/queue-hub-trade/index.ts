import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * RETIRED LEGACY MT5 BRIDGE ROUTE.
 *
 * Botvio now executes MT5 orders only through TradeCopy.
 * This compatibility endpoint intentionally does not queue commands,
 * register terminals, or communicate with an MT5 EA.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  return new Response(JSON.stringify({
    ok: false,
    retired: true,
    execution: "TradeCopy",
    error: "Legacy MT5 Bridge execution has been retired. Connect the MT5 account as a TradeCopy follower.",
  }), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
