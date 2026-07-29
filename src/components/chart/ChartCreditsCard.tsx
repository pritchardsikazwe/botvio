import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useChartUsageGate,
  getGuestUploadCount,
  GUEST_DAILY_LIMIT,
} from "@/hooks/useChartAnalysis";

/**
 * Compact "AI chart credits" card — shows how many chart-analysis uploads
 * the current visitor has left for their plan period.
 */
export function ChartCreditsCard() {
  const { user } = useAuth();
  const gate = useChartUsageGate();

  const guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - getGuestUploadCount());
  const remaining = user ? Math.max(0, gate.remaining) : guestRemaining;
  const max = user ? gate.maxUploads : GUEST_DAILY_LIMIT;
  const used = Math.max(0, max - remaining);
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 100;
  const depleted = remaining <= 0;

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Chart Credits
          </h3>
          <Badge variant={depleted ? "destructive" : "outline"} className="text-[10px]">
            {remaining}/{max} left
          </Badge>
        </div>

        <Progress value={pct} className="h-1.5" />

        <p className="text-[11px] text-muted-foreground">
          {user
            ? `${gate.planName} plan — ${used}/${max} used ${gate.periodLabel}`
            : `${guestRemaining}/${GUEST_DAILY_LIMIT} free analyses today — sign in for more`}
        </p>

        {depleted && (
          <Button asChild size="sm" className="w-full">
            <Link to={user ? "/billing" : "/auth"}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              {user ? "Get more credits" : "Sign in for more"}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ChartCreditsCard;
