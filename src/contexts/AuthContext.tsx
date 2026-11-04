import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isApproved: boolean | null;
  userRole: string | null;
  signOut: () => Promise<void>;
  refreshApproval: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchApprovalAndRole = async (userId: string) => {
    try {
      const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_approved, is_suspended")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId),
      ]);

      if (profileError) throw profileError;
      if (rolesError) throw rolesError;

      const primaryRole = roles && roles.length > 0 ? roles[0].role : "user";
      const isSuperAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === "super_admin");

      // Super admins bypass approval + suspension gates entirely.
      if (isSuperAdmin) {
        setIsApproved(true);
        setUserRole("super_admin");
        return;
      }

      const suspended = (profile as any)?.is_suspended === true;
      if (suspended) {
        await supabase.auth.signOut();
        setIsApproved(false);
        setUserRole(null);
        if (typeof window !== "undefined") {
          setTimeout(() => {
            try {
              import("sonner").then(({ toast }) => toast.error("Your account has been suspended. Contact a super admin."));
            } catch {}
          }, 0);
        }
        return;
      }

      setIsApproved(profile?.is_approved ?? false);
      setUserRole(primaryRole);
    } catch (error) {
      console.error("Failed to fetch approval and role", error);
      setIsApproved(false);
      setUserRole("user");
    }
  };

  const applySession = async (nextSession: Session | null) => {
    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    if (!nextUser) {
      setIsApproved(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    await fetchApprovalAndRole(nextUser.id);
    setLoading(false);
  };

  const refreshApproval = async () => {
    if (!user) return;
    setLoading(true);
    await fetchApprovalAndRole(user.id);
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => {
        void applySession(nextSession);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void applySession(initialSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isApproved, userRole, signOut, refreshApproval }}>
      {children}
    </AuthContext.Provider>
  );
}
