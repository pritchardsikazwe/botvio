import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope } from "lucide-react";
import { useTradeCopyAction } from "@/hooks/useTradeCopy";

/** Connection diagnostic via GET /api/v1/mt5/account/{id}/diagnostic. */
export function DiagnosticButton({ accountId, disabled }: { accountId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const act = useTradeCopyAction();

  const run = async () => {
    setOpen(true); setErr(null); setResult(null);
    try { const r = await act.mutateAsync({ action: "diagnostic", payload: { account_id: accountId } }); setResult(r.diagnostic); }
    catch (e) { setErr((e as Error).message); }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={run} disabled={disabled}><Stethoscope className="mr-2 h-4 w-4" />Test connection</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Connection diagnostic</DialogTitle><DialogDescription>Result reported by TradeCopy for this MT5 account.</DialogDescription></DialogHeader>
          {act.isPending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking…</div>}
          {err && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
          {result !== null && <pre className="max-h-80 overflow-auto rounded-lg bg-muted/40 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>}
        </DialogContent>
      </Dialog>
    </>
  );
}
