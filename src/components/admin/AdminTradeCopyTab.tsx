import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Server, Power, ShieldAlert, RefreshCw, Eye, Activity, Send, Bot, Users, Radio, AlertTriangle, Crown } from "lucide-react";
import { tradecopy, useRemoveTradeCopyAccount } from "@/hooks/useTradeCopy";
import { ConnectMt5Dialog } from "@/components/tradecopy/ConnectMt5Dialog";
import { deriveRoles, directAction, isMt5, Mt5Account, Mt5Role, MT5_COLS, usesTradeCopySlot } from "@/hooks/useDirectExecution";

type Row = Mt5Account & {
  roles: Mt5Role[];
  owner: string;
  provider?: { id: string; status: string | null } | null;
  followers: number;
};
interface Rel { id: string; status: string; master_account_id: string | null; follower_account_id: string | null; environment: string | null; emergency_stopped_at: string | null; is_botvio_robot: boolean | null }

const ROLE_STYLE: Record<Mt5Role, string> = {
  "DATA FEED": "border-sky-500/30 text-sky-500",
  "DIRECT EXECUTION": "border-success/30 text-success",
  "PROVIDER MASTER": "border-primary/30 text-primary",
  "BOTVIO ROBOT MASTER": "border-warning/40 text-warning",
  "BOTVIO SIGNAL MASTER": "border-emerald-500/30 text-emerald-500",
  FOLLOWER: "border-muted-foreground/30 text-muted-foreground",
};
const mask = (login: string | null) => (login ? (login.length > 4 ? `••••${login.slice(-4)}` : login) : "—");
const ago = (t: string | null | undefined) => (t ? formatDistanceToNow(new Date(t), { addSuffix: true }) : "—");

export const AdminTradeCopyTab = () => {
  const qc = useQueryClient();
  const [role, setRole] = useState("all");
  const [env, setEnv] = useState("all");
  const [status, setStatus] = useState("all");
  const [broker, setBroker] = useState("all");
  const [owner, setOwner] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const removeAccount = useRemoveTradeCopyAccount();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-mt5-center"],
    queryFn: async () => {
      const [acc, rels, feeds, provs] = await Promise.all([
        supabase.from("trading_accounts").select(MT5_COLS).order("created_at", { ascending: false }),
        supabase.from("copy_relationships").select("id,status,master_account_id,follower_account_id,environment,emergency_stopped_at,is_botvio_robot"),
        supabase.from("broker_market_feeds").select("trading_account_id"),
        supabase.from("providers").select("id,user_id,status"),
      ]);
      if (acc.error) throw acc.error;
      const accounts = ((acc.data ?? []) as unknown as Mt5Account[]).filter(isMt5);
      const relations = (rels.data ?? []) as Rel[];
      const feedIds = new Set((feeds.data ?? []).map((f) => f.trading_account_id).filter(Boolean) as string[]);
      const followerIds = new Set(relations.map((r) => r.follower_account_id).filter(Boolean) as string[]);
      const userIds = [...new Set(accounts.map((a) => a.user_id))];
      const { data: profiles } = userIds.length ? await supabase.from("profiles").select("user_id,email,display_name").in("user_id", userIds) : { data: [] };
      const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || p.email || ""]));
      const provByUser = new Map((provs.data ?? []).map((p) => [p.user_id, { id: p.id, status: p.status }]));
      const rows: Row[] = accounts.map((a) => ({
        ...a,
        roles: deriveRoles(a, { feedIds, followerIds }),
        owner: byUser.get(a.user_id) || a.user_id.slice(0, 8) + "…",
        provider: a.account_role === "master" && !a.is_botvio_robot ? provByUser.get(a.user_id) ?? null : null,
        followers: relations.filter((r) => r.master_account_id === a.id && r.status === "active").length,
      }));
      return { rows, relations };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-mt5-center"] });

  const remove = async (r: Row) => {
    if (r.tradecopy_active) {
      toast.error("Deactivate the TradeCopy account before removing it.");
      return;
    }
    const ok = window.confirm(
      `Remove ${r.label || "this MT5 account"} (${r.login_id || "unknown login"}) from Botvio and unregister its TradeCopy Master/Slave registration? This does not close the broker account.`
    );
    if (!ok) return;
    try {
      await removeAccount.mutateAsync(r.id);
      toast.success("MT5 account removed from Botvio and TradeCopy");
      setSelected(null);
      refresh();
    } catch (e) {
      refresh();
      toast.error((e as Error).message);
    }
  };
  const act = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => { toast.success("Done"); refresh(); },
    onError: (e: Error & { code?: string }) => {
      // A stale admin page can hold an account row that was already removed.
      // Refresh the center immediately instead of leaving a dead row/actions on screen.
      refresh();
      toast.error(e.code === "not_found" ? "That MT5 account no longer exists in Botvio. The list has been refreshed." : e.message);
    },
  });

  const rows = data?.rows ?? [];
  const brokers = useMemo(() => [...new Set(rows.map((r) => r.broker).filter(Boolean) as string[])].sort(), [rows]);
  const filtered = rows.filter((r) =>
    (role === "all" || r.roles.includes(role as Mt5Role) || (role === "NONE" && r.roles.length === 0)) &&
    (env === "all" || (r.environment ?? "DEMO") === env) &&
    (broker === "all" || r.broker === broker) &&
    (status === "all" || (status === "error" ? !!(r.last_direct_error || r.connection_status === "error") : (r.connection_status ?? "") === status)) &&
    (!owner || r.owner.toLowerCase().includes(owner.toLowerCase()) || (r.login_id ?? "").includes(owner)),
  );

  const count = (rl: Mt5Role) => rows.filter((r) => r.roles.includes(rl)).length;
  const providerMasters = rows.filter((r) => r.account_role === "master" && !r.is_botvio_robot);
  const robotMasters = rows.filter((r) => r.account_role === "master" && r.is_botvio_robot);
  const registeredProviderSlots = providerMasters.filter((r) => !!r.tradecopy_user_id).length;
  const providerSlotFull = registeredProviderSlots >= 2;
  const weltradeProvider = rows.find((r) => (r.broker ?? "").toLowerCase() === "weltrade" && r.login_id === "43304349");
  const stale35165 = !rows.some((r) => r.tradecopy_user_id === 35165) && providerSlotFull;
  const cards = [
    { label: "Total MT5 accounts", value: rows.length, icon: Server },
    { label: "Direct Execution active", value: count("DIRECT EXECUTION"), icon: Send },
    { label: "Data Feeds", value: count("DATA FEED"), icon: Radio },
    { label: "Provider Masters", value: count("PROVIDER MASTER"), icon: Crown },
    { label: "Botvio Robot Master", value: count("BOTVIO ROBOT MASTER"), icon: Bot },
    { label: "Botvio Signal Master", value: count("BOTVIO SIGNAL MASTER"), icon: Send },
    { label: "Copying accounts", value: (data?.relations ?? []).filter((r) => r.status === "active").length, icon: Users },
    { label: "Errors", value: rows.filter((r) => r.last_direct_error || r.connection_status === "error").length, icon: AlertTriangle },
  ];

  const promoteExistingMaster = (r: Row) => {
    if (r.account_role === "master") return;
    const broker = (r.broker ?? "").trim().toLowerCase();
    if (broker !== "weltrade" || r.tradecopy_user_id) return;
    const ok = window.confirm(
      `Promote the existing Weltrade MT5 account ${r.login_id || "unknown"} on ${r.server || "unknown server"} to Provider Master? Botvio will reuse the existing account and encrypted credentials; it will not create a duplicate account. It will remain DEMO and inactive until tested/activated.`
    );
    if (!ok) return;
    act.mutate(() => tradecopy("promote_existing_master", { account_id: r.id }));
  };

  const toggleDirect = (r: Row) => act.mutate(() => directAction("admin_set", {
    account_id: r.id, enabled: !r.direct_signal_enabled, entitled: r.direct_execution_entitled,
    plan: r.direct_execution_plan || "MT5 Direct",
    expires_at: r.direct_execution_expires_at || null,
  }));
  const togglePaidMt5 = (r: Row) => {
    const grant = !r.direct_execution_entitled;
    const expires = grant ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
    act.mutate(() => directAction("admin_set", {
      account_id: r.id,
      enabled: grant,
      entitled: grant,
      plan: grant ? "MT5 Direct — 30 Days" : undefined,
      expires_at: expires,
    }));
  };
  const toggleMaster = (r: Row) => act.mutate(() => tradecopy("set_master_active", { account_id: r.id, active: !r.tradecopy_active }));
  const toggleSignalMaster = (r: Row) => act.mutate(() => tradecopy("set_signal_master", {
    account_id: r.id,
    enabled: !r.botvio_signal_master_enabled,
    lot: r.botvio_signal_master_lot || 0.01,
    min_confidence: r.botvio_signal_min_confidence || 70,
  }));
  const testConn = (r: Row) => act.mutate(() => r.tradecopy_user_id ? tradecopy("diagnostic", { account_id: r.id }) : directAction("test_connection", { account_id: r.id }));
  const setProvider = (r: Row, s: "approved" | "suspended") => act.mutate(async () => {
    if (!r.provider) throw new Error("No provider profile");
    const { error } = await supabase.from("providers").update({ status: s }).eq("id", r.provider.id);
    if (error) throw error;
  });
  const emergency = (relId: string) => act.mutate(() => tradecopy("emergency_stop", { relationship_id: relId, close_all: false }));
  const forceDemo = (r: Row) => act.mutate(async () => {
    const { error } = await supabase.from("trading_accounts").update({ environment: "DEMO", tradecopy_active: false, direct_signal_enabled: false, direct_signal_status: "off", direct_live_confirmed_at: null }).eq("id", r.id);
    if (error) throw error;
  });

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> MT5 Connections & TradeCopy</CardTitle>
            <CardDescription>Admin control for provider masters, Botvio Robot routing, direct MT5 execution, LIVE safety, and TradeCopy diagnostics. Passwords are never shown.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ConnectMt5Dialog
              role="master"
              robot
              triggerLabel="Add Botvio Robot Master"
              existingMasters={rows.filter((r) => r.account_role === "master" && !r.is_botvio_robot).map((r) => ({ login_id: r.login_id || "", server: r.server || "" }))}
            />
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">TradeCopy Control Center</p>
                <p className="mt-1 text-xs text-muted-foreground">Provider slots are limited to two. Botvio Robot is managed separately from provider routing.</p>
              </div>
              <Badge variant={providerSlotFull ? "secondary" : "outline"}>{registeredProviderSlots}/2 provider slots</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">① Deriv Provider</span><Badge variant="outline">{providerMasters.some((r) => r.login_id === "41242244") ? "Configured" : "Missing"}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">Login 41242244 · DEMO · External 35164</p>
                {providerMasters.find((r) => r.login_id === "41242244") && <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => setSelected(providerMasters.find((r) => r.login_id === "41242244")!)}>Manage Deriv</Button>}
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">② Weltrade Provider</span><Badge variant="outline">{weltradeProvider?.account_role === "master" ? "Configured" : "Ready"}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">Login 43304349 · Weltrade-Demo</p>
                {weltradeProvider && weltradeProvider.account_role !== "master" && !weltradeProvider.tradecopy_user_id && <Button className="mt-2 w-full" size="sm" disabled={act.isPending} onClick={() => promoteExistingMaster(weltradeProvider)}><Crown className="mr-1 h-4 w-4" />Promote Existing Account</Button>}
                {weltradeProvider?.account_role === "master" && <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => setSelected(weltradeProvider)}>Manage Weltrade</Button>}
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Botvio Robot</span><Badge variant="outline">{robotMasters.length ? "Registered" : "Independent"}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">Does not belong in the two provider slots.</p>
                {robotMasters.length ? <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => setSelected(robotMasters[0])}>Manage Robot</Button> : <div className="mt-2 text-[11px] text-muted-foreground">No Robot TradeCopy master currently registered.</div>}
              </div>
            </div>
            {stale35165 && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div><span className="font-semibold">External slot check required:</span> Botvio has no account 35165, but TradeCopy is still reporting the provider limit as full. Do not delete or recreate a provider blindly; use the external TradeCopy cleanup process before registering another master.</div>
            </div>}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border/60 bg-background/60 p-3">
                <Icon className="h-4 w-4 text-primary" />
                <p className="mt-2 text-2xl font-bold">{isLoading ? "…" : value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            <Select value={role} onValueChange={setRole}><SelectTrigger aria-label="Role" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {(["DATA FEED", "DIRECT EXECUTION", "PROVIDER MASTER", "BOTVIO ROBOT MASTER", "BOTVIO SIGNAL MASTER", "FOLLOWER"] as Mt5Role[]).map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              <SelectItem value="NONE">Connected, no role</SelectItem>
            </SelectContent></Select>
            <Select value={broker} onValueChange={setBroker}><SelectTrigger aria-label="Broker" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All brokers</SelectItem>{brokers.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent></Select>
            <Select value={env} onValueChange={setEnv}><SelectTrigger aria-label="Environment" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">DEMO + LIVE</SelectItem><SelectItem value="DEMO">DEMO</SelectItem><SelectItem value="LIVE">LIVE</SelectItem>
            </SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All statuses</SelectItem><SelectItem value="connected">Connected</SelectItem><SelectItem value="saved">Saved</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="error">Errors</SelectItem>
            </SelectContent></Select>
            <Input className="min-h-11" placeholder="Owner or login" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by owner" />
          </div>

          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Owner / Account</TableHead><TableHead>Broker · Login · Server</TableHead><TableHead>Roles</TableHead>
                  <TableHead>Env</TableHead><TableHead>MT5 Paid Access</TableHead><TableHead>Direct Signals</TableHead><TableHead>TradeCopy</TableHead><TableHead>Last activity</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="py-6 text-center text-muted-foreground">No accounts match these filters.</TableCell></TableRow>
                  ) : filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><div className="font-medium">{r.label || "MT5 account"}</div><div className="text-xs text-muted-foreground">{r.owner}</div></TableCell>
                      <TableCell className="text-sm"><div>{r.broker || "—"}</div><div className="text-xs text-muted-foreground">{mask(r.login_id)} · {r.server}</div></TableCell>
                      <TableCell><div className="flex max-w-[220px] flex-wrap gap-1">
                        {r.roles.length ? r.roles.map((x) => <Badge key={x} variant="outline" className={`text-[10px] ${ROLE_STYLE[x]}`}>{x}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
                      </div></TableCell>
                      <TableCell><Badge variant={r.environment === "LIVE" ? "destructive" : "secondary"}>{r.environment || "DEMO"}</Badge></TableCell>
                      <TableCell className="text-xs">
                        <div>{r.direct_execution_entitled ? "PAID ACTIVE" : "LOCKED"}</div>
                        {r.direct_execution_entitled && r.direct_execution_expires_at && <div className="text-muted-foreground">until {new Date(r.direct_execution_expires_at).toLocaleDateString()}</div>}
                      </TableCell>
                      <TableCell className="text-xs"><div>{r.direct_signal_enabled ? "ON" : "OFF"}</div>{r.last_direct_error && <div className="max-w-[160px] truncate text-destructive" title={r.last_direct_error}>{r.last_direct_error}</div>}</TableCell>
                      <TableCell className="text-xs">
                        <div>{usesTradeCopySlot(r) ? "Registered (uses slot)" : "Not registered"}</div>
                        <div className="text-muted-foreground">{r.connection_status || "—"}{r.account_role === "master" ? ` · ${r.followers} followers` : ""}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ago(r.last_direct_execution_at || r.updated_at)}</TableCell>
                      <TableCell><div className="flex flex-wrap justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setSelected(r)}><Eye className="mr-1 h-4 w-4" />View</Button>
                        {r.account_role === "slave" && !r.tradecopy_user_id && (r.broker ?? "").toLowerCase() === "weltrade" && (
                          <Button size="sm" variant="default" disabled={act.isPending} onClick={() => promoteExistingMaster(r)}>
                            <Crown className="mr-1 h-4 w-4" />Promote to Provider Master
                          </Button>
                        )}
                        {!r.is_botvio_robot && r.account_role !== "master" && (
                          <>
                            <Button size="sm" variant={r.direct_execution_entitled ? "outline" : "default"} disabled={act.isPending} onClick={() => togglePaidMt5(r)}>
                              <Crown className="mr-1 h-4 w-4" />{r.direct_execution_entitled ? "Revoke Paid MT5" : "Grant Paid MT5 · 30d"}
                            </Button>
                            <Button size="sm" variant={r.direct_signal_enabled ? "outline" : "secondary"} disabled={act.isPending || !r.direct_execution_entitled} onClick={() => toggleDirect(r)}>
                              <Send className="mr-1 h-4 w-4" />{r.direct_signal_enabled ? "Disable Direct" : "Enable Direct"}
                            </Button>
                          </>
                        )}
                        {r.account_role === "master" && r.tradecopy_user_id && (
                          <>
                            <Button size="sm" variant={r.tradecopy_active ? "outline" : "default"} disabled={act.isPending} onClick={() => toggleMaster(r)}>
                              <Power className="mr-1 h-4 w-4" />{r.tradecopy_active ? "Deactivate Master" : "Activate Master"}
                            </Button>
                            {!r.is_botvio_robot && (
                              <Button size="sm" variant={r.botvio_signal_master_enabled ? "outline" : "default"} disabled={act.isPending || !r.tradecopy_active} onClick={() => toggleSignalMaster(r)}>
                                <Send className="mr-1 h-4 w-4" />{r.botvio_signal_master_enabled ? "Stop Botvio Signals" : "Receive Botvio Signals"}
                              </Button>
                            )}
                          </>
                        )}
                        {r.tradecopy_user_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={act.isPending || removeAccount.isPending || r.tradecopy_active}
                            onClick={() => remove(r)}
                          >
                            Remove
                          </Button>
                        )}
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <AccountDetail
              r={selected}
              relations={(data?.relations ?? []).filter((x) => x.follower_account_id === selected.id || x.master_account_id === selected.id)}
              busy={act.isPending}
              onTest={() => testConn(selected)}
              onToggleDirect={() => toggleDirect(selected)}
              onToggleMaster={() => toggleMaster(selected)}
              onToggleSignalMaster={() => toggleSignalMaster(selected)}
              onProvider={(s) => setProvider(selected, s)}
              onEmergency={emergency}
              onForceDemo={() => forceDemo(selected)}
              onRemove={() => remove(selected)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

function AccountDetail({ r, relations, busy, onTest, onToggleDirect, onToggleMaster, onToggleSignalMaster, onProvider, onEmergency, onForceDemo, onRemove }: {
  r: Row; relations: Rel[]; busy: boolean; onTest: () => void; onToggleDirect: () => void; onToggleMaster: () => void; onToggleSignalMaster: () => void;
  onProvider: (s: "approved" | "suspended") => void; onEmergency: (id: string) => void; onForceDemo: () => void; onRemove: () => void;
}) {
  const { data: execs } = useQuery({
    queryKey: ["admin-direct-execs", r.id],
    queryFn: async () => (await supabase.from("direct_executions").select("*").eq("trading_account_id", r.id).order("created_at", { ascending: false }).limit(15)).data ?? [],
  });
  const { data: audit } = useQuery({
    queryKey: ["admin-account-audit", r.id],
    queryFn: async () => (await supabase.from("tradecopy_audit_log").select("id,action,ok,mode,created_at").eq("trading_account_id", r.id).order("created_at", { ascending: false }).limit(15)).data ?? [],
  });

  const paths: string[] = [];
  if (r.roles.includes("DIRECT EXECUTION")) paths.push("Botvio signal → TradeCopy → this follower MT5 account");
  if (r.roles.includes("BOTVIO SIGNAL MASTER")) paths.push("Botvio signal → this Deriv/provider TradeCopy master → TradeCopy followers");
  if (r.roles.includes("BOTVIO ROBOT MASTER")) paths.push("Botvio signal → Botvio Robot Master → TradeCopy → followers");
  if (r.roles.includes("PROVIDER MASTER")) paths.push("Provider's executed MT5 trades → TradeCopy → followers");
  if (r.roles.includes("FOLLOWER")) paths.push("Master trades → TradeCopy → this account");
  if (r.roles.includes("DATA FEED")) paths.push("This MT5 account → market data → Botvio signal engine (no TradeCopy)");

  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle>{r.label || "MT5 account"}</SheetTitle>
        <SheetDescription>{r.owner} · {r.broker} · {mask(r.login_id)} · {r.server}</SheetDescription>
      </SheetHeader>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={r.environment === "LIVE" ? "destructive" : "secondary"}>{r.environment || "DEMO"}</Badge>
        {r.roles.map((x) => <Badge key={x} variant="outline" className={ROLE_STYLE[x]}>{x}</Badge>)}
        <Badge variant="outline">{usesTradeCopySlot(r) ? `TradeCopy ID ${r.tradecopy_user_id}` : "No TradeCopy registration"}</Badge>
        <Badge variant="outline" className={r.direct_execution_entitled ? "border-emerald-500/30 text-emerald-500" : ""}>{r.direct_execution_entitled ? `PAID MT5 · ${r.direct_execution_plan || "Active"}` : "PAID MT5 LOCKED"}</Badge>
        {r.botvio_signal_master_enabled && <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">BOTVIO SIGNAL DESTINATION · {r.botvio_signal_master_lot} lot · ≥{r.botvio_signal_min_confidence}%</Badge>}
        {r.provider && <Badge variant="outline">Provider: {r.provider.status}</Badge>}
      </div>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4" />Execution path</h3>
        {paths.length ? <ul className="space-y-1 text-xs">{paths.map((p) => <li key={p} className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">{p}</li>)}</ul>
          : <p className="text-xs text-muted-foreground">Connected only — no role active.</p>}
      </section>

      <section className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={onTest}>Test Connection</Button>
        {!r.is_botvio_robot && r.account_role !== "master" && <Button size="sm" variant="outline" disabled={busy} onClick={onToggleDirect}>{r.direct_signal_enabled ? "Disable Direct Signals" : "Enable Direct Signals"}</Button>}
        {r.account_role === "master" && r.tradecopy_user_id && <Button size="sm" variant="outline" disabled={busy} onClick={onToggleMaster}>{r.tradecopy_active ? "Deactivate Master" : "Activate Master"}</Button>}
        {r.account_role === "master" && r.tradecopy_user_id && !r.is_botvio_robot && <Button size="sm" variant="outline" disabled={busy || !r.tradecopy_active} onClick={onToggleSignalMaster}>{r.botvio_signal_master_enabled ? "Stop Botvio Signals" : "Receive Botvio Signals"}</Button>}
        {r.provider && r.provider.status !== "approved" && <Button size="sm" disabled={busy} onClick={() => onProvider("approved")}>Approve Provider</Button>}
        {r.provider && r.provider.status === "approved" && <Button size="sm" variant="outline" disabled={busy} onClick={() => onProvider("suspended")}>Suspend Provider</Button>}
        {r.environment === "LIVE" && <Button size="sm" variant="destructive" disabled={busy} onClick={onForceDemo}><ShieldAlert className="mr-1 h-4 w-4" />Force Demo</Button>}
        {r.tradecopy_user_id && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy || r.tradecopy_active} onClick={onRemove}>Remove & unregister</Button>}
      </section>

      {r.last_direct_error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">Last error: {r.last_direct_error}</p>}

      <section>
        <h3 className="mb-2 text-sm font-semibold">Copy relationships ({relations.length})</h3>
        {relations.length === 0 ? <p className="text-xs text-muted-foreground">None.</p> : (
          <ul className="space-y-1 text-xs">{relations.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5">
              <span>{x.follower_account_id === r.id ? "Copies " : "Copied by follower "}{x.is_botvio_robot ? "(Botvio Robot)" : ""} · {x.status} · {x.environment}</span>
              {x.status === "active" && <Button size="sm" variant="destructive" disabled={busy} onClick={() => onEmergency(x.id)}>Emergency Stop</Button>}
            </li>
          ))}</ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Direct executions</h3>
        {!execs?.length ? <p className="text-xs text-muted-foreground">None yet.</p> : (
          <ul className="space-y-1 text-xs">{execs.map((e: any) => (
            <li key={e.id} className="flex flex-wrap justify-between gap-2 rounded-md bg-muted/20 px-2 py-1">
              <span>{e.direction} {e.mt5_symbol} · {e.volume}</span>
              <span className="text-muted-foreground">{e.status} ({e.mode}) · {ago(e.created_at)}</span>
            </li>
          ))}</ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Audit</h3>
        {!audit?.length ? <p className="text-xs text-muted-foreground">No audit entries.</p> : (
          <ul className="space-y-1 text-xs">{audit.map((a: any) => (
            <li key={a.id} className="flex justify-between gap-2 rounded-md bg-muted/20 px-2 py-1">
              <span>{a.action} {a.ok ? "" : "· failed"}</span><span className="text-muted-foreground">{ago(a.created_at)}</span>
            </li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}

export default AdminTradeCopyTab;
