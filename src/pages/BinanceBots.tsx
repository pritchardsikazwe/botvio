import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useExchangeAccount,
  useExchangeBotInstances,
  useExchangeStrategies,
  useCreateExchangeBot,
  useUpdateBotStatus,
} from "@/hooks/useBinance";
import {
  Bot, Plus, Play, Pause, Square, Clock, TrendingUp, Settings, ArrowRight, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const BinanceBots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: account } = useExchangeAccount();
  const { data: bots, isLoading: botsLoading } = useExchangeBotInstances();
  const { data: strategies } = useExchangeStrategies();
  const createBot = useCreateExchangeBot();
  const updateStatus = useUpdateBotStatus();

  const [showCreate, setShowCreate] = useState(false);
  const [newBot, setNewBot] = useState({
    strategy_id: "",
    symbol: "BTCUSDT",
    risk_profile: "low",
  });

  const handleCreate = async () => {
    if (!account?.id) {
      toast.error("Connect your Binance account first");
      return;
    }
    if (!newBot.strategy_id || !newBot.symbol) {
      toast.error("Select a strategy and symbol");
      return;
    }

    const strategy = strategies?.find(s => s.id === newBot.strategy_id);
    try {
      await createBot.mutateAsync({
        exchange_account_id: account.id,
        strategy_id: newBot.strategy_id,
        symbol: newBot.symbol,
        risk_profile: newBot.risk_profile,
        config_json: (strategy?.template_json as Record<string, any>) ?? {},
      });
      toast.success("Bot created! Configure and start it.");
      setShowCreate(false);
      setNewBot({ strategy_id: "", symbol: "BTCUSDT", risk_profile: "low" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create bot");
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "running" ? "paused" : "running";
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(newStatus === "running" ? "Bot started" : "Bot paused");
    } catch (e: any) {
      toast.error(e.message || "Failed to update bot");
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Binance Bots</h1>
            <p className="text-muted-foreground">
              Manage your automated Binance trading bots
            </p>
          </div>

          {!account ? (
            <Button variant="outline" asChild>
              <Link to="/settings/binance">
                <Settings className="mr-2 h-4 w-4" /> Connect Binance
              </Link>
            </Button>
          ) : (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Bot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Binance Bot</DialogTitle>
                  <DialogDescription>
                    Configure a new automated trading bot
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Strategy</Label>
                    <Select
                      value={newBot.strategy_id}
                      onValueChange={v => setNewBot(p => ({ ...p, strategy_id: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                      <SelectContent>
                        {strategies?.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.market_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Trading Pair</Label>
                    <Input
                      value={newBot.symbol}
                      onChange={e => setNewBot(p => ({ ...p, symbol: e.target.value.toUpperCase() }))}
                      placeholder="BTCUSDT"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Risk Profile</Label>
                    <Select
                      value={newBot.risk_profile}
                      onValueChange={v => setNewBot(p => ({ ...p, risk_profile: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={createBot.isPending}>
                    {createBot.isPending ? "Creating..." : "Create Bot"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!account && (
          <Card className="glass-card mb-6 border-warning/30">
            <CardContent className="py-6 flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <h3 className="font-semibold">Binance Not Connected</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Binance API keys before creating bots.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" asChild>
                <Link to="/settings/binance">Connect Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {botsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : bots && bots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot: any) => (
              <Card key={bot.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{bot.symbol}</CardTitle>
                      <CardDescription>
                        {bot.exchange_strategies?.name ?? "Strategy"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={bot.status === "running" ? "default" : bot.status === "paused" ? "secondary" : "destructive"}
                    >
                      {bot.status === "running" && <Play className="h-3 w-3 mr-1" />}
                      {bot.status === "paused" && <Pause className="h-3 w-3 mr-1" />}
                      {bot.status === "stopped" && <Square className="h-3 w-3 mr-1" />}
                      {bot.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Risk:</span>
                      <span className="ml-1 font-medium capitalize">{bot.risk_profile}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Market:</span>
                      <span className="ml-1 font-medium capitalize">{bot.market_type}</span>
                    </div>
                  </div>

                  {bot.last_run_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last run: {new Date(bot.last_run_at).toLocaleString()}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant={bot.status === "running" ? "outline" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggle(bot.id, bot.status)}
                      disabled={updateStatus.isPending}
                    >
                      {bot.status === "running" ? (
                        <><Pause className="h-4 w-4 mr-1" /> Pause</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" /> Start</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bots/binance/${bot.id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Binance Bots Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automated trading bot to get started
              </p>
              {account && (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Bot
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BinanceBots;
