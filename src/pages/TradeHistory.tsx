import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  DollarSign,
  Filter,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { useExecutions, useTradeIntents, useTradeUpdates } from "@/hooks/useTrading";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const TradeHistory = () => {
  const { user } = useAuth();
  const { data: executions, isLoading: execLoading, refetch: refetchExec } = useExecutions();
  const { data: intents, isLoading: intentsLoading, refetch: refetchIntents } = useTradeIntents();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Subscribe to real-time updates
  useTradeUpdates();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'WON':
      case 'FILLED':
      case 'OPEN':
        return 'text-success';
      case 'RUNNING':
      case 'QUEUED':
      case 'SENT':
        return 'text-primary';
      case 'LOST':
      case 'REJECTED':
      case 'FAILED':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view trade history</h1>
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
            <h1 className="text-3xl font-bold mb-2">Trade History</h1>
            <p className="text-muted-foreground">
              View all your trade executions and intents
            </p>
          </div>
          <Button variant="outline" onClick={() => { refetchExec(); refetchIntents(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="executions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="executions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Executions
              {executions && <Badge variant="secondary" className="ml-1">{executions.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="intents" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Trade Intents
              {intents && <Badge variant="secondary" className="ml-1">{intents.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executions" className="space-y-4">
            {execLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : executions && executions.length > 0 ? (
              <div className="space-y-3">
                {executions.map((exec) => (
                  <Collapsible key={exec.id} open={expandedId === exec.id}>
                    <Card className="glass-card">
                      <CollapsibleTrigger 
                        className="w-full"
                        onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${
                                exec.status === 'RUNNING' ? 'bg-primary/10' :
                                (exec.pnl || 0) >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                              }`}>
                                {exec.status === 'RUNNING' ? (
                                  <Clock className="h-5 w-5 text-primary animate-pulse" />
                                ) : (exec.pnl || 0) >= 0 ? (
                                  <ArrowUpRight className="h-5 w-5 text-success" />
                                ) : (
                                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-medium">
                                  {exec.raw?.symbol || exec.raw?.underlying || (exec.broker_ref ? `Contract #${exec.broker_ref}` : 'Execution')}
                                  {exec.raw?.contract_type && <span className="text-xs text-muted-foreground ml-1">({exec.raw.contract_type})</span>}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(exec.created_at)} {exec.broker_ref && `• #${exec.broker_ref}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium">
                                  Stake: ${exec.stake_or_lot?.toFixed(2)}
                                </p>
                                {exec.status === 'RUNNING' ? (
                                  <p className="text-sm text-primary animate-pulse">Running...</p>
                                ) : exec.pnl !== null && (
                                  <p className={`text-sm ${(exec.pnl || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    P&L: {exec.pnl >= 0 ? '+' : ''}{exec.pnl?.toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <Badge className={getStatusColor(exec.status || '')}>
                                {exec.status}
                              </Badge>
                              <ChevronDown className={`h-4 w-4 transition-transform ${
                                expandedId === exec.id ? 'rotate-180' : ''
                              }`} />
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="p-3 rounded-lg bg-muted/30 mt-2">
                            <p className="text-xs text-muted-foreground mb-2">Raw Response</p>
                            <pre className="text-xs overflow-auto max-h-48">
                              {JSON.stringify(exec.raw, null, 2)}
                            </pre>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No executions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your trade executions will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="intents" className="space-y-4">
            {intentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : intents && intents.length > 0 ? (
              <div className="space-y-3">
                {intents.map((intent) => (
                  <Card key={intent.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {intent.intent?.symbol || 'Unknown'} - {intent.intent?.contract_type || 'Trade'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(intent.created_at)} • {intent.idempotency_key}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">
                              ${intent.intent?.stake?.toFixed(2) || '0.00'}
                            </p>
                            {intent.broker_ref && (
                              <p className="text-xs text-muted-foreground">
                                Ref: {intent.broker_ref}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(intent.status)}>
                            {intent.status}
                          </Badge>
                        </div>
                      </div>
                      {intent.error && (
                        <div className="mt-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
                          {intent.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No trade intents yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your trade requests will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TradeHistory;
