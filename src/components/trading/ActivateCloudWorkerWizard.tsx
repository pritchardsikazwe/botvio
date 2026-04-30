import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Rocket, Lock, Plug, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Status {
  loading: boolean;
  planCode: string;
  isPaid: boolean;
  hasDeriv: boolean;
  hasMt5: boolean;
  enabledCount: number;
  paused: boolean;
}

const PAID = ["basic", "standard", "vip", "pro", "premium"];

export function ActivateCloudWorkerWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [s, setS] = useState<Status>({
    loading: true, planCode: "free", isPaid: false,
    hasDeriv: false, hasMt5: false, enabledCount: 0, paused: false,
  });
  const [activating, setActivating] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setS((p) => ({ ...p, loading: true }));
    const [plan, deriv, mt5, instr, limits] = await Promise.all([
      supabase.from("user_plan_subscriptions")
        .select("status, pricing_plans!inner(code)")
        .eq("user_id", user.id).eq("status", "active").maybeSingle(),
      supabase.from("deriv_connections").select("id").eq("user_id", user.id).limit(1),
      supabase.from("user_mt5_terminals").select("id").eq("user_id", user.id).limit(1),
      supabase.from("auto_trade_instruments").select("enabled").eq("user_id", user.id),
      supabase.from("auto_trade_user_limits").select("paused").eq("user_id", user.id).maybeSingle(),
    ]);
    const code = (plan.data as any)?.pricing_plans?.code ?? "free";
    setS({
      loading: false,
      planCode: code,
      isPaid: PAID.includes(code),
      hasDeriv: (deriv.data?.length ?? 0) > 0,
      hasMt5: (mt5.data?.length ?? 0) > 0,
      enabledCount: (instr.data ?? []).filter((r: any) => r.enabled).length,
      paused: !!(limits.data?.paused),
    });
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  const ready = s.isPaid && (s.hasDeriv || s.hasMt5) && s.enabledCount > 0;

  const handleActivate = async () => {
    if (!user || !ready) return;
    setActivating(true);
    const { error } = await supabase.from("auto_trade_user_limits")
      .upsert({ user_id: user.id, paused: false }, { onConflict: "user_id" });
    setActivating(false);
    if (error) {
      toast({ title: "Couldn't activate", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "✅ 24/7 Trading is ON",
      description: "Worker will pick up your instruments on the next 2-min tick.",
    });
    refresh();
  };

  if (!user) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Activate 24/7 Cloud Worker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {s.loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your setup…
          </div>
        ) : (
          <>
            <CheckRow
              ok={s.isPaid}
              icon={<Lock className="h-4 w-4" />}
              label="Paid plan"
              detail={s.isPaid ? `Active: ${s.planCode.toUpperCase()}` : "Cloud worker requires Basic, Standard or VIP."}
              cta={!s.isPaid ? { label: "Upgrade", to: "/billing" } : undefined}
            />
            <CheckRow
              ok={s.hasDeriv || s.hasMt5}
              icon={<Plug className="h-4 w-4" />}
              label="Execution route connected"
              detail={
                s.hasDeriv && s.hasMt5 ? "Deriv + MT5 connected" :
                s.hasDeriv ? "Deriv connected (recommended)" :
                s.hasMt5 ? "MT5 terminal linked" :
                "Connect Deriv (no install) or MT5 to execute trades."
              }
              cta={!(s.hasDeriv || s.hasMt5) ? { label: "Connect", to: "/connections" } : undefined}
            />
            <CheckRow
              ok={s.enabledCount > 0}
              icon={<Activity className="h-4 w-4" />}
              label="Enabled instruments"
              detail={s.enabledCount > 0 ? `${s.enabledCount} enabled` : "Enable at least one instrument below."}
            />

            <div className="pt-2">
              <Button
                size="lg"
                className="w-full gap-2"
                disabled={!ready || activating || (ready && !s.paused)}
                onClick={handleActivate}
              >
                {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {!ready
                  ? "Complete the steps above to activate"
                  : !s.paused
                  ? "✅ 24/7 Trading is ON"
                  : "Turn on 24/7 trading"}
              </Button>
              {ready && !s.paused && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Worker scans every 2 minutes. Use "Pause all" above to stop.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CheckRow({
  ok, icon, label, detail, cta,
}: {
  ok: boolean;
  icon: React.ReactNode;
  label: string;
  detail: string;
  cta?: { label: string; to: string };
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon} {label}
          {ok && <Badge variant="outline" className="border-success/40 text-success text-[10px]">OK</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
      {cta && (
        <Button asChild size="sm" variant="outline">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}