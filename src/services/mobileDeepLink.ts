import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

let started = false;

export async function startMobileDeepLinkHandling() {
  if (started || !Capacitor.isNativePlatform()) return;
  started = true;

  const handleUrl = async (url?: string) => {
    if (!url) return;
    try {
      const parsed = new URL(url);
      const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
      const query = new URLSearchParams(parsed.search);
      const accessToken = hash.get("access_token") || query.get("access_token");
      const refreshToken = hash.get("refresh_token") || query.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) console.error("Mobile auth callback failed:", error);
      }
    } catch (error) {
      console.error("Invalid mobile deep link:", error);
    }
  };

  await App.addListener("appUrlOpen", ({ url }) => void handleUrl(url));
  const launch = await App.getLaunchUrl();
  if (launch?.url) await handleUrl(launch.url);
}
