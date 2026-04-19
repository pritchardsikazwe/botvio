import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { stripLocalePrefix } from "./useLocalized";
import { DEFAULT_LANGUAGE, languages, type LanguageCode } from "./index";

const LANG_CODES = new Set(languages.map((l) => l.code as string));

/**
 * Sits inside <BrowserRouter>. Reads the first path segment; if it's a
 * supported non-default locale, sets the active language. Always strips
 * the prefix so the rest of <Routes> matches canonical English paths.
 *
 * Also normalizes `/en/...` → `/...` to avoid duplicate-content indexing.
 */
export const LocalePrefixRouter = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    const segment = location.pathname.split("/")[1]?.toLowerCase();
    if (!segment || !LANG_CODES.has(segment)) return;

    // /en/... → strip to / canonical
    if (segment === DEFAULT_LANGUAGE) {
      const rest = location.pathname.replace(/^\/en(\/|$)/, "/");
      navigate(rest + location.search + location.hash, { replace: true });
      return;
    }

    // Set i18n language to match URL prefix
    if (i18n.language !== segment) {
      i18n.changeLanguage(segment as LanguageCode);
    }
  }, [location.pathname, location.search, location.hash, navigate, i18n]);

  return <>{children}</>;
};

/**
 * Wrapper Routes — strips the locale prefix from pathname before
 * matching against the inner <Route> declarations. We do this by
 * replacing window.history "virtually": React Router's matchers run
 * against `location.pathname`, so we instead use a CSR redirect when
 * the prefix is present (handled in LocalePrefixRouter above) AND
 * we mount a parallel <Routes basename={lang}> alternative.
 *
 * Simpler & more robust approach: just register every route TWICE in
 * App.tsx — once at canonical path and once nested under `/:lang/*`.
 * That's what `LocalizedRoutes` does (see App.tsx).
 */
export function getCanonicalPath(pathname: string): string {
  return stripLocalePrefix(pathname).path;
}
