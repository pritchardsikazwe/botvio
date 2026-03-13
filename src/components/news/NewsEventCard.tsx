import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Pause, Shield, AlertTriangle,
  Clock, BarChart3, BookOpen, Activity, Target, Newspaper
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NewsEvent {
  id: string;
  event_name: string;
  event_code: string;
  event_date: string;
  event_time_utc: string | null;
  currency: string;
  is_active: boolean;
  hauza_direction: string | null;
  hauza_entry_price: number | null;
  hauza_stop_loss: number | null;
  hauza_take_profit_1: number | null;
  hauza_take_profit_2: number | null;
  hauza_confidence: number | null;
  instrument: string;
  previous_result: string | null;
  previous_direction: string | null;
  previous_performance: string | null;
  fundamentals_summary: string | null;
  technical_summary: string | null;
  forecast: string | null;
  previous_value: string | null;
  actual_value: string | null;
}

const DIR_CONFIG = {
  BUY: { icon: TrendingUp, gradient: "from-emerald-500/20 to-emerald-900/10", border: "border-emerald-500/40", text: "text-emerald-400", shadow: "shadow-[0_0_30px_hsl(var(--success)/0.2)]", pulse: true },
  SELL: { icon: TrendingDown, gradient: "from-red-500/20 to-red-900/10", border: "border-red-500/40", text: "text-red-400", shadow: "shadow-[0_0_30px_hsl(var(--destructive)/0.2)]", pulse: true },
  WAIT: { icon: Pause, gradient: "from-amber-500/10 to-amber-900/5", border: "border-amber-500/30", text: "text-amber-400", shadow: "", pulse: false },
};

function formatPrice(v: number | null) {
  if (v == null) return "—";
  return v.toFixed(v >= 100 ? 2 : 5);
}

export function NewsEventCards() {
  const navigate = useNavigate();

  const { data: events } = useQuery({
    queryKey: ["active-news-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_event_cards")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NewsEvent[];
    },
    refetchInterval: 60_000,
  });

  if (!events?.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-destructive" />
        <h2 className="text-xl font-extrabold text-foreground">High-Impact News Today</h2>
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs font-bold animate-pulse">LIVE</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((ev) => {
          const dir = ev.hauza_direction as keyof typeof DIR_CONFIG | null;
          const cfg = dir && DIR_CONFIG[dir] ? DIR_CONFIG[dir] : DIR_CONFIG.WAIT;
          const Icon = cfg.icon;

          return (
            <Card
              key={ev.id}
              className={`relative overflow-hidden bg-gradient-to-br ${cfg.gradient} ${cfg.border} ${cfg.shadow} cursor-pointer transition-all hover:scale-[1.01]`}
              onClick={() => navigate(`/chart/${ev.instrument}`)}
            >
              {cfg.pulse && (
                <div className="absolute top-3 right-3">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dir === "BUY" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${dir === "BUY" ? "bg-emerald-500" : "bg-red-500"}`} />
                  </span>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-background/40 ${cfg.text}`}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-extrabold text-foreground">{ev.event_name}</span>
                      <Badge variant="outline" className="text-[10px] font-bold border-destructive/40 text-destructive">{ev.currency}</Badge>
                      <Badge variant="outline" className="text-[10px] font-bold">{ev.instrument}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{ev.event_date} {ev.event_time_utc ? `• ${ev.event_time_utc} UTC` : ""}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Botvio Direction Button */}
                {dir && dir !== "WAIT" && (
                  <div className={`rounded-xl p-3 bg-gradient-to-r ${dir === "BUY" ? "from-emerald-500/20 to-emerald-500/5" : "from-red-500/20 to-red-500/5"} border ${dir === "BUY" ? "border-emerald-500/30" : "border-red-500/30"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-5 w-5 ${cfg.text}`} />
                      <span className={`text-base font-extrabold ${cfg.text}`}>
                        Botvio Signal: {dir} {ev.instrument}
                      </span>
                      {ev.hauza_confidence && (
                        <Badge className={`ml-auto text-xs ${dir === "BUY" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                          {ev.hauza_confidence}% Confidence
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-background/30 rounded-lg p-2 text-center">
                        <div className="text-muted-foreground">Entry</div>
                        <div className="font-mono font-bold text-foreground">{formatPrice(ev.hauza_entry_price)}</div>
                      </div>
                      <div className="bg-background/30 rounded-lg p-2 text-center">
                        <div className="text-muted-foreground">Stop Loss</div>
                        <div className="font-mono font-bold text-destructive">{formatPrice(ev.hauza_stop_loss)}</div>
                      </div>
                      <div className="bg-background/30 rounded-lg p-2 text-center">
                        <div className="text-muted-foreground">TP 1 / TP 2</div>
                        <div className="font-mono font-bold text-emerald-400">
                          {formatPrice(ev.hauza_take_profit_1)} / {formatPrice(ev.hauza_take_profit_2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dir === "WAIT" && (
                  <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-center">
                    <Pause className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                    <span className="text-sm font-bold text-amber-400">Waiting for data release — No entry yet</span>
                  </div>
                )}

                {/* Previous Performance */}
                {(ev.previous_value || ev.previous_performance) && (
                  <div className="rounded-lg bg-background/40 border border-border/50 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Previous Performance
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {ev.previous_value && (
                        <span>Previous: <span className="font-mono font-bold text-foreground">{ev.previous_value}</span></span>
                      )}
                      {ev.forecast && (
                        <span>Forecast: <span className="font-mono font-bold text-foreground">{ev.forecast}</span></span>
                      )}
                      {ev.actual_value && (
                        <span>Actual: <span className="font-mono font-bold text-primary">{ev.actual_value}</span></span>
                      )}
                    </div>
                    {ev.previous_direction && (
                      <div className="text-xs text-muted-foreground">
                        Last release moved {ev.instrument}: <span className={`font-bold ${ev.previous_direction === "UP" ? "text-emerald-400" : "text-red-400"}`}>{ev.previous_direction}</span>
                        {ev.previous_result && <span> — {ev.previous_result}</span>}
                      </div>
                    )}
                    {ev.previous_performance && (
                      <div className="text-xs text-muted-foreground">{ev.previous_performance}</div>
                    )}
                  </div>
                )}

                {/* Fundamentals & Technicals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ev.fundamentals_summary && (
                    <div className="rounded-lg bg-background/40 border border-border/50 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                        <BookOpen className="h-3 w-3" />
                        Fundamentals
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{ev.fundamentals_summary}</p>
                    </div>
                  )}
                  {ev.technical_summary && (
                    <div className="rounded-lg bg-background/40 border border-border/50 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                        <Activity className="h-3 w-3" />
                        Technical Analysis
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{ev.technical_summary}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
