import { useEffect, useState } from "react";
import { useDerivTokens, DerivTokenRow } from "@/hooks/useDerivTokens";
import { AccountSwitcher } from "@/components/trading/AccountSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onAddAccount?: () => void;
}

export function DerivAccountsManager({ onAddAccount }: Props) {
  const { tokens, loading, switchToken, removeToken, refetch } = useDerivTokens();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const activate = async (id: string) => {
    setBusyId(id);
    try {
      await switchToken(id);
      toast.success("Deriv account selected");
      window.dispatchEvent(new CustomEvent("deriv:token-updated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not switch Deriv account");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    const account = tokens.find((t) => t.id === id);
    if (!account) return;
    const active = account.is_active;

    const confirmed = window.confirm(
      `Remove ${account.label || account.loginid} (${account.loginid}) from Botvio?\n\nThis removes the saved Deriv connection from Botvio. It does not close your Deriv account.`
    );
    if (!confirmed) return;

    setBusyId(id);
    try {
      await removeToken(id);
      if (active) {
        localStorage.removeItem("deriv_pat_token");
        localStorage.removeItem("deriv_oauth_token");
        window.dispatchEvent(new Event("deriv:token-cleared"));
      }
      toast.success("Deriv account removed from Botvio");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove Deriv account");
    } finally {
      setBusyId(null);
    }
  };

  const sorted = [...tokens].sort((a, b) => Number(b.is_active) - Number(a.is_active));

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Your Deriv Accounts
            </CardTitle>
            <CardDescription className="mt-1">
              Add, switch or remove Deriv accounts here. This is the single place for your Deriv connection.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{tokens.length} saved</Badge>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {onAddAccount && (
              <Button size="sm" onClick={onAddAccount}>
                <Plus className="mr-2 h-4 w-4" />
                Add Deriv account
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && tokens.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Deriv accounts…
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">No Deriv account connected</p>
            <p className="mt-1 text-sm text-muted-foreground">Connect your Deriv account above. You can later add another account and switch between them here.</p>
            {onAddAccount && (
              <Button className="mt-4" onClick={onAddAccount}>
                <Plus className="mr-2 h-4 w-4" /> Connect Deriv
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((account: DerivTokenRow) => (
              <div key={account.id} className={`rounded-xl border p-3 ${account.is_active ? "border-primary/40 bg-primary/5" : "border-border/60"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{account.label || account.loginid}</span>
                      <Badge variant={account.is_virtual ? "secondary" : "default"}>{account.is_virtual ? "DEMO" : "REAL"}</Badge>
                      <Badge variant="outline">{account.currency}</Badge>
                      {account.is_active && <Badge className="bg-success text-success-foreground">ACTIVE</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{account.loginid}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.is_active && (
                      <Button size="sm" variant="outline" onClick={() => activate(account.id)} disabled={busyId !== null}>
                        {busyId === account.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Use this account
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(account.id)}
                      disabled={busyId !== null}
                      title="Remove this Deriv account from Botvio"
                    >
                      {busyId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
          Removing an account only removes Botvio's saved connection. It does not close, delete or change the account at Deriv.
        </div>
      </CardContent>
    </Card>
  );
}
