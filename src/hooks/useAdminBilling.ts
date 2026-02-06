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

/**
 * Calculate affiliate commission (single source of truth).
 */
function calcCommission(amountUsd: number, affiliatePercent: number): number {
  return Math.max(0, Math.round(amountUsd * (affiliatePercent / 100) * 100) / 100);
}

// Approve or reject a payment request
// On approval: mark order paid → create entitlement → generate affiliate earning
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
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error("Not authenticated");
      
      // Update the payment request
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: approve ? "approved" : "rejected",
          admin_note: admin_note || null,
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);
      
      if (error) throw error;
      
      if (approve) {
        // 1. Find the pending order for this user (most recent pending)
        const { data: pendingOrder } = await supabase
          .from("orders")
          .select("*, products(id, name, type, affiliate_percent, billing_type, billing_interval)")
          .eq("user_id", user_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingOrder) {
          // Mark order as paid
          await supabase
            .from("orders")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("id", pendingOrder.id);

          // 2. Create entitlement for the purchased product
          const product = pendingOrder.products as any;
          if (product) {
            const endsAt = product.billing_type === "recurring"
              ? new Date(Date.now() + (product.billing_interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
              : null; // one-time = permanent

            await supabase
              .from("entitlements")
              .upsert({
                user_id: user_id,
                product_id: product.id,
                status: "active",
                source_order_id: pendingOrder.id,
                started_at: new Date().toISOString(),
                ends_at: endsAt,
              }, { onConflict: "user_id,product_id" });
          }

          // 3. Generate affiliate commission if referral code exists
          if (pendingOrder.referral_code && product?.affiliate_percent > 0) {
            const commission = calcCommission(pendingOrder.amount_usd, product.affiliate_percent);
            
            if (commission > 0) {
              // Find the referrer by affiliate code
              const { data: affiliateProfile } = await supabase
                .from("affiliate_profiles")
                .select("user_id")
                .eq("affiliate_code", pendingOrder.referral_code)
                .eq("status", "active")
                .maybeSingle();

              if (affiliateProfile) {
                await supabase
                  .from("affiliate_earnings")
                  .insert({
                    referrer_user_id: affiliateProfile.user_id,
                    referred_user_id: user_id,
                    order_id: pendingOrder.id,
                    amount_usd: commission,
                    earning_type: product.billing_type === "recurring" ? "recurring" : "one_time",
                    status: "pending",
                  });

                // Notify the affiliate
                await supabase.from("notifications").insert({
                  user_id: affiliateProfile.user_id,
                  type: "success",
                  title: "Commission Earned! 🎉",
                  message: `You earned $${commission.toFixed(2)} commission from a referral purchase of ${product.name}.`,
                });
              }
            }
          }

          // Notify the buyer
          await supabase.from("notifications").insert({
            user_id: user_id,
            type: "success",
            title: "Payment Approved!",
            message: `Your payment for ${product?.name || "your order"} has been approved. You now have access!`,
          });
        }
        
        // Legacy: also handle plan_id-based subscription activation
        if (plan_id) {
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
      } else {
        // Rejected - notify user
        await supabase.from("notifications").insert({
          user_id: user_id,
          type: "error",
          title: "Payment Rejected",
          message: admin_note || "Your payment request was rejected. Please contact support.",
        });
      }
      
      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action_type: approve ? "payment_approved" : "payment_rejected",
        payload_json: { request_id: id, target_user_id: user_id, admin_note },
      });

      return { approve };
    },
    onSuccess: (data) => {
      toast.success(data.approve ? "Payment approved! Entitlement granted." : "Payment request rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process payment request");
    }
  });
};
