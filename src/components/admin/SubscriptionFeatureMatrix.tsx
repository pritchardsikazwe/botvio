import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Plan = {
  id: string; name: string; code: string;
  allow_copy_trading: boolean; allow_premium_bots: boolean; allow_provider_listing: boolean;
  allow_premium_signals: boolean; allow_sports_betting: boolean; allow_all_courses: boolean;
  allow_signals_center: boolean; allow_ai_chart_upload: boolean; allow_trading_hubs: boolean; allow_legacy_bots: boolean;
};

const FEATURES: { key: keyof Plan; label: string; detail: string }[] = [
  { key: "allow_signals_center", label: "Signals Center", detail: "Access to the unified signal feed and filters." },
  { key: "allow_premium_signals", label: "Premium Signals", detail: "Premium signal content, not just the Signals page shell." },
  { key: "allow_ai_chart_upload", label: "AI Chart Upload", detail: "Upload chart screenshots for AI analysis." },
  { key: "allow_trading_hubs", label: "Trading Hubs", detail: "Use protected specialist hubs and their interactive tools." },
  { key: "allow_all_courses", label: "All Courses", detail: "Unlock the full course library." },
  { key: "allow_premium_bots", label: "Current AI Robots", detail: "Access current Botvio robot products when product access is also active." },
  { key: "allow_legacy_bots", label: "Legacy Bots", detail: "Explicitly allow older bot experiences; disabled by default." },
  { key: "allow_copy_trading", label: "Copy Trading", detail: "Access copy-trading features, subject to connection and safety approvals." },
  { key: "allow_provider_listing", label: "Provider Listing", detail: "Apply to list a provider; listing/activation can still require admin approval." },
  { key: "allow_sports_betting", label: "Sports Betting", detail: "Unlock sports analysis features where available." },
];

export function SubscriptionFeatureMatrix() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).from("pricing_plans")
        .select("id,name,code,allow_copy_trading,allow_premium_bots,allow_provider_listing,allow_premium_signals,allow_sports_betting,allow_all_courses,allow_signals_center,allow_ai_chart_upload,allow_trading_hubs,allow_legacy_bots");
      if (error) throw error;
      setPlans((data ?? []).map((p: any) => ({
        ...p,
        allow_copy_trading: !!p.allow_copy_trading,
        allow_premium_bots: !!p.allow_premium_bots,
        allow_provider_listing: !!p.allow_provider_listing,
        allow_premium_signals: !!p.allow_premium_signals,
        allow_sports_betting: !!p.allow_sports_betting,
        allow_all_courses: !!p.allow_all_courses,
        allow_signals_center: p.allow_signals_center ?? true,
        allow_ai_chart_upload: !!p.allow_ai_chart_upload,
        allow_trading_hubs: p.allow_trading_hubs ?? true,
        allow_legacy_bots: !!p.allow_legacy_bots,
      })));
    } catch (e: any) {
      toast.error(e?.message || "Could not load subscription feature settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const toggle = async (plan: Plan, key: keyof Plan, checked: boolean) => {
    if (key === "id" || key === "name" || key === "code") return;
    const id = String(plan.id);
    setSavingKey(id + ":" + String(key));
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [key]: checked } : p));
    try {
      const { error } = await (supabase as any).from("pricing_plans").update({ [key]: checked }).eq("id", id);
      if (error) throw error;
      toast.success(`${plan.name}: ${FEATURES.find(f => f.key === key)?.label ?? String(key)} ${checked ? "enabled" : "disabled"}`);
    } catch (e: any) {
      setPlans(prev => prev.map(p => p.id === id ? { ...p, [key]: !checked } : p));
      toast.error(e?.message || "Could not save feature setting");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card id="subscription-feature-matrix" className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Subscription Feature Access</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Choose which capabilities each plan includes. Product purchases and individual admin grants remain separate approvals.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="p-8 text-sm text-muted-foreground">Loading plans…</div> : plans.length === 0 ? <div className="p-8 text-sm text-muted-foreground">No subscription plans were found.</div> : (
          <div className="space-y-5 p-4 md:p-6">
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">Switches define plan eligibility. Expired subscriptions, pending payment requests, and revoked product entitlements must not unlock paid features. Legacy bots are OFF by default.</div>
            {plans.map(plan => (
              <section key={plan.id} className="rounded-xl border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                  <div><h3 className="font-semibold">{plan.name}</h3><p className="text-xs text-muted-foreground">{plan.code}</p></div>
                  <Badge variant={plan.code.toLowerCase() === "free" ? "secondary" : "default"}>{plan.code.toLowerCase() === "free" ? "Free plan" : "Subscription plan"}</Badge>
                </div>
                <div className="grid gap-1 p-3 sm:grid-cols-2">
                  {FEATURES.map(feature => {
                    const checked = !!plan[feature.key];
                    const key = `${plan.id}:${String(feature.key)}`;
                    return <label key={String(feature.key)} className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-muted/40">
                      <Checkbox checked={checked} disabled={savingKey === key} onCheckedChange={v => void toggle(plan, feature.key, v === true)} />
                      <span className="min-w-0"><span className="block text-sm font-medium">{feature.label}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{feature.detail}</span></span>
                    </label>;
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
