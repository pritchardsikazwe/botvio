import { DerivWebSocketService } from "./derivWebSocket";
import type { DerivTick, DerivBalance } from "@/types/deriv";

type TickHandler = (tick: DerivTick) => void;
type StatusHandler = (status: "connected" | "disconnected" | "error") => void;

interface MarketDataServiceOptions {
  appId?: string;
  throttleMs?: number;
}

/**
 * Market Data Service - Single source of truth for market data
 * Features:
 * - Centralized subscription management
 * - Automatic reconnection
 * - Throttled UI updates
 * - Memory leak prevention
 */
class MarketDataServiceClass {
  private service: DerivWebSocketService | null = null;
  private tickHandlers = new Map<string, Set<TickHandler>>();
  private statusHandlers = new Set<StatusHandler>();
  private lastTicks = new Map<string, DerivTick>();
  private subscriptions = new Map<string, string>(); // symbol -> subscriptionId
  private throttleTimers = new Map<string, number>();
  private isConnected = false;
  private isAuthorized = false;
  private token: string | null = null;
  private throttleMs: number;
  private cleanupFns: (() => void)[] = [];

  constructor(options: MarketDataServiceOptions = {}) {
    this.throttleMs = options.throttleMs ?? 100; // Default 100ms throttle
  }

  private getService(): DerivWebSocketService {
    if (!this.service) {
      this.service = new DerivWebSocketService({
        appId: "123162",
        autoReconnect: true,
        keepAlive: true,
      });
    }
    return this.service;
  }

  async connect(apiToken?: string): Promise<DerivBalance | null> {
    const service = this.getService();

    try {
      await service.open();
      this.isConnected = true;
      this.notifyStatus("connected");

      // Setup listeners
      const offTick = service.onTick((tick) => {
        this.handleTick(tick);
      });

      const offStatus = service.onStatus((status) => {
        if (status === "closed") {
          this.isConnected = false;
          this.isAuthorized = false;
          this.notifyStatus("disconnected");
        } else if (status === "open") {
          this.isConnected = true;
          this.notifyStatus("connected");
        }
      });

      const offError = service.onError((error) => {
        console.error("[MarketDataService] Error:", error);
        this.notifyStatus("error");
      });

      this.cleanupFns.push(offTick, offStatus, offError);

      // Authorize if token provided
      if (apiToken) {
        this.token = apiToken;
        const balance = await service.authorize(apiToken);
        this.isAuthorized = true;
        return balance;
      }

      return null;
    } catch (error) {
      this.isConnected = false;
      this.notifyStatus("error");
      throw error;
    }
  }

  disconnect(): void {
    // Clear all throttle timers
    this.throttleTimers.forEach((timer) => clearTimeout(timer));
    this.throttleTimers.clear();

    // Run cleanup functions
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];

    // Close service
    if (this.service) {
      this.service.close();
      this.service = null;
    }

    // Reset state
    this.subscriptions.clear();
    this.lastTicks.clear();
    this.isConnected = false;
    this.isAuthorized = false;
    this.token = null;
    this.notifyStatus("disconnected");
  }

  private handleTick(tick: DerivTick): void {
    const symbol = tick.symbol;

    // Store subscription ID
    if (tick.subscription_id) {
      this.subscriptions.set(symbol, tick.subscription_id);
    }

    // Store latest tick
    this.lastTicks.set(symbol, tick);

    // Throttle UI updates
    if (this.throttleTimers.has(symbol)) {
      return; // Skip if throttled
    }

    this.throttleTimers.set(
      symbol,
      window.setTimeout(() => {
        this.throttleTimers.delete(symbol);
        this.notifyTickHandlers(symbol, tick);
      }, this.throttleMs)
    );
  }

  private notifyTickHandlers(symbol: string, tick: DerivTick): void {
    const handlers = this.tickHandlers.get(symbol);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(tick);
        } catch (e) {
          console.error("[MarketDataService] Handler error:", e);
        }
      });
    }
  }

  private notifyStatus(status: "connected" | "disconnected" | "error"): void {
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (e) {
        console.error("[MarketDataService] Status handler error:", e);
      }
    });
  }

  async subscribe(symbol: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to market data service");
    }

    const service = this.getService();

    // Map symbol to Deriv format
    const derivSymbol = this.toDerivSymbol(symbol);

    // Check if already subscribed
    if (this.subscriptions.has(derivSymbol)) {
      return;
    }

    try {
      await service.subscribeTicks(derivSymbol);
    } catch (error) {
      console.error(`[MarketDataService] Failed to subscribe to ${derivSymbol}:`, error);
      throw error;
    }
  }

  async unsubscribe(symbol: string): Promise<void> {
    const derivSymbol = this.toDerivSymbol(symbol);
    const subId = this.subscriptions.get(derivSymbol);

    if (!subId || !this.isConnected) {
      this.subscriptions.delete(derivSymbol);
      this.tickHandlers.delete(derivSymbol);
      return;
    }

    try {
      const service = this.getService();
      await service.unsubscribe(subId);
    } catch (error) {
      console.error(`[MarketDataService] Failed to unsubscribe from ${derivSymbol}:`, error);
    } finally {
      this.subscriptions.delete(derivSymbol);
      this.tickHandlers.delete(derivSymbol);
      this.lastTicks.delete(derivSymbol);
    }
  }

  onTick(symbol: string, handler: TickHandler): () => void {
    const derivSymbol = this.toDerivSymbol(symbol);

    if (!this.tickHandlers.has(derivSymbol)) {
      this.tickHandlers.set(derivSymbol, new Set());
    }

    this.tickHandlers.get(derivSymbol)!.add(handler);

    // Return cleanup function
    return () => {
      const handlers = this.tickHandlers.get(derivSymbol);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.tickHandlers.delete(derivSymbol);
        }
      }
    };
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  getLastTick(symbol: string): DerivTick | null {
    const derivSymbol = this.toDerivSymbol(symbol);
    return this.lastTicks.get(derivSymbol) || null;
  }

  isSymbolSubscribed(symbol: string): boolean {
    const derivSymbol = this.toDerivSymbol(symbol);
    return this.subscriptions.has(derivSymbol);
  }

  getConnectionStatus(): "connected" | "disconnected" | "authorized" {
    if (this.isAuthorized) return "authorized";
    if (this.isConnected) return "connected";
    return "disconnected";
  }

  // Map app symbols to Deriv symbols
  private toDerivSymbol(symbol: string): string {
    const s = symbol.trim();
    if (!s) return s;

    // Already Deriv format
    if (s.includes("_") || s.startsWith("frx") || s.startsWith("cry")) {
      return s;
    }

    // Forex CFDs
    const forexPairs = [
      "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF",
      "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "NZDUSD", "EURCHF",
    ];
    if (forexPairs.includes(s.toUpperCase())) {
      return `frx${s.toUpperCase()}`;
    }

    // Gold/Silver
    if (s === "XAUUSD" || s === "GOLD") return "frxXAUUSD";
    if (s === "XAGUSD" || s === "SILVER") return "frxXAGUSD";

    // Crypto
    if (s === "BTCUSD" || s === "BITCOIN") return "cryBTCUSD";
    if (s === "ETHUSD" || s === "ETHEREUM") return "cryETHUSD";
    if (s === "LTCUSD") return "cryLTCUSD";

    // Synthetics/Volatility - already in correct format
    if (s.match(/^R_\d+$/) || s.match(/^1HZ\d+V?$/)) return s;
    if (s.startsWith("BOOM") || s.startsWith("CRASH")) return s;
    if (s.startsWith("JD") || s === "stpRNG") return s;

    return s;
  }

  // Validate if a symbol is valid for Deriv
  validateSymbol(symbol: string): { valid: boolean; suggestion?: string } {
    const derivSymbol = this.toDerivSymbol(symbol);

    // Known valid patterns
    const validPatterns = [
      /^R_\d+$/,           // Volatility indices
      /^1HZ\d+V?$/,        // 1s volatility
      /^BOOM\d+N?$/,       // Boom
      /^CRASH\d+N?$/,      // Crash
      /^JD\d+$/,           // Jump
      /^stpRNG$/,          // Step
      /^RD(BEAR|BULL)$/,   // Range Break
      /^frx[A-Z]{6}$/,     // Forex
      /^cry[A-Z]{6}$/,     // Crypto
    ];

    const isValid = validPatterns.some((pattern) => pattern.test(derivSymbol));

    if (!isValid) {
      // Try to suggest a correction
      const upperSymbol = symbol.toUpperCase();
      if (upperSymbol.includes("EUR") || upperSymbol.includes("GBP")) {
        return { valid: false, suggestion: `frx${upperSymbol}` };
      }
      if (upperSymbol.includes("BTC") || upperSymbol.includes("ETH")) {
        return { valid: false, suggestion: `cry${upperSymbol}` };
      }
    }

    return { valid: isValid };
  }
}

// Singleton instance
export const MarketDataService = new MarketDataServiceClass();

// Re-export for convenience
export type { DerivTick, DerivBalance };
