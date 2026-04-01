import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Deriv OTP Generation (new API)
 * Gets an OTP-authenticated WebSocket URL for a given account.
 * POST /trading/v1/options/accounts/{accountId}/otp
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const body = await req.json();
    const { connection_id, account_id } = body;

    if (!connection_id && !account_id) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing connection_id or account_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the Deriv access token from the connection
    let derivAccessToken: string | null = null;
    let accountIdToUse = account_id;

    if (connection_id) {
      const { data: connection, error: connError } = await supabase
        .from("deriv_connections")
        .select("oauth_access_token, login_id")
        .eq("id", connection_id)
        .eq("user_id", userId)
        .single();

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ ok: false, error: "Connection not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      derivAccessToken = connection.oauth_access_token;
      if (!accountIdToUse) {
        accountIdToUse = connection.login_id;
      }
    }

    // Also try getting token from deriv_connections by user + env if no connection_id
    if (!derivAccessToken) {
      const { data: conn } = await supabase
        .from("deriv_connections")
        .select("oauth_access_token, login_id")
        .eq("user_id", userId)
        .eq("is_connected", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conn) {
        derivAccessToken = conn.oauth_access_token;
        if (!accountIdToUse) accountIdToUse = conn.login_id;
      }
    }

    if (!derivAccessToken || !accountIdToUse) {
      return new Response(
        JSON.stringify({ ok: false, error: "No active Deriv connection or account ID found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = "32JZaZ9lNagFr75qPkuhO";

    // Request OTP from Deriv REST API
    const otpResponse = await fetch(
      `https://api.derivws.com/trading/v1/options/accounts/${accountIdToUse}/otp`,
      {
        method: "POST",
        headers: {
          "Deriv-App-ID": clientId,
          "Authorization": `Bearer ${derivAccessToken}`,
        },
      }
    );

    if (!otpResponse.ok) {
      const errText = await otpResponse.text();
      console.error("OTP request failed:", otpResponse.status, errText);
      return new Response(
        JSON.stringify({ ok: false, error: `OTP request failed: ${otpResponse.status}` }),
        { status: otpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otpData = await otpResponse.json();
    // Response should contain { data: { url: "wss://..." } }
    const wsUrl = otpData?.data?.url || otpData?.url;

    if (!wsUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "No WebSocket URL in OTP response", raw: otpData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        ws_url: wsUrl,
        account_id: accountIdToUse,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
