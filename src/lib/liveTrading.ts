export type TradeFeed = "deriv" | "syntx" | "weltrade" | "copy";

/** Match broker suffixes as well as the full SyntX catalogue's families. */
export function tradeFeedForSymbol(symbol: string, broker = ""): TradeFeed {
  const name = symbol.toUpperCase().replace(/[\s_-]/g, "");
  if (/GAINX|PAINX|FLIPX|SWITCHX|BREAKX|TRENDX|S?FXVOL|PLUSX|FIBOX|QUADX/.test(name)) return "syntx";
  if (/BOOM|CRASH|VOLATILITY|^R\d|^1HZ/.test(name)) return "deriv";
  return broker.toLowerCase().includes("deriv") ? "deriv" : "weltrade";
}

export function closedTradeResult(profit: number | null): string {
  if (profit == null || !Number.isFinite(profit)) return "Closed";
  return profit > 0 ? "Win" : profit < 0 ? "Loss" : "Break-even";
}