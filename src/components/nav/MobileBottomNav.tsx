import { Link, useLocation } from "react-router-dom";
import { BarChart3, Bot, Menu, Signal, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileSideMenu } from "./MobileSideMenu";

const NAV = [
  { label: "Home", to: "/", icon: BarChart3 },
  { label: "Connect", to: "/connections", icon: Users },
  { label: "Signals", to: "/signals", icon: Signal },
  { label: "AI Chart", to: "/chart/XAUUSD", icon: Sparkles },
  { label: "Deriv", to: "https://t.deriv.link?t=8U3QNKP9UA9G", icon: Bot, external: true },
];

export const MobileBottomNav = () => {
  const { pathname } = useLocation();

  // Keep the primary mobile actions visible even on the public homepage.
  // Desktop navigation remains unchanged.


  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <>
      <nav
        aria-label="Primary mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-primary/10 bg-[hsl(220_18%_8%_/_0.96)] backdrop-blur-xl lg:hidden"
      >
        {NAV.map(({ label, to, icon: Icon, external }) => (
          <Link
            key={to}
            to={to}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[9px] font-bold transition-colors",
              isActive(to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive(to) ? "page" : undefined}
          >
            <span className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              isActive(to) && "bg-primary/10 ring-1 ring-primary/20"
            )}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            {label}
          </Link>
        ))}
        <MobileSideMenu
          trigger={
            <button
              type="button"
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-[9px] font-bold text-muted-foreground transition-colors hover:text-primary"
              aria-label="Open Botvio menu"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/70">
                <Menu className="h-4 w-4" />
              </span>
              More
            </button>
          }
        />
      </nav>
      <div className="h-14 lg:hidden" aria-hidden />
    </>
  );
};
