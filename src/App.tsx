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
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import DerivCallback from "./pages/DerivCallback";
import { RequireSuperAdmin } from "@/components/admin/RequireSuperAdmin";
import { AdminLogin } from "@/components/admin/AdminLogin";

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
              <Route path="/s/:slug" element={<StrategyDetail />} />
              <Route path="/r/:code" element={<ReferralRedirect />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:slug" element={<Lesson />} />
              <Route path="/auth/deriv/callback" element={<DerivCallback />} />
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
