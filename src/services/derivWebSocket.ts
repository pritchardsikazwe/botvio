import type { DerivMessage, DerivTick, DerivBalance } from "@/types/deriv";
import { getDerivWebSocketUrl } from "@/config/derivEnv";

type ConnectionStatus = "idle" | "connecting" | "open" | "closed";

type Listener<T> = (payload: T) => void;

type DerivWebSocketOptions = {
  appId?: string;
  /** Defaults to official Deriv endpoint based on environment */
  url?: string;
  /** Auto-reconnect when dropped unexpectedly (default true) */
  autoReconnect?: boolean;
  /** Base reconnect delay in ms (default 1000) */
  reconnectBaseDelayMs?: number;
  /** Max reconnect delay in ms (default 15000) */
  reconnectMaxDelayMs?: number;
  /** Enable keepalive ping (default true) */
  keepAlive?: boolean;
  /** Ping interval ms (default 25000) */
  pingIntervalMs?: number;
};

/**
 * Deriv WebSocket service (browser)
 * - single onmessage dispatcher
 * - request/response routing using req_id
 * - tick subscriptions + unsubscribe by subscription id
 * - auto-reconnect with backoff
 * - Uses environment-based configuration
 */
export class DerivWebSocketService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "idle";
  private isManualClose = false;

  private reqId = 1;
  private pending = new Map<
    number,
    { resolve: (v: any) => void; reject: (e: Error) => void; timeout: number }
  >();

  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;

  private token: string | null = null;
  private lastBalance: DerivBalance | null = null;
  private loginid: string | null = null;

  private tickListeners = new Set<Listener<DerivTick>>();
  private statusListeners = new Set<Listener<ConnectionStatus>>();
  private logListeners = new Set<Listener<string>>();
  private errorListeners = new Set<Listener<string>>();

  private tickSubscriptionBySymbol = new Map<string, string>();

  // Rate limiting protection
  private lastTickRequestTime = 0;
  private lastForgetRequestTime = 0;
  private readonly minRequestIntervalMs = 500; // Minimum 500ms between tick/forget requests
  private pendingTickRequests = new Map<string, boolean>(); // Track pending subscriptions

  private readonly url: string;
  private readonly autoReconnect: boolean;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private readonly keepAlive: boolean;
  private readonly pingIntervalMs: number;

  constructor(opts: DerivWebSocketOptions = {}) {
    // Use environment-based URL by default
    this.url = opts.url ?? getDerivWebSocketUrl();
    this.autoReconnect = opts.autoReconnect ?? true;
    this.reconnectBaseDelayMs = opts.reconnectBaseDelayMs ?? 1000;
    this.reconnectMaxDelayMs = opts.reconnectMaxDelayMs ?? 15000;
    this.keepAlive = opts.keepAlive ?? true;
    this.pingIntervalMs = opts.pingIntervalMs ?? 25000;
    
    // Debug log for troubleshooting
    console.log("[Deriv] WebSocket URL:", this.url, "| Host:", typeof window !== "undefined" ? window.location.hostname : "N/A");
  }

  // Rate limit helper - returns delay needed before next request
  private getRateLimitDelay(lastTime: number): number {
    const elapsed = Date.now() - lastTime;
    return Math.max(0, this.minRequestIntervalMs - elapsed);
  }

  private async waitForRateLimit(type: 'tick' | 'forget'): Promise<void> {
    const lastTime = type === 'tick' ? this.lastTickRequestTime : this.lastForgetRequestTime;
    const delay = this.getRateLimitDelay(lastTime);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (type === 'tick') {
      this.lastTickRequestTime = Date.now();
    } else {
      this.lastForgetRequestTime = Date.now();
    }
  }

  get connectionStatus() {
    return this.status;
  }

  get authorizedLoginId() {
    return this.loginid;
  }

  get latestBalance() {
    return this.lastBalance;
  }

  onTick(listener: Listener<DerivTick>) {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  onStatus(listener: Listener<ConnectionStatus>) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  onLog(listener: Listener<string>) {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  onError(listener: Listener<string>) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private emitStatus(next: ConnectionStatus) {
    this.status = next;
    this.statusListeners.forEach((l) => l(next));
  }

  private log(line: string) {
    this.logListeners.forEach((l) => l(line));
  }

  private emitError(message: string) {
    this.errorListeners.forEach((l) => l(message));
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearPingTimer() {
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private startKeepAlive() {
    this.clearPingTimer();
    if (!this.keepAlive) return;
    this.pingTimer = window.setInterval(() => {
      // ping is a standard Deriv call; response msg_type is "ping"
      this.send({ ping: 1 }).catch(() => {
        // ignore; if socket is dead, reconnect handler will run
      });
    }, this.pingIntervalMs);
  }

  async open(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isManualClose = false;
    this.emitStatus("connecting");
    this.log(`Connecting: ${this.url}`);

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const onOpen = () => {
        this.reconnectAttempt = 0;
        this.emitStatus("open");
        this.log("WebSocket open");
        this.startKeepAlive();
        resolve();
      };

      const onError = () => {
        this.emitError("Connection error");
        reject(new Error("Connection error"));
      };

      const onClose = (ev: CloseEvent) => {
        this.emitStatus("closed");
        this.clearPingTimer();
        this.log(`WebSocket closed (${ev.code}) ${ev.reason || ""}`.trim());
        this.rejectAllPending(new Error("Connection closed"));
        if (this.autoReconnect && !this.isManualClose) {
          this.scheduleReconnect();
        }
      };

      const onMessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      ws.addEventListener("open", onOpen, { once: true });
      ws.addEventListener("error", onError);
      ws.addEventListener("close", onClose);
      ws.addEventListener("message", onMessage);
    });
  }

  close() {
    this.isManualClose = true;
    this.clearReconnectTimer();
    this.clearPingTimer();
    this.tickSubscriptionBySymbol.clear();
    this.token = null;
    this.loginid = null;
    this.lastBalance = null;
    this.rejectAllPending(new Error("Disconnected"));
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emitStatus("closed");
  }

  private scheduleReconnect() {
    this.clearReconnectTimer();
    const delay = Math.min(
      this.reconnectMaxDelayMs,
      this.reconnectBaseDelayMs * Math.pow(2, this.reconnectAttempt),
    );
    this.reconnectAttempt += 1;
    this.log(`Reconnecting in ${delay}ms...`);
    this.reconnectTimer = window.setTimeout(async () => {
      try {
        await this.open();
        // re-authorize + re-subscribe if we were previously authorized
        if (this.token) {
          await this.authorize(this.token);
          for (const [symbol] of this.tickSubscriptionBySymbol.entries()) {
            await this.subscribeTicks(symbol);
          }
        }
      } catch {
        // open() will trigger close/error handlers and schedule another reconnect if applicable
      }
    }, delay);
  }

  private rejectAllPending(err: Error) {
    for (const [, p] of this.pending) {
      window.clearTimeout(p.timeout);
      p.reject(err);
    }
    this.pending.clear();
  }

  private handleMessage(raw: any) {
    let data: DerivMessage;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    if (data?.error?.message) {
      this.emitError(data.error.message);
    }

    // resolve request/response by req_id
    if (typeof data.req_id === "number" && this.pending.has(data.req_id)) {
      const p = this.pending.get(data.req_id)!;
      window.clearTimeout(p.timeout);
      this.pending.delete(data.req_id);
      if (data.error) p.reject(new Error(data.error.message));
      else p.resolve(data);
    }

    // stream handling
    if (data.msg_type === "authorize" && (data as any).authorize) {
      const a = (data as any).authorize as any;
      this.loginid = a.loginid ?? null;
      this.lastBalance = {
        balance: a.balance,
        currency: a.currency,
        loginid: a.loginid,
        fullname: a.fullname,
      };
    }

    if (data.msg_type === "balance" && (data as any).balance) {
      const b = (data as any).balance as any;
      this.lastBalance = {
        balance: b.balance,
        currency: b.currency,
        loginid: b.loginid,
      };
    }

    if (data.msg_type === "tick" && (data as any).tick) {
      const t = (data as any).tick as any;
      const subId = (data as any).subscription?.id as string | undefined;
      if (subId) this.tickSubscriptionBySymbol.set(t.symbol, subId);
      const tick: DerivTick = {
        symbol: t.symbol,
        quote: t.quote,
        epoch: t.epoch,
        subscription_id: subId,
      };
      this.tickListeners.forEach((l) => l(tick));
    }
  }

  private ensureOpen() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
  }

  /** send request with req_id and wait for matching response */
  send<T = DerivMessage>(payload: Record<string, unknown>, timeoutMs = 30000): Promise<T> {
    this.ensureOpen();
    const req_id = this.reqId++;
    const message = { ...payload, req_id };

    return new Promise<T>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pending.delete(req_id);
        const errorMsg = `Request timeout after ${timeoutMs / 1000}s for ${Object.keys(payload)[0]}`;
        this.emitError(errorMsg);
        reject(new Error(errorMsg));
      }, timeoutMs);
      this.pending.set(req_id, { resolve, reject, timeout });
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (e: any) {
        window.clearTimeout(timeout);
        this.pending.delete(req_id);
        reject(new Error(`Failed to send: ${e.message}`));
      }
    });
  }

  /**
   * Authorize with token.
   * Must be called after open().
   * Extended timeout for slow connections.
   */
  async authorize(token: string): Promise<DerivBalance> {
    this.token = token;
    try {
      const res: any = await this.send({ authorize: token }, 45000); // Extended to 45 seconds
      if (!res?.authorize) throw new Error("Authorization failed - no response");

      const balance: DerivBalance = {
        balance: res.authorize.balance,
        currency: res.authorize.currency,
        loginid: res.authorize.loginid,
        fullname: res.authorize.fullname,
      };
      this.lastBalance = balance;
      this.loginid = balance.loginid;
      return balance;
    } catch (e: any) {
      this.token = null;
      throw new Error(`Authorization failed: ${e.message}`);
    }
  }

  /** Subscribe ticks with rate limiting (stores subscription id from tick stream). */
  async subscribeTicks(symbol: string): Promise<void> {
    // Check if already subscribed or pending
    if (this.tickSubscriptionBySymbol.has(symbol)) {
      console.log(`[Deriv] Already subscribed to ${symbol}, skipping`);
      return;
    }
    if (this.pendingTickRequests.get(symbol)) {
      console.log(`[Deriv] Subscription pending for ${symbol}, skipping`);
      return;
    }

    // Mark as pending
    this.pendingTickRequests.set(symbol, true);

    try {
      // Wait for rate limit
      await this.waitForRateLimit('tick');
      await this.send({ ticks: symbol, subscribe: 1 }, 15000);
    } finally {
      this.pendingTickRequests.delete(symbol);
    }
  }

  /** Unsubscribe by subscription id with rate limiting. */
  async unsubscribe(subscriptionId: string): Promise<void> {
    await this.waitForRateLimit('forget');
    await this.send({ forget: subscriptionId }, 15000);
  }

  /** Convenience: unsubscribe current symbol subscription (if we have it). */
  async unsubscribeTicks(symbol: string): Promise<void> {
    const subId = this.tickSubscriptionBySymbol.get(symbol);
    if (!subId) {
      console.log(`[Deriv] No subscription found for ${symbol}, skipping unsubscribe`);
      return;
    }
    await this.unsubscribe(subId);
    this.tickSubscriptionBySymbol.delete(symbol);
  }

  /** Request balance; you can also subscribe by passing subscribe: 1 (we do subscribe by default in the hook). */
  async getBalance(subscribe = true): Promise<DerivBalance> {
    const res: any = await this.send({ balance: 1, account: "current", subscribe: subscribe ? 1 : 0 }, 15000);
    if (!res?.balance) {
      // sometimes balance comes via stream after request; fall back to cached
      if (this.lastBalance) return this.lastBalance;
      throw new Error("Balance not available");
    }
    const b: DerivBalance = {
      balance: res.balance.balance,
      currency: res.balance.currency,
      loginid: res.balance.loginid,
    };
    this.lastBalance = b;
    return b;
  }
}
