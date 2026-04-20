import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Bot, Zap, ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, Power, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface AutoTradePanelProps {
  /** List of assets the user can opt-into for this hub. */
  availableAssets: { displaySymbol: string; label: string; emoji?: string }[];
  /** Hub label, e.g. "Gold & Silver", "Currencies", "Crypto". */
  scope: string;
}

const STAKE_OPTIONS = [1, 5, 10, 25, 50, 100];
const MULTIPLIER_OPTIONS = [10, 30, 50, 100, 200, 500];

export function AutoTradePanel({ availableAssets, scope }: AutoTradePanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Settings state
  const [enabled, setEnabled] = useState(false);
  const [accountType, setAccountType] = useState<"demo" | "real">("demo");
  const [enabledAssets, setEnabledAssets] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(80);
  const [dailyLossLimitPct, setDailyLossLimitPct] = useState(5);
  const [stakeUsd, setStakeUsd] = useState(1);
  const [multiplier, setMultiplier] = useState(100);

  // Load settings
  useEffect(() => {
    if (!user) return;
    supabase
      .from("auto_trade_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setEnabled(!!data.enabled);
        setAccountType((data.account_type as "demo" | "real") ?? "demo");
        setEnabledAssets(data.enabled_assets ?? []);
        setMinConfidence(data.min_confidence ?? 80);
        setDailyLossLimitPct(Number(data.daily_loss_limit_pct ?? 5));
        setStakeUsd(Number(data.stake_usd ?? 1));
        setMultiplier(data.multiplier ?? 100);
      });
  }, [user]);

  // Today's PnL + recent executions
  const { data: pnlData, refetch: refetchPnl } = useQuery({
    queryKey: ["auto-trade-pnl", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.rpc("get_auto_trade_today_pnl", { _user_id: user.id });
      return data?.[0] ?? null;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const { data: recent, refetch: refetchRecent } = useQuery({
    queryKey: ["auto-trade-recent", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("auto_trade_executions")
        .select("id, display_symbol, side, status, outcome, pnl_usd, confidence, signal_tf, created_at, error_message")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const realizedPnl = Number(pnlData?.realized_pnl_usd ?? 0);
  const tradeCount = Number(pnlData?.trade_count ?? 0);
  const winCount = Number(pnlData?.win_count ?? 0);
  const lossLimitUsd = useMemo(() => stakeUsd * dailyLossLimitPct, [stakeUsd, dailyLossLimitPct]);
  const killSwitchHit = realizedPnl <= -lossLimitUsd && realizedPnl < 0;

  const toggleAsset = (sym: string) => {
    setEnabledAssets((prev) => prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]);
  };

  const save = async (overrideEnabled?: boolean) => {
    if (!user) { toast.error("Sign in required"); return; }
    setLoading(true);
    const payload = {
      user_id: user.id,
      enabled: overrideEnabled ?? enabled,
      account_type: accountType,
      enabled_assets: enabledAssets,
      min_confidence: minConfidence,
      daily_loss_limit_pct: dailyLossLimitPct,
      stake_usd: stakeUsd,
      multiplier,
    };
    const { error } = await supabase
      .from("auto_trade_settings")
      .upsert(payload, { onConflict: "user_id" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (overrideEnabled !== undefined) setEnabled(overrideEnabled);
    toast.success(overrideEnabled === false ? "Auto-trader stopped" : "Settings saved");
    refetchPnl(); refetchRecent();
  };

  const handleMasterToggle = async (next: boolean) => {
    if (next && enabledAssets.length === 0) {
      toast.error("Pick at least one asset first");
      return;
    }
    if (next && accountType === "real") {
      const ok = window.confirm(
        "⚠️ You are enabling auto-trading on your REAL Deriv account. Real money will be at risk. Continue?"
      );
      if (!ok) return;
    }
    await save(next);
  };

  if (!user) {
    return (
      <Card className="border border-border/60">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Sign in to enable auto-trading.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${enabled ? "border-success/40 bg-success/5" : "border-border/60 bg-card"}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ring-1 ${enabled ? "bg-success/15 ring-success/40" : "bg-primary/15 ring-primary/30"}`}>
              <Bot className={`h-5 w-5 ${enabled ? "text-success" : "text-primary"}`} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                Auto-Trade Engine · {scope}
                {enabled ? (
                  <Badge variant="outline" className="text-[9px] border-success/40 text-success animate-pulse">
                    <Zap className="h-2.5 w-2.5 mr-0.5" /> RUNNING 24/7
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] border-muted-foreground/30 text-muted-foreground">OFF</Badge>
                )}
                <Badge variant="outline" className={`text-[9px] ${accountType === "real" ? "border-destructive/50 text-destructive" : "border-warning/40 text-warning"}`}>
                  {accountType.toUpperCase()}
                </Badge>
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Executes live-engine M1/M5 scalp signals on your Deriv account the instant they post.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-master" className="text-xs font-bold">{enabled ? "ON" : "OFF"}</Label>
            <Switch id="auto-master" checked={enabled} onCheckedChange={handleMasterToggle} disabled={loading} />
          </div>
        </div>

        {/* Kill-switch banner */}
        {killSwitchHit && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/40">
            <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-extrabold text-destructive">Daily kill-switch active</p>
              <p className="text-[10px] text-muted-foreground">
                Realized P&L ${realizedPnl.toFixed(2)} hit your -{dailyLossLimitPct}% limit. Auto-trading is paused until UTC midnight.
              </p>
            </div>
          </div>
        )}

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <p className="text-[9px] text-muted-foreground uppercase">Today P&L</p>
            <p className={`text-sm font-extrabold ${realizedPnl >= 0 ? "text-success" : "text-destructive"}`}>
              {realizedPnl >= 0 ? "+" : ""}${realizedPnl.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <p className="text-[9px] text-muted-foreground uppercase">Trades</p>
            <p className="text-sm font-extrabold text-foreground">{tradeCount}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <p className="text-[9px] text-muted-foreground uppercase">Wins</p>
            <p className="text-sm font-extrabold text-success">{winCount}</p>
          </div>
        </div>

        {/* Asset toggles */}
        <div>
          <Label className="text-xs font-bold mb-2 block">Allowed assets</Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {availableAssets.map((a) => {
              const isOn = enabledAssets.includes(a.displaySymbol);
              return (
                <Button
                  key={a.displaySymbol}
                  size="sm"
                  variant={isOn ? "default" : "outline"}
                  onClick={() => toggleAsset(a.displaySymbol)}
                  disabled={enabled}
                  className={`h-7 text-[11px] font-bold px-2.5 ${isOn ? "bg-success text-success-foreground" : ""}`}
                >
                  {a.emoji && <span className="mr-1">{a.emoji}</span>}
                  {a.label}
                </Button>
              );
            })}
          </div>
          {enabled && (
            <p className="text-[10px] text-muted-foreground mt-1">Stop the engine to change assets.</p>
          )}
        </div>

        {/* Account type */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={accountType === "demo" ? "default" : "outline"}
            onClick={() => setAccountType("demo")}
            disabled={enabled}
            className="h-8 text-xs font-bold"
          >
            DEMO
          </Button>
          <Button
            size="sm"
            variant={accountType === "real" ? "default" : "outline"}
            onClick={() => setAccountType("real")}
            disabled={enabled}
            className={`h-8 text-xs font-bold ${accountType === "real" ? "bg-destructive text-destructive-foreground" : ""}`}
          >
            <AlertTriangle className="h-3 w-3 mr-1" /> REAL
          </Button>
        </div>

        {/* Stake */}
        <div>
          <Label className="text-xs font-bold mb-1 block">Stake per trade (USD): <span className="text-primary">${stakeUsd}</span></Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STAKE_OPTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={stakeUsd === s ? "default" : "outline"}
                onClick={() => setStakeUsd(s)}
                disabled={enabled}
                className="h-7 text-[11px] font-bold px-2.5"
              >
                ${s}
              </Button>
            ))}
          </div>
        </div>

        {/* Multiplier */}
        <div>
          <Label className="text-xs font-bold mb-1 block">Multiplier (leverage): <span className="text-primary">x{multiplier}</span></Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {MULTIPLIER_OPTIONS.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={multiplier === m ? "default" : "outline"}
                onClick={() => setMultiplier(m)}
                disabled={enabled}
                className="h-7 text-[11px] font-bold px-2.5"
              >
                x{m}
              </Button>
            ))}
          </div>
        </div>

        {/* Min confidence */}
        <div>
          <Label className="text-xs font-bold mb-1 block">Min signal confidence: <span className="text-primary">{minConfidence}%</span></Label>
          <Slider value={[minConfidence]} min={50} max={100} step={5} onValueChange={(v) => setMinConfidence(v[0])} disabled={enabled} />
        </div>

        {/* Daily loss limit */}
        <div>
          <Label className="text-xs font-bold mb-1 block">Daily loss kill-switch: <span className="text-destructive">-{dailyLossLimitPct}%</span> (≈ -${(stakeUsd * dailyLossLimitPct).toFixed(2)})</Label>
          <Slider value={[dailyLossLimitPct]} min={1} max={50} step={1} onValueChange={(v) => setDailyLossLimitPct(v[0])} disabled={enabled} />
        </div>

        {/* Save button */}
        {!enabled && (
          <Button onClick={() => save()} disabled={loading} className="w-full h-9 text-xs font-bold">
            Save settings
          </Button>
        )}
        {enabled && (
          <Button onClick={() => handleMasterToggle(false)} disabled={loading} variant="destructive" className="w-full h-9 text-xs font-bold gap-1.5">
            <Power className="h-3.5 w-3.5" /> Stop & disable auto-trader
          </Button>
        )}

        {/* Recent executions */}
        {recent && recent.length > 0 && (
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-primary" /> Recent auto-trades
            </p>
            <div className="space-y-1.5">
              {recent.map((r: any) => {
                const isWin = r.outcome === "win";
                const isLoss = r.outcome === "loss";
                const Icon = r.side === "BUY" ? TrendingUp : TrendingDown;
                return (
                  <div key={r.id} className="flex items-center justify-between text-[10px] bg-muted/30 rounded px-2 py-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`h-3 w-3 ${r.side === "BUY" ? "text-success" : "text-destructive"} shrink-0`} />
                      <span className="font-bold text-foreground truncate">{r.display_symbol}</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0">{r.signal_tf}</Badge>
                      <Badge variant="outline" className="text-[8px] px-1 py-0">{r.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.pnl_usd != null && (
                        <span className={`font-mono font-bold ${isWin ? "text-success" : isLoss ? "text-destructive" : "text-muted-foreground"}`}>
                          {Number(r.pnl_usd) >= 0 ? "+" : ""}${Number(r.pnl_usd).toFixed(2)}
                        </span>
                      )}
                      <span className="text-muted-foreground">{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-[9px] text-muted-foreground leading-relaxed pt-1">
          ⚠️ Auto-trading carries real risk. Test on DEMO first. The robot uses Deriv Multipliers with built-in stop-loss/take-profit. Daily kill-switch halts trading if loss limit is hit.
        </p>
      </CardContent>
    </Card>
  );
}
