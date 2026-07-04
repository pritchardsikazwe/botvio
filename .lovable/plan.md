## Goal

Move Botvio's learning academy from `?category=` query URLs to clean, SEO-friendly path URLs, add category-page SEO (canonical, Course/Breadcrumb schema, metadata), preserve rankings via 301-style redirects, and expand the category taxonomy.

## Scope (this migration)

Focused on the Learn/education surface — the actual "courses" the user cites. Blog, strategies, and other slugs already use clean URLs and are out of scope.

## URL structure

```
/learn                              → academy index (all categories)
/learn/:category                    → category page (e.g. /learn/forex, /learn/smart-money-concepts)
/learn/:category/:lesson            → lesson page
```

Legacy → new (client-side 301-equivalent using `<Navigate replace>`):
- `/learn?category=X`           → `/learn/X`
- `/learn/:lesson?category=X`   → `/learn/X/:lesson`

Slugs are lowercase, hyphen-separated, unique. True HTTP 301s are not possible from a static SPA; permanent client redirects + updated sitemap + canonical tags carry the SEO signal, which is the standard SPA pattern.

## Database

Add categories as first-class rows so slugs, titles, descriptions, and SEO metadata are editable in one place.

```
public.learn_categories(
  id, slug (unique), name, description,
  parent_slug, sort_order, icon, hero_image_url,
  seo_title, seo_description, is_active,
  created_at, updated_at
)
```

`education_lessons` already has `slug` + `category`; add FK-style `category_slug` alignment and backfill. New lessons/categories auto-generate slugs (slugify on insert) with uniqueness check.

Seed the expanded taxonomy from the user's list, grouped by parent:
- Financial Markets (forex, smc, ict, price-action, gold, synthetic-indices, boom-crash, crypto, binary-options, …)
- Investing (stock-investing, etf, reits, dividend, …)
- Make Money Online (affiliate-marketing, blogging, youtube-automation, freelancing, …)
- Side Hustles (student-side-hustles, ai-side-hustles, dropshipping, print-on-demand, …)
- Business (business-planning, accounting, sales, branding, …)
- Entrepreneurship (startup-funding, lean-startup, scaling, …)

## Routing changes

- `AppRoutes.tsx`: add `/learn/:category` and `/learn/:category/:lesson`; keep `/learn` index.
- Add `<LegacyLearnRedirect />` mounted on `/learn` that reads `?category=` and `<Navigate replace to={/learn/${cat}}>`. Same for `/learn/:lesson?category=`.
- `Learn.tsx`: when `:category` param present, filter to that category; otherwise show all-category index.
- `Lesson.tsx`: read category from path, remove query-param reads; update prev/next/back links.

## SEO per page

Every `/learn/:category` and `/learn/:category/:lesson` gets:
- Dynamic `<title>` and meta description (from DB or derived).
- `<link rel="canonical">` self-referencing the clean URL (handled by existing `SEOHead`).
- Open Graph + Twitter tags.
- JSON-LD: `BreadcrumbList` (Home › Learn › Category › Lesson) and `Course` schema on category/lesson pages (name, description, provider = Botvio, inLanguage, educationalLevel).
- Visible breadcrumb component at top of category/lesson pages.

## Internal links

Update every place that links to `?category=`:
- `src/pages/Learn.tsx` (lesson cards)
- `src/pages/Lesson.tsx` (back / prev / next)
- `src/components/chart/EducationMiniCard.tsx`
- `src/components/courses/CourseEnrollmentCards.tsx`
- Footer, homepage learn tiles, search results, related-course widgets

## Sitemap

Update `supabase/functions/sitemap-xml/index.ts`:
- Emit `/learn` + one entry per category (`/learn/:slug`) from `learn_categories`.
- Continue emitting `/learn/:category/:lesson` for every published lesson under its category.
- Remove any legacy `?category=` variants.

## Admin

Extend the admin education panel:
- CRUD for `learn_categories` (slug editor with live preview + duplicate detection).
- Slug regenerate button; on slug change, insert redirect mapping row so the old URL keeps resolving.
- Lesson editor gains a category picker sourced from the new table.

## Performance & polish

- Lazy-load category hero images (`loading="lazy"`).
- Prefetch adjacent lessons on hover.
- No changes to build pipeline needed beyond what Vite already does (minify, code-split).

## Out of scope

- True 301 responses from origin (SPA constraint; client `Navigate replace` + canonical + sitemap is the intended equivalent).
- Renaming `/learn` → `/courses` (the two options were alternatives; sticking with `/learn` for backwards continuity and existing indexed URLs).
- Non-learning slugs (blog, strategies, chart pairs) — already clean.

## Deliverables

1. Migration: `learn_categories` table + seed rows + backfill of `education_lessons.category`.
2. Route additions + legacy redirect components.
3. `Learn.tsx` / `Lesson.tsx` rewrites to path-based params + breadcrumbs + Course/BreadcrumbList schema.
4. All internal links updated.
5. `sitemap-xml` edge function updated.
6. Admin category manager.

## Confirmations needed

1. Keep the URL prefix as `/learn/...` (not `/courses/...`)?
2. OK to add the full expanded taxonomy you listed (~120 categories) as seed data, even if most have zero lessons today? (Empty categories will render a "coming soon" state and still be indexable.)
