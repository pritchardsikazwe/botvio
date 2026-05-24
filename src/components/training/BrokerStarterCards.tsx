import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ExternalLink,
  Rocket,
  TrendingUp,
  Coins,
  Sparkles,
  BookOpen,
  Mail,
  KeyRound,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const DERIV_URL =
  "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827";
const EXNESS_URL = "https://one.exness-track.com/a/ts1kvs1k";
const WELTRADE_URL = "https://gowt.net/ib67505";

const STEPS = [
  { Icon: ExternalLink, text: 'Visit the broker website and tap "Sign Up"' },
  { Icon: Mail, text: "Register using Email, Google, or Facebook" },
  { Icon: ShieldCheck, text: "Verify your email address" },
  { Icon: KeyRound, text: "Create a secure password" },
  { Icon: CheckCircle2, text: "Fill in your personal details correctly" },
  { Icon: ShieldCheck, text: "Complete account verification if needed" },
  { Icon: Sparkles, text: "Choose a Demo or Real account" },
  { Icon: Wallet, text: "Deposit funds using your preferred payment method" },
  { Icon: TrendingUp, text: "Practice with the Demo account before trading real money" },
];

const FOREX_BROKERS = [
  { name: "Deriv", url: DERIV_URL, tag: "Forex · Metals · CFDs", Icon: Rocket },
  { name: "Exness", url: EXNESS_URL, tag: "Gold · Forex · Low Spreads", Icon: Coins },
];

const SYNTHETIC_BROKERS = [
  { name: "Deriv", url: DERIV_URL, tag: "Boom · Crash · Volatility · Jump", Icon: Rocket },
  { name: "Weltrade", url: WELTRADE_URL, tag: "Syntx · PainX · GainX", Icon: TrendingUp },
];

type Broker = (typeof FOREX_BROKERS)[number];

const BrokerRow = ({ name, url, tag, Icon }: Broker) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer sponsored"
    className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight">{name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{tag}</p>
      </div>
    </div>
    <Button variant="gold" size="sm" className="flex-shrink-0 pointer-events-none">
      Sign Up
      <ExternalLink className="h-3 w-3 ml-1" />
    </Button>
  </a>
);

export const BrokerStarterCards = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Best Forex Brokers to Start With
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Beginner guide + verified affiliate partners to follow our signals
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Verified Partners
        </Badge>
      </div>

      <Card className="glass-card border-primary/40 overflow-hidden flex flex-col relative">
        <div className="h-1 bg-gradient-to-r from-primary via-warning to-info" />
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 z-10">
          <BookOpen className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-bold text-primary uppercase tracking-wide">
            Beginner Guide
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="bg-gradient-to-br from-primary/10 via-background to-warning/10 p-4 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-primary/20">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                📘 Beginner Guide
              </p>
              <h4 className="text-xl md:text-2xl font-black leading-tight mt-1">
                How to Open a Forex Account
              </h4>
              <p className="text-xs text-muted-foreground mt-2">
                Follow these simple steps to open your first trading account and start receiving Botvio signals.
              </p>
              <Button variant="gold" size="sm" className="w-full mt-3" asChild>
                <a href={DERIV_URL} target="_blank" rel="noopener noreferrer sponsored">
                  <Rocket className="h-3.5 w-3.5 mr-1.5" />
                  Open Deriv Forex Account
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </Button>
            </div>

            <ul className="space-y-1.5">
              {STEPS.map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-md border border-warning/40 bg-warning/5 p-2.5 flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <span className="font-bold text-warning">Tip:</span> Trade responsibly and keep your account secure.
              </p>
            </div>
          </div>

          <div className="flex flex-col">
            <CardHeader className="pb-3">
              <Badge className="w-fit text-[10px] font-bold border bg-primary/15 text-primary border-primary/30">
                CHOOSE YOUR BROKER
              </Badge>
              <CardTitle className="text-base leading-tight mt-2">
                Sign up with a trusted partner
              </CardTitle>
              <CardDescription className="text-xs font-medium text-foreground/80">
                The steps above apply to all major brokers. Pick one to open your free account now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Coins className="h-3.5 w-3.5 text-warning" />
                  <p className="text-[11px] font-bold uppercase tracking-wide text-warning">
                    Best Forex Brokers — Open Sign-Up
                  </p>
                </div>
                <div className="space-y-2">
                  {FOREX_BROKERS.map((b) => (
                    <BrokerRow key={`fx-${b.name}`} {...b} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Rocket className="h-3.5 w-3.5 text-info" />
                  <p className="text-[11px] font-bold uppercase tracking-wide text-info">
                    Synthetic Indices Brokers
                  </p>
                </div>
                <div className="space-y-2">
                  {SYNTHETIC_BROKERS.map((b) => (
                    <BrokerRow key={`syn-${b.name}`} {...b} />
                  ))}
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground leading-relaxed mt-auto">
                ⚠️ Trading involves risk. Capital is at risk. Links contain affiliate referrals.
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
};
