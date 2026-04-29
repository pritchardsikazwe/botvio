/**
 * Deriv MT5 broker minimum lot per symbol.
 * Mirrors the server-side map in supabase/functions/queue-hub-trade/index.ts.
 * Used purely for UI hints — the edge function is the source of truth and will
 * clamp UP to the symbol minimum before queuing the order on MT5.
 */
export const MT5_SYMBOL_MIN_LOT: Record<string, number> = {
  BOOM300: 1.0,
  BOOM500: 0.2,
  BOOM600: 0.2,
  BOOM900: 0.2,
  BOOM1000: 0.2,
  BOOM1500: 0.2,
  BOOM50: 4.0,
  BOOM150: 1.0,
  CRASH300: 0.5,
  CRASH500: 0.2,
  CRASH600: 0.2,
  CRASH900: 0.2,
  CRASH1000: 0.2,
  CRASH1500: 0.2,
  CRASH50: 4.0,
  CRASH150: 1.0,
  VOLATILITY10: 0.5,
  VOLATILITY25: 0.5,
  VOLATILITY50: 4.0,
  VOLATILITY75: 0.001,
  VOLATILITY100: 0.5,
  XAUUSD: 0.01,
  XAGUSD: 0.01,
  EURUSD: 0.01,
  GBPUSD: 0.01,
  USDJPY: 0.01,
  USDCAD: 0.01,
  USDCHF: 0.01,
  AUDUSD: 0.01,
  NZDUSD: 0.01,
  EURJPY: 0.01,
  EURGBP: 0.01,
  BTCUSD: 0.01,
  ETHUSD: 0.01,
};

export function getMt5MinLot(symbol: string): number {
  const key = symbol.toUpperCase().replace(/[\s_/-]/g, "");
  return MT5_SYMBOL_MIN_LOT[key] ?? 0.01;
}