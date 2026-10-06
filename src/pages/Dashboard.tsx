import { useAuth } from "@/contexts/AuthContext";
import { useBotInstances, useMyCopySubscriptions, useTradingAccounts, useNotifications, useMyProvider, useUpdateBotInstance, useMarkNotificationRead } from "@/hooks/useBotvio";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Wallet, Users, TrendingUp, Bell, ArrowRight, Play, Pause, AlertCircle, BarChart3, Signal, CandlestickChart } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { MarketDataPanel } from "@/components/trading/MarketDataPanel";
import { SEOHead } from "@/components/seo/SEOHead";
import { BotvioRobotSignalShortcut } from "@/components/dashboard/BotvioRobotSignalShortcut";
import { useEntitlements, isEntitlementActive } from "@/hooks/useEntitlements";
import { isRestrictedOnStore } from "@/lib/mobile";
import { useState } from "react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: botInstances, isLoading: botsLoading, isError: botsError, refetch: refetchBots } = useBotInstances();
  const { data: subscriptions, isLoading: subsLoading } = useMyCopySubscriptions();
  const { data: accounts, isLoading: accountsLoading } = useTradingAccounts();
  const { data: entitlements, isLoading: entitlementsLoading, isError: entitlementsError, refetch: refetchEntitlements } = useEntitlements();
  const { data: notifications, isLoading: notificationsLoading, isError: notificationsError, refetch: refetchNotifications } = useNotifications();
  const { data: myProvider } = useMyProvider();
  const updateBot = useUpdateBotInstance();
  const markNotificationRead = useMarkNotificationRead();
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const activeRobots = entitlements?.filter(e => e.products?.type === "bot" && e.products?.slug !== "mt5-direct" && isEntitlementActive(e)).length || 0;
  const activeHubs = entitlements?.filter(e => e.products?.type !== "bot" && isEntitlementActive(e)).length || 0;
  const activeSubscriptions = subscriptions?.filter(s => s.status === "active").length || 0;
  const connectedAccounts = accounts?.length || 0;
  const connectedBrokerNames = Array.from(new Set((accounts ?? []).map((a: any) => String(a.broker || "MT5").toUpperCase()))).join(" · ") || "No accounts yet";
  const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;

  // Fetch closed P&L and direct signals sent today
  const { data: pnlSummary, isLoading: pnlLoading, isError: pnlError, refetch: refetchPnl } = useQuery({
    queryKey: ["todays-pnl", user?.id],
    queryFn: async () => {
      if (!user) return { pnl: null, signalsSent: 0 };
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [closed, direct] = await Promise.all([
        supabase.from("executions").select("pnl").eq("user_id", user.id).gte("created_at", todayStart.toISOString()).not("pnl", "is", null),
        supabase.from("direct_executions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", todayStart.toISOString()),
      ]);
      if (closed.error) throw closed.error;
      if (direct.error) throw direct.error;
      const rows = closed.data || [];
      return { pnl: rows.length ? rows.reduce((sum, e) => sum + Number(e.pnl || 0), 0) : null, signalsSent: direct.count || 0 };
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Trading Dashboard" description="Monitor your active Botvio robots, MT5 connections, copy trading and portfolio performance in one workspace." noIndex />
      <Header />
      
      <main className="container mx-auto px-3 py-4 md:px-4">
        {/* Welcome Section */}
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-1">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Your Botvio access, MT5 connection, signals and activity in one place.
          </p>
        </div>

        {/* One-click MT5 connection + automatic Botvio Robot signal delivery */}
        <BotvioRobotSignalShortcut />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Robots</CardTitle>
              <Bot className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-xl font-bold">{activeRobots}</div>
              <p className="text-xs text-muted-foreground">current robot entitlements</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's P&L (closed trades)</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className={`text-xl font-bold ${pnlSummary?.pnl == null ? "text-muted-foreground" : pnlSummary.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                {pnlLoading ? <Skeleton className="h-7 w-24" /> : pnlError ? "—" : pnlSummary?.pnl == null ? "—" : (pnlSummary.pnl >= 0 ? "+" : "") + pnlSummary.pnl.toFixed(2) + " USD"}
              </div>
              <p className="text-xs text-muted-foreground">
                {pnlSummary?.signalsSent ? pnlSummary.signalsSent + " signals sent today" : "No closed trades today"}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hubs & Access</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1 pb-3"><div className="text-xl font-bold">{activeHubs}</div><p className="text-xs text-muted-foreground">active hub access</p></CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connected Accounts</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              {accountsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-xl font-bold">{connectedAccounts}</div>
              )}
              <p className="text-xs text-muted-foreground">{connectedBrokerNames}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Copy Trading</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              {subsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-xl font-bold">{activeSubscriptions}</div>
              )}
              <p className="text-xs text-muted-foreground">
                active subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Botvio Access */}
        <Card className="glass-card mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Botvio Access</CardTitle>
                <CardDescription>Your active Store products</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link to="/marketplace">Open Botvio Store</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {entitlementsLoading ? <Skeleton className="h-8 w-full" /> : entitlementsError ? <div className="text-sm text-destructive">Could not load access. <Button size="sm" variant="outline" onClick={() => refetchEntitlements()}>Retry</Button></div> : entitlements?.filter(isEntitlementActive).length ? entitlements.filter(isEntitlementActive).map((e) => (
                <Button key={e.id} asChild variant="secondary" className="h-auto text-sm px-3 py-1.5"><Link to={e.products?.slug === "synthetic-hub" ? "/synthetic" : e.products?.slug === "weltrade-hub" ? "/weltrade" : e.products?.slug === "mt5-direct" ? "/connections" : "/botvio-robot"}>{e.products?.name || "Active product"} · {e.ends_at ? new Date(e.ends_at).toLocaleDateString() : "No expiry"}</Link></Button>
              )) : <span className="text-sm text-muted-foreground">No active Store products yet.</span>}
            </div>
            {entitlements && entitlements.some(e => !isEntitlementActive(e)) && <div className="mt-2 text-xs text-muted-foreground">Expired: {entitlements.filter(e => !isEntitlementActive(e)).map(e => e.products?.name || "Product").join(", ")}</div>}
          </CardContent>
        </Card>

        {/* Live Market Data Panel */}
        <div className="mb-4">
          <MarketDataPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Bot Instances */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Legacy Bot Instances</CardTitle>
                  <CardDescription>Your current bot instances</CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link to="/bots">
                    View Robots <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              {botsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : botsError ? (<div className="text-sm text-destructive">Could not load bots. <Button size="sm" variant="outline" onClick={() => refetchBots()}>Retry</Button></div>) : botInstances && botInstances.length > 0 ? (
                <div className="space-y-2">
                  {botInstances.slice(0, 3).map((instance) => (
                    <div
                      key={instance.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
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
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={updateBot.isPending} onClick={() => updateBot.mutate({ id: instance.id, status: instance.status === "active" ? "paused" : "active" })} aria-label={instance.status === "active" ? "Pause bot" : "Start bot"}
                      >
                        {instance.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                  <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => setShowAllNotifications(v => !v)}>{showAllNotifications ? "Show recent" : "View all"}</Button><Button size="sm" variant="ghost" disabled={!unreadNotifications} onClick={async () => { const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false); if (!error) refetchNotifications(); }}>Mark all read</Button></div>
                </div>
              ) : (
                <div className="text-center py-5">
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
            <CardContent className="pt-1 pb-3">
              {notificationsLoading ? <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : notificationsError ? <div className="text-sm text-destructive">Could not load notifications. <Button size="sm" variant="outline" onClick={() => refetchNotifications()}>Retry</Button></div> : notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                  {(showAllNotifications ? notifications : notifications.slice(0, 5)).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => { if (!notif.is_read) markNotificationRead.mutate(notif.id); }} className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer ${
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
                <div className="text-center py-5">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Broker Section */}
        {connectedAccounts === 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4">
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
                      href="https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/"
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
              <CardContent className="p-4">
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
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{[
          { path: "/signals", icon: Signal, label: "Live Signals" },
          { path: "/markets", icon: CandlestickChart, label: "Trading Workspace" },
          { path: "/accounts", icon: Wallet, label: "Connect Account" },
          { path: "/bots", icon: Bot, label: "Activate Bot" },
          { path: "/copy-trading", icon: Users, label: "Copy Traders" },
          ...(myProvider ? [{ path: "/provider-dashboard", icon: TrendingUp, label: "Provider Panel" }] : []),
        ].filter(action => !isRestrictedOnStore(action.path)).map(({ path, icon: Icon, label }) => <Button key={path} variant="outline" className="h-auto py-3 flex-col" asChild><Link to={path}><Icon className="h-6 w-6 mb-2" /><span>{label}</span></Link></Button>)}</div>\n    </main>
    </div>
  );
};

export default Dashboard;
