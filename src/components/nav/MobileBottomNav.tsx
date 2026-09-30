import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Bot, ChartCandlestick, Coins, Layers, LineChart, Menu, Signal, Users, X } from "lucide-react";
import { BOTTOM_NAV, MORE_NAV } from "./mainNav";
import { cn } from "@/lib/utils";

/**
 * Mobile-only bottom navigation: Home, Markets, Signals, AI, More.
 * The More sheet exposes the secondary sections of the Botvio IA.
 */
export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Marketing pages already have their own header navigation; avoid stacking
  // a second mobile navigation bar over the landing experience.
  if (pathname === "/" || pathname === "/landing" || pathname === "/home-preview" || pathname === "/home-classic") {
    return null;
  }

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));

  const tradingHubs = [
    { label: "Trading Hubs", to: "/markets", icon: BarChart3, description: "Markets & dedicated hubs" },
    { label: "Copy Trading", to: "/copy-trading", icon: Users, description: "Providers & strategies" },
    { label: "AI Trading Bots", to: "/bots", icon: Bot, description: "Automated strategies" },
    { label: "Botvio Robot", to: "/botvio-robot", icon: Bot, description: "Official automated provider" },
    { label: "My Copy Trading", to: "/copy-trading/my", icon: Users, description: "Follower dashboard" },
    { label: "Provider Dashboard", to: "/provider-dashboard", icon: LineChart, description: "Publish & deliver signals" },
    { label: "Signals Center", to: "/signals", icon: Signal, description: "Live opportunities" },
    { label: "Deriv Synthetic", to: "/synthetic", icon: Layers, description: "Boom, Crash & Volatility" },
    { label: "Forex & Gold", to: "/gold", icon: Coins, description: "XAU/USD & FX markets" },
    { label: "Indices", to: "/us30", icon: LineChart, description: "US30, NAS100 & GER40" },
    { label: "Options Trading", to: "/deriv-options", icon: ChartCandlestick, description: "Deriv options hub" },
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-14 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 pb-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div><p className="text-lg font-black text-foreground">Trading Hub</p><p className="text-[11px] text-muted-foreground">Everything you need to explore and trade</p></div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5">
              <section>
                <div className="mb-2 flex items-center justify-between"><p className="data-label">Trading</p><span className="text-[10px] text-muted-foreground">Quick access</span></div>
                <div className="grid grid-cols-2 gap-2">
                  {tradingHubs.map(({ label, to, icon: Icon, description }) => (
                    <Link key={to + label} to={to} onClick={() => setOpen(false)} className="group rounded-xl border border-border/60 bg-background/60 p-3 transition hover:border-primary/50 hover:bg-primary/5">
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden /><span className="truncate text-xs font-bold text-foreground">{label}</span></div>
                      <p className="mt-1 text-[9px] leading-3 text-muted-foreground">{description}</p>
                    </Link>
                  ))}
                </div>
              </section>
              {MORE_NAV.map((group) => (
                <div key={group.label}>
                  <p className="data-label mb-2">{group.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(({ label, to, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs font-medium text-foreground"
                      >
                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                        <span className="truncate">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-border/60 bg-card/95 backdrop-blur-xl lg:hidden"
      >
        {BOTTOM_NAV.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              isActive(to) ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={isActive(to) ? "page" : undefined}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden />}
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
            open ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Menu className="h-4 w-4" aria-hidden />
          More
        </button>
      </nav>
      {/* Spacer so page content is never hidden behind the bar */}
      <div className="h-14 lg:hidden" aria-hidden />
    </>
  );
};
