import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function WhatsAppProfileNotice() {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed || profile?.whatsapp_number?.trim()) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-amber-300 bg-amber-50/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700"><Phone className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Please update your WhatsApp number</p>
          <p className="mt-1 text-sm text-slate-600">
            Your Botvio account does not have a WhatsApp number. Please update your profile so we can contact you about important account and trading-platform updates.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" className="bg-amber-500 text-slate-950 hover:bg-amber-600">
              <Link to="/settings">Add WhatsApp number</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>Remind me later</Button>
          </div>
        </div>
        <button aria-label="Dismiss" onClick={() => setDismissed(true)} className="rounded-full p-1 text-slate-500 hover:bg-amber-100"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
