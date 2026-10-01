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
  plan?: { name?: string | null; code?: string | null } | null;
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
        .select("*, profiles(email,display_name,whatsapp_number), pricing_plans(name,code)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setRequests((data || []).map((r: any) => ({
        ...r,
        profile: r.profiles,
        plan: r.pricing_plans,
      })));
    } catch (e: any) {
      toast.error(e?.message || "Could not load payment requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (request: PaymentRequest) => {
    if (!request.plan_id) {
      toast.error("This payment request has no plan attached.");
      return;
    }
    setWorking(request.id);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error: paymentError } = await supabase
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", request.id);
      if (paymentError) throw paymentError;

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

      toast.success(`Payment approved — ${request.profile?.display_name || request.profile?.email || "user"} now has paid access.`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not approve payment");
    } finally {
      setWorking(null);
    }
  };

  const reject = async (request: PaymentRequest) => {
    setWorking(request.id);
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);
      if (error) throw error;
      toast.success("Payment request rejected.");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not reject payment");
    } finally {
      setWorking(null);
    }
  };

  const visible = requests.filter(r => filter === "all" || r.status === filter);
  const pending = requests.filter(r => r.status === "submitted").length;

  return (
    <Card id="payment-requests-panel" className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-amber-500" />
              Signal & Subscription Payments
              {pending > 0 && <Badge className="bg-amber-500 text-slate-950">{pending} pending</Badge>}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Review mobile-money or crypto payment proofs and activate the selected plan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading payment requests…</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No payment requests in this view.</div>
        ) : (
          <div className="divide-y">
            {visible.map(request => (
              <div key={request.id} className="p-4 hover:bg-slate-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{request.profile?.display_name || "Unnamed user"}</span>
                      <Badge variant="outline">{request.plan?.name || request.plan?.code || "Plan"}</Badge>
                      <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{request.profile?.email || request.user_id}</p>
                    <p className="text-sm mt-1">
                      <span className="font-semibold">${request.amount_usd}</span> · {request.method} · {new Date(request.created_at).toLocaleString()}
                    </p>
                    {request.profile?.whatsapp_number && (
                      <p className="text-xs text-muted-foreground mt-1">WhatsApp: {request.profile.whatsapp_number}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {request.proof_upload_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={request.proof_upload_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" /> Proof
                        </a>
                      </Button>
                    )}
                    {request.status === "submitted" && (
                      <>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={working === request.id} onClick={() => approve(request)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & Activate
                        </Button>
                        <Button size="sm" variant="destructive" disabled={working === request.id} onClick={() => reject(request)}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
