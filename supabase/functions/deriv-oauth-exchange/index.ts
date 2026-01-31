import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OAuthRequest {
  code: string;
  env: "prod" | "dev";
  redirectUrl: string;
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
    const body: OAuthRequest = await req.json();
    const { code, env, redirectUrl } = body;

    if (!code || !env) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing code or env" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For Deriv OAuth, the code returned is actually the access token
    // Deriv uses implicit grant flow where the callback contains the token directly
    // The "code" in Deriv OAuth is actually a one-time authorization that can be used
    // to establish a WebSocket connection
    
    // Verify the OAuth code/token with Deriv API
    const appId = env === "prod" ? 99139 : 124208;
    const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;

    let verifyResult: { ok: boolean; loginid?: string; balance?: number; currency?: string; is_virtual?: boolean; error?: string } = { ok: false };

    await new Promise<void>((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          verifyResult = { ok: false, error: "Connection timeout" };
          resolve();
        }
      }, 30000);

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // For OAuth, we authorize with the OAuth token
          ws.send(JSON.stringify({ authorize: code, req_id: 1 }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.error) {
              clearTimeout(timeout);
              resolved = true;
              verifyResult = { ok: false, error: data.error.message };
              ws.close();
              resolve();
              return;
            }

            if (data.authorize) {
              clearTimeout(timeout);
              resolved = true;
              verifyResult = {
                ok: true,
                loginid: data.authorize.loginid,
                balance: data.authorize.balance,
                currency: data.authorize.currency,
                is_virtual: data.authorize.is_virtual === 1,
              };
              ws.close();
              resolve();
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        };

        ws.onerror = () => {
          if (!resolved) {
            clearTimeout(timeout);
            resolved = true;
            verifyResult = { ok: false, error: "WebSocket connection error" };
            resolve();
          }
        };

        ws.onclose = () => {
          if (!resolved) {
            clearTimeout(timeout);
            resolved = true;
            verifyResult = { ok: false, error: "Connection closed unexpectedly" };
            resolve();
          }
        };
      } catch (e: any) {
        clearTimeout(timeout);
        verifyResult = { ok: false, error: e.message };
        resolve();
      }
    });

    // Store the connection
    const { error: upsertError } = await supabase
      .from("deriv_connections")
      .upsert({
        user_id: userId,
        env,
        connection_type: "oauth",
        oauth_access_token: code, // In Deriv OAuth, this is the token
        is_connected: verifyResult.ok,
        last_verified_at: new Date().toISOString(),
        last_error: verifyResult.error || null,
        login_id: verifyResult.loginid || null,
        balance: verifyResult.balance || null,
        currency: verifyResult.currency || null,
        account_type: verifyResult.is_virtual ? "demo" : "real",
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
        event: verifyResult.ok ? "oauth_connected" : "oauth_failed",
        details: {
          loginid: verifyResult.loginid,
          error: verifyResult.error,
          is_virtual: verifyResult.is_virtual,
        },
      });

    return new Response(
      JSON.stringify(verifyResult),
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
