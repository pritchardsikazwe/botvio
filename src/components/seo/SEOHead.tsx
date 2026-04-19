import { Helmet } from "react-helmet";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { languages, DEFAULT_LANGUAGE, type LanguageCode } from "@/i18n";
import { getSeoEntry } from "@/i18n/seoRegistry";
import { buildLocalizedPath } from "@/i18n/useLocalized";

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
  /** When set, pulls translated title/description/keywords from seoRegistry. */
  seoKey?: string;
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
}: SEOHeadProps) => {
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const { i18n } = useTranslation();

  const lang = (i18n.language?.split("-")[0] || DEFAULT_LANGUAGE) as LanguageCode;
  const siteName = settings?.site_name || "Botvio";
  const baseUrl =
    settings?.canonical_base_url || settings?.site_url || "https://botvio.live";

  // Pull translated SEO entry (with English fallback)
  const seo = seoKey ? getSeoEntry(seoKey, lang) : null;

  const pageTitle = title
    ? `${title} | ${siteName}`
    : seo?.title
    ? `${seo.title} | ${siteName}`
    : settings?.meta_title_default || `${siteName} – AI Trading Bots & Signals`;

  const pageDescription =
    description ||
    seo?.description ||
    settings?.meta_description_default ||
    "Automate your trading with AI bots, live signals, and copy trading.";

  const pageKeywords = seo?.keywords || settings?.meta_keywords || undefined;

  const ogImageRaw = ogImage || settings?.og_image_url || "/botvio-logo.png";
  const pageOgImage = toAbsoluteUrl(ogImageRaw, baseUrl);

  // Canonical = localized URL for the current language
  const canonicalPath = buildLocalizedPath(location.pathname, lang);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  // Hreflang alternates: one per language + x-default → English
  const alternates = languages.map((l) => ({
    code: l.code,
    href: `${baseUrl}${buildLocalizedPath(
      // Always build alternates from the canonical English path
      location.pathname.replace(new RegExp(`^/${lang}(/|$)`, "i"), "/"),
      l.code as LanguageCode
    )}`,
  }));
  const xDefaultHref = `${baseUrl}${location.pathname.replace(
    new RegExp(`^/${lang}(/|$)`, "i"),
    "/"
  )}`;

  const robotsContent = noIndex
    ? "noindex, nofollow"
    : `${settings?.robots_index !== false ? "index" : "noindex"}, ${
        settings?.robots_follow !== false ? "follow" : "nofollow"
      }`;

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
          target: `${baseUrl}/marketplace?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
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

      {/* Hreflang alternates */}
      {alternates.map((a) => (
        <link key={a.code} rel="alternate" hrefLang={a.code} href={a.href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={xDefaultHref} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:image:alt" content={`${siteName} app icon`} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={lang} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />
      <meta name="twitter:image:alt" content={`${siteName} app icon`} />

      {/* Verification */}
      {settings?.google_verification_code && (
        <meta name="google-site-verification" content={settings.google_verification_code} />
      )}
      {settings?.bing_verification_code && (
        <meta name="msvalidate.01" content={settings.bing_verification_code} />
      )}

      <script type="application/ld+json">{JSON.stringify(jsonLd || defaultJsonLd)}</script>
    </Helmet>
  );
};
