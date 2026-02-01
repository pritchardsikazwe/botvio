import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { DerivWebSocketService } from "@/services/derivWebSocket";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface OpenContract {
  contract_id: number;
  buy_price: number;
  current_spot: number;
  current_spot_time: number;
  profit: number;
  profit_percentage: number;
  status: "open" | "won" | "lost" | "sold";
  is_expired: boolean;
  is_sold: boolean;
  is_valid_to_sell: boolean;
  entry_spot: number;
  exit_tick: number | null;
  payout: number;
  longcode: string;
}

interface TradeExecutionResult {
  success: boolean;
  contract_id?: number;
  buy_price?: number;
  payout?: number;
  error?: string;
}

export const useTradeExecution = () => {
  const { user } = useAuth();
  const { authorized } = useDeriv();
  const [openContracts, setOpenContracts] = useState<Map<number, OpenContract>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const subscriptionsRef = useRef<Map<number, string>>(new Map());
  const serviceRef = useRef<DerivWebSocketService | null>(null);

  // Log trade execution to database
  const logExecution = useCallback(async (
    requestType: string,
    requestPayload: unknown,
    responsePayload: unknown,
    status: "pending" | "success" | "failed",
    contractId?: string,
    errorMessage?: string,
    executionTimeMs?: number,
    signalId?: string,
    tradingAccountId?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("trade_execution_logs").insert([{
        user_id: user.id,
        request_type: requestType,
        status,
        request_payload: requestPayload as Json ?? null,
        response_payload: responsePayload as Json ?? null,
        contract_id: contractId ?? null,
        error_message: errorMessage ?? null,
        execution_time_ms: executionTimeMs ?? null,
        signal_id: signalId ?? null,
        trading_account_id: tradingAccountId ?? null,
      }]);
      if (error) {
        console.error("Failed to log trade execution:", error);
      }
    } catch (e) {
      console.error("Failed to log trade execution:", e);
    }
  }, [user]);

  // Subscribe to contract updates using proposal_open_contract
  const subscribeToContract = useCallback(async (contractId: number, service: DerivWebSocketService) => {
    if (subscriptionsRef.current.has(contractId)) return;

    try {
      const response: any = await service.send({
        proposal_open_contract: 1,
        contract_id: contractId,
        subscribe: 1,
      });

      if (response.proposal_open_contract) {
        const contract = response.proposal_open_contract;
        
        setOpenContracts(prev => {
          const updated = new Map(prev);
          updated.set(contractId, {
            contract_id: contractId,
            buy_price: contract.buy_price,
            current_spot: contract.current_spot,
            current_spot_time: contract.current_spot_time,
            profit: contract.profit,
            profit_percentage: contract.profit_percentage,
            status: contract.is_sold ? "sold" : contract.is_expired ? (contract.profit >= 0 ? "won" : "lost") : "open",
            is_expired: contract.is_expired,
            is_sold: contract.is_sold,
            is_valid_to_sell: contract.is_valid_to_sell,
            entry_spot: contract.entry_spot,
            exit_tick: contract.exit_tick,
            payout: contract.payout,
            longcode: contract.longcode,
          });
          return updated;
        });

        if (response.subscription?.id) {
          subscriptionsRef.current.set(contractId, response.subscription.id);
        }
      }
    } catch (e) {
      console.error("Failed to subscribe to contract:", e);
    }
  }, []);

  // Handle incoming contract updates
  useEffect(() => {
    if (!serviceRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.msg_type === "proposal_open_contract" && data.proposal_open_contract) {
          const contract = data.proposal_open_contract;
          const contractId = contract.contract_id;

          setOpenContracts(prev => {
            const updated = new Map(prev);
            updated.set(contractId, {
              contract_id: contractId,
              buy_price: contract.buy_price,
              current_spot: contract.current_spot,
              current_spot_time: contract.current_spot_time,
              profit: contract.profit,
              profit_percentage: contract.profit_percentage,
              status: contract.is_sold ? "sold" : contract.is_expired ? (contract.profit >= 0 ? "won" : "lost") : "open",
              is_expired: contract.is_expired,
              is_sold: contract.is_sold,
              is_valid_to_sell: contract.is_valid_to_sell,
              entry_spot: contract.entry_spot,
              exit_tick: contract.exit_tick,
              payout: contract.payout,
              longcode: contract.longcode,
            });
            return updated;
          });

          // If contract is closed, unsubscribe
          if (contract.is_expired || contract.is_sold) {
            const subId = subscriptionsRef.current.get(contractId);
            if (subId && serviceRef.current) {
              serviceRef.current.send({ forget: subId }).catch(() => {});
              subscriptionsRef.current.delete(contractId);
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    // This would need to be connected to the websocket - placeholder for now
    return () => {
      // Cleanup subscriptions on unmount
      subscriptionsRef.current.forEach(async (subId) => {
        if (serviceRef.current) {
          try {
            await serviceRef.current.send({ forget: subId });
          } catch (e) {
            // Ignore
          }
        }
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  // Execute a trade with logging
  const executeTrade = useCallback(async (
    service: DerivWebSocketService,
    params: {
      symbol: string;
      contract_type: "CALL" | "PUT";
      amount: number;
      duration: number;
      duration_unit: "t" | "s" | "m" | "h" | "d";
      signalId?: string;
      tradingAccountId?: string;
    }
  ): Promise<TradeExecutionResult> => {
    if (!user || !authorized) {
      return { success: false, error: "Not authenticated or not connected to Deriv" };
    }

    setIsExecuting(true);
    const startTime = Date.now();
    serviceRef.current = service;

    try {
      // Log pending request
      await logExecution(
        "proposal",
        params,
        null,
        "pending",
        undefined,
        undefined,
        undefined,
        params.signalId,
        params.tradingAccountId
      );

      // Get proposal
      const proposalResponse: any = await service.send({
        proposal: 1,
        amount: params.amount,
        basis: "stake",
        contract_type: params.contract_type,
        currency: "USD",
        duration: params.duration,
        duration_unit: params.duration_unit,
        symbol: params.symbol,
      });

      if (!proposalResponse.proposal) {
        const errorMsg = proposalResponse.error?.message || "Failed to get proposal";
        await logExecution(
          "proposal",
          params,
          proposalResponse,
          "failed",
          undefined,
          errorMsg,
          Date.now() - startTime,
          params.signalId,
          params.tradingAccountId
        );
        setIsExecuting(false);
        return { success: false, error: errorMsg };
      }

      // Buy contract
      const buyResponse: any = await service.send({
        buy: proposalResponse.proposal.id,
        price: proposalResponse.proposal.ask_price,
      });

      if (!buyResponse.buy) {
        const errorMsg = buyResponse.error?.message || "Failed to buy contract";
        await logExecution(
          "buy",
          { proposal_id: proposalResponse.proposal.id },
          buyResponse,
          "failed",
          undefined,
          errorMsg,
          Date.now() - startTime,
          params.signalId,
          params.tradingAccountId
        );
        setIsExecuting(false);
        return { success: false, error: errorMsg };
      }

      const contractId = buyResponse.buy.contract_id;

      // Log success
      await logExecution(
        "buy",
        { proposal_id: proposalResponse.proposal.id },
        buyResponse,
        "success",
        contractId.toString(),
        undefined,
        Date.now() - startTime,
        params.signalId,
        params.tradingAccountId
      );

      // Subscribe to contract updates
      await subscribeToContract(contractId, service);

      toast.success(`Trade executed! Contract ID: ${contractId}`);
      setIsExecuting(false);

      return {
        success: true,
        contract_id: contractId,
        buy_price: buyResponse.buy.buy_price,
        payout: buyResponse.buy.payout,
      };
    } catch (e: any) {
      const errorMsg = e.message || "Trade execution failed";
      await logExecution(
        "buy",
        params,
        { error: errorMsg },
        "failed",
        undefined,
        errorMsg,
        Date.now() - startTime,
        params.signalId,
        params.tradingAccountId
      );
      
      toast.error(`Trade failed: ${errorMsg}`);
      setIsExecuting(false);
      return { success: false, error: errorMsg };
    }
  }, [user, authorized, logExecution, subscribeToContract]);

  // Get P&L for a specific contract
  const getContractPnL = useCallback((contractId: number) => {
    return openContracts.get(contractId);
  }, [openContracts]);

  return {
    executeTrade,
    isExecuting,
    openContracts: Array.from(openContracts.values()),
    getContractPnL,
  };
};
