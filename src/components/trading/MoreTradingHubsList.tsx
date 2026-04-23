import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe2, BarChart4, ArrowRight } from "lucide-react";

type HubLink = { label: string; sub: string; route: string; emoji: string };

const FOREX_HUBS: HubLink[] = [
  { label: "EUR/USD", sub: "Most liquid pair", route: "/eurusd", emoji: "🇪🇺" },
  { label: "USD/JPY", sub: "Safe-haven flows", route: "/usdjpy", emoji: "🇯🇵" },
  { label: "AUD/USD", sub: "Commodity-linked", route: "/audusd", emoji: "🇦🇺" },
  { label: "USD/CAD", sub: "Oil-correlated", route: "/usdcad", emoji: "🇨🇦" },
  { label: "USD/CHF", sub: "Swissie • haven", route: "/usdchf", emoji: "🇨🇭" },
  { label: "EUR/GBP", sub: "EU ↔ UK cross", route: "/eurgbp", emoji: "🇬🇧" },
  { label: "EUR/JPY", sub: "High-volatility cross", route: "/eurjpy", emoji: "💹" },
  { label: "NZD/USD", sub: "Kiwi • commodity", route: "/nzdusd", emoji: "🇳🇿" },
  { label: "USD/CNY", sub: "China trade flows", route: "/usdcny", emoji: "🇨🇳" },
];

const STOCK_HUBS: HubLink[] = [
  { label: "NVDA", sub: "Nvidia · AI", route: "/stocks/nvda", emoji: "🤖" },
  { label: "TSLA", sub: "Tesla · EV", route: "/stocks/tsla", emoji: "⚡" },
  { label: "AMD", sub: "Semiconductors", route: "/stocks/amd", emoji: "🧠" },
  { label: "MU", sub: "Micron · memory", route: "/stocks/mu", emoji: "💾" },
  { label: "AAPL", sub: "Apple · large cap", route: "/stocks/aapl", emoji: "🍎" },
  { label: "MSFT", sub: "Microsoft · cloud", route: "/stocks/msft", emoji: "💻" },
  { label: "AVGO", sub: "Broadcom · AI net", route: "/stocks/avgo", emoji: "🔌" },
  { label: "AMZN", sub: "Amazon · AWS", route: "/stocks/amzn", emoji: "📦" },
  { label: "META", sub: "Meta · social", route: "/stocks/meta", emoji: "💬" },
  { label: "GOOGL", sub: "Alphabet · search", route: "/stocks/googl", emoji: "🔎" },
];

function HubGrid({ hubs }: { hubs: HubLink[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {hubs.map((h) => (
        <Card key={h.route} className="bg-card border-border/50 hover:border-primary/40 transition-colors">
          <CardContent className="p-2.5">
            <Link to={h.route} className="block group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base leading-none">{h.emoji}</span>
                <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors">
                  {h.label}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{h.sub}</p>
              <div className="mt-1.5 flex items-center justify-end text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="h-3 w-3 ml-0.5" />
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Lightweight hub directory shown DIRECTLY UNDER the main `LiveTradingHubCards`
 * row (Gold / Silver / Bitcoin / GBP/USD). Lists the top-10 forex pairs and
 * top-10 actively-traded US stocks. Intentionally NOT linked from the home
 * shortcut buttons row — only surfaced from inside the existing trading-hubs
 * area so it stays a sub-menu of the hubs section.
 */
export function MoreTradingHubsList() {
  return (
    <section className="space-y-5 mt-2">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-extrabold text-foreground">More Forex Hubs</h3>
          </div>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            Top 10 most-traded pairs
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Dedicated trading desks for the most liquid global FX pairs — live charts, tips and strategy presets.
        </p>
        <HubGrid hubs={FOREX_HUBS} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-extrabold text-foreground">Active US Stock Hubs</h3>
          </div>
          <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
            Top 10 by volume / activity
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Live TradingView charts and intraday/swing playbooks for the most-traded US large-cap stocks.
        </p>
        <HubGrid hubs={STOCK_HUBS} />
      </div>
    </section>
  );
}