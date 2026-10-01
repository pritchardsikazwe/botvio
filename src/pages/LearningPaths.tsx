import { Link } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Clock, Target } from "lucide-react";
import { learningPaths } from "@/content/learningPaths";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": learningPaths.map((p) => ({
    "@type": "Course",
    name: p.title,
    description: p.tagline,
    provider: { "@type": "Organization", name: "Botvio", url: "https://botvio.live" },
    educationalLevel: p.level,
    timeRequired: `PT${p.totalHours}H`,
    url: `https://botvio.live/learning-paths/${p.slug}`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${p.totalHours}H`,
    },
  })),
};

const LearningPaths = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Free Learning Paths — Start Trading The Right Way | Botvio"
      description="Three free, structured learning paths for forex, gold and synthetic indices — Beginner, Intermediate and Advanced. Curated by the Botvio Editorial Team."
    />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <Header />
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <span>Learning Paths</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <Badge variant="secondary" className="mb-3">Free curriculum</Badge>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
          Where should I start? Three free learning paths.
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Instead of scattering 200+ articles at you, we grouped the essential
          ones into three ordered paths. Work through them in sequence — each
          step estimates its reading time, and you can tick boxes as you go.
          Everything below is educational and free. No account required.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {learningPaths.map((path, idx) => (
          <Card key={path.slug} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={idx === 0 ? "default" : "outline"}>{path.level}</Badge>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{path.totalHours}h
                </span>
              </div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {path.title}
              </CardTitle>
              <CardDescription>{path.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="text-sm text-muted-foreground space-y-2 mb-4">
                <p className="flex gap-2"><Target className="w-4 h-4 mt-0.5 shrink-0" /><span><strong className="text-foreground">Outcome:</strong> {path.outcome}</span></p>
                <p><strong className="text-foreground">Prerequisites:</strong> {path.prerequisites}</p>
                <p><strong className="text-foreground">Steps:</strong> {path.steps.length}</p>
              </div>
              <Button asChild className="mt-auto">
                <Link to={`/learning-paths/${path.slug}`}>
                  Open path <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-14 prose prose-invert max-w-3xl">
        <h2>How to use these paths</h2>
        <p>
          Each step opens an existing lesson, article or hub on Botvio. Progress
          is stored in your browser — no sign-up required, no email harvested.
          You can jump around, but the paths are ordered for a reason: each
          step assumes the previous one is understood.
        </p>
        <p>
          These paths are educational. They will not make you money by
          themselves. Read our <Link to="/methodology">methodology</Link> and{" "}
          <Link to="/performance-transparency">performance transparency</Link>{" "}
          pages before committing real capital.
        </p>
      </section>
    </main>
    <SiteFooter />
  </div>
);

export default LearningPaths;