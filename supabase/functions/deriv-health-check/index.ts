import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckRequest {
  user_id?: string;
  env?: "prod" | "dev";
}

async function checkConnection(token: string, connectionType: string, env: string): Promise<{
  ok: boolean;
  balance?: number;
  currency?: string;
  loginid?: string;
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
    }, 15000);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: token, req_id: 1 }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
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
            });
          }
        } catch (e) {
          console.error("Parse error:", e);
        }
      };

      ws.onerror = () => {
        if (!resolved) {
          clearTimeout(timeout);
          resolved = true;
          resolve({ ok: false, error: "WebSocket error" });
        }
      };

      ws.onclose = () => {
        if (!resolved) {
          clearTimeout(timeout);
          resolved = true;
          resolve({ ok: false, error: "Connection closed" });
        }
      };
    } catch (e: any) {
      clearTimeout(timeout);
      resolve({ ok: false, error: e.message });
    }
  });
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const requesterId = claimsData.user.id;
    const body: HealthCheckRequest = await req.json();
    const { user_id, env } = body;

    // Check if requester is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .single();
    
    const isAdmin = !!roleData;

    // If user_id is provided and different from requester, must be admin
    const targetUserId = user_id || requesterId;
    if (targetUserId !== requesterId && !isAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connections to check
    let query = supabaseAdmin
      .from("deriv_connections")
      .select("*");
    
    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }
    if (env) {
      query = query.eq("env", env);
    }

    const { data: connections, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ ok: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const conn of connections || []) {
      // Get the token to verify
      const tokenToCheck = conn.connection_type === "oauth" 
        ? conn.oauth_access_token 
        : null; // For token connections, we can't re-verify without storing the raw token
      
      let result;
      if (tokenToCheck) {
        result = await checkConnection(tokenToCheck, conn.connection_type, conn.env);
      } else {
        // For token connections without stored raw token, mark as needing re-verification
        result = { ok: false, error: "Token verification required" };
      }

      // Update the connection status
      await supabaseAdmin
        .from("deriv_connections")
        .update({
          is_connected: result.ok,
          last_verified_at: new Date().toISOString(),
          last_error: result.error || null,
          balance: result.balance || conn.balance,
          currency: result.currency || conn.currency,
        })
        .eq("id", conn.id);

      // Log the health check
      await supabaseAdmin
        .from("deriv_connection_logs")
        .insert({
          user_id: conn.user_id,
          env: conn.env,
          event: result.ok ? "health_check_success" : "health_check_failed",
          details: {
            loginid: result.loginid,
            error: result.error,
            checked_by: requesterId,
          },
        });

      results.push({
        user_id: conn.user_id,
        env: conn.env,
        connection_type: conn.connection_type,
        is_connected: result.ok,
        last_error: result.error,
        loginid: result.loginid || conn.login_id,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, results }),
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
