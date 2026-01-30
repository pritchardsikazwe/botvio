import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Fetch all payment requests for admin
export const useAdminPaymentRequests = () => {
  return useQuery({
    queryKey: ["admin-payment-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PaymentRequest[];
    },
  });
};

// Approve or reject a payment request
export const useProcessPaymentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      approve, 
      admin_note,
      plan_id,
      user_id
    }: { 
      id: string; 
      approve: boolean; 
      admin_note?: string;
      plan_id?: string;
      user_id: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Update the payment request
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: approve ? "approved" : "rejected",
          admin_note: admin_note || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);
      
      if (error) throw error;
      
      // If approved, update user subscription
      if (approve && plan_id) {
        // Get plan details for duration
        const { data: plan } = await supabase
          .from("pricing_plans")
          .select("code")
          .eq("id", plan_id)
          .single();
        
        const now = new Date();
        let endDate = new Date(now);
        
        if (plan?.code === "pro") {
          endDate.setDate(endDate.getDate() + 15);
        } else if (plan?.code === "vip") {
          endDate.setDate(endDate.getDate() + 30);
        }
        
        // Update or create subscription
        const { data: existingSub } = await supabase
          .from("user_plan_subscriptions")
          .select("id")
          .eq("user_id", user_id)
          .maybeSingle();
        
        if (existingSub) {
          await supabase
            .from("user_plan_subscriptions")
            .update({
              pricing_plan_id: plan_id,
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString()
            })
            .eq("user_id", user_id);
        } else {
          await supabase
            .from("user_plan_subscriptions")
            .insert({
              user_id: user_id,
              pricing_plan_id: plan_id,
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString()
            });
        }
      }
      
      return { approve };
    },
    onSuccess: (data) => {
      toast.success(data.approve ? "Payment approved! User subscription activated." : "Payment request rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process payment request");
    }
  });
};
