import { useEffect, useRef } from "react";

/**
 * Adsterra Native Banner
 * Container ID: 4c0f7a410dbeccb80b9107c5b25402e3
 */
export const AdsterraNativeBanner = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    if (!containerRef.current) return;

    const scriptId = "adsterra-native-invoke";
    if (document.getElementById(scriptId)) {
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://pl29197176.profitablecpmratenetwork.com/4c0f7a410dbeccb80b9107c5b25402e3/invoke.js";
    document.body.appendChild(script);
    scriptLoadedRef.current = true;
  }, []);

  return (
    <div className="w-full my-4 rounded-xl border border-border/40 bg-card/40 p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mb-1 px-1">
        Advertisement
      </p>
      <div
        ref={containerRef}
        id="container-4c0f7a410dbeccb80b9107c5b25402e3"
      />
    </div>
  );
};
