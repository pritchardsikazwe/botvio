import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerCrumb {
  label: string;
  to?: string;
}

export interface BannerFeature {
  icon: LucideIcon;
  label: string;
  sub?: string;
}

export interface BannerStat {
  icon?: LucideIcon;
  value: string;
  label: string;
}

interface PageBannerProps {
  /** Leading part of the title, rendered in foreground. */
  title: string;
  /** Trailing word rendered in the Botvio gold accent. */
  accent?: string;
  description?: string;
  crumbs?: BannerCrumb[];
  features?: BannerFeature[];
  stats?: BannerStat[];
  /** Primary action rendered under the description. */
  action?: ReactNode;
  /** Right-hand panel (tables, cards, live data). */
  aside?: ReactNode;
  className?: string;
}

/**
 * Shared banner for every internal Botvio page: breadcrumbs, headline,
 * capability chips, an optional live data panel and a stats strip.
 * Presentation only — all data is supplied by the calling page.
 */
export const PageBanner = ({
  title,
  accent,
  description,
  crumbs,
  features,
  stats,
  action,
  aside,
  className,
}: PageBannerProps) => (
  <section
    className={cn(
      "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl",
      className,
    )}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        background:
          "radial-gradient(120% 90% at 0% 0%, hsl(var(--primary) / 0.10), transparent 60%), radial-gradient(80% 70% at 100% 100%, hsl(var(--primary) / 0.06), transparent 65%)",
      }}
    />

    <div className={cn("relative grid gap-6 p-5 sm:p-7", aside && "lg:grid-cols-2 lg:gap-8")}>
      <div className="flex min-w-0 flex-col">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />}
                  {c.to ? (
                    <Link to={c.to} className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
          {accent && <span className="text-primary"> {accent}</span>}
        </h1>

        {description && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}

        {action && <div className="mt-5 flex flex-wrap gap-2">{action}</div>}

        {features && features.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {features.map(({ icon: Icon, label, sub }) => (
              <li
                key={label}
                className="rounded-xl border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40"
              >
                <Icon className="mb-2 h-4 w-4 text-primary" aria-hidden />
                <p className="text-xs font-semibold text-foreground">{label}</p>
                {sub && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sub}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {aside && <div className="min-w-0">{aside}</div>}
    </div>

    {stats && stats.length > 0 && (
      <div className="relative grid grid-cols-2 gap-px border-t border-border/60 bg-border/40 sm:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-2 bg-card/70 px-4 py-3">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{value}</p>
              <p className="truncate text-[11px] text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);
