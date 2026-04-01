import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
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
  Trophy, Target, Upload, TrendingUp, Clock, Activity,
  CheckCircle, XCircle, Loader2, Goal, BarChart3, Percent,
  Sparkles, Brain, Zap, ListChecks, Image as ImageIcon,
  Search, RefreshCw, Eye, Share2, MessageCircle, Facebook
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

const SLIP_SIZES = [
  { value: "3", label: "3 Teams" },
  { value: "6", label: "6 Teams" },
  { value: "10", label: "10 Teams" },
  { value: "20", label: "20 Teams" },
];

const SportsBetting = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeMarket, setActiveMarket] = useState("over_under");
  const [uploading, setUploading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Check sports betting access (VIP or manual grant or admin)
  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ["sports-betting-access", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_sports_betting_access", {
        _user_id: user!.id,
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
  });

  // Daily picks state
  const [slipSize, setSlipSize] = useState("3");
  const [slipMarket, setSlipMarket] = useState("mixed");
  const [slipType, setSlipType] = useState("combined");
  const [leagueFilter, setLeagueFilter] = useState("");
  const [dailyPicks, setDailyPicks] = useState<string | null>(null);
  const [generatingPicks, setGeneratingPicks] = useState(false);

  // Check slip state
  const [checkSlipUrl, setCheckSlipUrl] = useState<string | null>(null);
  const [checkUploading, setCheckUploading] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [selectedBetForCheck, setSelectedBetForCheck] = useState<string | null>(null);

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

  // Upload screenshot + AI analysis
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasAccess) { toast.error("VIP subscription required to upload bet slips"); return; }
    if (!e.target.files?.[0] || !user) return;
    setUploading(true);
    setAiAnalysis(null);
    const file = e.target.files[0];
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("bet-slips").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error("Upload failed");
      return;
    }
    const { data: urlData } = supabase.storage.from("bet-slips").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setScreenshotUrl(publicUrl);
    toast.success("Screenshot uploaded! Analyzing...");

    // Auto-trigger AI analysis
    runAiAnalysis(publicUrl);
  };

  const runAiAnalysis = async (imageUrl?: string) => {
    if (!hasAccess) { toast.error("VIP subscription required for AI analysis"); return; }
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-bet-slip", {
        body: {
          imageUrl: imageUrl || screenshotUrl,
          marketType: form.market_type,
          matchName: form.match_name,
          league: form.league,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiAnalysis(data.analysis);
      toast.success("AI analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate daily picks
  const generateDailyPicks = async () => {
    if (!hasAccess) { toast.error("VIP subscription required to generate daily picks"); return; }
    setGeneratingPicks(true);
    setDailyPicks(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-daily-slips", {
        body: { slipSize, marketType: slipMarket, slipType, leagueFilter: leagueFilter || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDailyPicks(data.picks);
      toast.success(`${slipSize}-team picks generated!`);
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGeneratingPicks(false);
    }
  };

  // Submit bet slip
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!hasAccess) throw new Error("VIP subscription required to submit bet slips");
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
        screenshot_url: screenshotUrl || null,
        result: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bet slip saved!");
      setForm({ match_name: "", league: "", market_type: "over_under", prediction: "", odds: "", stake: "", strategy_notes: "", match_date: "" });
      setScreenshotUrl(null);
      setAiAnalysis(null);
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

  // Render markdown-ish AI output
  const renderAiText = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ") || line.startsWith("**") && line.endsWith("**")) {
        return <h3 key={i} className="font-bold text-sm text-primary mt-3 mb-1">{line.replace(/[#*]/g, "").trim()}</h3>;
      }
      if (line.startsWith("### ")) {
        return <h4 key={i} className="font-semibold text-xs text-foreground mt-2 mb-1">{line.replace(/###\s?/g, "").trim()}</h4>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={i} className="text-xs text-muted-foreground ml-4 list-disc">{line.slice(2)}</li>;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-xs text-foreground/90 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />

      {!user ? (
        <main className="container mx-auto px-4 py-20 text-center space-y-4">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Sign in to access Sports Betting Hub</h1>
          <p className="text-muted-foreground">This feature requires an account.</p>
        </main>
      ) : (
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Upgrade Banner for non-subscribers */}
        {!accessLoading && !hasAccess && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex flex-col sm:flex-row items-center gap-3">
            <Trophy className="h-6 w-6 text-warning shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-sm">VIP Subscription Required</p>
              <p className="text-xs text-muted-foreground">
                Subscribe to VIP to generate daily picks, upload bet slips, and use AI analysis.
              </p>
            </div>
            <Button size="sm" onClick={() => window.location.href = "/billing"}>
              Upgrade to VIP
            </Button>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            Sports Betting Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-powered predictions, bet slip analysis & daily picks
          </p>
        </div>

        {/* Stats Bar */}
        {user && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: "Bets", value: stats.total, icon: BarChart3, color: "text-primary" },
              { label: "Wins", value: stats.wins, icon: CheckCircle, color: "text-green-500" },
              { label: "Losses", value: stats.losses, icon: XCircle, color: "text-red-500" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
              { label: "Win %", value: `${stats.winRate}%`, icon: Percent, color: "text-blue-500" },
              { label: "P/L", value: `$${stats.profit.toFixed(0)}`, icon: TrendingUp, color: stats.profit >= 0 ? "text-green-500" : "text-red-500" },
            ].map((s) => (
              <Card key={s.label} className="glass-card">
                <CardContent className="p-3 text-center">
                  <s.icon className={`h-4 w-4 mx-auto mb-0.5 ${s.color}`} />
                  <p className="text-base font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="fixtures" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="fixtures" className="text-[10px] px-1">Fixtures</TabsTrigger>
            <TabsTrigger value="picks" className="text-[10px] px-1">
              <Sparkles className="h-3 w-3 mr-0.5" />Picks
            </TabsTrigger>
            <TabsTrigger value="check" className="text-[10px] px-1">
              <Eye className="h-3 w-3 mr-0.5" />Check
            </TabsTrigger>
            <TabsTrigger value="strategy" className="text-[10px] px-1">Strategy</TabsTrigger>
            <TabsTrigger value="upload" className="text-[10px] px-1">Slip</TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] px-1">History</TabsTrigger>
          </TabsList>

          {/* ===== FIXTURES TAB ===== */}
          <TabsContent value="fixtures" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" /> Upcoming Matches
                </CardTitle>
                <CardDescription className="text-xs">Next 7 days — tap a match to create a bet slip</CardDescription>
              </CardHeader>
              <CardContent>
                {fixturesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : matchList.length > 0 ? (
                  <div className="space-y-2">
                    {matchList.map((m: any) => (
                      <button
                        key={m.id}
                        type="button"
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-primary/10 active:bg-primary/20 cursor-pointer transition-colors border border-transparent hover:border-primary/30 text-left"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            match_name: `${m.homeTeam?.shortName || m.homeTeam?.name} vs ${m.awayTeam?.shortName || m.awayTeam?.name}`,
                            league: m.competition?.name || "",
                            match_date: m.utcDate?.split("T")[0] || "",
                          }));
                          const el = document.querySelector('[data-value="upload"]');
                          if (el instanceof HTMLElement) el.click();
                          toast.success("Match added to slip — fill in your prediction!");
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
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {m.status === "FINISHED"
                              ? `${m.score?.fullTime?.home ?? "?"}-${m.score?.fullTime?.away ?? "?"}`
                              : new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Badge>
                          <span className="text-[10px] text-primary font-medium">Tap →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No upcoming fixtures found. Check back later.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== AI DAILY PICKS TAB ===== */}
          <TabsContent value="picks" className="space-y-4">
            <Card className="glass-card border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-primary" /> AI Daily Picks Generator
                </CardTitle>
                <CardDescription className="text-xs">
                  Get AI-recommended slips — corners, goals, BTTS, match results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Config row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Slip Size</Label>
                    <Select value={slipSize} onValueChange={setSlipSize}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SLIP_SIZES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Market</Label>
                    <Select value={slipMarket} onValueChange={setSlipMarket}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">Mixed (All)</SelectItem>
                        <SelectItem value="corners">Corners Only</SelectItem>
                        <SelectItem value="over_under">Goals Only</SelectItem>
                        <SelectItem value="btts">BTTS Only</SelectItem>
                        <SelectItem value="match_result">1X2 Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Slip Type</Label>
                    <Select value={slipType} onValueChange={setSlipType}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="combined">Accumulator</SelectItem>
                        <SelectItem value="single">Singles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "🥅 Corners Slip", size: "3", market: "corners", type: "combined", league: "" },
                    { label: "⚽ BTTS Slip", size: "6", market: "btts", type: "combined", league: "" },
                    { label: "🏆 Winners Slip", size: "3", market: "match_result", type: "combined", league: "" },
                    { label: "🇸🇦 Saudi League", size: "3", market: "mixed", type: "combined", league: "saudi|arabia|SPL|pro league" },
                    { label: "📊 10-Leg Multi", size: "10", market: "mixed", type: "combined", league: "" },
                    { label: "🎯 20-Leg Mega", size: "20", market: "mixed", type: "combined", league: "" },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => {
                        setSlipSize(preset.size);
                        setSlipMarket(preset.market);
                        setSlipType(preset.type);
                        setLeagueFilter(preset.league);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={generateDailyPicks}
                  disabled={generatingPicks}
                >
                  {generatingPicks ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating {slipSize}-team picks...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate {slipSize}-Team {slipType === "combined" ? "Accumulator" : "Singles"}
                    </>
                  )}
                </Button>

                {/* AI Picks Result */}
                {dailyPicks && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-primary/20 space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm text-primary">AI Generated Picks</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {renderAiText(dailyPicks)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CHECK SLIP TAB ===== */}
          <TabsContent value="check" className="space-y-4">
            <Card className="glass-card border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-5 w-5 text-primary" /> Live Slip Checker
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload your bet slip or select from history — see live corners, goals, results & win/lose status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload slip to check */}
                <div className="p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-center">
                  <Eye className="h-8 w-8 mx-auto text-primary/60 mb-2" />
                  <Label className="text-xs font-medium text-primary">Upload Bet Slip to Check Results</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="mt-2"
                    disabled={checkUploading || !hasAccess}
                    onChange={async (e) => {
                      if (!hasAccess) { toast.error("VIP subscription required"); return; }
                      if (!e.target.files?.[0]) return;
                      setCheckUploading(true);
                      const file = e.target.files[0];
                      const path = `checks/${Date.now()}_${file.name}`;
                      const { error } = await supabase.storage.from("bet-slips").upload(path, file);
                      setCheckUploading(false);
                      if (error) { toast.error("Upload failed"); return; }
                      const { data: urlData } = supabase.storage.from("bet-slips").getPublicUrl(path);
                      setCheckSlipUrl(urlData.publicUrl);
                      toast.success("Slip uploaded! Checking...");
                      // Auto-check
                      setChecking(true);
                      setCheckResult(null);
                      try {
                        const { data, error: fnErr } = await supabase.functions.invoke("check-bet-slip", {
                          body: { imageUrl: urlData.publicUrl },
                        });
                        if (fnErr) throw fnErr;
                        if (data?.error) throw new Error(data.error);
                        setCheckResult(data.result);
                      } catch (err: any) {
                        toast.error(err.message || "Check failed");
                      } finally {
                        setChecking(false);
                      }
                    }}
                  />
                  {checkUploading && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                    </p>
                  )}
                {checkSlipUrl && (
                    <>
                      <img src={checkSlipUrl} alt="Checking slip" className="mt-3 rounded-lg max-h-40 mx-auto object-contain" />
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={async () => {
                          setChecking(true);
                          setCheckResult(null);
                          try {
                            const { data, error: fnErr } = await supabase.functions.invoke("check-bet-slip", {
                              body: { imageUrl: checkSlipUrl },
                            });
                            if (fnErr) throw fnErr;
                            if (data?.error) throw new Error(data.error);
                            setCheckResult(data.result);
                          } catch (err: any) {
                            toast.error(err.message || "Check failed");
                          } finally {
                            setChecking(false);
                          }
                        }}
                        disabled={checking}
                      >
                        {checking ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking...</>
                        ) : (
                          <><Search className="h-4 w-4 mr-2" /> Get Results</>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Or check from history */}
                {user && betSlips && betSlips.filter((b: any) => b.result === "pending").length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Or check a pending slip from your history:</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {betSlips
                        .filter((b: any) => b.result === "pending")
                        .map((bet: any) => (
                          <div
                            key={bet.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedBetForCheck === bet.id ? "bg-primary/20 border border-primary/40" : "bg-muted/30 hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedBetForCheck(bet.id === selectedBetForCheck ? null : bet.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{bet.match_name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {bet.league} • {MARKET_TYPES.find((m) => m.value === bet.market_type)?.label} • {bet.prediction}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">⏳ Pending</Badge>
                          </div>
                        ))}
                    </div>

                    {selectedBetForCheck && (
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={async () => {
                          const bet = betSlips.find((b: any) => b.id === selectedBetForCheck);
                          if (!bet) return;
                          setChecking(true);
                          setCheckResult(null);
                          try {
                            const { data, error: fnErr } = await supabase.functions.invoke("check-bet-slip", {
                              body: {
                                imageUrl: bet.screenshot_url || null,
                                matches: [{
                                  match_name: bet.match_name,
                                  market_type: bet.market_type,
                                  prediction: bet.prediction,
                                  league: bet.league,
                                }],
                                marketType: bet.market_type,
                              },
                            });
                            if (fnErr) throw fnErr;
                            if (data?.error) throw new Error(data.error);
                            setCheckResult(data.result);
                          } catch (err: any) {
                            toast.error(err.message || "Check failed");
                          } finally {
                            setChecking(false);
                          }
                        }}
                        disabled={checking}
                      >
                        {checking ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking...</>
                        ) : (
                          <><Search className="h-4 w-4 mr-2" /> Check Selected Slip</>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Checking indicator */}
                {checking && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-primary/20 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Checking live scores, corners, goals...</p>
                  </div>
                )}

                {/* Check Result */}
                {checkResult && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-primary/20 space-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm text-primary">Live Status Report</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            const shareText = `🏆 Bet Slip Results\n\n${checkResult}\n\nPowered by Botvio Sports Hub`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/sports-betting')}&quote=${encodeURIComponent('🏆 Check my bet slip results on Botvio!')}`, '_blank');
                          }}
                        >
                          <Facebook className="h-3 w-3 mr-1" /> Share
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={async () => {
                            setChecking(true);
                            try {
                              const body: any = {};
                              if (checkSlipUrl) {
                                body.imageUrl = checkSlipUrl;
                              } else if (selectedBetForCheck && betSlips) {
                                const bet = betSlips.find((b: any) => b.id === selectedBetForCheck);
                                if (bet) {
                                  body.imageUrl = bet.screenshot_url || null;
                                  body.matches = [{
                                    match_name: bet.match_name,
                                    market_type: bet.market_type,
                                    prediction: bet.prediction,
                                    league: bet.league,
                                  }];
                                  body.marketType = bet.market_type;
                                }
                              }
                              const { data, error: fnErr } = await supabase.functions.invoke("check-bet-slip", { body });
                              if (fnErr) throw fnErr;
                              if (data?.error) throw new Error(data.error);
                              setCheckResult(data.result);
                            } catch (err: any) {
                              toast.error(err.message || "Refresh failed");
                            } finally {
                              setChecking(false);
                            }
                          }}
                          disabled={checking}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${checking ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto pr-1">
                      {renderAiText(checkResult)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  {strategy.name}
                </CardTitle>
                <CardDescription className="text-xs">{strategy.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1">💡 Pro Tip</p>
                  <p className="text-xs text-foreground">{strategy.tip}</p>
                </div>

                {activeMarket === "over_under" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Entry Checklist</h4>
                    <ul className="space-y-2 text-xs">
                      {[
                        "Both teams scored in 60%+ of last 10 matches",
                        "Combined goals average ≥ 2.8 per game",
                        "No key defensive players missing",
                        "Not a dead-rubber or end-of-season match",
                        "Odds ≥ 1.70 for Over 2.5",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeMarket === "corners" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Corners Strategy — 4+ / 7+ / 12+</h4>
                    <ul className="space-y-2 text-xs">
                      {[
                        "Over 4.5 corners: Almost any match qualifies — use as safe single",
                        "Over 7.5 corners: At least one team averages 5+ corners/game",
                        "Over 9.5 corners: Both teams in top-half, attack-heavy styles",
                        "Over 12.5 corners: Only when BOTH teams average 6+ corners AND playing aggressively",
                        "Check weather — windy = more crosses = more corners",
                        "Minimum odds 1.80 for 9.5+ corners",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeMarket === "match_result" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Entry Checklist</h4>
                    <ul className="space-y-2 text-xs">
                      {[
                        "Home team in top 5, away team in bottom 5",
                        "Home team won 70%+ of home matches this season",
                        "No major injuries to key players",
                        "Avoid derby matches (high upset rate)",
                        "Minimum odds 1.50 for home win",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeMarket === "btts" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Entry Checklist</h4>
                    <ul className="space-y-2 text-xs">
                      {[
                        "Both teams conceded in 60%+ of their last 10 games",
                        "Both teams scored in 50%+ of H2H meetings",
                        "Neither team has a top-5 clean sheet record",
                        "Avoid heavy rain matches (low scoring)",
                        "Minimum odds 1.65 for BTTS Yes",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Goal className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
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
                  <p className="text-muted-foreground text-sm">Please sign in to track your bet slips</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Upload className="h-5 w-5" /> Submit Bet Slip
                    </CardTitle>
                    <CardDescription className="text-xs">Upload your slip for AI analysis — corners, goals, BTTS & match insights</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Screenshot upload — prominent */}
                    <div className="p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-center">
                      <ImageIcon className="h-8 w-8 mx-auto text-primary/60 mb-2" />
                      <Label className="text-xs font-medium text-primary cursor-pointer">
                        Upload Bet Slip Screenshot for AI Analysis
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshot}
                        disabled={uploading}
                        className="mt-2"
                      />
                      {uploading && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                        </p>
                      )}
                      {screenshotUrl && (
                        <img src={screenshotUrl} alt="Bet slip" className="mt-3 rounded-lg max-h-48 mx-auto object-contain" />
                      )}
                    </div>

                    {/* AI Analysis Result */}
                    {analyzing && (
                      <div className="p-4 rounded-xl bg-muted/40 border border-primary/20 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                        <p className="text-xs text-muted-foreground">Analyzing your slip — corners, goals, BTTS, winners...</p>
                      </div>
                    )}

                    {aiAnalysis && (
                      <div className="p-4 rounded-xl bg-muted/40 border border-primary/20 space-y-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm text-primary">AI Analysis</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => runAiAnalysis()}
                            disabled={analyzing}
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Re-analyze
                          </Button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto pr-1">
                          {renderAiText(aiAnalysis)}
                        </div>
                      </div>
                    )}

                    {/* Form fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Match *</Label>
                        <Input
                          placeholder="e.g. Arsenal vs Chelsea"
                          value={form.match_name}
                          onChange={(e) => setForm((f) => ({ ...f, match_name: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">League</Label>
                        <Input
                          placeholder="e.g. Premier League"
                          value={form.league}
                          onChange={(e) => setForm((f) => ({ ...f, league: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Market *</Label>
                        <Select value={form.market_type} onValueChange={(v) => setForm((f) => ({ ...f, market_type: v }))}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MARKET_TYPES.map((mt) => (
                              <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Prediction *</Label>
                        <Input
                          placeholder="e.g. Over 2.5, BTTS Yes, Home Win"
                          value={form.prediction}
                          onChange={(e) => setForm((f) => ({ ...f, prediction: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 1.85"
                          value={form.odds}
                          onChange={(e) => setForm((f) => ({ ...f, odds: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Stake ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 10.00"
                          value={form.stake}
                          onChange={(e) => setForm((f) => ({ ...f, stake: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Match Date</Label>
                        <Input
                          type="date"
                          value={form.match_date}
                          onChange={(e) => setForm((f) => ({ ...f, match_date: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Manual AI analysis button when no screenshot */}
                    {!screenshotUrl && form.match_name && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => runAiAnalysis()}
                        disabled={analyzing || !form.match_name}
                      >
                        {analyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Brain className="h-4 w-4 mr-2" />
                        )}
                        Analyze This Match (AI)
                      </Button>
                    )}

                    <div>
                      <Label className="text-xs">Strategy Notes</Label>
                      <Textarea
                        placeholder="Why you picked this bet..."
                        value={form.strategy_notes}
                        onChange={(e) => setForm((f) => ({ ...f, strategy_notes: e.target.value }))}
                        className="min-h-[60px]"
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={!form.match_name || !form.prediction || submitMutation.isPending}
                      onClick={() => submitMutation.mutate()}
                    >
                      {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Bet Slip
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ===== HISTORY TAB ===== */}
          <TabsContent value="history" className="space-y-4">
            {!user ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">Please sign in to view your history</p>
                </CardContent>
              </Card>
            ) : betSlips && betSlips.length > 0 ? (
              <div className="space-y-3">
                {betSlips.map((bet: any) => (
                  <Card key={bet.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{bet.match_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {bet.league} • {MARKET_TYPES.find((m) => m.value === bet.market_type)?.label}
                          </p>
                          <p className="text-xs mt-1">
                            <span className="font-medium">{bet.prediction}</span>
                            {bet.odds && <span className="text-muted-foreground"> @ {bet.odds}</span>}
                            {bet.stake && <span className="text-muted-foreground"> • ${bet.stake}</span>}
                          </p>
                          {bet.strategy_notes && (
                            <p className="text-[10px] text-muted-foreground mt-1 italic">"{bet.strategy_notes}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={bet.result === "won" ? "default" : bet.result === "lost" ? "destructive" : "secondary"}
                            className={bet.result === "won" ? "bg-green-600 text-xs" : "text-xs"}
                          >
                            {bet.result === "won" ? "✅ Won" : bet.result === "lost" ? "❌ Lost" : "⏳ Pending"}
                          </Badge>
                          {bet.result === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] text-green-600 px-2"
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
                                className="h-6 text-[10px] text-red-600 px-2"
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
                          className="mt-3 rounded-lg max-h-32 object-cover w-full"
                        />
                      )}
                      {/* Share buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] flex-1"
                          onClick={() => {
                            const text = `🏆 My Bet Slip\n\n⚽ ${bet.match_name}\n📋 ${bet.league || 'N/A'}\n🎯 ${bet.prediction}${bet.odds ? ` @ ${bet.odds}` : ''}${bet.result !== 'pending' ? `\n${bet.result === 'won' ? '✅ WON' : '❌ LOST'}` : '\n⏳ Pending'}\n\nPowered by Botvio Sports Hub`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] flex-1"
                          onClick={() => {
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/sports-betting')}&quote=${encodeURIComponent(`🏆 ${bet.match_name} — ${bet.prediction}${bet.result !== 'pending' ? ` ${bet.result === 'won' ? '✅ WON' : '❌ LOST'}` : ''}`)}`, '_blank');
                          }}
                        >
                          <Facebook className="h-3 w-3 mr-1" /> Facebook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            const text = `⚽ ${bet.match_name} | ${bet.prediction}${bet.odds ? ` @ ${bet.odds}` : ''}${bet.result !== 'pending' ? ` — ${bet.result === 'won' ? '✅ WON' : '❌ LOST'}` : ''}`;
                            navigator.clipboard.writeText(text);
                            toast.success("Copied to clipboard!");
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">No bet slips yet. Start tracking your predictions!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      )}
    </div>
  );
};

export default SportsBetting;
