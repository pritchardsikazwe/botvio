import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProviders, useTradingAccounts, useSubscribeToProvider, useMyCopySubscriptions } from "@/hooks/useBotvio";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/trading/Header";
import { useNavigate, Link } from "react-router-dom";
import { Users, TrendingUp, Award, Star, CheckCircle, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Provider } from "@/types/botvio";

const Providers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: providers, isLoading } = useProviders();
  const { data: accounts } = useTradingAccounts();
  const { data: mySubscriptions } = useMyCopySubscriptions();
  const gate = useSubscriptionGate();
  const subscribe = useSubscribeToProvider();

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subscribeForm, setSubscribeForm] = useState({
    trading_account_id: "",
    copy_mode: "fixed" as "fixed" | "multiplier" | "proportional",
    fixed_stake: 1,
    multiplier: 1,
  });

  const canUseCopyTrading = gate.canCopyTrade;

  const isSubscribedTo = (providerId: string) => {
    return mySubscriptions?.some(
      (s) => s.provider_id === providerId && s.status === "active"
    );
  };

  const handleSubscribe = (provider: Provider) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }
    
    if (!canUseCopyTrading) {
      toast.error("Upgrade to Pro or VIP to use copy trading");
      navigate("/billing");
      return;
    }

    if (!accounts || accounts.length === 0) {
      toast.error("Please connect a trading account first");
      navigate("/accounts");
      return;
    }

    setSelectedProvider(provider);
    setSubscribeForm({
      ...subscribeForm,
      trading_account_id: accounts[0]?.id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmitSubscription = async () => {
    if (!selectedProvider || !subscribeForm.trading_account_id) {
      toast.error("Please select a trading account");
      return;
    }

    try {
      await subscribe.mutateAsync({
        provider_id: selectedProvider.id,
        trading_account_id: subscribeForm.trading_account_id,
        copy_mode: subscribeForm.copy_mode,
        fixed_stake: subscribeForm.fixed_stake,
        multiplier: subscribeForm.multiplier,
      });

      toast.success(`Successfully subscribed to ${selectedProvider.display_name}!`);
      setIsDialogOpen(false);
      setSelectedProvider(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to subscribe");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view providers</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
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
            <h1 className="text-3xl font-bold mb-2">Copy Trading Providers</h1>
            <p className="text-muted-foreground">
              Subscribe to top traders and automatically copy their trades
            </p>
          </div>
          
          <Button variant="outline" asChild>
            <Link to="/provider-dashboard">
              Become a Provider
            </Link>
          </Button>
        </div>

        {!canUseCopyTrading && (
          <Card className="glass-card mb-6 border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium">Copy Trading requires Pro or VIP plan</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade your plan to subscribe to providers and copy their trades
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link to="/billing">Upgrade Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Providers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="glass-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-lg">
                        {provider.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {provider.display_name}
                          {provider.verified && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </CardTitle>
                        <CardDescription>Deriv Provider</CardDescription>
                      </div>
                    </div>
                    {provider.verified && (
                      <Badge variant="secondary">
                        <Award className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {provider.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {provider.bio}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-success">
                        {provider.win_rate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">
                        {provider.total_trades}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Trades</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {provider.total_subscribers} subscribers
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      ${provider.total_profit.toFixed(2)} profit
                    </span>
                  </div>

                  {isSubscribedTo(provider.id) ? (
                    <Button variant="outline" className="w-full" disabled>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Subscribed
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(provider)}
                      disabled={!canUseCopyTrading}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Subscribe & Copy
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No providers available yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to become a signal provider and earn from your trading skills
              </p>
              <Button asChild>
                <Link to="/provider-dashboard">Become a Provider</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Subscribe Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to {selectedProvider?.display_name}</DialogTitle>
            <DialogDescription>
              Configure how you want to copy trades from this provider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trading Account</Label>
              <Select
                value={subscribeForm.trading_account_id}
                onValueChange={(v) => setSubscribeForm({ ...subscribeForm, trading_account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter(a => a.broker === "deriv").map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Copy Mode</Label>
              <RadioGroup
                value={subscribeForm.copy_mode}
                onValueChange={(v: "fixed" | "multiplier" | "proportional") =>
                  setSubscribeForm({ ...subscribeForm, copy_mode: v })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="font-normal">
                    Fixed Stake - Same stake every trade
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiplier" id="multiplier" />
                  <Label htmlFor="multiplier" className="font-normal">
                    Multiplier - Multiply provider's stake
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="proportional" id="proportional" />
                  <Label htmlFor="proportional" className="font-normal">
                    Proportional - Based on balance ratio
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {subscribeForm.copy_mode === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="fixed_stake">Fixed Stake (USD)</Label>
                <Input
                  id="fixed_stake"
                  type="number"
                  min="0.35"
                  step="0.01"
                  value={subscribeForm.fixed_stake}
                  onChange={(e) =>
                    setSubscribeForm({ ...subscribeForm, fixed_stake: parseFloat(e.target.value) || 1 })
                  }
                />
              </div>
            )}

            {subscribeForm.copy_mode === "multiplier" && (
              <div className="space-y-2">
                <Label htmlFor="multiplier">Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={subscribeForm.multiplier}
                  onChange={(e) =>
                    setSubscribeForm({ ...subscribeForm, multiplier: parseFloat(e.target.value) || 1 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  If provider stakes $10 and multiplier is 2x, you'll stake $20
                </p>
              </div>
            )}

            {subscribeForm.copy_mode === "proportional" && (
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                Your stake will be calculated as: (Your Balance / Provider Balance) × Provider Stake
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitSubscription} disabled={subscribe.isPending}>
              {subscribe.isPending ? "Subscribing..." : "Subscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Providers;
