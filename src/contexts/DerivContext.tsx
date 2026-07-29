import React, { createContext, useContext, ReactNode, useEffect, useMemo, useCallback, useRef } from "react";
import { useDerivAPI, DerivBalance, DerivTick, DerivProposal, DerivContract, DerivAccountInfo, DerivContractUpdate, type DerivConnectionStatus } from "@/hooks/useDerivAPI";
import { useRunningTrades, RunningTrade } from "@/hooks/useRunningTrades";
import { useActiveToken, ActiveToken } from "@/hooks/useActiveToken";
import { useDerivTokens, DerivTokenRow } from "@/hooks/useDerivTokens";
import { useDerivTrades } from "@/hooks/useDerivTrades";

interface DerivContextType {
  connected: boolean;
  authorized: boolean;
  /** Authoritative state machine: disconnected | connecting | connected | error */
  status: DerivConnectionStatus;
  /** The only flag UI should use to gate trading */
  isDerivConnected: boolean;
  accountId: string | null;
  environment: "prod" | null;
  connectedAt: string | null;
  lastHeartbeat: number | null;
  socketReadyState: number;
  initializing: boolean;
  refreshDerivConnection: () => Promise<boolean>;
  balance: DerivBalance | null;
  error: string | null;
  loading: boolean;
  reconnecting: boolean;
  lastTick: DerivTick | null;
  accountInfo: DerivAccountInfo | null;
  // Running trades & equity
  runningTrades: RunningTrade[];
  runningProfit: number;
  equity: number;
  // Active token (legacy)
  activeToken: ActiveToken | null;
  // Multi-account tokens
  derivTokens: DerivTokenRow[];
  activeDerivToken: DerivTokenRow | null;
  switchDerivToken: (tokenId: string) => Promise<void>;
  removeDerivToken: (tokenId: string) => Promise<void>;
  // Actions
  connect: (apiToken: string) => Promise<DerivBalance>;
  disconnect: () => void;
  subscribeTicks: (symbol: string) => Promise<void>;
  unsubscribeTicks: (symbol: string) => Promise<void>;
  getProposal: (params: {
    symbol: string;
    contract_type: string;
    amount: number;
    duration?: number;
    duration_unit?: "t" | "s" | "m" | "h" | "d";
    basis?: "stake" | "payout";
    currency?: string;
    barrier?: number | string;
    multiplier?: number;
    growth_rate?: number;
    limit_order?: Record<string, number>;
  }) => Promise<DerivProposal>;
  buyContract: (proposalId: string, price: number) => Promise<DerivContract>;
  placeTrade: (params: {
    symbol: string;
    contract_type: string;
    amount: number;
    duration?: number;
    duration_unit?: "t" | "s" | "m" | "h" | "d";
    barrier?: number | string;
    multiplier?: number;
    growth_rate?: number;
    limit_order?: Record<string, number>;
  }) => Promise<DerivContract>;
  subscribeContract: (contractId: number) => Promise<any>;
  onContractUpdate: (listener: (update: DerivContractUpdate) => void) => () => void;
  refreshBalance: () => Promise<DerivBalance | null>;
}

const DerivContext = createContext<DerivContextType | undefined>(undefined);

export const DerivProvider = ({ children }: { children: ReactNode }) => {
  const derivAPI = useDerivAPI();
  const [initializing, setInitializing] = React.useState(true);
  const { runningTrades, runningProfit, addTrade, handleContractUpdate } = useRunningTrades();
  const { activeToken, setToken, validateConnection } = useActiveToken();
  const { tokens: derivTokens, activeToken: activeDerivToken, upsertToken, switchToken: switchDerivToken, removeToken: removeDerivToken } = useDerivTokens();
  const derivTrades = useDerivTrades();

  /**
   * Rehydrate the Deriv session at PROVIDER level (not inside a page component),
   * so the dashboard never races ahead of connection init and the connected state
   * survives SPA navigation and full page refresh.
   * Historic bug: OAuth stored `deriv_oauth_token` while auto-connect only read
   * `deriv_pat_token`, so the dashboard kept showing "Connect Deriv to trade".
   */
  const rehydrateAttempted = useRef(false);
  useEffect(() => {
    if (rehydrateAttempted.current) return;
    rehydrateAttempted.current = true;

    const stored =
      localStorage.getItem("deriv_pat_token") ||
      localStorage.getItem("deriv_oauth_token");

    if (!stored || stored.length < 10) {
      console.log("[DERIV][init] no stored Deriv session — status=disconnected");
      setInitializing(false);
      return;
    }

    console.log("[DERIV][init] rehydrating Deriv session from stored credentials");
    derivAPI
      .connect(stored)
      .then((bal) => console.log(`[DERIV][init] session restored — accountId=${bal.loginid}`))
      .catch((e) => {
        console.warn("[DERIV][init] stored session invalid:", e instanceof Error ? e.message : e);
        localStorage.removeItem("deriv_pat_token");
        localStorage.removeItem("deriv_oauth_token");
      })
      .finally(() => setInitializing(false));
  }, [derivAPI.connect]);

  /** Re-verify live authorization when the user returns to the tab / dashboard. */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!derivAPI.authorized) return;
      derivAPI.refreshDerivConnection().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [derivAPI.authorized, derivAPI.refreshDerivConnection]);

  /** Token/account change (OAuth callback, account switch) → re-authorize immediately. */
  useEffect(() => {
    const onTokenUpdated = (e: Event) => {
      const token = (e as CustomEvent<{ token?: string }>).detail?.token;
      if (!token) return;
      console.log("[DERIV][init] token updated — re-authorizing");
      setInitializing(true);
      derivAPI
        .connect(token)
        .catch((err) => console.warn("[DERIV][init] re-authorize failed:", err))
        .finally(() => setInitializing(false));
    };
    const onTokenCleared = () => derivAPI.disconnect();

    window.addEventListener("deriv:token-updated", onTokenUpdated);
    window.addEventListener("deriv:token-cleared", onTokenCleared);
    return () => {
      window.removeEventListener("deriv:token-updated", onTokenUpdated);
      window.removeEventListener("deriv:token-cleared", onTokenCleared);
    };
  }, [derivAPI.connect, derivAPI.disconnect]);

  // Use refs for values that change but shouldn't cause effect re-runs
  // This prevents the onContractUpdate listener from being briefly removed
  // when these values change, which was causing missed settlements for
  // longer-running contracts (Rise/Fall, Multipliers) vs instant tick contracts
  const handleContractUpdateRef = useRef(handleContractUpdate);
  const activeDerivTokenRef = useRef(activeDerivToken);
  const derivTradesRef = useRef(derivTrades);
  const refreshBalanceRef = useRef(derivAPI.refreshBalance);

  useEffect(() => { handleContractUpdateRef.current = handleContractUpdate; }, [handleContractUpdate]);
  useEffect(() => { activeDerivTokenRef.current = activeDerivToken; }, [activeDerivToken]);
  useEffect(() => { derivTradesRef.current = derivTrades; }, [derivTrades]);
  useEffect(() => { refreshBalanceRef.current = derivAPI.refreshBalance; }, [derivAPI.refreshBalance]);

  // Equity = Deriv balance + sum of running profits (never simulated)
  const equity = useMemo(() => {
    const bal = derivAPI.balance?.balance ?? 0;
    return bal + runningProfit;
  }, [derivAPI.balance?.balance, runningProfit]);

  // When authorized, register active token in both legacy and new systems
  useEffect(() => {
    if (derivAPI.authorized && derivAPI.accountInfo && derivAPI.balance) {
      const info = derivAPI.accountInfo;
      // Legacy active token
      setToken({
        loginid: info.loginid,
        is_virtual: info.is_virtual,
        currency: info.currency,
      });
      // New multi-account token store - use a placeholder for encrypted token
      // The actual encrypted token is stored during OAuth/API token flow
      upsertToken({
        loginid: info.loginid,
        is_virtual: info.is_virtual,
        currency: info.currency,
        token_encrypted: "session-active",
        label: info.is_virtual ? "Demo" : "Real",
      });
    }
  }, [derivAPI.authorized, derivAPI.accountInfo?.loginid]);

  // Listen for contract updates to track running trades + refresh balance on settlement
  // IMPORTANT: Use refs for unstable deps so this listener is NEVER removed during trading.
  // Previously, changes to activeDerivToken/handleContractUpdate caused the listener to
  // briefly detach, missing settlement events for minute-based contracts.
  useEffect(() => {
    if (!derivAPI.authorized) return;
    const unsub = derivAPI.onContractUpdate((update) => {
      handleContractUpdateRef.current(update);
      // On settlement, immediately refresh wallet balance from Deriv
      const isSettled = update.is_sold || update.is_expired || ["won", "lost", "sold"].includes(update.status);
      if (isSettled) {
        console.log(`[BALANCE] Refreshing after settlement of contract_id=${update.contract_id}`);

        // Also settle in new deriv_trades table
        const token = activeDerivTokenRef.current;
        if (token) {
          const outcome = update.status === "won" ? "WIN" : update.status === "lost" ? "LOSS" : "BREAKEVEN";
          derivTradesRef.current.settleTrade(update.contract_id, {
            sell_price: update.sell_price ?? 0,
            profit: update.profit ?? 0,
            payout: update.payout,
            status: update.status,
            outcome,
          });
        }

        refreshBalanceRef.current().then((bal) => {
          if (bal) console.log(`[BALANCE] after=${bal.balance} ${bal.currency} loginid=${bal.loginid}`);
        });
      }
    });
    return () => { unsub(); };
  }, [derivAPI.authorized, derivAPI.onContractUpdate]);

  // Enhanced placeTrade that also tracks running trades
  const enhancedPlaceTrade = useCallback(async (params: Parameters<typeof derivAPI.placeTrade>[0]) => {
    // Validate no demo/real mismatch
    if (derivAPI.accountInfo && activeToken) {
      if (!validateConnection(derivAPI.accountInfo.loginid)) {
        throw new Error(`Token mismatch: expected ${activeToken.loginid} but connected as ${derivAPI.accountInfo.loginid}. Please reconnect.`);
      }
    }

    const contract = await derivAPI.placeTrade(params);

    // Track running trade (legacy)
    if (derivAPI.accountInfo) {
      await addTrade({
        contract_id: contract.contract_id,
        loginid: derivAPI.accountInfo.loginid,
        is_virtual: derivAPI.accountInfo.is_virtual,
        symbol: params.symbol,
        contract_type: params.contract_type ?? "",
        buy_price: contract.buy_price,
        payout: contract.payout,
      });

      // Track in new deriv_trades table
      if (activeDerivToken) {
        await derivTrades.addTrade({
          token_id: activeDerivToken.id,
          loginid: derivAPI.accountInfo.loginid,
          symbol: params.symbol,
          contract_id: contract.contract_id,
          contract_type: params.contract_type,
          buy_price: contract.buy_price,
          payout: contract.payout,
          is_virtual: derivAPI.accountInfo.is_virtual,
          currency: derivAPI.accountInfo.currency,
        });
      }
    }

    return contract;
  }, [derivAPI.placeTrade, derivAPI.accountInfo, activeToken, activeDerivToken, validateConnection, addTrade, derivTrades.addTrade]);

  const value: DerivContextType = {
    ...derivAPI,
    initializing,
    placeTrade: enhancedPlaceTrade,
    runningTrades,
    runningProfit,
    equity,
    activeToken,
    derivTokens,
    activeDerivToken,
    switchDerivToken,
    removeDerivToken,
  };

  return (
    <DerivContext.Provider value={value}>
      {children}
    </DerivContext.Provider>
  );
};

export const useDeriv = () => {
  const context = useContext(DerivContext);
  if (!context) {
    throw new Error("useDeriv must be used within a DerivProvider");
  }
  return context;
};
