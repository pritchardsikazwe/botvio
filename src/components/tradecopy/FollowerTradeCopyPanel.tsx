import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, OctagonX, Pause, Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ORDER_FILTER_LABELS, RISK_TYPE_LABELS, SCALPER_MODE_LABELS, TcAccount, TcRelationship,
  useExecutionEvents, useMyRelationships, useSymbolMappings, useTradeCopyAccounts, useTradeCopyAction, useTradeCopyAudit,
} from "@/hooks/useTradeCopy";
import { ConnectMt5Dialog } from "./ConnectMt5Dialog";
import { DiagnosticButton } from "./DiagnosticButton";
import { AdapterModeNotice, EnvBadge, StatusBadge } from "./ModeBadges";

const ROBOT = "__botvio_robot__";

function LinkProvider({ accounts }: { accounts: TcAccount[] }) {
  const { user } = useAuth();
  const act = useTradeCopyAction();
  const [acct, setAcct] = useState(accounts[0]?.id ?? "");
  const [provider, setProvider] = useState(ROBOT);
  const [copyType, setCopyType] = useState("1");
  const providers = useQuery({
    queryKey: ["tradecopy", "providers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      // Show approved providers to everyone, and also show the signed-in user's
      // own provider record so a provider can test their connected MT5 master.
      const { data, error } = await supabase
        .from("providers")
        .select("id,display_name,user_id,status")
        .or(`status.eq.approved,user_id.eq.${user.id}`)
        .order("display_name");

      if (error) throw error;
      return data ?? [];
    },
  });
  useEffect(() => { if (!acct && accounts[0]) setAcct(accounts[0].id); }, [accounts, acct]);

  const link = async () => {
    try {
      await act.mutateAsync({ action: "link", payload: { follower_account_id: acct, copy_order_type: Number(copyType), ...(provider === ROBOT ? { botvio_robot: true } : { provider_id: provider }) } });
      toast.success("Linked. Copying stays paused until you press Start Copying.");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/50 p-4">
      <div>
        <div className="text-sm font-semibold">Choose what this MT5 account copies</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Deriv connection and MT5 copy trading are separate. This screen controls the MT5 follower account only.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <div className="space-y-1.5"><Label>Follower account</Label>
        <Select value={acct} onValueChange={setAcct}><SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
          <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.label} ({a.environment})</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label>Copy from</Label>
        <Select value={provider} onValueChange={setProvider}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ROBOT}>Botvio Robot (official)</SelectItem>
            {providers.data?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.display_name}{p.user_id === user?.id ? " (My provider)" : ""}
              </SelectItem>
            ))}
          </SelectContent></Select></div>
      <div className="space-y-1.5"><Label>Orders to copy</Label>
        <Select value={copyType} onValueChange={setCopyType}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="1">New orders only</SelectItem><SelectItem value="0">Existing + new orders</SelectItem></SelectContent></Select></div>
      <Button onClick={link} disabled={!acct || act.isPending || providers.isError}>Link MT5 Copy Source</Button>
      {providers.isError && (
        <p className="text-xs text-destructive sm:col-span-2 lg:col-span-4">
          Provider list could not be loaded. Refresh and try again.
        </p>
      )}
      </div>
    </div>
  );
}

function SymbolMappings({ followerAccountId }: { followerAccountId: string }) {
  const { data } = useSymbolMappings(followerAccountId);
  const act = useTradeCopyAction();
  const [src, setSrc] = useState(""); const [dst, setDst] = useState(""); const [type, setType] = useState("Special");
  const [discovered, setDiscovered] = useState<unknown>(null);
  const add = async () => {
    try { await act.mutateAsync({ action: "map_symbol", payload: { follower_account_id: followerAccountId, source_symbol: src, follow_symbol: dst, map_type: type } }); setSrc(""); setDst(""); toast.success("Mapping saved"); }
    catch (e) { toast.error((e as Error).message); }
  };
  const discover = async () => {
    try { const r = await act.mutateAsync({ action: "discover_symbols", payload: { account_id: followerAccountId } }); setDiscovered(r); }
    catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label>Symbol mapping</Label><Button size="sm" variant="ghost" onClick={discover}>Detect suffix / special symbols</Button></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
        <Input placeholder="Provider symbol (XAUUSD)" value={src} onChange={(e) => setSrc(e.target.value)} />
        <Input placeholder="Your symbol (GOLD)" value={dst} onChange={(e) => setDst(e.target.value)} />
        <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Special">Special</SelectItem><SelectItem value="Suffix">Suffix</SelectItem></SelectContent></Select>
        <Button onClick={add} disabled={!src || !dst || act.isPending}>Add</Button>
      </div>
      {data?.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
          <span><b>{m.source_symbol}</b> → <b>{m.follow_symbol}</b> <span className="text-muted-foreground">({m.map_type}{m.synced_at ? "" : ", not synced"})</span></span>
          <Button size="icon" variant="ghost" aria-label="Delete mapping" onClick={() => act.mutate({ action: "delete_mapping", payload: { mapping_id: m.id } })}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      {discovered !== null && <pre className="max-h-40 overflow-auto rounded-lg bg-muted/40 p-2 text-[11px]">{JSON.stringify(discovered, null, 2)}</pre>}
    </div>
  );
}

function RelationshipCard({ rel, account }: { rel: TcRelationship; account?: TcAccount }) {
  const act = useTradeCopyAction();
  const s = rel.copy_settings;
  const [form, setForm] = useState({ risk_type: s?.risk_type ?? 1, multiplier: s?.multiplier ?? 1, copy_sltp: s?.copy_sltp ?? true, order_filter: s?.order_filter ?? 0, scalper_mode: s?.scalper_mode ?? 0, scalper_value: s?.scalper_value ?? 0, lossForAllOrder: s?.order_control?.lossForAllOrder ?? "", equityUnderLow: s?.order_control?.equityUnderLow ?? "" });
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      await act.mutateAsync({ action: "update_settings", payload: { relationship_id: rel.id, risk_type: form.risk_type, multiplier: form.multiplier, copy_sltp: form.copy_sltp, order_filter: form.order_filter, scalper_mode: form.scalper_mode, scalper_value: form.scalper_value, order_control: { lossForAllOrder: form.lossForAllOrder, equityUnderLow: form.equityUnderLow } } });
      toast.success("Copy settings saved");
    } catch (e) { toast.error((e as Error).message); }
  };

  const setStatus = async (status: "active" | "paused" | "stopped") => {
    const payload: Record<string, unknown> = { relationship_id: rel.id, status, reset_emergency: status === "active" && !!rel.emergency_stopped_at };
    if (status === "active" && rel.environment === "LIVE") {
      const typed = window.prompt('This copies REAL trades with real money. Type "START LIVE COPYING" to confirm.');
      if (typed !== "START LIVE COPYING") return;
      payload.confirm_live = true; payload.confirm_text = typed;
    }
    if (status === "stopped" && !window.confirm("Stop copying and unlink from this provider?")) return;
    try { await act.mutateAsync({ action: "set_relationship_status", payload }); toast.success(`Copying ${status}`); }
    catch (e) { toast.error((e as Error).message); }
  };

  const emergency = async () => {
    const closeAll = window.confirm("EMERGENCY STOP: pause copying now.\n\nPress OK to ALSO close all open positions on this follower account, or Cancel to only pause.");
    try { await act.mutateAsync({ action: "emergency_stop", payload: { relationship_id: rel.id, close_all: closeAll } }); toast.success(closeAll ? "Stopped and closed all positions" : "Copying stopped"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="font-semibold">{rel.is_botvio_robot ? "Botvio Robot" : "Provider"} → {account?.label ?? "Follower"}</div>
          <div className="text-xs text-muted-foreground">{rel.copy_order_type === 0 ? "Existing + new orders" : "New orders only"}</div></div>
        <div className="flex gap-1.5"><EnvBadge env={rel.environment} /><StatusBadge status={rel.status} /></div>
      </div>
      {rel.emergency_stopped_at && <p className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive"><AlertTriangle className="h-4 w-4" />Emergency stop active since {new Date(rel.emergency_stopped_at).toLocaleString()}. Start Copying resets it.</p>}
      {rel.last_error && <p className="text-xs text-destructive">{rel.last_error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5"><Label>Risk mode</Label>
          <Select value={String(form.risk_type)} onValueChange={(v) => set("risk_type", Number(v))}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(RISK_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>{form.risk_type === 2 ? "Fixed lot size" : "Multiplier"}</Label>
          <Input type="number" step="0.01" min="0.01" value={form.multiplier} onChange={(e) => set("multiplier", Number(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>Order filter</Label>
          <Select value={String(form.order_filter)} onValueChange={(v) => set("order_filter", Number(v))}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(ORDER_FILTER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Scalper mode</Label>
          <Select value={String(form.scalper_mode)} onValueChange={(v) => set("scalper_mode", Number(v))}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SCALPER_MODE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        {form.scalper_mode === 2 && <div className="space-y-1.5"><Label>Scalper rollover value</Label><Input type="number" min="0" step="1" value={form.scalper_value} onChange={(e) => set("scalper_value", Number(e.target.value))} /></div>}
        <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"><Label htmlFor={`sltp-${rel.id}`}>Copy SL/TP</Label><Switch id={`sltp-${rel.id}`} checked={form.copy_sltp} onCheckedChange={(v) => set("copy_sltp", v)} /></div>
        <div className="space-y-1.5"><Label>Close all at total loss</Label><Input type="number" min="0" step="1" placeholder="Off" value={form.lossForAllOrder} onChange={(e) => set("lossForAllOrder", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Close all if equity below</Label><Input type="number" min="0" step="1" placeholder="Off" value={form.equityUnderLow} onChange={(e) => set("equityUnderLow", e.target.value)} /></div>
      </div>
      <Button variant="outline" onClick={save} disabled={act.isPending}>Save settings</Button>

      <SymbolMappings followerAccountId={rel.follower_account_id} />

      <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
        <Button onClick={() => setStatus("active")} disabled={act.isPending || rel.status === "active"}><Play className="mr-2 h-4 w-4" />Start Copying</Button>
        <Button variant="outline" onClick={() => setStatus("paused")} disabled={act.isPending || rel.status !== "active"}><Pause className="mr-2 h-4 w-4" />Pause</Button>
        <Button variant="outline" onClick={() => setStatus("stopped")} disabled={act.isPending}><Square className="mr-2 h-4 w-4" />Stop</Button>
        <Button variant="destructive" onClick={emergency} disabled={act.isPending}><OctagonX className="mr-2 h-4 w-4" />Emergency stop</Button>
        {account && <DiagnosticButton accountId={account.id} disabled={!account.tradecopy_user_id} />}
      </div>
    </div>
  );
}

/** Follower-side TradeCopy panel: connect, link, settings, controls and history. */
export function FollowerTradeCopyPanel() {
  const { user } = useAuth();
  const accounts = useTradeCopyAccounts("slave");
  const rels = useMyRelationships();
  const events = useExecutionEvents();
  const errors = useTradeCopyAudit();

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-sm">MT5 copy trading (TradeCopy cloud)</CardTitle>
        {user && <ConnectMt5Dialog role="slave" triggerLabel="Connect MT5 Follower" />}
      </CardHeader>
      <CardContent className="space-y-4">
        <AdapterModeNotice />
        {!user && <p className="text-sm text-muted-foreground">Sign in to connect your MT5 account and copy a provider.</p>}
        {(accounts.isLoading || rels.isLoading) && <Skeleton className="h-24 w-full" />}
        {accounts.data?.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
            <span className="font-medium">{a.label} · {a.login_id} · {a.server}</span>
            <span className="flex gap-1.5"><EnvBadge env={a.environment} /><StatusBadge status={a.connection_status} /></span>
          </div>
        ))}
        {accounts.data && accounts.data.length > 0 && <LinkProvider accounts={accounts.data} />}
        {accounts.data?.length === 0 && user && <p className="text-sm text-muted-foreground">Connect an MT5 account to start. No Bridge EA or VPS required.</p>}
        {rels.data?.map((r) => <RelationshipCard key={r.id} rel={r} account={accounts.data?.find((a) => a.id === r.follower_account_id)} />)}

        {user && (
          <div className="space-y-2">
            <Label>Copy history</Label>
            {events.data?.length === 0 && <p className="text-xs text-muted-foreground">No copied trades yet.</p>}
            <div className="space-y-1.5">
              {events.data?.map((e) => (
                <div key={e.id} className="grid grid-cols-2 gap-1 rounded-lg border border-border/50 p-2 text-xs sm:grid-cols-6">
                  <span className="font-semibold">{e.symbol} {e.side}</span>
                  <span>Lot {e.follower_lot ?? "—"}</span>
                  <span>Entry {e.entry_price ?? "—"}</span>
                  <span>SL {e.stop_loss ?? "—"} / TP {e.take_profit ?? "—"}</span>
                  <span className="capitalize">{e.status}{e.error ? ` · ${e.error}` : ""}</span>
                  <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
            {errors.data && errors.data.length > 0 && (
              <>
                <Label>Recent execution errors</Label>
                {errors.data.map((x) => <div key={x.id} className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{x.action}: {String((x.details as { error?: string })?.error ?? "failed")} · {new Date(x.created_at).toLocaleString()}</div>)}
              </>
            )}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Copy trading carries real risk of loss. Past provider results do not guarantee future results.</p>
      </CardContent>
    </Card>
  );
}
