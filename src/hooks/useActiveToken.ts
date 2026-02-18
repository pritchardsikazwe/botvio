import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveToken {
  loginid: string;
  is_virtual: boolean;
  currency: string;
  is_active: boolean;
}

export const useActiveToken = () => {
  const { user } = useAuth();
  const [activeToken, setActiveToken] = useState<ActiveToken | null>(null);

  // Load active token on mount
  useEffect(() => {
    if (!user) {
      setActiveToken(null);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("user_active_tokens")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();
      if (data) {
        setActiveToken({
          loginid: (data as any).loginid,
          is_virtual: (data as any).is_virtual,
          currency: (data as any).currency,
          is_active: true,
        });
      }
    };
    load();
  }, [user?.id]);

  // Set active token (deactivates others via DB trigger)
  const setToken = useCallback(async (params: {
    loginid: string;
    is_virtual: boolean;
    currency: string;
  }) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_active_tokens")
      .upsert({
        user_id: user.id,
        loginid: params.loginid,
        is_virtual: params.is_virtual,
        currency: params.currency,
        is_active: true,
      } as any, { onConflict: "user_id,loginid" });

    if (!error) {
      setActiveToken({
        loginid: params.loginid,
        is_virtual: params.is_virtual,
        currency: params.currency,
        is_active: true,
      });
      console.log(`[TOKEN] Active token set: ${params.loginid} is_virtual=${params.is_virtual} currency=${params.currency}`);
    }
  }, [user]);

  // Validate that current connection matches active token
  const validateConnection = useCallback((loginid: string): boolean => {
    if (!activeToken) return true; // No token set yet, allow
    if (activeToken.loginid !== loginid) {
      console.warn(`[TOKEN MISMATCH] Active=${activeToken.loginid} but connected=${loginid}`);
      return false;
    }
    return true;
  }, [activeToken]);

  return {
    activeToken,
    setToken,
    validateConnection,
  };
};
