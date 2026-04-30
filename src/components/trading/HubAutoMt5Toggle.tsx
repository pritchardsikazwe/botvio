import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";

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
        .select("hub_auto_mt5_symbols")
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

  const map = (settings?.hub_auto_mt5_symbols as Record<string, boolean> | null) ?? {};
  const [enabled, setEnabled] = useState<boolean>(!!map[symbol]);

  useEffect(() => {
    setEnabled(!!map[symbol]);
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

  return (
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
            Fire every {label} BUY/SELL signal to your MT5 Bridge — no clicks.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!hasAutoTerminal && (
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
            Enable a terminal first
          </Badge>
        )}
        <Switch
          id={`auto-mt5-${symbol}`}
          checked={enabled}
          disabled={saving || !hasAutoTerminal}
          onCheckedChange={onToggle}
        />
      </div>
    </div>
  );
}