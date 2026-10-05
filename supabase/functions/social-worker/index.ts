import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";

type Platform = "linkedin" | "facebook" | "instagram" | "x" | "tiktok";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const userClient = (req: Request) => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });

async function isAdmin(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) return false;
  const { data: { user } } = await userClient(req).auth.getUser();
  if (!user) return false;
  const { data: roles } = await admin().from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "super_admin"]);
  return !!roles?.length;
}

async function authorized(req: Request) {
  return await isAdmin(req) || await assertAutomationKey(req);
}

async function publishLinkedIn(account: any, post: any) {
  if (!account.access_token) throw new Error("LinkedIn is not connected");
  const author = account.metadata?.author_urn;
  if (!author) throw new Error("LinkedIn author URN is not configured");
  const version = Deno.env.get("LINKEDIN_VERSION") || "202603";
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: { Authorization: `Bearer ${account.access_token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0", "Linkedin-Version": version },
    body: JSON.stringify({
      author, commentary: post.content, visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`LinkedIn API ${response.status}: ${text.slice(0, 500)}`);
  return response.headers.get("x-restli-id") || null;
}

async function publishUnsupported(post: any) {
  throw new Error(`${post.platform} adapter is not configured yet. Connect its approved API credentials before publishing.`);
}

async function publishPost(supabase: any, post: any) {
  const { data: account } = await supabase.from("social_accounts").select("*").eq("platform", post.platform).eq("enabled", true).limit(1).maybeSingle();
  if (!account) throw new Error(`No connected ${post.platform} account`);
  await supabase.from("social_posts").update({ status: "publishing", error_message: null, updated_at: new Date().toISOString() }).eq("id", post.id);
  try {
    const externalId = post.platform === "linkedin" ? await publishLinkedIn(account, post) : await publishUnsupported(post);
    await supabase.from("social_posts").update({ status: "published", published_at: new Date().toISOString(), external_post_id: externalId, error_message: null, updated_at: new Date().toISOString() }).eq("id", post.id);
    return { success: true, externalId };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabase.from("social_posts").update({ status: "failed", error_message: message, updated_at: new Date().toISOString() }).eq("id", post.id);
    return { success: false, error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!(await authorized(req))) return json({ success: false, error: "Admin authentication required" }, 401);
    const supabase = admin();
    const body = await req.json().catch(() => ({}));
    const action = body.action || "run";

    if (action === "publish") {
      const { data: post, error } = await supabase.from("social_posts").select("*").eq("id", body.post_id).single();
      if (error || !post) return json({ success: false, error: "Post not found" }, 404);
      const result = await publishPost(supabase, post);
      return json(result, result.success ? 200 : 400);
    }

    const now = new Date().toISOString();
    const { data: queue } = await supabase.from("social_posts").select("*").in("status", ["approved","scheduled"]).or(`scheduled_at.is.null,scheduled_at.lte.${now}`).order("scheduled_at", { ascending: true }).limit(25);
    const { data: settings } = await supabase.from("social_worker_settings").select("*").eq("id", true).maybeSingle();
    let processed = 0;
    for (const post of queue || []) {
      if (settings?.approval_required && post.status !== "approved") continue;
      if (settings?.allowed_platforms && !settings.allowed_platforms.includes(post.platform)) continue;
      const result = await publishPost(supabase, post);
      if (result.success) processed++;
    }
    return json({ success: true, processed });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});