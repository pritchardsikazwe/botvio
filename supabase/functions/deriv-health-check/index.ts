import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckRequest {
  user_id?: string;
  env?: "prod" | "dev";
}

const DERIV_CLIENT_ID = "33nuILr2Iyxx5ZWuDZylH";

async function checkConnection(token: string, _connectionType: string, _env: string): Promise<{
  ok: boolean;
  balance?: number;
  currency?: string;
  loginid?: string;
  error?: string;
}> {
  try {
    const res = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
      method: "GET",
      headers: {
        "Deriv-App-ID": DERIV_CLIENT_ID,
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
    }
    const json = await res.json();
    const accounts = json?.data ?? json?.accounts ?? [];
    const first = Array.isArray(accounts) ? accounts[0] : null;
    if (!first) return { ok: false, error: "No accounts returned" };
    return {
      ok: true,
      loginid: first.loginid || first.account_id,
      balance: typeof first.balance === "number" ? first.balance : Number(first.balance) || undefined,
      currency: first.currency,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Verification failed" };
  }
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

    // Check if requester is admin or super_admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .in("role", ["admin", "super_admin"])
      .limit(1);
    
    const isAdmin = roleData && roleData.length > 0;

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

    // Check if any connections were found — return structured code, not a hard error
    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          code: "NO_CONNECTION",
          error: "No Deriv connection found. Please connect via the Connections page first.",
          results: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
