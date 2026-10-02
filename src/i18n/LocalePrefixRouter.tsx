import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, languages, type LanguageCode } from "./index";

const LANG_CODES = new Set(languages.map((l) => l.code as string));

/**
 * Detects /xx/ locale prefixes in the URL.
 * - Sets i18n language to match the prefix.
 * - Rewrites the URL to the canonical (un-prefixed) path so the rest of
 *   <AppRoutes> matches normally.
 * - Normalizes /en/... → /... to avoid duplicate-content indexing.
 */
export const LocalePrefixRouter = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const segment = useMemo(
    () => location.pathname.split("/")[1]?.toLowerCase() ?? "",
    [location.pathname]
  );

  useEffect(() => {
    if (!segment || !LANG_CODES.has(segment)) return;

    const keepArabicLocalizedUrl = segment === "ar" && (location.pathname === "/ar/dubai" || location.pathname.startsWith("/ar/blog/") || location.pathname === "/ar/saudi-arabia" || location.pathname.startsWith("/ar/saudi-blog/"));
    if (keepArabicLocalizedUrl) {
      if (i18n.language !== segment) i18n.changeLanguage(segment as LanguageCode);
      return;
    }

    const rest = location.pathname.replace(/^\/[a-z]{2}(\/|$)/i, "/");
    const fullRest = rest + location.search + location.hash;

    if (segment === DEFAULT_LANGUAGE) {
      // /en/... → /...
      navigate(fullRest, { replace: true });
      return;
    }

    // Set language from URL (URL is source of truth for SEO)
    if (i18n.language !== segment) {
      i18n.changeLanguage(segment as LanguageCode);
    }

    // Strip prefix so inner routes match
    navigate(fullRest, { replace: true });
  }, [segment, location.pathname, location.search, location.hash, navigate, i18n]);

  return <>{children}</>;
};
