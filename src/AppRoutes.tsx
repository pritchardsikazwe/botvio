import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireSuperAdmin } from "@/components/admin/RequireSuperAdmin";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { PaidRouteGuard } from "@/components/access/PaidRouteGuard";
import { ReactNode } from "react";

const Paid = ({ children }: { children: ReactNode }) => (
  <PaidRouteGuard>{children}</PaidRouteGuard>
);

import Index from "./pages/Index";
import HomeMockup from "./pages/HomeMockup";
import Landing from "./pages/Landing";
import Install from "./pages/Install";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import BeginnerGuide from "./pages/BeginnerGuide";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import TradeHistory from "./pages/TradeHistory";
import Providers from "./pages/Providers";
import CopyMarketplace from "./pages/copy/CopyMarketplace";
import CopyProviderProfile from "./pages/copy/CopyProviderProfile";
import CopyStart from "./pages/copy/CopyStart";
import { FollowerDashboard, ProviderCommandCenter, BotvioRobotDashboard, CopyTradingAdmin } from "./pages/copy/CopyControlCenter";
import BecomeProvider from "./pages/copy/BecomeProvider";
import Bots from "./pages/Bots";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import AdminControlCenter from "./pages/AdminControlCenter";
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
import BlogCategory from "./pages/BlogCategory";
import Tools from "./pages/Tools";
import ResearchHub from "./pages/ResearchHub";
import AccountClosure from "./pages/AccountClosure";
import { StoreRestrictedRoute } from "@/components/StoreRestrictedRoute";
import { isRestrictedOnStore } from "@/lib/mobile";
import { useLocation } from "react-router-dom";

import Author from "./pages/Author";
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
import DerivApp from "./pages/DerivApp";
import RiseFall from "./pages/RiseFall";
import NewsCalendar from "./pages/NewsCalendar";
import GlobalMarkets from "./pages/markets/GlobalMarkets";
import USMarket from "./pages/markets/USMarket";
import EuropeMarket from "./pages/markets/EuropeMarket";
import MiddleEastMarket from "./pages/markets/MiddleEastMarket";
import AsiaMarket from "./pages/markets/AsiaMarket";
import CryptoMarket from "./pages/markets/CryptoMarket";
import AfricaMarket from "./pages/markets/AfricaMarket";
import BrokerPage from "./pages/BrokerPage";
import BrokersIndex from "./pages/BrokersIndex";
import BinaryOptions from "./pages/BinaryOptions";
import LiveFeed from "./pages/LiveFeed";
import FlippingChallenges from "./pages/FlippingChallenges";
import ResetPassword from "./pages/ResetPassword";
import SportsBetting from "./pages/SportsBetting";
import Unsubscribe from "./pages/Unsubscribe";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Disclaimer from "./pages/Disclaimer";
import MarketAnalysis from "./pages/MarketAnalysis";
import EditorialPolicy from "./pages/EditorialPolicy";
import FactChecking from "./pages/FactChecking";
import Corrections from "./pages/Corrections";
import AffiliateDisclosure from "./pages/AffiliateDisclosure";
import AiContentPolicy from "./pages/AiContentPolicy";
import LearningPaths from "./pages/LearningPaths";
import LearningPathDetail from "./pages/LearningPathDetail";
import Methodology from "./pages/Methodology";
import PerformanceTransparency from "./pages/PerformanceTransparency";
import Trust from "./pages/Trust";
import OAuthConsent from "./pages/OAuthConsent";
import { StandaloneAppsHub, StandaloneApp, HostStandaloneApp } from "./pages/StandaloneApps";

import { seoTrafficPages, countryTrafficSlugs } from "@/content/seoTrafficPages";

/**
 * The full app route tree. Mounted twice from App.tsx:
 *   1. At "/*"            — canonical English URLs
 *   2. At "/:lang/*"      — localized URLs for non-English languages
 *
 * Locale detection on the second mount is handled by LocalePrefixRouter,
 * which sets i18next language from the URL segment.
 */
export const AppRoutes = () => {
  const location = useLocation();

  if (isRestrictedOnStore(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  const hostApp = HostStandaloneApp();
  if (hostApp) return hostApp;

  return (
  <Routes>
    <Route path="/" element={<HomeMockup />} />
    <Route path="home-preview" element={<HomeMockup />} />
    <Route path="home-classic" element={<Index />} />
    <Route path=".lovable/oauth/consent" element={<OAuthConsent />} />
    <Route path="landing" element={<Landing />} />
    <Route path="install" element={<Install />} />
    <Route path="apps" element={<StandaloneAppsHub />} />
    <Route path="apps/gold-robot" element={<StandaloneApp appId="gold-robot" />} />
    <Route path="apps/crypto-robot" element={<StandaloneApp appId="crypto-robot" />} />
    <Route path="apps/synthetic-robot" element={<StandaloneApp appId="synthetic-robot" />} />
    <Route path="apps/weltrade-robot" element={<StandaloneApp appId="weltrade-robot" />} />
    <Route path="apps/deriv-copy" element={<StandaloneApp appId="deriv-copy" />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="accounts" element={<Navigate to="/connections" replace />} />
    <Route path="connections" element={<Connections />} />
    <Route path="bridge-request" element={<Navigate to="/connections" replace />} />
    <Route path="trade-history" element={<TradeHistory />} />
    <Route path="providers" element={<Providers />} />
    <Route path="copy-trading" element={<CopyMarketplace />} />
    <Route path="copy-trading/provider/:providerId" element={<CopyProviderProfile />} />
    <Route path="copy-trading/start/:providerId" element={<CopyStart />} />
    <Route path="copy-trading/my" element={<FollowerDashboard />} />
    <Route path="copy-trading/become-provider" element={<BecomeProvider />} />
    <Route path="provider-dashboard" element={<ProviderCommandCenter />} />
    <Route path="botvio-robot" element={<BotvioRobotDashboard />} />
    <Route path="bots" element={<Paid><Bots /></Paid>} />
    <Route path="billing" element={<Billing />} />

    {/* Admin */}
    <Route path="admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
    <Route path="admin" element={<ErrorBoundary><RequireSuperAdmin><AdminControlCenter /></RequireSuperAdmin></ErrorBoundary>} />
    <Route path="admin/legacy" element={<ErrorBoundary><RequireSuperAdmin><Admin /></RequireSuperAdmin></ErrorBoundary>} />
    <Route path="admin/copy-trading" element={<ErrorBoundary><RequireSuperAdmin><CopyTradingAdmin /></RequireSuperAdmin></ErrorBoundary>} />
    <Route path="admin/*" element={<ErrorBoundary><RequireSuperAdmin><AdminControlCenter /></RequireSuperAdmin></ErrorBoundary>} />

    <Route path="p2p" element={<P2P />} />
    <Route path="affiliate" element={<Affiliate />} />
    <Route path="strategies" element={<Strategies />} />
    <Route path="s/:slug" element={<StrategyDetail />} />
    <Route path="strategies/:category/:slug" element={<StrategyDetail />} />
    <Route path="r/:code" element={<ReferralRedirect />} />
    <Route path="signals" element={<Paid><Signals /></Paid>} />
    <Route path="market-analysis" element={<Paid><MarketAnalysis /></Paid>} />
    <Route path="signals/history" element={<Paid><SignalsHistory /></Paid>} />
    <Route path="signals-history" element={<Paid><SignalsHistory /></Paid>} />
    <Route path="track-record" element={<Paid><SignalsHistory /></Paid>} />
    <Route path="marketplace" element={<Marketplace />} />
    <Route path="my-products" element={<MyProducts />} />
    <Route path="settings" element={<Settings />} />
    <Route path="account/delete" element={<AccountClosure />} />
    <Route path="settings/binance" element={<BinanceSettings />} />
    <Route path="settings/deriv-otp" element={<ErrorBoundary><RequireSuperAdmin><DerivOtpTester /></RequireSuperAdmin></ErrorBoundary>} />
    <Route path="binance" element={<Paid><BinanceHub /></Paid>} />
    <Route path="bots/binance" element={<Paid><BinanceBots /></Paid>} />
    <Route path="bots/binance/:id" element={<Paid><BinanceBotDetail /></Paid>} />
    <Route path="terms" element={<Terms />} />
    <Route path="privacy" element={<Privacy />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<Contact />} />
    <Route path="disclaimer" element={<Disclaimer />} />
    <Route path="editorial-policy" element={<EditorialPolicy />} />
    <Route path="fact-checking" element={<FactChecking />} />
    <Route path="corrections" element={<Corrections />} />
    <Route path="affiliate-disclosure" element={<AffiliateDisclosure />} />
    <Route path="ai-content-policy" element={<AiContentPolicy />} />
    <Route path="learning-paths" element={<LearningPaths />} />
    <Route path="learning-paths/:slug" element={<LearningPathDetail />} />
    <Route path="methodology" element={<Methodology />} />
    <Route path="performance-transparency" element={<PerformanceTransparency />} />
    <Route path="trust" element={<Trust />} />
    <Route path="learn" element={<Learn />} />
    <Route path="learn/:category" element={<Learn />} />
    <Route path="learn/:category/:slug" element={<Lesson />} />
    <Route path="forex-beginner-guide" element={<BeginnerGuide />} />
    <Route path="beginner-guide" element={<BeginnerGuide />} />
    <Route path="auth/deriv/callback" element={<DerivCallback />} />
    <Route path="callback" element={<DerivCallback />} />
    <Route path="trading" element={<Paid><Trading /></Paid>} />
    <Route path="chart/:symbol" element={<Paid><ChartPage /></Paid>} />
    <Route path="gold" element={<Paid><GoldTradingHub /></Paid>} />
    <Route path="bitcoin" element={<Paid><BitcoinTradingHub /></Paid>} />
    <Route path="btc" element={<Paid><BitcoinTradingHub /></Paid>} />
    <Route path="silver" element={<Paid><SilverTradingHub /></Paid>} />
    <Route path="xag" element={<Paid><SilverTradingHub /></Paid>} />
    <Route path="gbpusd" element={<Navigate to="/gbp-usd" replace />} />
    <Route path="gbp-usd" element={<Paid><GbpUsdTradingHub /></Paid>} />

    {/* Additional forex pair hubs */}
    <Route path="eurusd" element={<Navigate to="/eur-usd" replace />} />
    <Route path="eur-usd" element={<Paid><EurUsdHub /></Paid>} />
    <Route path="usdjpy" element={<Navigate to="/usd-jpy" replace />} />
    <Route path="usd-jpy" element={<Paid><UsdJpyHub /></Paid>} />
    <Route path="audusd" element={<Navigate to="/aud-usd" replace />} />
    <Route path="aud-usd" element={<Paid><AudUsdHub /></Paid>} />
    <Route path="usdcad" element={<Navigate to="/usd-cad" replace />} />
    <Route path="usd-cad" element={<Paid><UsdCadHub /></Paid>} />
    <Route path="usdchf" element={<Navigate to="/usd-chf" replace />} />
    <Route path="usd-chf" element={<Paid><UsdChfHub /></Paid>} />
    <Route path="eurgbp" element={<Paid><EurGbpHub /></Paid>} />
    <Route path="eur-gbp" element={<Paid><EurGbpHub /></Paid>} />
    <Route path="eurjpy" element={<Paid><EurJpyHub /></Paid>} />
    <Route path="eur-jpy" element={<Paid><EurJpyHub /></Paid>} />
    <Route path="nzdusd" element={<Navigate to="/nzd-usd" replace />} />
    <Route path="nzd-usd" element={<Paid><NzdUsdHub /></Paid>} />
    <Route path="usdcny" element={<Navigate to="/usd-cny" replace />} />
    <Route path="usd-cny" element={<Paid><UsdCnyHub /></Paid>} />

    {/* Stock hubs */}
    <Route path="stocks/nvda" element={<Paid><NvidiaHub /></Paid>} />
    <Route path="stocks/tsla" element={<Paid><TeslaHub /></Paid>} />
    <Route path="stocks/amd" element={<Paid><AmdHub /></Paid>} />
    <Route path="stocks/mu" element={<Paid><MicronHub /></Paid>} />
    <Route path="stocks/aapl" element={<Paid><AppleHub /></Paid>} />
    <Route path="stocks/msft" element={<Paid><MicrosoftHub /></Paid>} />
    <Route path="stocks/avgo" element={<Paid><BroadcomHub /></Paid>} />
    <Route path="stocks/amzn" element={<Paid><AmazonHub /></Paid>} />
    <Route path="stocks/meta" element={<Paid><MetaHub /></Paid>} />
    <Route path="stocks/googl" element={<Paid><AlphabetHub /></Paid>} />

    {/* Index hubs */}
    <Route path="us30" element={<Paid><Us30Hub /></Paid>} />
    <Route path="dow" element={<Paid><Us30Hub /></Paid>} />
    <Route path="dj30" element={<Paid><Us30Hub /></Paid>} />
    <Route path="nas100" element={<Paid><Nas100Hub /></Paid>} />
    <Route path="nasdaq100" element={<Paid><Nas100Hub /></Paid>} />
    <Route path="ustec" element={<Paid><Nas100Hub /></Paid>} />
    <Route path="ger40" element={<Paid><Ger40Hub /></Paid>} />
    <Route path="dax" element={<Paid><Ger40Hub /></Paid>} />
    <Route path="de40" element={<Paid><Ger40Hub /></Paid>} />

    <Route path="weltrade" element={<Paid><WeltradeHub /></Paid>} />
    <Route path="weltrade-trade" element={<Paid><WeltradeTrade /></Paid>} />
    <Route path="synthetic-hub" element={<Paid><SyntheticHub /></Paid>} />
    <Route path="synthetic" element={<Paid><SyntheticHub /></Paid>} />
    <Route path="synthetics" element={<Paid><SyntheticHub /></Paid>} />
    <Route path="auto-trade" element={<Paid><AutoTrade /></Paid>} />
    <Route path="auto" element={<Paid><AutoTrade /></Paid>} />
    <Route path="news-calendar" element={<NewsCalendar />} />
    <Route path="markets" element={<GlobalMarkets />} />
    <Route path="global-markets" element={<Navigate to="/markets" replace />} />
    <Route path="crypto" element={<Navigate to="/markets/crypto" replace />} />
    <Route path="chart" element={<Navigate to="/chart/XAUUSD" replace />} />
    <Route path="markets/us" element={<USMarket />} />
    <Route path="markets/europe" element={<EuropeMarket />} />
    <Route path="markets/middle-east" element={<MiddleEastMarket />} />
    <Route path="markets/asia" element={<AsiaMarket />} />
    <Route path="markets/crypto" element={<CryptoMarket />} />
    <Route path="markets/africa" element={<AfricaMarket />} />
    <Route path="trade-modes" element={<Paid><TradeModes /></Paid>} />
    <Route path="deriv-options" element={<Paid><DerivOptions /></Paid>} />
    <Route path="deriv-app" element={<DerivApp />} />
    <Route path="rise-fall" element={<StoreRestrictedRoute><RiseFall /></StoreRestrictedRoute>} />
    <Route path="binary-options" element={<Paid><BinaryOptions /></Paid>} />
    <Route path="brokers" element={<BrokersIndex />} />
    <Route path="brokers/:slug" element={<BrokerPage />} />
    <Route path="live" element={<LiveFeed />} />
    <Route path="flipping-challenges" element={<FlippingChallenges />} />
    <Route path="reset-password" element={<ResetPassword />} />
    <Route path="sports-betting" element={<StoreRestrictedRoute><SportsBetting /></StoreRestrictedRoute>} />
    <Route path="unsubscribe" element={<Unsubscribe />} />
    <Route path="trade/style/:styleId" element={<Paid><StyleTrade /></Paid>} />
    <Route path="blog" element={<Blog />} />
    <Route path="blog/category/:slug" element={<BlogCategory />} />
    <Route path="research/:slug" element={<ResearchHub />} />
    <Route path="tools" element={<Tools />} />
    <Route path="blog/:slug" element={<BlogPost />} />

    <Route path="authors/:slug" element={<Author />} />
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

    <Route path="signals/:pair" element={<Paid><SignalPairPage /></Paid>} />
    <Route path="bots/:botSlug" element={<Paid><BotDetailPage /></Paid>} />

    {countryTrafficSlugs.flatMap((c) => [
      <Route key={`forex-${c.slug}`} path={`forex-trading-${c.slug}`} element={<CountryTrafficPage />} />,
      <Route key={`exness-${c.slug}`} path={`exness-${c.slug}`} element={<CountryTrafficPage />} />,
      <Route key={`gold-${c.slug}`} path={`gold-trading-${c.slug}`} element={<CountryTrafficPage />} />,
    ])}

    <Route path=":slug" element={<SlugResolver />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
  );
};
