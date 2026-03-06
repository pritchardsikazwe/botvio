import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ManualSignal {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  timeframe: string;
  category: string;
  broker: string[];
  confidence: number | null;
  status: string;
  created_at: string;
  reason: string | null;
  is_manual: boolean;
  posted_by: string | null;
  expires_at: string | null;
  outcome: string | null;
  outcome_updated_at: string | null;
}

interface CreateSignalInput {
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  timeframe: string;
  category: string;
  broker: string[];
  confidence?: number;
  reason?: string;
  expires_at?: string;
}

// Map timeframe string to milliseconds for expiration
function timeframeToMs(timeframe: string): number {
  const map: Record<string, number> = {
    M1: 1 * 60 * 1000,
    M5: 5 * 60 * 1000,
    M15: 15 * 60 * 1000,
    M30: 30 * 60 * 1000,
    H1: 60 * 60 * 1000,
    H4: 4 * 60 * 60 * 1000,
    D1: 24 * 60 * 60 * 1000,
  };
  return map[timeframe] || 5 * 60 * 1000; // default 5 min
}

// Helper to check if signal is expired based on its timeframe
function isSignalExpired(signal: ManualSignal): boolean {
  const now = new Date();
  
  // Check explicit expires_at first
  if (signal.expires_at) {
    return new Date(signal.expires_at) < now;
  }
  
  // Expire based on signal timeframe
  const createdAt = new Date(signal.created_at);
  const expiresAt = new Date(createdAt.getTime() + timeframeToMs(signal.timeframe));
  return expiresAt < now;
}

// Helper to check if signal is too old for history (2 days)
function isSignalTooOldForHistory(signal: ManualSignal): boolean {
  const now = new Date();
  const createdAt = new Date(signal.created_at);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  return createdAt < twoDaysAgo;
}

export const useManualSignals = (filters?: {
  category?: string;
  broker?: string;
  status?: string;
  includeHistory?: boolean;
}) => {
  return useQuery({
    queryKey: ["manual-signals", filters],
    queryFn: async () => {
      // Show all signals (both manual and automated)
      let query = supabase
        .from("trading_signals")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process signals: auto-expire and filter
      let signals = (data as ManualSignal[]).map(signal => {
        // Check if ACTIVE signal should be auto-expired (5 min default)
        if (signal.status === 'ACTIVE' && isSignalExpired(signal)) {
          return { ...signal, status: 'EXPIRED' };
        }
        return signal;
      });

      // Filter out signals older than 2 days from history
      signals = signals.filter(signal => !isSignalTooOldForHistory(signal));

      // Apply status filter
      if (filters?.status && filters.status !== "all") {
        signals = signals.filter(s => s.status === filters.status);
      }

      // Apply broker filter
      if (filters?.broker && filters.broker !== "all") {
        signals = signals.filter(s => s.broker?.includes(filters.broker!));
      }

      return signals;
    },
  });
};

export const useLatestSignals = (limit: number = 3) => {
  return useQuery({
    queryKey: ["latest-signals", limit],
    queryFn: async () => {
      const now = new Date();
      // Fetch recent active signals (last 24h to cover all timeframes)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .eq("status", "ACTIVE")
        .gte("created_at", oneDayAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Filter by timeframe-based expiration
      const activeSignals = (data as ManualSignal[]).filter(signal => {
        if (signal.expires_at) {
          return new Date(signal.expires_at) > now;
        }
        const createdAt = new Date(signal.created_at);
        const expiresAt = new Date(createdAt.getTime() + timeframeToMs(signal.timeframe));
        return expiresAt > now;
      });
      
      return activeSignals;
    },
    refetchInterval: 30000, // Refetch every 30 seconds to keep expiration status current
  });
};

export const useCreateSignal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSignalInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("trading_signals")
        .insert({
          symbol: input.symbol,
          direction: input.direction,
          entry_price: input.entry_price,
          stop_loss: input.stop_loss || null,
          take_profit: input.take_profit || null,
          timeframe: input.timeframe,
          category: input.category,
          broker: input.broker,
          confidence: input.confidence || null,
          reason: input.reason || null,
          is_manual: true,
          posted_by: userData.user.id,
          status: "ACTIVE",
          strategy_name: "Manual Signal",
          expires_at: input.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-signals"] });
      queryClient.invalidateQueries({ queryKey: ["latest-signals"] });
      
      // Send notification to all users
      await sendSignalNotification(data);
      
      toast.success("Signal posted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to post signal: ${error.message}`);
    },
  });
};

export const useUpdateSignalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("trading_signals")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-signals"] });
      queryClient.invalidateQueries({ queryKey: ["latest-signals"] });
      toast.success("Signal status updated!");
    },
  });
};

export const useUpdateSignalOutcome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, outcome }: { id: string; outcome: "win" | "loss" | "pending" }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("trading_signals")
        .update({
          outcome,
          outcome_updated_at: new Date().toISOString(),
          outcome_updated_by: userData.user.id,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { outcome }) => {
      queryClient.invalidateQueries({ queryKey: ["manual-signals"] });
      queryClient.invalidateQueries({ queryKey: ["latest-signals"] });
      toast.success(`Signal marked as ${outcome}`);
    },
    onError: (error) => {
      toast.error(`Failed to update outcome: ${error.message}`);
    },
  });
};

// Helper function to send notifications to all users
async function sendSignalNotification(signal: ManualSignal) {
  try {
    // Get all user IDs from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id");

    if (!profiles || profiles.length === 0) return;

    // Create notifications for all users
    const notifications = profiles.map((profile) => ({
      user_id: profile.user_id,
      title: `📊 New ${signal.direction} Signal`,
      message: `${signal.symbol} - Entry: ${signal.entry_price}, TP: ${signal.take_profit || 'TBA'}`,
      type: "signal",
      metadata: {
        signal_id: signal.id,
        symbol: signal.symbol,
        direction: signal.direction,
      },
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (error) {
    console.error("Failed to send notifications:", error);
  }
}
