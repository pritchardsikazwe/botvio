export type LocalizedMarket = {
  country: string;
  countryName: string;
  lang: string;
  hreflang: string;
  slug: string;
  nativeMarketName: string;
  title: string;
  description: string;
  searchTerms: string[];
  localContext: string[];
  articleTopics: string[];
};

/**
 * Country-level SEO intent packs.
 * These are deliberately localized rather than literal translations:
 * search vocabulary, market names, spelling, examples and regional context
 * can differ even when countries share a language.
 */
export const LOCALIZED_MARKETS: Record<string, LocalizedMarket> = {
  BR: {
    country:"BR", countryName:"Brasil", lang:"pt", hreflang:"pt-BR", slug:"brasil",
    nativeMarketName:"mercado brasileiro",
    title:"Trading no Brasil: Forex, índices sintéticos, Deriv, MT5 e ouro",
    description:"Guia de trading em português do Brasil para forex, índices sintéticos, Deriv, MT5, ouro XAUUSD, gestão de risco e educação para traders brasileiros.",
    searchTerms:["trading no Brasil","forex Brasil","índices sintéticos","Deriv Brasil","MT5 Brasil","como operar forex","ouro XAUUSD"],
    localContext:["Português do Brasil","horário de Brasília","real brasileiro (BRL)","traders brasileiros"],
    articleTopics:["Como começar no forex no Brasil","Índices sintéticos no Brasil","Como usar Deriv MT5 no Brasil","XAUUSD para traders brasileiros","Gestão de risco para traders no Brasil"]
  },
  PT: {
    country:"PT", countryName:"Portugal", lang:"pt", hreflang:"pt-PT", slug:"portugal",
    nativeMarketName:"mercado português",
    title:"Trading em Portugal: Forex, índices sintéticos, Deriv, MT5 e ouro",
    description:"Guias em português europeu sobre forex, índices sintéticos, Deriv, MT5, ouro XAUUSD e gestão de risco para traders em Portugal.",
    searchTerms:["trading Portugal","forex Portugal","índices sintéticos Portugal","Deriv Portugal","MT5 Portugal","trading ouro"],
    localContext:["Português europeu","horário de Lisboa","euro (EUR)","traders em Portugal"],
    articleTopics:["Como começar a negociar forex em Portugal","Índices sintéticos em Portugal","Deriv MT5 em Portugal","Ouro XAUUSD em Portugal","Gestão de risco para traders portugueses"]
  },
  MX: {
    country:"MX", countryName:"México", lang:"es", hreflang:"es-MX", slug:"mexico",
    nativeMarketName:"mercado mexicano",
    title:"Trading en México: Forex, índices sintéticos, Deriv, MT5 y oro",
    description:"Guías en español para traders de México sobre forex, índices sintéticos, Deriv, MT5, oro XAUUSD y gestión de riesgo.",
    searchTerms:["trading en México","forex México","índices sintéticos","Deriv México","MT5 México","cómo hacer trading","oro XAUUSD"],
    localContext:["español de México","hora de Ciudad de México","peso mexicano (MXN)","traders mexicanos"],
    articleTopics:["Cómo empezar a hacer trading en México","Índices sintéticos en México","Deriv MT5 en México","Trading de oro XAUUSD en México","Gestión de riesgo para traders mexicanos"]
  },
  ES: {
    country:"ES", countryName:"España", lang:"es", hreflang:"es-ES", slug:"espana",
    nativeMarketName:"mercado español",
    title:"Trading en España: Forex, índices sintéticos, Deriv, MT5 y oro",
    description:"Guías de trading en español para España: forex, índices sintéticos, Deriv, MT5, oro XAUUSD y gestión de riesgo.",
    searchTerms:["trading España","forex España","índices sintéticos España","Deriv España","MT5 España","trading oro"],
    localContext:["español de España","hora peninsular española","euro (EUR)","traders españoles"],
    articleTopics:["Cómo empezar a hacer trading en España","Índices sintéticos y mercados derivados","Deriv MT5 en España","Oro XAUUSD para traders españoles","Gestión de riesgo en trading"]
  },
  FR: {
    country:"FR", countryName:"France", lang:"fr", hreflang:"fr-FR", slug:"france",
    nativeMarketName:"marché français",
    title:"Trading en France : Forex, indices synthétiques, Deriv, MT5 et or",
    description:"Guides de trading en français pour les traders en France : forex, indices synthétiques, Deriv, MT5, or XAUUSD et gestion du risque.",
    searchTerms:["trading en France","forex France","indices synthétiques","Deriv France","MT5 France","trading or XAUUSD"],
    localContext:["français de France","heure de Paris","euro (EUR)","traders français"],
    articleTopics:["Comment débuter le trading en France","Indices synthétiques en France","Deriv MT5 en France","Trading de l'or XAUUSD","Gestion du risque pour traders"]
  },
  DE: {
    country:"DE", countryName:"Deutschland", lang:"de", hreflang:"de-DE", slug:"deutschland",
    nativeMarketName:"deutscher Markt",
    title:"Trading in Deutschland: Forex, synthetische Indizes, Deriv, MT5 und Gold",
    description:"Deutsche Trading-Guides für Forex, synthetische Indizes, Deriv, MT5, Gold XAUUSD und Risikomanagement.",
    searchTerms:["Trading Deutschland","Forex Deutschland","synthetische Indizes","Deriv Deutschland","MT5 Deutschland","Gold Trading XAUUSD"],
    localContext:["Deutsch","Mitteleuropäische Zeit","Euro (EUR)","deutsche Trader"],
    articleTopics:["Trading in Deutschland für Anfänger","Synthetische Indizes verstehen","Deriv MT5 in Deutschland","Gold XAUUSD Trading","Risikomanagement beim Trading"]
  },
  IT: {
    country:"IT", countryName:"Italia", lang:"it", hreflang:"it-IT", slug:"italia",
    nativeMarketName:"mercato italiano",
    title:"Trading in Italia: Forex, indici sintetici, Deriv, MT5 e oro",
    description:"Guide in italiano su forex, indici sintetici, Deriv, MT5, oro XAUUSD e gestione del rischio per trader in Italia.",
    searchTerms:["trading Italia","forex Italia","indici sintetici","Deriv Italia","MT5 Italia","trading oro XAUUSD"],
    localContext:["italiano","ora italiana","euro (EUR)","trader italiani"],
    articleTopics:["Come iniziare a fare trading in Italia","Indici sintetici in Italia","Deriv MT5 in Italia","Trading dell'oro XAUUSD","Gestione del rischio nel trading"]
  },
  TR: {
    country:"TR", countryName:"Türkiye", lang:"tr", hreflang:"tr-TR", slug:"turkiye",
    nativeMarketName:"Türkiye piyasası",
    title:"Türkiye'de Trading: Forex, sentetik endeksler, Deriv, MT5 ve altın",
    description:"Türkiye'deki yatırımcılar için Türkçe forex, sentetik endeksler, Deriv, MT5, XAUUSD ve risk yönetimi rehberleri.",
    searchTerms:["Türkiye trading","Forex Türkiye","sentetik endeksler","Deriv Türkiye","MT5 Türkiye","altın XAUUSD"],
    localContext:["Türkçe","Türkiye saati","Türk lirası (TRY)","Türk traderlar"],
    articleTopics:["Türkiye'de tradinge nasıl başlanır","Sentetik endeksler nedir","Deriv MT5 Türkiye","XAUUSD altın işlemleri","Tradingde risk yönetimi"]
  },
  SA: {
    country:"SA", countryName:"السعودية", lang:"ar", hreflang:"ar-SA", slug:"saudi-arabia",
    nativeMarketName:"السوق السعودي",
    title:"التداول في السعودية: الفوركس والمؤشرات الاصطناعية وDeriv وMT5 والذهب",
    description:"دليل عربي للمتداولين في السعودية حول الفوركس، المؤشرات الاصطناعية، Deriv، MT5، الذهب XAUUSD وإدارة المخاطر.",
    searchTerms:["التداول في السعودية","الفوركس السعودية","المؤشرات الاصطناعية","Deriv السعودية","MT5 السعودية","تداول الذهب XAUUSD"],
    localContext:["العربية السعودية","توقيت الرياض","الريال السعودي (SAR)","المتداولون في السعودية"],
    articleTopics:["كيفية البدء في التداول في السعودية","المؤشرات الاصطناعية في السعودية","Deriv MT5 السعودية","تداول الذهب XAUUSD","إدارة المخاطر للمتداول السعودي"]
  },
  EG: {
    country:"EG", countryName:"مصر", lang:"ar", hreflang:"ar-EG", slug:"egypt",
    nativeMarketName:"السوق المصري",
    title:"التداول في مصر: الفوركس والمؤشرات الاصطناعية وDeriv وMT5 والذهب",
    description:"دليل عربي للمتداولين في مصر عن الفوركس والمؤشرات الاصطناعية وDeriv وMT5 والذهب وإدارة المخاطر.",
    searchTerms:["التداول في مصر","الفوركس مصر","المؤشرات الاصطناعية مصر","Deriv مصر","MT5 مصر","تداول الذهب"],
    localContext:["العربية المصرية","توقيت القاهرة","الجنيه المصري (EGP)","المتداولون في مصر"],
    articleTopics:["كيف تبدأ التداول في مصر","المؤشرات الاصطناعية في مصر","Deriv MT5 مصر","تداول XAUUSD في مصر","إدارة المخاطر"]
  },
  IN: {
    country:"IN", countryName:"भारत", lang:"hi", hreflang:"hi-IN", slug:"india",
    nativeMarketName:"भारतीय बाजार",
    title:"भारत में ट्रेडिंग: Forex, Synthetic Indices, Deriv, MT5 और Gold",
    description:"भारत के ट्रेडर्स के लिए हिंदी गाइड: Forex, Synthetic Indices, Deriv, MT5, XAUUSD Gold और risk management.",
    searchTerms:["भारत में ट्रेडिंग","Forex India","synthetic indices India","Deriv India","MT5 India","gold XAUUSD"],
    localContext:["हिन्दी","भारतीय समय (IST)","भारतीय रुपया (INR)","भारतीय ट्रेडर्स"],
    articleTopics:["भारत में ट्रेडिंग कैसे शुरू करें","Synthetic Indices क्या हैं","Deriv MT5 India","XAUUSD Gold Trading","Trading Risk Management"]
  },
  PK: {
    country:"PK", countryName:"پاکستان", lang:"ur", hreflang:"ur-PK", slug:"pakistan",
    nativeMarketName:"پاکستانی مارکیٹ",
    title:"پاکستان میں ٹریڈنگ: فاریکس، Synthetic Indices، Deriv، MT5 اور Gold",
    description:"پاکستانی ٹریڈرز کے لیے اردو گائیڈ: فاریکس، Synthetic Indices، Deriv، MT5، XAUUSD اور رسک مینجمنٹ۔",
    searchTerms:["پاکستان میں ٹریڈنگ","Forex Pakistan","Synthetic Indices Pakistan","Deriv Pakistan","MT5 Pakistan","Gold XAUUSD"],
    localContext:["اردو","پاکستانی وقت (PKT)","پاکستانی روپیہ (PKR)","پاکستانی ٹریڈرز"],
    articleTopics:["پاکستان میں ٹریڈنگ کیسے شروع کریں","Synthetic Indices کیا ہیں","Deriv MT5 پاکستان","XAUUSD Gold Trading","رسک مینجمنٹ"]
  },
  ID: {
    country:"ID", countryName:"Indonesia", lang:"id", hreflang:"id-ID", slug:"indonesia",
    nativeMarketName:"pasar Indonesia",
    title:"Trading di Indonesia: Forex, indeks sintetis, Deriv, MT5 dan emas",
    description:"Panduan trading berbahasa Indonesia untuk forex, indeks sintetis, Deriv, MT5, emas XAUUSD dan manajemen risiko.",
    searchTerms:["trading Indonesia","forex Indonesia","indeks sintetis","Deriv Indonesia","MT5 Indonesia","trading emas XAUUSD"],
    localContext:["Bahasa Indonesia","Waktu Indonesia Barat (WIB)","rupiah (IDR)","trader Indonesia"],
    articleTopics:["Cara mulai trading di Indonesia","Indeks sintetis untuk trader Indonesia","Deriv MT5 Indonesia","Trading emas XAUUSD","Manajemen risiko trading"]
  },
  MY: {
    country:"MY", countryName:"Malaysia", lang:"ms", hreflang:"ms-MY", slug:"malaysia",
    nativeMarketName:"pasaran Malaysia",
    title:"Trading di Malaysia: Forex, indeks sintetik, Deriv, MT5 dan emas",
    description:"Panduan trading dalam Bahasa Melayu untuk forex, indeks sintetik, Deriv, MT5, emas XAUUSD dan pengurusan risiko.",
    searchTerms:["trading Malaysia","forex Malaysia","indeks sintetik","Deriv Malaysia","MT5 Malaysia","trading emas XAUUSD"],
    localContext:["Bahasa Melayu","Waktu Malaysia (MYT)","ringgit Malaysia (MYR)","trader Malaysia"],
    articleTopics:["Cara mula trading di Malaysia","Indeks sintetik di Malaysia","Deriv MT5 Malaysia","Trading emas XAUUSD","Pengurusan risiko trading"]
  },
  PH: {
    country:"PH", countryName:"Pilipinas", lang:"tl", hreflang:"tl-PH", slug:"philippines",
    nativeMarketName:"merkado ng Pilipinas",
    title:"Trading sa Pilipinas: Forex, synthetic indices, Deriv, MT5 at Gold",
    description:"Gabay sa Filipino para sa forex, synthetic indices, Deriv, MT5, XAUUSD gold at risk management para sa mga trader sa Pilipinas.",
    searchTerms:["trading sa Pilipinas","forex Philippines","synthetic indices Philippines","Deriv Philippines","MT5 Philippines","gold XAUUSD"],
    localContext:["Filipino","Philippine Time (PHT)","Philippine peso (PHP)","Filipino traders"],
    articleTopics:["Paano magsimula sa trading sa Pilipinas","Synthetic indices guide","Deriv MT5 Philippines","Gold XAUUSD trading","Risk management"]
  },
  VN: {
    country:"VN", countryName:"Việt Nam", lang:"vi", hreflang:"vi-VN", slug:"vietnam",
    nativeMarketName:"thị trường Việt Nam",
    title:"Giao dịch tại Việt Nam: Forex, chỉ số tổng hợp, Deriv, MT5 và vàng",
    description:"Hướng dẫn giao dịch bằng tiếng Việt về forex, chỉ số tổng hợp, Deriv, MT5, vàng XAUUSD và quản lý rủi ro.",
    searchTerms:["giao dịch Việt Nam","forex Việt Nam","chỉ số tổng hợp","Deriv Việt Nam","MT5 Việt Nam","giao dịch vàng XAUUSD"],
    localContext:["Tiếng Việt","giờ Việt Nam (ICT)","đồng Việt Nam (VND)","nhà giao dịch Việt Nam"],
    articleTopics:["Cách bắt đầu giao dịch tại Việt Nam","Chỉ số tổng hợp là gì","Deriv MT5 Việt Nam","Giao dịch vàng XAUUSD","Quản lý rủi ro"]
  },
  TH: {
    country:"TH", countryName:"ประเทศไทย", lang:"th", hreflang:"th-TH", slug:"thailand",
    nativeMarketName:"ตลาดประเทศไทย",
    title:"เทรดในประเทศไทย: Forex, Synthetic Indices, Deriv, MT5 และทองคำ",
    description:"คู่มือภาษาไทยสำหรับ Forex, Synthetic Indices, Deriv, MT5, ทองคำ XAUUSD และการบริหารความเสี่ยง",
    searchTerms:["เทรดประเทศไทย","Forex ไทย","Synthetic Indices","Deriv ประเทศไทย","MT5 ไทย","เทรดทอง XAUUSD"],
    localContext:["ภาษาไทย","เวลาไทย (ICT)","เงินบาท (THB)","เทรดเดอร์ไทย"],
    articleTopics:["เริ่มเทรดในประเทศไทยอย่างไร","Synthetic Indices คืออะไร","Deriv MT5 ประเทศไทย","เทรดทอง XAUUSD","การบริหารความเสี่ยง"]
  },
  JP: {
    country:"JP", countryName:"日本", lang:"ja", hreflang:"ja-JP", slug:"japan",
    nativeMarketName:"日本市場",
    title:"日本のトレーディングガイド：FX、合成指数、Deriv、MT5、金",
    description:"日本のトレーダー向けに、FX、合成指数、Deriv、MT5、XAUUSD（金）、リスク管理を日本語で解説します。",
    searchTerms:["日本 トレード","FX 日本","合成指数","Deriv 日本","MT5 日本","金 XAUUSD"],
    localContext:["日本語","日本時間 (JST)","日本円 (JPY)","日本のトレーダー"],
    articleTopics:["日本でトレードを始める方法","合成指数とは","Deriv MT5 日本","XAUUSD 金取引","リスク管理"]
  },
  KR: {
    country:"KR", countryName:"대한민국", lang:"ko", hreflang:"ko-KR", slug:"south-korea",
    nativeMarketName:"한국 시장",
    title:"한국 트레이딩 가이드: Forex, 합성지수, Deriv, MT5와 금",
    description:"한국 트레이더를 위한 Forex, 합성지수, Deriv, MT5, XAUUSD 금과 리스크 관리 가이드입니다.",
    searchTerms:["한국 트레이딩","Forex 한국","합성지수","Deriv 한국","MT5 한국","금 XAUUSD"],
    localContext:["한국어","한국 표준시 (KST)","대한민국 원 (KRW)","한국 트레이더"],
    articleTopics:["한국에서 트레이딩 시작하기","합성지수란","Deriv MT5 한국","XAUUSD 금 거래","리스크 관리"]
  },
  KE: {
    country:"KE", countryName:"Kenya", lang:"sw", hreflang:"sw-KE", slug:"kenya",
    nativeMarketName:"soko la Kenya",
    title:"Trading Kenya: Forex, synthetic indices, Deriv, MT5 na Gold",
    description:"Mwongozo wa Kiswahili kwa wafanyabiashara Kenya kuhusu forex, synthetic indices, Deriv, MT5, XAUUSD na usimamizi wa hatari.",
    searchTerms:["trading Kenya","forex Kenya","synthetic indices Kenya","Deriv Kenya","MT5 Kenya","gold XAUUSD"],
    localContext:["Kiswahili","saa za Afrika Mashariki (EAT)","shilingi ya Kenya (KES)","wafanyabiashara Kenya"],
    articleTopics:["Jinsi ya kuanza trading Kenya","Synthetic indices ni nini","Deriv MT5 Kenya","Trading ya Gold XAUUSD","Usimamizi wa hatari"]
  },
  TZ: {
    country:"TZ", countryName:"Tanzania", lang:"sw", hreflang:"sw-TZ", slug:"tanzania",
    nativeMarketName:"soko la Tanzania",
    title:"Trading Tanzania: Forex, synthetic indices, Deriv, MT5 na Gold",
    description:"Mwongozo wa Kiswahili kwa traders wa Tanzania kuhusu forex, synthetic indices, Deriv, MT5, XAUUSD na usimamizi wa hatari.",
    searchTerms:["trading Tanzania","forex Tanzania","synthetic indices Tanzania","Deriv Tanzania","MT5 Tanzania","gold XAUUSD"],
    localContext:["Kiswahili","saa za Afrika Mashariki (EAT)","shilingi ya Tanzania (TZS)","traders wa Tanzania"],
    articleTopics:["Jinsi ya kuanza trading Tanzania","Synthetic indices Tanzania","Deriv MT5 Tanzania","Gold XAUUSD Tanzania","Usimamizi wa hatari"]
  },
  NG: {
    country:"NG", countryName:"Nigeria", lang:"en", hreflang:"en-NG", slug:"nigeria",
    nativeMarketName:"Nigerian market",
    title:"Trading in Nigeria: Forex, Synthetic Indices, Deriv, MT5 and Gold",
    description:"Nigeria-focused trading guides covering forex, synthetic indices, Deriv, MT5, XAUUSD gold and risk management.",
    searchTerms:["trading Nigeria","forex Nigeria","synthetic indices Nigeria","Deriv Nigeria","MT5 Nigeria","gold XAUUSD"],
    localContext:["Nigerian English","West Africa Time (WAT)","Nigerian naira (NGN)","Nigerian traders"],
    articleTopics:["How to start trading in Nigeria","Synthetic indices in Nigeria","Deriv MT5 Nigeria","Gold XAUUSD for Nigerian traders","Risk management"]
  },
  ZA: {
    country:"ZA", countryName:"South Africa", lang:"en", hreflang:"en-ZA", slug:"south-africa",
    nativeMarketName:"South African market",
    title:"Trading in South Africa: Forex, Synthetic Indices, Deriv, MT5 and Gold",
    description:"South Africa-focused trading guides for forex, synthetic indices, Deriv, MT5, XAUUSD gold and risk management.",
    searchTerms:["trading South Africa","forex South Africa","synthetic indices South Africa","Deriv South Africa","MT5 South Africa","gold XAUUSD"],
    localContext:["South African English","South Africa Standard Time (SAST)","South African rand (ZAR)","South African traders"],
    articleTopics:["How to start trading in South Africa","Synthetic indices in South Africa","Deriv MT5 South Africa","Gold XAUUSD in South Africa","Risk management"]
  },
  ZM: {
    country:"ZM", countryName:"Zambia", lang:"en", hreflang:"en-ZM", slug:"zambia",
    nativeMarketName:"Zambian market",
    title:"Trading in Zambia: Forex, Synthetic Indices, Deriv, MT5 and Gold",
    description:"Zambia-focused trading guides for forex, synthetic indices, Deriv, MT5, XAUUSD gold and practical risk management.",
    searchTerms:["trading Zambia","forex Zambia","synthetic indices Zambia","Deriv Zambia","MT5 Zambia","gold XAUUSD Zambia"],
    localContext:["Zambian English","Central Africa Time (CAT)","Zambian kwacha (ZMW)","Zambian traders"],
    articleTopics:["How to start trading in Zambia","Synthetic indices in Zambia","Deriv MT5 Zambia","Gold XAUUSD in Zambia","Risk management for Zambian traders"]
  },

  US: {
    country:"US", countryName:"United States", lang:"en", hreflang:"en-US", slug:"united-states",
    nativeMarketName:"US market", title:"Trading in the United States: Forex, Gold, MT5 and Market Research",
    description:"US-focused trading education covering forex, gold XAUUSD, MT5, market research and risk management.",
    searchTerms:["trading United States","forex USA","gold XAUUSD USA","MT5 USA","trading risk management"],
    localContext:["US English","US market hours","US dollar (USD)","US traders"],
    articleTopics:["How to start trading in the United States","Forex market sessions in the USA","Gold XAUUSD research","MT5 trading guide","Risk management"]
  },
  GB: {
    country:"GB", countryName:"United Kingdom", lang:"en", hreflang:"en-GB", slug:"united-kingdom",
    nativeMarketName:"UK market", title:"Trading in the United Kingdom: Forex, Gold, MT5 and Risk",
    description:"UK-focused trading education for forex, gold XAUUSD, MT5, market sessions and risk management.",
    searchTerms:["trading UK","forex UK","gold XAUUSD UK","MT5 UK","trading risk"],
    localContext:["UK English","London time","pound sterling (GBP)","UK traders"],
    articleTopics:["How to start trading in the UK","London session trading guide","Gold XAUUSD in the UK","MT5 trading guide","Risk management"]
  },
  CA: {
    country:"CA", countryName:"Canada", lang:"en", hreflang:"en-CA", slug:"canada",
    nativeMarketName:"Canadian market", title:"Trading in Canada: Forex, Gold, MT5 and Risk Management",
    description:"Canada-focused trading education covering forex, gold XAUUSD, MT5 and practical risk management.",
    searchTerms:["trading Canada","forex Canada","gold XAUUSD Canada","MT5 Canada","risk management"],
    localContext:["Canadian English","Canadian time zones","Canadian dollar (CAD)","Canadian traders"],
    articleTopics:["How to start trading in Canada","Forex sessions in Canada","Gold XAUUSD research","MT5 Canada guide","Risk management"]
  },
  AU: {
    country:"AU", countryName:"Australia", lang:"en", hreflang:"en-AU", slug:"australia",
    nativeMarketName:"Australian market", title:"Trading in Australia: Forex, Gold, MT5 and Risk Management",
    description:"Australia-focused trading education for forex, gold XAUUSD, MT5 and disciplined risk management.",
    searchTerms:["trading Australia","forex Australia","gold XAUUSD Australia","MT5 Australia","risk management"],
    localContext:["Australian English","Australian market hours","Australian dollar (AUD)","Australian traders"],
    articleTopics:["How to start trading in Australia","Sydney session trading guide","Gold XAUUSD Australia","MT5 trading guide","Risk management"]
  },
  SG: {
    country:"SG", countryName:"Singapore", lang:"en", hreflang:"en-SG", slug:"singapore",
    nativeMarketName:"Singapore market", title:"Trading in Singapore: Forex, Gold, MT5 and Risk Management",
    description:"Singapore-focused trading education covering forex, gold XAUUSD, MT5, market sessions and risk management.",
    searchTerms:["trading Singapore","forex Singapore","gold XAUUSD Singapore","MT5 Singapore","risk management"],
    localContext:["Singapore English","Singapore Time (SGT)","Singapore dollar (SGD)","Singapore traders"],
    articleTopics:["How to start trading in Singapore","Asian session trading guide","Gold XAUUSD Singapore","MT5 Singapore guide","Risk management"]
  },

  CH: {
    country:"CH", countryName:"Schweiz", lang:"de", hreflang:"de-CH", slug:"switzerland",
    nativeMarketName:"Schweizer Markt",
    title:"Trading in der Schweiz: Forex, Gold, MT5 und Risikomanagement",
    description:"Deutschsprachige Trading-Lernhilfen für die Schweiz zu Forex, Gold XAUUSD, MT5, Gebühren, Risiken und Anbieterprüfung.",
    searchTerms:["Trading Schweiz","Forex Schweiz","Gold XAUUSD Schweiz","MT5 Schweiz","Trading Risikomanagement"],
    localContext:["Schweizer Hochdeutsch","Schweizer Zeitzone (CET/CEST)","Schweizer Franken (CHF)","Anbieter-Verfügbarkeit in der Schweiz prüfen"],
    articleTopics:["Trading in der Schweiz: Grundlagen für Einsteiger","Forex und Handelszeiten in Schweizer Zeit","Gold XAUUSD verstehen","MT5 sicher einrichten","Risikomanagement und Anbieterprüfung"]
  },
  "CH-FR": {
    country:"CH-FR", countryName:"Suisse romande", lang:"fr", hreflang:"fr-CH", slug:"switzerland-fr",
    nativeMarketName:"Marché suisse romand",
    title:"Trading en Suisse : Forex, or, MT5 et gestion du risque",
    description:"Guides en français pour la Suisse sur le forex, l'or XAUUSD, MT5, les frais, les risques et la vérification des prestataires.",
    searchTerms:["trading Suisse","forex Suisse","or XAUUSD Suisse","MT5 Suisse","gestion du risque trading"],
    localContext:["Français de Suisse","Fuseau horaire suisse (CET/CEST)","Franc suisse (CHF)","Vérifier la disponibilité et les règles applicables"],
    articleTopics:["Débuter le trading en Suisse","Forex et horaires de marché en heure suisse","Comprendre l'or XAUUSD","Configurer MT5 avec prudence","Gestion du risque et vérification des prestataires"]
  },
  "CH-IT": {
    country:"CH-IT", countryName:"Svizzera italiana", lang:"it", hreflang:"it-CH", slug:"switzerland-it",
    nativeMarketName:"Mercato della Svizzera italiana",
    title:"Trading in Svizzera: Forex, oro, MT5 e gestione del rischio",
    description:"Guide in italiano per la Svizzera su forex, oro XAUUSD, MT5, costi, rischi e verifica dei fornitori.",
    searchTerms:["trading Svizzera","forex Svizzera","oro XAUUSD Svizzera","MT5 Svizzera","gestione del rischio trading"],
    localContext:["Italiano svizzero","Fuso orario svizzero (CET/CEST)","Franco svizzero (CHF)","Verificare disponibilità e requisiti locali"],
    articleTopics:["Come iniziare a fare trading in Svizzera","Forex e orari di mercato in ora svizzera","Capire l'oro XAUUSD","Configurare MT5 con prudenza","Gestione del rischio e verifica dei fornitori"]
  },
  CD: {
    country:"CD", countryName:"République démocratique du Congo", lang:"fr", hreflang:"fr-CD", slug:"congo-drc",
    nativeMarketName:"marché de la RDC",
    title:"Trading en RDC : Forex, or, MT5 et gestion des risques",
    description:"Guides éducatifs en français pour la République démocratique du Congo sur le forex, l’or XAUUSD, MT5, les risques et la vérification des prestataires.",
    searchTerms:["trading RDC","forex Congo Kinshasa","or XAUUSD RDC","MT5 Congo","gestion des risques trading"],
    localContext:["Français de la RDC","Heure de Kinshasa (WAT)","Franc congolais (CDF)","Vérifier la disponibilité locale des produits"],
    articleTopics:["Débuter le trading en RDC","Comprendre le forex et les sessions de marché","Comprendre l’or XAUUSD","Guide pratique de MT5","Gestion des risques et vérification des prestataires"]
  },
  CG: {
    country:"CG", countryName:"République du Congo", lang:"fr", hreflang:"fr-CG", slug:"congo-brazzaville",
    nativeMarketName:"marché congolais",
    title:"Trading au Congo-Brazzaville : Forex, or, MT5 et risques",
    description:"Guides en français sur le forex, l’or XAUUSD, MT5 et la gestion des risques pour les lecteurs de la République du Congo.",
    searchTerms:["trading Congo Brazzaville","forex Congo","or XAUUSD Congo","MT5 Congo-Brazzaville","gestion des risques"],
    localContext:["Français","Heure de Brazzaville (WAT)","Franc CFA d’Afrique centrale (XAF)","Vérifier les conditions des prestataires"],
    articleTopics:["Comment débuter le trading au Congo","Comprendre les marchés forex","Notions essentielles sur l’or XAUUSD","Configurer MT5 avec prudence","Gestion des risques avant toute transaction"]
  },
  AO: {
    country:"AO", countryName:"Angola", lang:"pt", hreflang:"pt-AO", slug:"angola",
    nativeMarketName:"mercado angolano",
    title:"Trading em Angola: Forex, ouro, MT5 e gestão de risco",
    description:"Guias educativos em português para Angola sobre forex, ouro XAUUSD, MT5, riscos e verificação de corretoras.",
    searchTerms:["trading Angola","forex Angola","ouro XAUUSD Angola","MT5 Angola","gestão de risco trading"],
    localContext:["Português de Angola","Hora de Luanda (WAT)","Kwanza angolano (AOA)","Verificar disponibilidade e regras locais"],
    articleTopics:["Como começar no trading em Angola","Noções básicas de forex e sessões de mercado","Como funciona o ouro XAUUSD","Guia de configuração do MT5","Gestão de risco e verificação de corretoras"]
  },
  SD: {
    country:"SD", countryName:"السودان", lang:"ar", hreflang:"ar-SD", slug:"sudan",
    nativeMarketName:"السوق السوداني",
    title:"التداول في السودان: الفوركس والذهب وMT5 وإدارة المخاطر",
    description:"أدلة تعليمية باللغة العربية عن الفوركس والذهب XAUUSD وMT5 وإدارة المخاطر والتحقق من شروط مزودي الخدمات في السودان.",
    searchTerms:["التداول في السودان","الفوركس السودان","الذهب XAUUSD السودان","MT5 السودان","إدارة مخاطر التداول"],
    localContext:["العربية","توقيت الخرطوم (CAT)","الجنيه السوداني (SDG)","تحقق من إتاحة المنتجات والمتطلبات المحلية"],
    articleTopics:["كيف تبدأ تعلم التداول في السودان","أساسيات الفوركس وجلسات السوق","فهم تداول الذهب XAUUSD","دليل MT5 للمبتدئين","إدارة المخاطر والتحقق من مزودي الخدمات"]
  },
  ML: {
    country:"ML", countryName:"Mali", lang:"fr", hreflang:"fr-ML", slug:"mali",
    nativeMarketName:"marché malien",
    title:"Trading au Mali : Forex, or, MT5 et gestion des risques",
    description:"Guides en français pour apprendre le forex, l’or XAUUSD, MT5 et la gestion des risques au Mali.",
    searchTerms:["trading Mali","forex Mali","or XAUUSD Mali","MT5 Mali","gestion des risques trading"],
    localContext:["Français","Heure de Bamako (GMT)","Franc CFA ouest-africain (XOF)","Vérifier les règles et produits disponibles"],
    articleTopics:["Débuter le trading au Mali","Les bases du forex et des sessions de marché","Comprendre l’or XAUUSD","Guide MT5 pour débutants","Gestion des risques et contrôle des prestataires"]
  },
  SN: {
    country:"SN", countryName:"Sénégal", lang:"fr", hreflang:"fr-SN", slug:"senegal",
    nativeMarketName:"marché sénégalais",
    title:"Trading au Sénégal : Forex, or, MT5 et gestion des risques",
    description:"Guides éducatifs en français sur le forex, l’or XAUUSD, MT5 et la gestion des risques pour le Sénégal.",
    searchTerms:["trading Sénégal","forex Sénégal","or XAUUSD Sénégal","MT5 Sénégal","gestion des risques trading"],
    localContext:["Français","Heure de Dakar (GMT)","Franc CFA ouest-africain (XOF)","Vérifier les conditions et la disponibilité des produits"],
    articleTopics:["Comment débuter le trading au Sénégal","Comprendre le forex et les sessions de marché","Notions de base sur l’or XAUUSD","Configurer MT5 avec prudence","Gestion des risques et vérification des prestataires"]
  },
  GH: {
    country:"GH", countryName:"Ghana", lang:"en", hreflang:"en-GH", slug:"ghana",
    nativeMarketName:"Ghanaian market",
    title:"Trading in Ghana: Forex, Gold, MT5 and Risk Management",
    description:"Practical trading education for Ghana covering forex, gold XAUUSD, MT5, risk management and broker due diligence.",
    searchTerms:["trading Ghana","forex Ghana","gold XAUUSD Ghana","MT5 Ghana","trading risk management"],
    localContext:["Ghanaian English","Ghana time (GMT)","Ghanaian cedi (GHS)","Check local product access and provider terms"],
    articleTopics:["How to start learning trading in Ghana","Forex basics and market sessions","Understanding gold XAUUSD","MT5 setup for beginners","Risk management and broker due diligence"]
  },
  BF: {
    country:"BF", countryName:"Burkina Faso", lang:"fr", hreflang:"fr-BF", slug:"burkina-faso",
    nativeMarketName:"marché burkinabè",
    title:"Trading au Burkina Faso : Forex, or, MT5 et gestion des risques",
    description:"Guides en français pour comprendre le forex, l’or XAUUSD, MT5 et la gestion des risques au Burkina Faso.",
    searchTerms:["trading Burkina Faso","forex Burkina Faso","or XAUUSD Burkina Faso","MT5 Burkina Faso","gestion des risques"],
    localContext:["Français","Heure de Ouagadougou (GMT)","Franc CFA ouest-africain (XOF)","Vérifier la disponibilité des services"],
    articleTopics:["Débuter le trading au Burkina Faso","Bases du forex et horaires de marché","Comprendre l’or XAUUSD","Guide MT5 pour débutants","Gestion des risques et vérification des prestataires"]
  },
  MA: {
    country:"MA", countryName:"المغرب", lang:"ar", hreflang:"ar-MA", slug:"morocco",
    nativeMarketName:"السوق المغربي",
    title:"التداول في المغرب: الفوركس والذهب وMT5 وإدارة المخاطر",
    description:"أدلة تعليمية بالعربية حول الفوركس والذهب XAUUSD وMT5 وإدارة المخاطر والتحقق من شروط الخدمات المتاحة في المغرب.",
    searchTerms:["التداول في المغرب","الفوركس المغرب","الذهب XAUUSD المغرب","MT5 المغرب","إدارة مخاطر التداول"],
    localContext:["العربية والدارجة المغربية","توقيت المغرب","الدرهم المغربي (MAD)","تحقق من القواعد المحلية وإتاحة المنتجات"],
    articleTopics:["كيف تبدأ تعلم التداول في المغرب","أساسيات الفوركس وجلسات السوق","فهم الذهب XAUUSD","دليل MT5 للمبتدئين","إدارة المخاطر والتحقق من مزودي الخدمات"]
  },
  "MA-FR": {
    country:"MA-FR", countryName:"Maroc", lang:"fr", hreflang:"fr-MA", slug:"morocco-fr",
    nativeMarketName:"marché marocain",
    title:"Trading au Maroc : Forex, or, MT5 et gestion des risques",
    description:"Guides en français sur le forex, l’or XAUUSD, MT5, les risques et la vérification des prestataires pour le public marocain.",
    searchTerms:["trading Maroc","forex Maroc","or XAUUSD Maroc","MT5 Maroc","gestion des risques trading"],
    localContext:["Français du Maroc","Heure du Maroc","Dirham marocain (MAD)","Vérifier la réglementation et les produits disponibles"],
    articleTopics:["Comment débuter le trading au Maroc","Comprendre le forex et les horaires de marché","Comprendre l’or XAUUSD","Guide MT5 pour débutants","Gestion des risques et vérification des prestataires"]
  },
  QA: {
    country:"QA", countryName:"قطر", lang:"ar", hreflang:"ar-QA", slug:"qatar",
    nativeMarketName:"السوق القطري", title:"التداول في قطر: الفوركس والذهب وMT5 وإدارة المخاطر",
    description:"دليل عربي للمتداولين في قطر حول الفوركس والذهب XAUUSD وMT5 وإدارة المخاطر وسياق السوق المحلي.",
    searchTerms:["التداول في قطر","الفوركس قطر","الذهب XAUUSD قطر","MT5 قطر","إدارة المخاطر"],
    localContext:["العربية","توقيت الدوحة (UTC+3)","الريال القطري (QAR)","المتداولون في قطر"],
    articleTopics:["كيفية البدء في التداول في قطر","جلسات الفوركس بتوقيت الدوحة","تداول الذهب XAUUSD في قطر","دليل MT5 في قطر","إدارة المخاطر"]
  },
  KW: {
    country:"KW", countryName:"الكويت", lang:"ar", hreflang:"ar-KW", slug:"kuwait",
    nativeMarketName:"السوق الكويتي", title:"التداول في الكويت: الفوركس والذهب وMT5 وإدارة المخاطر",
    description:"دليل عربي للمتداولين في الكويت حول الفوركس والذهب XAUUSD وMT5 وإدارة المخاطر.",
    searchTerms:["التداول في الكويت","الفوركس الكويت","الذهب XAUUSD الكويت","MT5 الكويت","إدارة المخاطر"],
    localContext:["العربية","توقيت الكويت (UTC+3)","الدينار الكويتي (KWD)","المتداولون في الكويت"],
    articleTopics:["كيفية البدء في التداول في الكويت","جلسات الفوركس بتوقيت الكويت","تداول الذهب XAUUSD","دليل MT5","إدارة المخاطر"]
  },
  BH: {
    country:"BH", countryName:"البحرين", lang:"ar", hreflang:"ar-BH", slug:"bahrain",
    nativeMarketName:"السوق البحريني", title:"التداول في البحرين: الفوركس والذهب وMT5 وإدارة المخاطر",
    description:"دليل عربي للمتداولين في البحرين حول الفوركس والذهب XAUUSD وMT5 وإدارة المخاطر.",
    searchTerms:["التداول في البحرين","الفوركس البحرين","الذهب XAUUSD البحرين","MT5 البحرين","إدارة المخاطر"],
    localContext:["العربية","توقيت البحرين (UTC+3)","الدينار البحريني (BHD)","المتداولون في البحرين"],
    articleTopics:["كيفية البدء في التداول في البحرين","جلسات الفوركس بتوقيت البحرين","تداول الذهب XAUUSD","دليل MT5","إدارة المخاطر"]
  },
  OM: {
    country:"OM", countryName:"عُمان", lang:"ar", hreflang:"ar-OM", slug:"oman",
    nativeMarketName:"السوق العُماني", title:"التداول في عُمان: الفوركس والذهب وMT5 وإدارة المخاطر",
    description:"دليل عربي للمتداولين في عُمان حول الفوركس والذهب XAUUSD وMT5 وإدارة المخاطر.",
    searchTerms:["التداول في عمان","الفوركس عمان","الذهب XAUUSD عمان","MT5 عمان","إدارة المخاطر"],
    localContext:["العربية","توقيت عُمان (UTC+4)","الريال العُماني (OMR)","المتداولون في عُمان"],
    articleTopics:["كيفية البدء في التداول في عُمان","جلسات الفوركس بتوقيت مسقط","تداول الذهب XAUUSD","دليل MT5","إدارة المخاطر"]
  },
};

export const LOCALIZED_MARKET_LIST = Object.values(LOCALIZED_MARKETS);
