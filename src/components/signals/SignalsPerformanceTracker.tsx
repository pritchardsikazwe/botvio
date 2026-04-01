import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export const SignalsPerformanceTracker = () => {
  const { data: screenshots, isLoading } = useQuery({
    queryKey: ["signals-history-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals_history")
        .select("id, screenshot_url, date_posted, pair, result")
        .not("screenshot_url", "is", null)
        .order("date_posted", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  if (isLoading) return null;
  if (!screenshots || screenshots.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Our Trading Results</h2>
          <Badge variant="outline" className="text-xs">Live Tracking</Badge>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">No signal results posted yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Our Trading Results</h2>
        <Badge variant="outline" className="text-xs">Live Tracking</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {screenshots.map((s) => (
          <Card key={s.id} className="glass-card overflow-hidden group hover:border-primary/40 transition-colors">
            <a href={s.screenshot_url!} target="_blank" rel="noopener noreferrer">
              <img
                src={s.screenshot_url!}
                alt={`Signal result ${s.pair || ""}`}
                className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </a>
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span className="text-[10px]">
                    {format(new Date(s.date_posted), "dd MMM yyyy")}
                  </span>
                </div>
                {s.result && (
                  <Badge
                    className={`text-[9px] px-1.5 py-0 h-4 ${
                      s.result === "WIN"
                        ? "bg-success/20 text-success border-success/30"
                        : s.result === "LOSS"
                        ? "bg-destructive/20 text-destructive border-destructive/30"
                        : "bg-warning/20 text-warning border-warning/30"
                    }`}
                  >
                    {s.result}
                  </Badge>
                )}
              </div>
              {s.pair && <p className="text-xs font-semibold text-foreground mt-1">{s.pair}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
