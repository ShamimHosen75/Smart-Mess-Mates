import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMess } from "@/contexts/MessContext";
import { useAuth } from "@/contexts/AuthContext";

interface MessSummary {
  id: string;
  name: string;
  memberCount: number;
  totalMeals: number;
}

export default function MessOverviewWidget() {
  const { allMesses } = useMess();
  const { userRole } = useAuth();
  const [summaries, setSummaries] = useState<MessSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    if (!isSuperAdmin || allMesses.length === 0) {
      setLoading(false);
      return;
    }

    const fetchSummaries = async () => {
      const { data: members } = await supabase
        .from("members")
        .select("mess_id, total_meals, is_active");

      const byMess: Record<string, { count: number; meals: number }> = {};
      (members || []).forEach((m: any) => {
        if (!m.mess_id) return;
        if (!byMess[m.mess_id]) byMess[m.mess_id] = { count: 0, meals: 0 };
        if (m.is_active) {
          byMess[m.mess_id].count += 1;
          byMess[m.mess_id].meals += Number(m.total_meals);
        }
      });

      setSummaries(
        allMesses.map((mess) => ({
          id: mess.id,
          name: mess.name,
          memberCount: byMess[mess.id]?.count ?? 0,
          totalMeals: byMess[mess.id]?.meals ?? 0,
        }))
      );
      setLoading(false);
    };

    fetchSummaries();
  }, [isSuperAdmin, allMesses]);

  if (!isSuperAdmin) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-primary" />
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            All Messes
          </h2>
        </div>
        <Link
          to="/mess-management"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Manage <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin text-primary" size={20} />
        </div>
      ) : summaries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No messes created yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summaries.map((s) => (
            <div
              key={s.id}
              className="p-3 rounded-lg bg-secondary/40 border border-border/30 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {s.memberCount} members
                </span>
                <span>{s.totalMeals} meals</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
