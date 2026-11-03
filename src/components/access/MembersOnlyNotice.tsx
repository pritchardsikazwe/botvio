import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "botvio_members_only_notice_v1";

/** One-time announcement (per browser/app install): all features are now for subscribed members. */
export function MembersOnlyNotice() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    try { if (localStorage.getItem(KEY)) return; } catch { return; }
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!open) return null;
  const close = () => { try { localStorage.setItem(KEY, new Date().toISOString()); } catch {} setOpen(false); };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Botvio membership update">
      <div className="relative w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-xl">
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <Crown className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-3 text-xl font-extrabold">All Botvio features are now for members</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Markets that were free — like Boom 500, Gold and the other hubs — are now part of the membership.
          New sign-ups get a free 7-day trial. Subscribe to keep full access.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button asChild className="font-bold" onClick={close}><Link to="/choose-plan">Subscribe now</Link></Button>
          <Button asChild variant="outline" onClick={close}><Link to="/auth?mode=signup">Sign up for a 7-day free trial</Link></Button>
          <Button variant="ghost" onClick={close}>Maybe later</Button>
        </div>
      </div>
    </div>
  );
}
