import { ExternalLink, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const WELTRADE_LINK = "https://gowt.net/ib67505";
const ACCOUNTS = [
  { name: "Pro", deposit: "$10", spread: "From 0.5 pips, floating", leverage: "Up to 1:2000", platform: "MT4 / MT5", commission: "None from Weltrade’s side" },
  { name: "SyntX", deposit: "$1", spread: "From 0 pips", leverage: "Up to 1:10000", platform: "MT4 / MT5", commission: "From $3/lot" },
  { name: "Raw Spread", deposit: "$100", spread: "From 0.01 pips", leverage: "Up to 1:2000", platform: "MT5", commission: "Per side; depends on instrument" },
] as const;

export function WeltradeAccountGuide() {
  return <section className="space-y-4" aria-labelledby="weltrade-accounts-heading">
    <div><p className="text-xs font-bold uppercase text-warning">Reported by Weltrade · June 2026 overview</p><h2 id="weltrade-accounts-heading" className="text-xl font-black text-foreground">Account conditions at a glance</h2><p className="mt-1 text-sm text-muted-foreground">Weltrade currently lists choices including Pro, SyntX, Raw Spread, Cent and Universe. The comparison below is not exhaustive.</p></div>
    <div className="grid gap-3 md:grid-cols-3">
      {ACCOUNTS.map((account) => <Card key={account.name} className="border-border/60"><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><h3 className="font-black text-foreground">{account.name}</h3><Badge variant="outline">Reported</Badge></div><dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><dt className="text-muted-foreground">Minimum deposit</dt><dd className="text-right font-bold text-foreground">{account.deposit}</dd><dt className="text-muted-foreground">Spread</dt><dd className="text-right font-bold text-foreground">{account.spread}</dd><dt className="text-muted-foreground">Leverage</dt><dd className="text-right font-bold text-foreground">{account.leverage}</dd><dt className="text-muted-foreground">Platform</dt><dd className="text-right font-bold text-foreground">{account.platform}</dd><dt className="text-muted-foreground">Commission</dt><dd className="text-right font-bold text-foreground">{account.commission}</dd></dl></CardContent></Card>)}
    </div>
    <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-xs leading-relaxed text-muted-foreground"><ShieldAlert className="mr-2 inline h-4 w-4 text-warning" /><strong className="text-foreground">Conditions vary by country and account and may change.</strong> Raw Spread and other accounts may not be available in every region. Weltrade reports dynamic leverage up to 1:2000 on MT5 for several account types; MT4 FX/metals leverage is reported as capped at 1:1000. High leverage magnifies losses as well as gains.</div>
    <div className="flex flex-col gap-2 sm:flex-row"><Button asChild variant="gold" className="min-h-11"><a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer">Verify on Weltrade before opening an account<ExternalLink className="ml-2 h-4 w-4" /></a></Button><Button asChild variant="outline" className="min-h-11"><a href="https://support.weltrade.com/en/articles/11712053-trading-account-types-overview" target="_blank" rel="noopener noreferrer">Official account overview<ExternalLink className="ml-2 h-4 w-4" /></a></Button><Button asChild variant="outline" className="min-h-11"><a href="https://support.weltrade.com/en/articles/11756483-what-is-leverage" target="_blank" rel="noopener noreferrer">Official leverage guide<ExternalLink className="ml-2 h-4 w-4" /></a></Button></div>
  </section>;
}