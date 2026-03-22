import { useState, useEffect } from "react";
import { useLiveKit } from "@/hooks/useLiveKit";
import { LiveCommentPanel } from "@/components/live/LiveCommentPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  X, Eye, Loader2, WifiOff, MessageCircle, PhoneOff,
  SwitchCamera, Settings, Timer,
  Heart, Share2, Maximize, Minimize, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatorStreamViewProps {
  streamId: string;
  streamMode: "camera" | "screen" | "camera_screen";
  title: string;
  accessToken?: string | null;
  wsUrl?: string | null;
  preferredFacingMode?: "user" | "environment";
  onEnd: () => void;
}

export function CreatorStreamView({ streamId, streamMode, title, accessToken, wsUrl, preferredFacingMode = "user", onEnd }: CreatorStreamViewProps) {
  const { toast } = useToast();
  const {
    status, error, videoRef, screenVideoRef, audioRef, disconnect,
    cameraEnabled, micEnabled, screenEnabled, facingMode, canFlipCamera, viewerCount,
    toggleCamera, toggleMic, toggleScreen, flipCamera,
  } = useLiveKit({ streamId, isCreator: true, streamMode, accessToken, wsUrl, preferredFacingMode });

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
    try {
      await supabase.functions.invoke("end-live-stream", {
        body: { stream_id: streamId },
      });
      toast({ title: "Live session ended" });
    } catch {}
    onEnd();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this live session and its chat, reactions, and history?");
    if (!confirmed) return;

    disconnect();

    try {
      const { data, error } = await supabase.functions.invoke("delete-live-stream", {
        body: { stream_id: streamId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to delete stream");

      toast({ title: "Live session deleted" });
      onEnd();
    } catch (err: any) {
      toast({ title: err.message || "Could not delete live session", variant: "destructive" });
    }
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
      toast({ title: "Live link copied" });
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
            className={screenEnabled && cameraEnabled ? "absolute bottom-4 right-4 w-32 h-24 rounded-lg z-10 border-2 border-border shadow-lg object-cover" : screenEnabled ? "hidden" : "w-full h-full object-contain"}
          />
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            className={screenEnabled ? "w-full h-full object-contain" : "hidden"}
          />
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

          {status === "connected" && !cameraEnabled && !screenEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-6 text-center">
              <p className="text-sm font-semibold text-foreground">No source is live yet</p>
              <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                Turn on camera, share your screen, or stream a browser tab like TradingView or a Google page.
              </p>
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
          {cameraEnabled && canFlipCamera && (
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

          <Button
            variant={showSettings ? "default" : "outline"}
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-10 w-10 rounded-full ${showSettings ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            title="Live settings"
          >
            <Settings className="w-4 h-4" />
          </Button>

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

          <Button
            variant="outline"
            onClick={handleDelete}
            className="gap-2 h-10 rounded-full px-5 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>

        {showSettings && (
          <div className="border-t border-border bg-card p-3">
            <div className="grid gap-3 lg:grid-cols-3">
              <Card className="border-border bg-secondary p-3">
                <p className="text-sm font-semibold text-foreground">Source controls</p>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p>• Camera is best for face-to-camera teaching.</p>
                  <p>• Screen share lets you stream MT5, TradingView, a browser tab, or a Google page.</p>
                  <p>• You can use camera and screen together.</p>
                </div>
              </Card>

              <Card className="border-border bg-secondary p-3">
                <p className="text-sm font-semibold text-foreground">Device status</p>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p>Camera: <span className="text-foreground">{cameraEnabled ? "On" : "Off"}</span></p>
                  <p>Mic: <span className="text-foreground">{micEnabled ? "On" : "Off"}</span></p>
                  <p>Screen: <span className="text-foreground">{screenEnabled ? "Sharing" : "Not sharing"}</span></p>
                  <p>Camera source: <span className="text-foreground">{facingMode === "user" ? "Front" : "Back"}</span></p>
                </div>
              </Card>

              <Card className="border-border bg-secondary p-3">
                <p className="text-sm font-semibold text-foreground">Mobile share note</p>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p>• Some phones pause screen share if you fully leave the browser.</p>
                  <p>• Sharing a web page works best while that chosen tab stays active.</p>
                  <p>• If your device has more than one camera, the switch button flips front/back.</p>
                </div>
              </Card>
            </div>
          </div>
        )}
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
