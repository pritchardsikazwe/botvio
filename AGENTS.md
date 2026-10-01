# Project architecture rules

- Classify Weltrade SyntX instruments by family before analysis; ordinary Forex, metals, crypto and stocks retain the generic market engine because SyntX mechanics are family-specific.
- Publish SyntX event or regime labels only from observable loaded market data; show “Data unavailable” when the required tick or sequence state is absent to prevent fabricated analysis.- MT5 copy execution goes through the TradeCopy adapter (`supabase/functions/_shared/tradecopy`) via the `tradecopy-api` edge function only; the X-API-KEY never reaches the browser.
- TradeCopy uses the mock adapter unless both `TRADECOPY_API_KEY` and `TRADECOPY_MODE=live` are set, and LIVE copying also needs the `tradecopy_live_enabled` app setting plus per-relationship confirmation, to prevent accidental real trades.
- The Bridge EA/VPS MT5 path is deprecated but kept until TradeCopy demo verification succeeds.
- Canonical SEO origin is the BASE_URL constant in src/config/domain.ts (https://botvio.live); SEOHead and sitemap/robots functions ignore DB/host values so preview hosts never leak into canonicals (guarded by src/test/seo-canonical.test.ts).
