import { useState } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface QuickTradeProps {
  symbol: string;
}

const DURATION_OPTIONS = [
  { value: "5", unit: "t", label: "5 Ticks" },
  { value: "10", unit: "t", label: "10 Ticks" },
  { value: "15", unit: "t", label: "15 Ticks" },
  { value: "1", unit: "m", label: "1 Minute" },
  { value: "5", unit: "m", label: "5 Minutes" },
];

export const QuickTrade = ({ symbol }: QuickTradeProps) => {
  const { authorized, balance, placeTrade } = useDeriv();
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5_t");
  const [trading, setTrading] = useState<"CALL" | "PUT" | null>(null);
  const [lastTrade, setLastTrade] = useState<{
    type: "CALL" | "PUT";
    contract_id: number;
    payout: number;
  } | null>(null);

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
      const contract = await placeTrade({
        symbol,
        contract_type: type,
        amount,
        duration: parseInt(dur),
        duration_unit: unit as "t" | "m",
      });

      setLastTrade({
        type,
        contract_id: contract.contract_id,
        payout: contract.payout,
      });

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
        <span className="text-xs text-muted-foreground">{symbol}</span>
      </div>

      {/* Trade Settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Stake (USD)</label>
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
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success" />
          <div>
            <p className="text-sm font-medium">Last Trade: {lastTrade.type}</p>
            <p className="text-xs text-muted-foreground">
              Contract #{lastTrade.contract_id} • Payout: ${lastTrade.payout.toFixed(2)}
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
