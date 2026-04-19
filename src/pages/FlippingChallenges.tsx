import { useState } from "react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  Shield, Target, Trophy, Brain, CalendarDays, CheckCircle2,
  TrendingUp, AlertTriangle, BarChart3, BookOpen, Clock3, Wallet,
  Flame, Star, Zap, Lock, Users, ArrowRight, Sparkles, Medal,
  ChevronRight, Eye, LineChart, CircleDollarSign, Timer, Swords, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const challengeCards = [
  { title: "Beginner Flip", duration: "7 days", durationDays: 7, setup: "$10 → $50", start: 10, target: 50, risk: "Low", trades: "Max 2/day", focus: "Discipline first", icon: Shield, color: "border-primary/40 bg-primary/5", popular: false },
  { title: "Smart Money", duration: "14 days", durationDays: 14, setup: "$20 → $100", start: 20, target: 100, risk: "Medium", trades: "Structure + liquidity", focus: "Confirmation entries", icon: Brain, color: "border-warning/40 bg-warning/5", popular: true },
  { title: "Boom/Crash", duration: "14 days", durationDays: 14, setup: "$20 → $120", start: 20, target: 120, risk: "Strict", trades: "Spike hunting only", focus: "No revenge trading", icon: Zap, color: "border-destructive/40 bg-destructive/5", popular: false },
  { title: "Binary Discipline", duration: "30 days", durationDays: 30, setup: "$50 → $300", start: 50, target: 300, risk: "Controlled", trades: "5–10 signals/day", focus: "Expiry precision", icon: Target, color: "border-success/40 bg-success/5", popular: false },
  { title: "Weekly Sprint", duration: "7 days", durationDays: 7, setup: "$15 → $60", start: 15, target: 60, risk: "Low-Med", trades: "3/day max", focus: "Quick wins", icon: Timer, color: "border-blue-500/40 bg-blue-500/5", popular: false },
  { title: "Gold Scalper", duration: "14 days", durationDays: 14, setup: "$30 → $150", start: 30, target: 150, risk: "Medium", trades: "XAU/USD only", focus: "Session timing", icon: CircleDollarSign, color: "border-yellow-500/40 bg-yellow-500/5", popular: true },
];

const dailyChecklist = [
  { task: "Read market bias before opening any position", icon: Eye },
  { task: "Wait for Botvio signal or valid strategy confirmation", icon: Sparkles },
  { task: "Confirm entry using structure, liquidity, or pattern", icon: Target },
  { task: "Set stop loss and take profit before entry", icon: Shield },
  { task: "Log the result and note your emotional state", icon: BookOpen },
  { task: "Stop when daily target or loss limit is hit", icon: Lock },
];

const leaderboard = [
  { rank: 1, name: "TraderKing_ZM", metric: "+42% growth", score: 96, badge: "🏆", label: "Top flipper" },
  { rank: 2, name: "GoldHunter_KE", metric: "+38% growth", score: 94, badge: "🥈", label: "Discipline master" },
  { rank: 3, name: "SmartMoney_NG", metric: "+35% growth", score: 91, badge: "🥉", label: "Consistency pro" },
  { rank: 4, name: "BoomCrash_TZ", metric: "+29% growth", score: 88, badge: "⭐", label: "Spike hunter" },
  { rank: 5, name: "BinaryPro_GH", metric: "+26% growth", score: 85, badge: "🔥", label: "Weekly champion" },
];

const aiCoachMessages = [
  { msg: "Your account is small — keep risk tight and skip wide-stop setups today.", type: "warning" as const },
  { msg: "GBP/USD showing clean structure on M15. Best setup for your challenge today.", type: "tip" as const },
  { msg: "You've used 1 of 2 daily trades. Save the second for London session.", type: "info" as const },
  { msg: "Yesterday you entered too early 2 times. Wait for candle close confirmation.", type: "review" as const },
];

const strategyGuidance = [
  { title: "Entry Rules", items: ["Wait for Break of Structure (BOS)", "Confirm with order block or FVG", "Enter on retest, not breakout"] },
  { title: "Confirmation Rules", items: ["RSI divergence on M5/M15", "Volume spike at key level", "Session overlap (London/NY)"] },
  { title: "When NOT to Trade", items: ["Before high-impact news (30 min)", "After hitting daily loss limit", "During low-volume Asian session"] },
  { title: "Small Account Tips", items: ["Use 0.01 lot or $1 stake max", "TP: 10-20 pips, SL: 5-10 pips", "Risk max 2% per trade"] },
];

export default function FlippingChallenges() {
  const [activeTab, setActiveTab] = useState("challenges");
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [startingChallenge, setStartingChallenge] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: activeChallenge, refetch: refetchChallenge } = useQuery({
    queryKey: ["my-active-challenge", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("flipping_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const startChallenge = async (card: typeof challengeCards[0]) => {
    if (!user) {
      toast({ title: "Sign in to join a challenge", variant: "destructive" });
      return;
    }
    if (activeChallenge) {
      toast({ title: "You already have an active challenge", description: "Complete or end your current challenge first.", variant: "destructive" });
      return;
    }
    setStartingChallenge(card.title);
    const { error } = await supabase.from("flipping_challenges").insert({
      user_id: user.id,
      challenge_type: card.title.toLowerCase().replace(/\s+/g, "_"),
      title: card.title,
      duration_days: card.durationDays,
      starting_balance: card.start,
      target_balance: card.target,
      current_balance: card.start,
    });
    setStartingChallenge(null);
    if (error) {
      toast({ title: "Failed to start challenge", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${card.title} Challenge Started! 🔥`, description: `Target: ${card.setup} in ${card.duration}` });
      refetchChallenge();
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="flippingChallenges"
        title="Botvio Flipping Challenges — Disciplined Account Growth"
        description="Join 7-day, 14-day, and 30-day growth challenges with rules, AI coaching, progress tracking, and leaderboards."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card animate-fade-in">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/15 text-primary border-primary/30 animate-pulse">
                  <Flame className="h-3 w-3 mr-1" /> Discipline-led growth
                </Badge>
                <Badge variant="outline" className="text-[10px]">Season 1 Active</Badge>
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-foreground lg:text-5xl">
                Turn small accounts into <span className="text-primary">disciplined growth</span> challenges.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground lg:text-lg">
                Join structured 7-day, 14-day, or 30-day challenges. Rules, AI coaching, progress tracking, and a leaderboard that rewards discipline — not gambling.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="font-bold">
                  <Swords className="h-4 w-4 mr-2" /> Join a Challenge
                </Button>
                <Button variant="outline" className="font-bold" asChild>
                  <Link to="/signals">View Signals</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 2,400+ traders joined</span>
                <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> 180+ challenges completed</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> 4.8/5 rating</span>
              </div>
            </div>

            <Card className="border-primary/20 bg-secondary animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Wallet className="h-5 w-5 text-primary" />
                  Live Challenge Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const ac = activeChallenge;
                  const starting = ac ? ac.starting_balance : 20;
                  const target = ac ? ac.target_balance : 100;
                  const current = ac ? ac.current_balance : starting;
                  const dayNum = ac ? ac.day_number : 0;
                  const duration = ac ? ac.duration_days : 14;
                  const progress = target > starting ? Math.min(100, Math.round(((current - starting) / (target - starting)) * 100)) : 0;
                  const winRate = ac ? (ac.total_trades > 0 ? Math.round((ac.winning_trades / ac.total_trades) * 100) : 0) : 0;
                  const discipline = ac ? ac.discipline_score : 0;

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Starting", value: `$${starting}`, color: "" },
                          { label: "Target", value: `$${target}`, color: "text-success" },
                          { label: "Current", value: `$${current.toFixed(2)}`, color: "text-primary" },
                          { label: "Day", value: `${dayNum} / ${duration}`, color: "" },
                        ].map(s => (
                          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className={`mt-1 text-xl font-bold text-foreground ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Challenge progress</span>
                          <span className="font-bold text-primary">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-success/10 p-2">
                          <p className="text-lg font-bold text-success">{winRate}%</p>
                          <p className="text-[10px] text-muted-foreground">Win Rate</p>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-2">
                          <p className="text-lg font-bold text-primary">{discipline}%</p>
                          <p className="text-[10px] text-muted-foreground">Discipline</p>
                        </div>
                        <div className="rounded-lg bg-warning/10 p-2">
                          <p className="text-lg font-bold text-warning">{ac ? ac.total_trades : 0}</p>
                          <p className="text-[10px] text-muted-foreground">Trades</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-foreground flex items-start gap-2">
                        <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground text-xs">
                          {ac ? `AI Coach: Day ${dayNum} of ${duration}. Balance at $${current.toFixed(2)} — ${current >= target ? "Target reached! 🎉" : current > starting ? "On track! Stay disciplined." : "Stay focused. Follow your strategy."}` : "AI Coach: Start a challenge below to begin tracking."}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="challenges" className="text-xs"><Target className="h-3 w-3 mr-1" /> Challenges</TabsTrigger>
            <TabsTrigger value="rules" className="text-xs"><Shield className="h-3 w-3 mr-1" /> Rules</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Daily Tasks</TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs"><Brain className="h-3 w-3 mr-1" /> Strategy</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs"><BarChart3 className="h-3 w-3 mr-1" /> Progress</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs"><Trophy className="h-3 w-3 mr-1" /> Leaderboard</TabsTrigger>
            <TabsTrigger value="journal" className="text-xs"><BookOpen className="h-3 w-3 mr-1" /> Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Choose your challenge</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {challengeCards.map((c) => (
                <Card key={c.title} className={`border ${c.color} relative overflow-hidden hover:scale-[1.02] transition-transform`}>
                  {c.popular && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-warning text-warning-foreground text-[9px]"><Star className="h-2.5 w-2.5 mr-0.5" /> Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                      <c.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg text-foreground">{c.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="w-fit border-primary/30 text-primary">{c.duration}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="rounded-xl border border-border bg-secondary p-3 text-foreground font-bold text-lg text-center">
                      {c.setup}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground"><Shield className="h-3 w-3" /> {c.risk} risk</div>
                      <div className="flex items-center gap-1 text-muted-foreground"><BarChart3 className="h-3 w-3" /> {c.trades}</div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Focus: {c.focus}</p>
                    <Button
                      className="w-full font-bold"
                      disabled={startingChallenge === c.title || !!activeChallenge}
                      onClick={() => startChallenge(c)}
                    >
                      {startingChallenge === c.title ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</>
                      ) : activeChallenge ? (
                        <><Lock className="h-4 w-4 mr-2" /> Challenge Active</>
                      ) : (
                        <><Swords className="h-4 w-4 mr-2" /> Join Challenge</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="animate-fade-in">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground"><Shield className="h-5 w-5 text-primary" /> Challenge Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { rule: "Max 2-3 trades per day", icon: BarChart3 },
                    { rule: "Risk max 2% per trade", icon: Shield },
                    { rule: "Daily stop loss: -5% of balance", icon: AlertTriangle },
                    { rule: "Daily target: +3-5% of balance", icon: Target },
                    { rule: "Only trade during approved sessions", icon: Clock3 },
                    { rule: "Use only approved strategies", icon: Brain },
                    { rule: "No revenge trading after a loss", icon: Lock },
                    { rule: "Log every trade in journal", icon: BookOpen },
                  ].map((item) => (
                    <div key={item.rule} className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-3">
                      <item.icon className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm text-foreground">{item.rule}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Protection Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Challenge locks automatically when daily loss limit is hit",
                    "Warning triggers when you've opened 2+ trades in 30 minutes",
                    "AI will suggest 'skip this setup' for low-probability entries",
                    "Score penalized for overtrading, even if profitable",
                    "No trading 15 min before/after high-impact news",
                    "Account protection: challenge pauses if balance drops 15%+",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-card p-3">
                      <Lock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="animate-fade-in">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Today's Checklist
                  <Badge variant="outline" className="ml-auto text-xs">{checkedItems.size}/{dailyChecklist.length} done</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dailyChecklist.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                      checkedItems.has(idx) ? "border-success/40 bg-success/10" : "border-border bg-secondary hover:border-primary/30"
                    }`}
                  >
                    <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 transition-colors ${checkedItems.has(idx) ? "text-success" : "text-muted-foreground"}`} />
                    <div>
                      <p className={`text-sm font-medium ${checkedItems.has(idx) ? "text-success line-through" : "text-foreground"}`}>{item.task}</p>
                    </div>
                    <item.icon className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                  </button>
                ))}
                <Progress value={(checkedItems.size / dailyChecklist.length) * 100} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="animate-fade-in space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {strategyGuidance.map((sg) => (
                <Card key={sg.title} className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> {sg.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sg.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-foreground">
                        <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Coach Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiCoachMessages.map((m, i) => (
                  <div key={i} className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${
                    m.type === "warning" ? "border-warning/30 bg-warning/10" :
                    m.type === "tip" ? "border-success/30 bg-success/10" :
                    m.type === "review" ? "border-destructive/30 bg-destructive/10" :
                    "border-primary/30 bg-primary/10"
                  }`}>
                    <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-foreground text-xs">{m.msg}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="animate-fade-in">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground"><BarChart3 className="h-5 w-5 text-primary" /> Progress Tracker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Current Balance", value: "$62.40", color: "text-primary" },
                      { label: "Win Rate", value: "71%", color: "text-success" },
                      { label: "Remaining", value: "$37.60", color: "text-warning" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border border-border bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Total Profit", value: "+$42.40", color: "text-success" },
                      { label: "Total Loss", value: "-$12.00", color: "text-destructive" },
                      { label: "Best Day", value: "+$18.50", color: "text-success" },
                      { label: "Worst Day", value: "-$6.20", color: "text-destructive" },
                      { label: "Avg Trade", value: "+$3.80", color: "text-primary" },
                      { label: "Discipline Score", value: "84/100", color: "text-primary" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-2.5">
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                        <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Days completed</span><span className="font-bold">5 / 14</span>
                      </div>
                      <Progress value={36} className="h-2" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Target completion</span><span className="font-bold text-primary">52%</span>
                      </div>
                      <Progress value={52} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Breakdown */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground"><CalendarDays className="h-5 w-5 text-primary" /> Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { day: 1, pnl: "+$8.20", trades: 2, discipline: 95 },
                    { day: 2, pnl: "+$5.60", trades: 2, discipline: 90 },
                    { day: 3, pnl: "-$6.20", trades: 3, discipline: 72 },
                    { day: 4, pnl: "+$18.50", trades: 2, discipline: 98 },
                    { day: 5, pnl: "+$16.30", trades: 1, discipline: 100 },
                  ].map(d => (
                    <div key={d.day} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-2.5">
                      <span className="text-xs font-bold text-foreground">Day {d.day}</span>
                      <span className={`text-xs font-bold ${d.pnl.startsWith("+") ? "text-success" : "text-destructive"}`}>{d.pnl}</span>
                      <span className="text-[10px] text-muted-foreground">{d.trades} trades</span>
                      <Badge variant="outline" className={`text-[9px] ${d.discipline >= 90 ? "border-success/30 text-success" : "border-warning/30 text-warning"}`}>
                        {d.discipline}% disc.
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="animate-fade-in">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground"><Trophy className="h-5 w-5 text-primary" /> Season 1 Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className={`flex items-center justify-between rounded-xl border p-4 transition-all hover:scale-[1.01] ${
                    entry.rank === 1 ? "border-yellow-500/40 bg-yellow-500/5" :
                    entry.rank === 2 ? "border-muted bg-muted/10" :
                    entry.rank === 3 ? "border-orange-600/30 bg-orange-600/5" :
                    "border-border bg-secondary"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{entry.badge}</span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">{entry.metric}</p>
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary mt-1">Score: {entry.score}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="animate-fade-in">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground"><BookOpen className="h-5 w-5 text-primary" /> Trade Journal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Log every trade to build accountability and improve performance.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { field: "Asset Traded", placeholder: "e.g., GBP/USD" },
                    { field: "Entry Time", placeholder: "e.g., 10:30 AM London" },
                    { field: "Direction", placeholder: "BUY / SELL" },
                    { field: "Entry Reason", placeholder: "BOS + OB retest" },
                    { field: "Result", placeholder: "+$5.20 / -$2.00" },
                    { field: "Emotion Before", placeholder: "Calm / Anxious / FOMO" },
                    { field: "Emotion After", placeholder: "Satisfied / Frustrated" },
                    { field: "Screenshot", placeholder: "Upload chart screenshot" },
                  ].map((f) => (
                    <div key={f.field} className="rounded-xl border border-border bg-secondary p-3">
                      <p className="text-xs font-semibold text-foreground mb-1">{f.field}</p>
                      <p className="text-[10px] text-muted-foreground">{f.placeholder}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full font-bold"><BookOpen className="h-4 w-4 mr-2" /> Log Trade Entry</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Protection Cards */}
        <section className="grid gap-4 lg:grid-cols-4 animate-fade-in">
          {[
            { icon: AlertTriangle, title: "Account Protection", text: "Auto-lock when daily loss limit is hit. No override.", color: "text-destructive" },
            { icon: Clock3, title: "Session Control", text: "Only trade during approved sessions and time blocks.", color: "text-warning" },
            { icon: LineChart, title: "Strategy Quality", text: "Score discipline, confirmations, and clean execution.", color: "text-primary" },
            { icon: CalendarDays, title: "Consistency", text: "Reward showing up and following rules, not just profit.", color: "text-success" },
          ].map((item) => (
            <Card key={item.title} className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardContent className="space-y-3 p-4">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
