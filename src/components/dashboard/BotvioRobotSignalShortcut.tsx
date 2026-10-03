import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot, Link2, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { directAction, useMyMt5Accounts } from "@/hooks/useDirectExecution";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function BotvioRobotSignalShortcut() {
  const { user } = useAuth();
  const { data: accounts, isLoading, refetch } = useMyMt5Accounts();
  const [busy, setBusy] = useState<string | null>(null);

  if (!user) return null;

  const followers = (accounts ?? []).filter(
    (a) => a.account_role === "slave" && a.tradecopy_user_id && a.is_active !== false
  );
  const active = followers.find((a) => a.direct_signal_enabled) ?? followers[0];

  const toggle = async (enabled: boolean) => {
    if (!active) return;
    setBusy(active.id);
    try {
      await directAction(enabled ? "enable" : "disable", {
        account_id: active.id,
        lot: Number(active.direct_lot ?? 0.01),
        min_confidence: Number(active.direct_min_confidence ?? 70),
      });
      toast({
        title: enabled ? "Botvio Robot signals enabled" : "Botvio Robot signals paused",
        description: enabled
          ? "Eligible Botvio signals will now be sent automatically to this MT5 account through TradeCopy."
          : "Automatic Botvio signal delivery is paused for this account.",
      });
      await refetch();
    } catch (e) {
      toast({
        title: "Could not update signal delivery",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-primary/25 bg-gradient-to-r from-primary/10 via-background to-background">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold">Botvio Robot → My MT5</h2>
                <Badge variant="outline" className="border-primary/30 text-[9px] text-primary">QUICK CONNECT</Badge>
                {active?.direct_signal_enabled && (
                  <Badge className="bg-success/15 text-success hover:bg-success/15 text-[9px]">AUTO SIGNALS ON</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect your MT5 once, then receive eligible Botvio Robot BUY/SELL signals automatically.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-xs text-muted-foreground">Checking MT5 connection…</div>
          ) : !active ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild className="font-bold">
                <Link to="/connections">
                  <Link2 className="mr-1.5 h-3.5 w-3.5" /> Connect MT5
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/botvio-robot">View Robot <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                <p className="text-xs font-semibold">{active.label || "My MT5 Account"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {active.broker || "MT5"} · {active.login_id} · {active.server}
                </p>
              </div>
              <Badge variant="outline" className="text-[9px]">{active.environment || "DEMO"}</Badge>
              {!active.tradecopy_active ? (
                <Button size="sm" asChild className="font-bold">
                  <Link to="/connections">Activate connection <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                    <Zap className={`h-3.5 w-3.5 ${active.direct_signal_enabled ? "text-success" : "text-muted-foreground"}`} />
                    <span className="text-[10px] font-semibold">Botvio Robot Signals</span>
                    <Switch
                      checked={!!active.direct_signal_enabled}
                      disabled={busy === active.id}
                      onCheckedChange={toggle}
                      aria-label="Receive Botvio Robot signals automatically"
                    />
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/connections">Manage</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-success" /> TradeCopy execution</span>
          <span>•</span>
          <span>No Bridge EA required</span>
          <span>•</span>
          <span>Demo-first recommended</span>
        </div>
      </CardContent>
    </Card>
  );
}
