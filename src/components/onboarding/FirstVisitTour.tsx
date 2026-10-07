import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type TourStep = {
  id: string;
  title: string;
  description: string;
  selectors: string[];
};

const STORAGE_KEY = "botvio_first_visit_tour_v1";

const STEPS: TourStep[] = [
  {
    id: "markets",
    title: "Markets",
    description: "Explore live instruments, charts, prices and market information.",
    selectors: ['[data-tour="nav-markets"]', '[data-tour="markets"]'],
  },
  {
    id: "signals",
    title: "Signals",
    description: "Check BOTVIO's trading signals and review opportunities across supported markets.",
    selectors: ['[data-tour="nav-signals"]', '[data-tour="signals"]'],
  },
  {
    id: "ai-bots",
    title: "AI Bots",
    description: "Explore automated trading bots and AI-powered trading tools.",
    selectors: ['[data-tour="nav-ai-bots"]', '[data-tour="ai-bots"]'],
  },
  {
    id: "copy-trading",
    title: "Copy Trading",
    description: "Discover providers and follow supported trading strategies.",
    selectors: ['[data-tour="nav-copy-trading"]', '[data-tour="copy-trading"]'],
  },
  {
    id: "deriv",
    title: "DERIV",
    description: "Explore the Deriv trading area, demo tools and Deriv-specific markets.",
    selectors: ['[data-tour="nav-deriv"]', '[data-tour="nav-trade"]', '[data-tour="deriv"]', '[data-tour="trade"]'],
  },
  {
    id: "ai",
    title: "AI",
    description: "Use AI-powered chart analysis, market scanning and strategy tools.",
    selectors: ['[data-tour="nav-ai"]', '[data-tour="ai"]'],
  },
  {
    id: "learn",
    title: "Learn",
    description: "Learn the platform and improve your understanding of trading and the markets.",
    selectors: ['[data-tour="nav-learn"]', '[data-tour="learn"]'],
  },
  {
    id: "more",
    title: "More",
    description: "Find additional platform tools, support, account features and settings.",
    selectors: ['[data-tour="nav-more"]', '[data-tour="more"]'],
  },
];

const findTarget = (selectors: string[]) => {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) return element;
  }
  return null;
};

const findFallbackByText = (labels: string[]) => {
  const wanted = labels.map((label) => label.trim().toLowerCase());
  return Array.from(document.querySelectorAll<HTMLElement>("button, a")).find((element) => {
    const text = element.textContent?.trim().replace(/\s+/g, " ").toLowerCase();
    return text ? wanted.includes(text) : false;
  }) ?? null;
};

const getTarget = (step: TourStep) =>
  findTarget(step.selectors) ??
  findFallbackByText(
    step.id === "ai-bots" ? ["AI Bots"] :
    step.id === "copy-trading" ? ["Copy Trading"] :
    step.id === "deriv" ? ["DERIV", "Trade"] :
    [step.title],
  );

export const FirstVisitTour = () => {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const availableSteps = useMemo(() => {
    if (!open) return [];
    return STEPS.filter((step) => getTarget(step));
  }, [open]);

  const currentStep = availableSteps[Math.min(stepIndex, Math.max(availableSteps.length - 1, 0))];

  const finish = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "seen");
    setOpen(false);
    setRect(null);
    document.body.style.overflow = "";
  }, []);

  const updatePosition = useCallback(() => {
    if (!currentStep) return;
    const target = getTarget(currentStep);
    if (!target) return;
    const nextRect = target.getBoundingClientRect();
    setRect(nextRect);
  }, [currentStep]);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    updatePosition();

    const onUpdate = () => updatePosition();
    window.addEventListener("resize", onUpdate);
    window.addEventListener("scroll", onUpdate, true);

    return () => {
      window.removeEventListener("resize", onUpdate);
      window.removeEventListener("scroll", onUpdate, true);
      document.body.style.overflow = "";
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open && availableSteps.length === 0) {
      finish();
    }
  }, [open, availableSteps.length, finish]);

  useEffect(() => {
    if (stepIndex >= availableSteps.length && availableSteps.length > 0) {
      setStepIndex(availableSteps.length - 1);
    }
  }, [stepIndex, availableSteps.length]);

  if (!open || !currentStep || !rect) return null;

  const padding = 6;
  const top = Math.max(8, rect.top - padding);
  const left = Math.max(8, rect.left - padding);
  const right = Math.min(window.innerWidth - 8, rect.right + padding);
  const bottom = Math.min(window.innerHeight - 8, rect.bottom + padding);

  const tooltipWidth = Math.min(360, window.innerWidth - 32);
  const placeBelow = bottom + 170 <= window.innerHeight;
  const tooltipTop = placeBelow ? bottom + 14 : Math.max(16, top - 170);
  const tooltipLeft = Math.min(
    Math.max(16, left + rect.width / 2 - tooltipWidth / 2),
    window.innerWidth - tooltipWidth - 16,
  );

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === availableSteps.length - 1;

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((value) => value + 1);
  };

  const goBack = () => setStepIndex((value) => Math.max(0, value - 1));

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-live="polite">
      <div className="absolute inset-x-0 top-0 bg-black/65 pointer-events-auto" style={{ height: top }} />
      <div
        className="absolute left-0 right-0 bg-black/65 pointer-events-auto"
        style={{ top: bottom, bottom: 0 }}
      />
      <div
        className="absolute left-0 bg-black/65 pointer-events-auto"
        style={{ top, width: left, height: bottom - top }}
      />
      <div
        className="absolute right-0 bg-black/65 pointer-events-auto"
        style={{ top, width: window.innerWidth - right, height: bottom - top }}
      />

      <div
        className="absolute rounded-xl border-2 border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.18),0_8px_30px_rgba(0,0,0,0.35)]"
        style={{ top, left, width: right - left, height: bottom - top }}
      />

      <div
        className="absolute pointer-events-auto rounded-2xl border border-border bg-background p-4 shadow-2xl"
        style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              BOTVIO QUICK TOUR · {stepIndex + 1}/{availableSteps.length}
            </p>
            <h2 className="mt-1 text-base font-bold">{currentStep.title}</h2>
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          {currentStep.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={isFirst}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          <Button type="button" size="sm" onClick={goNext}>
            {isLast ? "Start Exploring" : "Next"}
            {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>

        <button
          type="button"
          onClick={finish}
          className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Skip tour
        </button>
      </div>
    </div>
  );
};
