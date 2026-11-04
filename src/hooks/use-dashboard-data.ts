import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMess } from "@/contexts/MessContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMonth } from "@/contexts/MonthContext";

export interface DashboardMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isGuest: boolean;
  isActive: boolean;
  totalMeals: number;
  dayMeals: number;
  nightMeals: number;
  personalPurchases: number;
  advanceContributed: number;
}

export interface DashboardData {
  members: DashboardMember[];
  totalExpense: number;
  totalMeals: number;
  perMealCost: number;
  totalAdvances: number;
  expenseByCategory: { category: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  activeCount: number;
  expenseRecordCount: number;
  advanceEntryCount: number;
  loading: boolean;
}

export function getMemberBalance(
  member: DashboardMember,
  perMealCost: number
): number {
  const mealCost = member.totalMeals * perMealCost;
  const balance =
    mealCost + member.personalPurchases - member.advanceContributed;
  return +balance.toFixed(2);
}

export function useDashboardData(): DashboardData {
  const { currentMess } = useMess();
  const { userRole } = useAuth();
  const { monthStart, monthEnd } = useMonth();
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [expenseData, setExpenseData] = useState<{
    total: number;
    count: number;
    byCategory: { category: string; amount: number }[];
    monthlyTrend: { month: string; amount: number }[];
  }>({ total: 0, count: 0, byCategory: [], monthlyTrend: [] });
  const [mealTotals, setMealTotals] = useState<Record<string, { total: number; day: number; night: number }>>({});
  const [advanceTotals, setAdvanceTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const messId = currentMess?.id ?? null;

  useEffect(() => {
    if (!messId) {
      setMembers([]);
      setExpenseData({ total: 0, count: 0, byCategory: [], monthlyTrend: [] });
      setMealTotals({});
      setAdvanceTotals({});
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);

      // Fetch members (all-time), expenses/meals/advances filtered by month
      const [membersRes, expensesRes, mealsRes, advancesRes] = await Promise.all([
        supabase.from("members").select("*").eq("mess_id", messId).order("name"),
        supabase.from("expenses").select("id, amount, category, expense_date")
          .eq("mess_id", messId)
          .gte("expense_date", monthStart)
          .lte("expense_date", monthEnd),
        supabase.from("meal_entries").select("member_id, total_meals, lunch, lunch_value, breakfast, breakfast_value, dinner, dinner_value, custom_count")
          .eq("mess_id", messId)
          .gte("entry_date", monthStart)
          .lte("entry_date", monthEnd),
        supabase.from("advances").select("member_id, amount")
          .eq("mess_id", messId)
          .gte("advance_date", monthStart)
          .lte("advance_date", monthEnd),
      ]);

      // Process meal totals per member for the selected month
      const mealMap: Record<string, { total: number; day: number; night: number }> = {};
      (mealsRes.data ?? []).forEach((m) => {
        const mid = m.member_id;
        if (!mealMap[mid]) mealMap[mid] = { total: 0, day: 0, night: 0 };
        mealMap[mid].total += Number(m.total_meals);
        mealMap[mid].day += (m.lunch ? Number(m.lunch_value) : 0) + (m.breakfast ? Number(m.breakfast_value) : 0) + Number(m.custom_count);
        mealMap[mid].night += m.dinner ? Number(m.dinner_value) : 0;
      });
      setMealTotals(mealMap);

      // Process advance totals per member for the selected month
      const advMap: Record<string, number> = {};
      (advancesRes.data ?? []).forEach((a) => {
        advMap[a.member_id] = (advMap[a.member_id] || 0) + Number(a.amount);
      });
      setAdvanceTotals(advMap);

      if (membersRes.error) {
        console.error("Failed to load members", membersRes.error);
        setMembers([]);
      } else {
        setMembers(
          (membersRes.data ?? []).map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.name.charAt(0).toUpperCase(),
            role: m.role,
            isGuest: m.is_guest,
            isActive: m.is_active,
            totalMeals: mealMap[m.id]?.total ?? 0,
            dayMeals: mealMap[m.id]?.day ?? 0,
            nightMeals: mealMap[m.id]?.night ?? 0,
            personalPurchases: Number(m.personal_purchases),
            advanceContributed: advMap[m.id] ?? 0,
          }))
        );
      }

      const expenses = expensesRes.data ?? [];
      const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const catMap: Record<string, number> = {};
      const monthMap: Record<string, number> = {};
      expenses.forEach((e) => {
        const cat = e.category || "Others";
        catMap[cat] = (catMap[cat] || 0) + Number(e.amount);
        const monthKey = (e.expense_date ?? "").slice(0, 7);
        if (monthKey) monthMap[monthKey] = (monthMap[monthKey] || 0) + Number(e.amount);
      });
      const byCategory = Object.entries(catMap).map(([category, amount]) => ({ category, amount }));
      const monthlyTrend = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));

      setExpenseData({ total, count: expenses.length, byCategory, monthlyTrend });
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel(`dashboard-expenses-${messId}-${monthStart}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `mess_id=eq.${messId}` }, () => {
        fetchAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_entries", filter: `mess_id=eq.${messId}` }, () => {
        fetchAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "advances", filter: `mess_id=eq.${messId}` }, () => {
        fetchAll();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [messId, monthStart, monthEnd]);

  const activeMembers = members.filter((m) => m.isActive);
  const totalMeals = activeMembers.reduce((s, m) => s + m.totalMeals, 0);
  const totalAdvances = activeMembers.reduce((s, m) => s + m.advanceContributed, 0);

  const totalExpense = expenseData.total;
  const perMealCost = totalMeals > 0 ? +(totalExpense / totalMeals).toFixed(2) : 0;

  return {
    members: activeMembers,
    totalExpense,
    totalMeals,
    perMealCost,
    totalAdvances,
    expenseByCategory: expenseData.byCategory,
    monthlyTrend: expenseData.monthlyTrend,
    activeCount: activeMembers.length,
    expenseRecordCount: expenseData.count,
    advanceEntryCount: activeMembers.filter((m) => m.advanceContributed > 0).length,
    loading,
  };
}
