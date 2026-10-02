import { Link, useParams } from "react-router-dom";
import { BookOpen, Clock3, ShieldCheck } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { LOCALIZED_MARKETS, type LocalizedMarket } from "@/content/localizedMarkets";
import { countryToLanguage } from "@/i18n";

const languageCopy: Record<string, {
  intro: (m: string) => string;
  education: string;
  risk: string;
  local: string;
  start: string;
  disclaimer: string;
}> = {
  pt: {
    intro: m => `Este centro foi escrito para traders no ${m}. O vocabulário, os exemplos, o fuso horário e as pesquisas abaixo são adaptados ao público local — não são apenas uma tradução da página em inglês.`,
    education:"Aprenda primeiro",
    risk:"Gestão de risco",
    local:"Contexto local",
    start:"Começar pelo guia",
    disclaimer:"Conteúdo educacional. Trading envolve risco de perda. Verifique as condições e regras atuais do provedor antes de operar."
  },
  es:{intro:m=>`Este centro está escrito para traders del ${m}. El vocabulario, los ejemplos, el horario y las búsquedas están adaptados al público local, no son una traducción literal del inglés.`,education:"Aprende primero",risk:"Gestión del riesgo",local:"Contexto local",start:"Empezar la guía",disclaimer:"Contenido educativo. El trading implica riesgo de pérdida. Comprueba las condiciones y requisitos actuales del proveedor."},
  fr:{intro:m=>`Ce guide est conçu pour les traders du ${m}. Les termes de recherche, les exemples, le fuseau horaire et le contexte sont adaptés au public local, et non simplement traduits de l’anglais.`,education:"Apprendre d'abord",risk:"Gestion du risque",local:"Contexte local",start:"Commencer le guide",disclaimer:"Contenu éducatif. Le trading comporte un risque de perte. Vérifiez les conditions actuelles du fournisseur."},
  de:{intro:m=>`Dieses Zentrum richtet sich an Trader im ${m}. Suchbegriffe, Beispiele, Zeitzone und Kontext sind lokal angepasst und nicht nur aus dem Englischen übersetzt.`,education:"Zuerst lernen",risk:"Risikomanagement",local:"Lokaler Kontext",start:"Guide öffnen",disclaimer:"Nur Bildungsinhalt. Trading kann zu Verlusten führen. Prüfen Sie die aktuellen Bedingungen des Anbieters."},
  it:{intro:m=>`Questo centro è pensato per trader nel ${m}. Terminologia, esempi, fuso orario e contesto sono adattati al pubblico locale, non semplicemente tradotti dall'inglese.`,education:"Impara prima",risk:"Gestione del rischio",local:"Contesto locale",start:"Apri la guida",disclaimer:"Contenuto educativo. Il trading comporta il rischio di perdita. Verifica sempre le condizioni attuali del fornitore."},
  tr:{intro:m=>`${m} için hazırlanan bu merkezde arama terimleri, örnekler, saat dilimi ve piyasa bağlamı yerel kullanıcıya göre düzenlenmiştir; yalnızca İngilizce metnin çevirisi değildir.`,education:"Önce öğren",risk:"Risk yönetimi",local:"Yerel bağlam",start:"Rehbere başla",disclaimer:"Eğitim amaçlı içeriktir. Trading kayıp riski içerir. İşlem yapmadan önce sağlayıcının güncel şartlarını kontrol edin."},
  ar:{intro:m=>`هذا المركز مكتوب للمتداولين في ${m}. تم تكييف مصطلحات البحث والأمثلة والتوقيت والسياق المحلي، وليس مجرد ترجمة حرفية للصفحة الإنجليزية.`,education:"تعلّم أولاً",risk:"إدارة المخاطر",local:"السياق المحلي",start:"ابدأ الدليل",disclaimer:"محتوى تعليمي. التداول ينطوي على مخاطر خسارة. تحقّق من الشروط والمنتجات والتنظيم الحالي لدى المزود."},
  hi:{intro:m=>`यह केंद्र ${m} के ट्रेडर्स के लिए तैयार किया गया है। खोज शब्द, उदाहरण, समय क्षेत्र और स्थानीय संदर्भ केवल अंग्रेज़ी का अनुवाद नहीं हैं, बल्कि स्थानीय उपयोगकर्ताओं के अनुसार बनाए गए हैं।`,education:"पहले सीखें",risk:"जोखिम प्रबंधन",local:"स्थानीय संदर्भ",start:"गाइड शुरू करें",disclaimer:"यह शैक्षिक सामग्री है। ट्रेडिंग में नुकसान का जोखिम है। ट्रेड करने से पहले प्रदाता की वर्तमान शर्तें जाँचें।"},
  ur:{intro:m=>`یہ مرکز ${m} کے ٹریڈرز کے لیے تیار کیا گیا ہے۔ سرچ الفاظ، مثالیں، وقت اور مقامی حالات صرف انگریزی کا ترجمہ نہیں بلکہ مقامی صارفین کے مطابق ترتیب دیے گئے ہیں۔`,education:"پہلے سیکھیں",risk:"رسک مینجمنٹ",local:"مقامی تناظر",start:"گائیڈ شروع کریں",disclaimer:"یہ تعلیمی مواد ہے۔ ٹریڈنگ میں نقصان کا خطرہ ہے۔ ٹریڈ کرنے سے پہلے فراہم کنندہ کی موجودہ شرائط چیک کریں۔"},
  id:{intro:m=>`Pusat ini dibuat untuk trader di ${m}. Istilah pencarian, contoh, zona waktu, dan konteks lokal disesuaikan untuk pengguna setempat, bukan sekadar terjemahan dari bahasa Inggris.`,education:"Pelajari dulu",risk:"Manajemen risiko",local:"Konteks lokal",start:"Mulai panduan",disclaimer:"Konten edukasi. Trading memiliki risiko kerugian. Periksa ketentuan penyedia yang berlaku sebelum bertransaksi."},
  ms:{intro:m=>`Pusat ini disediakan untuk trader di ${m}. Istilah carian, contoh, zon masa dan konteks tempatan disesuaikan untuk pengguna tempatan, bukan sekadar terjemahan bahasa Inggeris.`,education:"Belajar dahulu",risk:"Pengurusan risiko",local:"Konteks tempatan",start:"Mulakan panduan",disclaimer:"Kandungan pendidikan. Trading melibatkan risiko kerugian. Semak syarat penyedia semasa sebelum berdagang."},
  tl:{intro:m=>`Ang sentrong ito ay para sa mga trader sa ${m}. Ang mga search term, halimbawa, oras at lokal na konteksto ay iniangkop sa lokal na audience, hindi simpleng salin mula sa English.`,education:"Matuto muna",risk:"Pamamahala ng panganib",local:"Lokal na konteksto",start:"Simulan ang gabay",disclaimer:"Educational content ito. May panganib ng pagkalugi sa trading. Suriin ang kasalukuyang kondisyon ng provider bago mag-trade."},
  vi:{intro:m=>`Trung tâm này dành cho nhà giao dịch tại ${m}. Từ khóa tìm kiếm, ví dụ, múi giờ và bối cảnh địa phương được điều chỉnh cho người dùng bản địa, không chỉ dịch từ tiếng Anh.`,education:"Học trước",risk:"Quản lý rủi ro",local:"Bối cảnh địa phương",start:"Bắt đầu hướng dẫn",disclaimer:"Nội dung giáo dục. Giao dịch có rủi ro thua lỗ. Hãy kiểm tra điều kiện hiện hành của nhà cung cấp trước khi giao dịch."},
  th:{intro:m=>`ศูนย์นี้จัดทำสำหรับเทรดเดอร์ใน${m} โดยปรับคำค้น ตัวอย่าง เขตเวลา และบริบทท้องถิ่นให้เหมาะกับผู้ใช้ ไม่ใช่เพียงการแปลจากภาษาอังกฤษ`,education:"เรียนรู้ก่อน",risk:"การจัดการความเสี่ยง",local:"บริบทท้องถิ่น",start:"เริ่มคู่มือ",disclaimer:"เนื้อหาเพื่อการศึกษา การเทรดมีความเสี่ยงต่อการขาดทุน โปรดตรวจสอบเงื่อนไขปัจจุบันของผู้ให้บริการก่อนเทรด"},
  ja:{intro:m=>`このガイドは${m}のトレーダー向けです。検索語、例、時間帯、地域の文脈を日本語圏の利用者向けに調整しており、英語ページの単純な翻訳ではありません。`,education:"まず学ぶ",risk:"リスク管理",local:"地域の文脈",start:"ガイドを見る",disclaimer:"教育目的のコンテンツです。取引には損失リスクがあります。取引前に提供者の最新条件を確認してください。"},
  ko:{intro:m=>`${m} 트레이더를 위해 작성된 센터입니다. 검색어, 예시, 시간대와 지역적 맥락을 현지 사용자에 맞게 구성했으며 영어 페이지를 단순 번역한 것이 아닙니다.`,education:"먼저 배우기",risk:"리스크 관리",local:"지역 맥락",start:"가이드 시작",disclaimer:"교육용 콘텐츠입니다. 트레이딩에는 손실 위험이 있습니다. 거래 전 제공자의 최신 조건을 확인하세요."},
  sw:{intro:m=>`Kituo hiki kimeandaliwa kwa traders wa ${m}. Maneno ya utafutaji, mifano, muda na muktadha wa eneo umebadilishwa kwa watumiaji wa eneo hilo, si tafsiri ya Kiingereza pekee.`,education:"Jifunze kwanza",risk:"Usimamizi wa hatari",local:"Muktadha wa eneo",start:"Anza mwongozo",disclaimer:"Maudhui haya ni ya elimu. Trading ina hatari ya hasara. Kagua masharti ya sasa ya mtoa huduma kabla ya kufanya biashara."},
  bn:{intro:m=>`এই কেন্দ্রটি ${m}-এর ট্রেডারদের জন্য তৈরি। সার্চ শব্দ, উদাহরণ, সময় এবং স্থানীয় প্রেক্ষাপট স্থানীয় ব্যবহারকারীদের জন্য সাজানো হয়েছে; এটি শুধু ইংরেজি অনুবাদ নয়।`,education:"আগে শিখুন",risk:"ঝুঁকি ব্যবস্থাপনা",local:"স্থানীয় প্রেক্ষাপট",start:"গাইড শুরু করুন",disclaimer:"এটি শিক্ষামূলক কনটেন্ট। ট্রেডিংয়ে ক্ষতির ঝুঁকি রয়েছে। ট্রেড করার আগে প্রদানকারীর বর্তমান শর্ত যাচাই করুন।"},
  zh:{intro:m=>`本中心面向${m}的交易者。搜索词、案例、时区和本地市场语境均针对当地用户调整，而不是简单翻译英文页面。`,education:"先学习",risk:"风险管理",local:"本地市场语境",start:"开始指南",disclaimer:"本内容仅用于教育。交易存在亏损风险。交易前请核实服务商当前的产品和条款。"},
  ru:{intro:m=>`Этот раздел создан для трейдеров в регионе ${m}. Поисковые запросы, примеры, часовой пояс и местный контекст адаптированы для аудитории региона, а не просто переведены с английского.`,education:"Сначала изучите",risk:"Управление рисками",local:"Местный контекст",start:"Открыть руководство",disclaimer:"Образовательный материал. Торговля связана с риском убытков. Перед торговлей проверяйте актуальные условия провайдера."},
  en:{intro:m=>`This hub is written for traders in ${m}. Search terms, examples, timezone and market context are localized for the local audience rather than simply translated from the English site.`,education:"Learn first",risk:"Risk management",local:"Local context",start:"Start the guide",disclaimer:"Educational content only. Trading involves risk of loss. Check the provider's current terms and product availability before trading."},
};



const FALLBACK_LOCALIZED_TEXT: Record<string, { title:(country:string)=>string; description:(country:string)=>string; topics:string[] }> = {
  en:{title:c=>`Trading in ${c}: Forex, Synthetic Indices, MT5 and Gold`,description:c=>`Localized trading education for traders in ${c}: forex, synthetic indices, MT5, gold XAUUSD and risk management.`,topics:["How to start trading","Synthetic indices guide","MT5 trading guide","Gold XAUUSD guide","Risk management"]},
  pt:{title:c=>`Trading em ${c}: Forex, índices sintéticos, MT5 e ouro`,description:c=>`Guias de trading para ${c} sobre forex, índices sintéticos, MT5, ouro XAUUSD e gestão de risco.`,topics:["Como começar no trading","Guia de índices sintéticos","Guia de MT5","Guia de ouro XAUUSD","Gestão de risco"]},
  es:{title:c=>`Trading en ${c}: Forex, índices sintéticos, MT5 y oro`,description:c=>`Guías de trading para ${c} sobre forex, índices sintéticos, MT5, oro XAUUSD y gestión de riesgo.`,topics:["Cómo empezar a hacer trading","Guía de índices sintéticos","Guía de MT5","Guía de oro XAUUSD","Gestión del riesgo"]},
  fr:{title:c=>`Trading en ${c} : Forex, indices synthétiques, MT5 et or`,description:c=>`Guides de trading pour ${c} sur le forex, les indices synthétiques, MT5, l'or XAUUSD et la gestion du risque.`,topics:["Comment débuter le trading","Guide des indices synthétiques","Guide MT5","Guide de l'or XAUUSD","Gestion du risque"]},
  de:{title:c=>`Trading in ${c}: Forex, synthetische Indizes, MT5 und Gold`,description:c=>`Trading-Guides für ${c} zu Forex, synthetischen Indizes, MT5, Gold XAUUSD und Risikomanagement.`,topics:["Trading starten","Guide zu synthetischen Indizes","MT5 Guide","Gold-XAUUSD Guide","Risikomanagement"]},
  it:{title:c=>`Trading in ${c}: Forex, indici sintetici, MT5 e oro`,description:c=>`Guide di trading per ${c} su forex, indici sintetici, MT5, oro XAUUSD e gestione del rischio.`,topics:["Come iniziare a fare trading","Guida agli indici sintetici","Guida MT5","Guida all'oro XAUUSD","Gestione del rischio"]},
  tr:{title:c=>`${c} Trading: Forex, sentetik endeksler, MT5 ve altın`,description:c=>`${c} için Forex, sentetik endeksler, MT5, XAUUSD ve risk yönetimi rehberleri.`,topics:["Tradinge nasıl başlanır","Sentetik endeksler rehberi","MT5 rehberi","XAUUSD altın rehberi","Risk yönetimi"]},
  ar:{title:c=>`التداول في ${c}: الفوركس والمؤشرات الاصطناعية وMT5 والذهب`,description:c=>`دليل تداول عربي للمتداولين في ${c} حول الفوركس والمؤشرات الاصطناعية وMT5 والذهب XAUUSD وإدارة المخاطر.`,topics:["كيفية البدء في التداول","دليل المؤشرات الاصطناعية","دليل MT5","دليل الذهب XAUUSD","إدارة المخاطر"]},
  hi:{title:c=>`${c} में ट्रेडिंग: Forex, Synthetic Indices, MT5 और Gold`,description:c=>`${c} के ट्रेडर्स के लिए Forex, Synthetic Indices, MT5, XAUUSD Gold और risk management की गाइड।`,topics:["ट्रेडिंग कैसे शुरू करें","Synthetic Indices गाइड","MT5 गाइड","XAUUSD Gold गाइड","जोखिम प्रबंधन"]},
  ur:{title:c=>`${c} میں ٹریڈنگ: Forex، Synthetic Indices، MT5 اور Gold`,description:c=>`${c} کے ٹریڈرز کے لیے Forex، Synthetic Indices، MT5، XAUUSD اور رسک مینجمنٹ کی اردو گائیڈ۔`,topics:["ٹریڈنگ کیسے شروع کریں","Synthetic Indices گائیڈ","MT5 گائیڈ","XAUUSD Gold گائیڈ","رسک مینجمنٹ"]},
  id:{title:c=>`Trading di ${c}: Forex, indeks sintetis, MT5 dan emas`,description:c=>`Panduan trading untuk ${c} tentang forex, indeks sintetis, MT5, emas XAUUSD dan manajemen risiko.`,topics:["Cara mulai trading","Panduan indeks sintetis","Panduan MT5","Panduan emas XAUUSD","Manajemen risiko"]},
  ms:{title:c=>`Trading di ${c}: Forex, indeks sintetik, MT5 dan emas`,description:c=>`Panduan trading untuk ${c} tentang forex, indeks sintetik, MT5, emas XAUUSD dan pengurusan risiko.`,topics:["Cara mula trading","Panduan indeks sintetik","Panduan MT5","Panduan emas XAUUSD","Pengurusan risiko"]},
  tl:{title:c=>`Trading sa ${c}: Forex, synthetic indices, MT5 at Gold`,description:c=>`Gabay para sa traders sa ${c} tungkol sa forex, synthetic indices, MT5, XAUUSD at risk management.`,topics:["Paano magsimula sa trading","Synthetic indices guide","MT5 guide","XAUUSD Gold guide","Risk management"]},
  vi:{title:c=>`Giao dịch tại ${c}: Forex, chỉ số tổng hợp, MT5 và vàng`,description:c=>`Hướng dẫn cho nhà giao dịch tại ${c} về forex, chỉ số tổng hợp, MT5, vàng XAUUSD và quản lý rủi ro.`,topics:["Cách bắt đầu giao dịch","Hướng dẫn chỉ số tổng hợp","Hướng dẫn MT5","Hướng dẫn vàng XAUUSD","Quản lý rủi ro"]},
  th:{title:c=>`เทรดใน${c}: Forex, Synthetic Indices, MT5 และทองคำ`,description:c=>`คู่มือสำหรับเทรดเดอร์ใน${c} เกี่ยวกับ Forex, Synthetic Indices, MT5, ทองคำ XAUUSD และการจัดการความเสี่ยง`,topics:["เริ่มเทรดอย่างไร","คู่มือ Synthetic Indices","คู่มือ MT5","คู่มือทอง XAUUSD","การจัดการความเสี่ยง"]},
  ja:{title:c=>`${c}のトレード：FX、合成指数、MT5、金`,description:c=>`${c}のトレーダー向けに、FX、合成指数、MT5、XAUUSD（金）、リスク管理を解説します。`,topics:["トレードの始め方","合成指数ガイド","MT5ガイド","XAUUSD金ガイド","リスク管理"]},
  ko:{title:c=>`${c} 트레이딩: Forex, 합성지수, MT5와 금`,description:c=>`${c} 트레이더를 위한 Forex, 합성지수, MT5, XAUUSD 금 및 리스크 관리 가이드입니다.`,topics:["트레이딩 시작하기","합성지수 가이드","MT5 가이드","XAUUSD 금 가이드","리스크 관리"]},
  sw:{title:c=>`Trading ${c}: Forex, synthetic indices, MT5 na Gold`,description:c=>`Mwongozo wa traders wa ${c} kuhusu forex, synthetic indices, MT5, Gold XAUUSD na usimamizi wa hatari.`,topics:["Jinsi ya kuanza trading","Mwongozo wa synthetic indices","Mwongozo wa MT5","Mwongozo wa Gold XAUUSD","Usimamizi wa hatari"]},
  bn:{title:c=>`${c}-এ ট্রেডিং: Forex, Synthetic Indices, MT5 ও Gold`,description:c=>`${c}-এর ট্রেডারদের জন্য Forex, Synthetic Indices, MT5, XAUUSD Gold ও risk management গাইড।`,topics:["ট্রেডিং শুরু করার উপায়","Synthetic Indices গাইড","MT5 গাইড","XAUUSD Gold গাইড","ঝুঁকি ব্যবস্থাপনা"]},
  zh:{title:c=>`${c}交易指南：Forex、合成指数、MT5与黄金`,description:c=>`面向${c}交易者的Forex、合成指数、MT5、XAUUSD黄金和风险管理指南。`,topics:["如何开始交易","合成指数指南","MT5指南","XAUUSD黄金指南","风险管理"]},
  ru:{title:c=>`Трейдинг в регионе ${c}: Forex, синтетические индексы, MT5 и золото`,description:c=>`Гид для трейдеров в регионе ${c}: Forex, синтетические индексы, MT5, золото XAUUSD и управление рисками.`,topics:["Как начать торговать","Гид по синтетическим индексам","Гид MT5","Гид по золоту XAUUSD","Управление рисками"]},
};

function getMarket(countryCode: string): LocalizedMarket | undefined {
  const code = countryCode.toUpperCase();
  if (LOCALIZED_MARKETS[code]) return LOCALIZED_MARKETS[code];
  const lang = countryToLanguage[code] || "en";
  const text = FALLBACK_LOCALIZED_TEXT[lang] || FALLBACK_LOCALIZED_TEXT.en;
  const countryName = new Intl.DisplayNames([lang], { type: "region" }).of(code) || code;
  return {
    country: code,
    countryName,
    lang,
    hreflang: `${lang}-${code}`,
    slug: countryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || code.toLowerCase(),
    nativeMarketName: countryName,
    title: text.title(countryName),
    description: text.description(countryName),
    searchTerms: [text.title(countryName), ...text.topics.slice(0, 3)],
    localContext: [countryName, `Language: ${lang}`, `Region: ${code}`],
    articleTopics: text.topics,
  };
}

export default function LocalizedMarketPage() {
  const { country } = useParams<{ country: string }>();
  const market = country ? getMarket(country) : undefined;
  if (!market) return <div className="min-h-screen bg-background"><Header /><main className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">Market guide not found</h1><Link to="/"><Button className="mt-5">Home</Button></Link></main></div>;

  const copy = languageCopy[market.lang] || languageCopy.en;
  const rtl = market.lang === "ar" || market.lang === "ur";
  const canonical = `https://botvio.live/markets/${market.slug}`;

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen bg-background">
      <SEOHead title={market.title} description={market.description} canonicalUrlOverride={canonical}
        jsonLd={{"@context":"https://schema.org","@type":"CollectionPage",name:market.title,description:market.description,url:canonical,inLanguage:market.lang}} />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-10">
          <p className="text-xs font-semibold text-primary">{market.nativeMarketName}</p>
          <h1 className="mt-3 max-w-5xl text-3xl font-extrabold leading-tight sm:text-5xl">{market.title}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-muted-foreground">{market.description}</p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">{copy.intro(market.countryName)}</p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border p-5"><BookOpen className="h-5 w-5 text-primary" /><h2 className="mt-3 font-bold">{copy.education}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{market.articleTopics[0]}. {market.articleTopics[1]}.</p></div>
            <div className="rounded-2xl border border-border p-5"><Clock3 className="h-5 w-5 text-primary" /><h2 className="mt-3 font-bold">{copy.local}</h2><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{market.localContext.map(x=><li key={x}>• {x}</li>)}</ul></div>
            <div className="rounded-2xl border border-border p-5"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="mt-3 font-bold">{copy.risk}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{market.articleTopics[4]}</p></div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">{copy.education}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{market.searchTerms.join(" · ")}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {market.articleTopics.map((topic, i) => (
              <article key={topic} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-primary">{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{topic}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {copy.intro(market.countryName)}
                </p>
                <p className="mt-4 text-xs font-medium text-primary">{copy.start} →</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/50 p-5 text-sm leading-7 text-muted-foreground">
          {copy.disclaimer}
        </section>
      </main>
    </div>
  );
}
