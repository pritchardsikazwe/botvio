-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_settings table
CREATE TABLE public.user_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    default_pair TEXT DEFAULT 'XAUUSD',
    default_timeframe TEXT DEFAULT 'M5',
    notifications_enabled BOOLEAN DEFAULT true,
    risk_per_trade DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create broker_tokens table (encrypted storage)
CREATE TABLE public.broker_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_name TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, broker_name)
);

-- Create trading_signals table for Hauza Sniper signals
CREATE TABLE public.trading_signals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    strategy_name TEXT NOT NULL DEFAULT 'Hauza Sniper',
    symbol TEXT NOT NULL DEFAULT 'XAUUSD',
    timeframe TEXT NOT NULL DEFAULT 'M5',
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    entry_price DECIMAL(12,5) NOT NULL,
    stop_loss DECIMAL(12,5),
    take_profit DECIMAL(12,5),
    zone_min DECIMAL(12,5),
    zone_max DECIMAL(12,5),
    reason TEXT,
    confidence INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_trades table for performance tracking
CREATE TABLE public.user_trades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES public.trading_signals(id),
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    entry_price DECIMAL(12,5) NOT NULL,
    exit_price DECIMAL(12,5),
    stop_loss DECIMAL(12,5),
    take_profit DECIMAL(12,5),
    lot_size DECIMAL(10,4),
    profit_loss DECIMAL(12,2),
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WIN', 'LOSS', 'BREAKEVEN')),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create education_lessons table
CREATE TABLE public.education_lessons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'hauza-sniper',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_lessons ENABLE ROW LEVEL SECURITY;

-- Create helper function for ownership check
CREATE OR REPLACE FUNCTION public.is_owner(record_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = record_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_owner(user_id));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_owner(user_id));

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(user_id));

-- User settings policies
CREATE POLICY "Users can view own settings"
ON public.user_settings FOR SELECT
TO authenticated
USING (public.is_owner(user_id));

CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE
TO authenticated
USING (public.is_owner(user_id));

-- Broker tokens policies (secure - only owner access)
CREATE POLICY "Users can view own tokens"
ON public.broker_tokens FOR SELECT
TO authenticated
USING (public.is_owner(user_id));

CREATE POLICY "Users can insert own tokens"
ON public.broker_tokens FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update own tokens"
ON public.broker_tokens FOR UPDATE
TO authenticated
USING (public.is_owner(user_id));

CREATE POLICY "Users can delete own tokens"
ON public.broker_tokens FOR DELETE
TO authenticated
USING (public.is_owner(user_id));

-- Trading signals policies (all authenticated users can read)
CREATE POLICY "All users can view signals"
ON public.trading_signals FOR SELECT
TO authenticated
USING (true);

-- User trades policies
CREATE POLICY "Users can view own trades"
ON public.user_trades FOR SELECT
TO authenticated
USING (public.is_owner(user_id));

CREATE POLICY "Users can insert own trades"
ON public.user_trades FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update own trades"
ON public.user_trades FOR UPDATE
TO authenticated
USING (public.is_owner(user_id));

-- Education lessons policies (all authenticated users can read)
CREATE POLICY "All users can view lessons"
ON public.education_lessons FOR SELECT
TO authenticated
USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_broker_tokens_updated_at
BEFORE UPDATE ON public.broker_tokens
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert education lessons
INSERT INTO public.education_lessons (lesson_number, title, slug, content, category) VALUES
(1, 'Overview - Understanding Hauza Sniper', 'overview', 
'# What is Hauza Sniper Strategy?

## What is XAUUSD (Gold)?
XAUUSD represents the price of one ounce of gold in US dollars. Gold is one of the most popular trading instruments due to:
- **High liquidity** - Easy to enter and exit trades
- **Volatility** - Creates trading opportunities
- **Safe haven** - Moves differently from stocks

## What are "Sniper Entries"?
Sniper entries are **precise, high-quality trade setups** where you wait for the perfect moment to enter. Instead of taking many trades, you wait for:
- Clear support/resistance zones
- Strong price rejection signals (wicks)
- Trend confirmation (EMA)

## The Hauza Sniper Concept
The strategy focuses on three key elements:
1. **Support & Resistance Zones** - Where price tends to bounce
2. **Wick Rejections** - Candles showing buyer/seller rejection
3. **EMA Trend Filter** - Ensuring you trade with the trend

⚠️ **Risk Warning**: Trading involves risk. Never trade with money you cannot afford to lose.', 
'hauza-sniper'),

(2, 'Support & Resistance Zones', 'support-resistance',
'# Understanding Support & Resistance

## What is Support?
Support is a price level where **buying pressure is strong enough to stop price from falling further**. Think of it as a "floor" where price tends to bounce up.

### How to Identify Support:
- Look for areas where price has bounced up multiple times
- The more times price respects a level, the stronger the support
- Recent lows often become support levels

## What is Resistance?
Resistance is a price level where **selling pressure is strong enough to stop price from rising further**. Think of it as a "ceiling" where price tends to reject and fall.

### How to Identify Resistance:
- Look for areas where price has been rejected downward
- Multiple touches = stronger resistance
- Recent highs often become resistance levels

## Zones vs Lines
The Hauza strategy uses **zones** instead of exact lines because:
- Price rarely respects exact levels
- A zone accounts for market noise
- More reliable trading signals

## How the App Detects Zones
The app automatically:
1. Identifies swing highs (resistance candidates)
2. Identifies swing lows (support candidates)
3. Clusters nearby levels into zones
4. Shows zone strength based on number of touches',
'hauza-sniper'),

(3, 'Sniper Candles & Wicks', 'candles-wicks',
'# Reading Candles for Sniper Entries

## Understanding Candle Wicks
Wicks (or shadows) show where price tried to go but was rejected:
- **Long lower wick** = Buyers rejected lower prices (bullish signal)
- **Long upper wick** = Sellers rejected higher prices (bearish signal)

## The 50% Rule
For a valid Hauza Sniper setup, the wick should be **at least 50% of the total candle range**:
```
Wick Size / (High - Low) >= 50%
```

## Sniper BUY Setup
Look for all these conditions at **SUPPORT**:
1. ✅ Price is at or near a support zone
2. ✅ Candle has a long lower wick (≥50% of range)
3. ✅ Candle closes bullish (green - close > open)
4. ✅ Price is above EMA 20

## Sniper SELL Setup
Look for all these conditions at **RESISTANCE**:
1. ✅ Price is at or near a resistance zone
2. ✅ Candle has a long upper wick (≥50% of range)
3. ✅ Candle closes bearish (red - close < open)
4. ✅ Price is below EMA 20

## Why Wicks Matter
Wicks show institutional rejection:
- Long lower wick at support = Big buyers stepping in
- Long upper wick at resistance = Big sellers pushing down',
'hauza-sniper'),

(4, 'EMA Trend Filter', 'ema-trend',
'# The EMA 20 Trend Filter

## What is EMA?
EMA (Exponential Moving Average) is a trend indicator that gives more weight to recent prices. The **20-period EMA** shows the short-term trend direction.

## How to Use EMA 20

### For BUY Signals:
- Only take BUY setups when price is **ABOVE** EMA 20
- This confirms the short-term trend is bullish
- Trading with the trend increases win rate

### For SELL Signals:
- Only take SELL setups when price is **BELOW** EMA 20
- This confirms the short-term trend is bearish
- Avoids fighting the trend

## Why We Use EMA Filter
Without a trend filter, you might:
- Buy at support during a strong downtrend (risky)
- Sell at resistance during a strong uptrend (risky)

The EMA filter ensures you:
- Buy when buyers are in control
- Sell when sellers are in control

## Reading EMA Slope
- EMA pointing UP = Bullish momentum
- EMA pointing DOWN = Bearish momentum
- EMA flat = Ranging/consolidating market

💡 **Pro Tip**: The steeper the EMA slope, the stronger the trend. Wait for slight pullbacks to the EMA for better entries.',
'hauza-sniper'),

(5, 'Risk Management', 'risk-management',
'# Essential Risk Management

## The Golden Rule
**Never risk more than 1-2% of your account on a single trade.**

Example:
- Account: $1000
- Risk per trade: 1% = $10
- If your stop loss is 20 pips, calculate lot size accordingly

## Stop Loss Placement

### For BUY Trades:
- Place stop loss **below the support zone**
- Give some buffer (few pips below zone low)
- If price breaks support, the trade idea is invalid

### For SELL Trades:
- Place stop loss **above the resistance zone**
- Give some buffer (few pips above zone high)
- If price breaks resistance, the trade idea is invalid

## Take Profit Strategy
The default is **1:2 Risk-Reward Ratio**:
- If risking 20 pips, target 40 pips profit
- This means you can win 40% of trades and still be profitable

## Key Risk Rules
1. ⚠️ Never move stop loss further away
2. ✅ Use demo account first to practice
3. ⚠️ Don''t revenge trade after losses
4. ✅ Keep a trading journal
5. ⚠️ Don''t overtrade - wait for quality setups

## Risk Disclaimer
- Trading is risky and you can lose money
- Past performance does not guarantee future results
- Only trade with money you can afford to lose
- Consider consulting a financial advisor',
'hauza-sniper');