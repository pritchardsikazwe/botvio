import { useState } from "react";
import { DerivTokenRow } from "@/hooks/useDerivTokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AccountSwitcherProps {
  tokens: DerivTokenRow[];
  onActivate: (tokenId: string) => Promise<void>;
  onRemove?: (tokenId: string) => Promise<void>;
}

export const AccountSwitcher = ({ tokens, onActivate, onRemove }: AccountSwitcherProps) => {
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = [...tokens].sort((a, b) => Number(b.is_active) - Number(a.is_active));

  if (tokens.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        No Deriv accounts linked yet. Connect via OAuth or API token.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Deriv Accounts</h3>
        <span className="text-xs text-muted-foreground">One active at a time</span>
      </div>

      <div className="space-y-2">
        {sorted.map((t) => (
          <div
            key={t.id}
            className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
              t.is_active
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:bg-muted/50 cursor-pointer"
            }`}
            onClick={async () => {
              if (t.is_active || busyId) return;
              setBusyId(t.id);
              try {
                await onActivate(t.id);
                toast.success(`Switched to ${t.is_virtual ? "Demo" : "Real"} account ${t.loginid}`);
              } catch (error: any) {
                toast.error(error?.message || "Unable to switch Deriv account");
              } finally {
                setBusyId(null);
              }
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {t.label || t.loginid}
                </span>
                <Badge variant={t.is_virtual ? "secondary" : "default"} className="text-[10px] px-1.5 py-0">
                  {t.is_virtual ? "DEMO" : "REAL"}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {t.currency}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.loginid}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {t.is_active ? (
                <span className="text-xs font-semibold text-primary">ACTIVE</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {busyId === t.id ? "Switching…" : "Switch"}
                </span>
              )}
              {onRemove && !t.is_active && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onRemove(t.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
