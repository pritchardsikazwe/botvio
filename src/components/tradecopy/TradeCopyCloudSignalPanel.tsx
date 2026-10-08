import { ExternalLink, Cloud, ShieldCheck, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TRADECOPY_HOME = "https://tradecopy.online/";
const BOTVIO_SIGNAL_URL = String(import.meta.env.VITE_TRADECOPY_BOTVIO_SIGNAL_URL ?? "").trim();

/**
 * Primary MT5 follower route.
 *
 * TradeCopy Cloud owns the follower copier. Botvio should not create a separate
 * per-follower copier/EA. If a Botvio TradeCopy Signal URL is configured,
 * users can go directly to it; otherwise we send them to TradeCopy to finish
 * the cloud Signal/Copy setup.
 */
export function TradeCopyCloudSignalPanel() {
  const target = BOTVIO_SIGNAL_URL || TRADECOPY_HOME;

  return (
    <Card className="border-emerald-500/20 bg-emerald-50/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="outline" className="mb-2 border-emerald-500/30 text-emerald-700">
              RECOMMENDED · CLOUD COPY
            </Badge>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4 text-emerald-600" />
              Copy Botvio signals with TradeCopy Cloud
            </CardTitle>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              TradeCopy hosts the copier and follower accounts in the cloud. Botvio remains the
              signal, account and risk-control layer; no Botvio Copier EA or follower VPS is required.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-white p-2">
            <Zap className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-white p-3">
            <Cloud className="h-4 w-4 text-primary" />
            <p className="mt-2 text-xs font-semibold">1. TradeCopy Cloud</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Connect the follower MT5 account in TradeCopy.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-3">
            <Users className="h-4 w-4 text-primary" />
            <p className="mt-2 text-xs font-semibold">2. Botvio Signal</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Follow the official Botvio Robot signal with Copier access.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-white p-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="mt-2 text-xs font-semibold">3. Your Risk</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Choose lot/risk, symbols and SL/TP rules in TradeCopy.</p>
          </div>
        </div>

        {!BOTVIO_SIGNAL_URL && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs">
            <p className="font-semibold">Botvio Signal URL still needs to be configured</p>
            <p className="mt-1 text-muted-foreground">
              The production Signal Provider URL must come from the Botvio TradeCopy account.
              We intentionally do not invent or hard-code a signal URL.
            </p>
          </div>
        )}

        <Button asChild className="min-h-11">
          <a href={target} target="_blank" rel="noreferrer">
            {BOTVIO_SIGNAL_URL ? "OPEN BOTVIO TRADECOPY SIGNAL" : "OPEN TRADECOPY CLOUD"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>

        <p className="text-[11px] leading-5 text-muted-foreground">
          TradeCopy supports Signal Provider terms with Copier access and cloud-based trade copying.
          The Botvio API copier remains available below as a managed/legacy path while the official
          Signal Provider URL is being configured.
        </p>
      </CardContent>
    </Card>
  );
}
