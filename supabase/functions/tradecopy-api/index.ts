// Secure wrapper around the TradeCopy REST API. API credentials stay server-side.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { createAdapter, ExecutionAdapter } from "../_shared/tradecopy/adapter.ts";
import {
  assertLiveAllowed, normalizeCopySettings, normalizeMarketOrder, normalizeOrderControl, normalizeRisk,
  normalizeSymbol, redact, TradeCopyError, validateRelationship, AccountRole, Environment,
} from "../_shared/tradecopy/core.ts";
import { decryptSecret, encryptSecret } from "../_shared/tradecopy/crypto.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Creds = z.object({
  login: z.coerce.number().int().positive(),
  password: z.string().min(4).max(128),
  broker: z.string().trim().min(2).max(100).default("MT5"),
  server: z.string().trim().min(2).max(100),
  label: z.string().trim().max(80).optional(),
});

type Account = {
  id: string; user_id: string; account_role: AccountRole | null; tradecopy_user_id: number | null;
  environment: Environment; is_botvio_robot: boolean; tradecopy_active: boolean; login_id: string | null; broker: string | null; server: string | null;
};

const ACCOUNT_COLS = "id,user_id,account_role,tradecopy_user_id,environment,is_botvio_robot,tradecopy_active,login_id,broker,server";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const adapter = createAdapter({
    apiKey: Deno.env.get("TRADECOPY_API_KEY"),
    mode: Deno.env.get("TRADECOPY_MODE"),
    baseUrl: Deno.env.get("TRADECOPY_BASE_URL"),
  });
  let userId: string | null = null;
  let action = "unknown";

  const audit = (ok: boolean, details: Record<string, unknown>, accountId?: string) =>
    admin.from("tradecopy_audit_log").insert({ user_id: userId, trading_account_id: accountId ?? null, action, mode: adapter.mode, ok, details: redact(details) as never });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ ok: false, error: "Sign in required" }, 401);
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return json({ ok: false, error: "Sign in required" }, 401);
    userId = u.user.id;

    const body = await req.json().catch(() => ({}));
    action = String(body?.action ?? "");
    const { data: isAdminRow } = await admin.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "super_admin"]).limit(1);
    const isAdmin = (isAdminRow?.length ?? 0) > 0;

    const result = await handle(action, body, { admin, adapter, userId, isAdmin });
    await audit(true, { action, ...(result.auditDetails ?? {}) }, result.accountId);
    return json({ ok: true, mode: adapter.mode, ...result.data });
  } catch (e) {
    const err = e instanceof TradeCopyError ? e : new TradeCopyError((e as Error).message ?? "Unexpected error", "upstream", 500);
    console.error("[tradecopy-api]", action, err.code, err.message);
    try { await audit(false, { error: err.message, code: err.code }); } catch { /* ignore audit failure */ }
    return json({ ok: false, error: err.message, code: err.code }, err.status);
  }
});

interface Ctx { admin: SupabaseClient; adapter: ExecutionAdapter; userId: string; isAdmin: boolean }
interface Out { data: Record<string, unknown>; accountId?: string; auditDetails?: Record<string, unknown> }

async function loadAccount(ctx: Ctx, id: string, opts: { allowAdmin?: boolean } = {}): Promise<Account> {
  const { data } = await ctx.admin.from("trading_accounts").select(ACCOUNT_COLS).eq("id", id).maybeSingle();
  if (!data) throw new TradeCopyError("Account not found", "not_found", 404);
  const a = data as Account;
  if (a.user_id !== ctx.userId && !(opts.allowAdmin && ctx.isAdmin)) throw new TradeCopyError("Not your account", "auth", 403);
  return a;
}

async function globalLiveEnabled(ctx: Ctx) {
  const { data } = await ctx.admin.from("app_settings").select("value").eq("key", "tradecopy_live_enabled").maybeSingle();
  return (data?.value as { enabled?: boolean } | null)?.enabled === true;
}

async function storeAccount(
  ctx: Ctx,
  creds: z.infer<typeof Creds>,
  role: AccountRole,
  extra: Record<string, unknown> = {},
): Promise<Account & { reused: boolean }> {
  const encKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!encKey) throw new TradeCopyError("Secure credential storage is not configured", "config", 500);

  // Reuse an existing MT5 account instead of creating another record every time
  // the user opens the connection dialog. This is intentionally scoped to the
  // same user + platform + execution provider + role + login + server.
  const { data: existing, error: findError } = await ctx.admin
    .from("trading_accounts")
    .select(ACCOUNT_COLS)
    .eq("user_id", ctx.userId)
    .eq("execution_provider", "tradecopy")
    .eq("account_role", role)
    .eq("login_id", String(creds.login))
    .eq("server", creds.server)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findError) throw new TradeCopyError(findError.message, "validation");

  const encryptedPassword = await encryptSecret(creds.password, encKey);

  if (existing) {
    const label = creds.label || `MT5 ${role === "master" ? "Master" : "Follower"} ${creds.login}`;
    const { data: updated, error: updateError } = await ctx.admin
      .from("trading_accounts")
      .update({ broker: creds.broker, label, is_active: true, ...extra })
      .eq("id", existing.id)
      .select(ACCOUNT_COLS)
      .single();
    if (updateError) throw new TradeCopyError(updateError.message, "validation");

    const { data: existingCred } = await ctx.admin
      .from("tradecopy_credentials")
      .select("id")
      .eq("trading_account_id", existing.id)
      .limit(1)
      .maybeSingle();

    if (existingCred?.id) {
      const { error: credError } = await ctx.admin
        .from("tradecopy_credentials")
        .update({ password_encrypted: encryptedPassword })
        .eq("id", existingCred.id);
      if (credError) throw new TradeCopyError("Could not update credentials securely", "config", 500);
    } else {
      const { data: cred, error: credError } = await ctx.admin
        .from("tradecopy_credentials")
        .insert({
          trading_account_id: existing.id,
          user_id: ctx.userId,
          password_encrypted: encryptedPassword,
        })
        .select("id")
        .single();
      if (credError) throw new TradeCopyError("Could not store credentials securely", "config", 500);
      await ctx.admin.from("trading_accounts").update({ credential_ref: cred.id }).eq("id", existing.id);
    }

    return { ...(updated as Account), reused: true };
  }

  const { data: acct, error } = await ctx.admin.from("trading_accounts").insert({
    user_id: ctx.userId, broker: creds.broker, execution_provider: "tradecopy",
    label: creds.label || `MT5 ${role === "master" ? "Master" : "Follower"} ${creds.login}`,
    login_id: String(creds.login), server: creds.server, account_role: role,
    environment: "DEMO", tradecopy_active: false, is_active: true, connection_status: "pending",
    api_key_encrypted: "", ...extra,
  }).select(ACCOUNT_COLS).single();
  if (error) throw new TradeCopyError(error.message, "validation");

  const { data: cred, error: ce } = await ctx.admin.from("tradecopy_credentials").insert({
    trading_account_id: acct.id, user_id: ctx.userId, password_encrypted: encryptedPassword,
  }).select("id").single();
  if (ce) throw new TradeCopyError("Could not store credentials securely", "config", 500);
  await ctx.admin.from("trading_accounts").update({ credential_ref: cred.id }).eq("id", acct.id);
  return { ...(acct as Account), reused: false };
}

async function getPassword(ctx: Ctx, accountId: string) {
  const { data } = await ctx.admin.from("tradecopy_credentials").select("password_encrypted").eq("trading_account_id", accountId).maybeSingle();
  if (!data) throw new TradeCopyError("Stored credentials missing — reconnect the account", "not_found", 404);
  return decryptSecret(data.password_encrypted, Deno.env.get("TOKEN_ENCRYPTION_KEY")!);
}

async function robotMaster(ctx: Ctx): Promise<Account | null> {
  const { data } = await ctx.admin.from("trading_accounts").select(ACCOUNT_COLS).eq("is_botvio_robot", true).eq("account_role", "master").limit(1).maybeSingle();
  return (data as Account) ?? null;
}

async function loadRelationship(ctx: Ctx, id: string) {
  const { data } = await ctx.admin.from("copy_relationships").select("*").eq("id", id).maybeSingle();
  if (!data) throw new TradeCopyError("Copy relationship not found", "not_found", 404);
  if (data.follower_user_id !== ctx.userId && !ctx.isAdmin) throw new TradeCopyError("Not your copy relationship", "auth", 403);
  return data;
}

async function handle(action: string, body: Record<string, unknown>, ctx: Ctx): Promise<Out> {
  const { admin, adapter } = ctx;
  switch (action) {
    case "status": {
      return { data: { adapterMode: adapter.mode, liveEnabled: await globalLiveEnabled(ctx), platform: adapter.platform } };
    }

    case "connect_master": {
      const creds = Creds.parse(body);
      const asRobot = body.botvio_robot === true;
      if (asRobot && !ctx.isAdmin) throw new TradeCopyError("Only admins can connect the Botvio Robot master", "auth", 403);

      // One MT5 login/server can only belong to one master role in Botvio.
      // This server-side check prevents a client from registering the same
      // account as both the official Botvio Robot master and a provider master.
      const { data: conflictingMasters } = await admin
        .from("trading_accounts")
        .select("id,is_botvio_robot,user_id,login_id,server")
        .eq("execution_provider", "tradecopy")
        .eq("account_role", "master")
        .eq("login_id", String(creds.login))
        .eq("server", creds.server);

      const conflict = (conflictingMasters ?? []).find((m: any) =>
        asRobot ? m.is_botvio_robot !== true : m.is_botvio_robot === true
      );
      if (conflict) {
        throw new TradeCopyError(
          asRobot
            ? "This MT5 account is already registered as a provider master and cannot also be the Botvio Robot master."
            : "This MT5 account is already registered as the Botvio Robot master and cannot also be a provider master.",
          "validation",
          409,
        );
      }

      let providerId: string | null = null;
      if (!asRobot) {
        const { data: prov } = await admin.from("providers").select("id").eq("user_id", ctx.userId).limit(1).maybeSingle();
        if (!prov) throw new TradeCopyError("Become a provider first to connect a master account", "validation");
        providerId = prov.id;
      }
      const acct = await storeAccount(ctx, creds, "master", { is_botvio_robot: asRobot });
      // If the account is already registered and connected, reuse it instead of
      // registering another TradeCopy master for the same MT5 login/server.
      if (!acct.reused || !acct.tradecopy_user_id || acct.connection_status === "error") {
        try {
          const reg = await adapter.registerMaster({
            login: creds.login,
            password: creds.password,
            server: creds.server,
            comment: asRobot ? "botvio-robot" : "botvio-provider",
          });
          await admin.from("trading_accounts").update({
            tradecopy_user_id: reg.tradecopyUserId,
            external_account_id: String(reg.tradecopyUserId ?? ""),
            connection_status: "connected",
          }).eq("id", acct.id);
        } catch (e) {
          await admin.from("trading_accounts").update({ connection_status: "error" }).eq("id", acct.id);
          throw e;
        }
      }
      if (providerId) {
        const { data: existingProviderAccount } = await admin
          .from("provider_accounts")
          .select("id")
          .eq("provider_id", providerId)
          .eq("trading_account_id", acct.id)
          .limit(1)
          .maybeSingle();
        if (!existingProviderAccount) {
          await admin.from("provider_accounts").insert({ provider_id: providerId, trading_account_id: acct.id, status: "paused" });
        }
      }
      return { data: { accountId: acct.id, reused: acct.reused }, accountId: acct.id };
    }

    case "connect_follower": {
      const creds = Creds.parse(body);
      const acct = await storeAccount(ctx, creds, "slave");
      // A reconnect updates credentials but must not downgrade an already
      // connected follower back to "saved".
      if (acct.connection_status !== "connected") {
        await admin.from("trading_accounts").update({ connection_status: "saved" }).eq("id", acct.id);
      }
      return { data: { accountId: acct.id, reused: acct.reused }, accountId: acct.id };
    }

    case "link": {
      const p = z.object({
        follower_account_id: z.string().uuid(),
        provider_id: z.string().uuid().optional(),
        botvio_robot: z.boolean().optional(),
        copy_order_type: z.union([z.literal(0), z.literal(1)]).default(1),
      }).parse(body);
      const follower = await loadAccount(ctx, p.follower_account_id);
      let master: Account | null = null;
      if (p.botvio_robot) master = await robotMaster(ctx);
      else if (p.provider_id) {
        const { data: pa } = await admin.from("provider_accounts").select("trading_account_id").eq("provider_id", p.provider_id);
        const ids = (pa ?? []).map((x) => x.trading_account_id);
        if (ids.length) {
          const { data } = await admin.from("trading_accounts").select(ACCOUNT_COLS).in("id", ids).eq("account_role", "master").limit(1).maybeSingle();
          master = (data as Account) ?? null;
        }
      }
      if (!master) throw new TradeCopyError("This provider has not connected an MT5 master account yet", "validation");
      validateRelationship({
        masterRole: master.account_role, followerRole: follower.account_role, masterUserId: master.user_id,
        followerUserId: follower.user_id, masterTradecopyId: master.tradecopy_user_id,
        masterEnvironment: master.environment, followerEnvironment: follower.environment,
      });
      const password = await getPassword(ctx, follower.id);
      const reg = await adapter.registerFollower({
        login: Number(follower.login_id), password, server: follower.server ?? "", masterId: master.tradecopy_user_id!,
        copyOrderType: p.copy_order_type, comment: "botvio-follower",
      });
      await admin.from("trading_accounts").update({ tradecopy_user_id: reg.tradecopyUserId, external_account_id: String(reg.tradecopyUserId ?? ""), connection_status: "connected" }).eq("id", follower.id);
      const { data: rel, error } = await admin.from("copy_relationships").upsert({
        provider_id: p.botvio_robot ? null : p.provider_id, is_botvio_robot: !!p.botvio_robot,
        master_account_id: master.id, follower_account_id: follower.id, follower_user_id: ctx.userId,
        status: "inactive", copy_order_type: p.copy_order_type, environment: follower.environment,
      }, { onConflict: "follower_account_id,master_account_id" }).select("id").single();
      if (error) throw new TradeCopyError(error.message, "validation");
      await admin.from("copy_settings").upsert({ relationship_id: rel.id }, { onConflict: "relationship_id", ignoreDuplicates: true });
      // follower starts inactive on TradeCopy too
      if (reg.tradecopyUserId) await adapter.deactivateFollower(reg.tradecopyUserId);
      return { data: { relationshipId: rel.id }, accountId: follower.id };
    }

    case "update_settings": {
      const rel = await loadRelationship(ctx, String(body.relationship_id));
      const follower = await loadAccount(ctx, rel.follower_account_id, { allowAdmin: true });
      const risk = normalizeRisk({ riskType: body.risk_type, multiplier: body.multiplier });
      const cs = normalizeCopySettings({ copySLTP: body.copy_sltp, scalperMode: body.scalper_mode, orderFilter: body.order_filter, scalperValue: body.scalper_value });
      const oc = normalizeOrderControl((body.order_control as Record<string, unknown>) ?? {});
      if (follower.tradecopy_user_id) {
        await adapter.updateRisk(follower.tradecopy_user_id, risk);
        await adapter.updateStopsLimits(follower.tradecopy_user_id, cs);
        if (Object.keys(oc).length) await adapter.updateOrderControl(follower.tradecopy_user_id, oc);
      }
      await admin.from("copy_settings").update({
        risk_type: risk.riskType, multiplier: risk.multiplier, copy_sltp: cs.copySLTP, order_filter: cs.orderFilter,
        scalper_mode: cs.scalperMode, scalper_value: cs.scalperValue, order_control: oc, synced_at: new Date().toISOString(),
      }).eq("relationship_id", rel.id);
      return { data: {}, accountId: follower.id, auditDetails: { risk, cs } };
    }

    case "map_symbol": {
      const acct = await loadAccount(ctx, String(body.follower_account_id));
      const source = normalizeSymbol(body.source_symbol);
      const follow = normalizeSymbol(body.follow_symbol);
      const type = body.map_type === "Suffix" ? "Suffix" : "Special";
      if (acct.tradecopy_user_id) await adapter.mapSymbol(acct.tradecopy_user_id, source, follow, type);
      await admin.from("symbol_mappings").upsert({
        follower_account_id: acct.id, user_id: ctx.userId, source_symbol: source, follow_symbol: follow, map_type: type,
        synced_at: acct.tradecopy_user_id ? new Date().toISOString() : null,
      }, { onConflict: "follower_account_id,source_symbol" });
      return { data: {}, accountId: acct.id };
    }

    case "delete_mapping": {
      const { data: m } = await admin.from("symbol_mappings").select("id,user_id").eq("id", String(body.mapping_id)).maybeSingle();
      if (!m || m.user_id !== ctx.userId) throw new TradeCopyError("Mapping not found", "not_found", 404);
      await admin.from("symbol_mappings").delete().eq("id", m.id);
      return { data: {} };
    }

    case "discover_symbols": {
      const acct = await loadAccount(ctx, String(body.account_id), { allowAdmin: true });
      if (!acct.tradecopy_user_id) throw new TradeCopyError("Account is not registered with TradeCopy yet", "validation");
      const [suffix, special, all] = await Promise.all([
        adapter.getSuffix(acct.tradecopy_user_id), adapter.getSpecial(acct.tradecopy_user_id), adapter.getAllSymbols(acct.tradecopy_user_id),
      ]);
      return { data: { suffix: redact(suffix), special: redact(special), symbols: redact(all) }, accountId: acct.id };
    }

    case "remove_account": {
      const accountId = String(body.account_id ?? "");
      const acct = await loadAccount(ctx, accountId);
      if (acct.tradecopy_active) {
        throw new TradeCopyError("Deactivate copying before removing this MT5 account", "validation");
      }

      // Stop any follower relationships first so TradeCopy is no longer using
      // this account before the local connection record is removed.
      const { data: rels } = await admin
        .from("copy_relationships")
        .select("id,follower_account_id,master_account_id,status")
        .or(`follower_account_id.eq.${acct.id},master_account_id.eq.${acct.id}`);

      for (const rel of rels ?? []) {
        if (rel.follower_account_id === acct.id && acct.tradecopy_user_id) {
          await adapter.deactivateFollower(acct.tradecopy_user_id).catch(() => null);
          await adapter.unfollow(acct.tradecopy_user_id).catch(() => null);
        }
        if (rel.follower_account_id && rel.follower_account_id !== acct.id) {
          const { data: follower } = await admin
            .from("trading_accounts")
            .select("id,tradecopy_user_id,tradecopy_active")
            .eq("id", rel.follower_account_id)
            .maybeSingle();
          if (follower?.tradecopy_active && follower.tradecopy_user_id) {
            await adapter.deactivateFollower(follower.tradecopy_user_id).catch(() => null);
            await admin.from("trading_accounts").update({ tradecopy_active: false }).eq("id", follower.id);
          }
        }
        await admin.from("copy_relationships").delete().eq("id", rel.id);
      }

      // Provider links and encrypted credentials are removed with the Botvio
      // connection. Historical execution/audit rows remain for reporting.
      await admin.from("provider_accounts").delete().eq("trading_account_id", acct.id);
      await admin.from("tradecopy_credentials").delete().eq("trading_account_id", acct.id);
      await admin.from("symbol_mappings").delete().eq("follower_account_id", acct.id);
      await admin.from("tradecopy_reconcile_checkpoints").delete().eq("trading_account_id", acct.id);

      const { error: deleteError } = await admin
        .from("trading_accounts")
        .delete()
        .eq("id", acct.id)
        .eq("user_id", ctx.userId);
      if (deleteError) throw new TradeCopyError(deleteError.message, "validation");

      return { data: { removed: true }, accountId: acct.id };
    }

    case "diagnostic": {
      const acct = await loadAccount(ctx, String(body.account_id), { allowAdmin: true });
      if (!acct.tradecopy_user_id) throw new TradeCopyError("Account is not registered with TradeCopy yet", "validation");
      const diag = redact(await adapter.diagnostic(acct.tradecopy_user_id));
      await admin.from("trading_accounts").update({ last_diagnostic: diag as never, last_diagnostic_at: new Date().toISOString() }).eq("id", acct.id);
      return { data: { diagnostic: diag }, accountId: acct.id };
    }

    case "open_orders": {
      const acct = await loadAccount(ctx, String(body.account_id), { allowAdmin: true });
      if (!acct.tradecopy_user_id || !acct.account_role) return { data: { orders: [] } };
      const orders = await adapter.getOpenOrders(acct.tradecopy_user_id, acct.account_role);
      return { data: { orders: orders.map(({ raw: _r, ...o }) => o) }, accountId: acct.id };
    }

    case "order_history": {
      const acct = await loadAccount(ctx, String(body.account_id), { allowAdmin: true });
      if (!acct.tradecopy_user_id || !acct.account_role) return { data: { orders: [] } };
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const orders = await adapter.getOrderHistory(acct.tradecopy_user_id, acct.account_role, String(body.from ?? from), String(body.to ?? to));
      return {
        data: {
          from: String(body.from ?? from),
          to: String(body.to ?? to),
          orders: orders.map(({ raw: _r, ...o }) => o),
        },
        accountId: acct.id,
      };
    }

    case "execution_status": {
      const acct = await loadAccount(ctx, String(body.account_id), { allowAdmin: true });
      if (!acct.tradecopy_user_id || !acct.account_role) {
        return { data: { connected: false, openOrders: [], recentHistory: [] } };
      }
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [openOrders, history] = await Promise.all([
        adapter.getOpenOrders(acct.tradecopy_user_id, acct.account_role),
        adapter.getOrderHistory(acct.tradecopy_user_id, acct.account_role, from, to),
      ]);
      return {
        data: {
          connected: true,
          checkedAt: to,
          openOrders: openOrders.map(({ raw: _r, ...o }) => o),
          recentHistory: history.map(({ raw: _r, ...o }) => o),
        },
        accountId: acct.id,
      };
    }

    case "set_master_active": {
      const acct = await loadAccount(ctx, String(body.account_id), { allowAdmin: true });
      if (acct.account_role !== "master" || !acct.tradecopy_user_id) throw new TradeCopyError("Not a connected master account", "validation");
      if (acct.is_botvio_robot && !ctx.isAdmin) throw new TradeCopyError("Admins only", "auth", 403);
      const active = body.active === true;
      if (active) assertLiveAllowed({ environment: acct.environment, liveConfirmedAt: body.confirm_live === true ? "now" : null, globalLiveEnabled: await globalLiveEnabled(ctx), adapterMode: adapter.mode });
      await (active ? adapter.activateMaster(acct.tradecopy_user_id) : adapter.deactivateMaster(acct.tradecopy_user_id));
      await admin.from("trading_accounts").update({ tradecopy_active: active }).eq("id", acct.id);
      await admin.from("provider_accounts").update({ status: active ? "active" : "paused" }).eq("trading_account_id", acct.id);
      return { data: { active }, accountId: acct.id };
    }

    case "set_environment": {
      const acct = await loadAccount(ctx, String(body.account_id));
      const env = body.environment === "LIVE" ? "LIVE" : "DEMO";
      if (acct.tradecopy_active) throw new TradeCopyError("Deactivate the account before switching mode", "validation");
      await admin.from("trading_accounts").update({ environment: env }).eq("id", acct.id);
      // Any relationship on this account drops back to inactive and needs fresh confirmation.
      await admin.from("copy_relationships").update({ environment: env, status: "inactive", live_confirmed_at: null })
        .or(`follower_account_id.eq.${acct.id},master_account_id.eq.${acct.id}`);
      return { data: { environment: env }, accountId: acct.id };
    }

    case "set_relationship_status": {
      const rel = await loadRelationship(ctx, String(body.relationship_id));
      const follower = await loadAccount(ctx, rel.follower_account_id, { allowAdmin: true });
      const status = z.enum(["active", "paused", "stopped"]).parse(body.status);
      if (!follower.tradecopy_user_id) throw new TradeCopyError("Follower is not registered with TradeCopy", "validation");
      if (status === "active") {
        let liveConfirmedAt = rel.live_confirmed_at;
        if (rel.environment === "LIVE" && body.confirm_live === true && body.confirm_text === "START LIVE COPYING") {
          liveConfirmedAt = new Date().toISOString();
        }
        assertLiveAllowed({ environment: rel.environment, liveConfirmedAt, globalLiveEnabled: await globalLiveEnabled(ctx), adapterMode: adapter.mode, emergencyStopped: !!rel.emergency_stopped_at && body.reset_emergency !== true });
        await adapter.activateFollower(follower.tradecopy_user_id);
        await admin.from("copy_relationships").update({ status, live_confirmed_at: liveConfirmedAt, emergency_stopped_at: null, last_error: null }).eq("id", rel.id);
      } else {
        await adapter.deactivateFollower(follower.tradecopy_user_id);
        if (status === "stopped") await adapter.unfollow(follower.tradecopy_user_id).catch(() => null);
        await admin.from("copy_relationships").update({ status }).eq("id", rel.id);
      }
      await admin.from("trading_accounts").update({ tradecopy_active: status === "active" }).eq("id", follower.id);
      return { data: { status }, accountId: follower.id };
    }

    case "emergency_stop": {
      // Safety action: always allowed. Deactivates copying then closes all follower positions.
      const rel = await loadRelationship(ctx, String(body.relationship_id));
      const follower = await loadAccount(ctx, rel.follower_account_id, { allowAdmin: true });
      const now = new Date().toISOString();
      await admin.from("copy_relationships").update({ status: "paused", emergency_stopped_at: now }).eq("id", rel.id);
      if (follower.tradecopy_user_id) {
        await adapter.deactivateFollower(follower.tradecopy_user_id);
        if (body.close_all === true) await adapter.closeAll(follower.tradecopy_user_id, "slave");
      }
      await admin.from("trading_accounts").update({ tradecopy_active: false }).eq("id", follower.id);
      return { data: { stoppedAt: now }, accountId: follower.id, auditDetails: { close_all: body.close_all === true } };
    }

    case "robot_order": {
      // Botvio Robot → TradeCopy master. Admin only, guarded by live mode.
      if (!ctx.isAdmin) throw new TradeCopyError("Admins only", "auth", 403);
      const master = await robotMaster(ctx);
      if (!master?.tradecopy_user_id) throw new TradeCopyError("Botvio Robot master is not connected", "validation");
      if (!master.tradecopy_active) throw new TradeCopyError("Botvio Robot master is inactive", "validation");
      assertLiveAllowed({ environment: master.environment, liveConfirmedAt: body.confirm_live === true ? "now" : null, globalLiveEnabled: await globalLiveEnabled(ctx), adapterMode: adapter.mode });
      const order = normalizeMarketOrder(body);
      const res = await adapter.createMarketOrder(master.tradecopy_user_id, "master", order);
      return { data: { result: redact(res) }, accountId: master.id, auditDetails: { order } };
    }

    default:
      throw new TradeCopyError(`Unknown action "${action}"`, "validation");
  }
}