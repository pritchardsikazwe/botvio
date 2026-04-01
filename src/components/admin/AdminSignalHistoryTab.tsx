import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Trash2, Image, CalendarDays, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const AdminSignalHistoryTab = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pair, setPair] = useState("");
  const [result, setResult] = useState("WIN");

  const { data: history, isLoading } = useQuery({
    queryKey: ["admin-signals-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals_history")
        .select("*")
        .order("date_posted", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const uploadScreenshot = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Select a screenshot first");

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `signal-results/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("charts")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("charts").getPublicUrl(path);

      const { error: insertErr } = await supabase.from("signals_history").insert({
        pair: pair || "Signal",
        signal_type: "BUY",
        entry_price: 0,
        result,
        screenshot_url: urlData.publicUrl,
        date_posted: new Date().toISOString(),
        source: "admin",
      });
      if (insertErr) throw insertErr;

      queryClient.invalidateQueries({ queryKey: ["admin-signals-history"] });
      queryClient.invalidateQueries({ queryKey: ["signals-history-public"] });
      toast.success("Screenshot uploaded!");
      setPair("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("signals_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-signals-history"] });
      queryClient.invalidateQueries({ queryKey: ["signals-history-public"] });
      toast.success("Deleted");
    },
  });

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Upload Signal Result Screenshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Screenshot</Label>
            <Input ref={fileRef} type="file" accept="image/*" className="h-9 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Pair / Label (optional)</Label>
              <Input value={pair} onChange={e => setPair(e.target.value)} placeholder="e.g. XAUUSD" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Result</Label>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIN">✅ WIN</SelectItem>
                  <SelectItem value="LOSS">❌ LOSS</SelectItem>
                  <SelectItem value="RUNNING">⏳ RUNNING</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={uploadScreenshot} disabled={uploading} className="w-full" size="sm">
            {uploading ? "Uploading..." : "Upload Screenshot"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Screenshots */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-primary" />
            Uploaded Results ({history?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : !history?.length ? (
            <p className="text-xs text-muted-foreground text-center py-4">No screenshots uploaded yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {history.map((s: any) => (
                <div key={s.id} className="relative group rounded-lg overflow-hidden border border-border">
                  {s.screenshot_url ? (
                    <img src={s.screenshot_url} alt={s.pair} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-muted flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{s.pair}</p>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-2.5 w-2.5" />
                        <span className="text-[10px]">{format(new Date(s.date_posted), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                    <Badge className={`text-[9px] ${s.result === "WIN" ? "bg-success/20 text-success" : s.result === "LOSS" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
                      {s.result}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteEntry.mutate(s.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
