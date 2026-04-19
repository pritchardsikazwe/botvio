import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Newspaper, Download, ExternalLink } from "lucide-react";

const pressReleases = [
  { date: "2026-02-15", title: "Botvio Launches AI-Powered Strategy Suite", excerpt: "Botvio today announced the launch of its AI strategy suite, featuring 8 specialized trading engines for Deriv synthetic indices. The suite includes pattern-based digit prediction, AI spike detection for Boom/Crash, and multi-timeframe trend analysis.", category: "Product" },
  { date: "2026-02-01", title: "Botvio Reaches 10,000 Active Traders Across 50 Countries", excerpt: "Botvio has surpassed 10,000 active traders across 50 countries, with strong growth in Africa, South Asia, and Latin America. The platform's AI-driven approach to synthetic index trading continues to attract traders seeking consistent, automated returns.", category: "Milestone" },
  { date: "2026-01-15", title: "Botvio Introduces Server-Side Trade Execution for Enhanced Security", excerpt: "Botvio has migrated all trade execution to server-side Edge Functions, eliminating client-side token exposure. This architecture upgrade ensures broker credentials are encrypted at rest and never reach the user's browser.", category: "Security" },
  { date: "2025-12-20", title: "Botvio Partners with Deriv for Official API Integration", excerpt: "Botvio has established an official integration with Deriv's API, enabling OAuth 2.0 authentication and direct trade execution on all synthetic indices. The partnership ensures reliable connectivity and access to the full range of contract types.", category: "Partnership" },
];

const Press = () => (
  <div className="min-h-screen bg-background">
    <SEOHead seoKey="press" title="Press & Media" description="Botvio press releases, media coverage, and company announcements. Stay updated on Botvio's AI trading platform developments." />
    <Header />
    <main className="container mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight">Press & Media</h1>
        <p className="text-muted-foreground">Latest news and announcements from Botvio.</p>
      </div>

      <div className="grid gap-6">
        {pressReleases.map((pr, i) => (
          <Card key={i}>
            <CardContent className="py-6 space-y-3">
              <div className="flex items-center gap-3">
                <Badge>{pr.category}</Badge>
                <span className="text-sm text-muted-foreground">{pr.date}</span>
              </div>
              <h2 className="text-xl font-bold">{pr.title}</h2>
              <p className="text-muted-foreground">{pr.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-6 space-y-3">
          <h2 className="text-xl font-bold">Media Contact</h2>
          <p className="text-muted-foreground">For press inquiries, partnership opportunities, or media requests, please reach out to us.</p>
          <p className="text-sm">Email: press@botvio.live</p>
        </CardContent>
      </Card>
    </main>
  </div>
);

export default Press;
