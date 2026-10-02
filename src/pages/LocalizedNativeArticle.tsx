import { Link,useParams,useLocation } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { LOCALIZED_NATIVE_POSTS } from "@/content/localizedNativePosts";
import { LOCALIZED_MARKETS } from "@/content/localizedMarkets";

export default function LocalizedNativeArticle(){
 const {country,slug}=useParams<{country:string;slug:string}>(); const location=useLocation();
 const post=slug?LOCALIZED_NATIVE_POSTS[slug]:undefined;
 const market=country?Object.values(LOCALIZED_MARKETS).find(m=>m.slug===country):undefined;
 if(!post||!market) return <div className="min-h-screen bg-background"><Header/><main className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">Article not found</h1><Link to="/"><Button className="mt-5">Home</Button></Link></main></div>;
 const nativePath=location.pathname.startsWith("/ar/") ? `/ar/markets/${market.slug}/blog/${slug}` : `/markets/${market.slug}/blog/${slug}`;
 const canonical=`https://botvio.live${nativePath}`;
 const english=`https://botvio.live/blog/${slug}`;
 return <div dir={market.lang==="ar"||market.lang==="ur"?"rtl":"ltr"} className="min-h-screen bg-background">
  <SEOHead title={post.metaTitle} description={post.metaDescription} canonicalUrlOverride={canonical} alternateLocales={market.lang==="ar" ? [{code:market.hreflang,href:canonical},{code:"en",href:english}] : [{code:"en",href:canonical}]} jsonLd={{"@context":"https://schema.org","@type":"Article",headline:post.title,description:post.excerpt,url:canonical,inLanguage:market.lang,author:{"@type":"Organization",name:"Botvio"}}}/>
  <Header/><main className="container mx-auto max-w-4xl px-4 py-8"><nav className="mb-6 text-sm text-muted-foreground"><Link to={`/markets/${market.slug}`}>{market.countryName}</Link></nav><article><h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{post.title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p><div className="prose prose-sm sm:prose-base dark:prose-invert mt-8 max-w-none" dangerouslySetInnerHTML={{__html:post.content}}/><div className="mt-10 flex flex-wrap gap-3"><Link to={english}><Button variant="outline">English version</Button></Link><Link to={`/markets/${market.slug}`}><Button>More local guides</Button></Link></div></article></main></div>;
}