import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, PlugZap } from "lucide-react";

type Lead = { key: string; user_id: string; login: string; server: string; source: string; status: string; error?: string | null; at: string };

/** Admin follow-up list: users who tried to connect an MT5 account, with WhatsApp contact. */
export function AdminMt5LeadsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-mt5-leads"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const [ta, mr] = await Promise.all([
        supabase.from("trading_accounts")
          .select("id,user_id,login_id,server,broker,platform,is_active,tradecopy_active,connection_status,last_direct_error,created_at")
          .gte("created_at", since).order("created_at", { ascending: false }).limit(200),
        supabase.from("managed_mt5_requests")
          .select("id,user_id,mt5_login,mt5_server,status,created_at")
          .gte("created_at", since).order("created_at", { ascending: false }).limit(200),
      ]);
      const leads: Lead[] = [];
      for (const a of (ta.data ?? []) as any[]) {
        if (a.platform && !/mt5/i.test(a.platform) && !a.login_id) continue;
        const connected = a.is_active && a.tradecopy_active;
        leads.push({ key: "t" + a.id, user_id: a.user_id, login: a.login_id ?? "—", server: a.server ?? a.broker ?? "—", source: "Connect MT5", status: connected ? "connected" : (a.connection_status || "not connected"), error: a.last_direct_error, at: a.created_at });
      }
      for (const r of (mr.data ?? []) as any[]) {
        leads.push({ key: "m" + r.id, user_id: r.user_id, login: r.mt5_login, server: r.mt5_server, source: "Managed request", status: r.status, at: r.created_at });
      }
      const ids = [...new Set(leads.map((l) => l.user_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("user_id,display_name,email,whatsapp_number").in("user_id", ids)
        : { data: [] as any[] };
      const byId = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      leads.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      return leads.map((l) => ({ ...l, profile: byId.get(l.user_id) as any }));
    },
  });

  const waLink = (n: string) => `https://wa.me/${encodeURIComponent(n.replace(/[^0-9]/g, ""))}?text=${encodeURIComponent("Hi from Botvio! I saw you tried to connect your MT5 account — can I help you finish the setup?")}`;

  return (
    <Card id="mt5-leads-panel">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><PlugZap className="h-5 w-5 text-primary" />MT5 connection attempts (last 30 days)</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Users who tried to connect MT5. Follow up on WhatsApp with those not yet connected.</p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading…</p> : !data?.length ? <p className="p-4 text-sm text-muted-foreground">No MT5 connection attempts yet.</p> : (
          <div className="max-h-[480px] divide-y overflow-auto">
            {data.map((l) => (
              <div key={l.key} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{l.profile?.display_name || l.profile?.email || "User"}</div>
                  <div className="text-xs text-muted-foreground">{l.profile?.email} · MT5 {l.login} @ {l.server} · {l.source} · {new Date(l.at).toLocaleString()}</div>
                  {l.error && <div className="mt-1 text-xs text-destructive">{l.error}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={l.status === "connected" ? "default" : "secondary"}>{l.status}</Badge>
                  {l.profile?.whatsapp_number ? (
                    <Button asChild size="sm" variant="outline"><a href={waLink(l.profile.whatsapp_number)} target="_blank" rel="noreferrer"><MessageCircle className="mr-1 h-4 w-4" />{l.profile.whatsapp_number}</a></Button>
                  ) : <span className="text-xs text-muted-foreground">No WhatsApp</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
