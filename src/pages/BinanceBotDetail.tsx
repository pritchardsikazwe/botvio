import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExchangeBotInstances, useExchangeBotRuns, useExchangeOrders, useUpdateBotStatus } from "@/hooks/useBinance";
import {
  Bot, Play, Pause, Square, Clock, TrendingUp, TrendingDown, ArrowLeft, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const BinanceBotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: bots, isLoading: botLoading } = useExchangeBotInstances();
  const { data: runs, isLoading: runsLoading } = useExchangeBotRuns(id!);
  const { data: orders, isLoading: ordersLoading } = useExchangeOrders(id);
  const updateStatus = useUpdateBotStatus();

  const bot = bots?.find((b: any) => b.id === id);

  const handleToggle = async () => {
    if (!bot) return;
    const newStatus = bot.status === "running" ? "paused" : "running";
    try {
      await updateStatus.mutateAsync({ id: bot.id, status: newStatus });
      toast.success(newStatus === "running" ? "Bot started" : "Bot paused");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleStop = async () => {
    if (!bot) return;
    try {
      await updateStatus.mutateAsync({ id: bot.id, status: "stopped" });
      toast.success("Bot stopped");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Please sign in</h1>
        </div>
      </div>
    );
  }

  if (botLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Bot not found</h1>
          <Button asChild><Link to="/bots/binance">Back to Bots</Link></Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/bots/binance"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{bot.symbol}</h1>
              <Badge
                variant={bot.status === "running" ? "default" : bot.status === "paused" ? "secondary" : "destructive"}
              >
                {bot.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {(bot as any).exchange_strategies?.name} • {bot.market_type} • Risk: {bot.risk_profile}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={bot.status === "running" ? "outline" : "default"}
              onClick={handleToggle}
              disabled={updateStatus.isPending || bot.status === "stopped"}
            >
              {bot.status === "running" ? (
                <><Pause className="h-4 w-4 mr-1" /> Pause</>
              ) : (
                <><Play className="h-4 w-4 mr-1" /> Start</>
              )}
            </Button>
            {bot.status !== "stopped" && (
              <Button variant="destructive" onClick={handleStop} disabled={updateStatus.isPending}>
                <Square className="h-4 w-4 mr-1" /> Stop
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bot Config */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4" /> Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-48">
                {JSON.stringify(bot.config_json, null, 2)}
              </pre>
              {bot.last_run_at && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last run: {new Date(bot.last_run_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Runs */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Runs</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["exchange_bot_runs"] })}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {runsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : runs && runs.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-auto">
                  {runs.map((run: any) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {run.decision === "buy" && <TrendingUp className="h-3 w-3 text-success" />}
                        {run.decision === "sell" && <TrendingDown className="h-3 w-3 text-destructive" />}
                        {run.decision === "hold" && <Clock className="h-3 w-3 text-muted-foreground" />}
                        <span className="capitalize font-medium">{run.decision}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {run.reason?.slice(0, 40)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(run.ran_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No runs yet</p>
              )}
            </CardContent>
          </Card>

          {/* Orders */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Orders</CardTitle>
              <CardDescription>Recent exchange orders from this bot</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : orders && orders.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left p-2">Symbol</th>
                        <th className="text-left p-2">Side</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Price</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order: any) => (
                        <tr key={order.id} className="border-b border-border/30">
                          <td className="p-2 font-mono">{order.symbol}</td>
                          <td className={`p-2 font-medium ${order.side === "BUY" ? "text-success" : "text-destructive"}`}>
                            {order.side}
                          </td>
                          <td className="p-2">{order.order_type}</td>
                          <td className="p-2 text-right font-mono">{order.quantity}</td>
                          <td className="p-2 text-right font-mono">{order.price ?? "-"}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">{order.status}</Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BinanceBotDetail;
