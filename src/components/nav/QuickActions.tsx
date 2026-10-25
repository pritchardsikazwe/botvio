import { Link } from "react-router-dom";
import { ScanSearch, PlugZap, Signal, WalletCards, Gift, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const DERIV_AFFILIATE_URL = "https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/";

export type QuickAction = { label: string; short: string; to: string; icon: LucideIcon; external?: boolean };

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "AI Chart Analysis", short: "AI Chart", to: "/signals?tab=chart-analysis", icon: ScanSearch },
  { label: "Connect MT5", short: "MT5", to: "/connections", icon: PlugZap },
  { label: "Signals", short: "Signals", to: "/signals", icon: Signal },
  { label: "Connect Deriv", short: "Deriv", to: "/deriv/options", icon: WalletCards },
  { label: "Open Deriv Account", short: "Join Deriv", to: DERIV_AFFILIATE_URL, icon: Gift, external: true },
];

/** Big, readable shortcut buttons. `variant="bar"` scrolls horizontally under headers; `variant="grid"` fills menus. */
export const QuickActions = ({ variant = "bar", onNavigate, className }: { variant?: "bar" | "grid"; onNavigate?: () => void; className?: string }) => (
  <div
    className={cn(
      variant === "bar"
        ? "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:justify-center"
        : "grid grid-cols-2 gap-2",
      className,
    )}
    aria-label="Quick actions"
  >
    {QUICK_ACTIONS.map(({ label, to, icon: Icon, external }, i) => {
      const cls = cn(
        "flex shrink-0 items-center gap-2.5 rounded-2xl border font-bold transition active:scale-[0.98]",
        variant === "bar" ? "h-12 px-4 text-sm" : "min-h-14 px-3 py-2.5 text-[13px] leading-tight",
        variant === "grid" && i === QUICK_ACTIONS.length - 1 && "col-span-2",
        i === 0
          ? "border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border/70 bg-card text-foreground hover:border-primary/50 hover:text-primary",
      );
      const inner = (
        <>
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", i === 0 ? "bg-primary-foreground/15" : "bg-primary/10 text-primary")}>
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="whitespace-nowrap">{label}</span>
        </>
      );
      return external ? (
        <a key={label} href={to} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={cls}>{inner}</a>
      ) : (
        <Link key={label} to={to} onClick={onNavigate} className={cls}>{inner}</Link>
      );
    })}
  </div>
);
