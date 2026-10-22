import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

export const MASTER_BLOCKED_KEY = "master_auto_send_blocked";
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

const COMMON = [
  "XAUUSD", "XAGUSD", "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "USDJPY",
  "US30", "NAS100", "GER40", "Volatility 75 Index", "Boom 1000 Index", "Crash 1000 Index", "GainX 400",
];
const LABELS: Record<string, string> = { XAUUSD: "Gold", XAGUSD: "Silver", BTCUSD: "Bitcoin", ETHUSD: "Ethereum" };

/** Admin control: choose which markets are auto-sent to the MT5 master accounts. */
export function AdminMasterMarketsCard() {
  const qc = useQueryClient();
  const [blocked, setBlocked] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  const { data: saved, isLoading } = useQuery({
    queryKey: ["admin-master-blocked"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", MASTER_BLOCKED_KEY).maybeSingle();
      return ((data?.value as { blocked?: string[] } | null)?.blocked ?? []) as string[];
    },
  });
  useEffect(() => { if (saved) setBlocked(saved); }, [saved]);

  const { data: recent } = useQuery({
    queryKey: ["admin-master-recent-symbols"],
    queryFn: async () => {
      const { data } = await supabase.from("trading_signals").select("symbol")
        .gte("created_at", new Date(Date.now() - 3 * 864e5).toISOString()).limit(500);
      return [...new Set((data ?? []).map((r: any) => String(r.symbol)))];
    },
  });

  const markets = useMemo(() => {
    const seen = new Map<string, string>();
    [...COMMON, ...(recent ?? []), ...blocked].forEach((s) => { if (!seen.has(norm(s))) seen.set(norm(s), s); });
    return [...seen.values()];
  }, [recent, blocked]);

  const isBlocked = (s: string) => blocked.some((b) => norm(b) === norm(s));
  const toggleMarket = (s: string, on: boolean) =>
    setBlocked((prev) => on ? prev.filter((b) => norm(b) !== norm(s)) : [...prev, s]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_upsert_app_setting", {
        p_key: MASTER_BLOCKED_KEY,
        p_value: { blocked },
        p_description: "Markets that are never auto-sent to MT5 master accounts",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-master-blocked"] }); toast.success("Master markets saved"); },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Master auto-send markets</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn a market off to stop its signals opening trades on the MT5 master (and its followers). Signals still show on the site.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {markets.map((s) => (
            <label key={s} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{LABELS[norm(s)] ? `${LABELS[norm(s)]} (${s})` : s}</span>
              <Switch checked={!isBlocked(s)} onCheckedChange={(v) => toggleMarket(s, v)} disabled={isLoading} aria-label={`Auto-send ${s}`} />
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Block another market, e.g. XAGUSD" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <Button variant="outline" onClick={() => { if (custom.trim() && !isBlocked(custom)) setBlocked((p) => [...p, custom.trim()]); setCustom(""); }}>Block</Button>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading}>{save.isPending ? "Saving…" : "Save"}</Button>
      </CardContent>
    </Card>
  );
}
