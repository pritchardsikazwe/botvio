import { useAuth } from "@/contexts/AuthContext";
import { useHauzaSignals, Signal } from "@/hooks/useHauzaSignals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Clock,
  AlertTriangle,
  BookOpen,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface HauzaSniperPanelProps {
  symbol: string;
  timeframe: string;
}

export const HauzaSniperPanel = ({ symbol, timeframe }: HauzaSniperPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { signals, loading, analyzing, lastAnalysis, runAnalysis } = useHauzaSignals(symbol, timeframe);

  const activeSignals = signals.filter(s => s.status === "ACTIVE");
  const closedSignals = signals.filter(s => s.status !== "ACTIVE");

  const renderSignalCard = (signal: Signal) => (
    <Card key={signal.id} className="glass-card border-l-4 hover:border-primary/50 transition-all"
      style={{ borderLeftColor: signal.direction === "BUY" ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {signal.direction === "BUY" ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <Badge variant={signal.direction === "BUY" ? "default" : "destructive"}>
              {signal.direction}
            </Badge>
            <Badge variant="outline">{signal.timeframe}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Entry</p>
            <p className="font-mono font-semibold">{Number(signal.entry_price).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stop Loss</p>
            <p className="font-mono text-destructive">{signal.stop_loss ? Number(signal.stop_loss).toFixed(2) : "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Take Profit</p>
            <p className="font-mono text-success">{signal.take_profit ? Number(signal.take_profit).toFixed(2) : "-"}</p>
          </div>
        </div>

        {signal.reason && (
          <p className="text-sm text-muted-foreground mb-3 italic">
            "{signal.reason}"
          </p>
        )}

        {signal.zone_min && signal.zone_max && (
          <div className="flex items-center gap-2 text-xs">
            <Target className="w-3 h-3 text-primary" />
            <span>Zone: {Number(signal.zone_min).toFixed(2)} - {Number(signal.zone_max).toFixed(2)}</span>
          </div>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-3 w-full"
          onClick={() => navigate('/learn/overview')}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Why this signal? Learn the setup
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header with scan button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Hauza Sniper – {symbol}</h3>
        </div>
        <Button 
          variant="gold" 
          size="sm" 
          onClick={() => runAnalysis()}
          disabled={analyzing || !user}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Scan Now
            </>
          )}
        </Button>
      </div>

      {!user && (
        <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <p className="text-sm">Sign in to scan for signals and track your trades.</p>
        </div>
      )}

      {lastAnalysis && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Last scan: {new Date(lastAnalysis.analysisTime).toLocaleTimeString()}
        </div>
      )}

      {/* Signals Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-secondary/50">
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active ({activeSignals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            History ({closedSignals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading signals...</p>
            </div>
          ) : activeSignals.length > 0 ? (
            activeSignals.map(renderSignalCard)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active signals</p>
              <p className="text-xs mt-1">Click "Scan Now" to analyze the market</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {closedSignals.length > 0 ? (
            closedSignals.map(renderSignalCard)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No signal history yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Risk Warning */}
      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Trading is risky. No guaranteed profits. Always use proper risk management and demo accounts first.
        </p>
      </div>
    </div>
  );
};
