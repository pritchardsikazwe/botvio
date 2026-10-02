import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { DUBAI_ARABIC_POSTS } from "@/content/dubaiArabicPosts";
import { AffiliateAccountGuide } from "@/components/affiliate/AffiliateAccountGuide";

export default function ArabicDubaiBlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? DUBAI_ARABIC_POSTS[slug] : undefined;

  if (!post) {
    return <div dir="rtl" className="min-h-screen bg-background"><Header /><main className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">المقال غير موجود</h1><Link to="/ar/dubai"><Button className="mt-5">العودة إلى دليل دبي</Button></Link></main></div>;
  }

  const canonical = `https://botvio.live/ar/blog/${slug}`;
  const wordCount = post.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Organization", name: "Botvio" },
    publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live" },
    mainEntityOfPage: canonical,
    inLanguage: "ar",
    articleSection: post.category,
    keywords: post.keywords.join(", "),
    wordCount,
    url: canonical,
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <SEOHead title={post.metaTitle} description={post.metaDescription} ogType="article" canonicalUrlOverride={canonical} jsonLd={jsonLd} />
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/ar/dubai" className="hover:text-primary">دليل دبي والإمارات</Link>
          <span className="mx-2">←</span>
          <span>{post.category}</span>
        </nav>

        <article className="mx-auto max-w-4xl">
          <header className="mb-8">
            <p className="text-xs font-semibold text-primary">{post.category} · {post.readTime}</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{post.title}</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {post.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-border px-3 py-1 text-xs">{keyword}</span>)}
            </div>
          </header>

          <div className="prose prose-sm max-w-none dark:prose-invert sm:prose-base" dangerouslySetInnerHTML={{ __html: post.content }} />

          <section className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">هل تريد تجربة Deriv بعد التعلم؟</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              يمكنك مراجعة دليل فتح الحساب أولاً، ثم استخدام حساب تجريبي إذا كان متاحاً لك. رابط الإحالة أدناه رابط تابع لـBotvio، ولا يعني أن التداول مناسب لك أو أن الربح مضمون.
            </p>
            <div className="mt-5"><AffiliateAccountGuide broker="deriv" affiliateUrl="https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/" compact /></div>
          </section>

          <section className="mt-6 flex flex-wrap gap-3">
            <Link to="/ar/dubai"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> جميع أدلة دبي</Button></Link>
            <Link to={`/blog/${slug}`}><Button variant="ghost" className="gap-2">English version <ExternalLink className="h-4 w-4" /></Button></Link>
          </section>

          <p className="mt-8 text-xs leading-6 text-muted-foreground">
            تنبيه: التداول في المشتقات وعقود الفروقات والخيارات ينطوي على مخاطر خسارة. هذا المحتوى تعليمي ولا يمثل نصيحة مالية شخصية. راجع شروط المزود والتنظيم الحالي قبل اتخاذ أي قرار.
          </p>
        </article>
      </main>
    </div>
  );
}
