import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { UtensilsCrossed, Loader2, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMess } from "@/contexts/MessContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

function MealRow({ icon, label, value, active, onToggle, onValueChange }: {
  icon: string; label: string; value: number; active: boolean;
  onToggle: () => void; onValueChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        <span className="w-5 text-center flex-shrink-0">{icon}</span>
        <span className="font-medium">{label}</span>
        <input type="number" step="0.1" value={value} onChange={(e) => onValueChange(e.target.value)} className="w-11 h-7 bg-secondary text-foreground text-xs text-center rounded-md border border-border/50 focus:border-primary outline-none transition-colors" />
      </div>
      <div className="flex flex-shrink-0">
        <button onClick={active ? undefined : onToggle} className={`w-10 h-7 text-xs font-semibold rounded-l-md transition-all ${active ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/80 text-muted-foreground hover:bg-secondary"}`}>Yes</button>
        <button onClick={active ? onToggle : undefined} className={`w-10 h-7 text-xs font-semibold rounded-r-md transition-all ${!active ? "bg-destructive text-destructive-foreground shadow-sm" : "bg-secondary/80 text-muted-foreground hover:bg-secondary"}`}>No</button>
      </div>
    </div>
  );
}

interface MemberMeal {
  breakfast: boolean; lunch: boolean; dinner: boolean; custom: number;
  breakfastValue: number; lunchValue: number; dinnerValue: number;
  dbId?: string; // existing row id in meal_entries
}

interface Member { id: string; name: string; is_guest: boolean; }

const DEFAULT_BREAKFAST = 0.5;
const DEFAULT_LUNCH = 1;
const DEFAULT_DINNER = 1;

function newMemberMeal(on = false): MemberMeal {
  return { breakfast: on, lunch: on, dinner: on, custom: 0, breakfastValue: DEFAULT_BREAKFAST, lunchValue: DEFAULT_LUNCH, dinnerValue: DEFAULT_DINNER };
}

function calcTotal(m: MemberMeal): number {
  return (m.breakfast ? m.breakfastValue : 0) + (m.lunch ? m.lunchValue : 0) + (m.dinner ? m.dinnerValue : 0) + m.custom;
}

export default function MealEntry() {
  const { t } = useLanguage();
  const { currentMess } = useMess();
  const messId = currentMess?.id;

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Record<string, MemberMeal>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedDay = selectedDate.getDate();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch members
  useEffect(() => {
    if (!messId) return;
    const load = async () => {
      const { data } = await supabase
        .from("members")
        .select("id, name, is_guest")
        .eq("mess_id", messId)
        .eq("is_active", true)
        .order("name");
      setMembers((data || []) as Member[]);
    };
    load();
  }, [messId]);

  // Fetch meal entries for selected date
  const fetchEntries = useCallback(async () => {
    if (!messId || members.length === 0) return;
    setLoading(true);
    const { data } = await supabase
      .from("meal_entries")
      .select("*")
      .eq("mess_id", messId)
      .eq("entry_date", dateStr);

    const map: Record<string, MemberMeal> = {};
    members.forEach((m) => { map[m.id] = newMemberMeal(false); });

    (data || []).forEach((row: any) => {
      map[row.member_id] = {
        breakfast: row.breakfast,
        lunch: row.lunch,
        dinner: row.dinner,
        custom: row.custom_count,
        breakfastValue: Number(row.breakfast_value),
        lunchValue: Number(row.lunch_value),
        dinnerValue: Number(row.dinner_value),
        dbId: row.id,
      };
    });

    setMeals(map);
    setDirty(false);
    setLoading(false);
  }, [messId, members, dateStr]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Realtime subscription
  useEffect(() => {
    if (!messId) return;
    const channel = supabase
      .channel(`meal-entries-${messId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_entries", filter: `mess_id=eq.${messId}` }, () => {
        // Only refresh if we're not currently saving (to avoid fighting with our own save)
        if (!saving) fetchEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [messId, fetchEntries, saving]);

  const updateMeal = (memberId: string, patch: Partial<MemberMeal>) => {
    setMeals((prev) => ({ ...prev, [memberId]: { ...prev[memberId], ...patch } }));
    setDirty(true);
  };

  const toggleMeal = (memberId: string, type: "breakfast" | "lunch" | "dinner") => {
    updateMeal(memberId, { [type]: !meals[memberId]?.[type] });
  };

  const bulkSet = (fields: Partial<MemberMeal>) => {
    setMeals((prev) => {
      const next = { ...prev };
      members.forEach((m) => { next[m.id] = { ...next[m.id], ...fields }; });
      return next;
    });
    setDirty(true);
  };

  const clearAll = () => {
    setMeals((prev) => {
      const next = { ...prev };
      members.forEach((m) => {
        next[m.id] = { ...newMemberMeal(false), dbId: prev[m.id]?.dbId };
      });
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!messId) return;
    setSaving(true);
    try {
      const upserts = members.map((member) => {
        const m = meals[member.id] || newMemberMeal(false);
        const total = calcTotal(m);
        return {
          ...(m.dbId ? { id: m.dbId } : {}),
          mess_id: messId,
          member_id: member.id,
          entry_date: dateStr,
          breakfast: m.breakfast,
          lunch: m.lunch,
          dinner: m.dinner,
          breakfast_value: m.breakfastValue,
          lunch_value: m.lunchValue,
          dinner_value: m.dinnerValue,
          custom_count: m.custom,
          total_meals: total,
        };
      });

      const { error } = await supabase
        .from("meal_entries")
        .upsert(upserts as any, { onConflict: "member_id,entry_date" });

      if (error) throw error;
      toast.success("Meals saved successfully!");
      setDirty(false);
      await fetchEntries();
    } catch (err: any) {
      toast.error(err.message || "Failed to save meals");
    } finally {
      setSaving(false);
    }
  };

  const setDay = (d: number) => {
    setSelectedDate(new Date(year, month, d));
  };

  if (!messId) {
    return (
      <AppLayout title={t.mealEntry} icon={<UtensilsCrossed className="text-primary" size={22} />}>
        <div className="flex items-center justify-center py-20 text-muted-foreground">No mess selected</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t.mealEntry} subtitle={dirty ? "Unsaved changes" : "Synced"} icon={<UtensilsCrossed className="text-primary" size={22} />}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Month/Year navigation + Date picker */}
        <div className="glass-card p-3 md:p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSelectedDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm md:text-base font-semibold text-foreground">{format(new Date(year, month), "MMMM yyyy")}</h3>
            <button onClick={() => setSelectedDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <button key={d} onClick={() => setDay(d)} className={`aspect-square max-w-9 rounded text-xs md:text-sm font-medium transition-colors ${d === selectedDay ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{d}</button>
            ))}
          </div>
        </div>

        {/* Bulk actions & save */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">📅 {format(selectedDate, "dd MMM yyyy")}</p>
          <div className="flex gap-2 overflow-x-auto">
            <button onClick={() => bulkSet({ breakfast: true, lunch: true })} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-lg hover:bg-secondary/80 transition-colors whitespace-nowrap">{t.allDay}</button>
            <button onClick={() => bulkSet({ breakfast: true, lunch: true, dinner: true })} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-lg hover:bg-secondary/80 transition-colors whitespace-nowrap">{t.allDayNight}</button>
            <button onClick={clearAll} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-lg hover:bg-secondary/80 transition-colors whitespace-nowrap">{t.clearAll}</button>
            <button onClick={handleSave} disabled={saving || !dirty} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>

        {/* Member cards */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No active members in this mess</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {members.map((member) => {
              const m = meals[member.id] || newMemberMeal(false);
              const total = calcTotal(m);
              return (
                <div key={member.id} className="glass-card-glow p-4 md:p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-4 pb-3 md:pb-4 border-b border-border/30">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary text-sm md:text-base font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm md:text-base font-bold text-foreground block truncate">{member.name}</span>
                      {member.is_guest && <span className="badge-guest text-[10px]">{t.guest}</span>}
                    </div>
                  </div>
                  <div className="space-y-2.5 md:space-y-3 flex-1">
                    <MealRow icon="🍳" label={t.breakfast} value={m.breakfastValue} active={m.breakfast} onToggle={() => toggleMeal(member.id, "breakfast")} onValueChange={(v) => { const n = parseFloat(v); if (!isNaN(n) && n >= 0) updateMeal(member.id, { breakfastValue: n }); }} />
                    <MealRow icon="☀️" label={t.day} value={m.lunchValue} active={m.lunch} onToggle={() => toggleMeal(member.id, "lunch")} onValueChange={(v) => { const n = parseFloat(v); if (!isNaN(n) && n >= 0) updateMeal(member.id, { lunchValue: n }); }} />
                    <MealRow icon="🌙" label={t.night} value={m.dinnerValue} active={m.dinner} onToggle={() => toggleMeal(member.id, "dinner")} onValueChange={(v) => { const n = parseFloat(v); if (!isNaN(n) && n >= 0) updateMeal(member.id, { dinnerValue: n }); }} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="w-5 text-center">✏️</span><span className="font-medium">{t.custom}</span></div>
                      <div className="flex items-center">
                        <button onClick={() => updateMeal(member.id, { custom: Math.max(0, m.custom - 1) })} className="w-8 h-7 rounded-l-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/70 transition-colors border border-border/50">−</button>
                        <span className="w-8 h-7 flex items-center justify-center text-sm font-semibold text-foreground bg-secondary/50 border-y border-border/50">{m.custom}</span>
                        <button onClick={() => updateMeal(member.id, { custom: m.custom + 1 })} className="w-8 h-7 rounded-r-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/70 transition-colors border border-border/50">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 border-t border-border/30">
                    <span className="text-sm text-muted-foreground font-medium">{t.today}:</span>
                    <span className={`text-xl md:text-2xl font-extrabold tracking-tight ${total > 0 ? "text-primary" : "text-destructive"}`}>{total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
