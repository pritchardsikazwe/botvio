import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OAuthRequest {
  code: string;
  code_verifier: string;
  env: "prod" | "dev";
  redirectUrl: string;
}

/**
 * Deriv OAuth 2.0 Token Exchange (new API)
 * Exchanges authorization code + PKCE code_verifier for an access_token
 * via POST https://auth.deriv.com/oauth2/token
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
    const body: OAuthRequest = await req.json();
    const { code, code_verifier, env, redirectUrl } = body;

    if (!code || !env || !code_verifier) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing code, code_verifier, or env" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The client_id — same for all environments in the new API
    const clientId = "32JZaZ9lNagFr75qPkuhO";

    // Exchange authorization code for access token via Deriv's token endpoint
    const tokenResponse = await fetch("https://auth.deriv.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code: code,
        code_verifier: code_verifier,
        redirect_uri: redirectUrl,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errText);
      return new Response(
        JSON.stringify({ ok: false, error: `Token exchange failed: ${tokenResponse.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ ok: false, error: "No access_token in response" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's accounts via new REST API to verify token and get account info
    const accountsResponse = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
      method: "GET",
      headers: {
        "Deriv-App-ID": clientId,
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    let loginId: string | null = null;
    let accountBalance: number | null = null;
    let accountCurrency: string | null = null;
    let isVirtual = false;

    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      // Get the first account (or find demo/real)
      const accounts = accountsData.data || accountsData.accounts || [];
      if (accounts.length > 0) {
        const account = accounts[0];
        loginId = account.account_id || account.loginid || null;
        accountBalance = account.balance ?? null;
        accountCurrency = account.currency || null;
        isVirtual = account.account_type === "demo" || !!account.is_virtual;
      }
    } else {
      console.warn("Failed to fetch accounts:", accountsResponse.status);
    }

    // Store the connection with the new access token
    const { error: upsertError } = await supabase
      .from("deriv_connections")
      .upsert({
        user_id: userId,
        env,
        connection_type: "oauth",
        oauth_access_token: accessToken,
        is_connected: true,
        last_verified_at: new Date().toISOString(),
        last_error: null,
        login_id: loginId,
        balance: accountBalance,
        currency: accountCurrency,
        account_type: isVirtual ? "demo" : "real",
      }, { onConflict: "user_id,env" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
    }

    // Log the event
    await supabase
      .from("deriv_connection_logs")
      .insert({
        user_id: userId,
        env,
        event: "oauth_v2_connected",
        details: {
          loginid: loginId,
          is_virtual: isVirtual,
          has_accounts: loginId !== null,
        },
      });

    return new Response(
      JSON.stringify({
        ok: true,
        token: accessToken,
        loginid: loginId,
        balance: accountBalance,
        currency: accountCurrency,
        is_virtual: isVirtual,
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
