import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DerivProvider } from "@/contexts/DerivContext";
import Index from "./pages/Index";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Providers from "./pages/Providers";
import ProviderDashboard from "./pages/ProviderDashboard";
import Bots from "./pages/Bots";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/provider-dashboard" element={<ProviderDashboard />} />
              <Route path="/bots" element={<Bots />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:slug" element={<Lesson />} />
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
