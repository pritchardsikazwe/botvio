import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Monetag ad scripts loader.
 * Loads on every route EXCEPT the home page ("/").
 * Scripts are injected once per session and persist across route changes.
 */
const SCRIPT_FLAG = "__monetag_loaded__";

export const MonetagLoader = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip on home page (and localized home like /es, /fr, etc.)
    const isHome =
      pathname === "/" ||
      /^\/[a-z]{2}\/?$/i.test(pathname);
    if (isHome) return;

    // Only inject once per page load
    if ((window as unknown as Record<string, boolean>)[SCRIPT_FLAG]) return;
    (window as unknown as Record<string, boolean>)[SCRIPT_FLAG] = true;

    // 1) Zone 10902730 — tag.min.js from 5gvci.com
    const s1 = document.createElement("script");
    s1.src = "https://5gvci.com/act/files/tag.min.js?z=10902730";
    s1.async = true;
    s1.setAttribute("data-cfasync", "false");
    document.body.appendChild(s1);

    // 2) Zone 10902727 — al5sm.com tag.min.js
    const s2 = document.createElement("script");
    s2.dataset.zone = "10902727";
    s2.src = "https://al5sm.com/tag.min.js";
    document.body.appendChild(s2);

    // 3) omg10.com zone 10902735
    const s3 = document.createElement("script");
    s3.src = "https://omg10.com/4/10902735";
    s3.async = true;
    document.body.appendChild(s3);
  }, [pathname]);

  return null;
};
