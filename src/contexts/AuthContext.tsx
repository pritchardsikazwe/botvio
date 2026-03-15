import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
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
  signUp: (email: string, password: string, country?: string, whatsapp?: string, planCode?: string) => Promise<{ error: Error | null }>;
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

  const signUp = async (email: string, password: string, country?: string, whatsapp?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { country: country || undefined, whatsapp_number: whatsapp || undefined },
      },
    });

    // Update profile with country and whatsapp if provided
    if (!error && data?.user) {
      const updates: Record<string, string> = {};
      if (country) updates.country = country;
      if (whatsapp) updates.whatsapp_number = whatsapp;
      if (Object.keys(updates).length > 0) {
        supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", data.user.id)
          .then(() => {});
      }
    }

    // Notify admin of new signup (fire and forget)
    if (!error && data?.user) {
      supabase.functions.invoke("admin-signup-notification", {
        body: {
          email,
          user_id: data.user.id,
          created_at: new Date().toISOString(),
        },
      }).catch(() => {});
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
