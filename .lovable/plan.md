

## Plan: Fix Advert Banner Position, Speed & Add Strategy Posts

### Changes

**1. Move advert banner outside AI Chart Analysis (Index.tsx)**
- Move `<ScrollingAdvertBanner />` from its current position (line 246, right after ChartUpload) to sit between the Broker Quick-Links section and the News Events section — making it fully independent of AI Chart Analysis.

**2. Speed up marquee animation (index.css)**
- Change `animation: marquee 30s linear infinite` to `animation: marquee 15s linear infinite` for a noticeably faster scroll.

**3. Add 3 Strategy posts below Latest Articles (Index.tsx)**
- Create a new `<LatestStrategies />` component (inline in Index.tsx) that fetches 3 strategies from the `strategies` table (public, ordered by downloads desc, limit 3).
- Render them as cards with title, market badge, pricing badge, and description — linking to `/strategies/{slug}`.
- Place this section directly below `<LatestArticles />` and above the footer.

### Files to modify
- `src/pages/Index.tsx` — move banner, add LatestStrategies section
- `src/index.css` — speed up marquee from 30s → 15s

