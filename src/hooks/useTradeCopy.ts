import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Labels mirror the TradeCopy OpenAPI enums (see supabase/functions/_shared/tradecopy/core.ts). */
export const RISK_TYPE_LABELS: Record<number, string> = { 0: "Equity risk multiplier", 1: "Lot multiplier", 2: "Fixed lot", 3: "Auto risk" };
export const SCALPER_MODE_LABELS: Record<number, string> = { 0: "Off", 1: "Permanent Scalp-Mode", 2: "Rollover Scalp-Mode" };
export const ORDER_FILTER_LABELS: Record<number, string> = { 0: "Buy & sell", 1: "Buy only", 2: "Sell only", 3: "All orders" };

export class TradeCopyClientError extends Error {
  constructor(message: string, public code?: string) { super(message); }
}

/** Calls the secure tradecopy-api function. The API key never reaches the browser. */
export async function tradecopy<T = Record<string, unknown>>(action: string, payload: Record<string, unknown> = {}): Promise<T & { mode: "mock" | "live" }> {
  const { data, error } = await supabase.functions.invoke("tradecopy-api", { body: { action, ...payload } });
  if (error) {
    let msg = "TradeCopy request failed";
    let code: string | undefined;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const b = await ctx.clone().json().catch(() => null);
      if (b?.error) { msg = b.error; code = b.code; }
      if (!code && typeof ctx.status === "number" && ctx.status >= 400) {
        code = `http_${ctx.status}`;
      }
    }
    if (msg === "TradeCopy request failed") {
      const detail = typeof error.message === "string" ? error.message.trim() : "";
      if (detail && !/^non-2xx status code$/i.test(detail)) msg = detail;
    }
    throw new TradeCopyClientError(msg, code);
  }
  if (!data?.ok) throw new TradeCopyClientError(data?.error ?? "TradeCopy request failed", data?.code);
  return data;
}

export interface TcAccount {
  id: string; label: string; login_id: string | null; broker: string | null; server: string | null; account_role: "master" | "slave" | null;
  tradecopy_user_id: number | null; environment: "DEMO" | "LIVE"; connection_status: string | null;
  tradecopy_active: boolean; is_botvio_robot: boolean; last_diagnostic: unknown; last_diagnostic_at: string | null;
}
const ACCOUNT_COLS = "id,label,login_id,broker,server,account_role,tradecopy_user_id,environment,connection_status,tradecopy_active,is_botvio_robot,last_diagnostic,last_diagnostic_at";

export function useTradeCopyStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tradecopy", "status"],
    enabled: !!user,
    queryFn: () => tradecopy<{ adapterMode: "mock" | "live"; liveEnabled: boolean }>("status"),
    staleTime: 60_000,
  });
}

export function useTradeCopyAccounts(role: "master" | "slave", opts: { robot?: boolean } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tradecopy", "accounts", role, opts.robot ?? false, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("trading_accounts").select(ACCOUNT_COLS).eq("execution_provider", "tradecopy").eq("account_role", role);
      q = opts.robot ? q.eq("is_botvio_robot", true) : q.eq("user_id", user!.id).eq("is_botvio_robot", false);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TcAccount[];
    },
  });
}

export interface TcRelationship {
  id: string; provider_id: string | null; is_botvio_robot: boolean; master_account_id: string | null; follower_account_id: string;
  status: string; copy_order_type: number; environment: "DEMO" | "LIVE"; live_confirmed_at: string | null;
  emergency_stopped_at: string | null; last_error: string | null;
  copy_settings: { risk_type: number; multiplier: number; copy_sltp: boolean; order_filter: number; scalper_mode: number; scalper_value: number; order_control: Record<string, number> } | null;
}

export function useMyRelationships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tradecopy", "relationships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("copy_relationships").select("*, copy_settings(*)").eq("follower_user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, copy_settings: Array.isArray(r.copy_settings) ? r.copy_settings[0] ?? null : r.copy_settings })) as unknown as TcRelationship[];
    },
  });
}

export function useFollowerCount(masterAccountIds: string[]) {
  return useQuery({
    queryKey: ["tradecopy", "followers", masterAccountIds],
    enabled: masterAccountIds.length > 0,
    queryFn: async () => {
      const { count } = await supabase.from("copy_relationships").select("id", { count: "exact", head: true }).in("master_account_id", masterAccountIds).eq("status", "active");
      return count ?? 0;
    },
  });
}

export function useSymbolMappings(followerAccountId?: string) {
  return useQuery({
    queryKey: ["tradecopy", "mappings", followerAccountId],
    enabled: !!followerAccountId,
    queryFn: async () => {
      const { data, error } = await supabase.from("symbol_mappings").select("*").eq("follower_account_id", followerAccountId!).order("source_symbol");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useExecutionEvents(limit = 25) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tradecopy", "events", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("copy_execution_events").select("*").eq("follower_user_id", user!.id).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTradeCopyAudit(limit = 10) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tradecopy", "audit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tradecopy_audit_log").select("id,action,ok,mode,details,created_at").eq("user_id", user!.id).eq("ok", false).order("created_at", { ascending: false }).limit(limit);
      return data ?? [];
    },
  });
}

export function useTradeCopyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, payload }: { action: string; payload?: Record<string, unknown> }) => tradecopy(action, payload),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tradecopy"] }),
  });
}

export function useRemoveTradeCopyAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const result = await tradecopy("remove_account", { account_id: accountId });
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tradecopy"] });
      qc.invalidateQueries({ queryKey: ["trading_accounts"] });
    },
  });
}
