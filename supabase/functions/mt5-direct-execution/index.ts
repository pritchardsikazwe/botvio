// Direct Botvio Signals -> user's own MT5 account.
// Never registers with TradeCopy and never calls the TradeCopy "link" action:
// orders go straight to the account through the MT5 API, using the encrypted
// credential already stored for the account. One signal executes at most once
// per account (unique trading_account_id + signal_id).
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { decryptSecret } from "../_shared/tradecopy/crypto.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BASE = (Deno.env.get("MT5_API_STUDIO_BASE_URL") || "https://mt5full3.mtapi.io").replace(/\/+$/, "");
const API_KEY = Deno.env.get("MT5_API_STUDIO_API_KEY") || Deno.env.get("TRADECOPY_API_KEY");
// Real orders only when explicitly enabled; otherwise executions are simulated and logged.
const LIVE_MODE = Deno.env.get("MT5_DIRECT_MODE") === "live" && !!API_KEY;
const LIVE_PHRASE = "START LIVE SIGNALS";
const COLS = "id,user_id,broker,login_id,server,environment,platform,account_role,is_botvio_robot,direct_signal_enabled,direct_signal_status,direct_live_confirmed_at,direct_lot,direct_min_confidence,direct_symbol_map,last_direct_signal_at,last_direct_execution_at,last_direct_error";

class Err extends Error { constructor(m: string, public status = 400) { super(m); } }

async function mt5(path: string, q: Record<string, string | number>) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(q)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { ApiKey: API_KEY!, Accept: "application/json, text/plain" }, signal: AbortSignal.timeout(25000) });
  const text = await res.text();
  let body: unknown = text; try { body = JSON.parse(text); } catch { /* text */ }
  if (!res.ok) throw new Error(`MT5 ${res.status}: ${String(typeof body === "string" ? body : JSON.stringify(body)).slice(0, 200)}`);
  return body;
}

async function liveGlobal(admin: SupabaseClient) {
  const { data } = await admin.from("app_settings").select("key,value").in("key", ["tradecopy_live_enabled", "direct_live_enabled"]);
  const on = (k: string) => (data ?? []).some((r) => r.key === k && (r.value as { enabled?: boolean })?.enabled === true);
  return on("direct_live_enabled") || on("tradecopy_live_enabled");
}

async function password(admin: SupabaseClient, accountId: string) {
  const { data } = await admin.from("tradecopy_credentials").select("password_encrypted").eq("trading_account_id", accountId).maybeSingle();
  if (!data) throw new Err("Stored MT5 credentials missing — reconnect the account", 404);
  return decryptSecret(data.password_encrypted, Deno.env.get("TOKEN_ENCRYPTION_KEY")!);
}

async function connect(admin: SupabaseClient, acct: Record<string, any>) {
  const pwd = await password(admin, acct.id);
  const id = crypto.randomUUID();
  const raw = await mt5("/ConnectEx", { user: String(acct.login_id), password: pwd, server: String(acct.server), id, connectTimeoutSeconds: 40, connectTimeoutClusterMemberSeconds: 15 });
  return typeof raw === "string" && raw.replace(/"/g, "") ? raw.replace(/"/g, "") : id;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

async function deliver(admin: SupabaseClient, onlyAccountId?: string) {
  let q = admin.from("trading_accounts").select(COLS).eq("direct_signal_enabled", true).eq("is_active", true).eq("is_botvio_robot", false);
  if (onlyAccountId) q = q.eq("id", onlyAccountId);
  const { data: accounts } = await q;
  if (!accounts?.length) return { accounts: 0, executed: 0, skipped: 0 };
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: signals } = await admin.from("trading_signals")
    .select("id,symbol,direction,entry_price,stop_loss,take_profit,confidence,created_at")
    .eq("status", "ACTIVE").gte("created_at", since).order("created_at", { ascending: true }).limit(50);
  const globalLive = await liveGlobal(admin);
  let executed = 0, skipped = 0;

  for (const a of accounts as Record<string, any>[]) {
    // LIVE accounts need the per-account typed confirmation AND the global live switch.
    if (a.environment === "LIVE" && (!a.direct_live_confirmed_at || !globalLive)) {
      await admin.from("trading_accounts").update({ direct_signal_status: "blocked_live", last_direct_error: "LIVE direct execution is locked until confirmed and enabled globally" }).eq("id", a.id);
      continue;
    }
    const map = (a.direct_symbol_map ?? {}) as Record<string, string>;
    let session: string | null = null;
    for (const s of signals ?? []) {
      if ((s.confidence ?? 0) < (a.direct_min_confidence ?? 70)) continue;
      const direction = String(s.direction).toUpperCase() === "SHORT" ? "SELL" : String(s.direction).toUpperCase() === "LONG" ? "BUY" : String(s.direction).toUpperCase();
      const mapped = map[s.symbol] ?? map[norm(s.symbol)] ?? s.symbol;
      // Idempotency: the unique (account, signal) row is claimed before any order is sent.
      const { data: claim, error: claimErr } = await admin.from("direct_executions").insert({
        trading_account_id: a.id, user_id: a.user_id, signal_id: s.id, symbol: s.symbol, mt5_symbol: mapped,
        direction, volume: a.direct_lot ?? 0.01, entry_price: s.entry_price, stop_loss: s.stop_loss, take_profit: s.take_profit,
        environment: a.environment ?? "DEMO", mode: LIVE_MODE ? "live" : "simulated", status: "pending",
      }).select("id").single();
      if (claimErr || !claim) { skipped++; continue; }
      const now = new Date().toISOString();
      await admin.from("trading_accounts").update({ last_direct_signal_at: now }).eq("id", a.id);
      try {
        let ticket: string | null = null;
        if (LIVE_MODE) {
          session = session ?? await connect(admin, a);
          const res = await mt5("/OrderSend", {
            id: session, symbol: mapped, operation: direction === "BUY" ? "Buy" : "Sell", volume: Number(a.direct_lot ?? 0.01),
            price: 0, slippage: 20, stoploss: Number(s.stop_loss ?? 0), takeprofit: Number(s.take_profit ?? 0), comment: "botvio-direct",
          }) as Record<string, unknown>;
          ticket = String((res as any)?.ticket ?? (res as any)?.Ticket ?? (res as any)?.order ?? "") || null;
        }
        await admin.from("direct_executions").update({ status: LIVE_MODE ? "sent" : "simulated", ticket }).eq("id", claim.id);
        await admin.from("trading_accounts").update({ last_direct_execution_at: now, last_direct_error: null, direct_signal_status: "on" }).eq("id", a.id);
        executed++;
      } catch (e) {
        const msg = String((e as Error).message ?? e).slice(0, 300);
        await admin.from("direct_executions").update({ status: "failed", error: msg }).eq("id", claim.id);
        await admin.from("trading_accounts").update({ last_direct_error: msg, direct_signal_status: "error" }).eq("id", a.id);
      }
    }
    if (session) { try { await mt5("/Disconnect", { id: session }); } catch { /* ignore */ } }
  }
  return { accounts: accounts.length, executed, skipped };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    // Scheduler path: service-role caller runs delivery for all enabled accounts.
    if (token && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      return json({ ok: true, mode: LIVE_MODE ? "live" : "simulated", ...(await deliver(admin)) });
    }

    if (!token) throw new Err("Sign in required", 401);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) throw new Err("Sign in required", 401);
    const userId = u.user.id;
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "super_admin"]).limit(1);
    const isAdmin = (roles?.length ?? 0) > 0;

    const loadOwn = async (id: string) => {
      const { data } = await admin.from("trading_accounts").select(COLS).eq("id", id).maybeSingle();
      if (!data) throw new Err("Account not found", 404);
      if (data.user_id !== userId && !isAdmin) throw new Err("Not your account", 403);
      if (data.is_botvio_robot) throw new Err("The Botvio Robot master is managed separately", 400);
      if (String(data.platform ?? "mt5").toLowerCase() === "deriv" || !data.login_id || !data.server) throw new Err("Direct signals need an MT5 account", 400);
      return data as Record<string, any>;
    };
    const audit = (ok: boolean, accountId: string | null, details: Record<string, unknown>) =>
      admin.from("tradecopy_audit_log").insert({ user_id: userId, trading_account_id: accountId, action: `direct_${action}`, mode: LIVE_MODE ? "live" : "simulated", ok, details: details as never });

    switch (action) {
      case "status":
        return json({ ok: true, mode: LIVE_MODE ? "live" : "simulated", liveEnabled: await liveGlobal(admin), livePhrase: LIVE_PHRASE });

      case "enable": {
        const p = z.object({ account_id: z.string().uuid(), confirm_text: z.string().optional(), lot: z.number().min(0.01).max(5).optional(), min_confidence: z.number().int().min(50).max(99).optional() }).parse(body);
        const a = await loadOwn(p.account_id);
        const patch: Record<string, unknown> = { direct_signal_enabled: true, direct_signal_status: "on", last_direct_error: null };
        if (p.lot) patch.direct_lot = p.lot;
        if (p.min_confidence) patch.direct_min_confidence = p.min_confidence;
        if (a.environment === "LIVE") {
          if (p.confirm_text !== LIVE_PHRASE) throw new Err(`Type "${LIVE_PHRASE}" to enable direct signals on a LIVE account`);
          if (!(await liveGlobal(admin))) throw new Err("LIVE trading is switched off for Botvio right now");
          patch.direct_live_confirmed_at = new Date().toISOString();
        }
        await admin.from("trading_accounts").update(patch).eq("id", a.id);
        await audit(true, a.id, { environment: a.environment });
        return json({ ok: true, enabled: true });
      }

      case "disable": {
        const a = await loadOwn(z.object({ account_id: z.string().uuid() }).parse(body).account_id);
        await admin.from("trading_accounts").update({ direct_signal_enabled: false, direct_signal_status: "off", direct_live_confirmed_at: null }).eq("id", a.id);
        await audit(true, a.id, {});
        return json({ ok: true, enabled: false });
      }

      case "set_symbol_map": {
        const p = z.object({ account_id: z.string().uuid(), map: z.record(z.string().max(30), z.string().min(1).max(30)) }).parse(body);
        if (Object.keys(p.map).length > 100) throw new Err("Too many mappings");
        const a = await loadOwn(p.account_id);
        await admin.from("trading_accounts").update({ direct_symbol_map: p.map }).eq("id", a.id);
        return json({ ok: true });
      }

      case "test_connection": {
        const a = await loadOwn(z.object({ account_id: z.string().uuid() }).parse(body).account_id);
        if (!API_KEY) throw new Err("MT5 connection service is not configured");
        try {
          const s = await connect(admin, a);
          try { await mt5("/Disconnect", { id: s }); } catch { /* ignore */ }
          await audit(true, a.id, {});
          return json({ ok: true, connected: true });
        } catch (e) {
          const msg = String((e as Error).message).slice(0, 200);
          await admin.from("trading_accounts").update({ last_direct_error: msg }).eq("id", a.id);
          await audit(false, a.id, { error: msg });
          return json({ ok: false, error: "Could not connect to this MT5 account. Check the server name and password." });
        }
      }

      case "deliver_now": {
        const p = z.object({ account_id: z.string().uuid().optional() }).parse(body);
        if (p.account_id) await loadOwn(p.account_id);
        else if (!isAdmin) throw new Err("Admins only", 403);
        return json({ ok: true, mode: LIVE_MODE ? "live" : "simulated", ...(await deliver(admin, p.account_id)) });
      }

      case "admin_set": {
        if (!isAdmin) throw new Err("Admins only", 403);
        const p = z.object({ account_id: z.string().uuid(), enabled: z.boolean() }).parse(body);
        // Admin can always switch OFF; switching ON a LIVE account still needs the owner's typed confirmation.
        const { data: a } = await admin.from("trading_accounts").select("environment,direct_live_confirmed_at").eq("id", p.account_id).maybeSingle();
        if (p.enabled && a?.environment === "LIVE" && !a.direct_live_confirmed_at) throw new Err("The owner must confirm LIVE direct signals first");
        await admin.from("trading_accounts").update({ direct_signal_enabled: p.enabled, direct_signal_status: p.enabled ? "on" : "off" }).eq("id", p.account_id);
        await audit(true, p.account_id, { enabled: p.enabled, by: "admin" });
        return json({ ok: true });
      }

      default:
        throw new Err(`Unknown action "${action}"`);
    }
  } catch (e) {
    if (e instanceof z.ZodError) return json({ ok: false, error: "Invalid request" }, 400);
    const status = e instanceof Err ? e.status : 500;
    console.error("[mt5-direct-execution]", (e as Error).message);
    return json({ ok: false, error: e instanceof Err ? e.message : "Direct execution failed" }, status >= 500 ? 500 : 200);
  }
});
