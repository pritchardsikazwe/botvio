
# Phase 4 — Learning Paths & Transparency

Goal: give visitors a clear "where do I start" journey and prove Botvio is transparent about method, performance, and limits — key AdSense trust signals.

## 1. Structured Learning Paths

New file `src/content/learningPaths.ts` defining 3 curated paths as ordered reading lists (each item links to an existing lesson, blog post, or hub):

- **Beginner Path** — "Forex from Zero" (8 steps: what is forex, pips/lots, MT5 setup, first demo trade, risk management, journaling, psychology, 1st live trade checklist)
- **Intermediate Path** — "Strategy Builder" (8 steps: SMC basics, supply/demand, order blocks, liquidity, session timing, XAUUSD structure, backtesting, building a plan)
- **Advanced Path** — "Prop Firm & Systematic" (8 steps: prop firm rules, drawdown math, correlation, position sizing models, Deriv indices systematic, algo signals, review cycles, going full-time)

New page `src/pages/LearningPaths.tsx` at `/learning-paths` with:
- Hero explaining the free curriculum
- 3 path cards, each expandable to show the 8-step checklist
- Progress persistence in `localStorage` (checkbox per step, per path)
- Breadcrumbs, SEOHead, Course JSON-LD
- Link into each step (opens the existing article/lesson)

New page `src/pages/LearningPathDetail.tsx` at `/learning-paths/:slug` — dedicated page per path with full step list, "mark complete" checkboxes, estimated time, prerequisites, next-path CTA.

Add to header nav under "Learn" (or as a new "Start Here" link) and to homepage as a "New here? Start with our free curriculum" band.

## 2. Transparency Pages

- `src/pages/Methodology.tsx` at `/methodology` — how Botvio produces signals, chart analysis, and education: sources, tools, human review, AI usage, limitations, what we don't do (no PAMM, no fund management, no guaranteed returns).
- `src/pages/PerformanceTransparency.tsx` at `/performance-transparency` — honest framing: signals are educational, hypothetical vs live, why past ≠ future, screenshots policy (from `signals_performance` when present), full risk disclosure. Pulls counts from `signals_performance` if available, otherwise shows a clean "we're publishing verified track record starting {month}" placeholder — no fabricated numbers.
- `src/pages/Trust.tsx` at `/trust` — index page linking every trust asset (About, Editorial Policy, Fact-Checking, Corrections, Affiliate Disclosure, AI Content Policy, Methodology, Performance Transparency, Contact) with 1-line description each. This becomes the single hub AdSense reviewers can audit.

## 3. Homepage + Footer wiring

- Homepage: add a compact "Start Here" section above the fold linking the 3 learning paths.
- Footer: add "Trust Center" link (`/trust`), "Methodology", "Performance Transparency", and "Start Learning" under existing Trust & Learn columns.
- Header: add "Start Here" link pointing to `/learning-paths`.

## 4. Technical

- Register 5 new routes in `src/AppRoutes.tsx` (all public, no `<Paid>` wrapper — learning is free per Phase 1 positioning).
- Add all 5 URLs to `public/sitemap.xml` and the dynamic sitemap edge function.
- Each new page: SEOHead with unique title/description, single H1, breadcrumbs, canonical.
- No DB schema changes. No new edge functions. Progress state is client-side only for now (avoids auth-gating free content).

Deliverables:
1. `src/content/learningPaths.ts`
2. `src/pages/LearningPaths.tsx`
3. `src/pages/LearningPathDetail.tsx`
4. `src/pages/Methodology.tsx`
5. `src/pages/PerformanceTransparency.tsx`
6. `src/pages/Trust.tsx`
7. Edits to `AppRoutes.tsx`, `Header.tsx`, `SiteFooter.tsx`, `Index.tsx`, `public/sitemap.xml`.
