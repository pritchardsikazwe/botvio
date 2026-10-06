import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, KeyRound, Loader2, Power, RefreshCw, ShieldCheck, Wifi } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WELTRADE_INSTRUMENTS } from "@/config/weltradeInstruments";

type AuditRow = { requestedSymbol: string; resolvedSymbol: string | null; quoteOk: boolean; historyCount: number; live: boolean; failure: string | null };

type Status = {
  connected: boolean;
  account?: { login: string; broker: string; server: string; environment: string };
  lastConnectedAt?: string | null;
  lastError?: string | null;
};

async function getFunctionError(error: unknown) {
  const e = error as { message?: string; context?: Response };
  let detail = e?.message || "SyntX API Studio request failed";
  const response = e?.context;
  if (response) {
    try {
      const body = await response.clone().json();
      const serverError = body?.error ?? body?.message;
      if (serverError) detail += ` — ${serverError}`;
    } catch {
      try {
        const text = await response.clone().text();
        if (text) detail += ` — ${text.slice(0, 300)}`;
      } catch {}
    }
  }
  return detail;
}

export function SyntxApiStudioConnectionCard() {
  const [login, setLogin] = useState("43304349");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("Weltrade-Demo");
  const [customServer, setCustomServer] = useState("");
  const [status, setStatus] = useState<Status>({ connected: false });
  const [symbols, setSymbols] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const resolvedServer = server === "custom" ? customServer.trim() : server;

  const call = async <T,>(action: string, payload: Record<string, unknown> = {}) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.access_token) {
      throw new Error("Your BOTVIO session has expired. Please sign in again.");
    }
    const { data, error } = await supabase.functions.invoke("syntx-api-studio", {
      body: { action, ...payload },
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });
    if (error) throw new Error(await getFunctionError(error));
    if (!data?.ok) throw new Error(data?.error || "SyntX API Studio request failed");
    return data as T;
  };

  const refresh = async () => {
    try {
      const s = await call<Status>("status");
      setStatus(s);
      if (s.connected) {
        const x = await call<{ symbols: string[] }>("symbols");
        setSymbols(x.symbols ?? []);
      } else setSymbols([]);
    } catch (e) {
      setStatus((v) => ({ ...v, connected: false, lastError: (e as Error).message }));
    }
  };

  useEffect(() => { void refresh(); }, []);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await call<{ connected: boolean; symbols: string[] }>("connect", { login, password, broker: "Weltrade", server: resolvedServer });
      setPassword("");
      setSymbols(result.symbols ?? []);
      setStatus({ connected: result.connected, account: { login, broker: "Weltrade", server: resolvedServer, environment: "DEMO" }, lastConnectedAt: new Date().toISOString() });
      toast.success("Weltrade SyntX API Studio connected");
    } catch (e) {
      toast.error((e as Error).message);
      setPassword("");
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await call("disconnect");
      setStatus({ connected: false });
      setSymbols([]);
      toast.success("SyntX API connection disconnected");
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const runAudit = async () => {
    setBusy(true);
    try {
      const list = WELTRADE_INSTRUMENTS.filter((i) => i.category === "syntx").map((i) => i.feedSymbol);
      const r = await call<{ audit: { rows: AuditRow[] } }>("audit_all", { symbols: list });
      setAudit(r.audit.rows);
      const live = r.audit.rows.filter((x) => x.live).length;
      toast.success(`Feed audit: ${live}/${r.audit.rows.length} markets returned quotes and candles`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Card className="glass-card border-primary/25 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Weltrade SyntX · API Studio</CardTitle>
              <Badge variant="outline" className={status.connected ? "border-success/40 text-success" : ""}>{status.connected ? "CONNECTED" : "NOT CONNECTED"}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">MT5 SyntX DEMO market data for BOTVIO signals. This connection is data-only and cannot place trades.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg border bg-background/60 p-3"><p className="text-[10px] uppercase text-muted-foreground">Account</p><p className="font-mono text-sm font-bold">{status.account?.login ?? login}</p></div>
          <div className="rounded-lg border bg-background/60 p-3"><p className="text-[10px] uppercase text-muted-foreground">Type</p><p className="text-sm font-bold">MT5 Demo SyntX</p></div>
          <div className="rounded-lg border bg-background/60 p-3"><p className="text-[10px] uppercase text-muted-foreground">Server</p><p className="font-mono text-sm font-bold">{status.account?.server ?? server}</p></div>
          <div className="rounded-lg border bg-background/60 p-3"><p className="text-[10px] uppercase text-muted-foreground">Symbols</p><p className="text-sm font-bold">{symbols.length || "—"}</p></div>
        </div>
        {!status.connected ? (
          <form onSubmit={connect} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-1.5"><Label>MT5 login</Label><Input inputMode="numeric" value={login} onChange={(e) => setLogin(e.target.value.replace(/\D/g, ""))} required /></div>
            <div className="space-y-1.5"><Label>MT5 password</Label><Input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} /></div>
            <div className="space-y-1.5">
              <Label>Weltrade MT5 server</Label>
              <Select value={server} onValueChange={setServer}>
                <SelectTrigger><SelectValue placeholder="Select server" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weltrade-Demo">Weltrade-Demo</SelectItem>
                  <SelectItem value="Weltrade-Live">Weltrade-Live</SelectItem>
                  <SelectItem value="custom">Other / exact server name…</SelectItem>
                </SelectContent>
              </Select>
              {server === "custom" && (
                <Input className="mt-2" placeholder="Enter exact server name from Weltrade" value={customServer} onChange={(e) => setCustomServer(e.target.value)} required />
              )}
              <p className="text-[10px] text-muted-foreground">Use the exact server assigned to this MT5 account.</p>
            </div>
            <Button type="submit" disabled={busy || !login || !password || !resolvedServer}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}Connect SyntX</Button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/20 bg-success/5 p-3">
            <div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /><div><p className="text-sm font-semibold">SyntX market-data connection is live</p><p className="text-xs text-muted-foreground">BOTVIO can now request SyntX quotes and historical candles through API Studio.</p></div></div>
            <Button size="sm" variant="outline" onClick={() => void disconnect()} disabled={busy}><Power className="mr-2 h-4 w-4" />Disconnect</Button>
          </div>
        )}
        {symbols.length > 0 && <div className="rounded-xl border border-border/50 bg-background/50 p-3"><div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Discovered SyntX / MT5 symbols</p></div><div className="flex max-h-24 flex-wrap gap-1.5 overflow-auto">{symbols.map((symbol) => <Badge key={symbol} variant="outline" className="font-mono text-[10px]">{symbol}</Badge>)}</div></div>}
        {status.connected && <Button size="sm" variant="outline" onClick={() => void runAudit()} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Audit all SyntX markets</Button>}
        {audit && <div className="max-h-72 overflow-auto rounded-xl border bg-background/50"><table className="w-full text-[11px]"><thead><tr className="text-left text-muted-foreground"><th className="p-2">Market</th><th className="p-2">Broker symbol</th><th className="p-2">Quote</th><th className="p-2">Candles</th><th className="p-2">Result</th></tr></thead><tbody>{audit.map((r) => <tr key={r.requestedSymbol} className="border-t"><td className="p-2 font-semibold">{r.requestedSymbol}</td><td className="p-2 font-mono">{r.resolvedSymbol ?? "—"}</td><td className="p-2">{r.quoteOk ? "OK" : "No"}</td><td className="p-2">{r.historyCount}</td><td className={`p-2 ${r.live ? "text-success" : "text-destructive"}`}>{r.live ? "Live" : r.failure ?? "Failed"}</td></tr>)}</tbody></table></div>}
        {status.lastError && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{status.lastError}</p>}
        <p className="text-[10px] leading-relaxed text-muted-foreground">Password is sent only to the secure Supabase function and stored encrypted. The SyntX data connection exposes quotes/history to BOTVIO; it does not expose OrderSend or copy-trading controls.</p>
      </CardContent>
    </Card>
  );
}
