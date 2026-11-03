import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  deviceType,
  getAnalyticsIdentity,
  hasAnalyticsConsent,
  sourceFrom,
} from "./analytics";

const PREV_KEY = "botvio_previous_path";
const ATTRIBUTION_KEY = "botvio_session_attribution";
const CONSENT_EVENT = "botvio:cookie-consent-updated";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function readSessionValue(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Analytics remains best-effort when browser storage is restricted.
  }
}

async function insertAnalyticsEvent(payload: Record<string, unknown>) {
  try {
    const { error } = await (supabase as any).from("analytics_events").insert(payload);
    if (error && import.meta.env.DEV) console.warn("[Botvio analytics] Event insert failed:", error.message);
  } catch (error) {
    if (import.meta.env.DEV) console.warn("[Botvio analytics] Event insert failed:", error);
  }
}

export function AnalyticsTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const userRef = useRef(user?.id);
  const [consentRevision, setConsentRevision] = useState(0);
  userRef.current = user?.id;

  useEffect(() => {
    const onConsentChange = () => setConsentRevision((revision) => revision + 1);
    window.addEventListener(CONSENT_EVENT, onConsentChange);
    return () => window.removeEventListener(CONSENT_EVENT, onConsentChange);
  }, []);

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;

    const { visitorId, sessionId } = getAnalyticsIdentity();
    const currentPath = location.pathname + location.search;
    const previousPath = readSessionValue(PREV_KEY);
    const query = new URLSearchParams(location.search);
    const externalReferrer = document.referrer || "";
    const storedAttribution = (() => {
      try {
        return JSON.parse(readSessionValue(ATTRIBUTION_KEY) || "null") as
          | { source?: string; medium?: string | null; campaign?: string | null }
          | null;
      } catch {
        return null;
      }
    })();
    const hasCampaignParams = query.has("utm_source") || query.has("utm_medium") || query.has("utm_campaign");
    const attribution = hasCampaignParams
      ? {
          source: query.get("utm_source") || sourceFrom(externalReferrer),
          medium: query.get("utm_medium"),
          campaign: query.get("utm_campaign"),
        }
      : storedAttribution || {
          source: sourceFrom(externalReferrer),
          medium: null,
          campaign: null,
        };
    if (!storedAttribution || hasCampaignParams) {
      writeSessionValue(ATTRIBUTION_KEY, JSON.stringify(attribution));
    }
    const source = attribution.source || "Direct";
    const campaign = attribution.campaign || null;
    const medium = attribution.medium || null;
    const startedAt = Date.now();

    const baseEvent = {
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: userRef.current || null,
      source,
      medium,
      campaign,
      device_type: deviceType(),
    };

    const pageReferrer = previousPath
      ? new URL(previousPath, window.location.origin).toString()
      : externalReferrer;

    writeSessionValue(PREV_KEY, currentPath);

    // Send one canonical virtual page_view per React Router navigation.
    void insertAnalyticsEvent({
      ...baseEvent,
      event_name: "page_view",
      path: location.pathname,
      referrer: pageReferrer,
      metadata: {
        title: document.title,
        page_location: window.location.href,
        landing_page: !previousPath,
      },
    });

    // GA4's automatic page_view is disabled in the tag config. We own SPA
    // pageviews here; disable GA4 Enhanced Measurement's browser-history
    // pageviews in the web stream to prevent duplicate events.
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_referrer: pageReferrer,
      });
    }
    window.dataLayer?.push({
      event: "botvio_virtual_page_view",
      page_title: document.title,
      page_location: window.location.href,
      page_referrer: pageReferrer,
    });

    const autoEvent = location.pathname.startsWith("/brokers/")
      ? "broker_page_view"
      : location.pathname.startsWith("/chart/")
        ? "ai_analysis_open"
        : location.pathname === "/signals"
          ? "signal_view"
          : location.pathname.startsWith("/markets") ||
              ["/gold", "/synthetic", "/synthetic-hub"].includes(location.pathname)
            ? "market_open"
            : null;

    if (autoEvent) {
      void insertAnalyticsEvent({
        ...baseEvent,
        event_name: autoEvent,
        path: location.pathname,
        referrer: pageReferrer,
        metadata: { title: document.title },
      });
    }

    let durationRecorded = false;
    const recordCurrentPageTime = () => {
      if (durationRecorded) return;
      durationRecorded = true;
      void insertAnalyticsEvent({
        ...baseEvent,
        event_name: "page_time",
        path: location.pathname,
        referrer: pageReferrer,
        metadata: { duration_seconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)) },
      });
    };

    window.addEventListener("pagehide", recordCurrentPageTime);
    return () => {
      window.removeEventListener("pagehide", recordCurrentPageTime);
      recordCurrentPageTime();
    };
  }, [location.pathname, location.search, consentRevision]);

  useEffect(() => {
    if (!user?.id || !hasAnalyticsConsent()) return;
    const { visitorId, sessionId } = getAnalyticsIdentity();
    void insertAnalyticsEvent({
      event_name: "authenticated_session",
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: user.id,
      path: location.pathname,
      device_type: deviceType(),
      metadata: {},
    });
  }, [user?.id, consentRevision]);

  return null;
}
