import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { BOTTOM_NAV, MORE_NAV } from "./mainNav";
import { cn } from "@/lib/utils";

/**
 * Mobile-only bottom navigation: Home, Markets, Signals, AI, More.
 * The More sheet exposes the secondary sections of the Botvio IA.
 */
export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));

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
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">More</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
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
