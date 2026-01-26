export interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  pair: string;
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  confidence: number;
  timestamp: Date;
  strategy: string;
  status: 'ACTIVE' | 'CLOSED' | 'PENDING';
}

export interface SupportResistance {
  level: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  touches: number;
}

export interface MarketData {
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
}

export interface TradingPair {
  symbol: string;
  name: string;
  category: 'FOREX' | 'CRYPTO' | 'COMMODITIES';
}
