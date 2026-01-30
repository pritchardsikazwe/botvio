import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { TradingPair } from "@/types/trading";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tradingPairs: TradingPair[] = [
  // Commodities
  { symbol: "XAUUSD", name: "Gold / US Dollar", category: "COMMODITIES" },
  // Forex
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "FOREX" },
  { symbol: "GBPUSD", name: "Pound / US Dollar", category: "FOREX" },
  { symbol: "USDJPY", name: "US Dollar / Yen", category: "FOREX" },
  { symbol: "GBPJPY", name: "Pound / Yen", category: "FOREX" },
  // Crypto
  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", category: "CRYPTO" },
  { symbol: "ETHUSD", name: "Ethereum / US Dollar", category: "CRYPTO" },
  // Synthetics (Boom & Crash)
  { symbol: "BOOM1000", name: "Boom 1000 Index", category: "SYNTHETICS" },
  { symbol: "BOOM500", name: "Boom 500 Index", category: "SYNTHETICS" },
  { symbol: "CRASH1000", name: "Crash 1000 Index", category: "SYNTHETICS" },
  { symbol: "CRASH500", name: "Crash 500 Index", category: "SYNTHETICS" },
  // Volatility Indices
  { symbol: "R_100", name: "Volatility 100 Index", category: "SYNTHETICS" },
  { symbol: "R_75", name: "Volatility 75 Index", category: "SYNTHETICS" },
  { symbol: "R_50", name: "Volatility 50 Index", category: "SYNTHETICS" },
  { symbol: "R_25", name: "Volatility 25 Index", category: "SYNTHETICS" },
  { symbol: "R_10", name: "Volatility 10 Index", category: "SYNTHETICS" },
];

interface PairSelectorProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

export const PairSelector = ({ selectedPair, onPairChange }: PairSelectorProps) => {
  const selected = tradingPairs.find(p => p.symbol === selectedPair);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'COMMODITIES': return 'text-primary';
      case 'CRYPTO': return 'text-purple-400';
      case 'SYNTHETICS': return 'text-amber-400';
      default: return 'text-blue-400';
    }
  };

  // Show placeholder if no selection
  if (!selected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-secondary/50 border-border hover:border-primary/50">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Select a trading pair</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-card border-border max-h-80 overflow-y-auto">
          <DropdownMenuLabel className="text-muted-foreground">Select Trading Pair</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {['COMMODITIES', 'FOREX', 'CRYPTO', 'SYNTHETICS'].map(category => (
            <div key={category}>
              <DropdownMenuLabel className={`text-xs ${getCategoryColor(category)}`}>
                {category}
              </DropdownMenuLabel>
              {tradingPairs
                .filter(p => p.category === category)
                .map(pair => (
                  <DropdownMenuItem
                    key={pair.symbol}
                    onClick={() => onPairChange(pair.symbol)}
                    className="cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{pair.symbol}</p>
                      <p className="text-xs text-muted-foreground">{pair.name}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-secondary/50 border-border hover:border-primary/50">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getCategoryColor(selected.category)} bg-current/10`}>
              {selected.category}
            </span>
            <div className="text-left">
              <p className="font-semibold">{selected.symbol}</p>
              <p className="text-xs text-muted-foreground">{selected.name}</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-card border-border max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="text-muted-foreground">Select Trading Pair</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {['COMMODITIES', 'FOREX', 'CRYPTO', 'SYNTHETICS'].map(category => (
          <div key={category}>
            <DropdownMenuLabel className={`text-xs ${getCategoryColor(category)}`}>
              {category}
            </DropdownMenuLabel>
            {tradingPairs
              .filter(p => p.category === category)
              .map(pair => (
                <DropdownMenuItem
                  key={pair.symbol}
                  onClick={() => onPairChange(pair.symbol)}
                  className={`cursor-pointer ${selectedPair === pair.symbol ? 'bg-primary/10' : ''}`}
                >
                  <div>
                    <p className="font-medium">{pair.symbol}</p>
                    <p className="text-xs text-muted-foreground">{pair.name}</p>
                  </div>
                </DropdownMenuItem>
              ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
