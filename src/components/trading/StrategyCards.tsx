import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TRADING_STYLES } from "@/config/tradingStyles";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/**
 * "Explore other trading styles" — keeps every strategy one tap away from any
 * trading page instead of leaving users stranded on a single style.
 */
export const StrategyCards = ({
  currentStyleId,
  limit = 4,
  title = "Explore other trading styles",
  className,
}: {
  currentStyleId?: string;
  limit?: number;
  title?: string;
  className?: string;
}) => {
  const styles = TRADING_STYLES.filter((s) => s.id !== currentStyleId).slice(0, limit);

  return (
    <section className={cn("space-y-2", className)}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {styles.map((s) => (
          <Card key={s.id} className="glass-card transition-colors hover:border-primary/40">
            <CardContent className="p-3">
              <Link to={`/trade/style/${s.id}`} className="block space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{s.title}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                <div className="flex gap-1.5 pt-0.5">
                  <Badge variant="outline" className="text-[10px]">{s.riskTag}</Badge>
                  <Badge variant="outline" className="text-[10px]">{s.tempoTag}</Badge>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};