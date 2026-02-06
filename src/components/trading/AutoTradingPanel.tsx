import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { useStrategiesWithSelections } from "@/hooks/useUserStrategies";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Zap, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TradeIntent {
  id: string;
  strategy_id: string | null;
  intent: {
    symbol?: string;
    direction?: string;
    stake?: number;
    contract_type?: string;
  };
  status: string;
  created_at: string;
  error: string | null;
}

interface Execution {
  id: string;
  trade_intent_id: string;
  broker_ref: string | null;
  fill_price: number | null;
  stake_or_lot: number;
  pnl: number | null;
  status: string | null;
  created_at: string;
}

export const AutoTradingPanel = () => {
  const { user } = useAuth();
  const { authorized, balance } = useDeriv();
  const { strategies, isLoading: strategiesLoading } = useStrategiesWithSelections();
  const queryClient = useQueryClient();
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);

  // Fetch user settings for auto trading
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["user_settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch recent trade intents
  const { data: tradeIntents, isLoading: intentsLoading, refetch: refetchIntents } = useQuery({
    queryKey: ["trade_intents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trade_intents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as TradeIntent[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds when active
  });

  // Fetch executions for recent intents
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ["executions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Execution[];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Update auto trading setting
  const updateAutoTrading = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error("Not authenticated");
      
      // Check if settings exist first
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      let error;
      if (existing) {
        // Update existing record
        const result = await supabase
          .from("user_settings")
          .update({
            auto_trading_enabled: enabled,
            auto_trading_consent_at: enabled ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            auto_trading_enabled: enabled,
            auto_trading_consent_at: enabled ? new Date().toISOString() : null,
          });
        error = result.error;
      }
      
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      setAutoTradingEnabled(enabled);
      queryClient.invalidateQueries({ queryKey: ["user_settings"] });
      toast.success(enabled ? "Auto trading enabled" : "Auto trading paused");
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error?.message || "Unknown error"}`);
      console.error("Auto trading update error:", error);
    },
  });

  useEffect(() => {
    if (userSettings) {
      setAutoTradingEnabled(userSettings.auto_trading_enabled ?? false);
    }
  }, [userSettings]);

  const enabledStrategies = strategies?.filter(s => s.enabled) || [];
  const balanceAmount = balance?.balance ?? 0;
  const hasBalance = balanceAmount > 0;
  const canAutoTrade = authorized && hasBalance && enabledStrategies.length > 0;

  const openTrades = tradeIntents?.filter(t => t.status === "SENT" || t.status === "QUEUED") || [];
  const completedTrades = tradeIntents?.filter(t => t.status === "FILLED" || t.status === "REJECTED" || t.status === "FAILED") || [];

  const totalPnL = executions?.reduce((sum, e) => sum + (e.pnl || 0), 0) || 0;

  if (!user) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Auto Trading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sign in to enable automatic trading</p>
        </CardContent>
      </Card>
    );
  }

  if (settingsLoading || strategiesLoading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Auto Trading
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchIntents()}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Badge variant={autoTradingEnabled ? "default" : "secondary"}>
              {autoTradingEnabled ? "Active" : "Paused"}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Automatically execute trades based on your selected strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto Trading Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            {autoTradingEnabled ? (
              <Play className="h-5 w-5 text-success" />
            ) : (
              <Pause className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="auto-trade" className="font-medium">
                Enable Auto Trading
              </Label>
              <p className="text-xs text-muted-foreground">
                Bot will trade when signals match your strategies
              </p>
            </div>
          </div>
          <Switch
            id="auto-trade"
            checked={autoTradingEnabled}
            onCheckedChange={(checked) => {
              if (!canAutoTrade && checked) {
                toast.error("Connect Deriv, add funds, and enable at least one strategy first");
                return;
              }
              updateAutoTrading.mutate(checked);
            }}
            disabled={updateAutoTrading.isPending}
          />
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={`p-2 rounded-lg ${authorized ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <CheckCircle2 className={`h-4 w-4 mx-auto mb-1 ${authorized ? 'text-success' : 'text-destructive'}`} />
            <p className="text-xs font-medium">{authorized ? 'Connected' : 'Disconnected'}</p>
          </div>
          <div className={`p-2 rounded-lg ${hasBalance ? 'bg-success/10' : 'bg-warning/10'}`}>
            <DollarSign className={`h-4 w-4 mx-auto mb-1 ${hasBalance ? 'text-success' : 'text-warning'}`} />
            <p className="text-xs font-medium">${balanceAmount.toFixed(2)}</p>
          </div>
          <div className={`p-2 rounded-lg ${enabledStrategies.length > 0 ? 'bg-success/10' : 'bg-muted'}`}>
            <Zap className={`h-4 w-4 mx-auto mb-1 ${enabledStrategies.length > 0 ? 'text-success' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">{enabledStrategies.length} Strategies</p>
          </div>
        </div>

        {/* Active Strategies */}
        {enabledStrategies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Active Strategies:</p>
            <div className="flex flex-wrap gap-1">
              {enabledStrategies.map((strategy) => (
                <Badge key={strategy.code} variant="outline" className="text-xs">
                  {strategy.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Open Trades */}
        {openTrades.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Open Trades ({openTrades.length})
            </p>
            <div className="space-y-1">
              {openTrades.slice(0, 3).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-2 rounded bg-primary/5 text-xs">
                  <div className="flex items-center gap-2">
                    {trade.intent?.direction === "BUY" ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className="font-medium">{trade.intent?.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>${trade.intent?.stake}</span>
                    <Badge variant="secondary" className="text-xs py-0">
                      {trade.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completed Trades */}
        {completedTrades.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent Trades:</p>
            <div className="space-y-1">
              {completedTrades.slice(0, 3).map((trade) => {
                const execution = executions?.find(e => e.trade_intent_id === trade.id);
                return (
                  <div key={trade.id} className="flex items-center justify-between p-2 rounded bg-secondary/30 text-xs">
                    <div className="flex items-center gap-2">
                      {trade.intent?.direction === "BUY" ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span>{trade.intent?.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {execution?.pnl !== null && execution?.pnl !== undefined ? (
                        <span className={execution.pnl >= 0 ? "text-success" : "text-destructive"}>
                          {execution.pnl >= 0 ? '+' : ''}{execution.pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      <Badge 
                        variant={trade.status === "FILLED" ? "default" : "destructive"} 
                        className="text-xs py-0"
                      >
                        {trade.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Total P/L */}
        {executions && executions.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <span className="text-sm font-medium">Total P/L:</span>
            <span className={`text-lg font-bold ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USD
            </span>
          </div>
        )}

        {/* Warning if not ready */}
        {!canAutoTrade && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-warning">Setup Required</p>
              <ul className="text-muted-foreground mt-1 space-y-0.5">
                {!authorized && <li>• Connect your Deriv account</li>}
                {!hasBalance && <li>• Add funds to your account</li>}
                {enabledStrategies.length === 0 && <li>• Enable at least one strategy</li>}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
