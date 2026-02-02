import { Brain, TrendingUp, BarChart3, Settings, Loader2, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useStrategiesWithSelections, useToggleStrategy, DEFAULT_STRATEGIES } from "@/hooks/useUserStrategies";
import { useAuth } from "@/contexts/AuthContext";

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
  botvio: <Brain className="w-5 h-5" />,
  sr: <BarChart3 className="w-5 h-5" />,
  momentum: <TrendingUp className="w-5 h-5" />,
  boom_crash: <Zap className="w-5 h-5" />,
  volatility_trend: <Activity className="w-5 h-5" />,
};

export const StrategyPanel = () => {
  const { user } = useAuth();
  const { strategies, isLoading, isAuthenticated } = useStrategiesWithSelections();
  const toggleMutation = useToggleStrategy();

  const handleToggle = (strategyCode: string, currentEnabled: boolean) => {
    if (!isAuthenticated) return;
    toggleMutation.mutate({ strategyCode, enabled: !currentEnabled });
  };

  // Show default strategies for non-authenticated users (read-only)
  const displayStrategies = isAuthenticated
    ? strategies
    : DEFAULT_STRATEGIES.map((s) => ({
        ...s,
        enabled: s.code === "botvio",
        selectionId: undefined,
      }));

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="data-label">Auto Trading</span>
          <h3 className="text-lg font-bold">Active Strategies</h3>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {displayStrategies.map((strategy) => (
            <div
              key={strategy.code}
              className={`p-4 rounded-xl border transition-all ${
                strategy.enabled
                  ? "bg-primary/5 border-primary/30"
                  : "bg-secondary/30 border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      strategy.enabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STRATEGY_ICONS[strategy.code] || <Brain className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold">{strategy.name}</h4>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </div>
                </div>
                <Switch
                  checked={strategy.enabled}
                  onCheckedChange={() => handleToggle(strategy.code, strategy.enabled)}
                  disabled={!isAuthenticated || toggleMutation.isPending}
                />
              </div>

              {strategy.enabled && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-success">Running</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-xs text-warning mt-4 pt-4 border-t border-border/50">
          Sign in to enable/disable strategies and save your preferences.
        </p>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
        Strategies run automatically when enabled. Past performance does not guarantee future results.
      </p>
    </div>
  );
};
