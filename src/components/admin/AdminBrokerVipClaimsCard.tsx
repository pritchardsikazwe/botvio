import { useEffect, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Row = { id: string; user_id: string; broker: string; broker_account_id: string; screenshot_path: string; status: string; created_at: string; profile?: { display_name: string | null; email: string | null; whatsapp_number: string | null } };

export function AdminBrokerVipClaimsCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("broker_vip_claims").select("id,user_id,broker,broker_account_id,screenshot_path,status,created_at").order("created_at", { ascending: false }).limit(100);
    if (error) { toast({ title: "Could not load VIP claims", description: error.message, variant: "destructive" }); setLoading(false); return; }
    const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const { data: profs } = ids.length ? await supabase.from("profiles").select("user_id,display_name,email,whatsapp_number").in("user_id", ids) : { data: [] as any[] };
    const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    setRows((data ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const view = async (path: string) => {
    const { data, error } = await supabase.storage.from("broker-vip-proofs").createSignedUrl(path, 300);
    if (error || !data) return toast({ title: "Screenshot unavailable", description: error?.message, variant: "destructive" });
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const act = async (id: string, action: "approve" | "reject" | "revoke") => {
    const note = action === "approve" ? null : window.prompt("Reason shown to the user (optional)") ?? null;
    if (action !== "approve" && note === null) return;
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_broker_vip_claim", { p_claim_id: id, p_action: action, p_note: note || undefined });
    setBusy(null);
    if (error) return toast({ title: "Action failed", description: error.message, variant: "destructive" });
    toast({ title: action === "approve" ? "VIP switched on" : action === "revoke" ? "VIP removed" : "Claim rejected" });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />Free VIP claims (Exness / Deriv)</CardTitle>
        <CardDescription>Check the account ID appears under your partner dashboard, then approve. Revoke if the account becomes inactive.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {loading ? <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> : !rows.length ? <p className="p-6 text-center text-sm text-muted-foreground">No claims yet.</p> : (
          <table className="w-full text-sm">
            <thead className="border-b"><tr><th className="p-3 text-left">User</th><th className="p-3 text-left">Broker / ID</th><th className="p-3 text-left">Proof</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="p-3"><div className="font-medium">{r.profile?.display_name || "User"}</div><div className="text-xs text-muted-foreground">{r.profile?.email}</div>{r.profile?.whatsapp_number && <a className="text-xs text-primary hover:underline" href={`https://wa.me/${r.profile.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{r.profile.whatsapp_number}</a>}</td>
                <td className="p-3"><div className="capitalize">{r.broker}</div><div className="font-mono text-xs">{r.broker_account_id}</div><div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div></td>
                <td className="p-3"><Button size="sm" variant="outline" onClick={() => view(r.screenshot_path)}>View</Button></td>
                <td className="p-3"><Badge variant={r.status === "approved" ? "default" : r.status === "pending" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge></td>
                <td className="p-3"><div className="flex flex-wrap gap-2">
                  {r.status === "pending" && <><Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, "approve")}>Approve VIP</Button><Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "reject")}>Reject</Button></>}
                  {r.status === "approved" && <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "revoke")}>Revoke</Button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
