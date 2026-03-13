import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const EMPTY_FORM = {
  event_name: "",
  event_code: "CPI",
  event_date: new Date().toISOString().split("T")[0],
  event_time_utc: "13:30",
  currency: "USD",
  instrument: "XAUUSD",
  hauza_direction: "WAIT",
  hauza_entry_price: "",
  hauza_stop_loss: "",
  hauza_take_profit_1: "",
  hauza_take_profit_2: "",
  hauza_confidence: "75",
  previous_value: "",
  forecast: "",
  actual_value: "",
  previous_direction: "",
  previous_result: "",
  previous_performance: "",
  fundamentals_summary: "",
  technical_summary: "",
  admin_notes: "",
  is_active: false,
};

export function AdminNewsEventsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-news-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_event_cards")
        .select("*")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        event_name: form.event_name,
        event_code: form.event_code,
        event_date: form.event_date,
        event_time_utc: form.event_time_utc || null,
        currency: form.currency,
        instrument: form.instrument,
        hauza_direction: form.hauza_direction,
        hauza_entry_price: form.hauza_entry_price ? Number(form.hauza_entry_price) : null,
        hauza_stop_loss: form.hauza_stop_loss ? Number(form.hauza_stop_loss) : null,
        hauza_take_profit_1: form.hauza_take_profit_1 ? Number(form.hauza_take_profit_1) : null,
        hauza_take_profit_2: form.hauza_take_profit_2 ? Number(form.hauza_take_profit_2) : null,
        hauza_confidence: form.hauza_confidence ? Number(form.hauza_confidence) : null,
        previous_value: form.previous_value || null,
        forecast: form.forecast || null,
        actual_value: form.actual_value || null,
        previous_direction: form.previous_direction || null,
        previous_result: form.previous_result || null,
        previous_performance: form.previous_performance || null,
        fundamentals_summary: form.fundamentals_summary || null,
        technical_summary: form.technical_summary || null,
        admin_notes: form.admin_notes || null,
        is_active: form.is_active,
        created_by: user?.id,
      };

      if (editId) {
        const { error } = await supabase.from("news_event_cards").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news_event_cards").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Event updated" : "Event created");
      qc.invalidateQueries({ queryKey: ["admin-news-events"] });
      qc.invalidateQueries({ queryKey: ["active-news-events"] });
      setOpen(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_event_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-news-events"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("news_event_cards").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-news-events"] });
      qc.invalidateQueries({ queryKey: ["active-news-events"] });
    },
  });

  const openEdit = (ev: any) => {
    setEditId(ev.id);
    setForm({
      event_name: ev.event_name,
      event_code: ev.event_code,
      event_date: ev.event_date,
      event_time_utc: ev.event_time_utc || "",
      currency: ev.currency,
      instrument: ev.instrument,
      hauza_direction: ev.hauza_direction || "WAIT",
      hauza_entry_price: ev.hauza_entry_price?.toString() || "",
      hauza_stop_loss: ev.hauza_stop_loss?.toString() || "",
      hauza_take_profit_1: ev.hauza_take_profit_1?.toString() || "",
      hauza_take_profit_2: ev.hauza_take_profit_2?.toString() || "",
      hauza_confidence: ev.hauza_confidence?.toString() || "75",
      previous_value: ev.previous_value || "",
      forecast: ev.forecast || "",
      actual_value: ev.actual_value || "",
      previous_direction: ev.previous_direction || "",
      previous_result: ev.previous_result || "",
      previous_performance: ev.previous_performance || "",
      fundamentals_summary: ev.fundamentals_summary || "",
      technical_summary: ev.technical_summary || "",
      admin_notes: ev.admin_notes || "",
      is_active: ev.is_active,
    });
    setOpen(true);
  };

  const F = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" /> News Event Cards
        </CardTitle>
        <Button size="sm" onClick={() => { setEditId(null); setForm(EMPTY_FORM); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Event
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Instrument</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(events ?? []).map((ev: any) => (
              <TableRow key={ev.id}>
                <TableCell className="font-bold">{ev.event_name} <Badge variant="outline" className="ml-1 text-[10px]">{ev.currency}</Badge></TableCell>
                <TableCell>{ev.event_date}</TableCell>
                <TableCell>{ev.instrument}</TableCell>
                <TableCell>
                  <Badge className={ev.hauza_direction === "BUY" ? "bg-emerald-500/20 text-emerald-400" : ev.hauza_direction === "SELL" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}>
                    {ev.hauza_direction || "WAIT"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch checked={ev.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: ev.id, active: v })} />
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(ev)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(ev.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!events?.length && !isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No news events created yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Create"} News Event Card</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Event Name</Label><Input value={form.event_name} onChange={(e) => F("event_name", e.target.value)} placeholder="US CPI m/m" /></div>
              <div>
                <Label>Event Code</Label>
                <Select value={form.event_code} onValueChange={(v) => F("event_code", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPI">CPI</SelectItem>
                    <SelectItem value="NFP">NFP</SelectItem>
                    <SelectItem value="FOMC">FOMC</SelectItem>
                    <SelectItem value="GDP">GDP</SelectItem>
                    <SelectItem value="PPI">PPI</SelectItem>
                    <SelectItem value="RETAIL_SALES">Retail Sales</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={(e) => F("event_date", e.target.value)} /></div>
              <div><Label>Time (UTC)</Label><Input value={form.event_time_utc} onChange={(e) => F("event_time_utc", e.target.value)} placeholder="13:30" /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => F("currency", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Instrument</Label><Input value={form.instrument} onChange={(e) => F("instrument", e.target.value)} /></div>
              <div>
                <Label>Botvio Direction</Label>
                <Select value={form.hauza_direction} onValueChange={(v) => F("hauza_direction", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                    <SelectItem value="WAIT">WAIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label>Entry</Label><Input value={form.hauza_entry_price} onChange={(e) => F("hauza_entry_price", e.target.value)} /></div>
              <div><Label>Stop Loss</Label><Input value={form.hauza_stop_loss} onChange={(e) => F("hauza_stop_loss", e.target.value)} /></div>
              <div><Label>TP 1</Label><Input value={form.hauza_take_profit_1} onChange={(e) => F("hauza_take_profit_1", e.target.value)} /></div>
              <div><Label>TP 2</Label><Input value={form.hauza_take_profit_2} onChange={(e) => F("hauza_take_profit_2", e.target.value)} /></div>
            </div>
            <div><Label>Confidence (%)</Label><Input type="number" value={form.hauza_confidence} onChange={(e) => F("hauza_confidence", e.target.value)} /></div>

            <div className="border-t pt-3">
              <p className="text-sm font-bold text-muted-foreground mb-2">Previous Data</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Previous Value</Label><Input value={form.previous_value} onChange={(e) => F("previous_value", e.target.value)} placeholder="0.4%" /></div>
                <div><Label>Forecast</Label><Input value={form.forecast} onChange={(e) => F("forecast", e.target.value)} placeholder="0.3%" /></div>
                <div><Label>Actual</Label><Input value={form.actual_value} onChange={(e) => F("actual_value", e.target.value)} placeholder="Fill after release" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><Label>Previous Direction</Label><Input value={form.previous_direction} onChange={(e) => F("previous_direction", e.target.value)} placeholder="UP or DOWN" /></div>
                <div><Label>Previous Result</Label><Input value={form.previous_result} onChange={(e) => F("previous_result", e.target.value)} placeholder="+45 pips" /></div>
              </div>
              <div className="mt-2"><Label>Previous Performance Summary</Label><Textarea rows={2} value={form.previous_performance} onChange={(e) => F("previous_performance", e.target.value)} placeholder="Last 3 CPI releases: Gold rallied..." /></div>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-bold text-muted-foreground mb-2">Analysis</p>
              <div><Label>Fundamentals</Label><Textarea rows={2} value={form.fundamentals_summary} onChange={(e) => F("fundamentals_summary", e.target.value)} placeholder="USD weakness expected due to..." /></div>
              <div className="mt-2"><Label>Technical Analysis</Label><Textarea rows={2} value={form.technical_summary} onChange={(e) => F("technical_summary", e.target.value)} placeholder="Price sitting at key support 2340..." /></div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
              <Label>Activate (show on homepage)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.event_name}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
