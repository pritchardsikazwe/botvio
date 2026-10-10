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
    const authHeader = req.headers.get("Authorization") ?? "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) {
      return new Response(
        JSON.stringify({ ok: false, code: "sign_in_required", error: "Please sign in to Botvio to connect Deriv." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = match[1].trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate the caller with the service-role client. This avoids depending on
    // the anon-key/RLS client configuration while still requiring a real user JWT.
    const authClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);

    if (claimsError || !claimsData?.user) {
      console.error("deriv-get-otp auth validation failed:", claimsError?.message ?? "no user");
      return new Response(
        JSON.stringify({ ok: false, code: "sign_in_required", error: "Please sign in to Botvio to connect Deriv." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const { connection_id, account_id, deriv_token } = body;

    if (!connection_id && !account_id && !deriv_token) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing connection_id, account_id, or PAT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the Deriv access token from the connection.
    let derivAccessToken: string | null = typeof deriv_token === "string" ? deriv_token.trim() : null;
    let accountIdToUse = account_id;

    if (connection_id) {
      const { data: connection, error: connError } = await admin
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
      if (!accountIdToUse) accountIdToUse = connection.login_id;
    }

    // Also try the user's latest connected Deriv connection if no token was supplied.
    if (!derivAccessToken) {
      const { data: conn } = await admin
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

    if (derivAccessToken && !accountIdToUse) {
      const accountsResponse = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
        method: "GET",
        headers: {
          "Deriv-App-ID": "33XSUutrVPDWusVXuDUwW",
          "Authorization": `Bearer ${derivAccessToken}`,
        },
      });
      const accountsPayload = await accountsResponse.json().catch(() => ({}));
      const accounts = Array.isArray(accountsPayload?.data) ? accountsPayload.data : [];
      const account = accounts.find((a: any) => a?.status === "active") || accounts[0];
      accountIdToUse = account?.account_id;
    }

    if (!derivAccessToken || !accountIdToUse) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "not_connected",
          error: "Connect your Deriv account first to start a trading session.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otpResponse = await fetch(
      `https://api.derivws.com/trading/v1/options/accounts/${accountIdToUse}/otp`,
      {
        method: "POST",
        headers: {
          "Deriv-App-ID": "33XSUutrVPDWusVXuDUwW",
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
    const wsUrl = otpData?.data?.url || otpData?.url;

    if (!wsUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "No WebSocket URL in OTP response", raw: otpData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, ws_url: wsUrl, account_id: accountIdToUse }),
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