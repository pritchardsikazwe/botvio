import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, CheckCircle2, XCircle, WalletCards, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type PaymentRequest = {
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
  profile?: { email?: string | null; display_name?: string | null; whatsapp_number?: string | null } | null;
  plan?: { name?: string | null; code?: string | null } | null;\n  product?: { id?: string | null; name?: string | null; slug?: string | null; billing_type?: string | null } | null;
};

export function PaymentRequestsPanel() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [filter, setFilter] = useState("submitted");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*, profiles(email,display_name,whatsapp_number), pricing_plans(name,code), products(id,name,slug,billing_type)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setRequests((data || []).map((r: any) => ({
        ...r,
        profile: r.profiles,
        plan: r.pricing_plans,\n        product: r.products,
      })));
    } catch (e: any) {
      toast.error(e?.message || "Could not load payment requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (request: PaymentRequest) => {
    setWorking(request.id);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error: paymentError } = await supabase
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", request.id);
      if (paymentError) throw paymentError;

      if (request.product_id || request.product?.id) {
        const productId = request.product_id || request.product?.id;
        const recurring = request.product?.billing_type === "recurring";
        const { error: entError } = await supabase.from("entitlements").upsert({
          user_id: request.user_id,
          product_id: productId,
          status: "active",
          source_order_id: request.order_id || null,
          started_at: now.toISOString(),
          ends_at: recurring ? end.toISOString() : null,
        } as any, { onConflict: "user_id,product_id" });
        if (entError) throw entError;

        if (request.product?.slug === "mt5-direct" && request.account_id) {
          const { error: accountError } = await supabase.from("trading_accounts").update({
            direct_execution_entitled: true,
            direct_execution_plan: request.product.name || "MT5 Direct",
            direct_execution_expires_at: recurring ? end.toISOString() : null,
          } as any).eq("id", request.account_id).eq("user_id", request.user_id);
          if (accountError) throw accountError;
        }
      } else {
        if (!request.plan_id) throw new Error("This payment request has no plan attached.");
        const { error: subError } = await supabase
          .from("user_plan_subscriptions")
          .upsert({
            user_id: request.user_id,
            pricing_plan_id: request.plan_id,
            current_period_start: now.toISOString(),
            current_period_end: end.toISOString(),
            status: "active",
          }, { onConflict: "user_id" });
        if (subError) throw subError;
      }

      toast.success(`Payment approved — ${request.profile?.display_name || request.profile?.email || "user"} now has paid access.`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not approve payment");
    } finally {
      setWorking(null);
    }
  };
