import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, ExternalLink, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SYNTX_FAMILIES, type SyntxFamily } from "@/lib/marketData/syntxStrategy";

const SOURCES = [
  ["SyntX indices complete guide", "https://support.weltrade.com/en/articles/15231276-syntx-indices-complete-guide"],
  ["Types of synthetic indices", "https://support.weltrade.com/en/articles/11799561-types-of-synthetic-indices"],
  ["Synthetic indices strategies", "https://help.weltrade.com/en/articles/13435139-trading-strategies-for-synthetic-indices"],
  ["Weltrade SyntX instruments", "https://www.weltrade.com/trading/syntx-instruments/"],
] as const;

export function SyntxStrategyHub({ onSelectFamily }: { onSelectFamily?: (family: SyntxFamily) => void }) {
  const [family, setFamily] = useState<SyntxFamily>("fx-vol");
  const selected = useMemo(() => SYNTX_FAMILIES.find((item) => item.id === family) ?? SYNTX_FAMILIES[0], [family]);

  return (
    <section className="space-y-4" aria-labelledby="syntx-strategy-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Family-aware analysis</p>
          <h2 id="syntx-strategy-heading" className="text-xl font-black text-foreground">SyntX Strategy Matrix</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Each family uses a distinct analytical framework. Botvio never treats SyntX as ordinary forex or applies one generic model to every instrument.</p>
        </div>
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs font-bold text-muted-foreground" htmlFor="syntx-family">Compare a family</label>
          <Select value={family} onValueChange={(value) => setFamily(value as SyntxFamily)}>
            <SelectTrigger id="syntx-family" className="min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{SYNTX_FAMILIES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{selected.label}</CardTitle>
            <div className="flex flex-wrap gap-1">{selected.badges.map((badge) => <Badge key={badge} variant="outline">{badge}</Badge>)}</div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs font-bold text-foreground">How this index behaves</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selected.behaviour}</p></div>
          <div><p className="text-xs font-bold text-foreground">Compatible strategy</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selected.strategyStyle}</p></div>
          <div><p className="text-xs font-bold text-foreground">Key risk</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selected.keyRisk}</p></div>
          <div><p className="text-xs font-bold text-foreground">Suitable tools</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selected.tools}</p></div>
          {onSelectFamily && <div className="sm:col-span-2 lg:col-span-4"><Button onClick={() => onSelectFamily(selected.id)} className="min-h-11 w-full sm:w-auto">Open compatible instruments <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SYNTX_FAMILIES.map((item) => (
          <button key={item.id} type="button" onClick={() => { setFamily(item.id); onSelectFamily?.(item.id); }} className="min-h-32 rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-start justify-between gap-2"><span className="font-black text-foreground">{item.label}</span><Badge variant={item.riskLevel === "very-high" ? "destructive" : "outline"}>{item.riskLevel === "very-high" ? "Very high risk" : "High risk"}</Badge></div>
            <div className="mt-2 flex flex-wrap gap-1">{item.badges.map((badge) => <Badge key={badge} variant="secondary" className="text-[10px]">{badge}</Badge>)}</div>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.strategyStyle}</p>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
        <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" /><div><p className="text-sm font-black text-foreground">Leveraged SyntX risk</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">These are analytical frameworks, not guaranteed predictions. Leveraged synthetic trading can result in rapid losses. Use a demo account, predefined stops and conservative position sizing.</p></div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SOURCES.map(([label, href]) => <Button key={href} asChild variant="outline" size="sm"><a href={href} target="_blank" rel="noopener noreferrer">{label}<ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></Button>)}
      </div>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />Instrument behaviour is summarized from Weltrade’s current documentation. Availability and specifications can change; verify current terms with Weltrade.</p>
    </section>
  );
}