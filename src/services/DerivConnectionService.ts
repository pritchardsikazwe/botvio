import { supabase } from "@/integrations/supabase/client";
import { resolveDerivEnv } from "@/config/derivEnv";
import { normalizeDerivError } from "@/lib/derivErrors";

/**
 * Normalized Deriv connection shape shared by every Botvio trading engine.
 * NOTE: the authentication token NEVER appears in this object. The account
 * identifier (e.g. ROT90035652) is NOT a credential.
 */
export interface DerivConnectionInfo {
  provider: "deriv";
  connectionId?: string;
  accountId: string | null;
  accountType: "REAL" | "DEMO" | null;
  currency: string | null;
  environment: "PROD" | "DEV";
  authType: "token" | "oauth" | null;
  connected: boolean;
  lastVerifiedAt?: string | null;
  lastError?: string | null;
}

export interface DerivAccountSummary {
  id: string;
  accountId: string;
  accountType: "REAL" | "DEMO";
  currency: string;
  label: string | null;
  active: boolean;
}

const env = () => resolveDerivEnv();
const envLabel = (): "PROD" | "DEV" => (env() === "prod" ? "PROD" : "DEV");

const emptyConnection = (): DerivConnectionInfo => ({
  provider: "deriv",
  accountId: null,
  accountType: null,
  currency: null,
  environment: envLabel(),
  authType: null,
  connected: false,
});

const mapRow = (row: any): DerivConnectionInfo => ({
  provider: "deriv",
  connectionId: row.id,
  accountId: row.login_id ?? null,
  accountType: row.account_type === "demo" ? "DEMO" : row.account_type === "real" ? "REAL" : null,
  currency: row.currency ?? null,
  environment: (row.env === "prod" ? "PROD" : "DEV"),
  authType: row.connection_type === "oauth" ? "oauth" : "token",
  connected: !!row.is_connected,
  lastVerifiedAt: row.last_verified_at ?? null,
  lastError: row.last_error ? normalizeDerivError(row.last_error) : null,
});

export const DerivConnectionService = {
  /** Verify + persist a Deriv PAT server-side. The token is never stored client-side by this call. */
  async connect(token: string): Promise<DerivConnectionInfo> {
    const { data, error } = await supabase.functions.invoke("deriv-verify-token", {
      body: { token, env: env() },
    });
    if (error || !data?.ok) {
      throw new Error(normalizeDerivError(data?.error || error?.message));
    }
    return (await DerivConnectionService.getConnectionStatus()) ?? emptyConnection();
  },

  /** Re-verify the stored connection server-side (decrypts the token on the server only). */
  async verify(): Promise<DerivConnectionInfo> {
    const { data, error } = await supabase.functions.invoke("deriv-health-check", {
      body: { env: env() },
    });
    const current = (await DerivConnectionService.getConnectionStatus()) ?? emptyConnection();
    if (error || !data?.ok) {
      return { ...current, connected: false, lastError: normalizeDerivError(data?.error || error?.message) };
    }
    return current;
  },

  /** All Deriv accounts linked to the signed-in user. Tokens are never selected. */
  async getAccounts(): Promise<DerivAccountSummary[]> {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) return [];
    const { data } = await supabase
      .from("user_deriv_tokens" as any)
      .select("id, loginid, is_virtual, currency, label, is_active")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    return ((data as any[]) ?? []).map((d) => ({
      id: d.id,
      accountId: d.loginid,
      accountType: d.is_virtual ? "DEMO" : "REAL",
      currency: d.currency ?? "USD",
      label: d.label ?? null,
      active: !!d.is_active,
    }));
  },

  async getActiveAccount(): Promise<DerivAccountSummary | null> {
    const accounts = await DerivConnectionService.getAccounts();
    return accounts.find((a) => a.active) ?? null;
  },

  async getConnectionStatus(): Promise<DerivConnectionInfo> {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) return emptyConnection();
    const { data } = await supabase
      .from("deriv_connections")
      .select("*")
      .eq("user_id", uid)
      .eq("env", env())
      .maybeSingle();
    if (!data) return emptyConnection();
    return mapRow(data);
  },

  async disconnect(): Promise<void> {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) return;
    await supabase
      .from("deriv_connections")
      .update({ is_connected: false })
      .eq("user_id", uid)
      .eq("env", env());
  },
};
