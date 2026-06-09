import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireSuperAdmin } from "@/components/admin/RequireSuperAdmin";
import { AdminLogin } from "@/components/admin/AdminLogin";

import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Install from "./pages/Install";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import BeginnerGuide from "./pages/BeginnerGuide";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Connections from "./pages/Connections";
import BridgeRequest from "./pages/BridgeRequest";
import TradeHistory from "./pages/TradeHistory";
import Providers from "./pages/Providers";
import ProviderDashboard from "./pages/ProviderDashboard";
import Bots from "./pages/Bots";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import P2P from "./pages/P2P";
import Affiliate from "./pages/Affiliate";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import ReferralRedirect from "./pages/ReferralRedirect";
import Signals from "./pages/Signals";
import SignalsHistory from "./pages/SignalsHistory";
import Settings from "./pages/Settings";
import DerivOtpTester from "./pages/DerivOtpTester";
import Marketplace from "./pages/Marketplace";
import MyProducts from "./pages/MyProducts";
import BinanceSettings from "./pages/BinanceSettings";
import BinanceBots from "./pages/BinanceBots";
import BinanceBotDetail from "./pages/BinanceBotDetail";
import BinanceHub from "./pages/BinanceHub";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import DerivCallback from "./pages/DerivCallback";
import StyleTrade from "./pages/StyleTrade";
import Trading from "./pages/Trading";
import ChartPage from "./pages/ChartPage";
import TradeModes from "./pages/TradeModes";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import SlugResolver from "./pages/SlugResolver";
import Docs from "./pages/Docs";
import FAQ from "./pages/FAQ";
import Whitepaper from "./pages/Whitepaper";
import Testimonials from "./pages/Testimonials";
import Press from "./pages/Press";
import CaseStudies from "./pages/CaseStudies";
import AuthoritySignals from "./pages/AuthoritySignals";
import SEOAnswerPage from "./pages/SEOAnswerPage";
import SignalPairPage from "./pages/SignalPairPage";
import BotDetailPage from "./pages/BotDetailPage";
import CountryTrafficPage from "./pages/CountryTrafficPage";
import GoldTradingHub from "./pages/GoldTradingHub";
import BitcoinTradingHub from "./pages/BitcoinTradingHub";
import SilverTradingHub from "./pages/SilverTradingHub";
import GbpUsdTradingHub from "./pages/GbpUsdTradingHub";

// Additional FX hubs
import EurUsdHub from "./pages/forex-hubs/EurUsdHub";
import UsdJpyHub from "./pages/forex-hubs/UsdJpyHub";
import AudUsdHub from "./pages/forex-hubs/AudUsdHub";
import UsdCadHub from "./pages/forex-hubs/UsdCadHub";
import UsdChfHub from "./pages/forex-hubs/UsdChfHub";
import EurGbpHub from "./pages/forex-hubs/EurGbpHub";
import EurJpyHub from "./pages/forex-hubs/EurJpyHub";
import NzdUsdHub from "./pages/forex-hubs/NzdUsdHub";
import UsdCnyHub from "./pages/forex-hubs/UsdCnyHub";

// Stock hubs
import NvidiaHub from "./pages/stock-hubs/NvidiaHub";
import TeslaHub from "./pages/stock-hubs/TeslaHub";
import AmdHub from "./pages/stock-hubs/AmdHub";
import MicronHub from "./pages/stock-hubs/MicronHub";
import AppleHub from "./pages/stock-hubs/AppleHub";
import MicrosoftHub from "./pages/stock-hubs/MicrosoftHub";
import BroadcomHub from "./pages/stock-hubs/BroadcomHub";
import AmazonHub from "./pages/stock-hubs/AmazonHub";
import MetaHub from "./pages/stock-hubs/MetaHub";
import AlphabetHub from "./pages/stock-hubs/AlphabetHub";

// Index hubs (US30, NAS100, GER40)
import Us30Hub from "./pages/index-hubs/Us30Hub";
import Nas100Hub from "./pages/index-hubs/Nas100Hub";
import Ger40Hub from "./pages/index-hubs/Ger40Hub";

import WeltradeHub from "./pages/WeltradeHub";
import WeltradeTrade from "./pages/WeltradeTrade";
import SyntheticHub from "./pages/SyntheticHub";
import AutoTrade from "./pages/AutoTrade";
import DerivOptions from "./pages/DerivOptions";
import NewsCalendar from "./pages/NewsCalendar";
import GlobalMarkets from "./pages/markets/GlobalMarkets";
import USMarket from "./pages/markets/USMarket";
import EuropeMarket from "./pages/markets/EuropeMarket";
import MiddleEastMarket from "./pages/markets/MiddleEastMarket";
import AsiaMarket from "./pages/markets/AsiaMarket";
import CryptoMarket from "./pages/markets/CryptoMarket";
import AfricaMarket from "./pages/markets/AfricaMarket";
import BrokerPage from "./pages/BrokerPage";
import BinaryOptions from "./pages/BinaryOptions";
import LiveFeed from "./pages/LiveFeed";
import FlippingChallenges from "./pages/FlippingChallenges";
import ResetPassword from "./pages/ResetPassword";
import SportsBetting from "./pages/SportsBetting";
import Unsubscribe from "./pages/Unsubscribe";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Disclaimer from "./pages/Disclaimer";

import { seoTrafficPages, countryTrafficSlugs } from "@/content/seoTrafficPages";

/**
 * The full app route tree. Mounted twice from App.tsx:
 *   1. At "/*"            — canonical English URLs
 *   2. At "/:lang/*"      — localized URLs for non-English languages
 *
 * Locale detection on the second mount is handled by LocalePrefixRouter,
 * which sets i18next language from the URL segment.
 */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="landing" element={<Landing />} />
    <Route path="install" element={<Install />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="accounts" element={<Accounts />} />
    <Route path="connections" element={<Connections />} />
    <Route path="bridge-request" element={<BridgeRequest />} />
    <Route path="trade-history" element={<TradeHistory />} />
    <Route path="providers" element={<Providers />} />
    <Route path="provider-dashboard" element={<ProviderDashboard />} />
    <Route path="bots" element={<Bots />} />
    <Route path="billing" element={<Billing />} />

    {/* Admin */}
    <Route path="admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
    <Route path="admin" element={<ErrorBoundary><RequireSuperAdmin><Admin /></RequireSuperAdmin></ErrorBoundary>} />
    <Route path="admin/*" element={<ErrorBoundary><RequireSuperAdmin><Admin /></RequireSuperAdmin></ErrorBoundary>} />

    <Route path="p2p" element={<P2P />} />
    <Route path="affiliate" element={<Affiliate />} />
    <Route path="strategies" element={<Strategies />} />
    <Route path="s/:slug" element={<StrategyDetail />} />
    <Route path="strategies/:category/:slug" element={<StrategyDetail />} />
    <Route path="r/:code" element={<ReferralRedirect />} />
    <Route path="signals" element={<Signals />} />
    <Route path="signals/history" element={<SignalsHistory />} />
    <Route path="signals-history" element={<SignalsHistory />} />
    <Route path="track-record" element={<SignalsHistory />} />
    <Route path="marketplace" element={<Marketplace />} />
    <Route path="my-products" element={<MyProducts />} />
    <Route path="settings" element={<Settings />} />
    <Route path="settings/binance" element={<BinanceSettings />} />
    <Route path="settings/deriv-otp" element={<ErrorBoundary><RequireSuperAdmin><DerivOtpTester /></RequireSuperAdmin></ErrorBoundary>} />
    <Route path="binance" element={<BinanceHub />} />
    <Route path="bots/binance" element={<BinanceBots />} />
    <Route path="bots/binance/:id" element={<BinanceBotDetail />} />
    <Route path="terms" element={<Terms />} />
    <Route path="privacy" element={<Privacy />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<Contact />} />
    <Route path="disclaimer" element={<Disclaimer />} />
    <Route path="learn" element={<Learn />} />
    <Route path="learn/:slug" element={<Lesson />} />
    <Route path="forex-beginner-guide" element={<BeginnerGuide />} />
    <Route path="beginner-guide" element={<BeginnerGuide />} />
    <Route path="auth/deriv/callback" element={<DerivCallback />} />
    <Route path="trading" element={<Trading />} />
    <Route path="chart/:symbol" element={<ChartPage />} />
    <Route path="gold" element={<GoldTradingHub />} />
    <Route path="bitcoin" element={<BitcoinTradingHub />} />
    <Route path="btc" element={<BitcoinTradingHub />} />
    <Route path="silver" element={<SilverTradingHub />} />
    <Route path="xag" element={<SilverTradingHub />} />
    <Route path="gbpusd" element={<GbpUsdTradingHub />} />
    <Route path="gbp-usd" element={<GbpUsdTradingHub />} />

    {/* Additional forex pair hubs */}
    <Route path="eurusd" element={<EurUsdHub />} />
    <Route path="eur-usd" element={<EurUsdHub />} />
    <Route path="usdjpy" element={<UsdJpyHub />} />
    <Route path="usd-jpy" element={<UsdJpyHub />} />
    <Route path="audusd" element={<AudUsdHub />} />
    <Route path="aud-usd" element={<AudUsdHub />} />
    <Route path="usdcad" element={<UsdCadHub />} />
    <Route path="usd-cad" element={<UsdCadHub />} />
    <Route path="usdchf" element={<UsdChfHub />} />
    <Route path="usd-chf" element={<UsdChfHub />} />
    <Route path="eurgbp" element={<EurGbpHub />} />
    <Route path="eur-gbp" element={<EurGbpHub />} />
    <Route path="eurjpy" element={<EurJpyHub />} />
    <Route path="eur-jpy" element={<EurJpyHub />} />
    <Route path="nzdusd" element={<NzdUsdHub />} />
    <Route path="nzd-usd" element={<NzdUsdHub />} />
    <Route path="usdcny" element={<UsdCnyHub />} />
    <Route path="usd-cny" element={<UsdCnyHub />} />

    {/* Stock hubs */}
    <Route path="stocks/nvda" element={<NvidiaHub />} />
    <Route path="stocks/tsla" element={<TeslaHub />} />
    <Route path="stocks/amd" element={<AmdHub />} />
    <Route path="stocks/mu" element={<MicronHub />} />
    <Route path="stocks/aapl" element={<AppleHub />} />
    <Route path="stocks/msft" element={<MicrosoftHub />} />
    <Route path="stocks/avgo" element={<BroadcomHub />} />
    <Route path="stocks/amzn" element={<AmazonHub />} />
    <Route path="stocks/meta" element={<MetaHub />} />
    <Route path="stocks/googl" element={<AlphabetHub />} />

    {/* Index hubs */}
    <Route path="us30" element={<Us30Hub />} />
    <Route path="dow" element={<Us30Hub />} />
    <Route path="dj30" element={<Us30Hub />} />
    <Route path="nas100" element={<Nas100Hub />} />
    <Route path="nasdaq100" element={<Nas100Hub />} />
    <Route path="ustec" element={<Nas100Hub />} />
    <Route path="ger40" element={<Ger40Hub />} />
    <Route path="dax" element={<Ger40Hub />} />
    <Route path="de40" element={<Ger40Hub />} />

    <Route path="weltrade" element={<WeltradeHub />} />
    <Route path="weltrade-trade" element={<WeltradeTrade />} />
    <Route path="synthetic-hub" element={<SyntheticHub />} />
    <Route path="synthetic" element={<SyntheticHub />} />
    <Route path="synthetics" element={<SyntheticHub />} />
    <Route path="auto-trade" element={<AutoTrade />} />
    <Route path="auto" element={<AutoTrade />} />
    <Route path="news-calendar" element={<NewsCalendar />} />
    <Route path="markets" element={<GlobalMarkets />} />
    <Route path="markets/us" element={<USMarket />} />
    <Route path="markets/europe" element={<EuropeMarket />} />
    <Route path="markets/middle-east" element={<MiddleEastMarket />} />
    <Route path="markets/asia" element={<AsiaMarket />} />
    <Route path="markets/crypto" element={<CryptoMarket />} />
    <Route path="markets/africa" element={<AfricaMarket />} />
    <Route path="trade-modes" element={<TradeModes />} />
    <Route path="deriv-options" element={<DerivOptions />} />
    <Route path="binary-options" element={<BinaryOptions />} />
    <Route path="brokers/:slug" element={<BrokerPage />} />
    <Route path="live" element={<LiveFeed />} />
    <Route path="flipping-challenges" element={<FlippingChallenges />} />
    <Route path="reset-password" element={<ResetPassword />} />
    <Route path="sports-betting" element={<SportsBetting />} />
    <Route path="unsubscribe" element={<Unsubscribe />} />
    <Route path="trade/style/:styleId" element={<StyleTrade />} />
    <Route path="blog" element={<Blog />} />
    <Route path="blog/:slug" element={<BlogPost />} />
    <Route path="docs" element={<Docs />} />
    <Route path="faq" element={<FAQ />} />
    <Route path="whitepaper" element={<Whitepaper />} />
    <Route path="testimonials" element={<Testimonials />} />
    <Route path="press" element={<Press />} />
    <Route path="case-studies" element={<CaseStudies />} />
    <Route path="authority-signals" element={<AuthoritySignals />} />

    {/* SEO Answer Pages */}
    <Route path="what-is-botvio" element={<SEOAnswerPage />} />
    <Route path="best-deriv-trading-bot" element={<SEOAnswerPage />} />
    <Route path="ai-trading-bot-for-boom-100" element={<SEOAnswerPage />} />
    <Route path="how-to-automate-deriv-trading" element={<SEOAnswerPage />} />
    <Route path="synthetic-indices-trading-bot" element={<SEOAnswerPage />} />
    <Route path="gold-trading-signals" element={<SEOAnswerPage />} />
    <Route path="silver-trading-signals" element={<SEOAnswerPage />} />
    <Route path="forex-currency-signals" element={<SEOAnswerPage />} />
    <Route path="boom-crash-trading-guide" element={<SEOAnswerPage />} />
    <Route path="copy-trading-platform" element={<SEOAnswerPage />} />
    <Route path="how-to-make-money-online-trading" element={<SEOAnswerPage />} />
    <Route path="boom-bot-nigeria" element={<SEOAnswerPage />} />
    <Route path="deriv-bot-ghana" element={<SEOAnswerPage />} />
    <Route path="ai-trading-bot-zambia" element={<SEOAnswerPage />} />
    <Route path="boom-crash-bot-kenya" element={<SEOAnswerPage />} />
    <Route path="automated-trading-bot-south-africa" element={<SEOAnswerPage />} />

    {Object.keys(seoTrafficPages).map((slug) => (
      <Route key={slug} path={slug} element={<SEOAnswerPage />} />
    ))}

    <Route path="signals/:pair" element={<SignalPairPage />} />
    <Route path="bots/:botSlug" element={<BotDetailPage />} />

    {countryTrafficSlugs.flatMap((c) => [
      <Route key={`forex-${c.slug}`} path={`forex-trading-${c.slug}`} element={<CountryTrafficPage />} />,
      <Route key={`exness-${c.slug}`} path={`exness-${c.slug}`} element={<CountryTrafficPage />} />,
      <Route key={`gold-${c.slug}`} path={`gold-trading-${c.slug}`} element={<CountryTrafficPage />} />,
    ])}

    <Route path=":slug" element={<SlugResolver />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
