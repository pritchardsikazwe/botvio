import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const Whitepaper = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Whitepaper" description="Botvio internal whitepaper." noIndex />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl prose dark:prose-invert">
        <Badge variant="outline" className="mb-4">Admin Only</Badge>
        <h1>Botvio Technical Whitepaper</h1>
        <p className="lead">Version 2.0 — February 2026</p>
        <p>Internal document covering AI signal generation, Markov chain analysis, EMA-based trading engines, and risk management architecture.</p>
      </main>
    </div>
  );
};

export default Whitepaper;
