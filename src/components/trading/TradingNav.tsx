import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Layers, LineChart, Smartphone, TrendingUp } from "lucide-react";

/** The four Deriv trading surfaces, always reachable from one another. */
export const TRADING_SURFACES = [
  { to: "/rise-fall", label: "Rise & Fall", icon: TrendingUp },
  { to: "/deriv-app", label: "Deriv App", icon: Smartphone },
  { to: "/deriv-options", label: "Options", icon: LineChart },
  { to: "/trade/style/rise-fall-scalping", label: "Momentum", icon: Layers },
] as const;

export const TradingNav = ({ className }: { className?: string }) => {
  const { pathname } = useLocation();

  return (
    <nav className={cn("flex gap-1.5 overflow-x-auto pb-1", className)} aria-label="Trading pages">
      {TRADING_SURFACES.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};