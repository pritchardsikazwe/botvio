import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Generate short affiliate code
const generateAffiliateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Affiliate Profile
export const useAffiliateProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["affiliate-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Create affiliate profile
export const useCreateAffiliateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const code = generateAffiliateCode();
      const { data, error } = await supabase
        .from("affiliate_profiles")
        .insert({
          user_id: user.id,
          affiliate_code: code,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-profile"] });
      toast.success("Welcome to the affiliate program!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to join affiliate program");
    },
  });
};

// Affiliate Links
export const useAffiliateLinks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["affiliate-links", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Create affiliate link
export const useCreateAffiliateLink = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      type: "bot" | "strategy" | "campaign" | "generic";
      target_id?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const code = generateAffiliateCode();
      const { data, error } = await supabase
        .from("affiliate_links")
        .insert({
          user_id: user.id,
          type: params.type,
          target_id: params.target_id,
          code,
          utm_source: params.utm_source,
          utm_medium: params.utm_medium,
          utm_campaign: params.utm_campaign,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      toast.success("Share link created!");
    },
  });
};

// Referral Clicks
export const useReferralClicks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-clicks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("referral_clicks")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Referrals (attributed signups)
export const useReferrals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("attributed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Affiliate Earnings
export const useAffiliateEarnings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["affiliate-earnings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("affiliate_earnings")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Earnings summary
export const useEarningsSummary = () => {
  const { data: earnings } = useAffiliateEarnings();

  const summary = {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    available: 0,
  };

  if (earnings) {
    earnings.forEach((e: any) => {
      summary.total += Number(e.amount_usd) || 0;
      if (e.status === "pending") summary.pending += Number(e.amount_usd) || 0;
      if (e.status === "approved") summary.approved += Number(e.amount_usd) || 0;
      if (e.status === "paid") summary.paid += Number(e.amount_usd) || 0;
    });
    summary.available = summary.approved;
  }

  return summary;
};

// Payout Methods
export const usePayoutMethods = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payout-methods", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("payout_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Add payout method
export const useAddPayoutMethod = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      type: "crypto" | "mobile_money";
      crypto_network?: string;
      crypto_address?: string;
      mobile_network?: string;
      mobile_number?: string;
      is_default?: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payout_methods")
        .insert({
          user_id: user.id,
          ...params,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-methods"] });
      toast.success("Payout method added!");
    },
  });
};

// Payout Requests
export const usePayoutRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payout-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*, payout_methods(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Request Payout
export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { amount_usd: number; method_id: string }) => {
      if (!user) throw new Error("Not authenticated");
      if (params.amount_usd < 2) throw new Error("Minimum payout is $2");

      const { data, error } = await supabase
        .from("payout_requests")
        .insert({
          user_id: user.id,
          amount_usd: params.amount_usd,
          method_id: params.method_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-earnings"] });
      toast.success("Payout request submitted!");
    },
  });
};

// Track referral click (for use in referral landing)
export const trackReferralClick = async (
  code: string,
  landingPath: string,
  referrerUserId?: string
) => {
  try {
    // Hash IP for privacy
    const ipHash = await hashString(navigator.userAgent + Date.now().toString());
    const userAgentHash = await hashString(navigator.userAgent);

    await supabase.from("referral_clicks").insert({
      code,
      referrer_user_id: referrerUserId,
      landing_path: landingPath,
      ip_hash: ipHash.slice(0, 16),
      user_agent_hash: userAgentHash.slice(0, 16),
    });

    // Store in localStorage for attribution
    localStorage.setItem("ref_code", code);
    localStorage.setItem("ref_timestamp", Date.now().toString());
  } catch (error) {
    console.error("Failed to track referral click:", error);
  }
};

// Get stored referral
export const getStoredReferral = (): string | null => {
  const code = localStorage.getItem("ref_code");
  const timestamp = localStorage.getItem("ref_timestamp");

  if (!code || !timestamp) return null;

  // Check if referral is within 30 days
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - parseInt(timestamp) > thirtyDays) {
    localStorage.removeItem("ref_code");
    localStorage.removeItem("ref_timestamp");
    return null;
  }

  return code;
};

// Hash function for privacy
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
