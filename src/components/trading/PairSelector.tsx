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
  { symbol: "XAUUSD", name: "Gold / US Dollar", category: "COMMODITIES" },
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "FOREX" },
  { symbol: "GBPUSD", name: "Pound / US Dollar", category: "FOREX" },
  { symbol: "USDJPY", name: "US Dollar / Yen", category: "FOREX" },
  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", category: "CRYPTO" },
  { symbol: "ETHUSD", name: "Ethereum / US Dollar", category: "CRYPTO" },
];

interface PairSelectorProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

export const PairSelector = ({ selectedPair, onPairChange }: PairSelectorProps) => {
  const selected = tradingPairs.find(p => p.symbol === selectedPair) || tradingPairs[0];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'COMMODITIES': return 'text-primary';
      case 'CRYPTO': return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

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
      <DropdownMenuContent className="w-64 bg-card border-border">
        <DropdownMenuLabel className="text-muted-foreground">Select Trading Pair</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {['COMMODITIES', 'FOREX', 'CRYPTO'].map(category => (
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
