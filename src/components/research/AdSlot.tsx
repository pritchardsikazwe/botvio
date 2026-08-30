import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * AdSense-safe advertisement container.
 *
 * - Always labelled "Advertisement" so it can never be mistaken for a Botvio
 *   signal, broker recommendation or trading control.
 * - Reserves its height before load to avoid layout shift (CLS).
 * - Never rendered over charts, buttons or navigation.
 *
 * AdSense markup only mounts when a publisher/slot id is configured, so no
 * empty ad frames or fake ad buttons are shown.
 */

const PUBLISHER_ID = "ca-pub-8741937856196827";

export type AdPlacement = "below-intro" | "in-content" | "sidebar" | "before-related" | "end-of-article";

const SIZES: Record<AdPlacement, { minHeight: number; className?: string }> = {
  "below-intro": { minHeight: 120 },
  "in-content": { minHeight: 250 },
  sidebar: { minHeight: 320 },
  "before-related": { minHeight: 120 },
  "end-of-article": { minHeight: 250 },
};

interface AdSlotProps {
  placement: AdPlacement;
  /** AdSense ad unit id. When omitted a reserved, clearly-labelled placeholder is shown. */
  slotId?: string;
  label?: "Advertisement" | "Sponsored";
  className?: string;
}

export const AdSlot = ({ placement, slotId, label = "Advertisement", className }: AdSlotProps) => {
  const ref = useRef<HTMLModElement | null>(null);
  const { minHeight } = SIZES[placement];

  useEffect(() => {
    if (!slotId || !ref.current) return;
    try {
      // @ts-expect-error — adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense not loaded yet — the reserved space stays empty */
    }
  }, [slotId]);

  return (
    <aside
      aria-label={label}
      className={cn(
        "not-prose my-8 overflow-hidden rounded-xl border border-dashed border-border/70 bg-muted/20",
        className,
      )}
    >
      <div className="border-b border-border/50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center justify-center px-3 py-3" style={{ minHeight }}>
        {slotId ? (
          <ins
            ref={ref as never}
            className="adsbygoogle block w-full"
            style={{ display: "block", minHeight }}
            data-ad-client={PUBLISHER_ID}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <span className="text-xs text-muted-foreground/70">Ad space reserved</span>
        )}
      </div>
    </aside>
  );
};

/**
 * Decides how many in-content ad opportunities an article gets.
 * Long-form gets 2–4, short articles 1–2, and mobile stays conservative.
 */
export const adOpportunities = (wordCount: number, isMobile: boolean) => {
  if (wordCount > 2600) return isMobile ? 2 : 4;
  if (wordCount > 1400) return isMobile ? 1 : 3;
  if (wordCount > 700) return isMobile ? 1 : 2;
  return 1;
};
