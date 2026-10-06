import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Package, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AdminMonetizationTab() {
  const qc = useQueryClient();
  const { data: testMode } = useQuery({ queryKey: ["marketplace-test-mode-admin"], queryFn: async () => {
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", "marketplace_test_mode").maybeSingle();
    if (error) throw error;
    return (data?.value as any)?.enabled === true;
  }});
  const testModeMutation = useMutation({ mutationFn: async (enabled: boolean) => {
    const { error } = await supabase.from("app_settings").upsert({ key: "marketplace_test_mode", value: { enabled }, description: "Controls free marketplace test activation", updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["marketplace-test-mode-admin"] }); toast.success("Marketplace test mode updated"); }, onError: (e:any) => toast.error(e.message || "Could not update test mode") });
  const { data, isLoading } = useQuery({ queryKey: ["admin-monetization-products"], queryFn: async () => {
    const [{ data: products, error: pe }, { data: entitlements, error: ee }] = await Promise.all([
      supabase.from("products").select("id,name,slug,type,price_usd,billing_type,billing_interval,is_active,is_featured").order("is_featured",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("entitlements").select("product_id,status"),
    ]);
    if (pe) throw pe; if (ee) throw ee;
    const counts: Record<string,number> = {}; (entitlements || []).forEach((e:any) => { if (e.status === "active") counts[e.product_id] = (counts[e.product_id] || 0) + 1; });
    return (products || []).map((p:any) => ({ ...p, active_users: counts[p.id] || 0 }));
  }});
  const update = useMutation({ mutationFn: async ({ id, patch }: { id:string; patch:Record<string,unknown> }) => {
    const { error } = await supabase.from("products").update(patch as any).eq("id", id); if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey:["admin-monetization-products"] }); qc.invalidateQueries({ queryKey:["home-botvio-products"] }); qc.invalidateQueries({ queryKey:["marketplace-products"] }); toast.success("Monetization setting updated"); }, onError:(e:any)=>toast.error(e.message || "Update failed") });
  return <Card id="monetization-panel" className="overflow-hidden">
    <CardHeader className="border-b"><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-500"/>Botvio Monetization</CardTitle><p className="mt-1 text-sm text-muted-foreground">Control hubs, robots and MT5 Direct pricing and availability. Changes appear on the Marketplace and Home pricing cards.</p></div><div className="flex items-center gap-3"><div className="flex items-center gap-2 rounded-lg border px-3 py-2"><span className="text-xs font-medium">Marketplace test mode</span><Switch checked={!!testMode} onCheckedChange={(v)=>testModeMutation.mutate(v)} disabled={testModeMutation.isPending}/></div><Button variant="outline" size="icon" onClick={()=>qc.invalidateQueries({queryKey:["admin-monetization-products"]})}><RefreshCw className="h-4 w-4"/></Button></div></div></CardHeader>
    <CardContent className="p-0">{isLoading ? <div className="p-8 text-center text-muted-foreground">Loading products…</div> : <div className="divide-y">{data?.map((p:any)=><div key={p.id} className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{p.name}</span><Badge variant="outline">{p.type}</Badge><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Open" : "Closed"}</Badge><Badge variant="outline">{p.active_users} active</Badge></div><p className="text-xs text-muted-foreground mt-1">{p.slug} · {p.billing_type === "recurring" ? "Recurring / " + (p.billing_interval || "month") : "One-time"}</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-1"><span className="text-sm">$</span><Input className="w-24 h-9" type="number" min="0" value={p.price_usd} onChange={(e)=>{ const v=Number(e.target.value); update.mutate({id:p.id,patch:{price_usd:v}}); }}/></div><div className="flex items-center gap-2 rounded-lg border px-3 h-9"><span className="text-xs">Featured</span><Switch checked={!!p.is_featured} onCheckedChange={(v)=>update.mutate({id:p.id,patch:{is_featured:v}})}/></div><div className="flex items-center gap-2 rounded-lg border px-3 h-9"><span className="text-xs">Sales open</span><Switch checked={!!p.is_active} onCheckedChange={(v)=>update.mutate({id:p.id,patch:{is_active:v}})}/></div></div>
    </div>)}</div>}</CardContent>
  </Card>;
}