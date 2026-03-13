import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PaymentRequest {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount_usd: number;
  currency: string;
  method: string;
  proof_upload_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

interface TrialGrant {
  id: string;
  user_id: string;
  plan_id: string | null;
  started_at: string;
  ends_at: string;
  used: boolean;
}

// Fetch user's payment requests
export const usePaymentRequests = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["payment-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PaymentRequest[];
    },
    enabled: !!user,
  });
};

// Check if user has active trial
export const useTrialStatus = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["trial-status", user?.id],
    queryFn: async () => {
      if (!user) return { hasUsedTrial: false, isTrialActive: false, trialEndsAt: null };
      
      const { data, error } = await supabase
        .from("trial_grants")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        return { hasUsedTrial: false, isTrialActive: false, trialEndsAt: null };
      }
      
      const now = new Date();
      const endsAt = new Date(data.ends_at);
      const isActive = now < endsAt;
      
      return {
        hasUsedTrial: true,
        isTrialActive: isActive,
        trialEndsAt: data.ends_at,
        hoursRemaining: isActive ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60))) : 0
      };
    },
    enabled: !!user,
  });
};

// Create a payment request (offline payment)
export const useCreatePaymentRequest = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      plan_id, 
      amount_usd, 
      method, 
      proof_upload_url 
    }: { 
      plan_id: string; 
      amount_usd: number; 
      method: string; 
      proof_upload_url?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Ensure method matches DB constraint: mobile_money | crypto | cash | bank_transfer | manual
      const allowedMethods = ["mobile_money", "crypto", "cash", "bank_transfer", "manual"];
      const safeMethod = allowedMethods.includes(method) ? method : "manual";

      const { data, error } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          plan_id,
          amount_usd,
          method: safeMethod,
          proof_upload_url: proof_upload_url || null,
          status: "submitted"
        })
        .select()
        .single();
      
      if (error) {
        console.error("Payment request insert error:", error.code, error.message, error.details);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Payment request submitted! Admin will review shortly.");
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit payment request");
    }
  });
};

// Activate free trial
export const useActivateTrial = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      // Check if user already used trial
      const { data: existingTrial } = await supabase
        .from("trial_grants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (existingTrial) {
        throw new Error("You have already used your free trial");
      }
      
      // Get VIP plan ID
      const { data: vipPlan } = await supabase
        .from("pricing_plans")
        .select("id")
        .eq("code", "vip")
        .single();
      
      if (!vipPlan) throw new Error("VIP plan not found");
      
      // Create trial grant (48 hours)
      const now = new Date();
      const endsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from("trial_grants")
        .insert({
          user_id: user.id,
          plan_id: vipPlan.id,
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          used: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update user subscription to VIP temporarily
      const { error: subError } = await supabase
        .from("user_plan_subscriptions")
        .update({
          pricing_plan_id: vipPlan.id,
          current_period_start: now.toISOString(),
          current_period_end: endsAt.toISOString(),
          status: "trial"
        })
        .eq("user_id", user.id);
      
      if (subError) throw subError;
      
      return data;
    },
    onSuccess: () => {
      toast.success("🎉 VIP Trial activated! Enjoy 48 hours of premium features.");
      queryClient.invalidateQueries({ queryKey: ["trial-status"] });
      queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to activate trial");
    }
  });
};

// Upload proof of payment
export const useUploadPaymentProof = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("charts")
        .upload(`payment-proofs/${fileName}`, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from("charts")
        .getPublicUrl(`payment-proofs/${fileName}`);
      
      return urlData.publicUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload payment proof");
    }
  });
};
