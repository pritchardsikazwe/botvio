// Authentication helper for server-side scheduled/automation Edge Functions.
// Supabase Cron/pg_net should send a dedicated project automation secret in the apikey header.
// The service-role fallback is retained only for backwards compatibility.
export function assertAutomationKey(req: Request): boolean {
  const presented = req.headers.get("apikey") ?? "";
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
    // Fall through to the legacy service-role compatibility check.
  }

  // Legacy compatibility only; do not expose the key.
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return !!legacy && presented === legacy;
}
