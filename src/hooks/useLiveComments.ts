import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface LiveComment {
  id: string;
  stream_id: string;
  user_id: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useLiveComments(streamId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["live-comments", streamId],
    queryFn: async (): Promise<LiveComment[]> => {
      if (!streamId) return [];
      const { data, error } = await supabase
        .from("live_comments")
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq("stream_id", streamId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data as any) ?? [];
    },
    enabled: !!streamId,
  });

  useEffect(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`comments-${streamId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_comments",
          filter: `stream_id=eq.${streamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-comments", streamId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, queryClient]);

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
  };
}
