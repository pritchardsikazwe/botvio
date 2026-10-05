import { Helmet } from "react-helmet";
import { BASE_URL, PRODUCTION_DOMAIN } from "@/config/domain";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { languages, DEFAULT_LANGUAGE, type LanguageCode } from "@/i18n";
import { getSeoEntry } from "@/i18n/seoRegistry";
import { buildLocalizedPath, stripLocalePrefix } from "@/i18n/useLocalized";

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
  seoKey?: string;
  canonicalUrlOverride?: string;
  alternateLocales?: Array<{ code: string; href: string }>;
}

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function toAbsoluteUrl(input: string, baseUrl: string): string {
  if (isAbsoluteUrl(input)) return input;
  if (input.startsWith("/")) return `${baseUrl}${input}`;
  return `${baseUrl}/${input}`;
}

export const SEOHead = ({
  title,
  description,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
  seoKey,
  canonicalUrlOverride,
  alternateLocales,
}: SEOHeadProps) => {
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const { i18n } = useTranslation();

  const lang = (i18n.language?.split("-")[0] || DEFAULT_LANGUAGE) as LanguageCode;
  const siteName = settings?.site_name || "Botvio";
  // Canonical origin is fixed in src/config/domain.ts — never derive it from DB/host.
  const baseUrl = BASE_URL;
  const { path: canonicalPathFromUrl } = stripLocalePrefix(location.pathname);
  const canonicalPath = canonicalPathFromUrl || "/";
  // Canonical origin is fixed in src/config/domain.ts — never derive it from DB/host.
  const hostIsCanonical =
    typeof window === "undefined" || window.location.hostname.toLowerCase() === PRODUCTION_DOMAIN;

  const seo = seoKey ? getSeoEntry(seoKey, lang) : null;
  // Avoid "… | Botvio | Botvio" when the base title already ends with the brand.
  const withBrand = (t: string) => (/\|\s*Botvio\s*$/i.test(t) || t.trim() === siteName ? t : `${t} | ${siteName}`);
  const pageTitle = title
    ? withBrand(title)
    : seo?.title
    ? withBrand(seo.title)
    : settings?.meta_title_default || `${siteName} – AI Trading Bots & Signals`;
  const pageDescription = description || seo?.description || settings?.meta_description_default || "Automate your trading with AI bots, live signals, and copy trading.";
  const pageKeywords = seo?.keywords || settings?.meta_keywords || undefined;
  const pageOgImage = toAbsoluteUrl(ogImage || settings?.og_image_url || "/botvio-og.jpg", baseUrl);

  // Always canonicalize from the locale-stripped route. This prevents /es/es/... duplicates.
  const canonicalUrl = canonicalUrlOverride || `${baseUrl}${canonicalPath}`;
  const alternates = languages.map((l) => ({
    code: l.code,
    href: `${baseUrl}${buildLocalizedPath(canonicalPath, l.code as LanguageCode)}`,
  }));
  const xDefaultHref = `${baseUrl}${buildLocalizedPath(canonicalPath, DEFAULT_LANGUAGE)}`;
  const renderedAlternates = alternateLocales || alternates;

  // Lovable preview/staging hosts must not become searchable duplicate copies.
  const robotsContent = !hostIsCanonical || noIndex
    ? "noindex, nofollow"
    : `${settings?.robots_index !== false ? "index" : "noindex"}, ${settings?.robots_follow !== false ? "follow" : "nofollow"}`;

  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        url: baseUrl,
        logo: toAbsoluteUrl(settings?.logo_url || "/botvio-logo.png", baseUrl),
      },
      {
        "@type": "WebSite",
        name: siteName,
        url: baseUrl,
        inLanguage: lang,
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/blog?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Botvio",
        url: baseUrl,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description: "AI-focused trading platform providing market research, trading signals, chart analysis, automated strategies and copy-trading workflows.",
      },
    ],
  };

  return (
    <Helmet htmlAttributes={{ lang, dir: lang === "ar" || lang === "ur" ? "rtl" : "ltr" }}>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />
      {pageKeywords && <meta name="keywords" content={pageKeywords} />}
      {renderedAlternates.map((a) => <link key={a.code} rel="alternate" hrefLang={a.code} href={a.href} />)}
      <link rel="alternate" hrefLang="x-default" href={xDefaultHref} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:image:alt" content={`${siteName} — AI forex signals, gold trading & chart analysis`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={lang === "en" ? "en_US" : lang} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />
      {settings?.google_verification_code && <meta name="google-site-verification" content={settings.google_verification_code} />}
      {settings?.bing_verification_code && <meta name="msvalidate.01" content={settings.bing_verification_code} />}
      <script type="application/ld+json">{JSON.stringify(jsonLd || defaultJsonLd)}</script>
    </Helmet>
  );
};
