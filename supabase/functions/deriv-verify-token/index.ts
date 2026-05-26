import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  token: string;
  env: "prod" | "dev";
}

/**
 * Verify a Deriv Personal Access Token (PAT) via the official WebSocket
 * `authorize` endpoint. This is the documented + supported way to validate
 * a Deriv API token (both legacy + new PAT) and returns full account info,
 * balance, currency and granted scopes in a single call.
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
  const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;

  return await new Promise((resolve) => {
    let settled = false;
    const done = (r: any) => { if (!settled) { settled = true; try { ws.close(); } catch {} resolve(r); } };

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e: any) {
      return resolve({ ok: false, error: e?.message || "WS connect failed" });
    }

    const timer = setTimeout(() => done({ ok: false, error: "Deriv verification timed out" }), 12000);

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify({ authorize: token }));
      } catch (e: any) {
        clearTimeout(timer);
        done({ ok: false, error: e?.message || "WS send failed" });
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
      done({ ok: false, error: "WebSocket error contacting Deriv" });
    };

    ws.onmessage = (ev) => {
      clearTimeout(timer);
      try {
        const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (msg?.error) {
          return done({
            ok: false,
            error: msg.error.message || msg.error.code || "Invalid Deriv token",
          });
        }
        const a = msg?.authorize;
        if (!a) return done({ ok: false, error: "Unexpected response from Deriv" });
        done({
          ok: true,
          loginid: a.loginid,
          balance: typeof a.balance === "number" ? a.balance : Number(a.balance) || 0,
          currency: a.currency,
          is_virtual: a.is_virtual === 1 || a.is_virtual === true,
          scope: a.scopes || ["read"],
        });
      } catch (e: any) {
        done({ ok: false, error: e?.message || "Failed to parse Deriv response" });
      }
    };
  });
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
    // Only the new Personal Access Token (PAT) REST flow is supported.
    // Legacy WS `authorize` tokens have been removed.
    const result = await verifyPatWithDeriv(derivToken, env);

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
