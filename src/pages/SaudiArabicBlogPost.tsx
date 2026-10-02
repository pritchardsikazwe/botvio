import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { SAUDI_ARABIC_POSTS } from "@/content/saudiArabicPosts";

export default function SaudiArabicBlogPost(){
 const {slug}=useParams<{slug:string}>(); const post=slug?SAUDI_ARABIC_POSTS[slug]:undefined;
 if(!post) return <div className="min-h-screen bg-background"><Header/><main className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">المقال غير موجود</h1><Link to="/ar/saudi-arabia"><Button className="mt-5">العودة إلى دليل السعودية</Button></Link></main></div>;
 const canonical=`https://botvio.live/ar/saudi-blog/${slug}`; const english=`https://botvio.live/blog/${slug}`;
 return <div dir="rtl" className="min-h-screen bg-background"><SEOHead title={post.metaTitle} description={post.metaDescription} canonicalUrlOverride={canonical} alternateLocales={[{code:"ar-SA",href:canonical},{code:"en",href:english}]} jsonLd={{"@context":"https://schema.org","@type":"Article",headline:post.title,description:post.excerpt,url:canonical,inLanguage:"ar",author:{"@type":"Organization",name:"Botvio"}}}/><Header/><main className="container mx-auto max-w-4xl px-4 py-8"><nav className="mb-6 text-sm text-muted-foreground"><Link to="/ar/saudi-arabia">دليل السعودية</Link></nav><article><h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{post.title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p><div className="prose prose-sm sm:prose-base dark:prose-invert mt-8 max-w-none" dangerouslySetInnerHTML={{__html:post.content}}/><div className="mt-10 flex flex-wrap gap-3"><Link to={english}><Button variant="outline">English version</Button></Link><Link to="/ar/saudi-arabia"><Button>المزيد من أدلة السعودية</Button></Link></div></article></main></div>;
}