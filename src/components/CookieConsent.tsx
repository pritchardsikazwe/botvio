import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "botvio:cookie-consent:v1";

/**
 * GDPR/AdSense-friendly cookie banner. Required for AdSense approval
 * (functional cookie consent for EU traffic) and improves trust signals.
 */
export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // ignore (private mode etc.)
    }
  }, []);

  const persist = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-3xl rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-2xl"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
        <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs md:text-sm text-muted-foreground flex-1">
          We use cookies to power core features, measure traffic and personalise
          content (including ads from third parties such as Google AdSense). See
          our{" "}
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
            Accept all
          </Button>
          <button
            aria-label="Dismiss cookie banner"
            onClick={() => persist("rejected")}
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;