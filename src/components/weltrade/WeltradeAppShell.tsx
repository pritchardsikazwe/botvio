import { ReactNode, useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Activity, LayoutGrid, User } from "lucide-react";
import { detectWeltradeAppMode, isWeltradeAllowedPath } from "@/lib/weltradeAppMode";

/** Restricts the Weltrade Android app to Weltrade-only screens. Normal website visitors are unaffected. */
export function WeltradeAppShell({ children, rest }: { children: ReactNode; rest: ReactNode }) {
  const { pathname, search } = useLocation();
  const [on] = useState(() => detectWeltradeAppMode(search));

  useEffect(() => {
    document.body.classList.toggle("weltrade-app", on);
  }, [on]);

  if (!on) return <>{children}{rest}</>;
  if (!isWeltradeAllowedPath(pathname)) return <Navigate to="/weltrade" replace />;

  const tabs = [
    { to: "/weltrade", label: "Hub", icon: LayoutGrid, active: pathname === "/weltrade" },
    { to: "/weltrade/signals", label: "Signals", icon: Activity, active: pathname.startsWith("/weltrade/") },
    { to: "/profile", label: "Account", icon: User, active: pathname.startsWith("/profile") },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <Link to="/weltrade" className="font-bold text-foreground">Weltrade AI Signals</Link>
        <span className="text-xs text-muted-foreground">by Botvio</span>
      </div>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-border bg-card/95 backdrop-blur">
        {tabs.map(({ to, label, icon: Icon, active }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-1 py-3 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
