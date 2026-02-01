import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  BookOpen,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Clock,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TradingGuideProps {
  showOnboarding?: boolean;
  onCloseOnboarding?: () => void;
}

const TRADING_STEPS = [
  {
    step: 1,
    title: "Connect Your Broker",
    description: "Link your Deriv account using OAuth or API token to enable trading.",
    icon: Wallet,
    tips: [
      "Use Demo mode first to practice without risk",
      "OAuth login is easier - no token needed",
      "Token method gives you more control",
    ],
  },
  {
    step: 2,
    title: "Select a Trading Pair",
    description: "Choose which market you want to trade from the pair selector.",
    icon: Target,
    tips: [
      "Start with Volatility Indices (24/7 market)",
      "XAUUSD is popular for forex traders",
      "Synthetic indices have lower spreads",
    ],
  },
  {
    step: 3,
    title: "Analyze the Market",
    description: "Use our Sniper signals and support/resistance levels to find entries.",
    icon: TrendingUp,
    tips: [
      "Wait for signals with high confidence (70%+)",
      "Check if price is near support/resistance",
      "Use multiple timeframes for confirmation",
    ],
  },
  {
    step: 4,
    title: "Place Your Trade",
    description: "Use Quick Trade or follow a signal to execute your trade.",
    icon: Zap,
    tips: [
      "Start with small stakes ($1-5)",
      "Set a daily loss limit",
      "Don't overtrade - quality over quantity",
    ],
  },
  {
    step: 5,
    title: "Monitor & Manage",
    description: "Track your open trades and performance in the dashboard.",
    icon: Settings,
    tips: [
      "Close losing trades early if needed",
      "Let winners run when trend is strong",
      "Review your trades at end of day",
    ],
  },
];

export const TradingGuide = ({ showOnboarding = false, onCloseOnboarding }: TradingGuideProps) => {
  const [isOpen, setIsOpen] = useState(showOnboarding);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  useEffect(() => {
    setIsOpen(showOnboarding);
  }, [showOnboarding]);

  const handleClose = () => {
    setIsOpen(false);
    onCloseOnboarding?.();
  };

  return (
    <>
      {/* Onboarding Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">How to Trade on Botvio</DialogTitle>
                <DialogDescription>Follow these 5 simple steps to start trading</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {TRADING_STEPS.map((step) => (
              <Collapsible
                key={step.step}
                open={expandedStep === step.step}
                onOpenChange={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">{step.step}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-primary" />
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {expandedStep === step.step ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-14 pr-4 pb-4 space-y-2">
                    {step.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          <div className="flex items-start gap-2 p-4 bg-warning/10 border border-warning/20 rounded-lg mt-4">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Risk Warning</p>
              <p className="text-muted-foreground">
                Trading involves significant risk. Start with demo mode and never trade more than you can afford to lose.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="gold" className="flex-1" onClick={handleClose}>
              Start Trading
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Sidebar Help Panel Component
export const TradingHelpPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Trading Guide
              </span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <div className="space-y-2">
              {TRADING_STEPS.slice(0, 3).map((step) => (
                <div key={step.step} className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5">
                    {step.step}
                  </Badge>
                  <div>
                    <p className="text-xs font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/learn">
                <BookOpen className="h-3 w-3 mr-2" />
                View Full Guide
              </a>
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

// Tooltip Hints Component
export const TradingTooltip = ({ 
  children, 
  content,
  side = "top"
}: { 
  children: React.ReactNode; 
  content: string;
  side?: "top" | "right" | "bottom" | "left";
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Quick Trade Info Tooltips
export const QuickTradeTooltips = {
  stake: "The amount you're risking on this trade. Start small ($1-5) when learning.",
  duration: "How long the trade will last. Longer durations = more time for price to move.",
  contractType: "CALL = expecting price to go UP. PUT = expecting price to go DOWN.",
  payout: "The potential return if your trade wins. Higher payouts = more risk.",
};