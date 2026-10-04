// Botvio generated signals -> the existing TradeCopy MT5 infrastructure.
import { assertAutomationKey } from "../_shared/automationAuth.ts";
// No Bridge EA, VPS terminal, or direct MT5 API is used for signal execution.
// 1) Botvio signals can open on the configured Deriv/provider TradeCopy master.
// 2) Users who enable Direct Signals receive the same signals on their own
//    TradeCopy follower account.
// TradeCopy then handles master -> follower replication in the cloud.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { createAdapter } from "../_shared/tradecopy/adapter.ts";
import { normalizeMarketOrder, redact } from "../_shared/tradecopy/core.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const adapter = createAdapter({
  apiKey: Deno.env.get("TRADECOPY_API_KEY"),
  mode: Deno.env.get("TRADECOPY_MODE"),
  baseUrl: Deno.env.get("TRADECOPY_BASE_URL"),
});

const LIVE_PHRASE = "START LIVE SIGNALS";
const COLS = [
  "id,user_id,broker,login_id,server,environment,platform,account_role,is_botvio_robot",
  "direct_signal_enabled,direct_signal_status,direct_live_confirmed_at,direct_lot,direct_min_confidence,direct_symbol_map",
  "last_direct_signal_at,last_direct_execution_at,last_direct_error,tradecopy_user_id,tradecopy_active,is_active",
  "botvio_signal_master_enabled,botvio_signal_master_lot,botvio_signal_min_confidence",
].join(",");

class Err extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function liveGlobal(admin: SupabaseClient) {
  const { data } = await admin.from("app_settings").select("key,value").in("key", ["tradecopy_live_enabled", "direct_live_enabled"]);
  const enabled = (key: string) => (data ?? []).some((row) => row.key === key && (row.value as { enabled?: boolean } | null)?.enabled === true);
  return enabled("tradecopy_live_enabled") || enabled("direct_live_enabled");
}

function assertLiveReady(environment: string, confirmedAt: string | null, globalLive: boolean, adminSelectedMaster = false) {
  if (environment !== "LIVE") return;
  if (adapter.mode !== "live") throw new Err("TradeCopy live mode is not configured on the server", 403);
  if ((!confirmedAt && !adminSelectedMaster) || !globalLive) {
    throw new Err("LIVE TradeCopy execution is locked until it is confirmed and enabled globally", 403);
  }
}

const normalizeDirection = (value: unknown): "BUY" | "SELL" | null => {
  const v = String(value ?? "").toUpperCase();
  if (v === "BUY" || v === "LONG") return "BUY";
  if (v === "SELL" || v === "SHORT") return "SELL";
  return null;
};

const normalSymbol = (s: string) => s.toUpperCase().replace(/\s+/g, "");

async function claimExecution(admin: SupabaseClient, account: Record<string, any>, signal: Record<string, any>, symbol: string, direction: "BUY" | "SELL", volume: number, mode: string) {
  return admin.from("direct_executions").insert({
    trading_account_id: account.id, user_id: account.user_id, signal_id: signal.id, symbol: signal.symbol,
    mt5_symbol: symbol, direction, volume, entry_price: signal.entry_price, stop_loss: signal.stop_loss,
    take_profit: signal.take_profit, environment: account.environment ?? "DEMO", mode, status: "pending",
  }).select("id").single();
}

async function executeForAccount(
  admin: SupabaseClient,
  account: Record<string, any>,
  signal: Record<string, any>,
  role: "master" | "slave",
  volume: number,
  symbol: string,
  globalLive: boolean,
) {
  const direction = normalizeDirection(signal.direction);
  if (!direction) return { ok: false, skipped: true, reason: "unsupported signal direction" };
  if (!account.tradecopy_user_id) return { ok: false, skipped: true, reason: "TradeCopy account is not registered" };
  if (!account.tradecopy_active) return { ok: false, skipped: true, reason: "TradeCopy account is inactive" };
  if ((signal.confidence ?? 0) < (account.direct_min_confidence ?? account.botvio_signal_min_confidence ?? 70)) {
    return { ok: false, skipped: true, reason: "confidence below configured threshold" };
  }

  try {
    assertLiveReady(String(account.environment ?? "DEMO"), account.direct_live_confirmed_at, globalLive, role === "master");
  } catch (e) {
    const reason = String((e as Error).message);
    await admin.from("trading_accounts").update({ last_direct_error: reason, direct_signal_status: "blocked_live" }).eq("id", account.id);
    return { ok: false, skipped: true, reason };
  }

  const { data: claim, error: claimErr } = await claimExecution(
    admin, account, signal, symbol, direction, volume, adapter.mode === "live" ? "tradecopy" : "simulated",
  );
  if (claimErr || !claim) return { ok: false, skipped: true, reason: "already claimed or execution record unavailable" };

  const now = new Date().toISOString();
  await admin.from("trading_accounts").update({ last_direct_signal_at: now }).eq("id", account.id);

  try {
    const order = normalizeMarketOrder({
      symbol, side: direction, lots: volume, stopLoss: signal.stop_loss, takeProfit: signal.take_profit,
    });
    const result = await adapter.createMarketOrder(account.tradecopy_user_id, role, order);
    await admin.from("direct_executions").update({
      status: adapter.mode === "live" ? "sent" : "simulated",
      ticket: String((result as any)?.ticket ?? (result as any)?.orderId ?? ""),
    }).eq("id", claim.id);
    await admin.from("trading_accounts").update({
      last_direct_execution_at: now, last_direct_error: null, direct_signal_status: "on",
    }).eq("id", account.id);
    return { ok: true, skipped: false, result: redact(result) };
  } catch (e) {
    const msg = String((e as Error).message ?? e).slice(0, 300);
    await admin.from("direct_executions").update({ status: "failed", error: msg }).eq("id", claim.id);
    await admin.from("trading_accounts").update({ last_direct_error: msg, direct_signal_status: "error" }).eq("id", account.id);
    return { ok: false, skipped: false, reason: msg };
  }
}

async function deliver(admin: SupabaseClient, onlyAccountId?: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: signals, error: signalError } = await admin.from("trading_signals")
    .select("id,symbol,direction,entry_price,stop_loss,take_profit,confidence,created_at,status")
    .eq("status", "ACTIVE").gte("created_at", since).order("created_at", { ascending: true }).limit(100);

  if (signalError) throw new Err("Could not load Botvio signals: " + signalError.message, 500);
  if (!signals?.length) return { signals: 0, masterExecuted: 0, directExecuted: 0, skipped: 0 };

  const globalLive = await liveGlobal(admin);

  // Prefer the explicitly configured Botvio Signal Master.
  // If none is configured, use the existing provider master only when there is
  // exactly one active non-Robot TradeCopy master. This makes the existing
  // provider account usable without guessing between multiple providers.
  const { data: configuredMasters } = await admin.from("trading_accounts").select(COLS)
    .eq("botvio_signal_master_enabled", true).eq("account_role", "master")
    .eq("is_botvio_robot", false).eq("is_active", true).eq("tradecopy_active", true)
    .not("tradecopy_user_id", "is", null).limit(2);

  let master = configuredMasters?.[0] as Record<string, any> | undefined;
  let signalMasterFallback = false;

  if (!master) {
    const { data: providerMasters } = await admin.from("trading_accounts").select(COLS)
      .eq("account_role", "master")
      .eq("is_botvio_robot", false).eq("is_active", true).eq("tradecopy_active", true)
      .not("tradecopy_user_id", "is", null).limit(2);
    if ((providerMasters ?? []).length === 1) {
      master = providerMasters[0] as Record<string, any>;
      signalMasterFallback = true;
    }
  }

  let masterExecuted = 0, directExecuted = 0, skipped = 0;

  if (master) {
    for (const signal of signals as Record<string, any>[]) {
      const direction = normalizeDirection(signal.direction);
      if (!direction || Number(signal.confidence ?? 0) < Number(master.botvio_signal_min_confidence ?? 70)) {
        skipped++;
        continue;
      }
      const result = await executeForAccount(admin, master, signal, "master", Number(master.botvio_signal_master_lot ?? 0.01), String(signal.symbol), globalLive);
      if (result.ok) masterExecuted++; else if (result.skipped) skipped++;
    }
  }

  let q = admin.from("trading_accounts").select(COLS)
    .eq("direct_signal_enabled", true).eq("is_active", true).eq("is_botvio_robot", false)
    .eq("account_role", "slave").not("tradecopy_user_id", "is", null);
  if (onlyAccountId) q = q.eq("id", onlyAccountId);
  const { data: directAccounts } = await q;

  // Prevent duplicate trades: if a follower is already actively copying the
  // Botvio Robot or the configured Botvio Signal Master, TradeCopy itself will
  // deliver the signal. Do not also send the same signal directly to the slave.
  const directIds = (directAccounts ?? []).map((a: any) => a.id).filter(Boolean);
  const copyManagedFollowerIds = new Set<string>();
  if (directIds.length) {
    const { data: activeLinks } = await admin.from("copy_relationships")
      .select("follower_account_id,master_account_id,status,is_botvio_robot")
      .in("follower_account_id", directIds)
      .eq("status", "active");
    const masterIds = [...new Set((activeLinks ?? []).map((x: any) => x.master_account_id).filter(Boolean))];
    const { data: linkMasters } = masterIds.length
      ? await admin.from("trading_accounts").select("id,is_botvio_robot,botvio_signal_master_enabled").in("id", masterIds)
      : { data: [] };
    const masterById = new Map((linkMasters ?? []).map((m: any) => [m.id, m]));
    for (const link of (activeLinks ?? []) as any[]) {
      const master = masterById.get(link.master_account_id);
      if (link.is_botvio_robot === true || master?.is_botvio_robot === true || master?.botvio_signal_master_enabled === true) {
        copyManagedFollowerIds.add(link.follower_account_id);
      }
    }
  }

  let directSkippedByCopy = 0;
  for (const account of (directAccounts ?? []) as Record<string, any>[]) {
    if (copyManagedFollowerIds.has(account.id)) {
      directSkippedByCopy++;
      continue;
    }
    const map = (account.direct_symbol_map ?? {}) as Record<string, string>;
    for (const signal of signals as Record<string, any>[]) {
      const rawSymbol = String(signal.symbol);
      const mapped = map[rawSymbol] ?? map[normalSymbol(rawSymbol)] ?? rawSymbol;
      const result = await executeForAccount(admin, account, signal, "slave", Number(account.direct_lot ?? 0.01), mapped, globalLive);
      if (result.ok) directExecuted++; else if (result.skipped) skipped++;
    }
  }

  return { signals: signals.length, signalMasterConfigured: !!master, signalMasterFallback, masterExecuted, directAccounts: directAccounts?.length ?? 0, directExecuted, directSkippedByCopy, skipped };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "wake") {
      if (!assertAutomationKey(req)) return new Response(JSON.stringify({ success: false, error: "Unauthorized automation trigger" }), { status: 401, headers: { "Content-Type": "application/json" } });
      const r = await deliver(admin);
      return json({ ok: true, adapterMode: adapter.mode, ...r });
    }

    if (token && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      const r = await deliver(admin);
      return json({ ok: true, adapterMode: adapter.mode, ...r });
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
      const platform = String(data.platform ?? "mt5").toLowerCase().replace(/[\s_-]+/g, "");
      const nonMt5 = new Set(["mt4", "ctrader", "derivoptions", "binary", "options"]);
      if (nonMt5.has(platform) || !data.login_id || !data.server) throw new Err("Direct signals need a valid MT5 account with login and server", 400);
      return data as Record<string, any>;
    };

    const audit = (ok: boolean, accountId: string | null, details: Record<string, unknown>) =>
      admin.from("tradecopy_audit_log").insert({
        user_id: userId, trading_account_id: accountId, action: "direct_" + action, mode: adapter.mode, ok, details: details as never,
      });

    switch (action) {
      case "status":
        return json({ ok: true, mode: adapter.mode, liveEnabled: await liveGlobal(admin), livePhrase: LIVE_PHRASE, execution: "TradeCopy" });

      case "enable": {
        const p = z.object({
          account_id: z.string().uuid(), confirm_text: z.string().optional(),
          lot: z.number().min(0.01).max(5).optional(), min_confidence: z.number().int().min(50).max(99).optional(),
        }).parse(body);
        const a = await loadOwn(p.account_id);
        if (a.account_role !== "slave" || !a.tradecopy_user_id) throw new Err("Connect this Deriv MT5 account as a TradeCopy follower first");
        if (!a.tradecopy_active) throw new Err("Activate TradeCopy copying for this follower before enabling Direct Signals");
        const patch: Record<string, unknown> = { direct_signal_enabled: true, direct_signal_status: "on", last_direct_error: null };
        if (p.lot) patch.direct_lot = p.lot;
        if (p.min_confidence) patch.direct_min_confidence = p.min_confidence;
        if (a.environment === "LIVE") {
          if (p.confirm_text !== LIVE_PHRASE) throw new Err("Type \"" + LIVE_PHRASE + "\" to enable direct signals on a LIVE account");
          if (!(await liveGlobal(admin))) throw new Err("LIVE trading is switched off for Botvio right now");
          if (adapter.mode !== "live") throw new Err("TradeCopy live mode is not configured on the server", 403);
          patch.direct_live_confirmed_at = new Date().toISOString();
        }
        await admin.from("trading_accounts").update(patch).eq("id", a.id);
        await audit(true, a.id, { environment: a.environment, execution: "TradeCopy" });
        return json({ ok: true, enabled: true, execution: "TradeCopy" });
      }

      case "disable": {
        const a = await loadOwn(z.object({ account_id: z.string().uuid() }).parse(body).account_id);
        await admin.from("trading_accounts").update({ direct_signal_enabled: false, direct_signal_status: "off", direct_live_confirmed_at: null }).eq("id", a.id);
        await audit(true, a.id, { execution: "TradeCopy" });
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
        if (!a.tradecopy_user_id) throw new Err("Connect this account to TradeCopy first");
        try {
          const diagnostic = await adapter.diagnostic(a.tradecopy_user_id);
          await admin.from("trading_accounts").update({ last_direct_error: null, direct_signal_status: "on" }).eq("id", a.id);
          await audit(true, a.id, { diagnostic: redact(diagnostic), execution: "TradeCopy" });
          return json({ ok: true, connected: true, diagnostic: redact(diagnostic), execution: "TradeCopy" });
        } catch (e) {
          const msg = String((e as Error).message).slice(0, 200);
          await admin.from("trading_accounts").update({ last_direct_error: msg, direct_signal_status: "error" }).eq("id", a.id);
          await audit(false, a.id, { error: msg, execution: "TradeCopy" });
          return json({ ok: false, error: "TradeCopy could not verify this MT5 account. Check the account/server connection." });
        }
      }

      case "send_order": {
        const p = z.object({
          account_id: z.string().uuid(),
          symbol: z.string().min(1).max(32),
          direction: z.enum(["BUY", "SELL"]),
          volume: z.number().min(0.01).max(50),
          stop_loss: z.number().positive().optional(),
          take_profit: z.number().positive().optional(),
        }).parse(body);
        const a = await loadOwn(p.account_id);
        if (a.account_role !== "slave" || !a.tradecopy_user_id) throw new Err("Connect this MT5 account as a TradeCopy follower first");
        if (!a.tradecopy_active) throw new Err("Activate TradeCopy copying for this Deriv MT5 follower first");
        const globalLive = await liveGlobal(admin);
        assertLiveReady(String(a.environment ?? "DEMO"), a.direct_live_confirmed_at, globalLive);
        const order = normalizeMarketOrder({
          symbol: p.symbol,
          side: p.direction,
          lots: p.volume,
          stopLoss: p.stop_loss,
          takeProfit: p.take_profit,
        });
        const result = await adapter.createMarketOrder(a.tradecopy_user_id, "slave", order);
        await admin.from("tradecopy_audit_log").insert({
          user_id: userId,
          trading_account_id: a.id,
          action: "direct_manual_order",
          mode: adapter.mode,
          ok: true,
          details: { symbol: p.symbol, direction: p.direction, volume: p.volume, execution: "TradeCopy" },
        });
        return json({ ok: true, execution: "TradeCopy", adapterMode: adapter.mode, result: redact(result) });
      }

      case "deliver_now": {
        const p = z.object({ account_id: z.string().uuid().optional() }).parse(body);
        if (p.account_id) await loadOwn(p.account_id); else if (!isAdmin) throw new Err("Admins only", 403);
        return json({ ok: true, adapterMode: adapter.mode, ...(await deliver(admin, p.account_id)) });
      }

      case "admin_set": {
        if (!isAdmin) throw new Err("Admins only", 403);
        const p = z.object({ account_id: z.string().uuid(), enabled: z.boolean() }).parse(body);
        const { data: a } = await admin.from("trading_accounts").select("environment,direct_live_confirmed_at").eq("id", p.account_id).maybeSingle();
        if (p.enabled && a?.environment === "LIVE" && !a.direct_live_confirmed_at) throw new Err("The owner must confirm LIVE direct signals first");
        await admin.from("trading_accounts").update({ direct_signal_enabled: p.enabled, direct_signal_status: p.enabled ? "on" : "off" }).eq("id", p.account_id);
        await audit(true, p.account_id, { enabled: p.enabled, by: "admin", execution: "TradeCopy" });
        return json({ ok: true });
      }

      default:
        throw new Err("Unknown action " + action);
    }
  } catch (e) {
    if (e instanceof z.ZodError) return json({ ok: false, error: "Invalid request" }, 400);
    const status = e instanceof Err ? e.status : 500;
    console.error("[mt5-tradecopy-execution]", (e as Error).message);
    return json({ ok: false, error: e instanceof Err ? e.message : "TradeCopy signal delivery failed" }, status >= 500 ? 500 : 200);
  }
});
