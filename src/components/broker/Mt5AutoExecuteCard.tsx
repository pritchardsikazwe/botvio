import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Zap, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MT5_SYMBOL_MIN_LOT } from "@/lib/mt5MinLot";

interface TerminalRow {
  id: string;
  terminal_uid: string;
  nickname: string | null;
  default_lot: number;
  auto_execute: boolean;
  last_seen_at: string | null;
}

/**
 * Lets users register their MT5 Bridge EA Terminal UID and enable
 * auto-execute, so trading hub signals route to that MT5 account.
 */
export function Mt5AutoExecuteCard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<TerminalRow[]>([]);
  const [newUid, setNewUid] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newLot, setNewLot] = useState("0.01");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_mt5_terminals")
      .select("id, terminal_uid, nickname, default_lot, auto_execute, last_seen_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load terminals", description: error.message, variant: "destructive" });
      return;
    }
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, [user?.id]);

  const addTerminal = async () => {
    if (!user) return;
    const uid = newUid.trim();
    if (!uid) {
      toast({ title: "Enter your Terminal UID", variant: "destructive" });
      return;
    }
    const lot = parseFloat(newLot);
    setBusy(true);
    const { error } = await supabase.from("user_mt5_terminals").insert({
      user_id: user.id,
      terminal_uid: uid,
      nickname: newNickname.trim() || null,
      default_lot: Number.isFinite(lot) && lot > 0 ? lot : 0.01,
      auto_execute: true,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Could not save terminal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Terminal linked — auto-execute is ON" });
    setNewUid(""); setNewNickname(""); setNewLot("0.01");
    load();
  };

  const toggleAuto = async (row: TerminalRow, value: boolean) => {
    const { error } = await supabase
      .from("user_mt5_terminals")
      .update({ auto_execute: value })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, auto_execute: value } : r)));
  };

  const updateLot = async (row: TerminalRow, val: string) => {
    const lot = parseFloat(val);
    if (!Number.isFinite(lot) || lot <= 0) return;
    const { error } = await supabase
      .from("user_mt5_terminals")
      .update({ default_lot: lot })
      .eq("id", row.id);
    if (error) return;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, default_lot: lot } : r)));
  };

  const removeRow = async (row: TerminalRow) => {
    const { error } = await supabase.from("user_mt5_terminals").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  if (!user) return null;

  return (
    <Card className="p-5 space-y-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-base font-bold">MT5 Auto-Execute</h3>
            <p className="text-xs text-muted-foreground">
              Trading hub signals (Gold, Bitcoin, Forex, Stocks…) route to your MT5 Bridge EA.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
          <Zap className="h-3 w-3 mr-1" /> BRIDGE
        </Badge>
      </div>

      {/* Add new terminal */}
      <div className="space-y-2 rounded-lg border border-dashed border-primary/30 p-3 bg-background/30">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Add MT5 terminal</Label>
        <div className="grid gap-2 md:grid-cols-[1fr_140px_100px_auto]">
          <Input
            placeholder="Terminal UID (from Bridge EA)"
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
          />
          <Input
            placeholder="Nickname (optional)"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
          />
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Lot"
            value={newLot}
            onChange={(e) => setNewLot(e.target.value)}
          />
          <Button onClick={addTerminal} disabled={busy}>
            <Plus className="h-4 w-4 mr-1" /> Link
          </Button>
        </div>
      </div>

      {/* Existing terminals */}
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No MT5 terminals linked yet. Install the Bridge EA, copy its Terminal UID, and link it above to enable auto-execution.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 bg-background/40">
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold text-sm">{row.nickname || "MT5 Terminal"}</div>
                <code className="text-[10px] text-muted-foreground break-all">{row.terminal_uid}</code>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Lot</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={row.default_lot}
                  onBlur={(e) => updateLot(row, e.target.value)}
                  className="w-20 h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Auto</Label>
                <Switch
                  checked={row.auto_execute}
                  onCheckedChange={(v) => toggleAuto(row, v)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row)}
                aria-label="Remove terminal"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70">
        Signals at ≥70% confidence will be queued instantly. Your EA picks them up within ~2 seconds and executes on your MT5 account.
      </p>

      {/* Per-symbol minimum lot reference */}
      <details className="rounded-lg border border-border/50 bg-background/30 p-3">
        <summary className="text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
          Per-symbol minimum lot (Deriv MT5)
        </summary>
        <p className="text-[10px] text-muted-foreground/80 mt-2">
          Each Deriv synthetic has a different broker minimum (e.g. Boom 500 = 0.20, Crash 300 = 0.50).
          If your default lot is below the symbol minimum, we automatically clamp UP to the minimum so MT5 doesn't reject the order with error 4756.
        </p>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px]">
          {Object.entries(MT5_SYMBOL_MIN_LOT)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([sym, min]) => (
              <div key={sym} className="flex justify-between border-b border-border/30 py-0.5">
                <code className="text-muted-foreground">{sym}</code>
                <span className="font-mono text-primary">{min}</span>
              </div>
            ))}
        </div>
      </details>
    </Card>
  );
}
