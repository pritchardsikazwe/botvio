import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Server, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DemoCfg {
  enabled: boolean;
  terminal_uid: string;
  max_lot: number;
  note?: string;
  // Public credentials displayed to traders so they can log in to MT5 mobile/desktop
  public_email?: string;
  mt5_login?: string;
  mt5_server?: string;
  mt5_password?: string;
  broker_name?: string;
  daily_send_limit?: number;
}

/**
 * Admin card to configure the shared "Demo MT5" terminal.
 * Stored in app_settings under key="demo_mt5".
 */
export function AdminDemoMt5Card() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<DemoCfg>({ enabled: false, terminal_uid: "", max_lot: 0.01 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usageCount, setUsageCount] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    const [{ data: row }, { count }] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "demo_mt5").maybeSingle(),
      supabase.from("user_settings").select("user_id", { count: "exact", head: true }).eq("use_demo_mt5", true),
    ]);
    const v = (row?.value ?? {}) as Partial<DemoCfg>;
    setCfg({
      enabled: !!v.enabled,
      terminal_uid: v.terminal_uid ?? "",
      max_lot: Number(v.max_lot) || 0.01,
      note: v.note,
      public_email: v.public_email ?? "",
      mt5_login: v.mt5_login ?? "",
      mt5_server: v.mt5_server ?? "",
      mt5_password: v.mt5_password ?? "",
      broker_name: v.broker_name ?? "",
      daily_send_limit: Number(v.daily_send_limit) || 5,
    });
    setUsageCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (cfg.enabled && !cfg.terminal_uid.trim()) {
      toast({ title: "Terminal UID required", description: "Enter the VPS terminal UID before enabling.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        {
          key: "demo_mt5",
          value: {
            enabled: cfg.enabled,
            terminal_uid: cfg.terminal_uid.trim(),
            max_lot: Number(cfg.max_lot) || 0.01,
            note: cfg.note ?? "Shared demo MT5 terminal running on Botvio VPS",
            public_email: cfg.public_email?.trim() || "",
            mt5_login: cfg.mt5_login?.trim() || "",
            mt5_server: cfg.mt5_server?.trim() || "",
            mt5_password: cfg.mt5_password ?? "",
            broker_name: cfg.broker_name?.trim() || "",
            daily_send_limit: Number(cfg.daily_send_limit) || 5,
          },
        },
        { onConflict: "key" },
      );
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Demo MT5 settings saved" });
    load();
  };

  return (
    <Card className="glass-card border-amber-500/30">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-400" />
              Shared Demo MT5
              <Badge variant={cfg.enabled ? "default" : "secondary"} className="ml-2">
                {cfg.enabled ? "ACTIVE" : "OFF"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Lets users without their own MT5 try auto-execute against your VPS demo terminal.
              Strict cap: 0.01 lot recommended.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {usageCount} user{usageCount === 1 ? "" : "s"} opted in
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="demo-uid">VPS Terminal UID</Label>
                <Input
                  id="demo-uid"
                  placeholder="BOTVIO_DEMO_VPS"
                  value={cfg.terminal_uid}
                  onChange={(e) => setCfg({ ...cfg, terminal_uid: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Must match the EA's <code>TerminalUID</code> on the VPS demo MT5.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-lot">Max lot per trade</Label>
                <Input
                  id="demo-lot"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cfg.max_lot}
                  onChange={(e) => setCfg({ ...cfg, max_lot: Number(e.target.value) })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Volume above this is clamped down server-side.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Enable Demo MT5</p>
                <p className="text-xs text-muted-foreground">
                  When ON, opted-in users route their hub auto-send signals here.
                </p>
              </div>
              <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
            </div>

            <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
              <p className="text-sm font-semibold">Public credentials shown to traders</p>
              <p className="text-[11px] text-muted-foreground">
                Displayed on Trading Hubs / Deriv API / Automation pages so users can log in to MT5
                mobile/desktop and watch trades land. Use a <strong>read-only investor password</strong>.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="demo-broker">Broker</Label>
                  <Input id="demo-broker" placeholder="Deriv MT5"
                    value={cfg.broker_name ?? ""}
                    onChange={(e) => setCfg({ ...cfg, broker_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="demo-email">Public contact email</Label>
                  <Input id="demo-email" placeholder="demo@botvio.live"
                    value={cfg.public_email ?? ""}
                    onChange={(e) => setCfg({ ...cfg, public_email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="demo-login">MT5 Login</Label>
                  <Input id="demo-login" placeholder="12345678"
                    value={cfg.mt5_login ?? ""}
                    onChange={(e) => setCfg({ ...cfg, mt5_login: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="demo-server">MT5 Server</Label>
                  <Input id="demo-server" placeholder="DerivBVI-Demo"
                    value={cfg.mt5_server ?? ""}
                    onChange={(e) => setCfg({ ...cfg, mt5_server: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="demo-password">MT5 Investor Password</Label>
                  <Input id="demo-password" placeholder="read-only password"
                    value={cfg.mt5_password ?? ""}
                    onChange={(e) => setCfg({ ...cfg, mt5_password: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="demo-limit">Daily send limit / user</Label>
                  <Input id="demo-limit" type="number" min={1} step={1}
                    value={cfg.daily_send_limit ?? 5}
                    onChange={(e) => setCfg({ ...cfg, daily_send_limit: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save settings"}
              </Button>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
              <strong className="text-amber-400">Heads up:</strong> All opted-in users share this single MT5
              terminal. Use a real broker <em>demo</em> account only — never a live one. Trades will appear
              in <code>mt5_commands</code> tagged <code>source: demo:*</code> with the user's ID for audit.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}