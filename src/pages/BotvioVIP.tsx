import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const included = [
  "All Trading Hubs, including Gold, Forex, Crypto and Synthetic",
  "Signals Center and premium signals",
  "AI chart upload and analysis",
  "All courses and learning resources",
  "Current Botvio AI robots and legacy bot catalogue",
  "Copy trading and provider tools",
  "Sports betting analysis features",
  "Up to 5 connected accounts and 10 bot instances",
  "MT5 direct execution access, subject to separate admin approval and safety checks",
];

export default function BotvioVIP() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["botvio-vip-plan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("id,code,name,price_usd,is_active")
        .eq("code", "vip")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in before subscribing to Botvio VIP.");
      return;
    }
    if (!plan?.id) {
      toast.error("Botvio VIP is not configured yet. Please try again later.");
      return;
    }
    if (!method || !proof) {
      toast.error("Choose a payment method and attach payment proof.");
      return;
    }
    setSubmitting(true);
    try {
      const ext = proof.name.split(".").pop() || "png";
      const path = "vip-proofs/" + user.id + "/" + Date.now() + "." + ext;
      const { error: uploadError } = await supabase.storage.from("charts").upload(path, proof);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("charts").getPublicUrl(path);
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        plan_id: plan.id,
        product_id: null,
        amount_usd: 50,
        currency: "USD",
        method,
        proof_upload_url: urlData.publicUrl,
        status: "submitted",
      });
      if (error) throw error;
      toast.success("Botvio VIP payment submitted. Access starts after admin approval.");
      setMethod("");
      setProof(null);
      await queryClient.invalidateQueries({ queryKey: ["subscription-gate", user.id] });
    } catch (error: any) {
      toast.error(error?.message || "Could not submit VIP payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="vip" title="Botvio VIP — All-Access Trading Subscription" description="One Botvio VIP subscription for $50/month unlocks premium trading hubs, signals, AI chart analysis, courses, robots and copy trading. Access is activated after payment approval." />
      <Header />
      <main className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Botvio
        </Link>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-amber-500/10 p-6 md:p-10">
            <Badge className="mb-4"><Crown className="mr-1 h-3.5 w-3.5" /> ALL-ACCESS MEMBERSHIP</Badge>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Botvio VIP</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">One subscription. All premium features. No need to buy each hub or robot separately.</p>
            <div className="my-6 flex items-end gap-2">
              <span className="text-5xl font-black">$50</span><span className="pb-1 text-muted-foreground">/ month</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {included.map((item) => <div key={item} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{item}</span></div>)}
            </div>
            <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" /> Payment is manually verified. VIP entitlements activate only after an administrator approves the payment. Trading outcomes are not guaranteed.</p>
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Subscribe to Botvio VIP</CardTitle>
              <p className="text-sm text-muted-foreground">Submit your payment proof for admin review. Your subscription is not active until approved.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user ? (
                <div className="space-y-3"><p className="text-sm text-muted-foreground">Sign in to submit a subscription request.</p><Button asChild className="w-full"><Link to="/auth">Sign in / Create account</Link></Button></div>
              ) : isLoading ? (
                <p className="text-sm text-muted-foreground">Loading VIP plan…</p>
              ) : !plan ? (
                <p className="text-sm text-destructive">VIP plan is not configured yet. The plan migration must be applied first.</p>
              ) : (
                <>
                  <PaymentMethodSelector
                    planCode="vip"
                    planName="Botvio VIP"
                    amount={50}
                    embedded
                    onMethodChange={setMethod}
                    onProofFileChange={setProof}
                  />
                  <Button className="w-full" disabled={submitting || !method || !proof} onClick={submit}>
                    {submitting ? "Submitting…" : "Submit VIP payment — $50"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
