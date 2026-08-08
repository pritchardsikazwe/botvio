import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useDeriv } from "@/contexts/DerivContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { symbolDiagnostics } from "@/services/deriv/derivSymbols";
import { Activity, Loader2, RefreshCw, Stethoscope } from "lucide-react";

const maskAccount = (id?: string | null) => {
  if (!id) return "—";
  if (id.length <= 4) return id;
  return `${id.slice(0, 3)}••••${id.slice(-3)}`;
};

const fmtTime = (ts?: number | null) => (ts ? new Date(ts).toLocaleTimeString() : "—");

/**
 * Single global Deriv status bar. Shown at the top of every trading page so the
 * connection state, account and balance are always visible.
 */
export const DerivConnectionBar = ({ className }: { className?: string }) => {
  const {
    status, isDerivConnected, isDerivReady, authorized, accountId, accountType,
    environment, balance, lastHeartbeat, lastError, socketReadyState,
    activeTickSymbols, activeContractIds, refreshDerivConnection, initializing,
  } = useDeriv() as any;
  const { isAdmin } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [, tick] = useState(0);

  // keep "last heartbeat" relative text fresh
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 5000);
    return () => window.clearInterval(t);
  }, []);

  const state: "connected" | "connecting" | "error" | "disconnected" =
    initializing || status === "connecting"
      ? "connecting"
      : isDerivReady ?? isDerivConnected
        ? "connected"
        : lastError
          ? "error"
          : "disconnected";

  const dot = {
    connected: "bg-success",
    connecting: "bg-amber-500 animate-pulse",
    error: "bg-destructive",
    disconnected: "bg-muted-foreground",
  }[state];

  const label = {
    connected: "Deriv connected",
    connecting: "Connecting to Deriv…",
    error: "Connection problem",
    disconnected: "Deriv disconnected",
  }[state];

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshDerivConnection?.(); } finally { setRefreshing(false); }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 backdrop-blur",
        className,
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
        {label}
      </span>

      {state === "connected" && (
        <>
          <Badge variant="outline" className="text-[10px]">
            {maskAccount(accountId)}{accountType ? ` · ${accountType}` : ""}
          </Badge>
          <span className="text-sm font-semibold tabular-nums">
            {balance ? `${balance.currency} ${Number(balance.balance ?? 0).toFixed(2)}` : "—"}
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1 hidden sm:inline">Refresh</span>
        </Button>

        {state !== "connected" && (
          <Button size="sm" variant="gold" asChild>
            <Link to="/connections">Reconnect</Link>
          </Button>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Stethoscope className="h-3.5 w-3.5" />
              <span className="ml-1 hidden sm:inline">Diagnostics</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Connection diagnostics
              </DialogTitle>
              <DialogDescription>
                Live state of your Deriv session. No credentials are shown here.
              </DialogDescription>
            </DialogHeader>
            <dl className="space-y-2 text-xs">
              {[
                ["API connection", state === "connected" ? "Online" : label],
                ["Authorization", authorized ? "Authorized" : "Not authorized"],
                ["WebSocket", socketReadyState === 1 ? "Open" : socketReadyState === 0 ? "Connecting" : "Closed"],
                ["Account", maskAccount(accountId)],
                ["Account type", accountType ?? "—"],
                ["Environment", environment === "prod" ? "Production" : environment ?? "—"],
                ["Last heartbeat", fmtTime(lastHeartbeat)],
                ["Tick subscriptions", (activeTickSymbols ?? []).join(", ") || "none"],
                ["Contract subscriptions", String((activeContractIds ?? []).length)],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium break-all">{v as string}</dd>
                </div>
              ))}
            </dl>

            {lastError && (
              <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{lastError}</p>
            )}

            {isAdmin && (
              <details className="rounded-md border border-border/60 p-2 text-[11px]">
                <summary className="cursor-pointer font-medium">Developer details</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-muted-foreground">
{JSON.stringify(
  {
    lastSymbolRequest: symbolDiagnostics.lastRequest,
    lastSymbolResponseAt: fmtTime(symbolDiagnostics.lastResponseAt),
    lastSymbolError: symbolDiagnostics.lastError,
    socketReadyState,
    status,
  },
  null,
  2,
)}
                </pre>
              </details>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};