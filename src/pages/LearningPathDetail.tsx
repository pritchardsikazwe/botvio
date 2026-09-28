import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { learningPathBySlug, learningPaths } from "@/content/learningPaths";

const storageKey = (slug: string) => `botvio.learningPath.${slug}.progress`;

const LearningPathDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const path = slug ? learningPathBySlug(slug) : undefined;
  const [done, setDone] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) setDone(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try { localStorage.setItem(storageKey(slug), JSON.stringify(done)); } catch { /* ignore */ }
  }, [slug, done]);

  if (!path) return <Navigate to="/learning-paths" replace />;

  const completed = Object.values(done).filter(Boolean).length;
  const percent = Math.round((completed / path.steps.length) * 100);
  const nextPath = path.nextPathSlug ? learningPathBySlug(path.nextPathSlug) : undefined;

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: path.title,
    description: path.tagline,
    provider: { "@type": "Organization", name: "Botvio", url: "https://botvio.lovable.app" },
    educationalLevel: path.level,
    timeRequired: `PT${path.totalHours}H`,
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${path.totalHours}H` },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${path.title} — Free ${path.level} Trading Path | Botvio`}
        description={path.tagline}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/learning-paths" className="hover:text-primary">Learning Paths</Link>
          <span className="mx-2">/</span>
          <span>{path.title}</span>
        </nav>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge>{path.level}</Badge>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{path.totalHours}h total
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">{path.title}</h1>
          <p className="text-muted-foreground leading-relaxed mb-4">{path.tagline}</p>
          <Card className="bg-muted/30">
            <CardContent className="p-4 text-sm space-y-2">
              <p><strong className="text-foreground">Outcome:</strong> {path.outcome}</p>
              <p><strong className="text-foreground">Prerequisites:</strong> {path.prerequisites}</p>
            </CardContent>
          </Card>
        </header>

        <section aria-label="Progress" className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your progress ({completed} / {path.steps.length})</span>
            <span className="font-semibold text-foreground">{percent}%</span>
          </div>
          <Progress value={percent} />
        </section>

        <ol className="space-y-4">
          {path.steps.map((step, i) => {
            const isDone = !!done[i];
            return (
              <li key={i}>
                <Card className={isDone ? "border-primary/40" : undefined}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="pt-0.5">
                      <Checkbox
                        checked={isDone}
                        onCheckedChange={(v) => setDone((d) => ({ ...d, [i]: !!v }))}
                        aria-label={`Mark step ${i + 1} complete`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Step {i + 1}</span>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {step.estMinutes} min
                        </span>
                        {isDone && <span className="text-xs text-primary inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done</span>}
                      </div>
                      <h2 className="text-lg font-semibold text-foreground mt-1">{step.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{step.summary}</p>
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link to={step.href}>Open resource <ArrowRight className="w-3 h-3 ml-1" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3 justify-between">
          <Button asChild variant="ghost">
            <Link to="/learning-paths"><ArrowLeft className="w-4 h-4 mr-1" /> All learning paths</Link>
          </Button>
          {nextPath && (
            <Button asChild>
              <Link to={`/learning-paths/${nextPath.slug}`}>Next: {nextPath.title} <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          )}
        </div>

        <aside className="mt-14 prose prose-invert">
          <h2>Other paths</h2>
          <ul>
            {learningPaths.filter((p) => p.slug !== path.slug).map((p) => (
              <li key={p.slug}><Link to={`/learning-paths/${p.slug}`}>{p.title}</Link> — {p.level}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Progress is stored only in this browser. Clearing your browser data will reset it.
          </p>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
};

export default LearningPathDetail;