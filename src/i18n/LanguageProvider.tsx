import { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { languages, countryToLanguage, type LanguageCode } from "./index";

const STORAGE_KEY = "botvio_lang";
const GEO_DONE_KEY = "botvio_lang_geo_done";

async function detectLanguageFromIP(): Promise<LanguageCode | null> {
  try {
    // Free, no-key endpoint — limited to ~1000/day per IP, perfect for first-visit detection.
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const country: string | undefined = data?.country_code;
    if (!country) return null;
    const lang = countryToLanguage[country.toUpperCase()];
    return lang ?? null;
  } catch {
    return null;
  }
}

/**
 * Wraps the app: applies <html lang/dir> on language change and triggers
 * a one-time IP-based language detection on first visit (when no manual
 * preference has been stored).
 */
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();

  // Sync <html lang> + <html dir> whenever language changes
  useEffect(() => {
    const apply = (lng: string) => {
      const meta = languages.find((l) => l.code === lng) ?? languages[0];
      document.documentElement.lang = meta.code;
      document.documentElement.dir = meta.dir;
    };
    apply(i18n.language || "en");
    i18n.on("languageChanged", apply);
    return () => {
      i18n.off("languageChanged", apply);
    };
  }, [i18n]);

  // First-visit IP-based detection
  useEffect(() => {
    const hasStored = localStorage.getItem(STORAGE_KEY);
    const geoDone = localStorage.getItem(GEO_DONE_KEY);
    if (hasStored || geoDone) return;

    let cancelled = false;
    detectLanguageFromIP().then((lang) => {
      if (cancelled) return;
      localStorage.setItem(GEO_DONE_KEY, "1");
      if (lang && lang !== i18n.language) {
        i18n.changeLanguage(lang);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [i18n]);

  return <>{children}</>;
};
