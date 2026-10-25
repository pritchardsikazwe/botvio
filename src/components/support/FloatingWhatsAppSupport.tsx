import { MessageCircle } from "lucide-react";
import { trackBotvioEvent } from "@/components/analytics/analytics";

const WHATSAPP_SUPPORT_URL =
  "https://wa.me/260966284085?text=Hi%20Botvio%20Support%2C%20I%20need%20help";

/**
 * Floating WhatsApp support button. Sits above the mobile bottom nav
 * (bottom-20) and at the standard corner position on larger screens.
 */
export const FloatingWhatsAppSupport = () => {
  return (
    <a
      href={WHATSAPP_SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Botvio support on WhatsApp"
      onClick={() => trackBotvioEvent("support_whatsapp_open", { source: "home_floating" })}
      className="fixed right-4 bottom-20 z-40 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp Support</span>
      <span className="sr-only sm:hidden">WhatsApp Support</span>
      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
    </a>
  );
};
