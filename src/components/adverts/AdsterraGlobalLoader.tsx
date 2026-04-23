import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Adsterra global script loader (Publisher ID: 29096571).
 * Loads on every route EXCEPT the home page ("/" and localized homes
 * like /es, /fr, etc.). Injected once per session and persists across
 * route changes.
 */
const SCRIPT_FLAG = "__adsterra_global_loaded__";

export const AdsterraGlobalLoader = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isHome =
      pathname === "/" || /^\/[a-z]{2}\/?$/i.test(pathname);
    if (isHome) return;

    if ((window as unknown as Record<string, boolean>)[SCRIPT_FLAG]) return;
    (window as unknown as Record<string, boolean>)[SCRIPT_FLAG] = true;

    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src =
      "//www.profitablecpmratenetwork.com/thm0yx1s?key=390466473fe39e57827fa0264aee384c";
    s.async = true;
    document.body.appendChild(s);
  }, [pathname]);

  return null;
};
