import { useParams, Link, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { AUTHORS, getAuthor } from "@/content/authors";

const Author = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || !AUTHORS[slug]) {
    return <Navigate to="/authors/botvio-editorial-team" replace />;
  }
  const author = getAuthor(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    jobTitle: author.role,
    knowsAbout: author.expertise,
    url: `https://botvio.lovable.app/authors/${author.slug}`,
    email: author.email,
    worksFor: {
      "@type": "Organization",
      name: "Botvio",
      url: "https://botvio.lovable.app",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${author.name} — ${author.role} | Botvio`}
        description={author.bio}
        jsonLd={jsonLd}
      />
      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <Badge className="bg-primary/10 text-primary border border-primary/30 mb-3">
            Author profile
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {author.name}
          </h1>
          <p className="mt-2 text-muted-foreground">{author.role}</p>

          <p className="mt-6 text-[1.0625rem] leading-[1.8] text-foreground/90">
            {author.longBio}
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">
                Areas of expertise
              </h2>
              <ul className="space-y-1.5">
                {author.expertise.map((e) => (
                  <li key={e} className="text-sm text-muted-foreground">
                    • {e}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Credentials & standards
              </h2>
              <ul className="space-y-1.5">
                {author.credentials.map((c) => (
                  <li key={c} className="text-sm text-muted-foreground">
                    • {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {author.email && (
              <a href={`mailto:${author.email}`}>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" /> Contact author
                </Button>
              </a>
            )}
            <Link to="/editorial-policy">
              <Button variant="outline">Editorial Policy</Button>
            </Link>
            <Link to="/fact-checking">
              <Button variant="outline">Fact-Checking Standards</Button>
            </Link>
            <Link to="/corrections">
              <Button variant="outline">Corrections</Button>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Botvio is independent and not owned by any broker. When articles link
          to broker sign-ups they carry an{" "}
          <Link to="/affiliate-disclosure" className="underline underline-offset-4">
            Affiliate Disclosure
          </Link>{" "}
          badge.
        </p>
      </main>
    </div>
  );
};

export default Author;