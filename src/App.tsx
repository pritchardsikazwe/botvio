import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DerivProvider } from "@/contexts/DerivContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import Install from "./pages/Install";
import Index from "./pages/Index";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Connections from "./pages/Connections";
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
import Settings from "./pages/Settings";
import Marketplace from "./pages/Marketplace";
import MyProducts from "./pages/MyProducts";
import BinanceSettings from "./pages/BinanceSettings";
import BinanceBots from "./pages/BinanceBots";
import BinanceBotDetail from "./pages/BinanceBotDetail";
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
import CountryPage from "./pages/CountryPage";
import SlugResolver from "./pages/SlugResolver";
import Docs from "./pages/Docs";
import FAQ from "./pages/FAQ";
import Whitepaper from "./pages/Whitepaper";
import Testimonials from "./pages/Testimonials";
import Press from "./pages/Press";
import CaseStudies from "./pages/CaseStudies";
import AuthoritySignals from "./pages/AuthoritySignals";
import SEOAnswerPage from "./pages/SEOAnswerPage";
import { RequireSuperAdmin } from "@/components/admin/RequireSuperAdmin";
import { AdminLogin } from "@/components/admin/AdminLogin";
import SignalPairPage from "./pages/SignalPairPage";
import BotDetailPage from "./pages/BotDetailPage";
import CountryTrafficPage from "./pages/CountryTrafficPage";
import GoldTradingHub from "./pages/GoldTradingHub";
import WeltradeHub from "./pages/WeltradeHub";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DerivProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/install" element={<Install />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/trade-history" element={<TradeHistory />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/provider-dashboard" element={<ProviderDashboard />} />
              <Route path="/bots" element={<Bots />} />
              <Route path="/billing" element={<Billing />} />
              
              {/* Admin routes with role guard and error boundary */}
              <Route path="/admin/login" element={
                <ErrorBoundary>
                  <AdminLogin />
                </ErrorBoundary>
              } />
              <Route path="/admin" element={
                <ErrorBoundary>
                  <RequireSuperAdmin>
                    <Admin />
                  </RequireSuperAdmin>
                </ErrorBoundary>
              } />
              <Route path="/admin/*" element={
                <ErrorBoundary>
                  <RequireSuperAdmin>
                    <Admin />
                  </RequireSuperAdmin>
                </ErrorBoundary>
              } />
              
              <Route path="/p2p" element={<P2P />} />
              <Route path="/affiliate" element={<Affiliate />} />
              <Route path="/strategies" element={<Strategies />} />
              {/* Legacy /s/ redirect + category route */}
              <Route path="/s/:slug" element={<StrategyDetail />} />
              <Route path="/strategies/:category/:slug" element={<StrategyDetail />} />
              <Route path="/r/:code" element={<ReferralRedirect />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/my-products" element={<MyProducts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/binance" element={<BinanceSettings />} />
              <Route path="/bots/binance" element={<BinanceBots />} />
              <Route path="/bots/binance/:id" element={<BinanceBotDetail />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:slug" element={<Lesson />} />
              <Route path="/auth/deriv/callback" element={<DerivCallback />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/chart/:symbol" element={<ChartPage />} />
              <Route path="/gold" element={<GoldTradingHub />} />
              <Route path="/weltrade" element={<WeltradeHub />} />
              <Route path="/news-calendar" element={<NewsCalendar />} />
              <Route path="/markets" element={<GlobalMarkets />} />
              <Route path="/markets/us" element={<USMarket />} />
              <Route path="/markets/europe" element={<EuropeMarket />} />
              <Route path="/markets/middle-east" element={<MiddleEastMarket />} />
              <Route path="/markets/asia" element={<AsiaMarket />} />
              <Route path="/markets/crypto" element={<CryptoMarket />} />
              <Route path="/markets/africa" element={<AfricaMarket />} />
              <Route path="/trade-modes" element={<TradeModes />} />
              <Route path="/deriv-options" element={<DerivOptions />} />
              <Route path="/binary-options" element={<BinaryOptions />} />
              <Route path="/brokers/:slug" element={<BrokerPage />} />
              <Route path="/live" element={<LiveFeed />} />
              <Route path="/flipping-challenges" element={<FlippingChallenges />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/sports-betting" element={<SportsBetting />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/trade/style/:styleId" element={<StyleTrade />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/whitepaper" element={<Whitepaper />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/press" element={<Press />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/authority-signals" element={<AuthoritySignals />} />
              {/* SEO Answer Pages */}
              <Route path="/what-is-botvio" element={<SEOAnswerPage />} />
              <Route path="/best-deriv-trading-bot" element={<SEOAnswerPage />} />
              <Route path="/ai-trading-bot-for-boom-100" element={<SEOAnswerPage />} />
              <Route path="/how-to-automate-deriv-trading" element={<SEOAnswerPage />} />
              <Route path="/synthetic-indices-trading-bot" element={<SEOAnswerPage />} />
              <Route path="/gold-trading-signals" element={<SEOAnswerPage />} />
              <Route path="/silver-trading-signals" element={<SEOAnswerPage />} />
              <Route path="/forex-currency-signals" element={<SEOAnswerPage />} />
              <Route path="/boom-crash-trading-guide" element={<SEOAnswerPage />} />
              <Route path="/copy-trading-platform" element={<SEOAnswerPage />} />
              <Route path="/how-to-make-money-online-trading" element={<SEOAnswerPage />} />
              {/* Country SEO Pages (original) */}
              <Route path="/boom-bot-nigeria" element={<SEOAnswerPage />} />
              <Route path="/deriv-bot-ghana" element={<SEOAnswerPage />} />
              <Route path="/ai-trading-bot-zambia" element={<SEOAnswerPage />} />
              <Route path="/boom-crash-bot-kenya" element={<SEOAnswerPage />} />
              <Route path="/automated-trading-bot-south-africa" element={<SEOAnswerPage />} />

              {/* === 50+ SEO Traffic Pages === */}
              {Object.keys(seoTrafficPages).map(slug => (
                <Route key={slug} path={`/${slug}`} element={<SEOAnswerPage />} />
              ))}

              {/* === Programmatic Signal Pages === */}
              <Route path="/signals/:pair" element={<SignalPairPage />} />

              {/* === Programmatic Bot Pages === */}
              <Route path="/bots/:botSlug" element={<BotDetailPage />} />

              {/* === Country Traffic Pages (forex-trading-X, exness-X, gold-trading-X) === */}
              {countryTrafficSlugs.flatMap(c => [
                <Route key={`forex-${c.slug}`} path={`/forex-trading-${c.slug}`} element={<CountryTrafficPage />} />,
                <Route key={`exness-${c.slug}`} path={`/exness-${c.slug}`} element={<CountryTrafficPage />} />,
                <Route key={`gold-${c.slug}`} path={`/gold-trading-${c.slug}`} element={<CountryTrafficPage />} />,
              ])}

              {/* Slug resolver: strategy first, then country fallback */}
              <Route path="/:slug" element={<SlugResolver />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DerivProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
