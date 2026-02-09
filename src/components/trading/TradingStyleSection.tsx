import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Zap, TrendingUp, BarChart3, Activity, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";

type StyleKey = "synthetic" | "digits" | "risefall" | "boomcrash" | "voltrend";

type TradeStyle = {
  key: StyleKey;
  title: string;
  subtitle: string;
  badges: { label: string }[];
  learn: string[];
  startRoute: string;
  icon: React.ReactNode;
};

const STYLES: TradeStyle[] = [
  {
    key: "synthetic",
    title: "Synthetic Indices",
    subtitle: "24/7 markets made for algorithms. Smooth behavior, no news shocks.",
    badges: [{ label: "Beginner Friendly" }, { label: "Steady" }],
    learn: ["Best for learning bots", "Good for trend + range strategies", "Runs 24/7"],
    startRoute: "/trade/style/synthetic-indices",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    key: "digits",
    title: "Digit Contracts",
    subtitle: "Fast micro-trades based on last-digit movement. High-speed strategies.",
    badges: [{ label: "Advanced" }, { label: "Fast" }],
    learn: ["Short duration trades", "Needs strict risk rules", "Great for automation"],
    startRoute: "/trade/style/digit-contracts",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    key: "risefall",
    title: "Rise/Fall Scalping",
    subtitle: "Predict short-term direction using momentum + timing logic.",
    badges: [{ label: "Medium Risk" }, { label: "Active" }],
    learn: ["Quick entries and exits", "Works best with confirmations", "Good for focused sessions"],
    startRoute: "/trade/style/rise-fall-scalping",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    key: "boomcrash",
    title: "Boom/Crash Spike Logic",
    subtitle: "Catch spikes using volatility + impulse detection algorithms.",
    badges: [{ label: "High Volatility" }, { label: "Precision" }],
    learn: ["Spikes can be sudden", "Needs tight risk control", "Best for experienced users"],
    startRoute: "/trade/style/boom-crash",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    key: "voltrend",
    title: "Volatility Trend Bots",
    subtitle: "Ride longer trends using EMA + market structure rules.",
    badges: [{ label: "Beginner Friendly" }, { label: "Trend" }],
    learn: ["Simple rules: follow trend", "Less overtrading", "Good for passive users"],
    startRoute: "/trade/style/synthetic-indices",
    icon: <Activity className="h-4 w-4" />,
  },
];

export function TradingStyleSection() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<StyleKey | null>(null);
  const [experience, setExperience] = useState<"new" | "some" | "pro">("new");
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [time, setTime] = useState<"short" | "medium" | "long">("short");

  const recommended = useMemo<TradeStyle>(() => {
    if (experience === "new") return STYLES.find(s => s.key === "voltrend")!;
    if (experience === "some" && risk === "medium") return STYLES.find(s => s.key === "risefall")!;
    if (risk === "high" && time !== "short") return STYLES.find(s => s.key === "boomcrash")!;
    if (time === "short" && experience === "pro") return STYLES.find(s => s.key === "digits")!;
    return STYLES.find(s => s.key === "synthetic")!;
  }, [experience, risk, time]);

  return (
    <section className="mt-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Choose Your Trading Style
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pick how you want to trade. Botvio helps you set up the right strategy and bot rules — no confusion.
        </p>
      </div>

      {/* Style Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STYLES.map((s) => (
          <Card key={s.key} className="glass-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    {s.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">{s.subtitle}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {s.badges.map((b, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px]">
                    {b.label}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setOpen(open === s.key ? null : s.key)}
                >
                  {open === s.key ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  Learn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate(s.startRoute)}
                >
                  Trade Now
                </Button>
              </div>
              {open === s.key && (
                <div className="rounded-lg border border-border/50 p-3 text-sm space-y-2 bg-muted/30">
                  <div className="font-semibold text-xs">Quick Notes</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                    {s.learn.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mini Quiz */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-base">Not sure? We'll recommend one.</CardTitle>
              <CardDescription className="text-xs mt-1">
                Answer 3 quick questions and we'll suggest the best starting option.
              </CardDescription>
            </div>
            <Button variant="gold" size="sm" onClick={() => navigate(recommended.startRoute)}>
              Start Recommended
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Experience</Label>
              <Select value={experience} onValueChange={(v) => setExperience(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="some">Some experience</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Risk level</Label>
              <Select value={risk} onValueChange={(v) => setRisk(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time available</Label>
              <Select value={time} onValueChange={(v) => setTime(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (10–30 min)</SelectItem>
                  <SelectItem value="medium">Medium (1–2 hrs)</SelectItem>
                  <SelectItem value="long">Long (2+ hrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 p-4 bg-primary/5">
            <div className="text-xs text-muted-foreground">Recommended:</div>
            <div className="font-semibold mt-1">{recommended.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{recommended.subtitle}</div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Disclaimer: Trading involves risk. Past performance is not a guarantee of future results.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
