import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Mess {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

interface MessState {
  currentMess: Mess | null;
  allMesses: Mess[];
  loading: boolean;
  refreshMesses: () => Promise<void>;
  switchMess: (messId: string) => void;
}

const MessContext = createContext<MessState | null>(null);

export function useMess() {
  const ctx = useContext(MessContext);
  if (!ctx) throw new Error("useMess must be inside MessProvider");
  return ctx;
}

export function MessProvider({ children }: { children: React.ReactNode }) {
  const { user, isApproved, userRole } = useAuth();
  const [currentMess, setCurrentMess] = useState<Mess | null>(null);
  const [allMesses, setAllMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMessId, setUserMessId] = useState<string | null>(null);

  const isSuperAdmin = userRole === "super_admin";

  const fetchMesses = async () => {
    if (!user) {
      setCurrentMess(null);
      setAllMesses([]);
      setLoading(false);
      return;
    }

    const { data: messes } = await supabase
      .from("messes")
      .select("*")
      .order("created_at", { ascending: true });
    setAllMesses((messes || []) as Mess[]);

    const { data: profile } = await supabase
      .from("profiles")
      .select("mess_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const profileMessId = profile?.mess_id ?? null;
    setUserMessId(profileMessId);

    // Check if there's a stored override (super admin switching)
    const storedOverride = localStorage.getItem("mess-override");
    const effectiveMessId = isSuperAdmin && storedOverride ? storedOverride : profileMessId;

    if (effectiveMessId && messes) {
      const found = messes.find((m: any) => m.id === effectiveMessId);
      setCurrentMess(found as Mess || null);
    } else {
      setCurrentMess(null);
    }
    setLoading(false);
  };

  const switchMess = (messId: string) => {
    if (!isSuperAdmin) return;
    localStorage.setItem("mess-override", messId);
    const found = allMesses.find((m) => m.id === messId);
    if (found) setCurrentMess(found);
  };

  useEffect(() => {
    if (user && isApproved) {
      fetchMesses();
    } else {
      setLoading(false);
    }
  }, [user, isApproved, userRole]);

  return (
    <MessContext.Provider value={{ currentMess, allMesses, loading, refreshMesses: fetchMesses, switchMess }}>
      {children}
    </MessContext.Provider>
  );
}
