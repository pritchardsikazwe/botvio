import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  token: string;
  env: "prod" | "dev";
}

const DERIV_CLIENT_ID = "33nuILr2Iyxx5ZWuDZylH";
const DERIV_REST_BASE = "https://api.derivws.com";

/**
 * Verify a Deriv Personal Access Token (PAT) via the new REST API.
 * Legacy WebSocket `authorize` token verification is intentionally not used.
 */
async function verifyPatWithDeriv(token: string): Promise<{
  ok: boolean;
  loginid?: string;
  balance?: number;
  currency?: string;
  is_virtual?: boolean;
  scope?: string[];
  error?: string;
}> {
  const response = await fetch(`${DERIV_REST_BASE}/trading/v1/options/accounts`, {
    method: "GET",
    headers: {
      "Deriv-App-ID": DERIV_CLIENT_ID,
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = (await response.text()).trim();
    return {
      ok: false,
      error: response.status === 404
        ? "Deriv PAT endpoint was not found. Please try again in a moment."
        : errorText || `Deriv PAT verification failed (${response.status})`,
    };
  }

  const payload = await response.json();
  const accounts = Array.isArray(payload?.data) ? payload.data : [];
  const account = accounts.find((a: any) => a?.status === "active") || accounts[0];

  if (!account?.account_id) {
    return { ok: false, error: "PAT verified, but no Deriv Options account was found." };
  }

  return {
    ok: true,
    loginid: account.account_id,
    balance: typeof account.balance === "number" ? account.balance : Number(account.balance) || 0,
    currency: account.currency,
    is_virtual: account.account_type === "demo" || account.is_virtual === true,
    scope: ["read", "trade"],
  };
}

function maskToken(token: string): string {
  if (token.length <= 8) return "***";
  return token.slice(0, 4) + "..." + token.slice(-4);
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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
    const body: VerifyRequest = await req.json();
    const { token: derivToken, env } = body;

    if (!derivToken || !env) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing token or env" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify with Deriv's new PAT REST flow only.
    const result = await verifyPatWithDeriv(derivToken);

    const tokenMasked = maskToken(derivToken);
    const tokenHash = await hashToken(derivToken);

    // Update or insert deriv_connections
    const { error: upsertError } = await supabase
      .from("deriv_connections")
      .upsert({
        user_id: userId,
        env,
        connection_type: "token",
        token_masked: tokenMasked,
        token_hash: tokenHash,
        is_connected: result.ok,
        last_verified_at: new Date().toISOString(),
        last_error: result.error || null,
        login_id: result.loginid || null,
        balance: result.balance || null,
        currency: result.currency || null,
        account_type: result.is_virtual ? "demo" : "real",
        scope: result.scope || null,
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
        event: result.ok ? "verify_success" : "verify_failed",
        details: {
          loginid: result.loginid,
          error: result.error,
          is_virtual: result.is_virtual,
        },
      });

    return new Response(
      JSON.stringify(result),
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
