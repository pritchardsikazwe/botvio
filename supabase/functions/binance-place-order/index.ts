import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AES-256-GCM decryption
async function decrypt(cipherB64: string, keyStr: string): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyStr.padEnd(32, "0").slice(0, 32)),
    "AES-GCM",
    false,
    ["decrypt"]
  );
  const combined = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    ciphertext
  );
  return dec.decode(plainBuf);
}

// HMAC-SHA256 for Binance signing
async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const body = await req.json();

    const { exchange_account_id, symbol, side, order_type, quantity, price, bot_instance_id } = body;

    if (!exchange_account_id || !symbol || !side || !order_type || !quantity) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["BUY", "SELL"].includes(side)) {
      return new Response(JSON.stringify({ ok: false, error: "side must be BUY or SELL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["MARKET", "LIMIT"].includes(order_type)) {
      return new Response(JSON.stringify({ ok: false, error: "order_type must be MARKET or LIMIT" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order_type === "LIMIT" && !price) {
      return new Response(JSON.stringify({ ok: false, error: "price required for LIMIT orders" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Number(quantity) <= 0) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid quantity" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Entitlement check — look for any active entitlement for a "binance_bot" type product
    const { data: entProducts } = await supabaseAdmin
      .from("products")
      .select("id")
      .ilike("slug", "%binance%")
      .eq("is_active", true);

    const productIds = (entProducts ?? []).map((p: any) => p.id);

    if (productIds.length > 0) {
      const { data: ent } = await supabaseAdmin
        .from("entitlements")
        .select("status, ends_at")
        .eq("user_id", userId)
        .in("product_id", productIds)
        .eq("status", "active")
        .limit(1);

      const activeEnt = (ent ?? []).find((e: any) => !e.ends_at || new Date(e.ends_at) > new Date());
      if (!activeEnt) {
        return new Response(JSON.stringify({ ok: false, error: "Binance trading entitlement required. Purchase access in the Marketplace." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch account
    const { data: acct, error: acctErr } = await supabaseAdmin
      .from("exchange_accounts")
      .select("*")
      .eq("id", exchange_account_id)
      .single();

    if (acctErr || !acct || acct.user_id !== userId) {
      return new Response(JSON.stringify({ ok: false, error: "Account not found or forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (acct.status !== "active") {
      return new Response(JSON.stringify({ ok: false, error: "Account is disabled" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt keys
    const encKey = Deno.env.get("BINANCE_ENC_KEY")!;
    const apiKey = await decrypt(acct.api_key_enc, encKey);
    const apiSecret = await decrypt(acct.api_secret_enc, encKey);

    // Build Binance order params
    const timestamp = Date.now();
    const params: Record<string, string> = {
      symbol: symbol.toUpperCase(),
      side,
      type: order_type,
      quantity: String(quantity),
      timestamp: String(timestamp),
    };

    if (order_type === "LIMIT") {
      params.price = String(price);
      params.timeInForce = "GTC";
    }

    const queryString = new URLSearchParams(params).toString();
    const signature = await hmacSign(apiSecret, queryString);

    const baseUrl = "https://api.binance.com";
    const url = `${baseUrl}/api/v3/order?${queryString}&signature=${signature}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "X-MBX-APIKEY": apiKey },
    });

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* ignore */ }

    // Store order record regardless of success
    await supabaseAdmin.from("exchange_orders").insert({
      bot_instance_id: bot_instance_id ?? null,
      user_id: userId,
      exchange: "binance",
      symbol: symbol.toUpperCase(),
      side,
      order_type,
      quantity: Number(quantity),
      price: price ? Number(price) : null,
      status: json?.status ?? (res.ok ? "NEW" : "FAILED"),
      exchange_order_id: json?.orderId ? String(json.orderId) : null,
      raw: json,
    });

    if (!res.ok) {
      return new Response(JSON.stringify({
        ok: false,
        error: json?.msg || `Binance API error ${res.status}`,
        code: json?.code,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, result: json }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("binance-place-order error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
