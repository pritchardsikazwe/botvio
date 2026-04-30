import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap, Server, FlaskConical } from "lucide-react";

interface Props {
  /** Hub symbol key, e.g. "XAUUSD", "BTCUSD", "EURUSD" */
  symbol: string;
  /** Friendly label, e.g. "Gold (XAU/USD)" */
  label: string;
}

/**
 * Per-instrument "Auto-send to MT5" toggle.
 * Stores `{ [symbol]: true }` in `user_settings.hub_auto_mt5_symbols`.
 * When ON + auto-execute terminal exists, BUY/SELL signals fire to MT5
 * automatically with no manual click.
 */
export function HubAutoMt5Toggle({ symbol, label }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["user-settings-auto-mt5", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("hub_auto_mt5_symbols, use_demo_mt5")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: hasAutoTerminal } = useQuery({
    queryKey: ["mt5-auto-terminal", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_mt5_terminals")
        .select("id")
        .eq("user_id", user!.id)
        .eq("auto_execute", true)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  // Is the shared demo MT5 currently enabled by admin?
  const { data: demoCfg } = useQuery({
    queryKey: ["demo-mt5-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "demo_mt5")
        .maybeSingle();
      const v = (data?.value ?? {}) as { enabled?: boolean; terminal_uid?: string; max_lot?: number };
      return {
        enabled: !!v.enabled && !!v.terminal_uid,
        max_lot: Number(v.max_lot) || 0.01,
      };
    },
    refetchInterval: 60_000,
  });

  const map = (settings?.hub_auto_mt5_symbols as Record<string, boolean> | null) ?? {};
  const [enabled, setEnabled] = useState<boolean>(!!map[symbol]);
  const [useDemo, setUseDemo] = useState<boolean>(!!settings?.use_demo_mt5);

  useEffect(() => {
    setEnabled(!!map[symbol]);
    setUseDemo(!!settings?.use_demo_mt5);
  }, [settings, symbol]);

  const onToggle = async (next: boolean) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Log in to enable auto-execute.", variant: "destructive" });
      return;
    }
    setEnabled(next);
    setSaving(true);
    const newMap = { ...map, [symbol]: next };
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, hub_auto_mt5_symbols: newMap }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setEnabled(!next);
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["user-settings-auto-mt5", user.id] });
    qc.invalidateQueries({ queryKey: ["hub-auto-mt5", user.id, symbol] });
    toast({
      title: next ? `Auto-send to MT5 ON · ${label}` : `Auto-send to MT5 OFF · ${label}`,
      description: next
        ? "BUY/SELL signals will fire to MT5 automatically."
        : "Signals will no longer auto-route to MT5 for this instrument.",
    });
  };

  const onToggleDemo = async (next: boolean) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setUseDemo(next);
    setSaving(true);
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, use_demo_mt5: next }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setUseDemo(!next);
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["user-settings-auto-mt5", user.id] });
    toast({
      title: next ? "Demo MT5 ON" : "Demo MT5 OFF",
      description: next
        ? `Signals will route to the shared Botvio demo MT5 (max ${demoCfg?.max_lot ?? 0.01} lot).`
        : "Signals will no longer route to the demo MT5.",
    });
  };

  const canRoute = hasAutoTerminal || (useDemo && !!demoCfg?.enabled);

  return (
    <div className="space-y-2">
      {/* Auto-send toggle */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-md bg-primary/10 p-2">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <Label htmlFor={`auto-mt5-${symbol}`} className="text-sm font-semibold cursor-pointer">
              Auto-send to MT5
            </Label>
            <p className="text-xs text-muted-foreground truncate">
              Fire every {label} BUY/SELL signal to MT5 — no clicks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!canRoute && (
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
              Enable MT5 below
            </Badge>
          )}
          <Switch
            id={`auto-mt5-${symbol}`}
            checked={enabled}
            disabled={saving || !canRoute}
            onCheckedChange={onToggle}
          />
        </div>
      </div>

      {/* Shared demo MT5 — only show when admin has it enabled and user has no personal terminal */}
      {!hasAutoTerminal && demoCfg?.enabled && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-md bg-amber-500/15 p-2">
              <Server className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <Label htmlFor={`demo-mt5-${symbol}`} className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                Try with Demo MT5
                <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">SHARED</Badge>
              </Label>
              <p className="text-xs text-muted-foreground truncate">
                Routes to Botvio's VPS demo terminal · max {demoCfg.max_lot} lot · no install.
              </p>
            </div>
          </div>
          <Switch
            id={`demo-mt5-${symbol}`}
            checked={useDemo}
            disabled={saving}
            onCheckedChange={onToggleDemo}
          />
        </div>
      )}

      {/* Paper-trade hint */}
      {!canRoute && (
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5">
          <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            No MT5 connected — signals are recorded as <span className="font-semibold text-foreground">paper trades</span> so you can track performance.
          </p>
        </div>
      )}
    </div>
  );
}