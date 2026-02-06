import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useBots, 
  useBotInstances, 
  useTradingAccounts, 
  useCreateBotInstance, 
  useUpdateBotInstance,
} from "@/hooks/useBotvio";
import { useHasProductType, useEntitlements } from "@/hooks/useEntitlements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/trading/Header";
import { useNavigate, Link } from "react-router-dom";
import { Bot, Play, Pause, Square, Settings, Plus, Lock, Zap, TrendingUp, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Bot as BotType } from "@/types/botvio";

const Bots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bots, isLoading: botsLoading } = useBots();
  const { data: instances, isLoading: instancesLoading } = useBotInstances();
  const { data: accounts } = useTradingAccounts();
  const createInstance = useCreateBotInstance();
  const updateInstance = useUpdateBotInstance();
  const { data: entitlements } = useEntitlements();
  const ownsAnyBot = useHasProductType("bot");

  const [selectedBot, setSelectedBot] = useState<BotType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activateForm, setActivateForm] = useState({
    name: "",
    trading_account_id: "",
    markets: [] as string[],
    risk_per_trade_percent: 1,
    max_daily_loss_percent: 5,
    max_open_trades: 3,
    max_stake: 10,
  });

  const maxBotInstances = 10;
  const currentInstanceCount = instances?.length || 0;
  const canActivateMore = currentInstanceCount < maxBotInstances;

  // Check if user owns a specific bot product by matching bot code to product slug
  const userOwnsBotProduct = (botCode: string): boolean => {
    if (!entitlements) return false;
    return entitlements.some(e => e.products?.type === "bot" && e.status === "active");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view bots</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleActivateBot = (bot: BotType) => {
    if (!canActivateMore) {
      toast.error(`You've reached your limit of ${maxBotInstances} bot instances. Upgrade to add more.`);
      return;
    }

    if (bot.is_premium && !userOwnsBotProduct(bot.code)) {
      toast.error("You need to purchase this bot first. Visit the Marketplace.");
      navigate("/marketplace");
      return;
    }

    if (!accounts || accounts.length === 0) {
      toast.error("Please connect a trading account first");
      navigate("/accounts");
      return;
    }

    setSelectedBot(bot);
    setActivateForm({
      name: `${bot.name} Instance`,
      trading_account_id: accounts[0]?.id || "",
      markets: bot.default_markets || [],
      risk_per_trade_percent: 1,
      max_daily_loss_percent: 5,
      max_open_trades: 3,
      max_stake: 10,
    });
    setIsDialogOpen(true);
  };

  const handleSubmitActivation = async () => {
    if (!selectedBot || !activateForm.name || !activateForm.trading_account_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createInstance.mutateAsync({
        bot_id: selectedBot.id,
        trading_account_id: activateForm.trading_account_id,
        name: activateForm.name,
        markets: activateForm.markets,
        risk_per_trade_percent: activateForm.risk_per_trade_percent,
        max_daily_loss_percent: activateForm.max_daily_loss_percent,
        max_open_trades: activateForm.max_open_trades,
        max_stake: activateForm.max_stake,
      });

      toast.success(`${selectedBot.name} activated successfully!`);
      setIsDialogOpen(false);
      setSelectedBot(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to activate bot");
    }
  };

  const handleToggleInstance = async (instanceId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    
    try {
      await updateInstance.mutateAsync({
        id: instanceId,
        status: newStatus,
      });
      toast.success(`Bot ${newStatus === "active" ? "started" : "paused"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update bot");
    }
  };

  const handleStopInstance = async (instanceId: string) => {
    try {
      await updateInstance.mutateAsync({
        id: instanceId,
        status: "stopped",
      });
      toast.success("Bot stopped");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop bot");
    }
  };

  const getBotIcon = (code: string) => {
    switch (code) {
      case "botvio":
        return <Zap className="h-6 w-6" />;
      case "boom_crash_sniper":
        return <TrendingUp className="h-6 w-6" />;
      case "risk_guard":
        return <Shield className="h-6 w-6" />;
      default:
        return <Bot className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Bots</h1>
            <p className="text-muted-foreground">
              Automated trading strategies for Deriv and Binance
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{currentInstanceCount} / {maxBotInstances} bot instances used</p>
          </div>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="marketplace">Bot Marketplace</TabsTrigger>
            <TabsTrigger value="instances">My Bots ({instances?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
            {botsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots?.map((bot) => (
                  <Card key={bot.id} className="glass-card hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {getBotIcon(bot.code)}
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {bot.name}
                              {bot.is_premium && (
                                <Lock className="h-4 w-4 text-warning" />
                              )}
                            </CardTitle>
                            <CardDescription>
                              {bot.supported_brokers.join(" • ")}
                            </CardDescription>
                          </div>
                        </div>
                        {bot.is_premium && (
                          <Badge variant="secondary" className="bg-warning/10 text-warning">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {bot.short_description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {bot.default_markets.slice(0, 3).map((market) => (
                          <Badge key={market} variant="outline" className="text-xs">
                            {market}
                          </Badge>
                        ))}
                        {bot.default_markets.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{bot.default_markets.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleActivateBot(bot)}
                        disabled={bot.is_premium && !userOwnsBotProduct(bot.code)}
                      >
                        {bot.is_premium && !userOwnsBotProduct(bot.code) ? (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Buy in Marketplace
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Activate Bot
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {/* Affiliate CTA in Bot Marketplace */}
                <Card className="glass-card border-dashed border-2 border-primary/30">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Need a Trading Account?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a Deriv account to trade with our automated bots. Get access to Volatility Indices, Boom/Crash, and more!
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href="https://track.deriv.com/_h8e_odrKXNCTjSHedV4mENd7ZgqdRLk/1/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button variant="gold" className="w-full">
                          Open Deriv Account
                        </Button>
                      </a>
                      <a
                        href="https://one.exnesstrack.org/a/up2tpvqknx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button variant="outline" className="w-full">
                          Open Exness Account
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="instances">
            {instancesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : instances && instances.length > 0 ? (
              <div className="space-y-4">
                {instances.map((instance) => (
                  <Card key={instance.id} className="glass-card">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            instance.status === "active" ? "bg-success animate-pulse" :
                            instance.status === "paused" ? "bg-warning" :
                            "bg-muted-foreground"
                          }`} />
                          <div>
                            <h3 className="font-semibold">{instance.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {instance.bot?.name} • {instance.markets?.join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">Risk: {instance.risk_per_trade_percent}%</p>
                            <p className="text-muted-foreground">Max Stake: ${instance.max_stake}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleToggleInstance(instance.id, instance.status)}
                            >
                              {instance.status === "active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleStopInstance(instance.id)}
                              disabled={instance.status === "stopped"}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No bots activated</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse the marketplace and activate your first trading bot
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <a href="https://track.deriv.com/_h8e_odrKXNCTjSHedV4mENd7ZgqdRLk/1/" target="_blank" rel="noopener noreferrer">
                      <Button variant="gold">
                        Create Deriv Account First
                      </Button>
                    </a>
                    <Link to="/accounts">
                      <Button variant="outline">
                        Connect Existing Account
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Activate Bot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate {selectedBot?.name}</DialogTitle>
            <DialogDescription>
              Configure your bot instance settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Instance Name</Label>
              <Input
                id="name"
                value={activateForm.name}
                onChange={(e) => setActivateForm({ ...activateForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Trading Account</Label>
              <Select
                value={activateForm.trading_account_id}
                onValueChange={(v) => setActivateForm({ ...activateForm, trading_account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter(a => 
                    selectedBot?.supported_brokers.includes(a.broker)
                  ).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.label} ({account.broker})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk">Risk per Trade (%)</Label>
                <Input
                  id="risk"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={activateForm.risk_per_trade_percent}
                  onChange={(e) => setActivateForm({ 
                    ...activateForm, 
                    risk_per_trade_percent: parseFloat(e.target.value) || 1 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoss">Max Daily Loss (%)</Label>
                <Input
                  id="maxLoss"
                  type="number"
                  min="1"
                  max="50"
                  value={activateForm.max_daily_loss_percent}
                  onChange={(e) => setActivateForm({ 
                    ...activateForm, 
                    max_daily_loss_percent: parseFloat(e.target.value) || 5 
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTrades">Max Open Trades</Label>
                <Input
                  id="maxTrades"
                  type="number"
                  min="1"
                  max="20"
                  value={activateForm.max_open_trades}
                  onChange={(e) => setActivateForm({ 
                    ...activateForm, 
                    max_open_trades: parseInt(e.target.value) || 3 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStake">Max Stake ($)</Label>
                <Input
                  id="maxStake"
                  type="number"
                  min="0.35"
                  step="0.01"
                  value={activateForm.max_stake}
                  onChange={(e) => setActivateForm({ 
                    ...activateForm, 
                    max_stake: parseFloat(e.target.value) || 10 
                  })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitActivation} disabled={createInstance.isPending}>
              {createInstance.isPending ? "Activating..." : "Activate Bot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bots;
