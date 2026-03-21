import { useState, useEffect } from "react";
import { useLiveKit } from "@/hooks/useLiveKit";
import { LiveCommentPanel } from "@/components/live/LiveCommentPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  X, Eye, Loader2, WifiOff, MessageCircle, PhoneOff,
  SwitchCamera, Settings, Volume2, VolumeX, Timer,
  Heart, Flame, Rocket, Share2, Maximize, Minimize,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreatorStreamViewProps {
  streamId: string;
  streamMode: "camera" | "screen" | "camera_screen";
  title: string;
  onEnd: () => void;
}

export function CreatorStreamView({ streamId, streamMode, title, onEnd }: CreatorStreamViewProps) {
  const {
    status, error, videoRef, screenVideoRef, audioRef, disconnect,
    cameraEnabled, micEnabled, screenEnabled, facingMode, viewerCount,
    toggleCamera, toggleMic, toggleScreen, flipCamera,
  } = useLiveKit({ streamId, isCreator: true, streamMode });

  const [showChat, setShowChat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);

  // Elapsed timer
  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Subscribe to reactions count via realtime
  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_reactions", filter: `stream_id=eq.${streamId}` },
        () => {
          setReactionCount((c) => c + 1);
        }
      )
      .subscribe();

    // Load initial count
    supabase
      .from("live_reactions")
      .select("id", { count: "exact", head: true })
      .eq("stream_id", streamId)
      .then(({ count }) => {
        if (count) setReactionCount(count);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleEnd = async () => {
    disconnect();
    // Update stream status to ended
    try {
      await supabase.functions.invoke("end-live-stream", {
        body: { stream_id: streamId },
      });
    } catch {}
    onEnd();
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
    const url = `${window.location.origin}/live?stream=${streamId}`;
    if (navigator.share) {
      await navigator.share({ title: `Botvio Live: ${title}`, url });
    } else {
      await navigator.clipboard.writeText(url);
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
            <h2 className="font-bold text-foreground truncate text-sm">{title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Duration */}
            <Badge variant="outline" className="text-xs gap-1 border-border text-muted-foreground">
              <Timer className="w-3 h-3" />
              {formatTime(elapsed)}
            </Badge>
            {/* Viewers */}
            <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
              <Eye className="w-3 h-3" />
              {viewerCount}
            </Badge>
            {/* Reactions */}
            <Badge variant="outline" className="text-xs gap-1 border-destructive/30 text-destructive">
              <Heart className="w-3 h-3" />
              {reactionCount}
            </Badge>
            {/* Connection status */}
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
            <Button variant="ghost" size="icon" onClick={handleEnd} className="text-muted-foreground h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {/* Main video (camera) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${screenEnabled && cameraEnabled ? "absolute bottom-4 right-4 w-32 h-24 rounded-lg z-10 border-2 border-border shadow-lg object-cover" : ""}`}
          />
          {/* Screen share video (full screen when both active) */}
          {screenEnabled && cameraEnabled && (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          )}
          <audio ref={audioRef} autoPlay />

          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <Loader2 className="w-12 h-12 text-destructive animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">Connecting & enabling media…</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <WifiOff className="w-12 h-12 text-destructive mb-3" />
              <p className="text-muted-foreground text-sm">{error || "Connection failed"}</p>
            </div>
          )}
        </div>

        {/* Media controls */}
        <div className="p-3 border-t border-border flex items-center justify-center gap-2 flex-wrap">
          {/* Camera toggle */}
          <Button
            variant={cameraEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleCamera}
            className={`h-10 w-10 rounded-full ${cameraEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>

          {/* Camera flip (only when camera is on) */}
          {cameraEnabled && (
            <Button
              variant="outline"
              size="icon"
              onClick={flipCamera}
              className="h-10 w-10 rounded-full text-muted-foreground"
              title={`Switch to ${facingMode === "user" ? "rear" : "front"} camera`}
            >
              <SwitchCamera className="w-4 h-4" />
            </Button>
          )}

          {/* Mic toggle */}
          <Button
            variant={micEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleMic}
            className={`h-10 w-10 rounded-full ${micEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            title={micEnabled ? "Mute mic" : "Unmute mic"}
          >
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>

          {/* Screen share toggle */}
          <Button
            variant={screenEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleScreen}
            className={`h-10 w-10 rounded-full ${screenEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            title={screenEnabled ? "Stop screen share" : "Share screen (MT5, TradingView, etc.)"}
          >
            {screenEnabled ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          {/* Share */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="h-10 w-10 rounded-full text-muted-foreground"
            title="Share stream link"
          >
            <Share2 className="w-4 h-4" />
          </Button>

          {/* Toggle chat */}
          <Button
            variant={showChat ? "default" : "outline"}
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className={`h-10 w-10 rounded-full lg:hidden ${showChat ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            title="Toggle chat"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="h-10 w-10 rounded-full text-muted-foreground"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          {/* End Stream */}
          <Button
            variant="destructive"
            onClick={handleEnd}
            className="gap-2 font-bold h-10 rounded-full px-5"
          >
            <PhoneOff className="w-4 h-4" />
            End
          </Button>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(false)}
              className="lg:hidden h-7 w-7 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <LiveCommentPanel streamId={streamId} />
        </div>
      )}
    </div>
  );
}
