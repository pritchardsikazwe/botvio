import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DIRECT_LIVE_PHRASE = "START LIVE SIGNALS";

export interface Mt5Account {
  id: string; user_id: string; label: string | null; broker: string | null; server: string | null; login_id: string | null;
  platform: string | null; account_role: string | null; environment: string | null; connection_status: string | null;
  tradecopy_active: boolean | null; tradecopy_user_id: number | null; is_active: boolean | null; is_botvio_robot: boolean | null;
  execution_provider: string | null; created_at: string; updated_at: string | null;
  direct_signal_enabled: boolean; direct_signal_status: string; direct_live_confirmed_at: string | null;
  direct_execution_entitled: boolean; direct_execution_plan: string | null; direct_execution_expires_at: string | null;
  botvio_signal_master_enabled: boolean; botvio_signal_master_lot: number; botvio_signal_min_confidence: number;
  direct_lot: number; direct_min_confidence: number; direct_symbol_map: Record<string, string>;
  last_direct_signal_at: string | null; last_direct_execution_at: string | null; last_direct_error: string | null;
}

export const MT5_COLS =
  "id,user_id,label,broker,server,login_id,platform,account_role,environment,connection_status,tradecopy_active,tradecopy_user_id,is_active,is_botvio_robot,execution_provider,created_at,updated_at,direct_signal_enabled,direct_signal_status,direct_live_confirmed_at,direct_execution_entitled,direct_execution_plan,direct_execution_expires_at,direct_lot,direct_min_confidence,direct_symbol_map,last_direct_signal_at,last_direct_execution_at,last_direct_error,botvio_signal_master_enabled,botvio_signal_master_lot,botvio_signal_min_confidence";

export type Mt5Role = "DATA FEED" | "DIRECT EXECUTION" | "PROVIDER MASTER" | "BOTVIO ROBOT MASTER" | "BOTVIO SIGNAL MASTER" | "FOLLOWER";

/** Roles are derived from facts, never stored twice: a single MT5 login can hold several at once. */
export function deriveRoles(a: Mt5Account, ctx: { feedIds: Set<string>; followerIds: Set<string> }): Mt5Role[] {
  const r: Mt5Role[] = [];
  if (a.is_botvio_robot) r.push("BOTVIO ROBOT MASTER");
  else if (a.account_role === "master") r.push("PROVIDER MASTER");
  if (a.botvio_signal_master_enabled) r.push("BOTVIO SIGNAL MASTER");
  if (ctx.followerIds.has(a.id)) r.push("FOLLOWER");
  if (a.direct_signal_enabled) r.push("DIRECT EXECUTION");
  if (ctx.feedIds.has(a.id)) r.push("DATA FEED");
  return r;
}

/** True only when the account holds a TradeCopy registration (master or linked follower). */
export const usesTradeCopySlot = (a: Mt5Account) => a.tradecopy_user_id != null;

export const isMt5 = (a: { platform: string | null; login_id: string | null; server: string | null }) => {
  const platform = String(a.platform ?? "mt5").toLowerCase().replace(/[\s_-]+/g, "");
  // Deriv MT5 accounts are valid MT5 accounts. The previous filter rejected
  // them simply because their platform field was "deriv", which made a real
  // Deriv demo follower disappear from the Auto-Execute card.
  const nonMt5 = new Set(["mt4", "ctrader", "derivoptions", "binary", "options"]);
  return !!a.login_id && !!a.server && !nonMt5.has(platform);
};

export async function directAction<T = Record<string, unknown>>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("mt5-direct-execution", { body: { action, ...payload } });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error ?? "Request failed");
  return data as T;
}

export function useDirectStatus() {
  return useQuery({ queryKey: ["direct-status"], queryFn: () => directAction<{ mode: string; liveEnabled: boolean }>("status"), staleTime: 60_000 });
}

export function useMyMt5Accounts() {
  return useQuery({
    queryKey: ["my-mt5-accounts"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase.from("trading_accounts").select(MT5_COLS).eq("user_id", auth.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as Mt5Account[]).filter(isMt5);
    },
  });
}

export function useDirectExecutions(accountId?: string, limit = 10) {
  return useQuery({
    queryKey: ["direct-executions", accountId, limit],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase.from("direct_executions").select("*").eq("trading_account_id", accountId!).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDirectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, payload }: { action: string; payload: Record<string, unknown> }) => directAction(action, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-mt5-accounts"] });
      qc.invalidateQueries({ queryKey: ["admin-mt5-center"] });
      qc.invalidateQueries({ queryKey: ["direct-executions"] });
    },
  });
}
