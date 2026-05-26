import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  token: string;
  env: "prod" | "dev";
}

interface DerivAuthorizeResponse {
  authorize?: {
    loginid: string;
    balance: number;
    currency: string;
    fullname?: string;
    scopes?: string[];
    is_virtual?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

async function verifyTokenWithDeriv(token: string, env: string): Promise<{
  ok: boolean;
  loginid?: string;
  balance?: number;
  currency?: string;
  is_virtual?: boolean;
  scope?: string[];
  error?: string;
}> {
  const appId = env === "prod" ? 99139 : 124208;
  const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;

  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ ok: false, error: "Connection timeout" });
      }
    }, 30000);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: token, req_id: 1 }));
      };

      ws.onmessage = (event) => {
        try {
          const data: DerivAuthorizeResponse = JSON.parse(event.data);
          
          if (data.error) {
            clearTimeout(timeout);
            resolved = true;
            ws.close();
            resolve({ ok: false, error: data.error.message });
            return;
          }

          if (data.authorize) {
            clearTimeout(timeout);
            resolved = true;
            ws.close();
            resolve({
              ok: true,
              loginid: data.authorize.loginid,
              balance: data.authorize.balance,
              currency: data.authorize.currency,
              is_virtual: data.authorize.is_virtual === 1,
              scope: data.authorize.scopes || [],
            });
          }
        } catch (e) {
          console.error("Parse error:", e);
        }
      };

      ws.onerror = (error) => {
        if (!resolved) {
          clearTimeout(timeout);
          resolved = true;
          resolve({ ok: false, error: "WebSocket connection error" });
        }
      };

      ws.onclose = () => {
        if (!resolved) {
          clearTimeout(timeout);
          resolved = true;
          resolve({ ok: false, error: "Connection closed unexpectedly" });
        }
      };
    } catch (e: any) {
      clearTimeout(timeout);
      resolve({ ok: false, error: e.message });
    }
  });
}

/**
 * Verify a NEW-style Personal Access Token (PAT) against the updated Deriv API.
 * Legacy WS `authorize` rejects PATs with "Token invalid". The new REST API
 * accepts them as Bearer tokens at https://api.derivws.com/trading/v1/*.
 */
async function verifyPatWithDeriv(token: string, env: string): Promise<{
  ok: boolean;
  loginid?: string;
  balance?: number;
  currency?: string;
  is_virtual?: boolean;
  scope?: string[];
  error?: string;
}> {
  const appId = env === "prod" ? 99139 : 124208;
  const base = "https://api.derivws.com";
  try {
    const res = await fetch(`${base}/trading/v1/accounts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Deriv-App-ID": String(appId),
        Accept: "application/json",
      },
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        json?.error?.message ||
        json?.message ||
        `PAT verification failed (HTTP ${res.status})`;
      return { ok: false, error: msg };
    }
    // Response shape: { data: [{ account_id, currency, is_virtual, balance, ... }] } or array
    const accounts: any[] = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json)
      ? json
      : json?.accounts ?? [];
    if (!accounts.length) {
      return { ok: false, error: "No accounts returned for this PAT" };
    }
    // Prefer real account, otherwise first
    const acc =
      accounts.find((a) => a.is_virtual === false || a.is_virtual === 0) ||
      accounts[0];
    const loginid = acc.account_id || acc.loginid || acc.login_id;
    const isVirtual = acc.is_virtual === true || acc.is_virtual === 1;
    return {
      ok: true,
      loginid,
      balance: typeof acc.balance === "number" ? acc.balance : undefined,
      currency: acc.currency,
      is_virtual: isVirtual,
      scope: acc.scopes || acc.scope || ["pat"],
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "PAT verification error" };
  }
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

    // Verify with Deriv API
    // 1) Try legacy WS `authorize` (covers existing API tokens).
    // 2) If that rejects the token as invalid, fall back to the new REST PAT flow.
    let result = await verifyTokenWithDeriv(derivToken, env);
    if (
      !result.ok &&
      /invalid|InvalidToken|Token invalid|unauthor/i.test(result.error || "")
    ) {
      console.log("Legacy WS rejected token, trying new PAT REST flow…");
      const patResult = await verifyPatWithDeriv(derivToken, env);
      if (patResult.ok) result = patResult;
      else if (patResult.error) {
        // Surface the most descriptive error
        result = { ok: false, error: `${result.error} | PAT: ${patResult.error}` };
      }
    }

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
