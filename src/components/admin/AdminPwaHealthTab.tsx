import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertTriangle, Smartphone } from "lucide-react";
import {
  APP_VERSION,
  checkForUpdates,
  fetchRemoteVersion,
  subscribeToUpdateState,
  type UpdateState,
} from "@/services/appUpdateService";

const fmt = (ts: number | null) =>
  ts ? new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export const AdminPwaHealthTab = () => {
  const [state, setState] = useState<UpdateState | null>(null);
  const [deployedAt, setDeployedAt] = useState<string | null>(null);
  const [swScope, setSwScope] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => subscribeToUpdateState(setState), []);

  useEffect(() => {
    void (async () => {
      const remote = await fetchRemoteVersion();
      setDeployedAt(remote?.updatedAt ?? null);
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        setSwScope(reg?.scope ?? null);
      }
    })();
  }, []);

  const runCheck = async () => {
    setChecking(true);
    const next = await checkForUpdates(true);
    const remote = await fetchRemoteVersion();
    setDeployedAt(remote?.updatedAt ?? null);
    setState(next);
    setChecking(false);
  };

  const upToDate = !!state && !state.updateReady;

  const rows: Array<[string, string]> = [
    ["Current Version", APP_VERSION],
    ["Service Worker", state?.serviceWorkerVersion ?? (swScope ? APP_VERSION : "not registered")],
    ["Latest Deployment", state?.remoteVersion ?? "unknown"],
    ["Deployed At", deployedAt ? new Date(deployedAt).toLocaleString() : "—"],
    ["Service Worker Scope", swScope ?? "—"],
    ["Last Update Check", fmt(state?.lastCheckedAt ?? null)],
    ["Display Mode", window.matchMedia("(display-mode: standalone)").matches ? "Installed PWA" : "Browser"],
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Botvio PWA Health
          </CardTitle>
          <CardDescription>Version, service worker and auto-update status</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={runCheck} disabled={checking}>
          <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
          Check now
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {upToDate ? (
            <Badge className="gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Up to date
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {state?.updateReady ? "Update available" : "Checking…"}
            </Badge>
          )}
          {state?.lastError && (
            <span className="text-xs text-muted-foreground">{state.lastError}</span>
          )}
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono text-right break-all">{value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Clients check <code>/version.json</code> on startup, on focus, when returning from the
          background and every 15 minutes. Updates activate silently and never sign users out or
          clear saved settings; reloads are deferred while a trade or payment is in progress.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminPwaHealthTab;