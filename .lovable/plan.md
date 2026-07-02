## Organic Traffic Expansion Plan

Three parallel workstreams: content depth (30 new posts), on-page SEO polish, and multilingual reach.

### 1. Content: 30 new long-form articles (800–1200 words each)

Added to `src/content/blogPosts.ts`. Category mix targets high-intent long-tail:

**Synthetic Indices (Deriv) — 8 posts**
- Volatility 75 Index scalping strategy 2026
- Boom 1000 vs Boom 500: which pays more
- Crash 300 Index spike trading guide
- Step Index vs Range Break: choosing the right synthetic
- Jump 25 Index strategy for beginners
- Deriv MT5 vs DTrader: which platform wins
- Deriv accumulator options: full playbook
- V10 (1s) micro-scalping tactics

**Gold / XAUUSD — 6 posts**
- XAUUSD London session breakout system
- Gold NY open reversal strategy
- Gold correlation with DXY explained
- XAUUSD scalping with EMA 20/50 confluence
- Gold weekly forecast framework
- Trading gold during FOMC (safe entry rules)

**Forex majors — 6 posts**
- EURUSD Asian range breakout playbook
- GBPUSD London killzone strategy
- USDJPY carry trade guide
- GBPJPY volatility scalping
- Best forex pairs for African traders
- Best forex pairs for Asian traders (INR, PKR, PHP context)

**Crypto — 4 posts**
- BTCUSD daily bias framework
- ETH/BTC ratio for altseason timing
- Crypto scalping on Binance: 5m setup
- Trading Bitcoin halving cycles

**Regional / Broker — 6 posts**
- Best forex brokers in Zambia 2026
- Best forex brokers in Nigeria (regulated list)
- Deriv payment methods in Kenya
- Forex trading in South Africa: FSCA rules
- Deriv India: legality + funding guide
- Forex in Pakistan: brokers + PKR funding
- Forex trading in the Philippines

Each article includes: intro hook, strategy/steps, risk parameters, worked example, common mistakes, FAQ (3–5 Qs), CTA to relevant signal/hub page, and 3–5 internal links.

### 2. Internal linking + schema

**BlogPost.tsx**
- Article + BreadcrumbList + FAQPage JSON-LD injected per post
- Author byline block (Botvio Research Desk)
- Related posts widget (3 posts, same category)
- Table of contents for posts >800 words
- Contextual "Trade this now" CTA linking to the relevant hub (`/gold`, `/chart/EURUSD`, `/binance`, etc.)

**MarketAnalysis.tsx + hub pages**
- Add "Latest analysis" strip linking to newest 6 blog posts
- Reciprocal links from `/gold`, `/chart/*`, `/binance` back to relevant analysis articles

### 3. Multilingual SEO (FR, ES, PT, AR)

- Extend `src/i18n/seoRegistry.ts` + `src/i18n/seo/{fr,es,pt,ar}.json` with translated titles/descriptions/keywords for: home, /signals, /gold, /market-analysis, /marketplace, /blog, /learn, /binance, /trade-modes
- Sitemap already emits hreflang per language — verify `/market-analysis` and blog slugs are included
- Regional article slugs (Zambia, Nigeria, India, etc.) remain English-only (regional audiences search in English)

### 4. Sitemap + robots

- Add `/market-analysis` and all 30 new blog slugs to `supabase/functions/sitemap-xml/index.ts` (dynamic — pulled from `blogPosts.ts`? No, blog posts live in code, so hardcode via a static list export from `blogPosts.ts`)
- Confirm robots.txt still allows `/blog/` and `/market-analysis`

### Technical details

- `blogPosts.ts` grows by ~30 entries with `slug`, `title`, `description`, `keywords`, `category`, `date`, `readTime`, `content` (HTML). No DB migration.
- JSON-LD via inline `<script type="application/ld+json">` in BlogPost.tsx `<Helmet>`.
- Related posts: filter `blogPosts` by category, exclude current slug, take 3.
- No new dependencies. No backend/edge function changes except sitemap update.

### Files touched
- `src/content/blogPosts.ts` (append 30 posts)
- `src/pages/BlogPost.tsx` (JSON-LD, byline, related posts, TOC)
- `src/pages/MarketAnalysis.tsx` (latest-analysis strip)
- `src/i18n/seo/{fr,es,pt,ar}.json` (translated metadata)
- `src/i18n/seoRegistry.ts` (register new keys if needed)
- `supabase/functions/sitemap-xml/index.ts` (add blog slugs + /market-analysis if missing)

### Out of scope
- Backlink outreach (off-platform)
- Real Google Analytics/AdSense IDs (user-provided secrets)
- Translating full article bodies (only meta translated — bodies stay English)