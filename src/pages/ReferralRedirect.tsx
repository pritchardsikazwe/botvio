import { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const REFERRAL_STORAGE_KEY = "botvio_referral";
const REFERRAL_EXPIRY_DAYS = 30;

const ReferralRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const trackAndRedirect = async () => {
      if (!code) {
        navigate("/");
        return;
      }

      try {
        // Get referrer user_id from affiliate_links or affiliate_profiles
        const { data: linkData } = await supabase
          .from("affiliate_links")
          .select("user_id")
          .eq("code", code)
          .maybeSingle();

        let referrerUserId = linkData?.user_id;

        if (!referrerUserId) {
          const { data: profileData } = await supabase
            .from("affiliate_profiles")
            .select("user_id")
            .eq("affiliate_code", code)
            .maybeSingle();
          referrerUserId = profileData?.user_id;
        }

        // Hash IP and user agent for fraud prevention (simple hash)
        const ipHash = await hashString(
          Math.random().toString(36) + Date.now().toString()
        );
        const userAgentHash = await hashString(navigator.userAgent);

        // Log click in referral_clicks
        await supabase.from("referral_clicks").insert({
          code,
          referrer_user_id: referrerUserId,
          landing_path: searchParams.get("redirect") || "/",
          ip_hash: ipHash,
          user_agent_hash: userAgentHash,
        });

        // Store referral in localStorage with expiry
        const referralData = {
          code,
          referrerUserId,
          expiresAt: Date.now() + REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referralData));

        // Redirect to target page or home
        const redirectPath = searchParams.get("redirect") || "/";
        navigate(redirectPath);
      } catch (error) {
        console.error("Referral tracking error:", error);
        navigate("/");
      }
    };

    trackAndRedirect();
  }, [code, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default ReferralRedirect;
