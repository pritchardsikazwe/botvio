import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock3, ShieldCheck } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { AffiliateAccountGuide } from "@/components/affiliate/AffiliateAccountGuide";
import { DUBAI_ARABIC_INDEX } from "@/content/dubaiArabicPosts";

export default function ArabicDubaiTradingGuide() {
  const canonical = "https://botvio.live/ar/dubai";
  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <SEOHead
        title="التداول في دبي | المؤشرات الاصطناعية وDeriv وMT5 والفوركس والذهب"
        description="دليل Botvio العربي لمتداولي دبي والإمارات: المؤشرات الاصطناعية، مؤشرات Derived، Volatility، Boom وCrash، Deriv MT5، الفوركس والذهب وإدارة المخاطر."
        canonicalUrlOverride={canonical}
        alternateLocales={[{ code: "ar-AE", href: canonical }, { code: "en", href: "https://botvio.live/dubai" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "دليل التداول في دبي والإمارات",
          url: canonical,
          inLanguage: "ar",
          isPartOf: { "@type": "WebSite", name: "Botvio", url: "https://botvio.live" },
        }}
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
            <BookOpen className="h-4 w-4" /> دليل التداول العربي في دبي والإمارات
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            التداول في دبي: المؤشرات الاصطناعية وDeriv وMT5 والفوركس والذهب
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            مركز عربي تعليمي لمتداولي الإمارات. ستجد هنا شروحات فعلية عن المؤشرات الاصطناعية ومؤشرات Derived وVolatility وBoom وCrash وStep Index، إضافة إلى MT5 والفوركس والذهب وإدارة المخاطر.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border p-4"><Clock3 className="h-5 w-5 text-primary" /><h2 className="mt-2 font-semibold">توقيت الإمارات</h2><p className="mt-1 text-sm text-muted-foreground">استخدم GST (UTC+4) عند دراسة جلسات التداول وتسجيل الصفقات.</p></div>
            <div className="rounded-2xl border border-border p-4"><BookOpen className="h-5 w-5 text-primary" /><h2 className="mt-2 font-semibold">مصطلحات يبحث عنها المتداول العربي</h2><p className="mt-1 text-sm text-muted-foreground">المؤشرات الاصطناعية، مؤشرات Derived، Volatility 75، Boom 500، Crash 500، Deriv MT5 وXAUUSD.</p></div>
            <div className="rounded-2xl border border-border p-4"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="mt-2 font-semibold">تعليم وإدارة مخاطر</h2><p className="mt-1 text-sm text-muted-foreground">لا توجد وعود بأرباح أو إشارات مضمونة؛ الهدف هو الفهم والاختبار وإدارة رأس المال.</p></div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-primary">دليل دبي العربي</p>
            <h2 className="mt-1 text-2xl font-bold">أهم الأدلة باللغة العربية</h2>
            <p className="mt-2 text-sm text-muted-foreground">كل موضوع يستهدف سؤالاً بحثياً محدداً بدلاً من تكرار نفس الكلمات المفتاحية.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {DUBAI_ARABIC_INDEX.map((article) => (
              <article key={article.slug} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-primary">{article.category} · {article.readTime}</p>
                <h3 className="mt-2 text-lg font-semibold">{article.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {article.keywords.slice(0, 3).map((keyword) => <span key={keyword} className="rounded-full bg-muted px-2 py-1 text-[11px]">{keyword}</span>)}
                </div>
                <Link to={`/ar/blog/${article.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  اقرأ الدليل <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">فتح حساب Deriv من خلال دليل Botvio</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            إذا قررت دراسة المنصة بعد قراءة الأدلة، استخدم دليل فتح الحساب لمعرفة خطوات التسجيل والتحقق والانتقال إلى الحساب التجريبي. رابط الإحالة يخص Botvio، ويجب مراجعة شروط المزود والمخاطر قبل أي إيداع.
          </p>
          <div className="mt-5">
            <AffiliateAccountGuide broker="deriv" affiliateUrl="https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/" />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/50 p-5 text-sm leading-7 text-muted-foreground">
          <strong className="text-foreground">تنبيه المخاطر:</strong> التداول في المشتقات وعقود الفروقات والخيارات ينطوي على مخاطر خسارة. المحتوى تعليمي وليس نصيحة مالية شخصية. تحقّق دائماً من الشروط والتنظيم والمنتجات المتاحة حالياً لدى المزود.
        </section>
      </main>
    </div>
  );
}
