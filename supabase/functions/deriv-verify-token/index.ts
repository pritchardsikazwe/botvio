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
    const result = await verifyTokenWithDeriv(derivToken, env);

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
