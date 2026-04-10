import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TrainingVideo {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^&?\s]+)/);
  return match ? match[1] : null;
}

export const TrainingVideosGrid = () => {
  const { data: videos, isLoading } = useQuery({
    queryKey: ["training-videos-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_videos" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []) as unknown as TrainingVideo[];
    },
    refetchInterval: 120000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Training Videos</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Training Videos</h2>
        <Badge variant="outline" className="text-xs">Watch & Learn</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {videos.map((v) => {
          const ytId = extractYouTubeId(v.youtube_url);
          const thumb = v.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);

          return (
            <a
              key={v.id}
              href={v.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="bg-card border-border/50 overflow-hidden hover:border-primary/40 transition-colors h-full">
                <div className="relative">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={v.title}
                      className="w-full h-28 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-28 sm:h-32 bg-muted flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-10 w-10 text-white fill-white" />
                  </div>
                </div>
                <CardContent className="p-2.5">
                  <p className="text-xs font-semibold text-foreground line-clamp-2">{v.title}</p>
                  {v.category && (
                    <Badge variant="secondary" className="text-[9px] mt-1 px-1.5 py-0 h-4">
                      {v.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
};
