// Securely accept managed MT5 onboarding requests:
// encrypts the user's MT5 password with TOKEN_ENCRYPTION_KEY before storing.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ENC_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY") || "";

async function encrypt(plain: string): Promise<string> {
  if (!ENC_KEY) throw new Error("TOKEN_ENCRYPTION_KEY not configured");
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest("SHA-256", enc.encode(ENC_KEY));
  const key = await crypto.subtle.importKey("raw", keyMaterial, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain))
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0); out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: cors });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: cors });

    const body = await req.json();
    const nickname = String(body.nickname || "").trim().slice(0, 80);
    const mt5_login = String(body.mt5_login || "").trim().slice(0, 32);
    const mt5_server = String(body.mt5_server || "").trim().slice(0, 80);
    const password = String(body.password || "");
    const account_type = body.account_type === "demo" ? "demo" : "real";
    const broker_name = body.broker_name ? String(body.broker_name).slice(0, 60) : null;

    if (!nickname || !mt5_login || !mt5_server || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: cors });
    }
    if (password.length < 4 || password.length > 128) {
      return new Response(JSON.stringify({ error: "Invalid password length" }), { status: 400, headers: cors });
    }

    // Plan gate
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: plan } = await admin
      .from("user_plan_subscriptions")
      .select("status, pricing_plans!inner(code)")
      .eq("user_id", u.user.id).eq("status", "active").maybeSingle();
    const code = (plan as any)?.pricing_plans?.code ?? "free";
    if (!["basic", "standard", "vip", "pro", "premium"].includes(code)) {
      return new Response(JSON.stringify({ error: "Managed MT5 is a paid-plan feature. Please upgrade." }), {
        status: 402, headers: cors,
      });
    }

    const password_encrypted = await encrypt(password);

    const { data, error } = await admin
      .from("managed_mt5_requests")
      .insert({
        user_id: u.user.id, nickname, mt5_login, mt5_server,
        password_encrypted, account_type, broker_name, status: "pending",
      })
      .select("id, status, created_at")
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, request: data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});