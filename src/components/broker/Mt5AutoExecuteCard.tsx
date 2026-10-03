import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Power, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { directAction, useMyMt5Accounts } from "@/hooks/useDirectExecution";

/**
 * TradeCopy MT5 auto-execution.
 * This component intentionally has no Bridge EA, terminal UID, VPS, or
 * user_mt5_terminals dependency. Users connect their MT5 account through the
 * TradeCopy Connections Center, where it becomes a follower account.
 */
export function Mt5AutoExecuteCard() {
  const { user } = useAuth();
  const { data: accounts, isLoading, refetch } = useMyMt5Accounts();
  const [busy, setBusy] = useState<string | null>(null);

  if (!user) return null;

  const followers = (accounts ?? []).filter((a) => a.account_role === "slave" && a.tradecopy_user_id);
  const toggle = async (account: any, enabled: boolean) => {
    setBusy(account.id);
    try {
      await directAction(enabled ? "enable" : "disable", {
        account_id: account.id,
        lot: Number(account.direct_lot ?? 0.01),
        min_confidence: Number(account.direct_min_confidence ?? 70),
      });
      toast({
        title: enabled ? "TradeCopy auto-execution ON" : "TradeCopy auto-execution OFF",
        description: enabled
          ? `${account.label || "MT5 account"} will receive eligible Botvio signals through TradeCopy.`
          : "Botvio signals will no longer be sent directly to this follower.",
      });
      await refetch();
    } catch (e) {
      toast({ title: "TradeCopy update failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5 space-y-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-base font-bold">MT5 Auto-Execute</h3>
            <p className="text-xs text-muted-foreground">
              Botvio BUY/SELL signals are executed through your connected TradeCopy MT5 follower.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
          TRADECOPY
        </Badge>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />
        No Bridge EA, terminal UID, VPS or MT5 terminal polling is required for this execution route.
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading TradeCopy MT5 followers…</p>
      ) : followers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm font-medium">No TradeCopy follower connected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect your Deriv MT5 account under the TradeCopy Connections Center, link it to Botvio Robot or a provider, then activate copying.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {followers.map((account) => (
            <div key={account.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 bg-background/40">
              <div className="min-w-[180px] flex-1">
                <div className="font-semibold text-sm">{account.label || "MT5 follower"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {account.broker || "MT5"} · {account.login_id} · {account.server}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">{account.environment || "DEMO"}</Badge>
              <span className="text-[10px] text-muted-foreground">
                {account.direct_lot ?? 0.01} lot · ≥{account.direct_min_confidence ?? 70}%
              </span>
              <Switch
                checked={!!account.direct_signal_enabled}
                disabled={busy === account.id || !account.tradecopy_active}
                onCheckedChange={(value) => toggle(account, value)}
              />
              <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={!!busy}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh
              </Button>
              <Power className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
