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
    const accountId = body.exchange_account_id as string;

    if (!accountId) {
      return new Response(JSON.stringify({ ok: false, error: "exchange_account_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch account (service role to get encrypted keys)
    const { data: acct, error: acctErr } = await supabaseAdmin
      .from("exchange_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (acctErr || !acct) {
      return new Response(JSON.stringify({ ok: false, error: "Account not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (acct.user_id !== userId) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
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

    // Call Binance /api/v3/account (read-only, requires signature)
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await hmacSign(apiSecret, queryString);

    const baseUrl = "https://api.binance.com";
    const url = `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "X-MBX-APIKEY": apiKey },
    });

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* ignore */ }

    if (!res.ok) {
      return new Response(JSON.stringify({
        ok: false,
        error: json?.msg || `Binance API error ${res.status}`,
        code: json?.code,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return minimal safe info (no balances details for security)
    return new Response(JSON.stringify({
      ok: true,
      canTrade: json?.canTrade ?? null,
      canWithdraw: json?.canWithdraw ?? null,
      accountType: json?.accountType ?? null,
      balances: (json?.balances ?? [])
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .slice(0, 20)
        .map((b: any) => ({ asset: b.asset, free: b.free, locked: b.locked })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("binance-test-connection error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
