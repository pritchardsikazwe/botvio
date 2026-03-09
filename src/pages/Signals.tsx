import { useState, useEffect } from "react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { ManualSignalCard } from "@/components/signals/ManualSignalCard";
import { ChartUpload } from "@/components/signals/ChartUpload";
import { AdminSignalForm } from "@/components/signals/AdminSignalForm";
import { useManualSignals } from "@/hooks/useManualSignals";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Signal, 
  TrendingUp, 
  TrendingDown,
  Filter,
  RefreshCw,
  Bell,
  ImageIcon,
  Crown,
  Search,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHasProductType } from "@/hooks/useEntitlements";

const CATEGORIES = [
  { value: "all", label: "All Markets" },
  { value: "synthetic", label: "Synthetic Indices" },
  { value: "syntx", label: "Weltrade SyntX" },
  { value: "gold", label: "Gold" },
  { value: "nasdaq", label: "Indices" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
];

const BROKERS = [
  { value: "all", label: "All Brokers" },
  { value: "deriv", label: "Deriv" },
  { value: "weltrade", label: "Weltrade" },
  { value: "exness", label: "Exness" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
  { value: "EXPIRED", label: "Expired" },
];

const DIRECTION_OPTIONS = [
  { value: "all", label: "All Directions" },
  { value: "BUY", label: "Buy Only" },
  { value: "SELL", label: "Sell Only" },
];

const TIMEFRAME_OPTIONS = [
  { value: "all", label: "All Timeframes" },
  { value: "M1", label: "1 Minute" },
  { value: "M5", label: "5 Minutes" },
  { value: "M15", label: "15 Minutes" },
  { value: "M30", label: "30 Minutes" },
  { value: "H1", label: "1 Hour" },
  { value: "H4", label: "4 Hours" },
  { value: "D1", label: "Daily" },
];

const Signals = () => {
  const { user, isSignalManager } = useAuth();
  const [category, setCategory] = useState("all");
  const [broker, setBroker] = useState("all");
  const [status, setStatus] = useState("ACTIVE");
  const [direction, setDirection] = useState("all");
  const [timeframe, setTimeframe] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("signals");

  const { data: signals, isLoading, refetch } = useManualSignals({
    category,
    broker,
    status,
  });

  const isPremium = useHasProductType("signal_pack");
  const { permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    const channel = supabase
      .channel("signals-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trading_signals" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Apply client-side filters for direction, timeframe, search
  const filteredSignals = (signals || []).filter(s => {
    if (direction !== "all" && s.direction !== direction) return false;
    if (timeframe !== "all" && s.timeframe !== timeframe) return false;
    if (search && !s.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = filteredSignals.filter(s => s.status === "ACTIVE").length;
  const hasActiveFilters = category !== "all" || broker !== "all" || status !== "ACTIVE" || direction !== "all" || timeframe !== "all" || search !== "";

  const clearFilters = () => {
    setCategory("all");
    setBroker("all");
    setStatus("ACTIVE");
    setDirection("all");
    setTimeframe("all");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Trading Signals — Free Gold, Forex & Crypto Signals" description="Get free real-time trading signals for XAUUSD gold, EUR/USD, GBP/USD, synthetic indices & crypto. AI-powered analysis with entry price, stop loss & take profit levels updated daily." />
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                <Signal className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Trading Signals & AI Analysis</h1>
                <p className="text-muted-foreground">Expert signals & AI-powered chart analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPremium && (
                <Badge className="bg-gradient-to-r from-warning to-amber-500 text-white py-2 px-4">
                  <Crown className="h-4 w-4 mr-2" />Premium
                </Badge>
              )}
              <Badge variant="outline" className="text-lg py-2 px-4">
                <TrendingUp className="h-4 w-4 mr-2 text-success" />
                {activeCount} Active
              </Badge>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="signals" className="flex items-center gap-2">
              <Signal className="h-4 w-4" />Signals
            </TabsTrigger>
            <TabsTrigger value="chart-analysis" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />AI Chart
            </TabsTrigger>
            {isSignalManager && (
              <TabsTrigger value="post-signal" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />Post Signal
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="chart-analysis" className="mt-6">
            <ChartUpload isPremium={isPremium} />
          </TabsContent>

          {isSignalManager && (
            <TabsContent value="post-signal" className="mt-6">
              <AdminSignalForm onSuccess={() => refetch()} />
            </TabsContent>
          )}

          <TabsContent value="signals" className="mt-6">
            {/* Quick Direction Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                size="sm"
                variant={direction === "all" ? "default" : "outline"}
                onClick={() => setDirection("all")}
                className="rounded-full"
              >
                All Directions
              </Button>
              <Button
                size="sm"
                variant={direction === "BUY" ? "default" : "outline"}
                onClick={() => setDirection("BUY")}
                className={`rounded-full ${direction === "BUY" ? "bg-success hover:bg-success/90" : ""}`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />BUY
              </Button>
              <Button
                size="sm"
                variant={direction === "SELL" ? "default" : "outline"}
                onClick={() => setDirection("SELL")}
                className={`rounded-full ${direction === "SELL" ? "bg-destructive hover:bg-destructive/90" : ""}`}
              >
                <TrendingDown className="h-3 w-3 mr-1" />SELL
              </Button>

              <div className="h-6 w-px bg-border mx-1" />

              {/* Quick Category Chips */}
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  size="sm"
                  variant={category === cat.value ? "default" : "outline"}
                  onClick={() => setCategory(cat.value)}
                  className="rounded-full text-xs"
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Advanced Filters */}
            <Card className="glass-card mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                      <X className="h-3 w-3 mr-1" />Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search symbol..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Broker */}
                  <Select value={broker} onValueChange={setBroker}>
                    <SelectTrigger><SelectValue placeholder="Broker" /></SelectTrigger>
                    <SelectContent>
                      {BROKERS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Timeframe */}
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger><SelectValue placeholder="Timeframe" /></SelectTrigger>
                    <SelectContent>
                      {TIMEFRAME_OPTIONS.map((tf) => (
                        <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Status */}
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Direction */}
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger><SelectValue placeholder="Direction" /></SelectTrigger>
                    <SelectContent>
                      {DIRECTION_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Premium upsell */}
            {!isPremium && user && (
              <Card className="glass-card border-warning/30 mb-6">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-warning" />
                    <span className="text-sm">Subscribe to Premium Signals to see all signals</span>
                  </div>
                  <Button variant="gold" size="sm" asChild>
                    <a href="/marketplace">Browse Marketplace</a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Signals Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="glass-card animate-pulse">
                    <CardContent className="p-6"><div className="h-40 bg-muted/30 rounded-lg" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSignals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(isPremium ? filteredSignals : filteredSignals.slice(0, 3)).map((signal) => (
                  <ManualSignalCard key={signal.id} signal={signal} />
                ))}
                {!isPremium && filteredSignals.length > 3 && (
                  <Card className="glass-card border-dashed border-warning/50 flex items-center justify-center min-h-[200px]">
                    <CardContent className="text-center py-8">
                      <Crown className="h-10 w-10 text-warning mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">+{filteredSignals.length - 3} More Signals</h3>
                      <p className="text-sm text-muted-foreground mb-4">Upgrade to see all premium signals</p>
                      <Button variant="gold" size="sm" asChild><a href="/marketplace">Unlock All</a></Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-16 text-center">
                  <Signal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Signals Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    No trading signals match your current filters. Try adjusting the filters or check back later.
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notification prompt */}
            <Card className="glass-card mt-8 border-primary/30">
              <CardContent className="py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Never Miss a Signal</h3>
                      <p className="text-sm text-muted-foreground">Get instant notifications when new signals are posted</p>
                    </div>
                  </div>
                  <Button variant="gold" onClick={requestPermission} disabled={permission === "granted"}>
                    {permission === "granted" ? "✓ Notifications On" : "Enable Notifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Signals;