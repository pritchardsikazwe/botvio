import { useState, useEffect } from "react";
import { Header } from "@/components/trading/Header";
import { ManualSignalCard } from "@/components/signals/ManualSignalCard";
import { ChartUpload } from "@/components/signals/ChartUpload";
import { useManualSignals } from "@/hooks/useManualSignals";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter,
  RefreshCw,
  Bell,
  ImageIcon,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ManualSignal } from "@/hooks/useManualSignals";
import { useHasProductType } from "@/hooks/useEntitlements";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "synthetic", label: "Synthetic Indices" },
  { value: "syntx", label: "Weltrade SyntX" },
  { value: "gold", label: "Gold (XAUUSD)" },
  { value: "nasdaq", label: "NASDAQ" },
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

const Signals = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState("all");
  const [broker, setBroker] = useState("all");
  const [status, setStatus] = useState("ACTIVE");
  const [activeTab, setActiveTab] = useState("signals");

  const { data: signals, isLoading, refetch } = useManualSignals({
    category,
    broker,
    status,
  });

  const isPremium = useHasProductType("signal_pack");

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("signals-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trading_signals",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const activeCount = signals?.filter(s => s.status === "ACTIVE").length || 0;

  return (
    <div className="min-h-screen bg-background">
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
                <p className="text-muted-foreground">
                  Expert signals & AI-powered chart analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPremium && (
                <Badge className="bg-gradient-to-r from-warning to-amber-500 text-white py-2 px-4">
                  <Crown className="h-4 w-4 mr-2" />
                  Premium
                </Badge>
              )}
              <Badge variant="outline" className="text-lg py-2 px-4">
                <TrendingUp className="h-4 w-4 mr-2 text-success" />
                {activeCount} Active Signals
              </Badge>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs - Signals vs Chart Analysis */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="signals" className="flex items-center gap-2">
              <Signal className="h-4 w-4" />
              Trading Signals
            </TabsTrigger>
            <TabsTrigger value="chart-analysis" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              AI Chart Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart-analysis" className="mt-6">
            <ChartUpload isPremium={isPremium} />
          </TabsContent>

          <TabsContent value="signals" className="mt-6">
            {/* Filters */}
        <Card className="glass-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Broker</label>
                <Select value={broker} onValueChange={setBroker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {BROKERS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={setCategory} className="mb-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 h-auto bg-transparent">
            {CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Upgrade Prompt for free users */}
        {!isPremium && user && (
          <UpgradePrompt feature="Premium Signals" requiredPlan="Basic" className="mb-6" />
        )}

        {/* Signals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardContent className="p-6">
                  <div className="h-40 bg-muted/30 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : signals && signals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isPremium ? signals : signals.slice(0, 3)).map((signal) => (
              <ManualSignalCard key={signal.id} signal={signal} />
            ))}
            {!isPremium && signals.length > 3 && (
              <Card className="glass-card border-dashed border-warning/50 flex items-center justify-center min-h-[200px]">
                <CardContent className="text-center py-8">
                  <Crown className="h-10 w-10 text-warning mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">+{signals.length - 3} More Signals</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade to see all premium signals
                  </p>
                  <Button variant="gold" size="sm" asChild>
                    <a href="/billing">Unlock All</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Signal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Signals Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No trading signals match your current filters. Try adjusting the filters or check back later for new signals.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notification Prompt */}
        <Card className="glass-card mt-8 border-primary/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Never Miss a Signal</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant notifications when new signals are posted
                  </p>
                </div>
              </div>
              <Button variant="gold">
                Enable Notifications
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
