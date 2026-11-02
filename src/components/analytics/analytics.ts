import { supabase } from "@/integrations/supabase/client";

export const VISITOR_KEY = "botvio_visitor_id";
export const SESSION_KEY = "botvio_session_id";
const SESSION_LAST_SEEN_KEY = "botvio_session_last_seen";
const CONSENT_KEY = "botvio:cookie-consent:v1";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const VISITOR_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

type StoredVisitor = { id: string; createdAt: number };

export const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);

export const storage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing or restricted webviews.
  }
};

export function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.value === "accepted";
  } catch {
    return false;
  }
}

function getVisitorId(): string {
  try {
    const raw = localStorage.getItem(VISITOR_KEY);
    if (raw) {
      // Migrate the previous plain-string visitor ID without resetting returning users.
      try {
        const parsed = JSON.parse(raw) as StoredVisitor;
        if (parsed?.id && Date.now() - parsed.createdAt < VISITOR_MAX_AGE_MS) return parsed.id;
      } catch {
        if (raw.length > 5) {
          localStorage.setItem(VISITOR_KEY, JSON.stringify({ id: raw, createdAt: Date.now() }));
          return raw;
        }
      }
    }
    const id = makeId();
    localStorage.setItem(VISITOR_KEY, JSON.stringify({ id, createdAt: Date.now() }));
    return id;
  } catch {
    return makeId();
  }
}

function getSessionId(): string {
  const now = Date.now();
  try {
    const lastSeen = Number(sessionStorage.getItem(SESSION_LAST_SEEN_KEY) || 0);
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId || !lastSeen || now - lastSeen > SESSION_TIMEOUT_MS) {
      sessionId = makeId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    sessionStorage.setItem(SESSION_LAST_SEEN_KEY, String(now));
    return sessionId;
  } catch {
    return makeId();
  }
}

export function getAnalyticsIdentity() {
  return { visitorId: getVisitorId(), sessionId: getSessionId() };
}

export function deviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua) || (navigator.maxTouchPoints > 1 && /macintosh/.test(ua))) return "tablet";
  if (/mobile|android|iphone|ipod|windows phone/.test(ua)) return "mobile";
  return "desktop";
}

export function sourceFrom(referrer: string) {
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === location.hostname) return "Internal";
    if (/chatgpt\.com$|perplexity\.ai$|gemini\.google\.com$|copilot\.microsoft\.com$/.test(host)) return "AI Search";
    if (/google\./.test(host)) return "Google";
    if (/bing\.com$/.test(host)) return "Bing";
    if (/facebook|instagram|tiktok|linkedin|youtube|twitter|x\.com/.test(host)) return "Social";
    if (/lovable/.test(host)) return "Lovable";
    return host;
  } catch {
    return "Referral";
  }
}

export function trackBotvioEvent(event_name: string, metadata: Record<string, unknown> = {}) {
  if (!hasAnalyticsConsent()) return Promise.resolve({ data: null, error: null });

  const { visitorId, sessionId } = getAnalyticsIdentity();
  const params = new URLSearchParams(location.search);
  const referrer = document.referrer || "";
  const utmSource = params.get("utm_source");
  const source = utmSource || sourceFrom(referrer);

  return (supabase as any).from("analytics_events").insert({
    event_name,
    visitor_id: visitorId,
    session_id: sessionId,
    path: location.pathname,
    referrer,
    source,
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
    device_type: deviceType(),
    metadata,
  });
}
