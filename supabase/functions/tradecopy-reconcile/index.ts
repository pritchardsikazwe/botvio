// Scheduled reconciliation: polls TradeCopy get_orders_mt5 / get_order_history_mt5
// and upserts copy_execution_events idempotently. No trades are ever placed here.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createAdapter } from "../_shared/tradecopy/adapter.ts";
import { dedupeByKey, executionIdempotencyKey, NormalizedOrder } from "../_shared/tradecopy/core.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  // Only the scheduler (service role) or an admin may run this.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  let allowed = token === serviceKey;
  if (!allowed && token) {
    const { data } = await admin.auth.getUser(token);
    if (data?.user) {
      const { data: r } = await admin.from("user_roles").select("role").eq("user_id", data.user.id).in("role", ["admin", "super_admin"]).limit(1);
      allowed = (r?.length ?? 0) > 0;
    }
  }
  if (!allowed) return json({ ok: false, error: "Forbidden" }, 403);

  const adapter = createAdapter({ apiKey: Deno.env.get("TRADECOPY_API_KEY"), mode: Deno.env.get("TRADECOPY_MODE"), baseUrl: Deno.env.get("TRADECOPY_BASE_URL") });

  const { data: accounts } = await admin.from("trading_accounts")
    .select("id,user_id,account_role,tradecopy_user_id,environment")
    .eq("execution_provider", "tradecopy").not("tradecopy_user_id", "is", null).limit(200);

  const today = new Date();
  const from = new Date(today.getTime() - 2 * 86400000).toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
  const summary = { accounts: 0, upserts: 0, errors: 0, mode: adapter.mode };

  for (const a of accounts ?? []) {
    summary.accounts++;
    try {
      const role = a.account_role as "master" | "slave";
      const [open, hist] = await Promise.all([
        adapter.getOpenOrders(a.tradecopy_user_id, role),
        adapter.getOrderHistory(a.tradecopy_user_id, role, from, to),
      ]);

      let rel: { id: string; master_account_id: string; provider_id: string | null } | null = null;
      if (role === "slave") {
        const { data } = await admin.from("copy_relationships").select("id,master_account_id,provider_id").eq("follower_account_id", a.id).limit(1).maybeSingle();
        rel = data;
      } else {
        const { data } = await admin.from("provider_accounts").select("provider_id").eq("trading_account_id", a.id).limit(1).maybeSingle();
        rel = { id: "", master_account_id: a.id, provider_id: data?.provider_id ?? null };
      }
      if (!rel?.master_account_id) continue;

      const toRow = (o: NormalizedOrder, closed: boolean) => {
        const comment = String((o.raw as Record<string, unknown>).comment ?? "");
        const srcMatch = comment.match(/(\d{4,})/);
        const sourceTicket = role === "master" ? o.ticket : (srcMatch?.[1] ?? `f${o.ticket}`);
        return {
          idempotency_key: executionIdempotencyKey({ relationshipId: rel!.id || null, masterAccountId: rel!.master_account_id, sourceTicket, followerTicket: role === "slave" ? o.ticket : null }),
          relationship_id: rel!.id || null,
          provider_id: rel!.provider_id,
          master_account_id: rel!.master_account_id,
          follower_account_id: role === "slave" ? a.id : null,
          follower_user_id: role === "slave" ? a.user_id : null,
          source_ticket: sourceTicket,
          follower_ticket: role === "slave" ? o.ticket : null,
          symbol: o.symbol, side: o.side,
          source_lot: role === "master" ? o.lots : null,
          follower_lot: role === "slave" ? o.lots : null,
          entry_price: o.openPrice, stop_loss: o.stopLoss, take_profit: o.takeProfit, profit: o.profit,
          status: closed ? "closed" : "open", environment: a.environment,
          opened_at: o.openTime, closed_at: closed ? (o.closeTime ?? new Date().toISOString()) : null,
        };
      };

      // History wins over open for the same ticket (closed state is final).
      const rows = dedupeByKey([...hist.map((o) => toRow(o, true)), ...open.map((o) => toRow(o, false))], (r) => r.idempotency_key);
      if (rows.length) {
        const { error } = await admin.from("copy_execution_events").upsert(rows, { onConflict: "idempotency_key" });
        if (error) throw error;
        summary.upserts += rows.length;
      }
      await admin.from("tradecopy_reconcile_checkpoints").upsert({
        trading_account_id: a.id, last_polled_at: new Date().toISOString(), last_history_date: to, last_open_count: open.length, last_error: null, updated_at: new Date().toISOString(),
      });
    } catch (e) {
      summary.errors++;
      await admin.from("tradecopy_reconcile_checkpoints").upsert({ trading_account_id: a.id, last_polled_at: new Date().toISOString(), last_error: String((e as Error).message).slice(0, 300), updated_at: new Date().toISOString() });
    }
  }
  return json({ ok: true, ...summary });
});
