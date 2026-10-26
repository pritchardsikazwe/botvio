import { useEffect, useState } from "react";
import { Crown, ExternalLink, Loader2, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { brokerReviews } from "@/data/brokerReviews";

const BROKERS = [
  { id: "exness" as const, name: "Exness", url: brokerReviews.exness?.affiliateUrl || "https://one.exness-track.com/a/ts1kvs1k" },
  { id: "deriv" as const, name: "Deriv", url: brokerReviews.deriv?.affiliateUrl || "https://t.deriv.link?t=Y8BMQZGW5HAE" },
];

type Claim = { id: string; broker: string; broker_account_id: string; status: string; admin_note: string | null; created_at: string };

export function BrokerVipOffer({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [broker, setBroker] = useState<"exness" | "deriv">("exness");
  const [accountId, setAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [claim, setClaim] = useState<Claim | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("broker_vip_claims").select("id,broker,broker_account_id,status,admin_note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
    setClaim((data?.[0] as Claim) ?? null);
  };
  useEffect(() => { load(); }, [user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = accountId.trim();
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(id)) { toast({ title: "Check your account ID", description: "Use the account number shown in your broker dashboard.", variant: "destructive" }); return; }
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { toast({ title: "Add a screenshot", description: "Upload an image (max 5 MB) showing your account.", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("broker-vip-proofs").upload(path, file);
      if (up.error) throw up.error;
      const { error } = await supabase.from("broker_vip_claims").insert({ user_id: user.id, broker, broker_account_id: id, screenshot_path: path });
      if (error) throw error;
      toast({ title: "Claim sent", description: "We'll check your account and switch on VIP once approved." });
      setAccountId(""); setFile(null); load();
    } catch (err: any) {
      toast({ title: "Could not send claim", description: err?.message?.includes("one_open") ? "You already have a claim in progress." : err?.message || "Try again", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const open = claim && (claim.status === "pending" || claim.status === "approved");

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />Get VIP free — open an Exness or Deriv account</CardTitle>
        <CardDescription>Open a new account using our partner link, then send your account ID and a screenshot. Once we confirm it, VIP stays on for as long as your account stays active.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <li><strong className="text-foreground">1.</strong> Open an account with a link below</li>
          <li><strong className="text-foreground">2.</strong> Send your account ID + screenshot</li>
          <li><strong className="text-foreground">3.</strong> We approve and VIP switches on</li>
        </ol>
        <div className="grid gap-3 sm:grid-cols-2">
          {BROKERS.map((b) => (
            <Button key={b.id} asChild variant="gold" className="w-full">
              <a href={b.url} target="_blank" rel="noopener noreferrer sponsored">Open {b.name} account <ExternalLink className="ml-2 h-4 w-4" /></a>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Accounts opened without our link can't be verified. Trading carries risk; VIP gives access to tools and signals, not guaranteed results.</p>

        {!user ? (
          !compact && <p className="text-sm">After creating your Botvio account and signing in, come back here to send your proof.</p>
        ) : open ? (
          <div className="flex items-center gap-3 rounded-lg border bg-background p-4 text-sm">
            {claim!.status === "approved" ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
            <div className="flex-1"><div className="font-medium capitalize">{claim!.broker} · {claim!.broker_account_id}</div><div className="text-muted-foreground">{claim!.status === "approved" ? "VIP is active on your account." : "Waiting for review — usually within 24 hours."}</div></div>
            <Badge variant={claim!.status === "approved" ? "default" : "secondary"}>{claim!.status === "approved" ? "Approved" : "Pending"}</Badge>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-lg border bg-background p-4">
            {claim && <div className="flex items-center gap-2 text-sm text-destructive"><XCircle className="h-4 w-4" />Last claim {claim.status}{claim.admin_note ? `: ${claim.admin_note}` : ""}. You can send a new one.</div>}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Broker</Label><div className="flex gap-2">{BROKERS.map((b) => <Button key={b.id} type="button" size="sm" variant={broker === b.id ? "default" : "outline"} onClick={() => setBroker(b.id)}>{b.name}</Button>)}</div></div>
              <div className="space-y-2"><Label htmlFor="vip-acc">Account ID</Label><Input id="vip-acc" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g. 12345678" maxLength={64} /></div>
              <div className="space-y-2"><Label htmlFor="vip-shot">Screenshot</Label><Input id="vip-shot" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            </div>
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Send for approval</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
