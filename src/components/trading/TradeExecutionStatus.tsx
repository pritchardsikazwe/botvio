import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, CircleHelp, Loader2, RefreshCw, Settings2, ShieldCheck } from "lucide-react";
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

  const isProposalError = /unknown contract proposal|expired.*proposal|proposal.*unknown/i.test(feedback.message || "");
  const headline = isError
    ? isProposalError ? "Quote expired or could not be matched"
      : /duration|expiry/i.test(feedback.message || "") ? "Check contract duration"
      : /stake|amount|minimum|maximum/i.test(feedback.message || "") ? "Check your stake"
      : /connected|connection|authorization|token/i.test(feedback.message || "") ? "Deriv connection needs attention"
      : "We couldn't place this trade"
    : PHASE_TEXT[feedback.phase];
  const nextStep = isError
    ? isProposalError ? "No automatic buy retry was sent. Request a fresh quote, check the displayed price, then try again."
      : /duration|expiry/i.test(feedback.message || "") ? "Choose a duration supported by this market and contract type, then request a new quote."
      : /stake|amount|minimum|maximum/i.test(feedback.message || "") ? "Adjust the stake to the minimum and maximum accepted by Deriv for this contract."
      : /connected|connection|authorization|token/i.test(feedback.message || "") ? "Reconnect your Deriv account and wait for confirmation before trading."
      : "Review the details below. If the problem continues, choose another available contract or try later."
    : null;

  return (
    <Card className={cn("overflow-hidden border shadow-sm", isError ? "border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-background to-background" : feedback.phase === "open" || feedback.phase === "settled" ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-background to-background" : "border-border/60 bg-card", className)} role="status" aria-live="polite">
      <CardContent className="p-0">
        <div className={cn("flex items-start gap-3 border-b px-4 py-3", isError ? "border-rose-500/20" : "border-border/60")}>
          <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", isError ? "bg-rose-500/15 text-rose-300" : feedback.phase === "open" || feedback.phase === "settled" ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/10 text-primary")}>
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : isError ? <AlertTriangle className="h-4 w-4" /> : feedback.phase === "open" || feedback.phase === "settled" ? <CheckCircle2 className="h-4 w-4" /> : <CircleHelp className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className={cn("text-sm font-semibold", isError ? "text-rose-200" : "text-foreground")}>{headline}</h3>{c?.contractType && <Badge variant="outline" className="text-[10px]">{c.contractType}</Badge>}</div>
            {feedback.message && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feedback.message}</p>}
          </div>
          {isError && <Badge variant="outline" className="shrink-0 border-rose-500/30 text-rose-300">Not placed</Badge>}
          {feedback.phase === "open" && <Badge variant="outline" className="shrink-0 border-emerald-500/30 text-emerald-300">Active</Badge>}
        </div>
        {isError && nextStep && <div className="mx-4 mt-3 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><div><p className="text-[11px] font-semibold text-amber-200">What to do next</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{nextStep}</p></div></div>}
        {c && (feedback.phase === "open" || feedback.phase === "settled") && <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-xs">
          {c.contractId != null && <div><dt className="text-muted-foreground">Contract ID</dt><dd className="mt-0.5 font-semibold tabular-nums">#{c.contractId}</dd></div>}
          {c.symbol && <div><dt className="text-muted-foreground">Market</dt><dd className="mt-0.5 font-semibold">{c.symbol}</dd></div>}
          {c.stake != null && <div><dt className="text-muted-foreground">Stake</dt><dd className="mt-0.5 font-semibold tabular-nums">{c.currency ?? ""} {c.stake.toFixed(2)}</dd></div>}
          {c.payout != null && <div><dt className="text-muted-foreground">Potential payout</dt><dd className="mt-0.5 font-semibold tabular-nums">{c.currency ?? ""} {c.payout.toFixed(2)}</dd></div>}
          {c.entrySpot != null && <div className="col-span-2"><dt className="text-muted-foreground">Entry spot</dt><dd className="mt-0.5 font-semibold tabular-nums">{c.entrySpot}</dd></div>}
        </dl>}
        {isError && <div className="flex flex-wrap gap-2 px-4 py-3">
          {onRetry && feedback.recovery !== "connection" && <Button size="sm" onClick={onRetry} className="bg-amber-400 text-slate-950 hover:bg-amber-300"><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again</Button>}
          {onChangeAsset && feedback.recovery === "asset" && <Button size="sm" variant="outline" onClick={onChangeAsset}><Settings2 className="mr-1.5 h-3.5 w-3.5" /> Choose another market</Button>}
          {feedback.recovery === "connection" && <Button size="sm" asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300"><Link to="/connections">Reconnect Deriv</Link></Button>}
        </div>}
        {isError && feedback.technical && <details className="mx-4 mb-4 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs"><summary className="cursor-pointer font-medium text-muted-foreground">Technical details <span className="font-normal">(for support)</span></summary><p className="mt-2 break-words font-mono text-[11px] leading-relaxed text-muted-foreground">{feedback.technical}</p></details>}
      </CardContent>
    </Card>
  );
};