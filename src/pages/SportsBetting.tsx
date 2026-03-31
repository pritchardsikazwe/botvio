import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Trophy, Target, Upload, TrendingUp, TrendingDown, Clock, Activity,
  CheckCircle, XCircle, Loader2, Goal, BarChart3, Percent
} from "lucide-react";

const MARKET_TYPES = [
  { value: "over_under", label: "Over/Under Goals" },
  { value: "corners", label: "Corners" },
  { value: "match_result", label: "Match Result (1X2)" },
  { value: "btts", label: "Both Teams to Score" },
];

const STRATEGIES: Record<string, { name: string; description: string; tip: string }> = {
  over_under: {
    name: "Over/Under Goals Strategy",
    description: "Analyze team scoring averages, head-to-head records, and league trends.",
    tip: "Look for teams averaging 3+ goals combined in last 5 matches for Over 2.5. Under 2.5 works best in defensive leagues.",
  },
  corners: {
    name: "Corners Strategy",
    description: "Track teams' corner averages, attacking style, and set-piece efficiency.",
    tip: "Teams pressing high (e.g. Man City, Liverpool) generate 6+ corners per match. Use Over 9.5 Total Corners for high-press matchups.",
  },
  match_result: {
    name: "Match Result (1X2) Strategy",
    description: "Use home/away form, league position, and motivation to predict outcomes.",
    tip: "Home win in top-3 vs bottom-3 matchups hits ~68%. Avoid derby matches — they're unpredictable.",
  },
  btts: {
    name: "Both Teams to Score Strategy",
    description: "Focus on teams with leaky defenses and consistent attack.",
    tip: "BTTS Yes hits ~62% when both teams concede in 60%+ of their recent matches. Avoid teams with top-5 clean sheet records.",
  },
};

const SportsBetting = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeMarket, setActiveMarket] = useState("over_under");
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    match_name: "",
    league: "",
    market_type: "over_under",
    prediction: "",
    odds: "",
    stake: "",
    strategy_notes: "",
    match_date: "",
  });

  // Fetch fixtures
  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ["football-fixtures"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      const { data, error } = await supabase.functions.invoke("football-fixtures", {
        body: { action: "fixtures", dateFrom: today, dateTo: nextWeek },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user bet slips
  const { data: betSlips } = useQuery({
    queryKey: ["bet-slips", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bet_slips")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Stats
  const stats = betSlips
    ? {
        total: betSlips.length,
        wins: betSlips.filter((b: any) => b.result === "won").length,
        losses: betSlips.filter((b: any) => b.result === "lost").length,
        pending: betSlips.filter((b: any) => b.result === "pending").length,
        winRate:
          betSlips.filter((b: any) => b.result !== "pending").length > 0
            ? Math.round(
                (betSlips.filter((b: any) => b.result === "won").length /
                  betSlips.filter((b: any) => b.result !== "pending").length) *
                  100
              )
            : 0,
        profit: betSlips.reduce((sum: number, b: any) => sum + (b.profit_loss || 0), 0),
      }
    : { total: 0, wins: 0, losses: 0, pending: 0, winRate: 0, profit: 0 };

  // Upload screenshot
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("bet-slips").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error("Upload failed");
      return;
    }
    const { data: urlData } = supabase.storage.from("bet-slips").getPublicUrl(path);
    setScreenshotUrl(urlData.publicUrl);
    toast.success("Screenshot uploaded!");
  };

  // Submit bet slip
  const submitMutation = useMutation({
    mutationFn: async (url?: string | undefined) => {
      if (!user) throw new Error("Login required");
      const { error } = await supabase.from("bet_slips").insert({
        user_id: user.id,
        match_name: form.match_name,
        league: form.league || null,
        market_type: form.market_type,
        prediction: form.prediction,
        odds: form.odds ? parseFloat(form.odds) : null,
        stake: form.stake ? parseFloat(form.stake) : null,
        strategy_notes: form.strategy_notes || null,
        match_date: form.match_date || null,
        screenshot_url: url || screenshotUrl || null,
        result: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bet slip saved!");
      setForm({ match_name: "", league: "", market_type: "over_under", prediction: "", odds: "", stake: "", strategy_notes: "", match_date: "" });
      setScreenshotUrl(null);
      queryClient.invalidateQueries({ queryKey: ["bet-slips"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update result
  const updateResult = useMutation({
    mutationFn: async ({ id, result, profit_loss }: { id: string; result: string; profit_loss?: number }) => {
      const { error } = await supabase.from("bet_slips").update({ result, profit_loss }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Result updated");
      queryClient.invalidateQueries({ queryKey: ["bet-slips"] });
    },
  });

  const strategy = STRATEGIES[activeMarket];

  const matchList = fixtures?.matches?.slice(0, 20) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Sports Betting Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Football predictions, bet slip tracking & proven strategies
          </p>
        </div>

        {/* Stats Bar */}
        {user && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Bets", value: stats.total, icon: BarChart3, color: "text-primary" },
              { label: "Wins", value: stats.wins, icon: CheckCircle, color: "text-green-500" },
              { label: "Losses", value: stats.losses, icon: XCircle, color: "text-red-500" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
              { label: "Win Rate", value: `${stats.winRate}%`, icon: Percent, color: "text-blue-500" },
              { label: "P/L", value: `$${stats.profit.toFixed(2)}`, icon: TrendingUp, color: stats.profit >= 0 ? "text-green-500" : "text-red-500" },
            ].map((s) => (
              <Card key={s.label} className="glass-card">
                <CardContent className="p-4 text-center">
                  <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="fixtures" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="upload">Bet Slip</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* ===== FIXTURES TAB ===== */}
          <TabsContent value="fixtures" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" /> Upcoming Matches
                </CardTitle>
                <CardDescription>Next 7 days — tap a match to create a bet slip</CardDescription>
              </CardHeader>
              <CardContent>
                {fixturesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : matchList.length > 0 ? (
                  <div className="space-y-2">
                    {matchList.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            match_name: `${m.homeTeam?.shortName || m.homeTeam?.name} vs ${m.awayTeam?.shortName || m.awayTeam?.name}`,
                            league: m.competition?.name || "",
                            match_date: m.utcDate?.split("T")[0] || "",
                          }));
                          const el = document.querySelector('[data-value="upload"]');
                          if (el instanceof HTMLElement) el.click();
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {m.homeTeam?.shortName || m.homeTeam?.name} vs {m.awayTeam?.shortName || m.awayTeam?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.competition?.name} • {new Date(m.utcDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 shrink-0">
                          {m.status === "FINISHED"
                            ? `${m.score?.fullTime?.home ?? "?"}-${m.score?.fullTime?.away ?? "?"}`
                            : new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming fixtures found. Check back later.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== STRATEGY TAB ===== */}
          <TabsContent value="strategy" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {MARKET_TYPES.map((mt) => (
                <Button
                  key={mt.value}
                  variant={activeMarket === mt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveMarket(mt.value)}
                >
                  {mt.label}
                </Button>
              ))}
            </div>

            <Card className="glass-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {strategy.name}
                </CardTitle>
                <CardDescription>{strategy.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">💡 Pro Tip</p>
                  <p className="text-sm text-foreground">{strategy.tip}</p>
                </div>

                {activeMarket === "over_under" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Entry Checklist</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Both teams scored in 60%+ of last 10 matches",
                        "Combined goals average ≥ 2.8 per game",
                        "No key defensive players missing",
                        "Not a dead-rubber or end-of-season match",
                        "Odds ≥ 1.70 for Over 2.5",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeMarket === "corners" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Entry Checklist</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "At least one team averages 5+ corners/game",
                        "Match between attack-heavy teams (top-half table)",
                        "Check weather — windy conditions = more crosses = more corners",
                        "Use Over 9.5 corners as primary market",
                        "Minimum odds 1.80",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeMarket === "match_result" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Entry Checklist</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Home team in top 5, away team in bottom 5",
                        "Home team won 70%+ of home matches this season",
                        "No major injuries to key players",
                        "Avoid derby matches (high upset rate)",
                        "Minimum odds 1.50 for home win",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeMarket === "btts" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Entry Checklist</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Both teams conceded in 60%+ of their last 10 games",
                        "Both teams scored in 50%+ of H2H meetings",
                        "Neither team has a top-5 clean sheet record",
                        "Avoid heavy rain matches (low scoring)",
                        "Minimum odds 1.65 for BTTS Yes",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== UPLOAD BET SLIP TAB ===== */}
          <TabsContent value="upload" className="space-y-4">
            {!user ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Please sign in to track your bet slips</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" /> Submit Bet Slip
                  </CardTitle>
                  <CardDescription>Track your predictions & build your win history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Match *</Label>
                      <Input
                        placeholder="e.g. Arsenal vs Chelsea"
                        value={form.match_name}
                        onChange={(e) => setForm((f) => ({ ...f, match_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>League</Label>
                      <Input
                        placeholder="e.g. Premier League"
                        value={form.league}
                        onChange={(e) => setForm((f) => ({ ...f, league: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Market *</Label>
                      <Select value={form.market_type} onValueChange={(v) => setForm((f) => ({ ...f, market_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MARKET_TYPES.map((mt) => (
                            <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prediction *</Label>
                      <Input
                        placeholder="e.g. Over 2.5, Home Win, BTTS Yes"
                        value={form.prediction}
                        onChange={(e) => setForm((f) => ({ ...f, prediction: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Odds</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1.85"
                        value={form.odds}
                        onChange={(e) => setForm((f) => ({ ...f, odds: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Stake ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 10.00"
                        value={form.stake}
                        onChange={(e) => setForm((f) => ({ ...f, stake: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Match Date</Label>
                      <Input
                        type="date"
                        value={form.match_date}
                        onChange={(e) => setForm((f) => ({ ...f, match_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Strategy Notes</Label>
                    <Textarea
                      placeholder="Why you picked this bet..."
                      value={form.strategy_notes}
                      onChange={(e) => setForm((f) => ({ ...f, strategy_notes: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Screenshot (proof)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const url = await handleScreenshot(e);
                        if (url) submitMutation.mutate(url);
                      }}
                      disabled={uploading}
                    />
                    {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                  </div>

                  <Button
                    className="w-full"
                    disabled={!form.match_name || !form.prediction || submitMutation.isPending}
                    onClick={() => submitMutation.mutate(undefined)}
                  >
                    {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Bet Slip
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== HISTORY TAB ===== */}
          <TabsContent value="history" className="space-y-4">
            {!user ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Please sign in to view your history</p>
                </CardContent>
              </Card>
            ) : betSlips && betSlips.length > 0 ? (
              <div className="space-y-3">
                {betSlips.map((bet: any) => (
                  <Card key={bet.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{bet.match_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {bet.league} • {MARKET_TYPES.find((m) => m.value === bet.market_type)?.label}
                          </p>
                          <p className="text-sm mt-1">
                            <span className="font-medium">{bet.prediction}</span>
                            {bet.odds && <span className="text-muted-foreground"> @ {bet.odds}</span>}
                            {bet.stake && <span className="text-muted-foreground"> • ${bet.stake}</span>}
                          </p>
                          {bet.strategy_notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{bet.strategy_notes}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={bet.result === "won" ? "default" : bet.result === "lost" ? "destructive" : "secondary"}
                            className={bet.result === "won" ? "bg-green-600" : ""}
                          >
                            {bet.result === "won" ? "✅ Won" : bet.result === "lost" ? "❌ Lost" : "⏳ Pending"}
                          </Badge>
                          {bet.result === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-600"
                                onClick={() => {
                                  const pnl = bet.stake && bet.odds ? bet.stake * (bet.odds - 1) : 0;
                                  updateResult.mutate({ id: bet.id, result: "won", profit_loss: pnl });
                                }}
                              >
                                Won
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600"
                                onClick={() => {
                                  updateResult.mutate({ id: bet.id, result: "lost", profit_loss: -(bet.stake || 0) });
                                }}
                              >
                                Lost
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {bet.screenshot_url && (
                        <img
                          src={bet.screenshot_url}
                          alt="Bet slip"
                          className="mt-3 rounded-lg max-h-40 object-cover w-full"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No bet slips yet. Start tracking your predictions!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SportsBetting;
