import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Trophy, XCircle, Clock, BarChart3, Target } from "lucide-react";

interface SignalHistory {
  id: string;
  pair: string;
  signal_type: string;
  entry_price: number;
  take_profit: number | null;
  stop_loss: number | null;
  result: string;
  profit_pips: number | null;
  date_posted: string;
  date_closed: string | null;
  source: string;
  strategy_name: string | null;
  screenshot_url: string | null;
}

export const SignalsPerformanceTracker = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: ["signals-history-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals_history")
        .select("*")
        .order("date_posted", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as SignalHistory[];
    },
    refetchInterval: 60000,
  });

  const totalSignals = history?.length || 0;
  const wins = history?.filter(s => s.result === "WIN").length || 0;
  const losses = history?.filter(s => s.result === "LOSS").length || 0;
  const running = history?.filter(s => s.result === "RUNNING").length || 0;
  const winRate = totalSignals > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;

  const recentSignals = history?.slice(0, 10) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Our Trading Results
        </h2>
        <Badge variant="outline" className="text-xs">Live Tracking</Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-primary/30">
          <CardContent className="pt-4 pb-3 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalSignals}</p>
            <p className="text-xs text-muted-foreground">Total Signals</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-success/30">
          <CardContent className="pt-4 pb-3 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold text-success">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-success/30">
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold text-success">{wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-destructive/30">
          <CardContent className="pt-4 pb-3 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{losses}</p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </CardContent>
        </Card>
      </div>

      {/* Running trades indicator */}
      {running > 0 && (
        <div className="flex items-center gap-2 text-sm text-warning">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>{running} trade{running > 1 ? "s" : ""} currently running</span>
        </div>
      )}

      {/* Recent Signals Table */}
      {recentSignals.length > 0 ? (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Signals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Pair</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Entry</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">TP</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">SL</TableHead>
                  <TableHead className="text-xs">Result</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Pips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSignals.map(signal => (
                  <TableRow key={signal.id}>
                    <TableCell className="font-medium text-xs py-2">{signal.pair}</TableCell>
                    <TableCell className="py-2">
                      <Badge variant={signal.signal_type === "BUY" ? "default" : "destructive"} className="text-[10px]">
                        {signal.signal_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs py-2 hidden sm:table-cell">{signal.entry_price}</TableCell>
                    <TableCell className="text-xs py-2 hidden sm:table-cell">{signal.take_profit || "—"}</TableCell>
                    <TableCell className="text-xs py-2 hidden sm:table-cell">{signal.stop_loss || "—"}</TableCell>
                    <TableCell className="py-2">
                      {signal.result === "WIN" && (
                        <Badge className="bg-success/20 text-success border-success/30 text-[10px]">✅ WIN</Badge>
                      )}
                      {signal.result === "LOSS" && (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">❌ LOSS</Badge>
                      )}
                      {signal.result === "RUNNING" && (
                        <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">⏳ RUNNING</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-2 hidden md:table-cell">
                      {signal.profit_pips ? (
                        <span className={signal.profit_pips > 0 ? "text-success" : "text-destructive"}>
                          {signal.profit_pips > 0 ? "+" : ""}{signal.profit_pips}
                        </span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">No signal history yet</p>
      ) : null}
    </div>
  );
};
