/**
 * Botvio Chart Engine — Symbol Router
 *
 * Routes each instrument to the correct chart provider:
 *   - TradingView embed  → Forex, Metals, Crypto, Indices
 *   - Deriv WebSocket API → Crash, Boom, Volatility, other Deriv synthetics
 *   - (Future) MT5 relay → WELTRADE-specific instruments
 */

export type ChartProvider = "tradingview" | "deriv_api" | "mt5_relay";
export type AssetClass = "forex" | "metals" | "crypto" | "indices" | "synthetic";

export interface InstrumentMapping {
  normalizedSymbol: string;   // e.g. "XAU/USD"
  sourceSymbol: string;       // e.g. "OANDA:XAUUSD" or "R_100"
  provider: ChartProvider;
  assetClass: AssetClass;
  broker?: "weltrade" | "deriv";
  tradeUrl?: string;
  enabled: boolean;
}

const WELTRADE_LINK = "https://gowt.net/ib67505";

// TradingView symbol map for standard instruments
const TV_SYMBOLS: Record<string, { tv: string; asset: AssetClass }> = {
  "XAU/USD":  { tv: "OANDA:XAUUSD",    asset: "metals" },
  "XAUUSD":   { tv: "OANDA:XAUUSD",    asset: "metals" },
  "XAG/USD":  { tv: "OANDA:XAGUSD",    asset: "metals" },
  "XAGUSD":   { tv: "OANDA:XAGUSD",    asset: "metals" },
  "EUR/USD":  { tv: "OANDA:EURUSD",    asset: "forex" },
  "EURUSD":   { tv: "OANDA:EURUSD",    asset: "forex" },
  "GBP/USD":  { tv: "OANDA:GBPUSD",    asset: "forex" },
  "GBPUSD":   { tv: "OANDA:GBPUSD",    asset: "forex" },
  "USD/JPY":  { tv: "OANDA:USDJPY",    asset: "forex" },
  "USDJPY":   { tv: "OANDA:USDJPY",    asset: "forex" },
  "AUD/USD":  { tv: "OANDA:AUDUSD",    asset: "forex" },
  "AUDUSD":   { tv: "OANDA:AUDUSD",    asset: "forex" },
  "NZD/USD":  { tv: "OANDA:NZDUSD",    asset: "forex" },
  "NZDUSD":   { tv: "OANDA:NZDUSD",    asset: "forex" },
  "USD/CHF":  { tv: "OANDA:USDCHF",    asset: "forex" },
  "USDCHF":   { tv: "OANDA:USDCHF",    asset: "forex" },
  "USD/CAD":  { tv: "OANDA:USDCAD",    asset: "forex" },
  "USDCAD":   { tv: "OANDA:USDCAD",    asset: "forex" },
  "EUR/GBP":  { tv: "OANDA:EURGBP",    asset: "forex" },
  "EURGBP":   { tv: "OANDA:EURGBP",    asset: "forex" },
  "EUR/JPY":  { tv: "OANDA:EURJPY",    asset: "forex" },
  "EURJPY":   { tv: "OANDA:EURJPY",    asset: "forex" },
  "GBP/JPY":  { tv: "OANDA:GBPJPY",    asset: "forex" },
  "GBPJPY":   { tv: "OANDA:GBPJPY",    asset: "forex" },
  "BTC/USD":  { tv: "BINANCE:BTCUSDT",  asset: "crypto" },
  "BTCUSD":   { tv: "BINANCE:BTCUSDT",  asset: "crypto" },
  "ETH/USD":  { tv: "BINANCE:ETHUSDT",  asset: "crypto" },
  "ETHUSD":   { tv: "BINANCE:ETHUSDT",  asset: "crypto" },
  "SOL/USD":  { tv: "BINANCE:SOLUSDT",  asset: "crypto" },
  "SOLUSD":   { tv: "BINANCE:SOLUSDT",  asset: "crypto" },
  "US30":     { tv: "TVC:DJI",          asset: "indices" },
  "NAS100":   { tv: "NASDAQ:NDX",       asset: "indices" },
  "SPX500":   { tv: "SP:SPX",           asset: "indices" },
  "UK100":    { tv: "TVC:UKX",          asset: "indices" },
  "DE30":     { tv: "XETR:DAX",         asset: "indices" },
  "JP225":    { tv: "TVC:NI225",        asset: "indices" },
};

// Deriv synthetic symbols
const DERIV_SYNTHETICS = new Set([
  "Crash 300", "Crash 500", "Crash 1000",
  "Boom 300", "Boom 500", "Boom 1000",
  "Volatility 10", "Volatility 25", "Volatility 50",
  "Volatility 75", "Volatility 100",
  "Volatility 10 (1s)", "Volatility 25 (1s)", "Volatility 50 (1s)",
  "Volatility 75 (1s)", "Volatility 100 (1s)",
  "Step Index", "Range Break 100", "Range Break 200",
  "Jump 10", "Jump 25", "Jump 50", "Jump 75", "Jump 100",
  // Also match raw Deriv symbols
  "R_10", "R_25", "R_50", "R_75", "R_100",
  "1HZ10V", "1HZ25V", "1HZ50V", "1HZ75V", "1HZ100V",
  "BOOM300", "BOOM500", "BOOM1000",
  "CRASH300", "CRASH500", "CRASH1000",
]);

export function resolveInstrument(symbol: string): InstrumentMapping {
  const upper = symbol.toUpperCase().replace("/", "");

  // Check if it's a Deriv synthetic
  if (DERIV_SYNTHETICS.has(symbol) || DERIV_SYNTHETICS.has(upper)) {
    return {
      normalizedSymbol: symbol,
      sourceSymbol: symbol,
      provider: "deriv_api",
      assetClass: "synthetic",
      broker: "deriv",
      enabled: true,
    };
  }

  // Check TradingView map (try both with and without slash)
  const tvEntry = TV_SYMBOLS[symbol] || TV_SYMBOLS[upper];
  if (tvEntry) {
    return {
      normalizedSymbol: symbol,
      sourceSymbol: tvEntry.tv,
      provider: "tradingview",
      assetClass: tvEntry.asset,
      tradeUrl: WELTRADE_LINK,
      enabled: true,
    };
  }

  // Fallback: try TradingView with generic symbol
  return {
    normalizedSymbol: symbol,
    sourceSymbol: `FX:${upper}`,
    provider: "tradingview",
    assetClass: "forex",
    tradeUrl: WELTRADE_LINK,
    enabled: true,
  };
}

export function getTradingViewSymbol(symbol: string): string | null {
  const mapping = resolveInstrument(symbol);
  if (mapping.provider === "tradingview") return mapping.sourceSymbol;
  return null;
}

export function isDerivSynthetic(symbol: string): boolean {
  return resolveInstrument(symbol).provider === "deriv_api";
}
