import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://botvio.live",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!url || !serviceKey || !authHeader?.startsWith("Bearer ")) {
      return respond({ error: "Missing configuration or authentication" }, 401);
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = authHeader.slice("Bearer ".length);
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData.user) return respond({ error: "Unauthenticated" }, 401);

    const { data: roleRows, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);
    if (roleError) {
      console.error("Admin role lookup failed", roleError.message);
      return respond({ error: "Could not verify admin permissions" }, 403);
    }
    if (!(roleRows || []).some((row: { role: string }) => row.role === "admin" || row.role === "super_admin")) {
      return respond({ error: "Admin access required" }, 403);
    }

    // Load profiles and Auth users separately: accounts can exist even if a profile
    // row was not created by an older or failed signup trigger.
    const profilesById = new Map<string, Record<string, unknown>>();
    const { data: profileRows, error: profilesError } = await adminClient
      .from("profiles")
      .select("user_id, email, display_name, country, whatsapp_number, onboarding_complete, created_at, language");
    if (profilesError) {
      console.error("Profiles query failed", profilesError.message);
      return respond({ error: "Could not load profile records" }, 500);
    }
    for (const profile of profileRows || []) profilesById.set(profile.user_id, profile as Record<string, unknown>);

    const users: Array<Record<string, unknown>> = [];
    const perPage = 500;
    for (let page = 1; ; page += 1) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error("Auth users query failed", error.message);
        return respond({ error: "Could not load registered accounts" }, 500);
      }
      const authUsers = data.users || [];
      for (const user of authUsers) {
        const profile = profilesById.get(user.id) || {};
        const metadata = user.user_metadata || {};
        users.push({
          user_id: user.id,
          email: profile.email || user.email || null,
          display_name: profile.display_name || metadata.display_name || metadata.full_name || metadata.name || null,
          country: profile.country || metadata.country || null,
          whatsapp_number: profile.whatsapp_number || metadata.whatsapp_number || metadata.whatsapp || metadata.phone || null,
          onboarding_complete: profile.onboarding_complete ?? null,
          created_at: profile.created_at || user.created_at,
          language: profile.language || metadata.language || null,
        });
      }
      if (authUsers.length < perPage || users.length >= data.total) break;
    }

    users.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    return respond({ users, count: users.length, profile_count: profilesById.size });
  } catch (error) {
    console.error("admin-list-users failed", error);
    return respond({ error: "Unexpected error loading users" }, 500);
  }
});
