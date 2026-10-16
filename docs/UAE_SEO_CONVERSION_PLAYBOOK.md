# Botvio UAE/Dubai SEO and referral conversion implementation

## Shipped in this branch
- The `/start-trading` broker comparison page is positioned for Dubai/UAE research intent and distinguishes synthetic indices from forex/gold.
- Market-intent selection supports `?market=synthetics`, `?market=deriv`, `?market=forex`, `?market=gold`, and `?market=xauusd` for campaign-specific deep links.
- The page records `broker_market_preference` when a visitor selects a market category and `affiliate_outbound_click` when a broker CTA is clicked. Events include source/medium/campaign, content, device, page, locale, market intent and destination where available.
- The page uses the existing Deriv and Exness affiliate URLs. It does not claim either broker accepts every UAE resident; the visitor is told to verify the applicable entity and product eligibility.
- `public/sitemap-uae-conversion.xml` lists the broker choice page and the UAE/Dubai content cluster. `robots.txt` references this sitemap.

## Analytics verification required after deploy
1. In Supabase, verify the `analytics_events` table has the columns used by the existing global tracker and this page: `event_name`, `path`, `referrer`, `source`, `medium`, `campaign`, `device_type`, and `metadata`. Some installations also use visitor/session/user IDs.
2. Confirm insert RLS permits anonymous event inserts without allowing visitors to read or alter other users' data. Do not weaken policies just to make tracking work.
3. Visit `/start-trading?utm_source=google&utm_medium=organic&utm_campaign=uae_gold&utm_content=gold_guide&market=xauusd`; select forex/gold, then click Exness. Confirm one `broker_market_preference` and one `affiliate_outbound_click` event appear with the expected campaign metadata.
4. Repeat with `utm_source=google&utm_medium=organic&utm_campaign=uae_synthetics&utm_content=synthetic_guide&market=synthetics` and Deriv.
5. Check browser console/network for Supabase RLS or schema errors. If an insert fails, fix the schema/policy through a reviewed migration; do not silently claim conversions are measured.
6. Click tracking measures outbound referral clicks, not broker registrations or commission. Actual registrations/approved referrals require partner reporting or postback support from the broker.

## Search Console measurement
- In Google Search Console, filter Performance by Country = United Arab Emirates; compare clicks, impressions, CTR and average position over 28 days vs previous 28 days.
- Break down by Page and Query. Segment UAE intent URLs (`/dubai`, `/ar/dubai`, Dubai blog guides and `/start-trading`) separately from worldwide pages.
- Track high-intent query themes: gold/XAUUSD UAE, gold trading Dubai, forex trading UAE, MT5 Dubai, Deriv synthetic indices UAE, and Deriv vs Exness Dubai. Treat them as targets to validate, not as proof of current rankings.
- Search Console does not report city-level Dubai visits reliably. Use first-party analytics with appropriate consent and available geography dimensions if city-level measurement is needed.
- Submit `https://botvio.live/sitemap-uae-conversion.xml` in Search Console after deployment. Request indexing only after checking that each listed URL returns a successful canonical page.

## Editorial and compliance guardrails
- Keep the gold/XAUUSD and forex learning material informational: explain spread, swap/financing, leverage, slippage, volatility, session time in GST (UTC+4), and demo practice.
- Use original analysis, examples, and sources; do not create thin near-duplicate city pages or repeat “Dubai/UAE” unnaturally.
- Show affiliate disclosure close to broker CTAs and retain the full disclosure page.
- Do not claim guaranteed profit, risk-free trading, instant withdrawals, UAE authorization, or product availability without current primary-source evidence.
- Before actively targeting UAE residents with financial promotions, obtain qualified compliance review against applicable UAE rules and the specific broker entity/product. This implementation is not legal advice.
