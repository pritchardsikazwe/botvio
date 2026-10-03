// Authentication helper for server-side scheduled/automation Edge Functions.
// Supabase Cron/pg_net should send a project secret key in the apikey header.
// Legacy service_role is retained only for backwards compatibility.
export function assertAutomationKey(req: Request): boolean {
  const presented = req.headers.get("apikey") ?? "";
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  let valid = !!legacy && presented === legacy;

  if (!valid) {
    try {
      const raw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}";
      const keys = Object.values(JSON.parse(raw) as Record<string, unknown>).filter((v): v is string => typeof v === "string");
      valid = keys.includes(presented);
    } catch {
      valid = false;
    }
  }

  return valid;
}
