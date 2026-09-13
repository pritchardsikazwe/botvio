import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Bot, Brain, Copy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TradingFunnelProps {
  asset: string;
  brokerPaths?: string[];
}

export function TradingFunnel({ asset, brokerPaths = ["/brokers/deriv", "/brokers/exness", "/brokers/weltrade", "/brokers/pocket-option", "/brokers/binance"] }: TradingFunnelProps) {
  return (
    <section className="space-y-4" aria-label={`${asset} trading next steps`}>
      <Card className="border-primary/20 bg-card/80">
        <CardContent className="p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Botvio trading workflow</p>
              <h2 className="text-lg font-bold text-foreground">Research {asset}, then choose your next action</h2>
              <p className="mt-1 text-sm text-muted-foreground">Use the market tools first. Account and broker choices come after you understand the setup.</p>
            </div>
            <Link to="/landing">
              <Button className="gap-2 font-bold"><UserPlus className="h-4 w-4" /> Start with Botvio</Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link to={`/chart/${asset}`} className="group rounded-lg border border-border/60 p-3 transition hover:border-primary/50">
              <BarChart3 className="mb-2 h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Live chart</div><div className="text-xs text-muted-foreground">Study price action</div>
            </Link>
            <Link to={`/chart/${asset}`} className="group rounded-lg border border-border/60 p-3 transition hover:border-primary/50">
              <Brain className="mb-2 h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">AI analysis</div><div className="text-xs text-muted-foreground">Analyse structure and levels</div>
            </Link>
            <Link to="/signals" className="group rounded-lg border border-border/60 p-3 transition hover:border-primary/50">
              <ArrowRight className="mb-2 h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Signals</div><div className="text-xs text-muted-foreground">Review available setups</div>
            </Link>
            <Link to="/copy-trading" className="group rounded-lg border border-border/60 p-3 transition hover:border-primary/50">
              <Copy className="mb-2 h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Copy trading</div><div className="text-xs text-muted-foreground">Explore providers</div>
            </Link>
            <Link to="/bots" className="group rounded-lg border border-border/60 p-3 transition hover:border-primary/50">
              <Bot className="mb-2 h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">AI bots</div><div className="text-xs text-muted-foreground">Explore automation</div>
            </Link>
          </div>
          <div className="mt-4 border-t border-border/50 pt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Compare brokers after your research</p>
            <div className="flex flex-wrap gap-2">
              {brokerPaths.map((path) => <Link key={path} to={path}><Button variant="outline" size="sm" className="text-xs">{path.split("/").pop()?.replaceAll("-", " ")}</Button></Link>)}
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Trading involves risk. Market analysis is informational and does not guarantee results. Review broker terms, fees and eligibility before opening an account.</p>
        </CardContent>
      </Card>
    </section>
  );
}
