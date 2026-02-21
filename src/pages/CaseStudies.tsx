import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Target } from "lucide-react";

const studies = [
  {
    title: "From Manual Losses to Automated Profits: A Nigerian Trader's Journey",
    trader: "Trader A — Lagos, Nigeria",
    mode: "Digits (Match/Differ)",
    duration: "3 months",
    summary: "After losing consistently with manual digit trading, this trader switched to Botvio's Markov-based Match/Differ engine. Botvio's transition analysis identified patterns invisible to manual analysis. Over 3 months, the trader saw a significant improvement in win rate, particularly on Volatility 75 and Step Index.",
    keyTakeaway: "Botvio's Markov transition model provided a statistical edge on digit contracts that manual pattern recognition couldn't match.",
  },
  {
    title: "Boom 1000 Spike Catching: How Botvio's Detection Engine Performs",
    trader: "Trader B — Nairobi, Kenya",
    mode: "Boom/Crash",
    duration: "6 weeks",
    summary: "This trader used Botvio's Boom/Crash engine exclusively on Boom 1000. Botvio's spike drought detection and volatility compression analysis identified entry windows before major spikes. The trader reported catching significantly more spikes than with manual monitoring, thanks to Botvio's 24/7 server-side execution.",
    keyTakeaway: "Botvio's always-on monitoring catches opportunities that human traders miss during off-hours.",
  },
  {
    title: "Risk-Managed Accumulator Trading with Botvio",
    trader: "Trader C — Mumbai, India",
    mode: "Accumulators",
    duration: "2 months",
    summary: "A conservative trader used Botvio's Accumulator engine on V25. Botvio's stability analysis ensured entries only during calm market phases, avoiding the choppy conditions that typically break accumulator contracts. The result was steady, consistent growth with minimal drawdowns.",
    keyTakeaway: "Botvio's stability scoring effectively filters out high-risk periods for accumulator trading.",
  },
];

const CaseStudies = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Case Studies" description="Real-world case studies showing how Botvio AI trading bot performs across different trading modes, instruments, and market conditions." />
    <Header />
    <main className="container mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight">Case Studies</h1>
        <p className="text-muted-foreground">Real-world results from Botvio traders around the world.</p>
      </div>
      <div className="space-y-8">
        {studies.map((s, i) => (
          <Card key={i}>
            <CardContent className="py-8 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge>{s.mode}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration}</span>
                <span className="text-sm text-muted-foreground">{s.trader}</span>
              </div>
              <h2 className="text-xl font-bold">{s.title}</h2>
              <p className="text-muted-foreground">{s.summary}</p>
              <div className="bg-primary/5 rounded-lg p-4 flex items-start gap-3">
                <Target className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Key Takeaway</p>
                  <p className="text-sm text-muted-foreground">{s.keyTakeaway}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center text-sm text-muted-foreground">
        <p>Disclaimer: These case studies represent individual trader experiences. Results vary and past performance does not guarantee future results. Trading involves risk.</p>
      </div>
    </main>
  </div>
);

export default CaseStudies;
