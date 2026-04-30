import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Loader2, Send, Server, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DemoCfg {
  enabled: boolean;
  terminal_uid: string;
  max_lot: number;
  note?: string;
  public_email?: string;
  mt5_login?: string;
  mt5_server?: string;
  mt5_password?: string;
  broker_name?: string;
  daily_send_limit?: number;
}

interface Props {
  /** Symbol the page is showing, e.g. "XAUUSD" */
  symbol?: string | null;
  /** Optional Stop-Loss price */
  sl?: number | null;
  /** Optional Take-Profit price */
  tp?: number | null;
  /** Source tag for audit, e.g. "gold-hub" */
  source?: string;
}

/**
 * Public-facing Demo MT5 card. Shows shared MT5 credentials so any trader can
 * log in to MT5 mobile/desktop and watch the bot trade. Provides "Send Test
 * BUY/SELL to Demo MT5" buttons (rate-limited per user, server-side).
 */
export function DemoMt5Card({ symbol, sl, tp, source = "demo-card" }: Props) {
  const { user } = useAuth();
  const [cfg, setCfg] = useState<DemoCfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"BUY" | "SELL" | null>(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("app_settings").select("value").eq("key", "demo_mt5").maybeSingle();
      if (!active) return;
      setCfg((data?.value ?? null) as DemoCfg | null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  if (loading) return null;
  if (!cfg?.enabled || !cfg.terminal_uid) return null;

  const copy = (label: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast({ title: `${label} copied` });
  };

  const send = async (direction: "BUY" | "SELL") => {
    if (!user) {
      toast({ title: "Sign in to test the bot", variant: "destructive" });
      return;
    }
    if (!symbol) {
      toast({ title: "No symbol on this page", variant: "destructive" });
      return;
    }
    setBusy(direction);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No active session");
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/queue-hub-trade`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          symbol, direction,
          sl: typeof sl === "number" && sl > 0 ? sl : undefined,
          tp: typeof tp === "number" && tp > 0 ? tp : undefined,
          source, use_demo: true,
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.hint ?? json?.error ?? "Demo send failed");
      toast({
        title: `Demo ${direction} sent to MT5`,
        description: `${symbol} • ${json.volume} lot. Log in to MT5 with the credentials below to watch it.`,
      });
    } catch (e: any) {
      toast({ title: "Demo MT5 send failed", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const Field = ({ label, value, mask }: { label: string; value?: string; mask?: boolean }) => {
    if (!value) return null;
    const display = mask && !showPass ? "••••••••" : value;
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/40 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-sm font-mono truncate">{display}</p>
        </div>
        <div className="flex gap-1">
          {mask && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowPass((s) => !s)}>
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(label, value)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-card border-amber-500/30">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="w-4 h-4 text-amber-400" />
              Try the Botvio Bot on a Shared Demo MT5
              <Badge className="ml-1 bg-amber-500/20 text-amber-300 border-amber-500/30">FREE</Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              Log in to MT5 with the demo credentials below, then click <strong>Send Test</strong> to
              push a live signal to our VPS terminal and watch it execute on your screen.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Broker" value={cfg.broker_name} />
          <Field label="Contact email" value={cfg.public_email} />
          <Field label="MT5 Login" value={cfg.mt5_login} />
          <Field label="MT5 Server" value={cfg.mt5_server} />
          <Field label="Investor Password (read-only)" value={cfg.mt5_password} mask />
          <Field label="Terminal UID" value={cfg.terminal_uid} />
        </div>

        {symbol && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mr-auto">
              Send a real test signal for <strong>{symbol}</strong> to the demo MT5
              {cfg.daily_send_limit ? ` · ${cfg.daily_send_limit}/day per user` : ""}:
            </p>
            <Button
              size="sm" onClick={() => send("BUY")} disabled={!!busy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {busy === "BUY"
                ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Test BUY
            </Button>
            <Button
              size="sm" onClick={() => send("SELL")} disabled={!!busy}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {busy === "SELL"
                ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Test SELL
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          ⚠️ Investor password is read-only — you can watch trades but cannot place or close them. Trades
          execute on a Botvio-owned demo account; results don't reflect your personal performance.
        </p>
      </CardContent>
    </Card>
  );
}