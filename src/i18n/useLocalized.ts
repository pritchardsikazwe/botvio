import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { languages, DEFAULT_LANGUAGE, type LanguageCode } from "./index";

const LANG_CODES = languages.map((l) => l.code as string);

/**
 * Strips the leading locale segment from a pathname if present.
 *   /es/signals  → /signals
 *   /signals     → /signals
 */
export function stripLocalePrefix(pathname: string): {
  path: string;
  lang: LanguageCode | null;
} {
  const m = pathname.match(/^\/([a-z]{2})(\/|$)(.*)$/i);
  if (m && LANG_CODES.includes(m[1].toLowerCase())) {
    const lang = m[1].toLowerCase() as LanguageCode;
    const rest = `/${m[3] ?? ""}`.replace(/\/+$/, "") || "/";
    return { path: rest, lang };
  }
  return { path: pathname, lang: null };
}

/**
 * Builds the localized URL for a canonical English path.
 * English stays at the root (no /en prefix) to avoid duplicate index.
 */
export function buildLocalizedPath(path: string, lang: LanguageCode): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LANGUAGE) return clean;
  if (clean === "/") return `/${lang}`;
  return `/${lang}${clean}`;
}

/**
 * React hook returning the current canonical (English) path and active locale.
 */
export function useLocalized() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const lang = (i18n.language?.split("-")[0] || DEFAULT_LANGUAGE) as LanguageCode;
  const { path: canonicalPath } = stripLocalePrefix(location.pathname);
  return {
    lang,
    canonicalPath,
    /** Build a localized href in the active language. */
    href: (path: string) => buildLocalizedPath(path, lang),
    /** Build a localized href in any language. */
    hrefIn: (path: string, l: LanguageCode) => buildLocalizedPath(path, l),
  };
}
