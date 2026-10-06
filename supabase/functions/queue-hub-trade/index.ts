import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * TradeCopy compatibility route.
 *
 * Older Botvio hub clients may still call this endpoint. Do not queue MT5
 * Bridge commands. Instead, forward the request to mt5-direct-execution,
 * which requires an active TradeCopy follower and performs the server-side
 * TradeCopy order submission.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.toLowerCase().startsWith("bearer ")) {
      return json({ ok: false, execution: "TradeCopy", error: "Sign in required" }, 401);
    }

    const token = auth.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) return json({ ok: false, execution: "TradeCopy", error: "Sign in required" }, 401);

    const body = await req.json().catch(() => ({}));
    const direction = String(body?.direction ?? "").toUpperCase();
    const symbol = String(body?.symbol ?? "").trim();
    const sl = Number(body?.sl);
    const tp = Number(body?.tp);

    if (!symbol || (direction !== "BUY" && direction !== "SELL")) {
      return json({ ok: false, execution: "TradeCopy", error: "Invalid symbol or direction" }, 400);
    }

    const { data: follower } = await admin
      .from("trading_accounts")
      .select("id,label,login_id,account_role,tradecopy_user_id,tradecopy_active,is_active,is_botvio_robot,direct_lot")
      .eq("user_id", userData.user.id)
      .eq("account_role", "slave")
      .eq("is_botvio_robot", false)
      .eq("is_active", true)
      .not("tradecopy_user_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!follower?.id) {
      return json({
        ok: false,
        execution: "TradeCopy",
        error: "Connect your MT5 account as a TradeCopy follower before using hub auto-execution.",
      }, 200);
    }

    if (!follower.tradecopy_active) {
      return json({
        ok: false,
        execution: "TradeCopy",
        error: "Activate TradeCopy copying for this MT5 follower before using hub auto-execution.",
      }, 200);
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/mt5-direct-execution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "send_order",
        account_id: follower.id,
        symbol,
        direction,
        volume: Number(follower.direct_lot ?? 0.01),
        ...(Number.isFinite(sl) && sl > 0 ? { stop_loss: sl } : {}),
        ...(Number.isFinite(tp) && tp > 0 ? { take_profit: tp } : {}),
      }),
    });

    const result = await response.json().catch(() => ({}));
    return json(result, response.status);
  } catch (error) {
    console.error("[queue-hub-trade][TradeCopy]", error);
    return json({ ok: false, execution: "TradeCopy", error: "TradeCopy signal delivery failed" }, 500);
  }
});
