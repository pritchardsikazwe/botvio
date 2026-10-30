import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, Share2, Wallet, Users } from "lucide-react";
import { toast } from "sonner";
import { MIN_PAYOUT_USD, REFERRAL_BONUS_USD, REFERRAL_BONUS_EVERY, referralLink, referralsToNextBonus, canRequestPayout } from "@/lib/referEarn";

type WalletData = { balance: number; lifetime: number; commissions: number; bonuses: number; pending_payout: number; paid_out: number; referred: number; paying: number; clicks: number };
const usd = (n: number | undefined) => `$${Number(n || 0).toFixed(2)}`;

export function ReferEarnCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [channel, setChannel] = useState<"mobile_money" | "crypto">("mobile_money");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);

  const code = useQuery({ queryKey: ["my-affiliate-code", user?.id], enabled: !!user, staleTime: Infinity, queryFn: async () => {
    const { data, error } = await supabase.rpc("ensure_my_affiliate"); if (error) throw error; return data as string;
  }});
  const wallet = useQuery({ queryKey: ["my-affiliate-wallet", user?.id], enabled: !!code.data, queryFn: async () => {
    const { data, error } = await supabase.rpc("get_my_affiliate_wallet"); if (error) throw error; return data as unknown as WalletData;
  }});
  const refs = useQuery({ queryKey: ["my-referrals", user?.id], enabled: !!code.data, queryFn: async () => {
    const { data, error } = await supabase.rpc("get_my_referrals"); if (error) throw error; return data || [];
  }});

  if (!user) return null;
  const link = code.data ? referralLink(code.data) : "";
  const w = wallet.data;
  const shareText = `Join me on Botvio for AI trading signals and chart analysis: ${link}`;

  const copy = async () => { await navigator.clipboard.writeText(link); toast.success("Referral link copied"); };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: "Botvio", text: shareText, url: link }); } catch { /* cancelled */ } }
    else window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  };
  const requestPayout = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("request_affiliate_payout", { p_channel: channel, p_destination: destination });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payout requested. Admin will send it and clear your wallet.");
    setDestination("");
    qc.invalidateQueries({ queryKey: ["my-affiliate-wallet"] });
  };

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Gift className="h-5 w-5 text-primary" /> Refer & Earn</CardTitle>
        <CardDescription>Earn 15% of every subscription your referrals pay, including every renewal. Get a ${REFERRAL_BONUS_USD} bonus for every {REFERRAL_BONUS_EVERY} paying referrals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Your referral ID: <span className="font-mono font-semibold text-foreground">{code.data || "…"}</span></p>
          <div className="flex gap-2">
            <Input readOnly value={code.isError ? "Couldn't load your link" : link} className="font-mono text-xs" />
            <Button size="icon" variant="outline" onClick={copy} disabled={!link} aria-label="Copy link"><Copy className="h-4 w-4" /></Button>
            <Button size="icon" onClick={share} disabled={!link} aria-label="Share link"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Wallet", value: usd(w?.balance), icon: Wallet },
            { label: "Lifetime earned", value: usd(w?.lifetime), icon: Gift },
            { label: "Referred", value: String(w?.referred ?? 0), icon: Users },
            { label: "Paying", value: String(w?.paying ?? 0), icon: Users },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><s.icon className="h-3 w-3" />{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Commissions {usd(w?.commissions)} · Bonuses {usd(w?.bonuses)} · Paid out {usd(w?.paid_out)} · {referralsToNextBonus(w?.paying ?? 0)} more paying referrals to your next ${REFERRAL_BONUS_USD} bonus
        </p>

        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold">Withdraw (minimum ${MIN_PAYOUT_USD})</p>
          {Number(w?.pending_payout) > 0 ? (
            <p className="text-sm text-muted-foreground">Payout of {usd(w?.pending_payout)} is waiting for admin to send.</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex gap-1">
                <Button size="sm" variant={channel === "mobile_money" ? "default" : "outline"} onClick={() => setChannel("mobile_money")}>Mobile money</Button>
                <Button size="sm" variant={channel === "crypto" ? "default" : "outline"} onClick={() => setChannel("crypto")}>Crypto</Button>
              </div>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={channel === "crypto" ? "USDT address and network" : "Network and number"} />
              <Button size="sm" onClick={requestPayout} disabled={busy || !canRequestPayout(Number(w?.balance || 0)) || destination.trim().length < 5}>Request {usd(w?.balance)}</Button>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Your referrals</p>
          {refs.data && refs.data.length > 0 ? (
            <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {refs.data.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.masked_email} · {new Date(r.joined_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={r.status === "paying" ? "default" : "secondary"}>{r.status === "paying" ? "Subscribed" : "Signed up"}</Badge>
                    <p className="text-xs text-muted-foreground">{usd(r.earned_usd)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No referrals yet. Share your link to start earning.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
