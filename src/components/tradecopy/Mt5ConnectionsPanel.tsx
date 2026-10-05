import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Send, Users, Zap, AlertTriangle, PlugZap, CreditCard, CheckCircle2 } from "lucide-react";
import {
  DIRECT_LIVE_PHRASE, Mt5Account, useDirectExecutions, useDirectMutation, useDirectStatus, useMyMt5Accounts,
} from "@/hooks/useDirectExecution";

const ago = (t: string | null) => (t ? formatDistanceToNow(new Date(t), { addSuffix: true }) : "Never");

function AccountCard({ a }: { a: Mt5Account }) {
  const m = useDirectMutation();
  const { data: execs } = useDirectExecutions(a.direct_signal_enabled || a.last_direct_signal_at ? a.id : undefined, 5);
  const [liveOpen, setLiveOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [lot, setLot] = useState(String(a.direct_lot ?? 0.01));
  const isLive = a.environment === "LIVE";
  const entitlementExpired = !!a.direct_execution_expires_at && new Date(a.direct_execution_expires_at).getTime() <= Date.now();
  const paidActive = a.direct_execution_entitled && !entitlementExpired;
  const run = (action: string, payload: Record<string, unknown>, ok: string) =>
    m.mutate({ action, payload: { account_id: a.id, ...payload } }, {
      onSuccess: () => toast.success(ok), onError: (e: Error) => toast.error(e.message),
    });
  const startSendToMt5 = () => {
    if (!paidActive) {
      setSubscriptionOpen(true);
      return;
    }
    enable();
  };

  const enable = () => {
    const l = Number(lot);
    if (!(l >= 0.01 && l <= 5)) return toast.error("Lot size must be between 0.01 and 5");
    if (isLive) return setLiveOpen(true);
    run("enable", { lot: l }, "Direct Botvio Signals turned on");
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const map = Object.entries(a.direct_symbol_map ?? {});

  return (
    <Card className="glass-card border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{a.label || `MT5 ${a.login_id}`}</CardTitle>
            <CardDescription>{a.broker || "MT5"} · Login {a.login_id} · {a.server}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={isLive ? "destructive" : "secondary"}>{a.environment || "DEMO"}</Badge>
            <Badge variant="outline">{a.connection_status || "saved"}</Badge>
            <Badge className={a.direct_signal_enabled ? "bg-success/15 text-success border-success/30" : ""} variant={a.direct_signal_enabled ? "outline" : "secondary"}>
              Direct Signals {a.direct_signal_enabled ? "ON" : "OFF"}
            </Badge>
            <Badge variant={paidActive ? "outline" : "secondary"}>{paidActive ? `Paid MT5 · ${a.direct_execution_plan || "Active"}` : "MT5 Direct · Locked"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><Send className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Direct Botvio Signals</p></div>
            <Badge variant="outline" className="text-[10px]">No TradeCopy needed</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Botvio signals can be sent to this MT5 account only when an admin has assigned an active paid MT5 Direct Execution entitlement. Direct execution is separate from provider-copy slots.</p>
          {!paidActive && <p className="mt-2 rounded-lg border border-warning/30 bg-warning/5 p-2 text-xs text-muted-foreground">MT5 Direct Execution is a paid feature. Choose the MT5 Direct subscription below. After payment is verified, this account can receive Botvio signals.</p>}
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div><span className="text-muted-foreground">Last signal:</span> {ago(a.last_direct_signal_at)}</div>
            <div><span className="text-muted-foreground">Last execution:</span> {ago(a.last_direct_execution_at)}</div>
            <div><span className="text-muted-foreground">Status:</span> {a.direct_signal_status}</div>
          </div>
          {a.last_direct_error && <p className="mt-2 flex items-start gap-1 text-xs text-destructive"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{a.last_direct_error}</p>}
          {map.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Symbol mapping: {map.map(([k, v]) => `${k}→${v}`).join(", ")}</p>}
          <div className="mt-3 flex flex-wrap items-end gap-2">
            {!a.direct_signal_enabled && (
              <div className="w-28"><Label htmlFor={`lot-${a.id}`} className="text-xs">Lot size</Label><Input id={`lot-${a.id}`} className="h-11" inputMode="decimal" value={lot} onChange={(e) => setLot(e.target.value)} /></div>
            )}
            {a.direct_signal_enabled
              ? <Button variant="outline" className="min-h-11" disabled={m.isPending} onClick={() => run("disable", {}, "Direct Botvio Signals turned off")}>Turn off Direct Signals</Button>
              : <Button className="min-h-11" disabled={m.isPending} onClick={startSendToMt5}><Zap className="mr-2 h-4 w-4" />SEND BOTVIO SIGNALS</Button>}
            <Button variant="ghost" className="min-h-11" disabled={m.isPending} onClick={() => run("test_connection", {}, "MT5 connection works")}><PlugZap className="mr-2 h-4 w-4" />Test connection</Button>
          </div>
          {!!execs?.length && (
            <ul className="mt-3 space-y-1 text-xs">
              {execs.map((e: any) => (
                <li key={e.id} className="flex flex-wrap justify-between gap-2 rounded-md bg-background/60 px-2 py-1">
                  <span>{e.direction} {e.mt5_symbol} · {e.volume} lot</span>
                  <span className="text-muted-foreground">{e.status}{e.mode === "simulated" ? " (test)" : ""} · {ago(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" className="min-h-11" onClick={() => scrollTo("follower-mt5")}><Users className="mr-2 h-4 w-4" />COPY A PROVIDER</Button>
          <Button variant="outline" className="min-h-11" onClick={() => scrollTo("follower-mt5")}><Bot className="mr-2 h-4 w-4" />COPY BOTVIO ROBOT</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Copying a provider or Botvio Robot uses TradeCopy and is only set up when you pick a copy source below.</p>
      </CardContent>

      <Dialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock MT5 Direct Signals</DialogTitle>
            <DialogDescription>Send Botvio signals directly to this connected MT5 account. This is a separate paid product from TradeCopy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-3"><CreditCard className="h-5 w-5 text-primary" /><div><p className="font-semibold">MT5 Direct Execution</p><p className="text-xs text-muted-foreground">Subscription → payment → verification → activation</p></div></div>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Choose the MT5 Direct plan</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Complete payment and submit confirmation</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Botvio verifies the subscription</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Return here and press Send to MT5</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscriptionOpen(false)}>Not now</Button>
            <Button onClick={() => { window.location.href = "/marketplace?product=mt5-direct&account_id=" + encodeURIComponent(a.id); }}>VIEW MT5 DIRECT PLANS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={liveOpen} onOpenChange={setLiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn on Direct Signals for a LIVE account</DialogTitle>
            <DialogDescription>Real orders with real money will be placed on login {a.login_id}. Leveraged trading can lose more than you expect. Type <b>{DIRECT_LIVE_PHRASE}</b> to confirm.</DialogDescription>
          </DialogHeader>
          <Input className="h-11" value={phrase} onChange={(e) => setPhrase(e.target.value)} aria-label="Confirmation phrase" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiveOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={phrase !== DIRECT_LIVE_PHRASE || m.isPending}
              onClick={() => { run("enable", { lot: Number(lot), confirm_text: phrase }, "LIVE Direct Signals turned on"); setLiveOpen(false); setPhrase(""); }}>
              Confirm LIVE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function Mt5ConnectionsPanel() {
  const { data, isLoading, error } = useMyMt5Accounts();
  const { data: status } = useDirectStatus();
  const accounts = (data ?? []).filter((a) => !a.is_botvio_robot && a.account_role !== "master");
  return (
    <div className="space-y-3">
      {status?.mode === "simulated" && (
        <p className="rounded-lg border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">Direct Signals are in test mode: each signal is recorded for your account but no order is sent to MT5 yet.</p>
      )}
      {isLoading ? <Skeleton className="h-48 w-full" /> : error ? (
        <p className="text-sm text-destructive">MT5 accounts could not be loaded.</p>
      ) : accounts.length === 0 ? (
        <Card className="glass-card"><CardContent className="p-5 text-sm text-muted-foreground">No MT5 account connected yet. Connect one in the MT5 section below. Paid Direct MT5 execution is enabled only for accounts selected by an admin.</CardContent></Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">{accounts.map((a) => <AccountCard key={a.id} a={a} />)}</div>
      )}
    </div>
  );
}
