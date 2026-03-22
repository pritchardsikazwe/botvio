import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  Shield,
  Target,
  Trophy,
  Brain,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Clock3,
  Wallet,
} from "lucide-react";

const challengeCards = [
  {
    title: "Beginner Flip Challenge",
    duration: "7 days",
    setup: "$10 → $50",
    risk: "Low risk",
    trades: "Max 2 trades/day",
    focus: "Discipline first",
  },
  {
    title: "Smart Money Challenge",
    duration: "14 days",
    setup: "$20 → $100",
    risk: "Medium risk",
    trades: "Structure + liquidity",
    focus: "Confirmation entries",
  },
  {
    title: "Boom/Crash Challenge",
    duration: "14 days",
    setup: "$20 → $120",
    risk: "Strict only",
    trades: "Spike hunting rules",
    focus: "No revenge trading",
  },
  {
    title: "Binary Discipline Challenge",
    duration: "30 days",
    setup: "$50 → $300",
    risk: "Controlled risk",
    trades: "5–10 signals/day max",
    focus: "Expiry precision",
  },
];

const dailyChecklist = [
  "Read market bias before opening any position.",
  "Wait for Botvio signal or a valid strategy confirmation.",
  "Set stop loss and take profit before entry.",
  "Log the result and note your emotional state.",
  "Stop when daily target or loss limit is hit.",
];

const leaderboard = [
  { name: "Discipline Trader", metric: "96% rule-follow score", label: "Top discipline" },
  { name: "Weekly Flipper", metric: "+18% this week", label: "Best weekly growth" },
  { name: "Consistency Pro", metric: "12 clean sessions", label: "Most consistent" },
];

const aiCoach = [
  "Today’s best assets for small-account setups.",
  "Safe lot size suggestions based on challenge balance.",
  "Trade-limit reminders before overtrading starts.",
  "Post-session review of yesterday’s mistakes.",
];

export default function FlippingChallenges() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Botvio Flipping Challenges"
        description="Join disciplined 7-day, 14-day, and 30-day growth challenges with rules, AI coaching, progress tracking, and leaderboards."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div className="space-y-5">
              <Badge className="bg-primary/15 text-primary border-primary/30">
                Discipline-led account growth
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground lg:text-5xl">
                Turn small accounts into disciplined growth challenges with Botvio AI.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground lg:text-lg">
                Join structured 7-day, 14-day, or 30-day challenges built around risk control, strategy rules, progress tracking, and accountable execution.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="font-bold">
                  <Link to="/live">Open Live Module</Link>
                </Button>
                <Button asChild variant="outline" className="font-bold">
                  <Link to="/signals">View Signals</Link>
                </Button>
              </div>
            </div>

            <Card className="border-primary/20 bg-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Wallet className="h-5 w-5 text-primary" />
                  Challenge Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Starting balance</p>
                    <p className="mt-1 text-xl font-bold text-foreground">$20</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Target balance</p>
                    <p className="mt-1 text-xl font-bold text-foreground">$100</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Current day</p>
                    <p className="mt-1 text-xl font-bold text-foreground">Day 5 / 14</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Consistency</p>
                    <p className="mt-1 text-xl font-bold text-foreground">84%</p>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Challenge progress</span>
                    <span>64%</span>
                  </div>
                  <Progress value={64} />
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-foreground">
                  AI Coach: <span className="text-muted-foreground">Your account is still small — keep risk tight and skip wide-stop setups today.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Choose your challenge</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {challengeCards.map((challenge) => (
              <Card key={challenge.title} className="border-border bg-card">
                <CardHeader className="space-y-3">
                  <Badge variant="outline" className="w-fit border-primary/30 text-primary">
                    {challenge.duration}
                  </Badge>
                  <CardTitle className="text-lg text-foreground">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border bg-secondary p-3 text-foreground font-semibold">
                    {challenge.setup}
                  </div>
                  <p>{challenge.risk}</p>
                  <p>{challenge.trades}</p>
                  <p>{challenge.focus}</p>
                  <Button className="w-full font-bold">Join challenge</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                Rules page
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                "Max trades per day",
                "Risk per trade",
                "Daily stop loss",
                "Target per day",
                "Allowed sessions",
                "Strategy to use",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-secondary p-3 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Daily task checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-secondary p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Progress tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Current balance</p>
                  <p className="mt-1 text-xl font-bold text-foreground">$62.40</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Win rate</p>
                  <p className="mt-1 text-xl font-bold text-foreground">71%</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Remaining target</p>
                  <p className="mt-1 text-xl font-bold text-foreground">$37.60</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Days completed</span>
                    <span>5 / 14</span>
                  </div>
                  <Progress value={36} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target completion</span>
                    <span>52%</span>
                  </div>
                  <Progress value={52} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Brain className="h-5 w-5 text-primary" />
                AI challenge coach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiCoach.map((item) => (
                <div key={item} className="rounded-xl border border-border bg-secondary p-3 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Trophy className="h-5 w-5 text-primary" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between rounded-xl border border-border bg-secondary p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">#{index + 1} {entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.label}</p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {entry.metric}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BookOpen className="h-5 w-5 text-primary" />
                Trading journal
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                "Asset traded",
                "Entry time",
                "Reason for entry",
                "Screenshot upload",
                "Result logged",
                "Emotion before / after",
              ].map((field) => (
                <div key={field} className="rounded-xl border border-border bg-secondary p-3 text-sm text-foreground">
                  {field}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {[
            { icon: AlertTriangle, title: "Account protection", text: "Lock the challenge when daily loss limit is hit." },
            { icon: Clock3, title: "Session control", text: "Only trade during approved sessions and time blocks." },
            { icon: TrendingUp, title: "Strategy quality", text: "Score discipline, confirmations, and clean execution." },
            { icon: CalendarDays, title: "Consistency", text: "Reward showing up and following rules, not just profit." },
          ].map((item) => (
            <Card key={item.title} className="border-border bg-card">
              <CardContent className="space-y-3 p-4">
                <item.icon className="h-5 w-5 text-primary" />
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