import { useEffect, useMemo, useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SYNTHETICS } from "@/config/synthetics";
import { Bot, Cloud, Server, ShieldCheck, Activity, Pause, Play, ExternalLink, Zap } from "lucide-react";
import { ActivateCloudWorkerWizard } from "@/components/trading/ActivateCloudWorkerWizard";
import { ManagedMt5Onboarding } from "@/components/broker/ManagedMt5Onboarding";
import { DemoMt5Card } from "@/components/broker/DemoMt5Card";

const CONTABO_VPS_IP = "167.86.89.31";
const CONTABO_VPS_NAME = "vmi3267408 · Cloud VPS 10 SSD";

type Route = "deriv" | "mt5";

interface InstrumentRow {
  id?: string;
  user_id?: string;
  instrument_key: string;
  display_symbol: string;
  route: Route;
  deriv_connection_id: string | null;
  stake: number;
  multiplier: number | null;
  contract_family: string;
  min_confidence: number;
  enabled: boolean;
}

interface Limits {
  user_id?: string;
  max_trades_per_day: number;
  max_daily_loss_usd: number;
  max_open_positions: number;
  target_profit_usd: number | null;
  paused: boolean;
}

const DEFAULT_LIMITS: Limits = {
  max_trades_per_day: 20, max_daily_loss_usd: 50, max_open_positions: 3,
  target_profit_usd: null, paused: false,
};

export default function AutoTrade() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState<Limits>(DEFAULT_LIMITS);
  const [rows, setRows] = useState<Record<string, InstrumentRow>>({});
  const [derivConnections, setDerivConnections] = useState<Array<{ id: string; login_id: string | null; account_type: string | null }>>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const [{ data: lim }, { data: instr }, { data: conns }] = await Promise.all([
        supabase.from("auto_trade_user_limits").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("auto_trade_instruments").select("*").eq("user_id", user.id),
        supabase.from("deriv_connections").select("id, login_id, account_type").eq("user_id", user.id),
      ]);
      if (lim) setLimits({ ...DEFAULT_LIMITS, ...lim });
      const map: Record<string, InstrumentRow> = {};
      (instr ?? []).forEach((r: any) => { map[r.instrument_key] = r; });
      setRows(map);
      setDerivConnections(conns ?? []);
      setLoading(false);
    })();
  }, [user]);

  const enabledCount = useMemo(() => Object.values(rows).filter((r) => r.enabled).length, [rows]);

  const saveLimits = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("auto_trade_user_limits")
      .upsert({ user_id: user.id, ...limits }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Couldn't save limits", description: error.message, variant: "destructive" });
    else toast({ title: "Safety limits saved", description: "Cloud worker will honour these on the next pass." });
  };

  const togglePause = async () => {
    const next = !limits.paused;
    setLimits((l) => ({ ...l, paused: next }));
    if (!user) return;
    await supabase.from("auto_trade_user_limits")
      .upsert({ user_id: user.id, ...limits, paused: next }, { onConflict: "user_id" });
    toast({ title: next ? "Auto-trade paused" : "Auto-trade resumed" });
  };

  const upsertInstrument = async (key: string, patch: Partial<InstrumentRow>) => {
    if (!user) return;
    const inst = SYNTHETICS.find((s) => s.key === key)!;
    const existing = rows[key];
    const merged: InstrumentRow = {
      instrument_key: key,
      display_symbol: existing?.display_symbol ?? (inst.derivSymbol ?? inst.mt5Symbol),
      route: existing?.route ?? "deriv",
      deriv_connection_id: existing?.deriv_connection_id ?? (derivConnections[0]?.id ?? null),
      stake: existing?.stake ?? 1,
      multiplier: existing?.multiplier ?? 100,
      contract_family: existing?.contract_family ?? "MULTIPLIERS",
      min_confidence: existing?.min_confidence ?? 70,
      enabled: existing?.enabled ?? false,
      ...patch,
    };
    // For MT5 route force the broker symbol
    if (merged.route === "mt5") merged.display_symbol = inst.mt5Symbol;
    if (merged.route === "deriv") merged.display_symbol = inst.derivSymbol ?? inst.chartProxy ?? inst.mt5Symbol;

    const { data, error } = await supabase.from("auto_trade_instruments")
      .upsert({ user_id: user.id, ...merged }, { onConflict: "user_id,instrument_key" })
      .select("*").single();
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setRows((r) => ({ ...r, [key]: data as InstrumentRow }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Sign in to set up 24/7 auto-trading</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="24/7 Auto-Trade Cloud Worker | Botvio"
        description="Run Botvio AI signals 24/7 on Deriv & MT5 without leaving your computer on. Per-instrument toggles, daily loss caps and pause controls."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">CLOUD WORKER</Badge>
            <Badge variant="outline" className="border-success/40 text-success text-xs">Runs every 2 min</Badge>
            <Badge variant="outline" className="border-warning/30 text-warning text-xs">
              <Zap className="h-3 w-3 mr-1" /> No PC needed
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            24/7 <span className="text-primary">Automated Trading</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Botvio's cloud worker scans your enabled instruments every 2 minutes and fires the Botvio AI Strategy
            signals to Deriv (CFD multipliers) or your MT5 Bridge — even when your device is offline.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={togglePause} variant={limits.paused ? "default" : "outline"} className="gap-2">
              {limits.paused ? <><Play className="h-4 w-4" /> Resume worker</> : <><Pause className="h-4 w-4" /> Pause all</>}
            </Button>
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" /> {enabledCount} instrument{enabledCount === 1 ? "" : "s"} active
            </Badge>
          </div>
        </div>

        {/* Activation wizard */}
        <ActivateCloudWorkerWizard />

        {/* Managed MT5 — no install */}
        <ManagedMt5Onboarding />

        {/* Shared Demo MT5 — try before you connect your own */}
        <DemoMt5Card symbol="XAUUSD" source="auto-trade" />

        {/* Safety limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Daily safety limits</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Max trades / day</Label>
              <Input type="number" min={1} max={100} value={limits.max_trades_per_day}
                onChange={(e) => setLimits({ ...limits, max_trades_per_day: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Max daily loss (USD)</Label>
              <Input type="number" min={1} value={limits.max_daily_loss_usd}
                onChange={(e) => setLimits({ ...limits, max_daily_loss_usd: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Max open positions</Label>
              <Input type="number" min={1} max={20} value={limits.max_open_positions}
                onChange={(e) => setLimits({ ...limits, max_open_positions: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Auto-pause at profit (USD)</Label>
              <Input type="number" min={0} placeholder="Optional" value={limits.target_profit_usd ?? ""}
                onChange={(e) => setLimits({ ...limits, target_profit_usd: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button onClick={saveLimits} disabled={saving}>{saving ? "Saving…" : "Save limits"}</Button>
              <p className="text-xs text-muted-foreground mt-2">
                Worker stops placing new trades once any limit is hit. Resets at 00:00 UTC.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instrument toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Per-instrument auto-trade</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="space-y-3">
                {SYNTHETICS.map((inst) => {
                  const row = rows[inst.key];
                  const enabled = row?.enabled ?? false;
                  const route: Route = (row?.route ?? "deriv") as Route;
                  return (
                    <div key={inst.key} className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{inst.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{inst.blurb}</div>
                        </div>
                        <Switch checked={enabled} onCheckedChange={(v) => upsertInstrument(inst.key, { enabled: v })} />
                      </div>
                      {enabled && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">Route</Label>
                            <select className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                              value={route} onChange={(e) => upsertInstrument(inst.key, { route: e.target.value as Route })}>
                              <option value="deriv">Deriv API</option>
                              <option value="mt5">MT5 Bridge</option>
                            </select>
                          </div>
                          {route === "deriv" && (
                            <div>
                              <Label className="text-xs">Account</Label>
                              <select className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                                value={row?.deriv_connection_id ?? ""}
                                onChange={(e) => upsertInstrument(inst.key, { deriv_connection_id: e.target.value || null })}>
                                <option value="">Select…</option>
                                {derivConnections.map((c) => (
                                  <option key={c.id} value={c.id}>{c.login_id ?? c.id.slice(0,8)} · {c.account_type ?? ""}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <Label className="text-xs">Stake</Label>
                            <Input type="number" min={0.5} step={0.5} value={row?.stake ?? 1}
                              onChange={(e) => upsertInstrument(inst.key, { stake: Number(e.target.value) })} />
                          </div>
                          <div>
                            <Label className="text-xs">Min confidence %</Label>
                            <Input type="number" min={50} max={100} value={row?.min_confidence ?? 70}
                              onChange={(e) => upsertInstrument(inst.key, { min_confidence: Number(e.target.value) })} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* VPS guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> Contabo Windows VPS → Link Botvio + MT5 (24/7)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {/* Your VPS quick reference */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-primary" /><strong>Your Contabo VPS (pre-filled)</strong></div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Server:</span> <code className="font-mono">{CONTABO_VPS_NAME}</code></div>
                <div><span className="text-muted-foreground">IP address:</span> <code className="font-mono select-all">{CONTABO_VPS_IP}</code></div>
                <div><span className="text-muted-foreground">RDP user:</span> <code className="font-mono">Administrator</code></div>
                <div><span className="text-muted-foreground">RDP password:</span> <span className="text-muted-foreground">from your Contabo welcome email</span></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Use these in <code>mstsc</code> (Windows) or Microsoft Remote Desktop (Mac) to log into the server.
              </p>
            </div>

            {/* Security warning about API credentials */}
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-destructive"><ShieldCheck className="h-4 w-4" /><strong>Important — Contabo API credentials</strong></div>
              <p className="text-xs text-muted-foreground">
                Your <strong>Client ID</strong> and <strong>Client Secret</strong> are for the Contabo Cloud API (managing the
                server itself: reboot, rebuild, etc.). <strong>Botvio does NOT need them</strong> for trading — only the VPS
                IP + MT5 + Bridge EA. If you shared that secret anywhere public, rotate it now in Contabo → API → Credentials.
              </p>
            </div>

            <p className="text-muted-foreground">
              You bought a <strong>Contabo Windows VPS</strong> — perfect. Follow the steps below to install MT5,
              attach the <strong>Botvio Bridge EA</strong>, and let auto-trading run 24/7 even when your laptop is off.
              The Botvio Cloud Worker handles Deriv API trades automatically — the VPS is what keeps your MT5 terminal alive.
            </p>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-primary" /><strong>Step 1 — Connect to your Contabo VPS</strong></div>
              <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                <li>Log in at <a className="underline" href="https://my.contabo.com" target="_blank" rel="noopener noreferrer">my.contabo.com</a> → <strong>Your Services</strong> → open your VPS.</li>
                <li>Your IP is <code className="font-mono select-all">{CONTABO_VPS_IP}</code>, user is <code>Administrator</code>, password is in the Contabo welcome email.</li>
                <li>On Windows: press <kbd>Win+R</kbd> → type <code>mstsc</code> → enter <code>{CONTABO_VPS_IP}</code> → connect → paste the password. (On Mac, install <em>Microsoft Remote Desktop</em> from the App Store.)</li>
                <li>Once you see the Windows desktop, you're inside your VPS — it stays online 24/7.</li>
              </ol>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2"><Server className="h-4 w-4 text-primary" /><strong>Step 2 — Install MT5 on the VPS</strong></div>
              <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                <li>Open Edge browser inside the VPS, go to your broker's website (e.g. Deriv, Exness, FBS, Weltrade).</li>
                <li>Download their <strong>MT5 desktop installer</strong> and install it.</li>
                <li>Open MT5 → <strong>File → Login to Trade Account</strong> → enter your account number, password, and pick your broker's server.</li>
                <li>Confirm the green "Connected" status at the bottom-right of MT5.</li>
              </ol>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><strong>Step 3 — Register a new Terminal UID in Botvio</strong></div>
              <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                <li>On your normal computer, open Botvio → <a className="underline" href="/connections">Connections</a> → MT5 Bridge.</li>
                <li>Click <strong>"Add new terminal"</strong>, give it a nickname like <em>"Contabo VPS — Deriv MT5"</em>.</li>
                <li>Botvio will generate a unique <code>BOTVIO_xxxx-N</code> Terminal UID and a <strong>Bridge Secret</strong>. Copy both.</li>
                <li>Toggle <strong>Auto-execute = ON</strong> for that terminal so signals route to the VPS.</li>
              </ol>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /><strong>Step 4 — Install the Botvio Bridge EA on the VPS</strong></div>
              <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                <li>Inside the VPS browser, open <a className="underline" href="https://botvio.live/BOTVIO_BridgeEA.mq5" target="_blank" rel="noopener noreferrer">botvio.live/BOTVIO_BridgeEA.mq5</a> and save the file.</li>
                <li>In MT5: <strong>File → Open Data Folder → MQL5 → Experts</strong>. Drop <code>BOTVIO_BridgeEA.mq5</code> there.</li>
                <li>In MT5: <strong>Tools → Options → Expert Advisors</strong> → tick "Allow Algo Trading", "Allow WebRequest", and add <code>https://tqqkzeblmjapgbnsbtgw.supabase.co</code> to the allowed URLs.</li>
                <li>Open MetaEditor (F4) → right-click <code>BOTVIO_BridgeEA.mq5</code> → <strong>Compile</strong>. It should show 0 errors.</li>
                <li>Back in MT5, drag the EA onto any open chart. In the input dialog paste your <strong>Terminal UID</strong> and <strong>Bridge Secret</strong> from Step 3, then click OK.</li>
                <li>Click the <strong>Algo Trading</strong> button in the MT5 toolbar — it must turn green. A 😊 face on the chart means the EA is live.</li>
              </ol>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><strong>Step 5 — Keep it alive 24/7</strong></div>
              <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                <li>When you're done, <strong>do NOT shut down</strong> the VPS — just close the RDP window (top-right ✕). Windows + MT5 keep running.</li>
                <li>In Windows: Settings → System → Power → set "Sleep" and "Screen off" to <strong>Never</strong>.</li>
                <li>Back in Botvio → <a className="underline" href="/connections">/connections</a>, your terminal should show a green <strong>"Heartbeat ✓ active"</strong> badge within ~10 seconds.</li>
                <li>Now toggle the instruments above to <strong>Enabled = ON</strong> and route = <strong>MT5</strong>. Botvio will push every qualifying signal straight to your VPS — 24/7.</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="https://my.contabo.com" target="_blank" rel="noopener noreferrer">Contabo Dashboard <ExternalLink className="h-3 w-3 ml-1" /></a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/BOTVIO_BridgeEA.mq5" target="_blank" rel="noopener noreferrer">Download Bridge EA <ExternalLink className="h-3 w-3 ml-1" /></a>
              </Button>
              <Button asChild size="sm">
                <a href="/connections">Open MT5 Bridge setup →</a>
              </Button>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Tip: pick a Contabo region close to your broker's server (EU for Deriv/Weltrade, US for Exness US) for the lowest latency.
              Need help? Contact support@botvio.live or +260 966 284 085.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}