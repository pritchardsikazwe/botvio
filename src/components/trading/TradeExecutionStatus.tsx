import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

export type TradePhase = "idle" | "validating" | "submitting" | "open" | "settled" | "error";

export interface TradeFeedback {
  phase: TradePhase;
  message?: string;
  technical?: string;
  contract?: {
    contractId?: number | string;
    symbol?: string;
    contractType?: string;
    stake?: number;
    payout?: number;
    entrySpot?: number | null;
    currency?: string;
  };
  /** For error states: which action fixes it */
  recovery?: "retry" | "asset" | "connection";
}

const PHASE_TEXT: Record<TradePhase, string> = {
  idle: "",
  validating: "Validating trade…",
  submitting: "Placing trade…",
  open: "Trade open",
  settled: "Trade settled",
  error: "Trade failed",
};

/**
 * Explicit execution feedback for every trade attempt — no silent failures.
 */
export const TradeExecutionStatus = ({
  feedback,
  onRetry,
  onChangeAsset,
  className,
}: {
  feedback: TradeFeedback;
  onRetry?: () => void;
  onChangeAsset?: () => void;
  className?: string;
}) => {
  if (feedback.phase === "idle") return null;

  const isError = feedback.phase === "error";
  const isBusy = feedback.phase === "validating" || feedback.phase === "submitting";
  const c = feedback.contract;

  return (
    <Card
      className={cn(
        "border",
        isError ? "border-destructive/40 bg-destructive/5" : "border-border/60",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {isBusy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {isError && <AlertTriangle className="h-4 w-4 text-destructive" />}
          {(feedback.phase === "open" || feedback.phase === "settled") && (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
          <span className={cn(isError && "text-destructive")}>{PHASE_TEXT[feedback.phase]}</span>
          {c?.contractType && (
            <Badge variant="outline" className="ml-auto text-[10px]">{c.contractType}</Badge>
          )}
        </div>

        {feedback.message && (
          <p className={cn("text-xs", isError ? "text-destructive" : "text-muted-foreground")}>
            {feedback.message}
          </p>
        )}

        {c && (feedback.phase === "open" || feedback.phase === "settled") && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {c.contractId != null && (
              <div className="flex justify-between"><dt>Contract</dt><dd className="font-medium text-foreground">#{c.contractId}</dd></div>
            )}
            {c.symbol && (
              <div className="flex justify-between"><dt>Asset</dt><dd className="font-medium text-foreground">{c.symbol}</dd></div>
            )}
            {c.stake != null && (
              <div className="flex justify-between"><dt>Stake</dt><dd className="font-medium text-foreground">{c.currency ?? ""} {c.stake.toFixed(2)}</dd></div>
            )}
            {c.payout != null && (
              <div className="flex justify-between"><dt>Payout</dt><dd className="font-medium text-foreground">{c.currency ?? ""} {c.payout.toFixed(2)}</dd></div>
            )}
            {c.entrySpot != null && (
              <div className="flex justify-between"><dt>Entry</dt><dd className="font-medium text-foreground">{c.entrySpot}</dd></div>
            )}
          </dl>
        )}

        {isError && (
          <div className="flex flex-wrap gap-2 pt-1">
            {onRetry && feedback.recovery !== "connection" && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retry
              </Button>
            )}
            {onChangeAsset && feedback.recovery === "asset" && (
              <Button size="sm" variant="outline" onClick={onChangeAsset}>
                <Settings2 className="mr-1 h-3.5 w-3.5" /> Choose another asset
              </Button>
            )}
            {feedback.recovery === "connection" && (
              <Button size="sm" variant="gold" asChild>
                <Link to="/connections">Fix connection</Link>
              </Button>
            )}
          </div>
        )}

        {isError && feedback.technical && (
          <details className="text-[11px] text-muted-foreground">
            <summary className="cursor-pointer">Technical details</summary>
            <p className="mt-1 break-all font-mono">{feedback.technical}</p>
          </details>
        )}
      </CardContent>
    </Card>
  );
};