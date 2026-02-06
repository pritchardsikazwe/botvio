import { Helmet } from "react-helmet";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export const SEOHead = ({
  title,
  description,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: SEOHeadProps) => {
  const { data: settings } = useSiteSettings();
  const location = useLocation();

  const siteName = settings?.site_name || "Botvio";
  const baseUrl = settings?.canonical_base_url || settings?.site_url || "https://botvio.live";
  const pageTitle = title
    ? `${title} | ${siteName}`
    : settings?.meta_title_default || `${siteName} – AI Trading Bots & Signals`;
  const pageDescription =
    description ||
    settings?.meta_description_default ||
    "Automate your trading with AI bots, live signals, and copy trading.";
  const pageOgImage = ogImage || settings?.og_image_url || `${baseUrl}/favicon.png`;
  const canonicalUrl = `${baseUrl}${location.pathname}`;

  const robotsContent = noIndex
    ? "noindex, nofollow"
    : `${settings?.robots_index !== false ? "index" : "noindex"}, ${settings?.robots_follow !== false ? "follow" : "nofollow"}`;

  // Default Organization + WebSite JSON-LD
  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        url: baseUrl,
        logo: settings?.logo_url || `${baseUrl}/favicon.png`,
      },
      {
        "@type": "WebSite",
        name: siteName,
        url: baseUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/marketplace?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {settings?.meta_keywords && (
        <meta name="keywords" content={settings.meta_keywords} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />

      {/* Verification */}
      {settings?.google_verification_code && (
        <meta
          name="google-site-verification"
          content={settings.google_verification_code}
        />
      )}
      {settings?.bing_verification_code && (
        <meta name="msvalidate.01" content={settings.bing_verification_code} />
      )}

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd || defaultJsonLd)}
      </script>
    </Helmet>
  );
};
