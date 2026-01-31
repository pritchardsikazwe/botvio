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

export const useManualSignals = (filters?: {
  category?: string;
  broker?: string;
  status?: string;
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

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by broker if specified and auto-expire signals
      let signals = (data as ManualSignal[]).map(signal => {
        // Check if signal should be auto-expired
        if (signal.status === 'ACTIVE' && signal.expires_at) {
          const expiresAt = new Date(signal.expires_at);
          if (expiresAt < new Date()) {
            return { ...signal, status: 'EXPIRED' };
          }
        }
        return signal;
      });

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
      // Show all active signals (manual and automated)
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ManualSignal[];
    },
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
