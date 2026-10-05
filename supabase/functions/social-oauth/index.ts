import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const env = (key: string) => Deno.env.get(key) || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const platform = body.platform;
    const action = body.action;
    if (action !== "start") return json({ error: "Unsupported OAuth action" }, 400);

    const redirect = `${env("SOCIAL_OAUTH_REDIRECT_BASE") || new URL(req.url).origin}/functions/v1/social-oauth/callback`;

    if (platform === "linkedin") {
      const clientId = env("LINKEDIN_CLIENT_ID");
      if (!clientId) return json({ message: "Set LINKEDIN_CLIENT_ID before connecting LinkedIn." });
      const scopes = encodeURIComponent("openid profile w_member_social");
      const state = crypto.randomUUID();
      const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&state=${state}&scope=${scopes}`;
      return json({ url });
    }
    return json({ message: `${platform} OAuth adapter is ready for credentials but is not configured yet.` });
  } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 500); }
});
