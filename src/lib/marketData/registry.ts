import { createDerivAdapter } from "./adapters/derivAdapter";
import { createWeltradeBridgeAdapter } from "./adapters/weltradeBridgeAdapter";
import { createWeltradeApiStudioAdapter } from "./adapters/weltradeApiStudioAdapter";
import type { AdapterConfig, MarketDataAdapter, MarketDataSource } from "./types";

type AdapterFactory = (config: AdapterConfig) => MarketDataAdapter;

/**
 * Data-source registry. Add future brokers here — the chart, indicators and
 * signal engine need no changes because everything downstream consumes the
 * normalized OHLC/tick contracts.
 */
const ADAPTERS: Record<MarketDataSource, AdapterFactory> = {
  deriv: createDerivAdapter,
  "weltrade-bridge": createWeltradeBridgeAdapter,
  "weltrade-api-studio": createWeltradeApiStudioAdapter,
};

export function createMarketDataAdapter(source: MarketDataSource, config: AdapterConfig): MarketDataAdapter {
  const factory = ADAPTERS[source];
  if (!factory) throw new Error(`Unknown market data source: ${source}`);
  return factory(config);
}