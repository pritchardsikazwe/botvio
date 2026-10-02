import { ExternalLink, ShieldCheck, UserPlus, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AffiliateAccountGuideProps {
  broker: "deriv" | "exness";
  affiliateUrl: string;
  compact?: boolean;
}

const config = {
  deriv: {
    name: "Deriv",
    title: "Open your Deriv account through the Botvio referral link",
    intro: "Use the Botvio referral link before starting registration so the referral attribution can be attached to the new account.",
    steps: [
      "Click Open Deriv Account below.",
      "Complete the Deriv registration in the same browser session.",
      "Complete any identity or account verification requested by Deriv.",
      "Choose the Demo account first if you want to practise before using real funds.",
      "Return to Botvio and connect your Deriv account when you are ready.",
    ],
  },
  exness: {
    name: "Exness",
    title: "Open your Exness account through the Botvio referral link",
    intro: "If you are coming for forex, gold or MT5, use the Botvio Exness referral link before registration.",
    steps: [
      "Click Open Exness Account below.",
      "Complete registration using the Exness signup flow.",
      "Complete the verification steps requested by Exness.",
      "Review the available account type, instruments and trading conditions before funding.",
      "Return to Botvio for market analysis, signals and MT5-related tools.",
    ],
  },
} as const;

export function AffiliateAccountGuide({ broker, affiliateUrl, compact = false }: AffiliateAccountGuideProps) {
  const c = config[broker];
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className={compact ? "p-4" : "p-5 md:p-6"}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Botvio account guide</p>
            <h2 className="mt-1 text-lg md:text-xl font-black">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
          </div>
          <Button asChild className="shrink-0">
            <a href={affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">
              Open {c.name} Account <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {c.steps.map((step, i) => (
            <div key={step} className="rounded-xl border bg-background/60 p-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">{i + 1}</span>
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Read the broker's terms and risk disclosures.</span>
          <span className="inline-flex items-center gap-1"><UserPlus className="h-3 w-3" /> Referral/affiliate relationship disclosed.</span>
          <span className="inline-flex items-center gap-1"><WalletCards className="h-3 w-3" /> Only fund an account after understanding the risks.</span>
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Deriv risk warning:</strong> The products offered on the trade.deriv.com website include Options, Contracts for Difference (“CFDs”), and other complex derivatives. Trading Options may not be suitable for everyone. Trading CFDs carries a high level of risk since leverage can work both to your advantage and disadvantage. You may lose all of your invested capital. Never invest money you cannot afford to lose or trade with borrowed money.</div>
        </div>
      </CardContent>
    </Card>
  );
}
