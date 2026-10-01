import { cloneElement, isValidElement, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Bot,
  Coins,
  Copy,
  GraduationCap,
  Home,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Signal,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  to: string;
  icon: LucideIcon;
  live?: boolean;
};

const primary: Item[] = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "Markets", to: "/markets", icon: BarChart3 },
  { label: "Signals", to: "/signals", icon: Signal, live: true },
  { label: "Copy Trading", to: "/copy-trading", icon: Copy },
  { label: "AI Trading Bots", to: "/bots", icon: Bot },
  { label: "Trading Hub", to: "/gold", icon: Coins },
];

const trading: Item[] = [
  { label: "My Copy Trading", to: "/copy-trading/my", icon: Users },
  { label: "Provider Dashboard", to: "/provider-dashboard", icon: LineChart },
  { label: "Deriv Accounts", to: "/connections", icon: WalletCards },
  { label: "AI Chart Analysis", to: "/chart/XAUUSD", icon: Sparkles },
  { label: "Learn", to: "/learn", icon: GraduationCap },
];

export const MobileSideMenu = ({ className, trigger }: { className?: string; trigger?: ReactNode }) => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  const close = () => setOpen(false);

  const renderItems = (items: Item[]) =>
    items.map(({ label, to, icon: Icon, live }) => (
      <Link
        key={to + label}
        to={to}
        onClick={close}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
          isActive(to)
            ? "bg-primary/12 text-primary ring-1 ring-primary/25"
            : "text-foreground/80 hover:bg-secondary hover:text-foreground"
        )}
      >
        <span className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
          isActive(to)
            ? "border-primary/30 bg-primary/15 text-primary"
            : "border-border/60 bg-background/50 text-muted-foreground group-hover:text-primary"
        )}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {live && (
          <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Live
          </span>
        )}
      </Link>
    ));

  return (
    <>
      {trigger && isValidElement(trigger) ? cloneElement(trigger, { onClick: () => setOpen(true), "aria-expanded": open }) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Botvio menu"
          aria-expanded={open}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground shadow-sm backdrop-blur-xl transition hover:border-primary/40 hover:text-primary",
            className
          )}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close Botvio menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col border-r border-primary/15 bg-[hsl(220_20%_6%)] shadow-2xl animate-in slide-in-from-left duration-200"
            aria-label="Botvio mobile navigation"
          >
            <div className="border-b border-border/60 px-4 pb-4 pt-5">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={close} className="flex items-center gap-3">
                  <img src="/botvio-logo.png" alt="Botvio" className="h-10 w-10 rounded-xl" />
                  <div className="leading-none">
                    <div className="text-lg font-black tracking-tight text-foreground">BOTVIO</div>
                    <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      AI Trading Intelligence
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="rounded-xl border border-border/60 bg-card p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-success/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    {user ? <UserRound className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-foreground">{user ? "Welcome back" : "Welcome to Botvio"}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {user?.email || "Live markets • signals • copy trading"}
                    </p>
                  </div>
                  {user && <span className="rounded-full bg-success/10 px-2 py-1 text-[9px] font-bold text-success">Active</span>}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Main</p>
              <div className="space-y-1">{renderItems(primary)}</div>

              <div className="my-5 border-t border-border/50" />

              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Trading & Account</p>
              <div className="space-y-1">{renderItems(trading)}</div>
            </div>

            <div className="border-t border-border/60 bg-card/50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/settings"
                  onClick={close}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                {user ? (
                  <button
                    type="button"
                    onClick={async () => { await signOut(); close(); }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs font-bold text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={close}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-black text-primary-foreground"
                  >
                    <LogIn className="h-4 w-4" /> Sign in
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
