import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AES-256-GCM encryption using Web Crypto API
async function encrypt(plaintext: string, keyStr: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyStr.padEnd(32, "0").slice(0, 32)),
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    enc.encode(plaintext)
  );
  // Combine iv + ciphertext as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
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
    const label = body.label ?? "Binance";
    const apiKey = String(body.api_key ?? "").trim();
    const apiSecret = String(body.api_secret ?? "").trim();

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ ok: false, error: "API key and secret required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (apiKey.length < 10 || apiSecret.length < 10) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid key format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encKey = Deno.env.get("BINANCE_ENC_KEY")!;
    const apiKeyEnc = await encrypt(apiKey, encKey);
    const apiSecretEnc = await encrypt(apiSecret, encKey);

    // Check for existing account
    const { data: existing } = await supabaseAdmin
      .from("exchange_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("exchange", "binance")
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin.from("exchange_accounts").update({
        label,
        api_key_enc: apiKeyEnc,
        api_secret_enc: apiSecretEnc,
        status: "active",
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);

      return new Response(JSON.stringify({ ok: true, exchange_account_id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("exchange_accounts")
      .insert({
        user_id: userId,
        exchange: "binance",
        label,
        api_key_enc: apiKeyEnc,
        api_secret_enc: apiSecretEnc,
        status: "active",
      })
      .select("id")
      .single();

    if (insErr) throw new Error(insErr.message);

    return new Response(JSON.stringify({ ok: true, exchange_account_id: inserted.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("binance-save-keys error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
