import { useLatestSignals } from "@/hooks/useManualSignals";
import { ManualSignalCard } from "./ManualSignalCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Signal, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const HomeSignalsWidget = () => {
  const { data: signals, isLoading } = useLatestSignals(3);

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Signal className="h-5 w-5 text-primary" />
            Latest Trading Signals
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted/30 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Signal className="h-5 w-5 text-primary" />
          Latest Trading Signals
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/signals">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {signals.map((signal) => (
          <ManualSignalCard key={signal.id} signal={signal} compact />
        ))}
      </div>
    </div>
  );
};
