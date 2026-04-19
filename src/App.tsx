import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DerivProvider } from "@/contexts/DerivContext";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { LocalePrefixRouter } from "@/i18n/LocalePrefixRouter";
import { AppRoutes } from "./AppRoutes";
import { languages, DEFAULT_LANGUAGE } from "@/i18n";

const queryClient = new QueryClient();

const localePattern = languages
  .map((l) => l.code)
  .filter((c) => c !== DEFAULT_LANGUAGE)
  .join("|");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <DerivProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <LocalePrefixRouter>
                <Routes>
                  {/* Localized routes: /es/*, /fr/*, /de/*, ...  */}
                  <Route
                    path={`/:lang(${localePattern})/*`}
                    element={<AppRoutes />}
                  />
                  {/* Canonical English routes (and /en/* normalized by LocalePrefixRouter) */}
                  <Route path="/*" element={<AppRoutes />} />
                </Routes>
              </LocalePrefixRouter>
            </BrowserRouter>
          </DerivProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
