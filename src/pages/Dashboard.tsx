import { useAuth } from "@/contexts/AuthContext";
import { useBotInstances, useMyCopySubscriptions, useTradingAccounts, useMySubscription, useNotifications } from "@/hooks/useBotvio";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Wallet, Users, TrendingUp, Bell, ArrowRight, Play, Pause, AlertCircle, BarChart3 } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { MarketDataPanel } from "@/components/trading/MarketDataPanel";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: botInstances, isLoading: botsLoading } = useBotInstances();
  const { data: subscriptions, isLoading: subsLoading } = useMyCopySubscriptions();
  const { data: accounts, isLoading: accountsLoading } = useTradingAccounts();
  const { data: myPlan, isLoading: planLoading } = useMySubscription();
  const { data: notifications } = useNotifications();

  const activeBots = botInstances?.filter(b => b.status === "active").length || 0;
  const activeSubscriptions = subscriptions?.filter(s => s.status === "active").length || 0;
  const connectedAccounts = accounts?.length || 0;
  const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;

  // Fetch real today's P&L from executions
  const { data: todayPnL = 0 } = useQuery({
    queryKey: ["todays-pnl", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("executions")
        .select("pnl")
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());
      if (error) throw error;
      return (data || []).reduce((sum, e) => sum + (e.pnl || 0), 0);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Manage your trading bots and copy trading subscriptions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Bots</CardTitle>
              <Bot className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {botsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{activeBots}</div>
              )}
              <p className="text-xs text-muted-foreground">
                of {botInstances?.length || 0} total instances
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${todayPnL >= 0 ? "text-success" : "text-destructive"}`}>
                {todayPnL >= 0 ? "+" : ""}{todayPnL.toFixed(2)} USD
              </div>
              <p className="text-xs text-muted-foreground">
                across all accounts
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connected Accounts</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{connectedAccounts}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Deriv & Binance
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Copy Trading</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {subsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{activeSubscriptions}</div>
              )}
              <p className="text-xs text-muted-foreground">
                active subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Plan */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link to="/billing">Upgrade Plan</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {myPlan?.pricing_plan?.name || "Starter"}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <span>Max Bots: {myPlan?.pricing_plan?.max_bot_instances || 2}</span>
                  <span className="mx-2">•</span>
                  <span>Max Accounts: {myPlan?.pricing_plan?.max_accounts || 1}</span>
                  <span className="mx-2">•</span>
                  <span>Copy Trading: {myPlan?.pricing_plan?.allow_copy_trading ? "✓" : "✗"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Market Data Panel */}
        <div className="mb-8">
          <MarketDataPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bot Instances */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bot Instances</CardTitle>
                  <CardDescription>Your active trading bots</CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link to="/bots">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {botsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : botInstances && botInstances.length > 0 ? (
                <div className="space-y-3">
                  {botInstances.slice(0, 3).map((instance) => (
                    <div
                      key={instance.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          instance.status === "active" ? "bg-success" : 
                          instance.status === "paused" ? "bg-warning" : "bg-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-medium">{instance.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {instance.bot?.name} • {instance.markets?.join(", ")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        {instance.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No bots configured yet</p>
                  <Button asChild>
                    <Link to="/bots">Browse Bots</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Notifications
                    {unreadNotifications > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Recent activity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        notif.is_read ? "bg-muted/30" : "bg-muted/50"
                      }`}
                    >
                      <div className={`mt-1 ${
                        notif.type === "success" ? "text-success" :
                        notif.type === "warning" ? "text-warning" :
                        notif.type === "error" ? "text-destructive" :
                        notif.type === "trade" ? "text-primary" :
                        "text-muted-foreground"
                      }`}>
                        {notif.type === "trade" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : notif.type === "error" ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notif.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Broker Section */}
        {connectedAccounts === 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Start Trading on Deriv</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Trade synthetic indices 24/7. Boom, Crash, Volatility, and more with stakes as low as $0.35!
                    </p>
                    <a
                      href="https://track.deriv.com/_h8e_odrKXNCTjSHedV4mENd7ZgqdRLk/1/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="gold" size="sm">
                        Create Deriv Account <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-success/30 bg-gradient-to-br from-success/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Trade Forex on Exness</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ultra-tight spreads, instant withdrawals. Perfect for XAUUSD and NAS100 strategies!
                    </p>
                    <a
                      href="https://one.exnesstrack.org/a/up2tpvqknx"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="bg-success hover:bg-success/90">
                        Create Exness Account <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link to="/accounts">
              <Wallet className="h-6 w-6 mb-2" />
              <span>Connect Account</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link to="/bots">
              <Bot className="h-6 w-6 mb-2" />
              <span>Activate Bot</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link to="/providers">
              <Users className="h-6 w-6 mb-2" />
              <span>Copy Traders</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link to="/provider-dashboard">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Provider Panel</span>
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
