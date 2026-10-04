import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Legacy MT5 EA provider-event endpoint.
 *
 * MT5 provider/follower routing was moved to Botvio TradeCopy Cloud.
 * Keeping this endpoint as a hard retirement response prevents an old EA
 * from silently creating copy_links/follower_commands alongside TradeCopy,
 * which could result in duplicate MT5 execution.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: false,
      code: "LEGACY_MT5_COPY_RETIRED",
      error: "Legacy MT5 EA provider-event routing is retired. Connect the provider and follower through Botvio TradeCopy.",
      route: "tradecopy",
    }),
    {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
