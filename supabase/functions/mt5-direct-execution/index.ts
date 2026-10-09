// Botvio generated signals -> the existing TradeCopy MT5 infrastructure.
import { assertAutomationKey } from "../_shared/automationAuth.ts";
// No Bridge EA, VPS terminal, or direct MT5 API is used for signal execution.
// 1) Botvio signals can open on the configured Deriv/provider TradeCopy master.
// 2) Users who enable Direct Signals receive the same signals on their own
//    TradeCopy follower account.
// TradeCopy then handles master -> follower replication in the cloud.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";
import { createAdapter } from "../_shared/tradecopy/adapter.ts";
import { TradeCopyError, normalizeMarketOrder, redact } from "../_shared/tradecopy/core.ts";

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
  "direct_execution_entitled,direct_execution_plan,direct_execution_expires_at",
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

// Botvio signal names -> standard Deriv MT5 symbol names. Markets not listed
// (e.g. Weltrade SyntX) are never sent to a Deriv master.
const DERIV_MT5: Record<string, string> = {
  "EUR/USD": "EURUSD", "GBP/USD": "GBPUSD", "USD/JPY": "USDJPY", "AUD/USD": "AUDUSD", "USD/CAD": "USDCAD",
  "USD/CHF": "USDCHF", "NZD/USD": "NZDUSD", "EUR/JPY": "EURJPY", "GBP/JPY": "GBPJPY", "EUR/GBP": "EURGBP",
  "GOLD": "XAUUSD", "XAU/USD": "XAUUSD", "XAUUSD": "XAUUSD", "SILVER": "XAGUSD", "XAG/USD": "XAGUSD",
  "BTC/USD": "BTCUSD", "ETH/USD": "ETHUSD", "US30": "US 30", "NAS100": "US Tech 100", "UK100": "UK 100",
  // Deriv Synthetic CFDs. Keep these explicit so a Deriv master receives
  // Synthetic Hub signals instead of silently skipping them.
  "BOOM300": "Boom 300 Index", "BOOM 300 INDEX": "Boom 300 Index",
  "BOOM500": "Boom 500 Index", "BOOM 500 INDEX": "Boom 500 Index", "BOOM 500 INDEX MT5": "Boom 500 Index",
  "BOOM600": "Boom 600 Index", "BOOM 600 INDEX": "Boom 600 Index",
  "BOOM900": "Boom 900 Index", "BOOM 900 INDEX": "Boom 900 Index",
  "BOOM1000": "Boom 1000 Index", "BOOM 1000 INDEX": "Boom 1000 Index",
  "CRASH150": "Crash 150 Index", "CRASH 150 INDEX": "Crash 150 Index",
  "CRASH300": "Crash 300 Index", "CRASH 300 INDEX": "Crash 300 Index",
  "CRASH500": "Crash 500 Index", "CRASH 500 INDEX": "Crash 500 Index",
  "CRASH600": "Crash 600 Index", "CRASH 600 INDEX": "Crash 600 Index",
  "CRASH900": "Crash 900 Index", "CRASH 900 INDEX": "Crash 900 Index",
  "CRASH1000": "Crash 1000 Index", "CRASH 1000 INDEX": "Crash 1000 Index",
  "R_10": "Volatility 10 Index", "VOLATILITY 10 INDEX": "Volatility 10 Index",
  "R_25": "Volatility 25 Index", "VOLATILITY 25 INDEX": "Volatility 25 Index",
  "R_50": "Volatility 50 Index", "VOLATILITY 50 INDEX": "Volatility 50 Index",
  "R_75": "Volatility 75 Index", "VOLATILITY 75 INDEX": "Volatility 75 Index",
  "R_100": "Volatility 100 Index", "VOLATILITY 100 INDEX": "Volatility 100 Index",
  "1HZ10V": "Volatility 10 (1s) Index", "VOLATILITY 10 (1S) INDEX": "Volatility 10 (1s) Index",
  "1HZ25V": "Volatility 25 (1s) Index", "VOLATILITY 25 (1S) INDEX": "Volatility 25 (1s) Index",
  "1HZ50V": "Volatility 50 (1s) Index", "VOLATILITY 50 (1S) INDEX": "Volatility 50 (1s) Index",
  "1HZ75V": "Volatility 75 (1s) Index", "VOLATILITY 75 (1S) INDEX": "Volatility 75 (1s) Index",
  "1HZ100V": "Volatility 100 (1s) Index", "VOLATILITY 100 (1S) INDEX": "Volatility 100 (1s) Index",
  "1HZ150V": "Volatility 150 (1s) Index", "VOLATILITY 150 (1S) INDEX": "Volatility 150 (1s) Index",
  "1HZ250V": "Volatility 250 (1s) Index", "VOLATILITY 250 (1S) INDEX": "Volatility 250 (1s) Index",
  "1HZ15V": "Volatility 15 (1s) Index", "VOLATILITY 15 (1S) INDEX": "Volatility 15 (1s) Index",
  "1HZ30V": "Volatility 30 (1s) Index", "VOLATILITY 30 (1S) INDEX": "Volatility 30 (1s) Index",
  "1HZ90V": "Volatility 90 (1s) Index", "VOLATILITY 90 (1S) INDEX": "Volatility 90 (1s) Index",
};
const derivMt5Symbol = (s: string) => DERIV_MT5[String(s).toUpperCase()] ?? DERIV_MT5[String(s)] ?? null;

// Validate the mapped symbol against the account's real MT5 symbol list before
// any order is sent. Only possible against the live TradeCopy API; mock mode
// has no real symbol list, so it reports "unverified" instead of inventing one.
const symbolCache = new Map<number, Set<string> | null>();
async function validateMt5Symbol(tcUserId: number, symbol: string): Promise<{ ok: boolean; reason?: string; verified: boolean }> {
  if (adapter.mode !== "live") return { ok: true, verified: false };
  if (!symbolCache.has(tcUserId)) {
    try {
      const raw = await adapter.getAllSymbols(tcUserId);
      const names = new Set<string>();
      const walk = (v: unknown) => {
        if (typeof v === "string") names.add(v.trim().toUpperCase());
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk);
      };
      walk(raw);
      symbolCache.set(tcUserId, names);
    } catch (e) {
      console.error("[mt5-direct-execution] symbol list failed", (e as Error).message);
      symbolCache.set(tcUserId, null);
    }
  }
  const names = symbolCache.get(tcUserId);
  if (!names) return { ok: false, verified: false, reason: "Could not load the MT5 symbol list from TradeCopy" };
  if (!names.has(symbol.toUpperCase())) return { ok: false, verified: true, reason: `Symbol "${symbol}" is not offered on this MT5 account` };
  return { ok: true, verified: true };
}

async function hasPaidMt5Entitlement(admin: SupabaseClient, account: Record<string, any>) {
  if (account.direct_execution_entitled === true) {
    const expires = account.direct_execution_expires_at ? new Date(account.direct_execution_expires_at).getTime() : null;
    if (expires === null || (!Number.isNaN(expires) && expires > Date.now())) return true;
  }
  if (!account.user_id) return false;
  // Admin-owned accounts have full access without buying the plan.
  const { data: staff } = await admin.from("user_roles").select("role").eq("user_id", account.user_id).in("role", ["admin", "super_admin"]).limit(1);
  if (staff?.length) return true;
  const { data: product } = await admin.from("products").select("id").eq("slug", "mt5-direct").maybeSingle();
  if (!product?.id) return false;
  const { data: entitlement } = await admin.from("entitlements")
    .select("id,status,ends_at")
    .eq("user_id", account.user_id)
    .eq("product_id", product.id)
    .eq("status", "active")
    .or("ends_at.is.null,ends_at.gt." + new Date().toISOString())
    .maybeSingle();
  return !!entitlement;
}

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
  if (role !== "master" && !(await hasPaidMt5Entitlement(admin, account))) return { ok: false, skipped: true, reason: "MT5 Direct Execution is not active for this paid subscription" };
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

  const check = await validateMt5Symbol(Number(account.tradecopy_user_id), symbol);

  const { data: claim, error: claimErr } = await claimExecution(
    admin, account, signal, symbol, direction, volume, adapter.mode === "live" ? "tradecopy" : "simulated",
  );
  if (claimErr || !claim) return { ok: false, skipped: true, reason: "already claimed or execution record unavailable" };

  const now = new Date().toISOString();
  await admin.from("trading_accounts").update({ last_direct_signal_at: now }).eq("id", account.id);
  if (!check.ok) {
    await admin.from("direct_executions").update({ status: "failed", error: check.reason }).eq("id", claim.id);
    return { ok: false, skipped: false, reason: check.reason };
  }

  try {
    const order = normalizeMarketOrder({
      symbol, side: direction, lots: volume,
      stopLoss: signal.stop_loss, takeProfit: signal.take_profit,
      referencePrice: signal.entry_price,
    });
    let result: unknown;
    let stopsStrippedForDemo = false;
    let stopDiagnostic: unknown = null;
    try {
      result = await adapter.createMarketOrder(account.tradecopy_user_id, role, order);
    } catch (firstError) {
      const firstMsg = String((firstError as Error)?.message ?? firstError);
      const invalidStops = /invalid stops|invalid stop|stops in the request/i.test(firstMsg);
      if (!invalidStops) throw firstError;

      // Capture the broker/TradeCopy account diagnostic when MT5 rejects SL/TP.
      // This is read-only and gives us the actual account-side evidence needed
      // for the permanent stop-distance fix; never fabricate a stop level.
      try {
        stopDiagnostic = await adapter.diagnostic(account.tradecopy_user_id);
        console.warn("[mt5-direct-execution] TradeCopy diagnostic after Invalid stops:", redact(stopDiagnostic));
      } catch (diagnosticError) {
        console.warn("[mt5-direct-execution] Could not retrieve TradeCopy diagnostic:", String((diagnosticError as Error)?.message ?? diagnosticError));
      }

      // DEMO-only diagnostic fallback: prove the market-order path works without
      // silently weakening LIVE risk controls. LIVE accounts fail closed.
      if (String(account.environment ?? "DEMO").toUpperCase() !== "DEMO") throw firstError;
      console.warn("[mt5-direct-execution] DEMO TradeCopy rejected signal stops; retrying market order without SL/TP for execution-path validation");
      result = await adapter.createMarketOrder(account.tradecopy_user_id, role, {
        ...order,
        stopLoss: null,
        takeProfit: null,
      });
      stopsStrippedForDemo = true;
    }
    const r = result as any;
    const ticket = r?.ticket ?? r?.orderId ?? r?.order ?? r?.data?.ticket ?? r?.data?.order ?? r?.data?.orderId ?? "";
    await admin.from("direct_executions").update({
      status: adapter.mode === "live" ? "sent" : "simulated",
      ticket: String(ticket),
      error: stopsStrippedForDemo
        ? `DEMO diagnostic: TradeCopy rejected the supplied SL/TP as invalid; market order was accepted without stops. Diagnostic: ${JSON.stringify(redact(stopDiagnostic)).slice(0, 900)}. Do not use this fallback for LIVE.`
        : (adapter.mode === "live" ? null : "Simulated (TradeCopy mock mode) — no real order sent"),
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

  // Configured Signal Master wins. Otherwise every active non-Robot provider
  // master (max two: Deriv + Weltrade) is considered, and each only receives
  // signals whose symbol maps to its own broker.
  let masters = (configuredMasters ?? []) as Record<string, any>[];
  let signalMasterFallback = false;
  if (!masters.length) {
    const { data: providerMasters } = await admin.from("trading_accounts").select(COLS)
      .eq("account_role", "master")
      .eq("is_botvio_robot", false).eq("is_active", true).eq("tradecopy_active", true)
      .not("tradecopy_user_id", "is", null).limit(2);
    masters = (providerMasters ?? []) as Record<string, any>[];
    signalMasterFallback = masters.length > 0;
  }
  const master = masters[0];

  let masterExecuted = 0, directExecuted = 0, skipped = 0;
  const failures: Array<{ account: string; symbol: string; reason: string }> = [];
  const isPositionLimitError = (reason: string) => /TRADE_RETCODE_LIMIT_POSITIONS|limit[_ ]positions|maximum.*position|position.*limit|too many positions/i.test(reason);
  const isInvalidVolumeError = (reason: string) => /invalid volume|volume.*invalid|invalid.*lot|lot.*invalid/i.test(reason);

  for (const m of masters) {
    const isDeriv = /deriv/i.test(String(m.server ?? m.broker ?? ""));
    const isWeltrade = /weltrade/i.test(String(m.server ?? m.broker ?? ""));
    // Once TradeCopy/broker reports a position-limit rejection, stop sending
    // additional master orders in this delivery cycle. Do not keep retrying
    // other symbols against the same exhausted account.
    let masterPositionLimitReached = false;
    for (const signal of signals as Record<string, any>[]) {
      if (masterPositionLimitReached) { skipped++; continue; }
      const direction = normalizeDirection(signal.direction);
      if (!direction || Number(signal.confidence ?? 0) < Number(m.botvio_signal_min_confidence ?? 70)) { skipped++; continue; }
      const sig = String(signal.symbol);
      const derivSym = derivMt5Symbol(sig);
      // Deriv master: only exact Deriv MT5 mappings. Weltrade master: never Deriv-only symbols.
      const mt5Symbol = isDeriv ? derivSym : (isWeltrade && derivSym && /index/i.test(derivSym) ? null : sig);
      if (!mt5Symbol) { skipped++; continue; }
      // Cooldown: 30 min after a sent trade, 10 min after a failure (stops retry storms).
      const { data: recentTrade } = await admin.from("direct_executions").select("id,status,created_at")
        .eq("trading_account_id", m.id).eq("mt5_symbol", mt5Symbol)
        .gte("created_at", new Date(Date.now() - 30 * 60_000).toISOString()).order("created_at", { ascending: false }).limit(1);
      const last = recentTrade?.[0];
      if (last && (last.status !== "failed" || Date.parse(last.created_at) > Date.now() - 10 * 60_000)) { skipped++; continue; }
      const result = await executeForAccount(admin, m, signal, "master", Number(m.botvio_signal_master_lot ?? 0.01), mt5Symbol, globalLive);
      if (result.ok) {
        masterExecuted++;
      } else if (result.skipped) {
        skipped++;
      } else {
        const reason = String(result.reason ?? "");
        failures.push({ account: m.id, symbol: mt5Symbol, reason });
        if (isPositionLimitError(reason)) {
          masterPositionLimitReached = true;
          // Persist a clear diagnostic for the admin UI. This is a broker/TradeCopy
          // exposure condition, not evidence that the signal or symbol mapping is bad.
          await admin.from("trading_accounts").update({
            last_direct_error: "TradeCopy/broker position limit reached; remaining master signals skipped for this delivery cycle",
            direct_signal_status: "error",
          }).eq("id", m.id);
        } else if (isInvalidVolumeError(reason)) {
          // Never guess a replacement lot size. Volume rules differ by instrument
          // and broker, so the symbol is skipped until its valid lot size is known.
          await admin.from("trading_accounts").update({
            last_direct_error: `TradeCopy rejected ${mt5Symbol} volume ${Number(m.botvio_signal_master_lot ?? 0.01)} as invalid; no automatic lot-size escalation was attempted`,
            direct_signal_status: "error",
          }).eq("id", m.id);
        }
      }
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

  return { signals: signals.length, masters: masters.length, failures, signalMasterConfigured: !!master, signalMasterFallback, masterExecuted, directAccounts: directAccounts?.length ?? 0, directExecuted, directSkippedByCopy, skipped };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "wake") {
      if (!(await assertAutomationKey(req))) return new Response(JSON.stringify({ success: false, error: "Unauthorized automation trigger" }), { status: 401, headers: { "Content-Type": "application/json" } });
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
      const { data: row } = await admin.from("trading_accounts").select(COLS).eq("id", id).maybeSingle();
      const data = row as Record<string, any> | null;
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
        if (!(await hasPaidMt5Entitlement(admin, a))) throw new Err("MT5 Direct Execution is a paid feature. Your account has not been enabled by an admin or the subscription has expired.", 403);
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
        if (!(await hasPaidMt5Entitlement(admin, a))) throw new Err("MT5 Direct Execution is a paid feature. Your subscription does not include direct execution.", 403);
        if (a.account_role !== "slave" || !a.tradecopy_user_id) throw new Err("Connect this MT5 account as a TradeCopy follower first");
        if (!a.tradecopy_active) throw new Err("Activate TradeCopy copying for this Deriv MT5 follower first");
        const globalLive = await liveGlobal(admin);
        assertLiveReady(String(a.environment ?? "DEMO"), a.direct_live_confirmed_at, globalLive);
        const map = (a.direct_symbol_map ?? {}) as Record<string, string>;
        const userMappedSymbol = map[p.symbol] ?? map[normalSymbol(p.symbol)] ?? null;
        const isDeriv = /deriv/i.test(String(a.server ?? a.broker ?? ""));
        const mappedSymbol = userMappedSymbol ?? (isDeriv ? derivMt5Symbol(p.symbol) : null) ?? p.symbol;
        const order = normalizeMarketOrder({
          symbol: mappedSymbol,
          side: p.direction,
          lots: p.volume,
          stopLoss: p.stop_loss,
          takeProfit: p.take_profit,
          referencePrice: undefined,
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
        const p = z.object({
          account_id: z.string().uuid(),
          enabled: z.boolean(),
          entitled: z.boolean().optional(),
          plan: z.string().trim().max(80).optional(),
          expires_at: z.string().datetime().nullable().optional(),
        }).parse(body);
        const { data: a } = await admin.from("trading_accounts")
          .select("environment,direct_live_confirmed_at,direct_signal_enabled,direct_execution_entitled,direct_execution_plan,direct_execution_expires_at")
          .eq("id", p.account_id).maybeSingle();
        if (!a) throw new Err("MT5 account not found", 404);
        const entitlement = p.entitled ?? p.enabled;
        if (p.enabled && !entitlement) throw new Err("Grant the paid MT5 execution entitlement before enabling direct signals");
        if (p.enabled && a.environment === "LIVE" && !a.direct_live_confirmed_at) throw new Err("The owner must confirm LIVE direct signals first");
        const expired = p.expires_at ? new Date(p.expires_at).getTime() <= Date.now() : false;
        if (entitlement && expired) throw new Err("The paid MT5 execution expiry must be in the future");
        const patch: Record<string, unknown> = {
          direct_execution_entitled: entitlement,
          direct_execution_plan: entitlement ? (p.plan ?? a.direct_execution_plan ?? "MT5 Direct") : null,
          direct_execution_expires_at: entitlement ? (p.expires_at ?? a.direct_execution_expires_at ?? null) : null,
          direct_signal_enabled: p.enabled && entitlement,
          direct_signal_status: p.enabled && entitlement ? "on" : "off",
        };
        if (!entitlement) patch.direct_live_confirmed_at = null;
        await admin.from("trading_accounts").update(patch).eq("id", p.account_id);
        await audit(true, p.account_id, { enabled: p.enabled && entitlement, entitled: entitlement, plan: patch.direct_execution_plan, expires_at: patch.direct_execution_expires_at, by: "admin", execution: "TradeCopy" });
        return json({ ok: true, entitled: entitlement, enabled: p.enabled && entitlement, plan: patch.direct_execution_plan, expires_at: patch.direct_execution_expires_at });
      }

      default:
        throw new Err("Unknown action " + action);
    }
  } catch (e) {
    if (e instanceof z.ZodError) return json({ ok: false, error: "Invalid request" }, 400);
    if (e instanceof TradeCopyError) {
      console.error("[mt5-tradecopy-execution][TradeCopyError]", e.message);
      return json({ ok: false, error: e.message });
    }
    const status = e instanceof Err ? e.status : 500;
    console.error("[mt5-tradecopy-execution]", (e as Error).message);
    return json({ ok: false, error: e instanceof Err ? e.message : "TradeCopy signal delivery failed" }, status >= 500 ? 500 : 200);
  }
});
