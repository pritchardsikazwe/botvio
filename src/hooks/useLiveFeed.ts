import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface LiveStream {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: string;
  stream_mode: string;
  room_name: string;
  broker_name: string | null;
  market_type: string | null;
  instrument: string | null;
  timeframe: string | null;
  strategy_tag: string | null;
  viewers_current: number;
  viewers_peak: number;
  started_at: string | null;
  created_at: string;
  is_public: boolean;
  thumbnail_url: string | null;
  profiles?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

async function fetchLiveStreams(): Promise<LiveStream[]> {
  const { data, error } = await supabase
    .from("live_streams")
    .select(`
      *,
      profiles:creator_id (
        user_id,
        display_name,
        avatar_url,
        email
      )
    `)
    .eq("status", "live")
    .eq("is_public", true)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return (data as any) ?? [];
}

async function fetchRecentStreams(): Promise<LiveStream[]> {
  const { data, error } = await supabase
    .from("live_streams")
    .select(`
      *,
      profiles:creator_id (
        user_id,
        display_name,
        avatar_url,
        email
      )
    `)
    .in("status", ["ended", "live"])
    .eq("is_public", true)
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data as any) ?? [];
}

export function useLiveFeed() {
  const queryClient = useQueryClient();

  const liveQuery = useQuery({
    queryKey: ["live-streams-active"],
    queryFn: fetchLiveStreams,
    refetchInterval: 15000,
  });

  const recentQuery = useQuery({
    queryKey: ["live-streams-recent"],
    queryFn: fetchRecentStreams,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`live-feed-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-streams-active"] });
          queryClient.invalidateQueries({ queryKey: ["live-streams-recent"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    liveStreams: liveQuery.data ?? [],
    recentStreams: recentQuery.data ?? [],
    isLoading: liveQuery.isLoading,
    error: liveQuery.error,
  };
}
