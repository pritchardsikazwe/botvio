import { ReactNode } from "react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface MarketPageLayoutProps {
  title: string;
  description: string;
  emoji: string;
  children: ReactNode;
  /** Optional SEO registry key for translated meta (falls back to literal title/description). */
  seoKey?: string;
}

export const MarketPageLayout = ({ title, description, emoji, children, seoKey }: MarketPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <SEOHead title={title} description={description} seoKey={seoKey} />
    <Header />
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/markets"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <span className="text-2xl">{emoji}</span> {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </main>
  </div>
);
