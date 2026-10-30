import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MIN_PAYOUT_USD } from "@/lib/referEarn";

const usd = (n: unknown) => `$${Number(n || 0).toFixed(2)}`;

export function AdminAffiliateWalletsCard() {
  const q = useQuery({ queryKey: ["admin-affiliate-wallets"], queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_list_affiliate_wallets"); if (error) throw error; return data || [];
  }});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<Record<string, "mobile_money" | "crypto">>({});

  const settle = async (userId: string, fallback: string | null) => {
    const channel = channels[userId] || (fallback as any) || "mobile_money";
    const { data, error } = await supabase.rpc("admin_settle_affiliate_wallet", { p_user_id: userId, p_channel: channel, p_reference: refs[userId] || "" });
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${usd((data as any)?.amount)} as paid. Wallet cleared.`);
    q.refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate wallets</CardTitle>
        <CardDescription>Send the money by crypto or mobile money, then enter the transaction reference to clear the wallet. Minimum ${MIN_PAYOUT_USD}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isError && <p className="text-sm text-destructive">Data unavailable</p>}
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">No affiliates with referrals yet.</p>}
        {q.data?.map((a: any) => {
          const ch = channels[a.user_id] || a.pending_channel || "mobile_money";
          return (
            <div key={a.user_id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{a.display_name || a.email} <span className="font-mono text-xs text-muted-foreground">{a.affiliate_code}</span></p>
                  <p className="text-xs text-muted-foreground">{a.email} · WhatsApp {a.whatsapp_number || "Missing"}</p>
                  <p className="text-xs text-muted-foreground">{a.referred} referred · {a.paying} paying · lifetime {usd(a.lifetime)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{usd(a.balance)}</p>
                  {a.pending_request_id && <Badge>Requested</Badge>}
                </div>
              </div>
              {a.pending_destination && <p className="mt-1 text-xs">Send to ({a.pending_channel === "crypto" ? "crypto" : "mobile money"}): <span className="font-mono">{a.pending_destination}</span></p>}
              {Number(a.balance) >= MIN_PAYOUT_USD && (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <div className="flex gap-1">
                    <Button size="sm" variant={ch === "mobile_money" ? "default" : "outline"} onClick={() => setChannels({ ...channels, [a.user_id]: "mobile_money" })}>Mobile money</Button>
                    <Button size="sm" variant={ch === "crypto" ? "default" : "outline"} onClick={() => setChannels({ ...channels, [a.user_id]: "crypto" })}>Crypto</Button>
                  </div>
                  <Input placeholder="Transaction reference" value={refs[a.user_id] || ""} onChange={(e) => setRefs({ ...refs, [a.user_id]: e.target.value })} />
                  <Button size="sm" onClick={() => settle(a.user_id, a.pending_channel)} disabled={(refs[a.user_id] || "").trim().length < 3}>Mark paid</Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
