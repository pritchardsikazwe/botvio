import { useState, useEffect } from "react";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { LiveStreamCard } from "@/components/live/LiveStreamCard";
import { GoLiveDialog } from "@/components/live/GoLiveDialog";
import { LiveCommentPanel } from "@/components/live/LiveCommentPanel";
import { CreatorStreamView } from "@/components/live/CreatorStreamView";
import { useLiveKit } from "@/hooks/useLiveKit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import {
  Radio, ArrowLeft, Eye, MessageCircle,
  X, TrendingUp, Trash2, Settings2,
  Loader2, WifiOff, Share2, Maximize, Minimize, Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function LiveStreamViewer({
  stream,
  onClose,
}: {
  stream: any;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { status, error, videoRef, screenVideoRef, audioRef, disconnect, viewerCount, cameraEnabled, screenEnabled } = useLiveKit({
    streamId: stream.id,
    isCreator: false,
  });
  const [reacting, setReacting] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);
  // Elapsed timer
  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Realtime floating reactions
  useEffect(() => {
    const channel = supabase
      .channel(`viewer-reactions-${stream.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_reactions", filter: `stream_id=eq.${stream.id}` },
        (payload) => {
          const type = (payload.new as any).reaction_type;
          const emoji = type === "fire" ? "🔥" : type === "rocket" ? "🚀" : "❤️";
          const id = Date.now() + Math.random();
          setFloatingReactions((prev) => [...prev, { id, emoji }]);
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
          }, 2000);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [stream.id]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const reactions = [
    { type: "like", emoji: "❤️" },
    { type: "fire", emoji: "🔥" },
    { type: "rocket", emoji: "🚀" },
  ];

  const handleReaction = async (type: string) => {
    if (!user) {
      toast({ title: "Sign in to react during live streams", variant: "destructive" });
      return;
    }
    if (reacting) return;
    setReacting(true);
    try {
      const emoji = type === "fire" ? "🔥" : type === "rocket" ? "🚀" : "❤️";
      const id = Date.now() + Math.random();
      setFloatingReactions((prev) => [...prev, { id, emoji }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2000);

      const { error } = await supabase.from("live_reactions").insert({
        stream_id: stream.id,
        user_id: user.id,
        reaction_type: type,
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: err.message || "Could not send reaction", variant: "destructive" });
    }
    setTimeout(() => setReacting(false), 500);
  };

  const handleClose = () => {
    disconnect();
    onClose();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/live?stream=${stream.id}`;
    if (navigator.share) {
      await navigator.share({ title: `Botvio Live: ${stream.title}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Stream link copied!" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge className="bg-destructive text-destructive-foreground gap-1 animate-pulse shrink-0">
              <span className="w-2 h-2 bg-white rounded-full" />
              LIVE
            </Badge>
            <h2 className="font-bold text-foreground truncate text-sm">{stream.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs gap-1 border-border text-muted-foreground">
              <Timer className="w-3 h-3" />
              {formatTime(elapsed)}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
              <Eye className="w-3 h-3" />
              {viewerCount || stream.viewers_current || 0}
            </Badge>
            {status === "connecting" && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
              </Badge>
            )}
            {status === "error" && (
              <Badge variant="outline" className="text-xs gap-1 border-destructive/30 text-destructive">
                <WifiOff className="w-3 h-3" /> Error
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-muted-foreground h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className={screenEnabled && cameraEnabled ? "absolute bottom-4 right-4 h-24 w-32 rounded-lg border-2 border-border object-cover shadow-lg z-10" : screenEnabled ? "hidden" : "w-full h-full object-contain"}
          />
          <video ref={screenVideoRef} autoPlay playsInline muted className={screenEnabled ? "w-full h-full object-contain" : "hidden"} />
          <audio ref={audioRef} autoPlay />

          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <Loader2 className="w-12 h-12 text-destructive animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">Connecting to LiveKit…</p>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <WifiOff className="w-12 h-12 text-destructive mb-3" />
              <p className="text-muted-foreground text-sm">{error || "Connection failed"}</p>
            </div>
          )}

          {/* Floating reactions animation */}
          <div className="absolute bottom-16 right-4 pointer-events-none">
            {floatingReactions.map((r) => (
              <span
                key={r.id}
                className="absolute text-2xl animate-bounce"
                style={{
                  bottom: 0,
                  right: Math.random() * 40,
                  animation: "floatUp 2s ease-out forwards",
                }}
              >
                {r.emoji}
              </span>
            ))}
          </div>

          {/* Reaction buttons overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            {reactions.map((r) => (
              <Button
                key={r.type}
                variant="ghost"
                size="icon"
                className="bg-background/60 backdrop-blur hover:bg-background/80 rounded-full w-11 h-11 hover:scale-110 transition-transform"
                onClick={() => handleReaction(r.type)}
                disabled={reacting || !user}
              >
                <span className="text-xl">{r.emoji}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="p-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {stream.instrument && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                <TrendingUp className="w-3 h-3" />
                {stream.instrument}
              </Badge>
            )}
            {stream.broker_name && <Badge variant="outline" className="text-xs">{stream.broker_name}</Badge>}
            {stream.timeframe && <Badge variant="outline" className="text-xs">{stream.timeframe}</Badge>}
            {stream.strategy_tag && <Badge variant="outline" className="text-xs">{stream.strategy_tag}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleShare} className="h-8 w-8 rounded-full text-muted-foreground" title="Share">
              <Share2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={showChat ? "default" : "outline"}
              size="icon"
              onClick={() => setShowChat(!showChat)}
              className={`h-8 w-8 rounded-full lg:hidden ${showChat ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              title="Toggle chat"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleFullscreen} className="h-8 w-8 rounded-full text-muted-foreground" title="Fullscreen">
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="w-full lg:w-96 border-l border-border flex flex-col h-64 lg:h-auto">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Live Chat</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="lg:hidden h-7 w-7 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <LiveCommentPanel streamId={stream.id} />
        </div>
      )}
    </div>
  );
}

function LiveFeedPage() {
  const { liveStreams, recentStreams, isLoading } = useLiveFeed();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedStream, setSelectedStream] = useState<any | null>(null);
  const [creatorStream, setCreatorStream] = useState<{ id: string; title: string; stream_mode: string; token?: string | null; ws_url?: string | null; preferred_camera?: "user" | "environment" } | null>(null);

  const endedStreams = recentStreams.filter((s) => s.status === "ended");
  const manageableStreams = user ? recentStreams.filter((stream) => isAdmin || isSuperAdmin || stream.creator_id === user.id) : [];

  const handleDeleteStream = async (streamId: string) => {
    const confirmed = window.confirm("Delete this live session and all related live data?");
    if (!confirmed) return;

    try {
      const { data, error } = await supabase.functions.invoke("delete-live-stream", {
        body: { stream_id: streamId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not delete stream");

      if (selectedStream?.id === streamId) setSelectedStream(null);
      if (creatorStream?.id === streamId) setCreatorStream(null);
      toast({ title: "Live session deleted" });
    } catch (err: any) {
      toast({ title: err.message || "Delete failed", variant: "destructive" });
    }
  };

  return (
    <>
      <SEOHead seoKey="live"
        title="Botvio Live – Watch Traders Stream in Real-Time"
        description="Watch live trading sessions, interact with traders, and learn strategies in real-time on Botvio Live."
      />

      <div className="min-h-screen bg-background">
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
              <GoLiveDialog onStreamCreated={(data) => setCreatorStream({
                id: data.id,
                title: data.title || "Live Stream",
                stream_mode: data.stream_mode || "camera",
                token: data.token,
                ws_url: data.ws_url,
                preferred_camera: data.preferred_camera || "user",
              })}>
                <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold gap-2">
                  <Radio className="w-4 h-4" />
                  Go Live
                </Button>
              </GoLiveDialog>
            )}
          </div>
        </header>

        {creatorStream && (
          <CreatorStreamView
            streamId={creatorStream.id}
            streamMode={creatorStream.stream_mode as any}
            title={creatorStream.title}
            accessToken={creatorStream.token}
            wsUrl={creatorStream.ws_url}
            preferredFacingMode={creatorStream.preferred_camera}
            onEnd={() => setCreatorStream(null)}
          />
        )}

        {selectedStream && !creatorStream && (
          <LiveStreamViewer
            stream={selectedStream}
            onClose={() => setSelectedStream(null)}
          />
        )}

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          {manageableStreams.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{isAdmin || isSuperAdmin ? "Admin Live Controls" : "Manage My Live Sessions"}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {manageableStreams.slice(0, 6).map((stream) => (
                  <Card key={`manage-${stream.id}`} className="border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{stream.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{stream.status === "live" ? "Live now" : "Ended stream"}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteStream(stream.id)}
                        className="h-8 w-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                        title="Delete live session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedStream(stream)}>
                        Open
                      </Button>
                      {stream.status === "live" && stream.creator_id === user?.id && (
                        <Button
                          size="sm"
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          onClick={() => setCreatorStream({
                            id: stream.id,
                            title: stream.title,
                            stream_mode: stream.stream_mode,
                            preferred_camera: "user",
                          })}
                        >
                          Return to controls
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {isLoading && (
            <div className="text-center py-20">
              <Radio className="w-10 h-10 text-destructive animate-pulse mx-auto mb-3" />
              <p className="text-muted-foreground">Loading live streams...</p>
            </div>
          )}

          {liveStreams.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                <h2 className="text-lg font-bold text-foreground">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {liveStreams.map((stream) => (
                  <LiveStreamCard key={stream.id} stream={stream} onClick={() => setSelectedStream(stream)} />
                ))}
              </div>
            </section>
          )}

          {!isLoading && liveStreams.length === 0 && (
            <Card className="bg-card border-border p-12 text-center">
              <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No Live Streams Right Now</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Be the first to go live and share your trading session with the Botvio community.
              </p>
              {user && (
                <GoLiveDialog onStreamCreated={(data) => setCreatorStream({
                  id: data.id,
                  title: data.title || "Live Stream",
                  stream_mode: data.stream_mode || "camera",
                  token: data.token,
                  ws_url: data.ws_url,
                  preferred_camera: data.preferred_camera || "user",
                })}>
                  <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold gap-2">
                    <Radio className="w-4 h-4" />
                    Start Streaming
                  </Button>
                </GoLiveDialog>
              )}
            </Card>
          )}

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

      {/* Floating reaction animation CSS */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
        }
      `}</style>
    </>
  );
}

export default LiveFeedPage;
