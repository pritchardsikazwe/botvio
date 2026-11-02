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
const START_KEY = "botvio_page_started_at";
const CONSENT_EVENT = "botvio:cookie-consent-updated";

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
    const previousPath = sessionStorage.getItem(PREV_KEY);
    const previousStartedAt = Number(sessionStorage.getItem(START_KEY) || Date.now());
    const startedAt = Date.now();
    const query = new URLSearchParams(location.search);
    const externalReferrer = document.referrer || "";
    const source = query.get("utm_source") || sourceFrom(externalReferrer);
    const baseEvent = {
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: userRef.current || null,
      referrer: previousPath
        ? new URL(previousPath, window.location.origin).toString()
        : externalReferrer,
      source,
      medium: query.get("utm_medium"),
      campaign: query.get("utm_campaign"),
      device_type: deviceType(),
    };

    let durationRecorded = false;
    const recordPreviousPageTime = () => {
      if (!previousPath || durationRecorded) return;
      durationRecorded = true;
      void insertAnalyticsEvent({
        ...baseEvent,
        event_name: "page_time",
        path: previousPath.split("?")[0],
        metadata: { duration_seconds: Math.max(0, Math.round((startedAt - previousStartedAt) / 1000)) },
      });
    };

    if (previousPath && previousPath !== currentPath) recordPreviousPageTime();

    sessionStorage.setItem(PREV_KEY, currentPath);
    sessionStorage.setItem(START_KEY, String(startedAt));

    void insertAnalyticsEvent({
      ...baseEvent,
      event_name: "page_view",
      path: location.pathname,
      referrer: previousPath
        ? new URL(previousPath, window.location.origin).toString()
        : externalReferrer,
      metadata: {
        title: document.title,
        page_location: window.location.href,
        landing_page: !previousPath,
      },
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
        metadata: { title: document.title },
      });
    }

    const onPageHide = () => recordPreviousPageTime();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      recordPreviousPageTime();
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
