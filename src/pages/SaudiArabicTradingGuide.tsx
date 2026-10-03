import { Link } from "react-router-dom";
import { BookOpen, ShieldCheck, Clock3 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { SAUDI_ARABIC_INDEX } from "@/content/saudiArabicPosts";

const canonical="https://botvio.live/ar/saudi-arabia";
export default function SaudiArabicTradingGuide(){
 return <div dir="rtl" className="min-h-screen bg-background">
  <SEOHead title="التداول في السعودية: الفوركس والمؤشرات الاصطناعية وDeriv وMT5 والذهب | BOTVIO" description="مركز عربي للمتداولين في السعودية حول الفوركس والمؤشرات الاصطناعية وDeriv وMT5 والذهب XAUUSD وإدارة المخاطر." canonicalUrlOverride={canonical} alternateLocales={[{code:"ar-SA",href:canonical},{code:"en",href:"https://botvio.live/markets/saudi-arabia"}]} jsonLd={{"@context":"https://schema.org","@type":"CollectionPage",name:"التداول في السعودية",description:"مركز تعليمي عربي للمتداولين في السعودية",url:canonical,inLanguage:"ar"}} />
  <Header/>
  <main className="container mx-auto px-4 py-8">
   <section className="rounded-3xl border border-border bg-card p-6 sm:p-10">
    <p className="text-xs font-semibold text-primary">المملكة العربية السعودية · Saudi Arabia</p>
    <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">التداول في السعودية: الفوركس والمؤشرات الاصطناعية وDeriv وMT5 والذهب</h1>
    <p className="mt-5 max-w-4xl text-lg leading-8 text-muted-foreground">مركز عربي أصلي للمتداول السعودي، يضم أدلة عن المؤشرات الاصطناعية والفوركس وDeriv وMT5 والذهب XAUUSD وإدارة المخاطر، مع استخدام توقيت الرياض وسياق محلي واضح.</p>
    <div className="mt-7 grid gap-4 md:grid-cols-3">
     <div className="rounded-2xl border p-5"><BookOpen className="h-5 w-5 text-primary"/><h2 className="mt-3 font-bold">محتوى عربي أصلي</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">20 موضوعاً عربياً مخصصاً للسوق السعودي مع نسخ إنجليزية مقابلة.</p></div>
     <div className="rounded-2xl border p-5"><Clock3 className="h-5 w-5 text-primary"/><h2 className="mt-3 font-bold">توقيت الرياض</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">إرشادات الجلسات والسجل تعتمد UTC+3 والسياق السعودي.</p></div>
     <div className="rounded-2xl border p-5"><ShieldCheck className="h-5 w-5 text-primary"/><h2 className="mt-3 font-bold">إدارة المخاطر</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">لا وعود بالربح ولا ترتيب غير موثق للوسطاء.</p></div>
    </div>
   </section>
   <section className="mt-10">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">أدلة التداول في السعودية</h2><p className="mt-2 text-sm text-muted-foreground">20 دليلاً عربياً مع نسخ إنجليزية مقابلة.</p></div><Link to="/markets/saudi-arabia"><Button variant="outline">English</Button></Link></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
     {SAUDI_ARABIC_INDEX.map(({slug,title,excerpt})=><article key={slug} className="rounded-2xl border bg-card p-5"><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{excerpt}</p><Link to={"/ar/blog/"+slug} className="mt-4 inline-block text-sm font-semibold text-primary">اقرأ الدليل ←</Link></article>)}
    </div>
   </section>
   <p className="mt-8 rounded-2xl border border-border/60 bg-card/50 p-5 text-sm leading-7 text-muted-foreground">محتوى تعليمي فقط. قد تتغير المنتجات والأهلية والرسوم والقواعد والتنظيم. تحقق دائماً من المصادر الرسمية الحالية قبل اتخاذ قرار مالي.</p>
  </main>
 </div>
}