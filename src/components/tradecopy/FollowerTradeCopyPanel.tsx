import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, OctagonX, Pause, Play, Square, Trash2, Radio, Database, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ORDER_FILTER_LABELS, RISK_TYPE_LABELS, SCALPER_MODE_LABELS, BOTVIO_FOLLOWER_MARKETS, TcAccount, TcRelationship,
  useExecutionEvents, useMyRelationships, useSymbolMappings, useTradeCopyAccounts, useTradeCopyAction, useTradeCopyAudit, useRemoveTradeCopyAccount,
  useFollowerSignalPreferences, useSaveFollowerSignalPreferences,
} from "@/hooks/useTradeCopy";
import { ConnectMt5Dialog } from "./ConnectMt5Dialog";
import { DiagnosticButton } from "./DiagnosticButton";
import { AdapterModeNotice, EnvBadge, StatusBadge } from "./ModeBadges";

const ROBOT = "__botvio_robot__";

/** Live open positions from the authenticated TradeCopy API; refreshes every 10 seconds. */
function AccountOpenTrades({ account }: { account: TcAccount }) {
  const query = useQuery({
    queryKey: ["tradecopy", "user-open-trades", account.id],
    enabled: !!account.tradecopy_user_id,
    queryFn: async () => {
      const { tradecopy } = await import("@/hooks/useTradeCopy");
      return tradecopy<{ orders: Record<string, unknown>[] }>("open_orders", { account_id: account.id });
    },
    refetchInterval: (q) => q.state.error ? false : 10_000,
    staleTime: 5_000,
    retry: false,
  });
  const orders = query.data?.orders ?? [];
  const price = (value: unknown) => value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(2);
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">{account.label || account.broker || "MT5 account"}</div>
        <span className="text-xs text-muted-foreground">{query.isLoading ? "Loading live positions…" : query.isError ? "Could not load positions" : orders.length + " open trade" + (orders.length === 1 ? "" : "s")}</span>
      </div>
      {query.isError ? (
        <div className="text-xs text-destructive">Open trades are temporarily unavailable. <Button size="sm" variant="outline" onClick={() => query.refetch()}>Retry</Button></div>
      ) : orders.length === 0 && !query.isLoading ? (
        <p className="py-3 text-center text-xs text-muted-foreground">No open trades reported for this account.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order, index) => {
            const side = String(order.side ?? order.type ?? order.action ?? "—").toUpperCase();
            const pnl = order.profit ?? order.pnl ?? order.profit_loss;
            return (
              <div key={String(order.ticket ?? order.order_id ?? order.id ?? index)} className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-4">
                <div><span className="text-muted-foreground">Symbol</span><p className="font-semibold">{String(order.symbol ?? order.symbol_name ?? "—")}</p></div>
                <div><span className="text-muted-foreground">Side / lot</span><p className="font-semibold">{side} · {String(order.lots ?? order.volume ?? order.lot ?? "—")}</p></div>
                <div><span className="text-muted-foreground">Entry / current</span><p className="font-semibold">{price(order.openPrice ?? order.open_price ?? order.price_open ?? order.entry_price)} / {price(order.currentPrice ?? order.current_price ?? order.price_current)}</p></div>
                <div><span className="text-muted-foreground">Floating P/L</span><p className={"font-semibold " + (pnl == null ? "text-muted-foreground" : Number(pnl) >= 0 ? "text-success" : "text-destructive")}>{price(pnl)}</p></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        <div className="text-sm font-semibold">Advanced API copier (fallback)</div>
        <p className="mt-1 text-xs text-muted-foreground">
          This is the managed Botvio API path. Prefer the TradeCopy Cloud Signal Provider workflow above; use this only when an API-managed relationship is specifically required.
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
      <Button onClick={link} disabled={!acct || act.isPending || providers.isError}>Link via Botvio API</Button>
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


function FollowerSignalPreferences({ followerAccountId }: { followerAccountId: string }) {
  const preferences = useFollowerSignalPreferences(followerAccountId);
  const save = useSaveFollowerSignalPreferences();
  const current = preferences.data;
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!current) return;
    setMode(current.mode);
    setSelected(current.allowed_symbols ?? []);
  }, [current?.mode, JSON.stringify(current?.allowed_symbols ?? [])]);

  const toggle = (symbol: string, checked: boolean) => {
    setSelected((items) => checked ? [...new Set([...items, symbol])] : items.filter((item) => item !== symbol));
  };

  const submit = async () => {
    try {
      await save.mutateAsync({ tradingAccountId: followerAccountId, mode, allowedSymbols: selected });
      toast.success("Signal preferences saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/50 p-4">
      <div>
        <div className="font-semibold">Signals I want to copy</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Choose the markets this follower is allowed to receive from Botvio. “All markets” keeps the default.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("all")}
          className={`rounded-lg border p-3 text-left transition ${mode === "all" ? "border-primary bg-primary/5" : "border-border/50"}`}
        >
          <div className="text-sm font-semibold">All Botvio signals</div>
          <div className="text-xs text-muted-foreground">Receive every supported market.</div>
        </button>
        <button
          type="button"
          onClick={() => setMode("selected")}
          className={`rounded-lg border p-3 text-left transition ${mode === "selected" ? "border-primary bg-primary/5" : "border-border/50"}`}
        >
          <div className="text-sm font-semibold">Selected markets</div>
          <div className="text-xs text-muted-foreground">Only the markets switched ON below.</div>
        </button>
      </div>

      {mode === "selected" && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BOTVIO_FOLLOWER_MARKETS.map((market) => (
            <div key={market.symbol} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
              <div>
                <div className="text-xs font-semibold">{market.label}</div>
                <div className="text-[10px] text-muted-foreground">{market.group}</div>
              </div>
              <Switch
                checked={selected.includes(market.symbol)}
                onCheckedChange={(checked) => toggle(market.symbol, checked)}
                aria-label={`Copy ${market.label}`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
        <p className="text-[10px] leading-4 text-muted-foreground">
          {mode === "all" ? "All supported Botvio markets are allowed." : `${selected.length} market${selected.length === 1 ? "" : "s"} selected.`}
        </p>
        <Button size="sm" onClick={submit} disabled={save.isPending || preferences.isLoading}>
          {save.isPending ? "Saving…" : "Save signal preferences"}
        </Button>
      </div>

      <p className="text-[10px] leading-4 text-muted-foreground">
        These preferences are enforced for Botvio-managed direct signal delivery. For a TradeCopy Cloud copy relationship,
        TradeCopy’s own disabled-symbol setting remains authoritative until a supported TradeCopy symbol-settings API is verified.
      </p>
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

      <details className="rounded-lg border border-border/50">
        <summary className="cursor-pointer p-3 text-sm font-semibold">Risk and safety settings <span className="font-normal text-muted-foreground">· lot size, SL/TP and loss limits</span></summary>
        <div className="space-y-3 border-t border-border/50 p-3">
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
      <Button variant="outline" onClick={save} disabled={act.isPending}>Save risk settings</Button>
        </div>
      </details>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <FollowerSignalPreferences followerAccountId={rel.follower_account_id} />
      </div>

      <details className="rounded-lg border border-border/50">
        <summary className="cursor-pointer p-3 text-sm font-semibold">Advanced symbol mapping <span className="font-normal text-muted-foreground">· only if your broker uses different symbol names</span></summary>
        <div className="border-t border-border/50 p-3">
          <SymbolMappings followerAccountId={rel.follower_account_id} />
        </div>
      </details>

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
  const removeAccount = useRemoveTradeCopyAccount();
  const actAttach = useTradeCopyAction();
  const rels = useMyRelationships();
  const events = useExecutionEvents();
  const errors = useTradeCopyAudit();

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-primary" />Botvio Robot</CardTitle>
        {user && <ConnectMt5Dialog role="slave" triggerLabel="Connect MT5 account" />}
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && <p className="text-sm text-muted-foreground">Sign in to connect your MT5 account and copy a provider.</p>}
        {(accounts.isLoading || rels.isLoading) && <Skeleton className="h-24 w-full" />}
        {accounts.data?.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
            <span className="flex min-w-0 items-center gap-2 font-medium"><span className="truncate">{a.label} · {a.login_id} · {a.server}</span>{a.broker?.toLowerCase() === "weltrade" && <span className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">MT5 DATA SOURCE</span>}</span>
            <span className="flex items-center gap-2">
              {a.broker?.toLowerCase() === "weltrade" && <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                disabled={actAttach.isPending}
                onClick={async () => {
                  try {
                    const result = await actAttach.mutateAsync({ action: "attach_market_feed", payload: { account_id: a.id } });
                    const count = Array.isArray((result as any)?.feed?.symbols) ? (result as any).feed.symbols.length : 0;
                    toast.success(`Weltrade DATA FEED active · ${count} symbols detected`);
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                <Database className="mr-1 h-3.5 w-3.5" /> ATTACH DATA FEED
              </Button>}
              <span className="flex gap-1.5"><EnvBadge env={a.environment} /><StatusBadge status={a.connection_status} /></span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-destructive hover:text-destructive"
                disabled={removeAccount.isPending || a.tradecopy_active}
                onClick={async () => {
                  if (!window.confirm(`Remove MT5 account ${a.label} (${a.login_id}) from Botvio? This removes its Botvio connection and TradeCopy registration; it does not close the broker account.`)) return;
                  try {
                    await removeAccount.mutateAsync(a.id);
                    toast.success("MT5 account removed from Botvio");
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                Remove
              </Button>
            </span>
          </div>
        ))}
        {accounts.data?.length === 0 && user && <p className="text-sm text-muted-foreground">Connect an MT5 account to start. A connected Weltrade follower can also be attached as the Botvio signal DATA FEED without enabling copy trading.</p>}

        {rels.data?.map((rel) => (
          <RelationshipCard
            key={rel.id}
            rel={rel}
            account={accounts.data?.find((account) => account.id === rel.follower_account_id)}
          />
        ))}

        {user && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Bot className="h-4 w-4 text-primary" />
                    Botvio Robot Activity
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Your copied robot trades are shown here. Trade execution is handled in the background; you do not need to manage the copier yourself.
                  </p>
                </div>
              </div>
            </div>

            {accounts.data?.[0]?.tradecopy_user_id ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
                <iframe
                  title="Botvio Robot trade activity"
                  src={`https://tradecopy.online/profile/order-history/slave/${accounts.data[0].tradecopy_user_id}/server_1`}
                  className="h-[520px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Connect your MT5 account to display Botvio Robot activity.
              </div>
            )}

            <div className="space-y-2">
              <Label>Recent Botvio execution events</Label>
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
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Botvio manages the robot connection for you. Trading carries real risk of loss, and copied execution can differ from the source trade.</p>
      </CardContent>
    </Card>
  );
}