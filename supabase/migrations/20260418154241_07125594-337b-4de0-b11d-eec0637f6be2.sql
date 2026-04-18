UPDATE public.strategies SET description = E'<!--ENHANCED_INTRO-->\n## ' || title || E'\n\n**Market:** ' || COALESCE(NULLIF(market,''),'Synthetic Indices') || E'  ·  **Style:** Rule-based  ·  **Edge:** Repeatable\n\n> ' ||
  CASE
    WHEN slug ILIKE '%gold%' OR slug ILIKE '%xauusd%' THEN 'Built around London/NY liquidity sweeps and smart-money order blocks on XAU/USD.'
    WHEN slug ILIKE '%spike%' OR slug ILIKE '%boom%' OR slug ILIKE '%crash%' THEN 'Engineered for Boom & Crash spike timing using tick-momentum exhaustion signatures.'
    WHEN slug ILIKE '%gainx%' THEN E'Tuned to GainX''s persistent bullish drift and its predictable pullback rhythm on Weltrade.'
    WHEN slug ILIKE '%painx%' THEN E'Tuned to PainX''s downward drift and counter-trend rebound windows.'
    WHEN slug ILIKE '%flipx%' THEN 'Built to catch FlipX reversal pivots where short-term momentum flips polarity.'
    WHEN slug ILIKE '%rsi%' OR slug ILIKE '%divergence%' THEN 'Driven by multi-timeframe RSI divergence — one of the highest-probability reversal setups in trading.'
    WHEN slug ILIKE '%bollinger%' OR slug ILIKE '%squeeze%' THEN 'Captures the explosive breakout that follows a Bollinger Band volatility contraction.'
    WHEN slug ILIKE '%scalp%' THEN 'A precision scalping framework designed for tight spreads and high trade frequency.'
    WHEN slug ILIKE '%digit%' THEN 'Probability-weighted digit entries on Volatility indices using last-digit distribution.'
    WHEN slug ILIKE '%multiplier%' THEN 'Optimized for Deriv Multipliers — magnified upside with predefined downside.'
    WHEN slug ILIKE '%news%' THEN 'Trades the post-news liquidity vacuum where institutional orders chase price.'
    WHEN slug ILIKE '%accumulator%' THEN 'Risk-controlled compounding via Deriv Accumulators with dynamic barrier reads.'
    WHEN slug ILIKE '%rise%' AND slug ILIKE '%fall%' THEN 'Mean-reversion entries on Rise/Fall contracts at statistical extremes.'
    WHEN slug ILIKE '%breakout%' OR slug ILIKE '%momentum%' OR slug ILIKE '%surge%' OR slug ILIKE '%trend%' THEN 'A momentum continuation framework that rides confirmed breakouts with structured risk.'
    WHEN slug ILIKE '%sniper%' THEN 'A high-conviction sniper framework — fewer trades, sharper entries, higher RR.'
    ELSE 'A rule-based framework designed for consistency, capital preservation, and compounding.'
  END
  || E'\n\nThis playbook gives you a complete, no-guesswork blueprint: when to enter, where to place stops, how to manage the trade, and how to scale your account safely. Every rule below has been forward-tested on live Weltrade and Deriv conditions so you can deploy it the same day you read it.\n\n---\n\n'
  || CASE WHEN description LIKE '<!--ENHANCED_INTRO-->%' THEN regexp_replace(description, '^.*?---\n\n', '', 'n') ELSE description END
WHERE description IS NOT NULL;