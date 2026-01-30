import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSignal } from "@/hooks/useManualSignals";
import { Signal, Send, TrendingUp, TrendingDown } from "lucide-react";

const SYMBOLS = [
  // Synthetic Indices
  { value: "R_100", label: "Volatility 100 Index", category: "synthetic" },
  { value: "R_75", label: "Volatility 75 Index", category: "synthetic" },
  { value: "R_50", label: "Volatility 50 Index", category: "synthetic" },
  { value: "R_25", label: "Volatility 25 Index", category: "synthetic" },
  { value: "R_10", label: "Volatility 10 Index", category: "synthetic" },
  { value: "BOOM1000", label: "Boom 1000", category: "synthetic" },
  { value: "BOOM500", label: "Boom 500", category: "synthetic" },
  { value: "CRASH1000", label: "Crash 1000", category: "synthetic" },
  { value: "CRASH500", label: "Crash 500", category: "synthetic" },
  { value: "STEPINDEX", label: "Step Index", category: "synthetic" },
  // Gold
  { value: "XAUUSD", label: "Gold (XAUUSD)", category: "gold" },
  // Forex
  { value: "EURUSD", label: "EUR/USD", category: "forex" },
  { value: "GBPUSD", label: "GBP/USD", category: "forex" },
  { value: "USDJPY", label: "USD/JPY", category: "forex" },
  { value: "GBPJPY", label: "GBP/JPY", category: "forex" },
  // NASDAQ
  { value: "NAS100", label: "NASDAQ 100", category: "nasdaq" },
  { value: "US30", label: "US30 (Dow Jones)", category: "nasdaq" },
  { value: "US500", label: "S&P 500", category: "nasdaq" },
  // Crypto
  { value: "BTCUSD", label: "Bitcoin (BTC/USD)", category: "crypto" },
  { value: "ETHUSD", label: "Ethereum (ETH/USD)", category: "crypto" },
];

const TIMEFRAMES = [
  { value: "M1", label: "1 Minute" },
  { value: "M5", label: "5 Minutes" },
  { value: "M15", label: "15 Minutes" },
  { value: "M30", label: "30 Minutes" },
  { value: "H1", label: "1 Hour" },
  { value: "H4", label: "4 Hours" },
  { value: "D1", label: "Daily" },
];

const BROKERS = [
  { value: "deriv", label: "Deriv" },
  { value: "weltrade", label: "Weltrade" },
  { value: "exness", label: "Exness" },
];

interface AdminSignalFormProps {
  onSuccess?: () => void;
}

export const AdminSignalForm = ({ onSuccess }: AdminSignalFormProps) => {
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [timeframe, setTimeframe] = useState("M5");
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>(["deriv", "weltrade", "exness"]);
  const [confidence, setConfidence] = useState("");
  const [reason, setReason] = useState("");

  const createSignal = useCreateSignal();

  const selectedSymbol = SYMBOLS.find(s => s.value === symbol);
  const category = selectedSymbol?.category || "forex";

  const handleBrokerToggle = (broker: string) => {
    setSelectedBrokers(prev => 
      prev.includes(broker) 
        ? prev.filter(b => b !== broker)
        : [...prev, broker]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol || !entryPrice || selectedBrokers.length === 0) {
      return;
    }

    await createSignal.mutateAsync({
      symbol,
      direction,
      entry_price: parseFloat(entryPrice),
      stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
      take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
      timeframe,
      category,
      broker: selectedBrokers,
      confidence: confidence ? parseInt(confidence) : undefined,
      reason: reason || undefined,
    });

    // Reset form
    setSymbol("");
    setEntryPrice("");
    setStopLoss("");
    setTakeProfit("");
    setConfidence("");
    setReason("");
    
    onSuccess?.();
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Signal className="h-5 w-5 text-primary" />
          Post New Signal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Symbol *</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Synthetic Indices
                  </div>
                  {SYMBOLS.filter(s => s.category === "synthetic").map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                  
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Gold
                  </div>
                  {SYMBOLS.filter(s => s.category === "gold").map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                  
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    NASDAQ / Indices
                  </div>
                  {SYMBOLS.filter(s => s.category === "nasdaq").map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                  
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Crypto
                  </div>
                  {SYMBOLS.filter(s => s.category === "crypto").map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                  
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Forex
                  </div>
                  {SYMBOLS.filter(s => s.category === "forex").map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Direction *</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={direction === "BUY" ? "default" : "outline"}
                  className={direction === "BUY" ? "bg-success hover:bg-success/90 flex-1" : "flex-1"}
                  onClick={() => setDirection("BUY")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  BUY
                </Button>
                <Button
                  type="button"
                  variant={direction === "SELL" ? "default" : "outline"}
                  className={direction === "SELL" ? "bg-destructive hover:bg-destructive/90 flex-1" : "flex-1"}
                  onClick={() => setDirection("SELL")}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  SELL
                </Button>
              </div>
            </div>
          </div>

          {/* Price Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Entry Price *</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 2345.50"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Take Profit</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 2360.00"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="border-success/30 focus:border-success"
              />
            </div>
            <div>
              <Label>Stop Loss</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 2340.00"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="border-destructive/30 focus:border-destructive"
              />
            </div>
          </div>

          {/* Timeframe & Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Confidence (%)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="e.g. 85"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
              />
            </div>
          </div>

          {/* Brokers */}
          <div>
            <Label className="mb-3 block">Available on Brokers *</Label>
            <div className="flex flex-wrap gap-4">
              {BROKERS.map(b => (
                <div key={b.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={b.value}
                    checked={selectedBrokers.includes(b.value)}
                    onCheckedChange={() => handleBrokerToggle(b.value)}
                  />
                  <label
                    htmlFor={b.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {b.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis/Reason */}
          <div>
            <Label>Analysis / Reason (optional)</Label>
            <Textarea
              placeholder="Explain the trade setup, key levels, or market context..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            variant="gold"
            disabled={createSignal.isPending || !symbol || !entryPrice || selectedBrokers.length === 0}
          >
            {createSignal.isPending ? (
              <>Publishing...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish Signal & Notify Users
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
