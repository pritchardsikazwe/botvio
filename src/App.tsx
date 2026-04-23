import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DerivProvider } from "@/contexts/DerivContext";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { LocalePrefixRouter } from "@/i18n/LocalePrefixRouter";
import { AppRoutes } from "./AppRoutes";
import { MonetagLoader } from "@/components/adverts/MonetagLoader";
import { AdsterraGlobalLoader } from "@/components/adverts/AdsterraGlobalLoader";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <DerivProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/*
                LocalePrefixRouter detects /xx/ prefixes (where xx is a
                supported locale), sets i18n language, and rewrites the
                URL to the canonical English path before <AppRoutes>
                matches. Unknown prefixes pass through unchanged.
              */}
              <LocalePrefixRouter>
                <MonetagLoader />
                <AdsterraGlobalLoader />
                <AppRoutes />
              </LocalePrefixRouter>
            </BrowserRouter>
          </DerivProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
