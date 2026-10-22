import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conversionRate } from "@/config/planEntitlements";

type Summary = {
  registered_users: number; paid_subscribers: number; active_trials: number;
  revenue_30d_usd: number; revenue_all_usd: number; pending_payments: number;
  renewals_due_7d: number; plan_distribution: { tier: string; users: number }[];
};

/** Verified monetization numbers from approved payments and active subscriptions only. */
export function AdminMonetizationSummary() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-monetization-summary"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_monetization_summary");
      if (error) throw error;
      return data as Summary;
    },
  });

  const stats: [string, string][] = data ? [
    ["Registered users", String(data.registered_users)],
    ["Paid subscribers", String(data.paid_subscribers)],
    ["Active trials", String(data.active_trials)],
    ["Revenue (30d)", `$${Number(data.revenue_30d_usd).toFixed(2)}`],
    ["Revenue (all time)", `$${Number(data.revenue_all_usd).toFixed(2)}`],
    ["Pending payments", String(data.pending_payments)],
    ["Renewals due (7d)", String(data.renewals_due_7d)],
    ["Paid conversion", conversionRate(data.paid_subscribers, data.registered_users)],
  ] : [];

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Monetization</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">Data unavailable: {(error as Error).message}</p>}
        {data && <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stats.map(([l, v]) => (
              <div key={l} className="rounded-lg border p-3"><p className="text-[11px] text-muted-foreground">{l}</p><p className="text-lg font-bold">{v}</p></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {data.plan_distribution.map((p) => (
              <span key={p.tier} className="rounded-full border px-3 py-1 capitalize">{p.tier}: {p.users}</span>
            ))}
          </div>
        </>}
      </CardContent>
    </Card>
  );
}
