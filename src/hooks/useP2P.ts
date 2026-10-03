import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export interface P2POffer {
  id: string;
  user_id: string;
  type: "buy" | "sell";
  price: number;
  currency: string;
  min_amount: number;
  max_amount: number;
  payment_methods: string[];
  is_active: boolean;
  terms?: string;
  auto_reply?: string;
  completion_rate?: number;
  avg_release_time?: number;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  // Computed stats
  trader_stats?: {
    total_trades: number;
    completed_trades: number;
    avg_rating: number;
    total_volume: number;
    completion_rate: number;
  };
}

export interface P2PTrade {
  id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  amount_usd: number;
  amount_fiat: number;
  currency: string;
  price: number;
  payment_method: string;
  status: "pending" | "paid" | "released" | "disputed" | "cancelled" | "completed";
  buyer_confirmed_at?: string;
  seller_released_at?: string;
  dispute_reason?: string;
  admin_resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface P2PReview {
  id: string;
  trade_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// Realtime subscription for P2P offers with polling fallback
export function useP2PRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Primary: realtime subscription
    const channel = supabase
      .channel(`p2p-live-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "p2p_offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["p2p_offers"] });
        queryClient.invalidateQueries({ queryKey: ["my_p2p_offers"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "p2p_trades" }, () => {
        queryClient.invalidateQueries({ queryKey: ["my_p2p_trades"] });
      })
      .subscribe();

    // Fallback: polling every 15s to ensure data freshness
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["p2p_offers"] });
      queryClient.invalidateQueries({ queryKey: ["my_p2p_trades"] });
      queryClient.invalidateQueries({ queryKey: ["trader_stats"] });
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [queryClient]);
}

// Fetch all active P2P offers
export function useP2POffers(type?: "buy" | "sell", currency?: string) {
  return useQuery({
    queryKey: ["p2p_offers", type, currency],
    queryFn: async () => {
      let query = supabase
        .from("p2p_offers")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: type === "buy" });

      if (type) {
        query = query.eq("type", type);
      }
      if (currency) {
        query = query.eq("currency", currency);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for each offer
      const userIds = [...new Set((data || []).map((o: any) => o.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      // Get trader stats
      const offersWithStats = await Promise.all(
        (data || []).map(async (offer: any) => {
          const profile = profiles?.find((p) => p.user_id === offer.user_id);
          
          // Get trader stats using RPC
          const { data: stats } = await supabase.rpc("get_p2p_trader_stats", {
            trader_id: offer.user_id,
          });

          return {
            ...offer,
            profiles: profile || null,
            trader_stats: stats?.[0] || {
              total_trades: 0,
              completed_trades: 0,
              avg_rating: 5,
              total_volume: 0,
              completion_rate: 100,
            },
          };
        })
      );

      return offersWithStats as P2POffer[];
    },
  });
}

// Fetch user's own offers
export function useMyP2POffers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my_p2p_offers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("p2p_offers")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as P2POffer[];
    },
    enabled: !!user,
  });
}

// Create a new P2P offer
export function useCreateP2POffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (offer: {
      type: "buy" | "sell";
      price: number;
      currency: string;
      min_amount: number;
      max_amount: number;
      payment_methods: string[];
      terms?: string;
      auto_reply?: string;
    }) => {
      const { data, error } = await supabase
        .from("p2p_offers")
        .insert({
          user_id: user!.id,
          ...offer,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p_offers"] });
      queryClient.invalidateQueries({ queryKey: ["my_p2p_offers"] });
      toast.success("Offer created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create offer");
    },
  });
}

// Update a P2P offer
export function useUpdateP2POffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<P2POffer> & { id: string }) => {
      const { data, error } = await supabase
        .from("p2p_offers")
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p_offers"] });
      queryClient.invalidateQueries({ queryKey: ["my_p2p_offers"] });
      toast.success("Offer updated successfully!");
    },
  });
}

// Delete/deactivate a P2P offer
export function useDeleteP2POffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from("p2p_offers")
        .update({ is_active: false })
        .eq("id", offerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p_offers"] });
      queryClient.invalidateQueries({ queryKey: ["my_p2p_offers"] });
      toast.success("Offer removed successfully!");
    },
  });
}

// Fetch user's P2P trades
export function useMyP2PTrades() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my_p2p_trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("p2p_trades")
        .select("*")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as P2PTrade[];
    },
    enabled: !!user,
  });
}

// Create a new P2P trade (initiate purchase)
export function useCreateP2PTrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (trade: {
      offer_id: string;
      seller_id: string;
      amount_usd: number;
      amount_fiat: number;
      currency: string;
      price: number;
      payment_method: string;
    }) => {
      const { data, error } = await supabase
        .from("p2p_trades")
        .insert({
          buyer_id: user!.id,
          ...trade,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_p2p_trades"] });
      toast.success("Trade initiated! Please complete payment.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to initiate trade");
    },
  });
}

// Update trade status
export function useUpdateP2PTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      ...updates
    }: {
      id: string;
      status: P2PTrade["status"];
      buyer_confirmed_at?: string;
      seller_released_at?: string;
      dispute_reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("p2p_trades")
        .update({ status, ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my_p2p_trades"] });
      if (data.status === "completed") {
        toast.success("Trade completed successfully!");
      } else if (data.status === "paid") {
        toast.success("Payment confirmed! Waiting for seller to release.");
      } else if (data.status === "released") {
        toast.success("Funds released!");
      }
    },
  });
}

// Create a review
export function useCreateP2PReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: {
      trade_id: string;
      reviewed_id: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("p2p_reviews")
        .insert({
          reviewer_id: user!.id,
          ...review,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p_offers"] });
      toast.success("Review submitted!");
    },
  });
}

// Get trader stats
export function useTraderStats(userId: string) {
  return useQuery({
    queryKey: ["trader_stats", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_p2p_trader_stats", {
        trader_id: userId,
      });

      if (error) throw error;
      return data?.[0] || {
        total_trades: 0,
        completed_trades: 0,
        avg_rating: 5,
        total_volume: 0,
        completion_rate: 100,
      };
    },
    enabled: !!userId,
  });
}
