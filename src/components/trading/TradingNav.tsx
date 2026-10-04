import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LineChart } from "lucide-react";

/** One canonical Deriv Options surface. Legacy binary-option pages redirect into this workspace. */
export const TRADING_SURFACES = [
  { to: "/options", label: "Deriv Options", icon: LineChart },
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