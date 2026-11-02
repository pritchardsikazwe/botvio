import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "botvio:cookie-consent:v1";
const CONSENT_EVENT = "botvio:cookie-consent-updated";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const persist = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    } catch {
      // Consent cannot be persisted when browser storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { value } }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[100] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-lg border border-border bg-card/95 shadow-2xl backdrop-blur-md md:bottom-4"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
        <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs md:text-sm text-muted-foreground flex-1">
          We use essential storage to operate Botvio. With your permission, we
          also use analytics cookies to measure anonymous visits and improve the
          platform. See our{" "}
          <Link to="/privacy" className="text-primary underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" className="text-primary underline">
            Terms
          </Link>
          .
        </p>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => persist("rejected")}
            className="flex-1 md:flex-none"
          >
            Reject
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => persist("accepted")}
            className="flex-1 md:flex-none"
          >
            Accept analytics
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Reject analytics cookies"
            onClick={() => persist("rejected")}
            className="h-8 w-8 shrink-0 md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
