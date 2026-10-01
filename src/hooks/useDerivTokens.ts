import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DerivTokenRow {
  id: string;
  loginid: string;
  is_virtual: boolean;
  currency: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

export const useDerivTokens = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<DerivTokenRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTokens = useCallback(async () => {
    if (!user) { setTokens([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("user_deriv_tokens" as any)
      .select("id, loginid, is_virtual, currency, label, is_active, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setTokens((data as any[] ?? []).map((d: any) => ({
      id: d.id,
      loginid: d.loginid,
      is_virtual: d.is_virtual,
      currency: d.currency,
      label: d.label,
      is_active: d.is_active,
      created_at: d.created_at,
    })));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const activeToken = tokens.find((t) => t.is_active) ?? null;

  /** Upsert a token after Deriv authorize */
  const upsertToken = useCallback(async (params: {
    loginid: string;
    is_virtual: boolean;
    currency: string;
    token_encrypted: string;
    label?: string;
  }) => {
    if (!user) return;

    // Deactivate all first
    await supabase
      .from("user_deriv_tokens" as any)
      .update({ is_active: false } as any)
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Upsert the new token as active
    await supabase
      .from("user_deriv_tokens" as any)
      .upsert({
        user_id: user.id,
        loginid: params.loginid,
        is_virtual: params.is_virtual,
        currency: params.currency,
        token_encrypted: params.token_encrypted,
        label: params.label ?? (params.is_virtual ? "Demo" : "Real"),
        is_active: true,
      } as any, { onConflict: "user_id,loginid" });

    console.log(`[TOKEN] Upserted & activated: ${params.loginid} is_virtual=${params.is_virtual}`);
    await fetchTokens();
  }, [user?.id, fetchTokens]);

  /** Switch active token (deactivate all, activate selected) */
  const switchToken = useCallback(async (tokenId: string) => {
    if (!user) return;

    // Deactivate all
    await supabase
      .from("user_deriv_tokens" as any)
      .update({ is_active: false } as any)
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Activate selected
    await supabase
      .from("user_deriv_tokens" as any)
      .update({ is_active: true } as any)
      .eq("id", tokenId)
      .eq("user_id", user.id);

    console.log(`[TOKEN] Switched active to token_id=${tokenId}`);
    await fetchTokens();
  }, [user?.id, fetchTokens]);

  /** Remove a token */
  const removeToken = useCallback(async (tokenId: string) => {
    if (!user) return;
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) throw new Error("Deriv account not found");

    // Remove the Deriv token and the matching trading_accounts record together
    // so the old Accounts page cannot leave a second/stale connection behind.
    const { error } = await supabase.rpc("remove_deriv_account" as any, {
      p_loginid: token.loginid,
    });
    if (error) throw error;

    console.log(`[TOKEN] Removed Deriv account ${token.loginid} from Botvio`);
    await fetchTokens();
  }, [user?.id, fetchTokens, tokens]);

  return {
    tokens,
    activeToken,
    loading,
    upsertToken,
    switchToken,
    removeToken,
    refetch: fetchTokens,
  };
};
