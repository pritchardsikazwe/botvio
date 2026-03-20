import { useState } from "react";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { LiveStreamCard } from "@/components/live/LiveStreamCard";
import { GoLiveDialog } from "@/components/live/GoLiveDialog";
import { LiveCommentPanel } from "@/components/live/LiveCommentPanel";
import { useLiveKit } from "@/hooks/useLiveKit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import {
  Radio,
  ArrowLeft,
  Eye,
  MessageCircle,
  Heart,
  Flame,
  Rocket,
  X,
  TrendingUp,
  Loader2,
  WifiOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function LiveFeed() {
  const { liveStreams, recentStreams, isLoading } = useLiveFeed();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStream, setSelectedStream] = useState<any | null>(null);
  const [reacting, setReacting] = useState(false);

  const reactions = [
    { type: "like", icon: Heart, label: "❤️" },
    { type: "fire", icon: Flame, label: "🔥" },
    { type: "rocket", icon: Rocket, label: "🚀" },
  ];

  const handleReaction = async (streamId: string, reactionType: string) => {
    if (!user) return;
    setReacting(true);
    try {
      await supabase.from("live_reactions").insert({
        stream_id: streamId,
        user_id: user.id,
        reaction_type: reactionType,
      });
    } catch {
      // silent
    } finally {
      setReacting(false);
    }
  };

  const endedStreams = recentStreams.filter((s) => s.status === "ended");

  return (
    <>
      <SEOHead
        title="Botvio Live – Watch Traders Stream in Real-Time"
        description="Watch live trading sessions, interact with traders, and learn strategies in real-time on Botvio Live."
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-destructive animate-pulse" />
                <h1 className="text-xl font-bold text-foreground">Botvio Live</h1>
              </div>
              {liveStreams.length > 0 && (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                  {liveStreams.length} Live Now
                </Badge>
              )}
            </div>

            {user && (
              <GoLiveDialog>
                <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold gap-2">
                  <Radio className="w-4 h-4" />
                  Go Live
                </Button>
              </GoLiveDialog>
            )}
          </div>
        </header>

        {/* Selected stream view */}
        {selectedStream && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col lg:flex-row">
            {/* Main stream area */}
            <div className="flex-1 flex flex-col">
              {/* Stream header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Badge className="bg-destructive text-destructive-foreground gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    LIVE
                  </Badge>
                  <h2 className="font-bold text-foreground truncate">{selectedStream.title}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedStream(null)}
                  className="text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Video placeholder */}
              <div className="flex-1 bg-secondary flex items-center justify-center relative">
                <div className="text-center space-y-3">
                  <Radio className="w-16 h-16 text-destructive animate-pulse mx-auto" />
                  <p className="text-muted-foreground text-sm">
                    Live stream – connecting to LiveKit…
                  </p>
                  <p className="text-xs text-muted-foreground">
                    wss://botvio-knua21jl.livekit.cloud
                  </p>
                </div>

                {/* Viewer count */}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {selectedStream.viewers_current || 0}
                  </span>
                </div>

                {/* Reactions bar */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  {reactions.map((r) => (
                    <Button
                      key={r.type}
                      variant="ghost"
                      size="icon"
                      className="bg-background/60 backdrop-blur hover:bg-background/80 rounded-full w-10 h-10"
                      onClick={() => handleReaction(selectedStream.id, r.type)}
                      disabled={reacting}
                    >
                      <span className="text-lg">{r.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stream meta */}
              <div className="p-4 border-t border-border flex flex-wrap gap-2">
                {selectedStream.instrument && (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {selectedStream.instrument}
                  </Badge>
                )}
                {selectedStream.broker_name && (
                  <Badge variant="outline" className="text-xs">{selectedStream.broker_name}</Badge>
                )}
                {selectedStream.timeframe && (
                  <Badge variant="outline" className="text-xs">{selectedStream.timeframe}</Badge>
                )}
                {selectedStream.strategy_tag && (
                  <Badge variant="outline" className="text-xs">{selectedStream.strategy_tag}</Badge>
                )}
              </div>
            </div>

            {/* Comments sidebar */}
            <div className="w-full lg:w-96 border-l border-border flex flex-col h-64 lg:h-auto">
              <div className="p-3 border-b border-border flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Live Chat</span>
              </div>
              <LiveCommentPanel streamId={selectedStream.id} />
            </div>
          </div>
        )}

        {/* Feed content */}
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          {isLoading && (
            <div className="text-center py-20">
              <Radio className="w-10 h-10 text-destructive animate-pulse mx-auto mb-3" />
              <p className="text-muted-foreground">Loading live streams...</p>
            </div>
          )}

          {/* Live Now Section */}
          {liveStreams.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                <h2 className="text-lg font-bold text-foreground">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {liveStreams.map((stream) => (
                  <LiveStreamCard
                    key={stream.id}
                    stream={stream}
                    onClick={() => setSelectedStream(stream)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!isLoading && liveStreams.length === 0 && (
            <Card className="bg-card border-border p-12 text-center">
              <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No Live Streams Right Now</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Be the first to go live and share your trading session with the Botvio community.
              </p>
              {user && (
                <GoLiveDialog>
                  <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold gap-2">
                    <Radio className="w-4 h-4" />
                    Start Streaming
                  </Button>
                </GoLiveDialog>
              )}
            </Card>
          )}

          {/* Recent / Ended streams */}
          {endedStreams.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Recent Streams</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {endedStreams.map((stream) => (
                  <LiveStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
