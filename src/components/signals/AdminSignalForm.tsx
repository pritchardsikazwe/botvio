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
  // Synthetic Indices (Deriv)
  { value: "R_100", label: "Volatility 100 Index", category: "synthetic" },
  { value: "R_75", label: "Volatility 75 Index", category: "synthetic" },
  { value: "R_50", label: "Volatility 50 Index", category: "synthetic" },
  { value: "R_25", label: "Volatility 25 Index", category: "synthetic" },
  { value: "R_10", label: "Volatility 10 Index", category: "synthetic" },
  { value: "BOOM1000", label: "Boom 1000", category: "synthetic" },
  { value: "BOOM500", label: "Boom 500", category: "synthetic" },
  { value: "BOOM300", label: "Boom 300", category: "synthetic" },
  { value: "CRASH1000", label: "Crash 1000", category: "synthetic" },
  { value: "CRASH500", label: "Crash 500", category: "synthetic" },
  { value: "CRASH300", label: "Crash 300", category: "synthetic" },
  { value: "STEPINDEX", label: "Step Index", category: "synthetic" },
  { value: "JD100", label: "Jump 100", category: "synthetic" },
  { value: "JD75", label: "Jump 75", category: "synthetic" },
  { value: "JD50", label: "Jump 50", category: "synthetic" },
  { value: "JD25", label: "Jump 25", category: "synthetic" },
  { value: "JD10", label: "Jump 10", category: "synthetic" },

  // Weltrade SyntX — PainX Series
  { value: "PAINX100", label: "PainX 100", category: "syntx" },
  { value: "PAINX200", label: "PainX 200", category: "syntx" },
  { value: "PAINX400", label: "PainX 400", category: "syntx" },
  { value: "PAINX600", label: "PainX 600", category: "syntx" },
  { value: "PAINX800", label: "PainX 800", category: "syntx" },
  { value: "PAINX1200", label: "PainX 1200", category: "syntx" },
  // Weltrade SyntX — GainX Series
  { value: "GAINX100", label: "GainX 100", category: "syntx" },
  { value: "GAINX200", label: "GainX 200", category: "syntx" },
  { value: "GAINX400", label: "GainX 400", category: "syntx" },
  { value: "GAINX600", label: "GainX 600", category: "syntx" },
  { value: "GAINX800", label: "GainX 800", category: "syntx" },
  { value: "GAINX1200", label: "GainX 1200", category: "syntx" },
  // Weltrade SyntX — TrendX Series
  { value: "TRENDX200", label: "TrendX 200", category: "syntx" },
  { value: "TRENDX400", label: "TrendX 400", category: "syntx" },
  { value: "TRENDX600", label: "TrendX 600", category: "syntx" },
  { value: "TRENDX800", label: "TrendX 800", category: "syntx" },
  { value: "TRENDX1000", label: "TrendX 1000", category: "syntx" },
  { value: "TRENDX1200", label: "TrendX 1200", category: "syntx" },
  // Weltrade SyntX — FX Volatility Series
  { value: "FXVOL10", label: "FX Vol 10", category: "syntx" },
  { value: "FXVOL20", label: "FX Vol 20", category: "syntx" },
  { value: "FXVOL40", label: "FX Vol 40", category: "syntx" },
  { value: "FXVOL80", label: "FX Vol 80", category: "syntx" },
  { value: "FXVOL160", label: "FX Vol 160", category: "syntx" },
  // Weltrade SyntX — SFX Volatility Series
  { value: "SFXVOL10", label: "SFX Vol 10", category: "syntx" },
  { value: "SFXVOL20", label: "SFX Vol 20", category: "syntx" },
  { value: "SFXVOL40", label: "SFX Vol 40", category: "syntx" },
  { value: "SFXVOL80", label: "SFX Vol 80", category: "syntx" },
  { value: "SFXVOL160", label: "SFX Vol 160", category: "syntx" },
  // Weltrade SyntX — FlipX / SwitchX / BreakX
  { value: "FLIPX200", label: "FlipX 200", category: "syntx" },
  { value: "FLIPX400", label: "FlipX 400", category: "syntx" },
  { value: "SWITCHX400", label: "SwitchX 400", category: "syntx" },
  { value: "BREAKX600", label: "BreakX 600", category: "syntx" },
  { value: "BREAKX1200", label: "BreakX 1200", category: "syntx" },

  // Gold
  { value: "XAUUSD", label: "Gold (XAUUSD)", category: "gold" },
  { value: "XAGUSD", label: "Silver (XAGUSD)", category: "gold" },
  // Forex - Major Pairs (Deriv, Weltrade, Exness)
  { value: "EURUSD", label: "EUR/USD", category: "forex" },
  { value: "GBPUSD", label: "GBP/USD", category: "forex" },
  { value: "USDJPY", label: "USD/JPY", category: "forex" },
  { value: "GBPJPY", label: "GBP/JPY", category: "forex" },
  { value: "AUDUSD", label: "AUD/USD", category: "forex" },
  { value: "AUDCAD", label: "AUD/CAD", category: "forex" },
  { value: "AUDCHF", label: "AUD/CHF", category: "forex" },
  { value: "AUDJPY", label: "AUD/JPY", category: "forex" },
  { value: "AUDNZD", label: "AUD/NZD", category: "forex" },
  { value: "USDCAD", label: "USD/CAD", category: "forex" },
  { value: "USDCHF", label: "USD/CHF", category: "forex" },
  { value: "NZDUSD", label: "NZD/USD", category: "forex" },
  { value: "NZDJPY", label: "NZD/JPY", category: "forex" },
  { value: "EURJPY", label: "EUR/JPY", category: "forex" },
  { value: "EURGBP", label: "EUR/GBP", category: "forex" },
  { value: "EURAUD", label: "EUR/AUD", category: "forex" },
  { value: "EURCHF", label: "EUR/CHF", category: "forex" },
  { value: "EURNZD", label: "EUR/NZD", category: "forex" },
  { value: "EURCAD", label: "EUR/CAD", category: "forex" },
  { value: "GBPAUD", label: "GBP/AUD", category: "forex" },
  { value: "GBPCAD", label: "GBP/CAD", category: "forex" },
  { value: "GBPCHF", label: "GBP/CHF", category: "forex" },
  { value: "GBPNZD", label: "GBP/NZD", category: "forex" },
  { value: "CADJPY", label: "CAD/JPY", category: "forex" },
  { value: "CADCHF", label: "CAD/CHF", category: "forex" },
  { value: "CHFJPY", label: "CHF/JPY", category: "forex" },
  // NASDAQ / Indices (Weltrade, Exness)
  { value: "NAS100", label: "NASDAQ 100", category: "nasdaq" },
  { value: "US30", label: "US30 (Dow Jones)", category: "nasdaq" },
  { value: "US500", label: "S&P 500", category: "nasdaq" },
  { value: "DE40", label: "Germany 40 (DAX)", category: "nasdaq" },
  { value: "UK100", label: "UK 100 (FTSE)", category: "nasdaq" },
  { value: "JP225", label: "Japan 225 (Nikkei)", category: "nasdaq" },
  { value: "HK50", label: "Hong Kong 50", category: "nasdaq" },
  { value: "AU200", label: "Australia 200", category: "nasdaq" },
  { value: "FR40", label: "France 40", category: "nasdaq" },
  // Crypto
  { value: "BTCUSD", label: "Bitcoin (BTC/USD)", category: "crypto" },
  { value: "ETHUSD", label: "Ethereum (ETH/USD)", category: "crypto" },
  { value: "XRPUSD", label: "Ripple (XRP/USD)", category: "crypto" },
  { value: "LTCUSD", label: "Litecoin (LTC/USD)", category: "crypto" },
  { value: "BCHUSD", label: "Bitcoin Cash (BCH/USD)", category: "crypto" },
  { value: "DOTUSD", label: "Polkadot (DOT/USD)", category: "crypto" },
  { value: "SOLUSD", label: "Solana (SOL/USD)", category: "crypto" },
  { value: "ADAUSD", label: "Cardano (ADA/USD)", category: "crypto" },
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
  const [expiresIn, setExpiresIn] = useState("24"); // Hours until expiration

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

    // Calculate expiration time
    const expiresAt = expiresIn && expiresIn !== "none" ? new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000).toISOString() : undefined;

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
      expires_at: expiresAt,
    });

    // Reset form
    setSymbol("");
    setEntryPrice("");
    setStopLoss("");
    setTakeProfit("");
    setConfidence("");
    setReason("");
    setExpiresIn("24");
    
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

          {/* Timeframe, Confidence & Expiration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label>Expires In (hours)</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="2">2 Hours</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                  <SelectItem value="8">8 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                  <SelectItem value="48">48 Hours</SelectItem>
                  <SelectItem value="72">72 Hours</SelectItem>
                  <SelectItem value="none">No Expiration</SelectItem>
                </SelectContent>
              </Select>
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
