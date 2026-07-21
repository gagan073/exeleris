import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Profile, ExpertProfile } from "@/types/database";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  expertProfile: ExpertProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Instant in-app block: a deactivated account is signed straight back out,
    // so it can't reach any page. (is_active can be undefined on databases where
    // admin_upgrade.sql hasn't run yet — only false counts as deactivated.)
    if (prof && (prof as Profile).is_active === false) {
      toast.error(
        "This account has been deactivated. Please contact support if you think this is a mistake."
      );
      await supabase.auth.signOut();
      setProfile(null);
      setExpertProfile(null);
      return;
    }

    setProfile((prof as Profile) ?? null);
    if (prof?.role === "expert") {
      const { data: expert } = await supabase
        .from("expert_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      setExpertProfile((expert as ExpertProfile) ?? null);
    } else {
      setExpertProfile(null);
    }
  }, []);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount (with the existing
    // session or null), so it single-handedly covers boot, sign-in, sign-out,
    // and token refresh — no separate getSession() call is needed (which would
    // otherwise double-load the profile on every page load).
    let loadedUserId: string | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const newUserId = newSession?.user?.id ?? null;

      if (newUserId && newUserId !== loadedUserId) {
        // A different user just became active (boot with a session, or sign-in).
        // Hold `loading` true until the profile is fetched so consumers never
        // see user set with profile still null (which flashes the dashboard's
        // "profile unavailable" card and mis-triggers role guards).
        loadedUserId = newUserId;
        setLoading(true);
        // Deferred so Supabase queries never run inside the auth callback itself.
        setTimeout(() => {
          loadProfile(newUserId).finally(() => setLoading(false));
        }, 0);
      } else if (!newUserId) {
        loadedUserId = null;
        setProfile(null);
        setExpertProfile(null);
        setLoading(false);
      }
      // Same user (token refresh, tab refocus): profile already loaded — skip.
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setExpertProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        expertProfile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
