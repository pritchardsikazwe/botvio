import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EconomicEvent {
  date?: string;
  time_utc?: string;
  time_et?: string;
  all_day?: boolean;
  name?: string;
  title?: string;
  impact?: "high" | "medium" | "low" | string;
  category?: string;
  consensus?: string | null;
  prior?: string | null;
  actual?: string | null;
  currency?: string | null;
  country?: string | null;
  url?: string | null;
}

interface CalendarResponse {
  events?: EconomicEvent[];
}

function dateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function normaliseEvents(payload: CalendarResponse | EconomicEvent[]): EconomicEvent[] {
  const events = Array.isArray(payload) ? payload : payload?.events ?? [];
  return events
    .filter((event) => event && (event.time_utc || event.date))
    .sort((a, b) => new Date(a.time_utc || a.date || 0).getTime() - new Date(b.time_utc || b.date || 0).getTime());
}

export function useEconomicCalendar(days = 7) {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const { data, error: invokeError } = await supabase.functions.invoke("news-intelligence-worker", {
        body: { mode: "refresh" },
      });
      if (invokeError) throw invokeError;
      const raw = Array.isArray(data?.events) ? data.events : [];
      const now = Date.now();
      const horizon = now + Math.min(days, 30) * 24 * 60 * 60 * 1000;
      const liveEvents = raw
        .filter((event: any) => event?.time && !Number.isNaN(new Date(event.time).getTime()))
        .filter((event: any) => {
          const t = new Date(event.time).getTime();
          return t >= now - 30 * 60 * 1000 && t <= horizon;
        })
        .map((event: any) => ({
          time_utc: event.time,
          date: event.time?.slice(0, 10),
          title: event.event,
          name: event.event,
          impact: String(event.impact || "medium").toLowerCase(),
          consensus: event.estimate ?? null,
          prior: event.prev ?? null,
          actual: event.actual ?? null,
          currency: event.currency ?? null,
          country: event.country ?? null,
        }))
        .sort((a: EconomicEvent, b: EconomicEvent) =>
          new Date(a.time_utc || a.date || 0).getTime() - new Date(b.time_utc || b.date || 0).getTime()
        );
      setEvents(liveEvents);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load economic calendar");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { events, loading, error, lastUpdated, refresh };
}

export function eventTimeInCat(event: EconomicEvent) {
  if (!event.time_utc) return "All day";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(event.time_utc)) + " CAT";
}

export function eventDateInCat(event: EconomicEvent) {
  if (!event.time_utc) return event.date || "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    day: "2-digit",
    month: "short",
  }).format(new Date(event.time_utc));
}

export function eventCurrency(event: EconomicEvent) {
  if (event.currency) return event.currency;
  const title = (event.title || event.name || "").toUpperCase();
  if (title.includes("US ") || title.includes("U.S.") || title.includes("FED") || title.includes("FOMC")) return "USD";
  if (title.includes("EURO") || title.includes("ECB")) return "EUR";
  if (title.includes("UK ") || title.includes("BOE") || title.includes("BRITAIN")) return "GBP";
  if (title.includes("JAPAN") || title.includes("BOJ")) return "JPY";
  return "GLOBAL";
}
