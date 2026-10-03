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
import { tradecopy } from "@/hooks/useTradeCopy";
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
  const act = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => { toast.success("Done"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
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

  const toggleDirect = (r: Row) => act.mutate(() => directAction("admin_set", { account_id: r.id, enabled: !r.direct_signal_enabled }));
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
            <CardDescription>Every MT5 account by role. Botvio signals enter the configured provider master through TradeCopy; user Direct Signals also execute through TradeCopy. Passwords are never shown.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <TableHead>Env</TableHead><TableHead>Direct Signals</TableHead><TableHead>TradeCopy</TableHead><TableHead>Last activity</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="py-6 text-center text-muted-foreground">No accounts match these filters.</TableCell></TableRow>
                  ) : filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><div className="font-medium">{r.label || "MT5 account"}</div><div className="text-xs text-muted-foreground">{r.owner}</div></TableCell>
                      <TableCell className="text-sm"><div>{r.broker || "—"}</div><div className="text-xs text-muted-foreground">{mask(r.login_id)} · {r.server}</div></TableCell>
                      <TableCell><div className="flex max-w-[220px] flex-wrap gap-1">
                        {r.roles.length ? r.roles.map((x) => <Badge key={x} variant="outline" className={`text-[10px] ${ROLE_STYLE[x]}`}>{x}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
                      </div></TableCell>
                      <TableCell><Badge variant={r.environment === "LIVE" ? "destructive" : "secondary"}>{r.environment || "DEMO"}</Badge></TableCell>
                      <TableCell className="text-xs"><div>{r.direct_signal_enabled ? "ON" : "OFF"}</div>{r.last_direct_error && <div className="max-w-[160px] truncate text-destructive" title={r.last_direct_error}>{r.last_direct_error}</div>}</TableCell>
                      <TableCell className="text-xs">
                        <div>{usesTradeCopySlot(r) ? "Registered (uses slot)" : "Not registered"}</div>
                        <div className="text-muted-foreground">{r.connection_status || "—"}{r.account_role === "master" ? ` · ${r.followers} followers` : ""}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ago(r.last_direct_execution_at || r.updated_at)}</TableCell>
                      <TableCell><div className="flex flex-wrap justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setSelected(r)}><Eye className="mr-1 h-4 w-4" />View</Button>
                        {!r.is_botvio_robot && r.account_role !== "master" && (
                          <Button size="sm" variant={r.direct_signal_enabled ? "outline" : "default"} disabled={act.isPending} onClick={() => toggleDirect(r)}>
                            <Send className="mr-1 h-4 w-4" />{r.direct_signal_enabled ? "Disable Direct" : "Enable Direct"}
                          </Button>
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
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

function AccountDetail({ r, relations, busy, onTest, onToggleDirect, onToggleMaster, onProvider, onEmergency, onForceDemo }: {
  r: Row; relations: Rel[]; busy: boolean; onTest: () => void; onToggleDirect: () => void; onToggleMaster: () => void; onToggleSignalMaster: () => void;
  onProvider: (s: "approved" | "suspended") => void; onEmergency: (id: string) => void; onForceDemo: () => void;
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
