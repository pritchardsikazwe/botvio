import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { trackBotvioEvent } from "@/components/analytics/analytics";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  whatsapp_number?: string | null;
}

interface UserSettings {
  id: string;
  user_id: string;
  default_pair: string;
  default_timeframe: string;
  notifications_enabled: boolean;
  risk_per_trade: number;
}

type AppRole = 'admin' | 'super_admin' | 'moderator' | 'user' | 'affiliate' | 'signal_manager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
  rolesLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAffiliate: boolean;
  isSignalManager: boolean;
  userRoles: AppRole[];
  signUp: (email: string, password: string, country?: string, whatsapp?: string, planCode?: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isSignalManager, setIsSignalManager] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch settings
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    setRolesLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        setUserRoles([]);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsAffiliate(false);
        setIsSignalManager(false);
        return;
      }

      const roles = (data || []).map(r => r.role as AppRole);
      setUserRoles(roles);
      
      // Check for admin roles (admin or super_admin)
      const hasAdminRole = roles.includes('admin') || roles.includes('super_admin');
      const hasSuperAdminRole = roles.includes('super_admin');
      const hasAffiliateRole = roles.includes('affiliate');
      const hasSignalManagerRole = roles.includes('signal_manager');
      
      setIsAdmin(hasAdminRole);
      setIsSuperAdmin(hasSuperAdminRole);
      // Admins should NOT be treated as affiliates even if they have the role
      setIsAffiliate(hasAffiliateRole && !hasAdminRole);
      // Signal managers can post signals (admins/super_admins already can)
      setIsSignalManager(hasSignalManagerRole || hasAdminRole);
      
      // Roles loaded silently
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setUserRoles([]);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsAffiliate(false);
      setIsSignalManager(false);
    } finally {
      setRolesLoading(false);
    }
  };

  const refreshRoles = async () => {
    if (user) {
      await fetchUserRoles(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        // Fire and forget - don't await, don't set loading
        if (session?.user) {
          fetchUserData(session.user.id);
          fetchUserRoles(session.user.id);
        } else {
          setProfile(null);
          setSettings(null);
          setUserRoles([]);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsAffiliate(false);
          setIsSignalManager(false);
          setRolesLoading(false);
        }
      }
    );

    // INITIAL load (controls loading)
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch role BEFORE setting loading false
        if (session?.user) {
          await Promise.all([
            fetchUserData(session.user.id),
            fetchUserRoles(session.user.id)
          ]);
        } else {
          setRolesLoading(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, country?: string, whatsapp?: string, planCode?: string, displayName?: string) => {
    if (!whatsapp?.trim()) {
      return { error: new Error("WhatsApp number is required to create a Botvio account.") };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { country: country || undefined, whatsapp_number: whatsapp || undefined, selected_plan: planCode || 'free', display_name: displayName || undefined },
      },
    });

    // Update profile with country, whatsapp, and display name if provided
    if (!error && data?.user) {
      const updates: Record<string, string> = {};
      if (country) updates.country = country;
      if (whatsapp) updates.whatsapp_number = whatsapp;
      if (displayName) updates.display_name = displayName;
      if (Object.keys(updates).length > 0) {
        supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", data.user.id)
          .then(() => {});
      }

      // Assign selected plan subscription
      if (planCode && planCode !== 'free') {
        const { data: planData } = await supabase
          .from("pricing_plans")
          .select("id")
          .eq("code", planCode)
          .eq("is_active", true)
          .maybeSingle();
        if (planData) {
          await supabase
            .from("user_plan_subscriptions")
            .upsert({
              user_id: data.user.id,
              pricing_plan_id: planData.id,
              status: "pending_payment",
              current_period_start: new Date().toISOString(),
            }, { onConflict: "user_id" });
        }
      }
    }

    // Notify admin of new signup (fire and forget)
    if (!error && data?.user) {
      supabase.functions.invoke("admin-signup-notification", {
        body: {
          email,
          user_id: data.user.id,
          created_at: new Date().toISOString(),
          selected_plan: planCode || 'free',
        },
      }).catch(() => {});

      // Send welcome email (fire and forget)
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "welcome-email",
          recipientEmail: email,
          idempotencyKey: `welcome-${data.user.id}`,
          templateData: { name: displayName || undefined },
        },
      }).catch(() => {});
    }

    if (!error) trackBotvioEvent("signup_completed", { selected_plan: planCode || "free", country: country || "unknown" });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) trackBotvioEvent("login");
    return { error };
  };

  const signOut = async () => {
    trackBotvioEvent("logout");\n    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSettings(null);
    setUserRoles([]);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsAffiliate(false);
    setIsSignalManager(false);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .update(data)
      .eq("user_id", user.id);

    if (!error) {
      setSettings((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  // Keep a lightweight heartbeat for authenticated users so Admin can distinguish
  // registered users who are actually connected from users who merely have an account.
  const presenceUserId = user?.id;
  useEffect(() => {
    if (!presenceUserId) return;

    let cancelled = false;
    const getDeviceType = () => {
      const ua = navigator.userAgent.toLowerCase();
      if (/tablet|ipad|playbook|silk/.test(ua) || (navigator.maxTouchPoints > 1 && /macintosh/.test(ua))) return "tablet";
      if (/mobile|android|iphone|ipod|windows phone/.test(ua)) return "mobile";
      return "desktop";
    };

    const touchPresence = async () => {
      if (cancelled || document.visibilityState === "hidden") return;
      const { error } = await (supabase as any).rpc("touch_user_presence", {
        p_current_path: window.location.pathname,
        p_device_type: getDeviceType(),
      });
      if (error && !cancelled) console.debug("Presence heartbeat unavailable", error.message);
    };

    touchPresence();
    const interval = window.setInterval(touchPresence, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") touchPresence();
    };
    window.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [presenceUserId]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        settings,
        loading,
        rolesLoading,
        isAdmin,
        isSuperAdmin,
        isAffiliate,
        isSignalManager,
        userRoles,
        signUp,
        signIn,
        signOut,
        updateProfile,
        updateSettings,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
