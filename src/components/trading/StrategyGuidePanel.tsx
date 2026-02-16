import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, BookOpen, Target, Zap, ShieldCheck, MapPin } from "lucide-react";
import type { StrategyGuide } from "@/lib/tradeModesStrategies";

function GuideSection({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-muted-foreground leading-relaxed">{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function StrategyGuidePanel({ guide }: { guide: StrategyGuide }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <BookOpen className="h-3 w-3" />
        {open ? "Hide Strategy Guide" : "Strategy Guide"}
        {open ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
      </CollapsibleTrigger>
      <CollapsibleContent onClick={(e) => e.stopPropagation()}>
        <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-3 space-y-3">
          {/* Header */}
          <div>
            <p className="text-xs font-semibold text-foreground">{guide.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{guide.whatItIs}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{guide.difficulty}</Badge>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{guide.paceTag}</Badge>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{guide.marketTag}</Badge>
          </div>

          {/* Sections */}
          <GuideSection title="How It Works" items={guide.howItWorks} icon={<BookOpen className="h-3 w-3 text-primary" />} />
          <GuideSection title="Entry Rules" items={guide.entryRules} icon={<Target className="h-3 w-3 text-emerald-400" />} />
          <GuideSection title="Signal Examples" items={guide.exampleSignals} icon={<Zap className="h-3 w-3 text-amber-400" />} />
          <GuideSection title="Risk Guards" items={guide.riskGuards} icon={<ShieldCheck className="h-3 w-3 text-red-400" />} />
          <GuideSection title="Best Markets" items={guide.bestMarkets} icon={<MapPin className="h-3 w-3 text-sky-400" />} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
