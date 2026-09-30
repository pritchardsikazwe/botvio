import { useEffect, useMemo, useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SYNTHETICS } from "@/config/synthetics";
import { Bot, Cloud, ShieldCheck, Activity, Pause, Play, Zap } from "lucide-react";
import { ActivateCloudWorkerWizard } from "@/components/trading/ActivateCloudWorkerWizard";
import { DemoMt5Card } from "@/components/broker/DemoMt5Card";

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

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5 text-primary" /> Need MT5 copy trading?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-muted-foreground">
              Auto-Trade is for Botvio signal automation. For provider/follower copy trading, use the new TradeCopy Cloud connection flow instead of the legacy Bridge EA/VPS setup.
            </p>
            <Button asChild><a href="/connections">Open MT5 TradeCopy</a></Button>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}