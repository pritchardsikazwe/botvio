import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Share2 } from "lucide-react";
import { blogContent } from "@/content/blogPosts";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogContent[slug || ""];

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Link to="/blog"><Button>Back to Blog</Button></Link>
        </main>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Botvio" },
    publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live", logo: { "@type": "ImageObject", url: "https://botvio.live/icon-512.png" } },
    mainEntityOfPage: `https://botvio.live/blog/${slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={post.title} description={post.excerpt} jsonLd={jsonLd} />
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <article className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge>{post.category}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
              <span className="text-sm text-muted-foreground">{post.date}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

          <div className="border-t pt-6 mt-10">
            <p className="text-sm text-muted-foreground">Start trading with Botvio today.</p>
            <div className="flex gap-3 mt-3">
              <Link to="/"><Button>Get Started with Botvio</Button></Link>
              <Link to="/blog"><Button variant="outline">More Articles</Button></Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default BlogPost;
