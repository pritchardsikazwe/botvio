import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const CaseStudies = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="caseStudies" title="Case Studies" description="Botvio internal case studies." noIndex />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Badge variant="outline" className="mb-4">Admin Only</Badge>
        <h1 className="text-3xl font-bold mb-4">Case Studies</h1>
        <p className="text-muted-foreground">Internal case studies for admin review only.</p>
      </main>
    </div>
  );
};

export default CaseStudies;
