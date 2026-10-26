import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Crown, Gift, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAccessGate } from "@/hooks/useAccessGate";

const EXNESS_LINK = "https://one.toexness.com/a/ts1kvs1k";
const DERIV_LINK = "https://t.deriv.link?t=Y8BMQZGW5HAE";
const WHATSAPP = "260777204440";
const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi Botvio, I want to subscribe / get free access with my Exness or Deriv account.")}`;

/** Shown on every visit: explains the requirements to use Botvio (subscribe, or partner via Exness/Deriv links). */
export function VisitPopup() {
  const { user, profile, isAdmin, isSuperAdmin, loading } = useAuth() as any;
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const gate = useAccessGate();

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

  // Sign-ins older than this moment are cleared once, so everyone signs in fresh.
  useEffect(() => {
    const CUTOFF = Date.parse("2026-10-26T13:45:00Z");
    const last = user?.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
    if (user && last < CUTOFF) supabase.auth.signOut().catch(() => {});
  }, [user]);

  // Unsubscribed users whose free week has ended are signed out (web and installed app) until an admin approves them.
  const [forcedOut, setForcedOut] = useState(false);
  const mustLogout = !!user && !loading && !gate.isLoading && !gate.hasAccess && !isLoading && !hasPlan && !isAdmin && !isSuperAdmin && !pathname.startsWith("/admin");
  useEffect(() => {
    if (!mustLogout) return;
    setForcedOut(true); setOpen(true);
    supabase.auth.signOut().catch(() => {});
  }, [mustLogout]);

  if (loading) return null;
  if (!open && !forcedOut) return null;
  if (!forcedOut && pathname.startsWith("/admin") || pathname.startsWith("/choose-plan") || pathname.startsWith("/payment")) return null;
  if (user && (isAdmin || isSuperAdmin || isLoading || hasPlan)) return null;
  if (user && profile && !profile.whatsapp_number?.trim()) return null; // WhatsApp prompt comes first

  const member = !!user;
  const locked = forcedOut || (member && !gate.isLoading && !gate.hasAccess);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur" role="dialog" aria-modal="true">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
        {!locked && <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>}
        <div className="mb-3 flex items-center gap-3 pr-6">
          <div className="rounded-full bg-primary/10 p-2 text-primary">{member ? <Crown className="h-5 w-5" /> : <Gift className="h-5 w-5" />}</div>
          <h2 className="text-lg font-semibold">{locked ? "You have been logged out — free trial ended" : member ? `Your free trial ends in ${gate.trialDaysLeft} day${gate.trialDaysLeft === 1 ? "" : "s"} — kindly subscribe` : "How to get access to Botvio"}</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {locked
            ? "Your 7-day free trial is over. To keep using Botvio, meet one of the requirements below. You have been logged out. Once you subscribe or open an account with our Exness/Deriv links and send us the details on WhatsApp, an admin will approve your access and you can log in again."
            : member
            ? "Your account has no active plan. Your free trial will expire and you will no longer have access to Botvio unless you meet one of the requirements below."
            : "To use Botvio you need to meet one of these requirements:"}
        </p>
        <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li><b className="text-foreground">Subscribe</b> to one of our plans: Starter $9, Basic $19 or VIP $39 per month.</li>
          <li><b className="text-foreground">Open a new Exness or Deriv account</b> using our partner links below for free access.</li>
          <li><b className="text-foreground">Already have an Exness account?</b> Open Exness live support chat and ask them to tag (link) your account to our partner link: <span className="break-all font-medium text-foreground">{EXNESS_LINK}</span></li>
        </ol>
        <p className="mb-4 text-sm text-muted-foreground">Then send your Exness or Deriv account number to us on WhatsApp <b>+260 777 204 440</b> to activate your access.</p>
        <div className="space-y-2">
          {member && <Button asChild className="w-full" variant="gold"><Link to="/choose-plan" onClick={() => setOpen(false)}>Subscribe now</Link></Button>}
          <Button asChild className="w-full" variant={member ? "outline" : "gold"}><a href={EXNESS_LINK} target="_blank" rel="noopener sponsored">Create Exness account — free access</a></Button>
          <Button asChild variant="outline" className="w-full"><a href={DERIV_LINK} target="_blank" rel="noopener sponsored">Create Deriv account — free access</a></Button>
          <Button asChild variant="outline" className="w-full"><a href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp +260 777 204 440</a></Button>
          {!member && <Button asChild variant="ghost" className="w-full"><Link to="/signup" onClick={() => setOpen(false)}>Create Botvio account</Link></Button>}
        </div>
      </div>
    </div>
  );
}
