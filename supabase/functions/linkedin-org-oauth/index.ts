// Admin-only LinkedIn Company Page OAuth using the owner's own LinkedIn app.
// Tokens are stored server-side in a service-role-only table and never returned.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const SCOPES = "w_organization_social r_organization_social openid profile";
const ALLOWED_ORIGINS = [
  "https://botvio.live", "https://www.botvio.live", "https://botvio.lovable.app",
  "https://id-preview--84ba16cb-a18f-4b57-a90e-cf3d3e3e1e37.lovable.app",
];
const CALLBACK_PATH = "/admin/linkedin-callback";

async function isAdmin(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) return false;
  const uc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user } } = await uc.auth.getUser();
  if (!user) return false;
  const { data } = await admin().from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "super_admin"]);
  return !!data?.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);

  const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
  const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET");
  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "status");
  const db = admin();

  if (action === "status") {
    const { data } = await db.from("linkedin_org_connection").select("org_urn,org_name,expires_at,access_token").eq("id", 1).maybeSingle();
    return json({
      success: true,
      credentialsConfigured: !!clientId && !!clientSecret,
      connected: !!data?.access_token && !!data?.org_urn,
      orgUrn: data?.org_urn ?? null,
      orgName: data?.org_name ?? null,
      expiresAt: data?.expires_at ?? null,
    });
  }

  if (!clientId || !clientSecret) return json({ error: "LinkedIn Client ID/Secret not configured" }, 400);
  const origin = String(body.origin ?? "");
  if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: "Origin not allowed" }, 400);
  const redirectUri = origin + CALLBACK_PATH;

  if (action === "start") {
    const state = crypto.randomUUID();
    await db.from("linkedin_org_connection").upsert({ id: 1, oauth_state: state, updated_at: new Date().toISOString() });
    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", SCOPES);
    return json({ success: true, url: url.toString() });
  }

  if (action === "callback") {
    const code = String(body.code ?? "");
    const state = String(body.state ?? "");
    const { data: row } = await db.from("linkedin_org_connection").select("oauth_state").eq("id", 1).maybeSingle();
    if (!code || !state || row?.oauth_state !== state) return json({ error: "Invalid or expired sign-in attempt. Try again." }, 400);

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret }),
    });
    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) return json({ error: "LinkedIn token exchange failed", status: tokenRes.status, details: tokenText }, 502);
    const tok = JSON.parse(tokenText);

    const aclRes = await fetch("https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED", {
      headers: { Authorization: `Bearer ${tok.access_token}`, "LinkedIn-Version": "202509", "X-Restli-Protocol-Version": "2.0.0" },
    });
    const aclText = await aclRes.text();
    if (!aclRes.ok) return json({ error: "Could not list your Company Pages", status: aclRes.status, details: aclText }, 502);
    const orgs = (JSON.parse(aclText).elements ?? []).map((e: any) => e.organization).filter(Boolean);
    if (!orgs.length) return json({ error: "This LinkedIn account is not an admin of any Company Page." }, 400);
    const orgUrn: string = orgs[0];

    let orgName: string | null = null;
    try {
      const id = orgUrn.split(":").pop();
      const o = await fetch(`https://api.linkedin.com/rest/organizations/${id}`, {
        headers: { Authorization: `Bearer ${tok.access_token}`, "LinkedIn-Version": "202509" },
      });
      if (o.ok) orgName = (await o.json()).localizedName ?? null;
    } catch { /* optional */ }

    await db.from("linkedin_org_connection").upsert({
      id: 1, access_token: tok.access_token, refresh_token: tok.refresh_token ?? null,
      expires_at: new Date(Date.now() + (tok.expires_in ?? 5184000) * 1000).toISOString(),
      org_urn: orgUrn, org_name: orgName, oauth_state: null, updated_at: new Date().toISOString(),
    });
    return json({ success: true, orgUrn, orgName, pages: orgs.length });
  }

  return json({ error: "Unknown action" }, 400);
});
