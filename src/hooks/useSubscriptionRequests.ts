import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubscriptionRequest {
  id: string;
  user_id: string;
  plan_id: string;
  current_plan_id?: string;
  status: "pending_approval" | "approved" | "rejected" | "expired" | "cancelled";
  amount_usd: number;
  payment_method?: string;
  proof_upload_url?: string;
  admin_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  pricing_plans?: {
    name: string;
    code: string;
    price_usd: number;
  };
  profiles?: {
    email: string | null;
    display_name: string | null;
  };
}

// Get user's subscription requests
export function useMySubscriptionRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my_subscription_requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch plan info separately
      const planIds = [...new Set(data.map((r) => r.plan_id).filter(Boolean))];
      const { data: plans } = await supabase
        .from("pricing_plans")
        .select("id, name, code, price_usd")
        .in("id", planIds);

      const enrichedData = data.map((request) => ({
        ...request,
        pricing_plans: plans?.find((p) => p.id === request.plan_id) || null,
      }));

      return enrichedData as SubscriptionRequest[];
    },
    enabled: !!user,
  });
}

// Create a subscription upgrade request
export function useCreateSubscriptionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: {
      plan_id: string;
      amount_usd: number;
      payment_method?: string;
      proof_upload_url?: string;
      current_plan_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("subscription_requests")
        .insert({
          user_id: user!.id,
          ...request,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_subscription_requests"] });
      toast.success("Upgrade request submitted! Awaiting admin approval.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit upgrade request");
    },
  });
}

// Admin: Get all pending subscription requests
export function useAdminSubscriptionRequests() {
  return useQuery({
    queryKey: ["admin_subscription_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch plan and profile info
      const planIds = [...new Set(data.map((r) => r.plan_id).filter(Boolean))];
      const userIds = [...new Set(data.map((r) => r.user_id))];

      const [{ data: plans }, { data: profiles }] = await Promise.all([
        supabase.from("pricing_plans").select("id, name, code, price_usd").in("id", planIds),
        supabase.from("profiles").select("user_id, email, display_name").in("user_id", userIds),
      ]);

      const enrichedData = data.map((request) => ({
        ...request,
        pricing_plans: plans?.find((p) => p.id === request.plan_id) || null,
        profiles: profiles?.find((p) => p.user_id === request.user_id) || null,
      }));

      return enrichedData as SubscriptionRequest[];
    },
  });
}

// Admin: Process subscription request (approve/reject)
export function useProcessSubscriptionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      approve,
      admin_note,
      expires_at,
      user_id,
      plan_id,
    }: {
      id: string;
      approve: boolean;
      admin_note?: string;
      expires_at?: string;
      user_id: string;
      plan_id: string;
    }) => {
      const status = approve ? "approved" : "rejected";

      // Update the request
      const { error: updateError } = await supabase
        .from("subscription_requests")
        .update({
          status,
          admin_note,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // If approved, create or update the user's subscription
      if (approve) {
        // Check if user has existing subscription
        const { data: existingSub } = await supabase
          .from("user_plan_subscriptions")
          .select("id")
          .eq("user_id", user_id)
          .maybeSingle();

        const periodEnd = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        if (existingSub) {
          // Update existing subscription
          const { error: subError } = await supabase
            .from("user_plan_subscriptions")
            .update({
              pricing_plan_id: plan_id,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingSub.id);

          if (subError) throw subError;
        } else {
          // Create new subscription
          const { error: subError } = await supabase
            .from("user_plan_subscriptions")
            .insert({
              user_id,
              pricing_plan_id: plan_id,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd,
            });

          if (subError) throw subError;
        }

        // Create notification for user
        await supabase.from("notifications").insert({
          user_id,
          type: "success",
          title: "Subscription Upgraded!",
          message: "Your subscription upgrade has been approved. Enjoy your new features!",
        });
      } else {
        // Rejected - notify user
        await supabase.from("notifications").insert({
          user_id,
          type: "error",
          title: "Upgrade Request Rejected",
          message: admin_note || "Your subscription upgrade request was rejected. Please contact support for more information.",
        });
      }

      // Create audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        action_type: approve ? "subscription_approved" : "subscription_rejected",
        payload_json: { request_id: id, target_user_id: user_id, plan_id, admin_note },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin_subscription_requests"] });
      toast.success(
        variables.approve
          ? "Subscription approved and activated!"
          : "Subscription request rejected"
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process request");
    },
  });
}
