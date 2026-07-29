import type { DerivMessage, DerivTick, DerivBalance, DerivAccountInfo, DerivContractUpdate } from "@/types/deriv";
import { getDerivPublicWebSocketUrl } from "@/config/derivEnv";

type ConnectionStatus = "idle" | "connecting" | "reconnecting" | "open" | "closed";

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
  /** Max consecutive reconnect attempts before giving up (default 12) */
  maxReconnectAttempts?: number;
  /** Enable keepalive ping (default true) */
  keepAlive?: boolean;
  /** Ping interval ms (default 25000) */
  pingIntervalMs?: number;
};

/**
 * Deriv WebSocket service (browser).
 * Public market data via wss://api.derivws.com/trading/v1/options/ws/public,
 * authenticated sessions via OTP-derived URL from the deriv-get-otp edge function.
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
  private netListenersBound = false;

  private token: string | null = null;
  /** If set, we connected via OTP and don't need to send authorize */
  private otpMode = false;
  private otpUrlGetter: (() => Promise<string>) | null = null;
  private lastBalance: DerivBalance | null = null;
  private loginid: string | null = null;
  private accountInfo: DerivAccountInfo | null = null;
  private lastMessageAt: number | null = null;
  private lastErrorMessage: string | null = null;

  private tickListeners = new Set<Listener<DerivTick>>();
  private statusListeners = new Set<Listener<ConnectionStatus>>();
  private logListeners = new Set<Listener<string>>();
  private errorListeners = new Set<Listener<string>>();
  private contractListeners = new Set<Listener<DerivContractUpdate>>();
  private balanceListeners = new Set<Listener<DerivBalance>>();

  private tickSubscriptionBySymbol = new Map<string, string>();
  private activeContractSubscriptions = new Set<number>();

  // Rate limiting protection
  private lastTickRequestTime = 0;
  private lastForgetRequestTime = 0;
  private readonly minRequestIntervalMs = 500;
  private pendingTickRequests = new Map<string, boolean>();

  private readonly defaultUrl: string;
  private currentUrl: string;
  private readonly autoReconnect: boolean;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private readonly maxReconnectAttempts: number;
  private readonly keepAlive: boolean;
  private readonly pingIntervalMs: number;

  constructor(opts: DerivWebSocketOptions = {}) {
    this.defaultUrl = opts.url ?? getDerivPublicWebSocketUrl();
    this.currentUrl = this.defaultUrl;
    this.autoReconnect = opts.autoReconnect ?? true;
    this.reconnectBaseDelayMs = opts.reconnectBaseDelayMs ?? 1000;
    this.reconnectMaxDelayMs = opts.reconnectMaxDelayMs ?? 15000;
    this.maxReconnectAttempts = opts.maxReconnectAttempts ?? 12;
    this.keepAlive = opts.keepAlive ?? true;
    this.pingIntervalMs = opts.pingIntervalMs ?? 25000;
    
    console.log("[Deriv] WebSocket default URL:", this.defaultUrl);
  }

  // Rate limit helper
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

  get connectionStatus() { return this.status; }
  /** True while a scheduled automatic reconnect is pending */
  get isReconnecting() { return this.reconnectTimer !== null || this.status === "reconnecting"; }
  get reconnectAttempts() { return this.reconnectAttempt; }
  get authorizedLoginId() { return this.loginid; }
  get latestBalance() { return this.lastBalance; }
  get account() { return this.accountInfo; }
  /** True only when the underlying socket is genuinely OPEN */
  get socketOpen() { return this.ws?.readyState === WebSocket.OPEN; }
  get socketReadyState() { return this.ws?.readyState ?? WebSocket.CLOSED; }
  get lastHeartbeatAt() { return this.lastMessageAt; }
  get lastError() { return this.lastErrorMessage; }

  onTick(listener: Listener<DerivTick>) {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  onContractUpdate(listener: Listener<DerivContractUpdate>) {
    this.contractListeners.add(listener);
    return () => this.contractListeners.delete(listener);
  }

  onBalanceUpdate(listener: Listener<DerivBalance>) {
    this.balanceListeners.add(listener);
    return () => this.balanceListeners.delete(listener);
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
    this.lastErrorMessage = message;
    this.errorListeners.forEach((l) => l(message));
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** Reconnect immediately when the browser regains connectivity or the tab is refocused. */
  private bindNetworkListeners() {
    if (this.netListenersBound || typeof window === "undefined") return;
    this.netListenersBound = true;

    const kick = () => {
      if (this.isManualClose || !this.autoReconnect) return;
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      this.log("Network available — retrying Deriv connection now");
      this.reconnectAttempt = 0;
      this.scheduleReconnect(0);
    };

    window.addEventListener("online", kick);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") kick();
    });
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
      this.send({ ping: 1 }).catch(() => {});
    }, this.pingIntervalMs);
  }

  /**
   * Set a function that returns the OTP WebSocket URL.
   * When set, open() will use this to get a fresh OTP URL.
   */
  setOtpUrlGetter(getter: () => Promise<string>) {
    this.otpUrlGetter = getter;
  }

  async open(url?: string): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const connectUrl = url || this.currentUrl;
    this.isManualClose = false;
    this.bindNetworkListeners();
    this.emitStatus("connecting");
    this.log(`Connecting: ${connectUrl}`);

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(connectUrl);
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
    this.reconnectAttempt = 0;
    this.clearPingTimer();
    this.tickSubscriptionBySymbol.clear();
    this.activeContractSubscriptions.clear();
    this.token = null;
    this.otpMode = false;
    this.loginid = null;
    this.lastBalance = null;
    this.rejectAllPending(new Error("Disconnected"));
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emitStatus("closed");
  }

  private scheduleReconnect(forcedDelayMs?: number) {
    this.clearReconnectTimer();

    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.log("Reconnect attempts exhausted. Please reconnect manually.");
      this.emitError("Lost connection to Deriv. Please reconnect.");
      this.emitStatus("closed");
      return;
    }

    // Exponential backoff with full jitter (avoids thundering herd on Deriv)
    const base = Math.min(
      this.reconnectMaxDelayMs,
      this.reconnectBaseDelayMs * Math.pow(2, this.reconnectAttempt),
    );
    const delay = forcedDelayMs ?? Math.round(base / 2 + Math.random() * (base / 2));
    this.reconnectAttempt += 1;
    this.emitStatus("reconnecting");
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts})...`);
    this.reconnectTimer = window.setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.isManualClose) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        this.log("Offline — waiting for network before retrying");
        this.scheduleReconnect();
        return;
      }
      try {
        if (this.otpMode && this.otpUrlGetter) {
          // For OTP mode, get a fresh OTP URL before reconnecting
          console.log("[RECONNECT] Getting fresh OTP URL");
          try {
            const freshUrl = await this.otpUrlGetter();
            this.currentUrl = freshUrl;
            await this.open(freshUrl);
          } catch (e) {
            console.warn("[RECONNECT] Failed to get OTP URL, falling back to legacy");
            this.currentUrl = this.defaultUrl;
            await this.open();
            if (this.token) {
              await this.authorize(this.token);
            }
          }
        } else {
          await this.open();
          if (this.token) {
            console.log("[RECONNECT] Re-authorizing with stored token");
            await this.authorize(this.token);
          }
        }

        // Re-subscribe to balance stream
        try {
          console.log("[RECONNECT] Re-subscribing to balance stream");
          await this.send({ balance: 1, account: "current", subscribe: 1 }, 15000);
        } catch (e) {
          console.warn("[RECONNECT] Failed to re-subscribe balance:", e);
        }

        // Re-subscribe to tick streams
        for (const [symbol] of this.tickSubscriptionBySymbol.entries()) {
          await this.subscribeTicks(symbol);
        }

        // Re-subscribe to active contract streams
        for (const contractId of this.activeContractSubscriptions) {
          console.log(`[RECONNECT] Re-subscribing to contract ${contractId}`);
          try {
            await this.send({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1 }, 15000);
          } catch (e) {
            console.warn(`[RECONNECT] Failed to re-subscribe contract ${contractId}:`, e);
            this.activeContractSubscriptions.delete(contractId);
          }
        }

        this.log("Reconnected to Deriv");
      } catch (e) {
        // If the socket never opened, no close event fires — schedule the next attempt here.
        const isOpen = this.ws?.readyState === WebSocket.OPEN;
        if (!isOpen && !this.isManualClose && this.autoReconnect && !this.reconnectTimer) {
          this.scheduleReconnect();
        }
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
    this.lastMessageAt = Date.now();

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
      this.accountInfo = {
        loginid: a.loginid,
        is_virtual: !!a.is_virtual,
        currency: a.currency,
        fullname: a.fullname,
        account_list: a.account_list,
      };
    }

    if (data.msg_type === "balance" && (data as any).balance) {
      const b = (data as any).balance as any;
      const newBal: DerivBalance = {
        balance: b.balance,
        currency: b.currency,
        loginid: b.loginid,
      };
      const prevBalance = this.lastBalance?.balance;
      this.lastBalance = newBal;
      console.log(`[BALANCE STREAM] ${prevBalance} -> ${newBal.balance} ${newBal.currency} (loginid=${newBal.loginid})`);
      this.balanceListeners.forEach((l) => l(newBal));
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

    // Handle proposal_open_contract stream updates (settlement detection)
    if (data.msg_type === "proposal_open_contract" && (data as any).proposal_open_contract) {
      const c = (data as any).proposal_open_contract as any;
      const isSettled = c.is_sold === 1 || c.is_expired === 1 || 
                        ["won", "lost", "sold"].includes(c.status);
      const update: DerivContractUpdate = {
        contract_id: c.contract_id,
        buy_price: c.buy_price,
        sell_price: c.sell_price,
        current_spot: c.current_spot,
        current_spot_time: c.current_spot_time,
        profit: c.profit,
        profit_percentage: c.profit_percentage || 0,
        status: c.is_sold ? "sold" : c.is_expired ? (c.profit >= 0 ? "won" : "lost") : "open",
        is_expired: !!c.is_expired,
        is_sold: !!c.is_sold,
        is_valid_to_sell: !!c.is_valid_to_sell,
        entry_spot: c.entry_spot,
        exit_tick: c.exit_tick,
        payout: c.payout,
        longcode: c.longcode,
        underlying: c.underlying || "",
        contract_type: c.contract_type || "",
      };
      this.contractListeners.forEach((l) => l(update));

      // Auto-forget subscription on settlement and force balance refresh
      if (isSettled) {
        this.activeContractSubscriptions.delete(c.contract_id);
        const subId = (data as any).subscription?.id;
        if (subId) {
          this.send({ forget: subId }).catch(() => {});
        }
        console.log(`[SETTLED] contract_id=${c.contract_id} profit=${c.profit} sell_price=${c.sell_price} status=${update.status}`);
        
        const refreshBalanceNow = async () => {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
          try {
            const res: any = await this.send({ balance: 1, account: "current" }, 10000);
            if (res?.balance) {
              const freshBal: DerivBalance = {
                balance: res.balance.balance,
                currency: res.balance.currency,
                loginid: res.balance.loginid,
              };
              console.log(`[BALANCE] post-settle: ${this.lastBalance?.balance} -> ${freshBal.balance} ${freshBal.currency}`);
              this.lastBalance = freshBal;
              this.balanceListeners.forEach((l) => l(freshBal));
            }
          } catch (e) {
            console.warn(`[BALANCE] refresh failed:`, e);
          }
        };
        
        setTimeout(refreshBalanceNow, 500);
        setTimeout(refreshBalanceNow, 2000);
        setTimeout(refreshBalanceNow, 5000);
        setTimeout(refreshBalanceNow, 8000);
      }
    }
  }

  /** Track a contract ID for re-subscription on reconnect */
  trackContractSubscription(contractId: number) {
    this.activeContractSubscriptions.add(contractId);
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
   * Connect via OTP-based WebSocket URL (new API).
   * The URL is already authenticated — no authorize message needed.
   * Returns balance info from a balance request after connecting.
   */
  async connectWithOtpUrl(wsUrl: string, otpUrlGetter?: () => Promise<string>): Promise<DerivBalance> {
    this.otpMode = true;
    this.currentUrl = wsUrl;
    if (otpUrlGetter) {
      this.otpUrlGetter = otpUrlGetter;
    }
    
    await this.open(wsUrl);

    // After OTP connection, the session is already authenticated.
    // Request balance to get account info.
    const balRes: any = await this.send({ balance: 1, account: "current", subscribe: 1 }, 15000);
    
    if (balRes?.balance) {
      const balance: DerivBalance = {
        balance: balRes.balance.balance,
        currency: balRes.balance.currency,
        loginid: balRes.balance.loginid,
      };
      this.lastBalance = balance;
      this.loginid = balance.loginid;
      return balance;
    }

    throw new Error("Failed to get balance after OTP connection");
  }

  /**
   * Authorize with token (legacy flow).
   * Must be called after open().
   */
  async authorize(token: string): Promise<DerivBalance> {
    this.token = token;
    this.otpMode = false;
    try {
      const res: any = await this.send({ authorize: token }, 45000);
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

  /** Subscribe ticks with rate limiting */
  async subscribeTicks(symbol: string): Promise<void> {
    if (this.tickSubscriptionBySymbol.has(symbol)) {
      console.log(`[Deriv] Already subscribed to ${symbol}, skipping`);
      return;
    }
    if (this.pendingTickRequests.get(symbol)) {
      console.log(`[Deriv] Subscription pending for ${symbol}, skipping`);
      return;
    }

    this.pendingTickRequests.set(symbol, true);

    try {
      await this.waitForRateLimit('tick');
      await this.send({ ticks: symbol, subscribe: 1 }, 15000);
    } finally {
      this.pendingTickRequests.delete(symbol);
    }
  }

  /** Unsubscribe by subscription id with rate limiting */
  async unsubscribe(subscriptionId: string): Promise<void> {
    await this.waitForRateLimit('forget');
    await this.send({ forget: subscriptionId }, 15000);
  }

  /** Convenience: unsubscribe current symbol subscription */
  async unsubscribeTicks(symbol: string): Promise<void> {
    const subId = this.tickSubscriptionBySymbol.get(symbol);
    if (!subId) {
      console.log(`[Deriv] No subscription found for ${symbol}, skipping unsubscribe`);
      return;
    }
    await this.unsubscribe(subId);
    this.tickSubscriptionBySymbol.delete(symbol);
  }

  /** Request balance; optionally subscribe for streaming updates */
  async getBalance(subscribe = true): Promise<DerivBalance> {
    const payload: Record<string, unknown> = { balance: 1, account: "current" };
    if (subscribe) {
      payload.subscribe = 1;
    }
    const res: any = await this.send(payload, 15000);
    if (!res?.balance) {
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
