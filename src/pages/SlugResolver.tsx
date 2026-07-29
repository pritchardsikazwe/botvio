import { useParams } from "react-router-dom";
import { useStrategy } from "@/hooks/useStrategies";
import StrategyDetail from "./StrategyDetail";
import CountryPage from "./CountryPage";
import NotFound from "./NotFound";
import { countryData } from "@/content/countryData";

/**
 * Resolves /:slug — checks if slug matches a strategy first,
 * otherwise falls back to CountryPage.
 */
const SlugResolver = () => {
  const { slug } = useParams<{ slug: string }>();

  // Skip file-like paths
  if (slug?.includes(".")) return null;

  const { data: strategy, isLoading } = useStrategy(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-48" />
        </div>
      </div>
    );
  }

  // If a strategy exists with this slug, render strategy detail
  if (strategy) {
    return <StrategyDetail />;
  }

  // If the slug matches a known country, render the country page
  if (slug && countryData[slug]) {
    return <CountryPage />;
  }

  // Truly unknown slug → proper 404 instead of "Country not found"
  return <NotFound />;
};

export default SlugResolver;
