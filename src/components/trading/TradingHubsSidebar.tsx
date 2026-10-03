import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe2, BarChart4, Coins, ChevronRight, Radio } from "lucide-react";
import { fetchActiveSymbols, getSymbolCapability } from "@/services/deriv/derivSymbols";

type HubLink = { label: string; route: string; emoji: string };

const FEATURED_HUBS: HubLink[] = [
  { label: "Gold (XAU/USD)", route: "/gold", emoji: "🥇" },
  { label: "Silver (XAG/USD)", route: "/silver", emoji: "🥈" },
  { label: "Bitcoin (BTC/USD)", route: "/bitcoin", emoji: "₿" },
  { label: "GBP/USD (Cable)", route: "/gbpusd", emoji: "£" },
];

const FOREX_HUBS: HubLink[] = [
  { label: "EUR/USD", route: "/eurusd", emoji: "🇪🇺" },
  { label: "USD/JPY", route: "/usdjpy", emoji: "🇯🇵" },
  { label: "AUD/USD", route: "/audusd", emoji: "🇦🇺" },
  { label: "USD/CAD", route: "/usdcad", emoji: "🇨🇦" },
  { label: "USD/CHF", route: "/usdchf", emoji: "🇨🇭" },
  { label: "EUR/GBP", route: "/eurgbp", emoji: "🇬🇧" },
  { label: "EUR/JPY", route: "/eurjpy", emoji: "💹" },
  { label: "NZD/USD", route: "/nzdusd", emoji: "🇳🇿" },
  { label: "USD/CNY", route: "/usdcny", emoji: "🇨🇳" },
];

const STOCK_HUBS: HubLink[] = [
  { label: "NVDA · Nvidia", route: "/stocks/nvda", emoji: "🤖" },
  { label: "TSLA · Tesla", route: "/stocks/tsla", emoji: "⚡" },
  { label: "AMD · AMD", route: "/stocks/amd", emoji: "🧠" },
  { label: "MU · Micron", route: "/stocks/mu", emoji: "💾" },
  { label: "AAPL · Apple", route: "/stocks/aapl", emoji: "🍎" },
  { label: "MSFT · Microsoft", route: "/stocks/msft", emoji: "💻" },
  { label: "AVGO · Broadcom", route: "/stocks/avgo", emoji: "🔌" },
  { label: "AMZN · Amazon", route: "/stocks/amzn", emoji: "📦" },
  { label: "META · Meta", route: "/stocks/meta", emoji: "💬" },
  { label: "GOOGL · Alphabet", route: "/stocks/googl", emoji: "🔎" },
];

function HubGroup({
  title,
  badge,
  icon: Icon,
  iconClass,
  hubs,
}: {
  title: string;
  badge: string;
  icon: typeof Globe2;
  iconClass: string;
  hubs: HubLink[];
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-foreground">{title}</span>
        </div>
        <Badge variant="outline" className="text-[9px] h-4 px-1 border-border text-muted-foreground">
          {badge}
        </Badge>
      </div>
      <ul className="space-y-0.5">
        {hubs.map((h) => (
          <li key={h.route}>
            <NavLink
              to={h.route}
              end
              className={({ isActive }) =>
                `group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`
              }
            >
              <span className="text-sm leading-none">{h.emoji}</span>
              <span className="flex-1 truncate">{h.label}</span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Vertical sidebar navigation for the Trading Hubs section.
 * Lists every featured hub (Gold/Silver/Bitcoin/GBP-USD) plus the new
 * forex pair hubs and US stock hubs as deep-links.
 *
 * Mounted inside the existing Trading Hubs area on the home page so users
 * can jump straight to any individual hub from one consolidated menu.
 */
export function TradingHubsSidebar() {
  const [live, setLive] = useState<{symbol:string;name:string}[]>([]);
  useEffect(() => { let cancelled=false; (async()=>{ try { const rows=await fetchActiveSymbols(true); const candidates=Object.values(rows).filter((r:any)=>/synthetic|volatility|boom|crash|range break|step|jump/i.test(`${r.display_name??""} ${r.market??""} ${r.submarket??""}`)); const checked=await Promise.all(candidates.map(async(r:any)=>{try{const cap=await getSymbolCapability(r.symbol,true);return !cap.unverified&&!cap.isSuspended&&cap.isOpen&&Object.keys(cap.contracts).length>0?{symbol:r.symbol,name:r.display_name??r.symbol}:null}catch{return null}})); if(!cancelled)setLive(checked.filter(Boolean) as any);}catch{if(!cancelled)setLive([])}})(); return()=>{cancelled=true}},[]);
  return (
    <Card className="bg-card/60 border-border/50 sticky top-20">
      <CardContent className="p-3 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-foreground leading-tight">Trading Hubs</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Jump to any market desk</p>
          </div>
        </div>

        <HubGroup
          title="Featured"
          badge="Live AI"
          icon={Coins}
          iconClass="text-warning"
          hubs={FEATURED_HUBS}
        />

        <HubGroup
          title="Forex Pairs"
          badge="Top 10"
          icon={Globe2}
          iconClass="text-primary"
          hubs={FOREX_HUBS}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1"><div className="flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-success" /><span className="text-[11px] font-extrabold uppercase tracking-wide">Deriv Live Synthetics</span></div><Badge variant="outline" className="text-[9px] h-4 px-1 border-success/30 text-success">{live.length}</Badge></div>
          <div className="flex flex-wrap gap-1">{live.slice(0,24).map(x=><NavLink key={x.symbol} to={`/synthetic?symbol=${encodeURIComponent(x.symbol)}`} className="rounded-md border border-border/50 px-1.5 py-1 text-[9px] font-mono text-muted-foreground hover:text-primary hover:border-primary/30">{x.name}</NavLink>)}</div>
        </div>

        <HubGroup
          title="US Stocks"
          badge="Most-traded"
          icon={BarChart4}
          iconClass="text-success"
          hubs={STOCK_HUBS}
        />
      </CardContent>
    </Card>
  );
}