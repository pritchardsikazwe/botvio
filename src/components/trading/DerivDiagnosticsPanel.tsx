import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeriv } from "@/contexts/DerivContext";
import { Activity, RefreshCw } from "lucide-react";
import { useState } from "react";

const READY_STATES = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];

export const DerivDiagnosticsPanel = () => {
  const {
    status, isDerivConnected, accountId, environment, socketReadyState,
    lastHeartbeat, error, connectedAt, refreshDerivConnection,
  } = useDeriv();
  const [checking, setChecking] = useState(false);

  const rows: [string, string][] = [
    ["Status", status],
    ["Environment", environment === "prod" ? "Production" : "—"],
    ["Account", accountId ?? "—"],
    ["WebSocket", READY_STATES[socketReadyState] ?? "CLOSED"],
    ["Authorization", isDerivConnected ? "Authorized" : "Not authorized"],
    ["Connected since", connectedAt ? new Date(connectedAt).toLocaleString() : "—"],
    ["Last heartbeat", lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : "—"],
    ["Last error", error ?? "None"],
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Connection Diagnostics
        </CardTitle>
        <CardDescription>Live Deriv connection state used by all trading surfaces</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={isDerivConnected
              ? "bg-success/10 text-success border-success/20"
              : "bg-destructive/10 text-destructive border-destructive/20"}
          >
            {isDerivConnected ? "Deriv Connected" : "Deriv Disconnected"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            disabled={checking}
            onClick={async () => {
              setChecking(true);
              await refreshDerivConnection().catch(() => false);
              setChecking(false);
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${checking ? "animate-spin" : ""}`} /> Re-check
          </Button>
        </div>
        <dl className="divide-y divide-border/60 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium text-right break-all">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};