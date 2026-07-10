import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, Signal, BookOpen, TrendingUp, Mail } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Page Not Found | Botvio" description="The page you're looking for doesn't exist. Explore Botvio's forex signals, gold trading, AI chart analysis and more." noIndex />
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <p className="text-7xl font-extrabold text-primary mb-2">404</p>
        <h1 className="text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page <span className="font-mono text-sm">{location.pathname}</span> doesn't exist or has moved. Try one of these popular destinations:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <Button variant="outline" asChild className="justify-start h-auto py-3"><Link to="/"><Home className="h-4 w-4 mr-2" /> Home</Link></Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3"><Link to="/signals"><Signal className="h-4 w-4 mr-2" /> Live Signals</Link></Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3"><Link to="/gold-trading-hub"><TrendingUp className="h-4 w-4 mr-2" /> Gold Hub</Link></Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3"><Link to="/learn"><BookOpen className="h-4 w-4 mr-2" /> Learn</Link></Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3"><Link to="/blog"><BookOpen className="h-4 w-4 mr-2" /> Blog</Link></Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3"><Link to="/contact"><Mail className="h-4 w-4 mr-2" /> Contact Support</Link></Button>
        </div>
        <Button asChild size="lg"><Link to="/">Return to homepage</Link></Button>
      </main>
    </div>
  );
};

export default NotFound;
