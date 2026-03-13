import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Lightbulb } from "lucide-react";

interface TradingTipsCardProps {
  title?: string;
  dos: string[];
  donts: string[];
  proTip?: string;
}

export const TradingTipsCard = ({ title = "Trading Do's & Don'ts", dos, donts, proTip }: TradingTipsCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-warning" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-success uppercase tracking-wider">✅ Do's</p>
        {dos.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
            <span>{d}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">❌ Don'ts</p>
        {donts.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
            <span>{d}</span>
          </div>
        ))}
      </div>
      {proTip && (
        <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs text-foreground font-semibold flex items-start gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
            <span>💡 Pro Tip: {proTip}</span>
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);
