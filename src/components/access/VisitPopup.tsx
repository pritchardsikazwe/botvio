import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Crown, Gift, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";
const WHATSAPP = "260777204440";
const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi Botvio, I want to subscribe / get free VIP access.")}`;

/** Shown on every visit (each page load): visitors get the Exness free-access offer, unsubscribed members get the subscribe notice. */
export function VisitPopup() {
  const { user, profile, isAdmin, isSuperAdmin, loading } = useAuth() as any;
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const { data: hasPlan, isLoading } = useQuery({
    queryKey: ["visit-popup-plan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_plan_subscriptions")
        .select("id, pricing_plans(code)").eq("user_id", user!.id).eq("status", "active").maybeSingle();
      const code = (data?.pricing_plans as any)?.code;
      return !!code && code !== "free";
    },
  });

  useEffect(() => { const t = setTimeout(() => setOpen(true), 1500); return () => clearTimeout(t); }, []);

  if (!open || loading) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/choose-plan") || pathname.startsWith("/payment")) return null;
  if (user && (isAdmin || isSuperAdmin || isLoading || hasPlan)) return null;
  if (user && profile && !profile.whatsapp_number?.trim()) return null; // WhatsApp prompt comes first

  const member = !!user;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">{member ? <Crown className="h-5 w-5" /> : <Gift className="h-5 w-5" />}</div>
          <h2 className="text-lg font-semibold">{member ? "Subscribe to keep using Botvio" : "Get free Botvio access"}</h2>
        </div>
        {member ? (
          <p className="mb-4 text-sm text-muted-foreground">Your account does not have an active plan. You will no longer have access to Botvio unless you subscribe. Choose Starter, Basic or VIP — or message us on WhatsApp <b>+260 777 204 440</b> to subscribe.</p>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">Open a free Exness trading account with our partner link to get free Botvio access. After signing up, create your Botvio account and send us your Exness account number on WhatsApp <b>+260 777 204 440</b>.</p>
        )}
        <div className="space-y-2">
          {member ? (
            <Button asChild className="w-full" variant="gold"><Link to="/choose-plan" onClick={() => setOpen(false)}>Subscribe now</Link></Button>
          ) : (
            <Button asChild className="w-full" variant="gold"><a href={EXNESS_LINK} target="_blank" rel="noopener sponsored">Create Exness account — free access</a></Button>
          )}
          {member && <Button asChild variant="outline" className="w-full"><a href={EXNESS_LINK} target="_blank" rel="noopener sponsored">Or open Exness account for free VIP</a></Button>}
          <Button asChild variant="outline" className="w-full"><a href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp +260 777 204 440</a></Button>
          {!member && <Button asChild variant="ghost" className="w-full"><Link to="/signup" onClick={() => setOpen(false)}>Create Botvio account</Link></Button>}
        </div>
      </div>
    </div>
  );
}
