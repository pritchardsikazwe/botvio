import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200, extra: Record<string,string> = {}) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } });
const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const publicClient = (req: Request) => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
const env = (key: string) => Deno.env.get(key) || "";

async function currentUser(req: Request) {
  const token = req.headers.get("Authorization");
  if (!token) return null;
  const { data } = await publicClient(req).auth.getUser();
  return data.user || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/callback")) {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const oauthError = url.searchParams.get("error");
      if (oauthError) return new Response(`<script>window.close();</script><p>LinkedIn authorization failed: ${oauthError}</p>`, { status: 400, headers: { "Content-Type": "text/html" } });
      if (!code || !state) return new Response("Missing OAuth code/state", { status: 400 });

      const supabase = admin();
      const { data: stateRow } = await supabase.from("social_oauth_states").select("*").eq("state", state).single();
      if (!stateRow || new Date(stateRow.expires_at).getTime() < Date.now()) return new Response("OAuth state expired or invalid", { status: 400 });
      await supabase.from("social_oauth_states").delete().eq("state", state);

      if (stateRow.platform !== "linkedin") return new Response("Unsupported OAuth platform", { status: 400 });
      const clientId = env("LINKEDIN_CLIENT_ID");
      const clientSecret = env("LINKEDIN_CLIENT_SECRET");
      const redirect = `${env("SOCIAL_OAUTH_REDIRECT_BASE") || url.origin}/functions/v1/social-oauth/callback`;
      if (!clientId || !clientSecret) return new Response("LinkedIn OAuth credentials are not configured", { status: 500 });

      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect }),
      });
      const tokenJson = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenJson.access_token) return new Response(`LinkedIn token exchange failed: ${JSON.stringify(tokenJson).slice(0,1000)}</p>`, { status: 400 });

      const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${tokenJson.access_token}` } });
      const profile = await profileResponse.json();
      if (!profileResponse.ok || !profile.sub) return new Response("Could not retrieve LinkedIn profile", { status: 400 });

      const expiresAt = tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString() : null;
      await supabase.from("social_accounts").upsert({
        platform: "linkedin",
        account_name: profile.name || profile.given_name || "LinkedIn account",
        account_id: profile.sub,
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token || null,
        token_expires_at: expiresAt,
        enabled: true,
        connected_at: new Date().toISOString(),
        metadata: { author_urn: `urn:li:person:${profile.sub}`, picture: profile.picture || null },
        updated_at: new Date().toISOString(),
      }, { onConflict: "platform,account_id" });

      return new Response(`<script>window.location.replace("${env("APP_BASE_URL") || "https://botvio.live"}/admin/social-worker?connected=linkedin");</script><p>LinkedIn connected. You may close this window.</p>`, { headers: { "Content-Type": "text/html" } });
    }

    const user = await currentUser(req);
    if (!user) return json({ error: "Authentication required" }, 401);

    const body = await req.json().catch(() => ({}));
    const platform = body.platform;
    if (body.action !== "start") return json({ error: "Unsupported OAuth action" }, 400);

    const redirect = `${env("SOCIAL_OAUTH_REDIRECT_BASE") || url.origin}/functions/v1/social-oauth/callback`;
    if (platform === "linkedin") {
      const clientId = env("LINKEDIN_CLIENT_ID");
      if (!clientId) return json({ message: "Set LINKEDIN_CLIENT_ID before connecting LinkedIn." });
      const state = crypto.randomUUID();
      const { error } = await admin().from("social_oauth_states").insert({ state, user_id: user.id, platform, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
      if (error) throw error;
      const scopes = encodeURIComponent("openid profile w_member_social");
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&state=${encodeURIComponent(state)}&scope=${scopes}`;
      return json({ url: authUrl });
    }
    return json({ message: `${platform} adapter is ready for credentials but is not configured yet.` });
  } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 500); }
});