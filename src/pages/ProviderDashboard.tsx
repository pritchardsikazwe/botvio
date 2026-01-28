import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useMyProvider, 
  useCreateProvider, 
  useTradingAccounts, 
  useAddProviderAccount,
  useMyProviderTrades,
  useMySubscriberCount,
  useExecuteAndCopy,
  useMySubscription
} from "@/hooks/useBotvio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/trading/Header";
import { useNavigate, Link } from "react-router-dom";
import { 
  Users, TrendingUp, DollarSign, Target, ArrowUp, ArrowDown, 
  Clock, CheckCircle, XCircle, AlertCircle, Send
} from "lucide-react";
import { toast } from "sonner";

const DERIV_SYMBOLS = [
  { value: "R_100", label: "Volatility 100" },
  { value: "R_75", label: "Volatility 75" },
  { value: "R_50", label: "Volatility 50" },
  { value: "R_25", label: "Volatility 25" },
  { value: "R_10", label: "Volatility 10" },
  { value: "BOOM1000", label: "Boom 1000" },
  { value: "BOOM500", label: "Boom 500" },
  { value: "CRASH1000", label: "Crash 1000" },
  { value: "CRASH500", label: "Crash 500" },
  { value: "frxXAUUSD", label: "Gold (XAUUSD)" },
];

const ProviderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myProvider, isLoading: providerLoading } = useMyProvider();
  const { data: accounts } = useTradingAccounts();
  const { data: trades, isLoading: tradesLoading } = useMyProviderTrades();
  const { data: subscriberCount } = useMySubscriberCount();
  const { data: myPlan } = useMySubscription();
  const createProvider = useCreateProvider();
  const addProviderAccount = useAddProviderAccount();
  const executeAndCopy = useExecuteAndCopy();

  const [createForm, setCreateForm] = useState({
    display_name: "",
    bio: "",
  });

  const [tradeForm, setTradeForm] = useState({
    symbol: "R_100",
    direction: "BUY" as "BUY" | "SELL",
    stake: 1,
    duration: 5,
  });

  const [lastResult, setLastResult] = useState<any>(null);

  const canBeProvider = myPlan?.pricing_plan?.allow_provider_listing ?? false;
  const derivAccounts = accounts?.filter(a => a.broker === "deriv") || [];
  const hasProviderAccount = myProvider?.provider_accounts && myProvider.provider_accounts.length > 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access provider dashboard</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.display_name) {
      toast.error("Display name is required");
      return;
    }

    try {
      await createProvider.mutateAsync(createForm);
      toast.success("Provider profile created! Awaiting admin approval.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create provider profile");
    }
  };

  const handleLinkAccount = async (accountId: string) => {
    if (!myProvider) return;
    
    try {
      await addProviderAccount.mutateAsync({
        provider_id: myProvider.id,
        trading_account_id: accountId,
      });
      toast.success("Trading account linked successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to link account");
    }
  };

  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!myProvider || myProvider.status !== "approved") {
      toast.error("Provider must be approved to trade");
      return;
    }

    if (!hasProviderAccount) {
      toast.error("Please link a trading account first");
      return;
    }

    try {
      const result = await executeAndCopy.mutateAsync({
        provider_id: myProvider.id,
        symbol: tradeForm.symbol,
        direction: tradeForm.direction,
        stake: tradeForm.stake,
        duration: tradeForm.duration,
        duration_unit: "t",
      });

      setLastResult(result);
      toast.success(`Trade executed! Copied to ${result.summary.successful_copies} subscribers`);
    } catch (error: any) {
      toast.error(error.message || "Trade execution failed");
    }
  };

  // Not a provider yet - show registration
  if (!providerLoading && !myProvider) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Become a Signal Provider</CardTitle>
              <CardDescription>
                Share your trading signals and earn from your expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canBeProvider && (
                <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <span className="font-medium">VIP Plan Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Only VIP members can become signal providers. 
                    <Link to="/billing" className="text-primary ml-1 hover:underline">
                      Upgrade now
                    </Link>
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateProvider} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    placeholder="Your trader name"
                    value={createForm.display_name}
                    onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                    disabled={!canBeProvider}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell subscribers about your trading experience and strategy..."
                    value={createForm.bio}
                    onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                    rows={4}
                    disabled={!canBeProvider}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!canBeProvider || createProvider.isPending}>
                  {createProvider.isPending ? "Creating..." : "Apply to Become Provider"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{myProvider?.display_name}</span>
              <Badge variant={
                myProvider?.status === "approved" ? "default" :
                myProvider?.status === "pending" ? "secondary" :
                "destructive"
              }>
                {myProvider?.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                {myProvider?.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                {myProvider?.status}
              </Badge>
              {myProvider?.verified && (
                <Badge variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriberCount || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myProvider?.total_trades || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myProvider?.win_rate?.toFixed(0) || 0}%</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ${myProvider?.total_profit?.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {myProvider?.status === "pending" && (
          <Card className="glass-card mb-6 border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Awaiting Admin Approval</p>
                  <p className="text-sm text-muted-foreground">
                    Your provider application is being reviewed. You'll be notified once approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="trade" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trade">Trade Panel</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="trade">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trade Panel */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Execute & Copy Trade</CardTitle>
                  <CardDescription>
                    Place a trade that will be copied to all your subscribers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!hasProviderAccount ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-warning mb-4" />
                      <p className="font-medium mb-2">No Trading Account Linked</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Link a Deriv account to start trading
                      </p>
                      {derivAccounts.length > 0 ? (
                        <Select onValueChange={handleLinkAccount}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account to link" />
                          </SelectTrigger>
                          <SelectContent>
                            {derivAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Button asChild>
                          <Link to="/accounts">Connect Deriv Account</Link>
                        </Button>
                      )}
                    </div>
                  ) : myProvider?.status !== "approved" ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Trading is disabled until your profile is approved
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleExecuteTrade} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Symbol</Label>
                        <Select
                          value={tradeForm.symbol}
                          onValueChange={(v) => setTradeForm({ ...tradeForm, symbol: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DERIV_SYMBOLS.map((sym) => (
                              <SelectItem key={sym.value} value={sym.value}>
                                {sym.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Direction</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={tradeForm.direction === "BUY" ? "default" : "outline"}
                            className={tradeForm.direction === "BUY" ? "bg-success hover:bg-success/90" : ""}
                            onClick={() => setTradeForm({ ...tradeForm, direction: "BUY" })}
                          >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            BUY (CALL)
                          </Button>
                          <Button
                            type="button"
                            variant={tradeForm.direction === "SELL" ? "default" : "outline"}
                            className={tradeForm.direction === "SELL" ? "bg-destructive hover:bg-destructive/90" : ""}
                            onClick={() => setTradeForm({ ...tradeForm, direction: "SELL" })}
                          >
                            <ArrowDown className="mr-2 h-4 w-4" />
                            SELL (PUT)
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stake">Stake (USD)</Label>
                          <Input
                            id="stake"
                            type="number"
                            min="0.35"
                            step="0.01"
                            value={tradeForm.stake}
                            onChange={(e) => setTradeForm({ ...tradeForm, stake: parseFloat(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (ticks)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            max="10"
                            value={tradeForm.duration}
                            onChange={(e) => setTradeForm({ ...tradeForm, duration: parseInt(e.target.value) || 5 })}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={executeAndCopy.isPending}
                      >
                        {executeAndCopy.isPending ? (
                          "Executing..."
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Execute & Copy to {subscriberCount || 0} Subscribers
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Last Result */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Last Trade Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {lastResult ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-1">Provider Trade</p>
                        <p className="font-mono text-sm">
                          Contract ID: {lastResult.provider_trade.contract_id}
                        </p>
                        <p className="text-sm">
                          Buy Price: ${lastResult.provider_trade.buy_price}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{lastResult.summary.total_subscribers}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="p-3 rounded-lg bg-success/10">
                          <p className="text-2xl font-bold text-success">
                            {lastResult.summary.successful_copies}
                          </p>
                          <p className="text-xs text-muted-foreground">Copied</p>
                        </div>
                        <div className="p-3 rounded-lg bg-destructive/10">
                          <p className="text-2xl font-bold text-destructive">
                            {lastResult.summary.failed_copies}
                          </p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                      </div>

                      {lastResult.copy_results.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Copy Details:</p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {lastResult.copy_results.map((r: any, i: number) => (
                              <div
                                key={i}
                                className={`text-xs p-2 rounded ${
                                  r.status === "success" ? "bg-success/10" : "bg-destructive/10"
                                }`}
                              >
                                {r.status === "success" ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-success" />
                                    ${r.stake} - {r.contract_id}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3 text-destructive" />
                                    {r.error}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No trades executed yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : trades && trades.length > 0 ? (
                  <div className="space-y-2">
                    {trades.map((trade) => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${
                            trade.direction === "BUY" ? "bg-success/20" : "bg-destructive/20"
                          }`}>
                            {trade.direction === "BUY" ? (
                              <ArrowUp className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{trade.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(trade.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${trade.stake}</p>
                          <Badge variant={trade.status === "closed" ? "default" : "secondary"}>
                            {trade.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No trades yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Provider Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Display Name</Label>
                    <Input value={myProvider?.display_name || ""} disabled />
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea value={myProvider?.bio || ""} disabled rows={4} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contact support to update your provider profile.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
