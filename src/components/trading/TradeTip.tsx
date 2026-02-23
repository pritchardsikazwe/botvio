import { AlertTriangle, Info, Lightbulb } from "lucide-react";

interface TradeTipProps {
  tip: string;
  type?: "tip" | "warning" | "disclaimer";
}

export const TradeTip = ({ tip, type = "tip" }: TradeTipProps) => {
  const styles = {
    tip: { bg: "bg-primary/5 border-primary/20", icon: <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />, color: "text-primary" },
    warning: { bg: "bg-warning/5 border-warning/20", icon: <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />, color: "text-warning" },
    disclaimer: { bg: "bg-destructive/5 border-destructive/20", icon: <Info className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />, color: "text-destructive" },
  };

  const s = styles[type];

  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${s.bg}`}>
      {s.icon}
      <p className="text-muted-foreground">{tip}</p>
    </div>
  );
};
