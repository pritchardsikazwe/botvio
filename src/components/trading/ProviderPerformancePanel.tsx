import { useProviderPerformance } from "@/hooks/useProviderPerformance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, TrendingDown, Target, DollarSign, 
  AlertTriangle, Award, BarChart3, Activity 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from "recharts";

interface ProviderPerformancePanelProps {
  providerId?: string;
}

export const ProviderPerformancePanel = ({ providerId }: ProviderPerformancePanelProps) => {
  const { data: metrics, isLoading, error } = useProviderPerformance(providerId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-muted-foreground">Failed to load performance metrics</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => 
    value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Win Rate */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(metrics.winRate)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.winningTrades}W / {metrics.losingTrades}L
            </p>
          </CardContent>
        </Card>

        {/* Net P&L */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net P&L</CardTitle>
            <DollarSign className={`h-4 w-4 ${metrics.netPnL >= 0 ? "text-success" : "text-destructive"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.netPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(metrics.netPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTrades} total trades
            </p>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.profitFactor >= 1.5 ? "Good" : metrics.profitFactor >= 1 ? "Break-even" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>

        {/* Sharpe Ratio */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sharpe Ratio</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sharpeRatio.toFixed(2)}</div>
            <Badge variant={metrics.sharpeRatio >= 1 ? "default" : metrics.sharpeRatio >= 0 ? "secondary" : "destructive"}>
              {metrics.sharpeRatio >= 2 ? "Excellent" : metrics.sharpeRatio >= 1 ? "Good" : metrics.sharpeRatio >= 0 ? "Low" : "Negative"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Max Drawdown */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">
              {formatCurrency(metrics.maxDrawdown)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(metrics.maxDrawdownPercent)} from peak
            </p>
          </CardContent>
        </Card>

        {/* Average Win */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Win</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">
              {formatCurrency(metrics.averageWin)}
            </div>
            <p className="text-xs text-muted-foreground">
              Best: {formatCurrency(metrics.bestTrade)}
            </p>
          </CardContent>
        </Card>

        {/* Average Loss */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">
              -{formatCurrency(metrics.averageLoss)}
            </div>
            <p className="text-xs text-muted-foreground">
              Worst: {formatCurrency(metrics.worstTrade)}
            </p>
          </CardContent>
        </Card>

        {/* Streaks */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Streaks</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-success font-bold">{metrics.consecutiveWins}W</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-destructive font-bold">{metrics.consecutiveLosses}L</span>
            </div>
            <p className="text-xs text-muted-foreground">Max consecutive</p>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve Chart */}
      {metrics.dailyReturns.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Equity Curve (Last 30 Days)</CardTitle>
            <CardDescription>Cumulative profit/loss over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.dailyReturns}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Cumulative P&L"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativePnL" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Performance */}
      {metrics.weeklyStats.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>P&L breakdown by week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === "pnl" ? `$${value.toFixed(2)}` : `${value.toFixed(0)}%`,
                      name === "pnl" ? "P&L" : "Win Rate"
                    ]}
                  />
                  <Bar dataKey="pnl" name="pnl">
                    {metrics.weeklyStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
