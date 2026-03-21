import { useLiveKit } from "@/hooks/useLiveKit";
import { LiveCommentPanel } from "@/components/live/LiveCommentPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  X, Eye, Loader2, WifiOff, MessageCircle, PhoneOff,
} from "lucide-react";

interface CreatorStreamViewProps {
  streamId: string;
  streamMode: "camera" | "screen" | "camera_screen";
  title: string;
  onEnd: () => void;
}

export function CreatorStreamView({ streamId, streamMode, title, onEnd }: CreatorStreamViewProps) {
  const {
    status, error, videoRef, audioRef, disconnect,
    cameraEnabled, micEnabled, screenEnabled,
    toggleCamera, toggleMic, toggleScreen,
  } = useLiveKit({ streamId, isCreator: true, streamMode });

  const handleEnd = () => {
    disconnect();
    onEnd();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Badge className="bg-destructive text-destructive-foreground gap-1 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full" />
              LIVE
            </Badge>
            <h2 className="font-bold text-foreground truncate">{title}</h2>
            {status === "connecting" && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
              </Badge>
            )}
            {status === "connected" && (
              <Badge variant="outline" className="text-xs gap-1 border-green-500/30 text-green-500">
                Connected
              </Badge>
            )}
            {status === "error" && (
              <Badge variant="outline" className="text-xs gap-1 border-destructive/30 text-destructive">
                <WifiOff className="w-3 h-3" /> {error || "Error"}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleEnd} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
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

          {/* Viewer count */}
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">0</span>
          </div>
        </div>

        {/* Media controls */}
        <div className="p-4 border-t border-border flex items-center justify-center gap-3">
          <Button
            variant={cameraEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleCamera}
            className={cameraEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
            title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={micEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleMic}
            className={micEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
            title={micEnabled ? "Mute mic" : "Unmute mic"}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={screenEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleScreen}
            className={screenEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
            title={screenEnabled ? "Stop screen share" : "Share screen"}
          >
            {screenEnabled ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
          </Button>

          <div className="w-px h-8 bg-border mx-2" />

          <Button
            variant="destructive"
            onClick={handleEnd}
            className="gap-2 font-bold"
          >
            <PhoneOff className="w-4 h-4" />
            End Stream
          </Button>
        </div>
      </div>

      {/* Chat sidebar */}
      <div className="w-full lg:w-96 border-l border-border flex flex-col h-64 lg:h-auto">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Chat</span>
        </div>
        <LiveCommentPanel streamId={streamId} />
      </div>
    </div>
  );
}
