// Authentication helper for server-side scheduled/automation Edge Functions.
// Supabase Cron/pg_net should send a dedicated project automation secret in the apikey header.
// The service-role fallback is retained only for backwards compatibility.
export async function assertAutomationKey(req: Request): Promise<boolean> {
  // Accept the dedicated apikey header and the legacy Botvio cron header used by
  // existing pg_cron/pg_net jobs. Never log or return either secret.
  const presented =
    req.headers.get("apikey") ??
    req.headers.get("x-botvio-automation-secret") ??
    "";
  if (!presented) return false;

  // Preferred: a dedicated Edge Function secret. Never log or return its value.
  const dedicated = Deno.env.get("BOTVIO_AUTOMATION_KEY") ?? "";
  if (dedicated && presented === dedicated) return true;

  // Existing secret bundle convention.
  try {
    const raw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}";
    const keys = JSON.parse(raw) as Record<string, unknown>;
    const automationKey = typeof keys["botvio_automation"] === "string" ? keys["botvio_automation"] : "";
    if (automationKey && presented === automationKey) return true;
  } catch {
    // Fall through to the legacy database-secret compatibility check.
  }

  // Legacy Botvio pg_net jobs use the database-owned automation secret.
  // Read it server-side through the existing SECURITY DEFINER RPC without
  // exposing the secret in logs or responses.
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (supabaseUrl && serviceRoleKey) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_botvio_automation_secret`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        },
      );
      if (response.ok) {
        const databaseSecret = await response.json();
        if (typeof databaseSecret === "string" && databaseSecret && presented === databaseSecret) {
          return true;
        }
      }
    } catch {
      // Keep the authentication failure silent.
    }
  }

  // Legacy compatibility only; do not expose the key.
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return !!legacy && presented === legacy;
}
