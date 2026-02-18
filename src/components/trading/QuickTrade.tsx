import { useState, useEffect, useCallback, useRef } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import type { DerivContractUpdate } from "@/types/deriv";

interface QuickTradeProps {
  symbol: string;
  onTradeUpdate?: (trade: {
    id: number;
    time: string;
    symbol: string;
    contractType: string;
    stake: number;
    status: "running" | "won" | "lost";
    pnl?: number;
    contractId?: number;
  }) => void;
}

const DURATION_OPTIONS = [
  { value: "5", unit: "t", label: "5 Ticks" },
  { value: "10", unit: "t", label: "10 Ticks" },
  { value: "15", unit: "t", label: "15 Ticks" },
  { value: "1", unit: "m", label: "1 Minute" },
  { value: "5", unit: "m", label: "5 Minutes" },
];

export const QuickTrade = ({ symbol, onTradeUpdate }: QuickTradeProps) => {
  const { authorized, balance, placeTrade, onContractUpdate, refreshBalance, accountInfo } = useDeriv();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5_t");
  const [trading, setTrading] = useState<"CALL" | "PUT" | null>(null);
  const [lastTrade, setLastTrade] = useState<{
    type: "CALL" | "PUT";
    contract_id: number;
    payout: number;
    settled?: boolean;
    profit?: number;
    status?: string;
  } | null>(null);
  const intentIdMap = useRef<Map<number, string>>(new Map());
  const executionIdMap = useRef<Map<number, string>>(new Map());
  const activeContractsRef = useRef<Set<number>>(new Set());

  // Listen for contract settlement events
  useEffect(() => {
    const unsub = onContractUpdate((update: DerivContractUpdate) => {
      if (!activeContractsRef.current.has(update.contract_id)) return;

      const isSettled = update.is_sold || update.is_expired || 
                        ["won", "lost", "sold"].includes(update.status);

      // Emit trade update for TradeStatusPanel
      if (onTradeUpdate) {
        onTradeUpdate({
          id: update.contract_id,
          time: new Date().toLocaleTimeString(),
          symbol: update.underlying || symbol,
          contractType: update.contract_type || "CALL",
          stake: update.buy_price,
          status: isSettled ? (update.profit >= 0 ? "won" : "lost") : "running",
          pnl: isSettled ? update.profit : undefined,
          contractId: update.contract_id,
        });
      }

      if (isSettled) {
        activeContractsRef.current.delete(update.contract_id);

        // Use Deriv's signed profit directly (no sign inversion!)
        const profit = update.profit;
        const finalStatus = profit >= 0 ? "won" : "lost";

        console.log(`[SETTLED] contract=${update.contract_id} profit=${profit} sell_price=${update.sell_price} status=${finalStatus}`);

        setLastTrade(prev => {
          if (prev && prev.contract_id === update.contract_id) {
            return { ...prev, settled: true, profit, status: finalStatus };
          }
          return prev;
        });

        // Update execution record from RUNNING → final status
        if (user) {
          const intentId = intentIdMap.current.get(update.contract_id);
          const execId = executionIdMap.current.get(update.contract_id);
          
          if (execId) {
            // Update existing RUNNING execution with settlement data
            supabase
              .from('executions')
              .update({
                pnl: profit,
                status: finalStatus.toUpperCase(),
                raw: update,
              })
              .eq('id', execId)
              .eq('user_id', user.id)
              .then(() => {
                executionIdMap.current.delete(update.contract_id);
                queryClient.invalidateQueries({ queryKey: ["executions"] });
                queryClient.invalidateQueries({ queryKey: ["todays-pnl"] });
              });
          } else {
            // Fallback: insert if no RUNNING record exists
            supabase
              .from('executions')
              .insert({
                user_id: user.id,
                trade_intent_id: intentId || null,
                broker_ref: update.contract_id.toString(),
                fill_price: update.buy_price,
                stake_or_lot: update.buy_price,
                pnl: profit,
                status: finalStatus.toUpperCase(),
                raw: update,
              })
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ["executions"] });
                queryClient.invalidateQueries({ queryKey: ["todays-pnl"] });
              });
          }

          // Update trade intent if exists
          if (intentId) {
            supabase
              .from('trade_intents')
              .update({ status: 'FILLED', broker_ref: update.contract_id.toString() })
              .eq('id', intentId)
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ["trade-intents"] });
              });
          }
        }

        // Show settlement toast
        if (profit >= 0) {
          toast.success(`Trade Won! +$${profit.toFixed(2)}`, {
            description: `Contract #${update.contract_id} settled`,
          });
        } else {
          toast.error(`Trade Lost: -$${Math.abs(profit).toFixed(2)}`, {
            description: `Contract #${update.contract_id} settled`,
          });
        }

        // Refresh balance from Deriv (truth source - never simulate!)
        // Multiple refreshes to ensure we catch the payout credit
        refreshBalance();
        setTimeout(() => refreshBalance(), 1500);
        setTimeout(() => refreshBalance(), 3000);
      }
    });

    return unsub;
  }, [onContractUpdate, refreshBalance, onTradeUpdate, symbol]);

  const handleTrade = async (type: "CALL" | "PUT") => {
    if (!authorized) {
      toast.error("Please connect your Deriv account first");
      return;
    }

    const [dur, unit] = duration.split("_");
    const amount = parseFloat(stake);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    if (balance && amount > balance.balance) {
      toast.error("Insufficient balance");
      return;
    }

    setTrading(type);

    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create trade intent record in DB
      let intentId: string | null = null;
      if (user) {
        const { data: intentData } = await supabase
          .from('trade_intents')
          .insert({
            user_id: user.id,
            intent: { symbol, contract_type: type, stake: amount, duration: parseInt(dur), duration_unit: unit },
            idempotency_key: idempotencyKey,
            status: 'SENT',
          })
          .select('id')
          .single();
        intentId = intentData?.id || null;
        queryClient.invalidateQueries({ queryKey: ["trade-intents"] });
      }

      const contract = await placeTrade({
        symbol,
        contract_type: type,
        amount,
        duration: parseInt(dur),
        duration_unit: unit as "t" | "m",
      });

      // Track this contract for settlement
      activeContractsRef.current.add(contract.contract_id);
      if (intentId) {
        intentIdMap.current.set(contract.contract_id, intentId);
      }

      // Insert RUNNING execution immediately so it shows in Trade History
      if (user) {
        const { data: execData } = await supabase
          .from('executions')
          .insert({
            user_id: user.id,
            trade_intent_id: intentId || null,
            broker_ref: contract.contract_id.toString(),
            fill_price: contract.buy_price,
            stake_or_lot: amount,
            pnl: null,
            status: 'RUNNING',
            raw: { symbol, contract_type: type, contract_id: contract.contract_id, buy_price: contract.buy_price, payout: contract.payout },
          })
          .select('id')
          .single();
        if (execData?.id) {
          executionIdMap.current.set(contract.contract_id, execData.id);
        }
        queryClient.invalidateQueries({ queryKey: ["executions"] });
      }

      setLastTrade({
        type,
        contract_id: contract.contract_id,
        payout: contract.payout,
      });

      // Emit running trade
      if (onTradeUpdate) {
        onTradeUpdate({
          id: contract.contract_id,
          time: new Date().toLocaleTimeString(),
          symbol,
          contractType: type,
          stake: amount,
          status: "running",
          contractId: contract.contract_id,
        });
      }

      toast.success(
        `${type} trade placed! Contract ID: ${contract.contract_id}`,
        { description: `Potential payout: $${contract.payout.toFixed(2)}` }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to place trade");
    } finally {
      setTrading(null);
    }
  };

  if (!authorized) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">Connect Deriv to enable trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Quick Trade</h3>
        <div className="flex items-center gap-2">
          {accountInfo && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${accountInfo.is_virtual ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
              {accountInfo.is_virtual ? 'DEMO' : 'REAL'}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{symbol}</span>
        </div>
      </div>

      {/* Trade Settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Stake ({balance?.currency || 'USD'})</label>
          <Input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            min="0.35"
            step="0.1"
            className="bg-secondary/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={`${opt.value}_${opt.unit}`} value={`${opt.value}_${opt.unit}`}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trade Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => handleTrade("CALL")}
          disabled={trading !== null}
          className="bg-success hover:bg-success/90 text-success-foreground h-12"
        >
          {trading === "CALL" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <TrendingUp className="w-5 h-5 mr-2" />
              BUY / CALL
            </>
          )}
        </Button>
        <Button
          onClick={() => handleTrade("PUT")}
          disabled={trading !== null}
          variant="destructive"
          className="h-12"
        >
          {trading === "PUT" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <TrendingDown className="w-5 h-5 mr-2" />
              SELL / PUT
            </>
          )}
        </Button>
      </div>

      {/* Last Trade Info */}
      {lastTrade && (
        <div className={`p-3 border rounded-lg flex items-center gap-3 ${
          lastTrade.settled
            ? lastTrade.profit! >= 0
              ? 'bg-success/10 border-success/20'
              : 'bg-destructive/10 border-destructive/20'
            : 'bg-primary/10 border-primary/20'
        }`}>
          <CheckCircle className={`w-5 h-5 ${
            lastTrade.settled
              ? lastTrade.profit! >= 0 ? 'text-success' : 'text-destructive'
              : 'text-primary animate-pulse'
          }`} />
          <div>
            <p className="text-sm font-medium">
              {lastTrade.settled 
                ? `${lastTrade.status === 'won' ? '✅ Won' : '❌ Lost'}: ${lastTrade.profit! >= 0 ? '+' : ''}$${lastTrade.profit!.toFixed(2)}`
                : `${lastTrade.type} Running...`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Contract #{lastTrade.contract_id} {lastTrade.settled ? '• Settled' : '• Payout: $' + lastTrade.payout.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Risk Warning */}
      <p className="text-xs text-muted-foreground text-center">
        ⚠️ Trading involves risk. Only trade what you can afford to lose.
      </p>
    </div>
  );
};
