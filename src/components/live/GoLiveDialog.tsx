import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radio, AlertTriangle, Video, Monitor, Layout, Globe, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface GoLiveDialogProps {
  children: React.ReactNode;
  onStreamCreated?: (stream: any) => void;
}

const MARKET_TYPES = [
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "commodities", label: "Commodities" },
  { value: "indices", label: "Indices" },
  { value: "binary", label: "Binary Options" },
  { value: "synthetic", label: "Synthetic Indices" },
];

const BROKERS = [
  "Deriv", "Exness", "XM", "IC Markets", "FXGT", "OctaFX",
  "Weltrade", "Binance", "Bybit", "Other",
];

export function GoLiveDialog({ children, onStreamCreated }: GoLiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    stream_mode: "camera",
    preferred_camera: "user",
    broker_name: "",
    market_type: "",
    instrument: "",
    timeframe: "",
    strategy_tag: "",
    comments_enabled: true,
    reactions_enabled: true,
    is_public: true,
    is_recording_enabled: false,
    risk_warning_accepted: false,
  });

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in to go live", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Stream title is required", variant: "destructive" });
      return;
    }
    if (!form.risk_warning_accepted) {
      toast({ title: "Please accept the risk disclaimer", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-live-stream", {
        body: form,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to create stream");

      toast({ title: "You're now live! 🔴" });
      onStreamCreated?.({
        id: data.stream_id || data.id,
        title: form.title,
        stream_mode: form.stream_mode,
        token: data.token,
        ws_url: data.ws_url,
        preferred_camera: form.preferred_camera,
        stream: data.stream,
      });
      setOpen(false);
      setForm({
        title: "",
        description: "",
        stream_mode: "camera",
        preferred_camera: "user",
        broker_name: "",
        market_type: "",
        instrument: "",
        timeframe: "",
        strategy_tag: "",
        comments_enabled: true,
        reactions_enabled: true,
        is_public: true,
        is_recording_enabled: false,
        risk_warning_accepted: false,
      });
    } catch (err: any) {
      toast({ title: err.message || "Failed to go live", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const streamModes = [
    { value: "camera", label: "Camera", icon: Video, desc: "Face cam" },
    { value: "screen", label: "Screen", icon: Monitor, desc: "Share charts or web pages" },
    { value: "camera_screen", label: "Both", icon: Layout, desc: "Camera + screen" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Radio className="w-5 h-5 text-destructive" />
            Go Live
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label className="text-foreground">Stream Title *</Label>
            <Input
              placeholder="e.g. Gold scalping session – London open"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-foreground">Description</Label>
            <Textarea
              placeholder="What will you be trading today?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-secondary border-border"
              rows={2}
            />
          </div>

          {/* Stream Mode Selection */}
          <div>
            <Label className="text-foreground mb-2 block">Stream Mode *</Label>
            <div className="grid grid-cols-3 gap-2">
              {streamModes.map((mode) => (
                <button
                  type="button"
                  key={mode.value}
                  onClick={() => setForm({ ...form, stream_mode: mode.value })}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    form.stream_mode === mode.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <mode.icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{mode.label}</span>
                  <span className="text-[10px] opacity-70">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Preferred Camera</Label>
              <Select value={form.preferred_camera} onValueChange={(v) => setForm({ ...form, preferred_camera: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Front Camera</SelectItem>
                  <SelectItem value="environment">Back Camera</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
                After going live, you can switch between camera and screen sharing any time.
              </div>
            </div>
          </div>

          {/* Broker & Market Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Broker</Label>
              <Select value={form.broker_name} onValueChange={(v) => setForm({ ...form, broker_name: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  {BROKERS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Market Type</Label>
              <Select value={form.market_type} onValueChange={(v) => setForm({ ...form, market_type: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_TYPES.map((mt) => (
                    <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instrument & Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Instrument</Label>
              <Input
                placeholder="e.g. XAUUSD, EURUSD"
                value={form.instrument}
                onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-foreground">Timeframe</Label>
              <Select value={form.timeframe} onValueChange={(v) => setForm({ ...form, timeframe: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"].map((tf) => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Strategy Tag */}
          <div>
            <Label className="text-foreground">Strategy Tag</Label>
            <Input
              placeholder="e.g. Hauza Scalp, SMC, ICT, Price Action"
              value={form.strategy_tag}
              onChange={(e) => setForm({ ...form, strategy_tag: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {form.is_public ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
              <Label className="text-foreground">
                {form.is_public ? "Public (anyone can watch)" : "Private (invite only)"}
              </Label>
            </div>
            <Switch
              checked={form.is_public}
              onCheckedChange={(v) => setForm({ ...form, is_public: v })}
            />
          </div>

          {/* Toggles row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
              <Label className="text-foreground text-sm">💬 Chat</Label>
              <Switch
                checked={form.comments_enabled}
                onCheckedChange={(v) => setForm({ ...form, comments_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
              <Label className="text-foreground text-sm">❤️ Reactions</Label>
              <Switch
                checked={form.reactions_enabled}
                onCheckedChange={(v) => setForm({ ...form, reactions_enabled: v })}
              />
            </div>
          </div>

          {/* Recording toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-foreground">🎬 Record stream (replay)</Label>
            <Switch
              checked={form.is_recording_enabled}
              onCheckedChange={(v) => setForm({ ...form, is_recording_enabled: v })}
            />
          </div>

          <div className="rounded-lg border border-border bg-secondary p-3 text-xs text-muted-foreground space-y-1">
            <p>• Screen sharing can stream charts, TradingView, MT5, or a web page.</p>
            <p>• On some phones, screen sharing may pause if you fully leave the browser app.</p>
            <p>• Use the live controls page to switch source, flip camera, end, or delete the session.</p>
          </div>

          {/* Risk disclaimer */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Risk Disclaimer</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Trading involves significant risk of loss. Content shared during live streams is for educational purposes only and should not be considered financial advice.
            </p>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.risk_warning_accepted}
                onCheckedChange={(v) => setForm({ ...form, risk_warning_accepted: v })}
              />
              <span className="text-xs text-foreground">I accept the risk disclaimer</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !form.title || !form.risk_warning_accepted}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
          >
            {loading ? "Starting..." : "🔴 Go Live"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
