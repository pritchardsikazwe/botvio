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
import { Radio, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface GoLiveDialogProps {
  children: React.ReactNode;
  onStreamCreated?: (stream: any) => void;
}

export function GoLiveDialog({ children, onStreamCreated }: GoLiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    stream_mode: "camera",
    broker_name: "",
    instrument: "",
    timeframe: "",
    strategy_tag: "",
    comments_enabled: true,
    reactions_enabled: true,
    is_public: true,
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
      onStreamCreated?.(data);
      setOpen(false);
      setForm({
        title: "",
        description: "",
        stream_mode: "camera",
        broker_name: "",
        instrument: "",
        timeframe: "",
        strategy_tag: "",
        comments_enabled: true,
        reactions_enabled: true,
        is_public: true,
        risk_warning_accepted: false,
      });
    } catch (err: any) {
      toast({ title: err.message || "Failed to go live", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
          <div>
            <Label className="text-foreground">Stream Title *</Label>
            <Input
              placeholder="e.g. Gold scalping session – London open"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Broker</Label>
              <Input
                placeholder="e.g. Deriv, Exness"
                value={form.broker_name}
                onChange={(e) => setForm({ ...form, broker_name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-foreground">Instrument</Label>
              <Input
                placeholder="e.g. XAUUSD, EURUSD"
                value={form.instrument}
                onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Timeframe</Label>
              <Select value={form.timeframe} onValueChange={(v) => setForm({ ...form, timeframe: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["M1", "M5", "M15", "M30", "H1", "H4", "D1"].map((tf) => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Stream Mode</Label>
              <Select value={form.stream_mode} onValueChange={(v) => setForm({ ...form, stream_mode: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="screen">Screen Share</SelectItem>
                  <SelectItem value="camera_screen">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-foreground">Strategy Tag</Label>
            <Input
              placeholder="e.g. Hauza Scalp, SMC, ICT"
              value={form.strategy_tag}
              onChange={(e) => setForm({ ...form, strategy_tag: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-foreground">Comments</Label>
            <Switch
              checked={form.comments_enabled}
              onCheckedChange={(v) => setForm({ ...form, comments_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-foreground">Reactions</Label>
            <Switch
              checked={form.reactions_enabled}
              onCheckedChange={(v) => setForm({ ...form, reactions_enabled: v })}
            />
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
