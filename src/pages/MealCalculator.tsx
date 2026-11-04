import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Plus, Trash2, Utensils, Receipt, TrendingUp, Lock, Users, Handshake, ArrowRight, Copy, BarChart3, Download, FileText, Loader2, Check } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMonth } from "@/contexts/MonthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import SavedCalculations, { SavedCalculation } from "@/components/meal-calculator/SavedCalculations";
import { toast } from "sonner";
import { allocateCosts, computeSettlements, round2 } from "@/lib/meal-math";

const STANDARD_MULTIPLIERS = { breakfast: 0.5, lunch: 1, dinner: 1 } as const;
const LOCK_STORAGE_KEY = "meal-calculator-lock-standard";
const FIXED_BF_STORAGE_KEY = "meal-calculator-fixed-breakfast";
const FIXED_BF_PRICE_STORAGE_KEY = "meal-calculator-fixed-breakfast-price";
const DRAFT_STORAGE_KEY = "meal-calculator-draft-v1";
const DRAFT_TS_KEY = "meal-calculator-draft-v1-ts";

interface CustomMeal {
  id: string;
  name: string;
  count: number;
  multiplier: number;
}

interface CustomExpense {
  id: string;
  name: string;
  amount: number;
}

interface MemberRow {
  id: string;
  name: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  custom: number;
  expense: number;
}

// Read draft once at module load so multiple useState initializers stay in sync.
const loadDraft = (): Partial<{
  breakfast: number; lunch: number; dinner: number;
  breakfastMul: number; lunchMul: number; dinnerMul: number;
  customMeals: CustomMeal[]; customExpenses: CustomExpense[]; members: MemberRow[];
}> => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

export default function MealCalculator() {
  const draft = useMemo(loadDraft, []);

  // Standard meals
  const [breakfast, setBreakfast] = useState<number>(Number(draft.breakfast) || 0);
  const [lunch, setLunch] = useState<number>(Number(draft.lunch) || 0);
  const [dinner, setDinner] = useState<number>(Number(draft.dinner) || 0);

  // Multipliers (default per project memory)
  const [breakfastMul, setBreakfastMul] = useState<number>(Number(draft.breakfastMul) || STANDARD_MULTIPLIERS.breakfast);
  const [lunchMul, setLunchMul] = useState<number>(Number(draft.lunchMul) || STANDARD_MULTIPLIERS.lunch);
  const [dinnerMul, setDinnerMul] = useState<number>(Number(draft.dinnerMul) || STANDARD_MULTIPLIERS.dinner);

  // Lock standard multipliers (persisted)
  const [lockStandard, setLockStandard] = useState<boolean>(
    () => localStorage.getItem(LOCK_STORAGE_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(LOCK_STORAGE_KEY, String(lockStandard));
    if (lockStandard) {
      setBreakfastMul(STANDARD_MULTIPLIERS.breakfast);
      setLunchMul(STANDARD_MULTIPLIERS.lunch);
      setDinnerMul(STANDARD_MULTIPLIERS.dinner);
    }
  }, [lockStandard]);

  // Fixed-price breakfast mode (e.g., 50 taka per breakfast). When ON,
  // breakfasts are billed at a flat per-meal price and excluded from the
  // shared per-meal-cost pool used for lunch/dinner/custom.
  const [fixedBreakfast, setFixedBreakfast] = useState<boolean>(
    () => localStorage.getItem(FIXED_BF_STORAGE_KEY) === "true",
  );
  const [fixedBreakfastPrice, setFixedBreakfastPrice] = useState<number>(() => {
    const v = Number(localStorage.getItem(FIXED_BF_PRICE_STORAGE_KEY));
    return isFinite(v) && v > 0 ? v : 50;
  });

  useEffect(() => {
    localStorage.setItem(FIXED_BF_STORAGE_KEY, String(fixedBreakfast));
  }, [fixedBreakfast]);
  useEffect(() => {
    localStorage.setItem(FIXED_BF_PRICE_STORAGE_KEY, String(fixedBreakfastPrice));
  }, [fixedBreakfastPrice]);

  // Export options dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportIncludeSettlement, setExportIncludeSettlement] = useState(true);

  // Custom meals & expenses
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>(
    Array.isArray(draft.customMeals) ? draft.customMeals : [],
  );
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>(
    Array.isArray(draft.customExpenses) && draft.customExpenses.length > 0
      ? draft.customExpenses
      : [{ id: crypto.randomUUID(), name: "Bazar", amount: 0 }],
  );

  // Per-member rows
  const [members, setMembers] = useState<MemberRow[]>(
    Array.isArray(draft.members) ? draft.members : [],
  );

  // Last-saved-at timestamp (ms epoch). Initialized from storage so it
  // survives reloads and reflects the most recent autosave or manual save.
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(() => {
    const raw = localStorage.getItem(DRAFT_TS_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  // Visual autosave indicator (no toast spam — just an inline pill).
  const [isAutosaving, setIsAutosaving] = useState(false);
  const hasMountedRef = useRef(false);

  // Debounced autosave: persist 600ms after user stops typing/changing.
  useEffect(() => {
    // Skip the very first run (state was just hydrated from the draft).
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setIsAutosaving(true);
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            breakfast, lunch, dinner,
            breakfastMul, lunchMul, dinnerMul,
            customMeals, customExpenses, members,
          }),
        );
        const ts = Date.now();
        localStorage.setItem(DRAFT_TS_KEY, String(ts));
        setDraftSavedAt(ts);
      } catch { /* quota — ignore */ }
      setIsAutosaving(false);
    }, 600);
    return () => clearTimeout(handle);
  }, [breakfast, lunch, dinner, breakfastMul, lunchMul, dinnerMul, customMeals, customExpenses, members]);

  const memberExpenseTotal = useMemo(
    () => members.reduce((s, m) => s + (Number(m.expense) || 0), 0),
    [members],
  );

  // Helper: meal units for a member row (full — includes breakfast units)
  const memberUnits = (m: MemberRow) =>
    (Number(m.breakfast) || 0) * breakfastMul +
    (Number(m.lunch) || 0) * lunchMul +
    (Number(m.dinner) || 0) * dinnerMul +
    (Number(m.custom) || 0);

  // Units that share the per-meal-cost pool. When fixed-breakfast mode is ON,
  // breakfast units are excluded (they're billed at the flat price).
  const memberPoolUnits = (m: MemberRow) =>
    (fixedBreakfast ? 0 : (Number(m.breakfast) || 0) * breakfastMul) +
    (Number(m.lunch) || 0) * lunchMul +
    (Number(m.dinner) || 0) * dinnerMul +
    (Number(m.custom) || 0);

  const memberBreakfastCount = (m: MemberRow) => Number(m.breakfast) || 0;

  const memberMealTotal = useMemo(
    () => members.reduce((s, m) => s + memberUnits(m), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, breakfastMul, lunchMul, dinnerMul],
  );

  const memberPoolTotal = useMemo(
    () => members.reduce((s, m) => s + memberPoolUnits(m), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, breakfastMul, lunchMul, dinnerMul, fixedBreakfast],
  );

  // Total breakfast count = ONLY members' breakfasts (top-level standard
  // inputs are informational and don't get billed to anyone).
  const totalBreakfastCount = useMemo(
    () => members.reduce((s, m) => s + (Number(m.breakfast) || 0), 0),
    [members],
  );

  // Revenue collected from breakfasts at the flat price (fixed mode only).
  const breakfastRevenue = fixedBreakfast ? totalBreakfastCount * fixedBreakfastPrice : 0;

  // Display-only "total meals" — includes top-level standard + custom + members
  // so the user still sees what they typed. NOT used as the cost denominator.
  const totalMeals = useMemo(() => {
    const std = breakfast * breakfastMul + lunch * lunchMul + dinner * dinnerMul;
    const cust = customMeals.reduce((s, m) => s + m.count * m.multiplier, 0);
    return std + cust + memberMealTotal;
  }, [breakfast, lunch, dinner, breakfastMul, lunchMul, dinnerMul, customMeals, memberMealTotal]);

  // Pool meal units = ONLY member units (excluding breakfast in fixed mode).
  // This guarantees Σ(member cost) === total expense — 100% accurate.
  const poolMeals = useMemo(
    () => (fixedBreakfast ? memberPoolTotal : memberMealTotal),
    [fixedBreakfast, memberPoolTotal, memberMealTotal],
  );

  const totalExpense = useMemo(
    () => customExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) + memberExpenseTotal,
    [customExpenses, memberExpenseTotal],
  );

  // In fixed-breakfast mode, breakfast revenue offsets expenses for the pool.
  // No clamping: if breakfast revenue exceeds expenses the surplus must flow
  // back to the pool (negative per-meal cost) or the books won't balance.
  const poolExpense = totalExpense - breakfastRevenue;

  // Per-meal cost applies to lunch/dinner/custom (and breakfast too when not in fixed mode).
  const perMealCost = poolMeals > 0 ? poolExpense / poolMeals : 0;

  // ---- Exact money allocation -------------------------------------------
  // Charges are allocated in integer paisa with largest-remainder rounding so
  // that Σ(member cost) === total expense to the last paisa. See lib/meal-math.
  const memberCostMap = useMemo(
    () =>
      allocateCosts(
        members.map((m) => ({
          id: m.id,
          raw:
            memberPoolUnits(m) * perMealCost +
            (fixedBreakfast ? memberBreakfastCount(m) * fixedBreakfastPrice : 0),
        })),
        totalExpense,
        poolMeals > 0,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, perMealCost, poolMeals, totalExpense, breakfastMul, lunchMul, dinnerMul, fixedBreakfast, fixedBreakfastPrice],
  );

  // Exact, rounding-safe cost for a member (use this everywhere).
  const costOf = (m: MemberRow) => memberCostMap.get(m.id) ?? 0;
  const balanceOf = (m: MemberRow) => round2((Number(m.expense) || 0) - costOf(m));

  const { monthLabel } = useMonth();

  // Aggregate meal-type units across all members
  const mealTypeChartData = useMemo(() => {
    const totals = members.reduce(
      (acc, m) => {
        acc.breakfast += (Number(m.breakfast) || 0) * breakfastMul;
        acc.lunch += (Number(m.lunch) || 0) * lunchMul;
        acc.dinner += (Number(m.dinner) || 0) * dinnerMul;
        acc.custom += Number(m.custom) || 0;
        return acc;
      },
      { breakfast: 0, lunch: 0, dinner: 0, custom: 0 },
    );
    return [
      { label: "Breakfast", units: totals.breakfast, cost: totals.breakfast * perMealCost, color: "hsl(var(--primary))" },
      { label: "Lunch", units: totals.lunch, cost: totals.lunch * perMealCost, color: "hsl(var(--info))" },
      { label: "Night", units: totals.dinner, cost: totals.dinner * perMealCost, color: "hsl(var(--accent))" },
      { label: "Custom", units: totals.custom, cost: totals.custom * perMealCost, color: "hsl(var(--success))" },
    ];
  }, [members, breakfastMul, lunchMul, dinnerMul, perMealCost]);

  const totalMembersUnits = mealTypeChartData.reduce((s, d) => s + d.units, 0);
  const totalMembersCost = mealTypeChartData.reduce((s, d) => s + d.cost, 0);

  // Settlement: compute optimal payments to balance member books.
  const [settleOpen, setSettleOpen] = useState(false);
  const settlements = useMemo(
    () =>
      computeSettlements(
        members.map((m) => ({ name: m.name?.trim() || "Unnamed", balance: balanceOf(m) })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, memberCostMap],
  );

  const copySettlements = async () => {
    if (settlements.length === 0) return;
    const text = settlements
      .map((s) => `${s.from} → ${s.to}: ${s.amount.toFixed(2)}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const addCustomMeal = () =>
    setCustomMeals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: `Meal ${prev.length + 1}`, count: 0, multiplier: 1 },
    ]);

  const updateCustomMeal = (id: string, patch: Partial<CustomMeal>) =>
    setCustomMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const removeCustomMeal = (id: string) =>
    setCustomMeals((prev) => prev.filter((m) => m.id !== id));

  const addExpense = () =>
    setCustomExpenses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", amount: 0 },
    ]);

  const updateExpense = (id: string, patch: Partial<CustomExpense>) =>
    setCustomExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeExpense = (id: string) =>
    setCustomExpenses((prev) => prev.filter((e) => e.id !== id));

  const addMember = () =>
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Member ${prev.length + 1}`,
        breakfast: 0, lunch: 0, dinner: 0, custom: 0,
        expense: 0,
      },
    ]);

  const updateMember = (id: string, patch: Partial<MemberRow>) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const removeMember = (id: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const reset = () => {
    setBreakfast(0);
    setLunch(0);
    setDinner(0);
    setBreakfastMul(STANDARD_MULTIPLIERS.breakfast);
    setLunchMul(STANDARD_MULTIPLIERS.lunch);
    setDinnerMul(STANDARD_MULTIPLIERS.dinner);
    setCustomMeals([]);
    setCustomExpenses([{ id: crypto.randomUUID(), name: "Bazar", amount: 0 }]);
    setMembers([]);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_TS_KEY);
    } catch { /* ignore */ }
    setDraftSavedAt(null);
    setResetOpen(false);
    setResetConfirmed(false);
    toast.success("All inputs cleared");
  };

  const saveDraftNow = () => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          breakfast, lunch, dinner,
          breakfastMul, lunchMul, dinnerMul,
          customMeals, customExpenses, members,
        }),
      );
      const ts = Date.now();
      localStorage.setItem(DRAFT_TS_KEY, String(ts));
      setDraftSavedAt(ts);
      toast.success("Draft saved");
    } catch {
      toast.error("Could not save draft");
    }
  };

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        toast.error("No saved draft found");
        return;
      }
      const d = JSON.parse(raw);
      setBreakfast(Number(d.breakfast) || 0);
      setLunch(Number(d.lunch) || 0);
      setDinner(Number(d.dinner) || 0);
      if (!lockStandard) {
        setBreakfastMul(Number(d.breakfastMul) || STANDARD_MULTIPLIERS.breakfast);
        setLunchMul(Number(d.lunchMul) || STANDARD_MULTIPLIERS.lunch);
        setDinnerMul(Number(d.dinnerMul) || STANDARD_MULTIPLIERS.dinner);
      }
      setCustomMeals(Array.isArray(d.customMeals) ? d.customMeals : []);
      setCustomExpenses(
        Array.isArray(d.customExpenses) && d.customExpenses.length > 0
          ? d.customExpenses
          : [{ id: crypto.randomUUID(), name: "Bazar", amount: 0 }],
      );
      setMembers(Array.isArray(d.members) ? d.members : []);
      toast.success("Draft restored");
    } catch {
      toast.error("Failed to restore draft");
    }
  };

  // Human-friendly "x min ago" string that updates every 30s.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const formatSavedAt = (ts: number | null): string => {
    if (!ts) return "Not saved yet";
    const diff = Date.now() - ts;
    if (diff < 60_000) return "Saved just now";
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `Saved ${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Saved ${hrs}h ago`;
    return `Saved ${new Date(ts).toLocaleString()}`;
  };

  const downloadReport = (includeSettlement: boolean = true) => {
    if (members.length === 0) {
      toast.error("Add at least one member to download a report");
      return;
    }
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
    const lines: string[] = [];

    // Summary block
    lines.push("Meal Calculator — Full Report");
    lines.push(`Month,${esc(monthLabel)}`);
    lines.push(`Generated,${esc(new Date().toLocaleString())}`);
    lines.push(`Fixed-price breakfast,${fixedBreakfast ? "Yes" : "No"}`);
    if (fixedBreakfast) lines.push(`Breakfast price,${fmt(fixedBreakfastPrice)}`);
    lines.push(`Total expense,${fmt(totalExpense)}`);
    if (fixedBreakfast) {
      lines.push(`Breakfast revenue,${fmt(breakfastRevenue)}`);
      lines.push(`Pool expense,${fmt(poolExpense)}`);
    }
    lines.push(`Pool meals (units),${fmt(poolMeals)}`);
    lines.push(`Per-meal cost,${fmt(perMealCost)}`);
    lines.push("");

    // Per-member breakdown
    lines.push("Per-member breakdown");
    lines.push([
      "Name", "Breakfast", "Lunch", "Night", "Custom",
      "Total meal-units",
      fixedBreakfast ? "Breakfast cost (flat)" : "Breakfast cost",
      "Pool cost (lunch+night+custom)",
      "Total meal cost", "Paid expense", "Balance", "Status",
    ].map(esc).join(","));

    let sumBf = 0, sumLn = 0, sumDn = 0, sumCu = 0;
    let sumUnits = 0, sumBfCost = 0, sumPoolCost = 0, sumCost = 0, sumPaid = 0;
    members.forEach((m) => {
      const bf = Number(m.breakfast) || 0;
      const ln = Number(m.lunch) || 0;
      const dn = Number(m.dinner) || 0;
      const cu = Number(m.custom) || 0;
      const units = memberUnits(m);
      const poolUnits = memberPoolUnits(m);
      const bfCost = fixedBreakfast ? round2(bf * fixedBreakfastPrice) : round2(bf * breakfastMul * perMealCost);
      const cost = costOf(m);
      const poolCost = round2(cost - bfCost);
      const paid = Number(m.expense) || 0;
      const balance = round2(paid - cost);
      const status = balance > 0.005 ? "Receive" : balance < -0.005 ? "Pay" : "Settled";
      sumBf += bf; sumLn += ln; sumDn += dn; sumCu += cu;
      sumUnits += units; sumBfCost += bfCost; sumPoolCost += poolCost;
      sumCost += cost; sumPaid += paid;
      lines.push([
        esc(m.name?.trim() || "Unnamed"),
        bf, ln, dn, cu,
        fmt(units), fmt(bfCost), fmt(poolCost),
        fmt(cost), fmt(paid), fmt(balance), status,
      ].join(","));
    });
    lines.push([
      "TOTAL", sumBf, sumLn, sumDn, sumCu,
      fmt(sumUnits), fmt(sumBfCost), fmt(sumPoolCost),
      fmt(sumCost), fmt(sumPaid), fmt(sumPaid - sumCost), "",
    ].join(","));
    lines.push("");

    // Expenses
    lines.push("Shared expenses");
    lines.push("Name,Amount");
    customExpenses.forEach((e) => lines.push(`${esc(e.name || "Unnamed")},${fmt(Number(e.amount) || 0)}`));
    lines.push("");

    // Settlements (optional)
    if (includeSettlement && settlements.length > 0) {
      lines.push("Settlement plan (who pays whom)");
      lines.push("From,To,Amount");
      settlements.forEach((s) => lines.push(`${esc(s.from)},${esc(s.to)},${fmt(s.amount)}`));
    }

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeMonth = (monthLabel || "month").replace(/\s+/g, "-");
    a.href = url;
    a.download = `meal-report-${safeMonth}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const downloadPDF = (includeSettlement: boolean = true) => {
    if (members.length === 0) {
      toast.error("Add at least one member to download a report");
      return;
    }
    const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
    const money = (n: number) => `${fmt(n)}`;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Meal Calculator — Full Report", 40, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Month: ${monthLabel}`, 40, y);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 40, y, { align: "right" });
    y += 16;
    doc.setTextColor(0);

    // Summary table
    const summaryRows: [string, string][] = [
      ["Fixed-price breakfast", fixedBreakfast ? "Yes" : "No"],
    ];
    if (fixedBreakfast) summaryRows.push(["Breakfast price", money(fixedBreakfastPrice)]);
    summaryRows.push(["Total expense", money(totalExpense)]);
    if (fixedBreakfast) {
      summaryRows.push(["Breakfast revenue", money(breakfastRevenue)]);
      summaryRows.push(["Pool expense", money(poolExpense)]);
    }
    summaryRows.push(["Pool meals (units)", fmt(poolMeals)]);
    summaryRows.push(["Per-meal cost", money(perMealCost)]);

    autoTable(doc, {
      startY: y,
      head: [["Summary", "Value"]],
      body: summaryRows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 40, right: 40 },
    });
    y = (doc as any).lastAutoTable.finalY + 16;

    // Per-member breakdown
    let sumBf = 0, sumLn = 0, sumDn = 0, sumCu = 0;
    let sumUnits = 0, sumCost = 0, sumPaid = 0;
    const memberRows = members.map((m) => {
      const bf = Number(m.breakfast) || 0;
      const ln = Number(m.lunch) || 0;
      const dn = Number(m.dinner) || 0;
      const cu = Number(m.custom) || 0;
      const units = memberUnits(m);
      const poolUnits = memberPoolUnits(m);
      const bfCost = fixedBreakfast ? round2(bf * fixedBreakfastPrice) : round2(bf * breakfastMul * perMealCost);
      const cost = costOf(m);
      const paid = Number(m.expense) || 0;
      const balance = round2(paid - cost);
      const status = balance > 0.005 ? "Receive" : balance < -0.005 ? "Pay" : "Settled";
      sumBf += bf; sumLn += ln; sumDn += dn; sumCu += cu;
      sumUnits += units; sumCost += cost; sumPaid += paid;
      return [
        m.name?.trim() || "Unnamed",
        String(bf), String(ln), String(dn), String(cu),
        fmt(units), money(cost), money(paid), money(balance), status,
      ];
    });
    memberRows.push([
      "TOTAL", String(sumBf), String(sumLn), String(sumDn), String(sumCu),
      fmt(sumUnits), money(sumCost), money(sumPaid), money(sumPaid - sumCost), "",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Name", "Bkfst", "Lunch", "Night", "Custom", "Units", "Cost", "Paid", "Balance", "Status"]],
      body: memberRows,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" },
        4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" },
        7: { halign: "right" }, 8: { halign: "right" },
      },
      didParseCell: (data) => {
        if (data.row.index === memberRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
        if (data.section === "body" && data.column.index === 9) {
          const v = data.cell.raw as string;
          if (v === "Receive") data.cell.styles.textColor = [22, 163, 74];
          else if (v === "Pay") data.cell.styles.textColor = [220, 38, 38];
        }
      },
      margin: { left: 40, right: 40 },
    });
    y = (doc as any).lastAutoTable.finalY + 16;

    // Shared expenses
    autoTable(doc, {
      startY: y,
      head: [["Shared expense", "Amount"]],
      body: customExpenses.map((e) => [e.name || "Unnamed", money(Number(e.amount) || 0)]),
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 40, right: 40 },
    });
    y = (doc as any).lastAutoTable.finalY + 16;

    // Settlements (optional)
    if (includeSettlement && settlements.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["From", "→", "To", "Amount"]],
        body: settlements.map((s) => [s.from, "→", s.to, money(s.amount)]),
        theme: "grid",
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 1: { halign: "center", cellWidth: 24 }, 3: { halign: "right" } },
        margin: { left: 40, right: 40 },
      });
    }

    // Footer page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageW - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: "right" },
      );
    }

    const safeMonth = (monthLabel || "month").replace(/\s+/g, "-");
    doc.save(`meal-report-${safeMonth}-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF downloaded");
  };

  const handleLoad = (calc: SavedCalculation) => {
    setBreakfast(Number(calc.breakfast_count) || 0);
    setLunch(Number(calc.lunch_count) || 0);
    setDinner(Number(calc.dinner_count) || 0);
    setBreakfastMul(Number(calc.breakfast_multiplier) || 0.5);
    setLunchMul(Number(calc.lunch_multiplier) || 1);
    setDinnerMul(Number(calc.dinner_multiplier) || 1);
    setCustomMeals(Array.isArray(calc.custom_meals) ? calc.custom_meals : []);
    setCustomExpenses(
      Array.isArray(calc.custom_expenses) && calc.custom_expenses.length > 0
        ? calc.custom_expenses
        : [{ id: crypto.randomUUID(), name: "Bazar", amount: 0 }],
    );
    toast.success(`Loaded "${calc.name}"`);
  };

  return (
    <AppLayout title="Meal Calculator" subtitle="Direct per-meal cost" icon={<Calculator size={18} />}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calculator size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Meal Calculator</h1>
              <p className="text-sm text-muted-foreground">
                Calculate per-meal cost — save scenarios per month for review.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span
              className={`flex items-center gap-1.5 text-[11px] tabular-nums w-full sm:w-auto sm:mr-2 justify-end transition-colors ${
                isAutosaving ? "text-primary" : "text-muted-foreground"
              }`}
              title={draftSavedAt ? new Date(draftSavedAt).toLocaleString() : undefined}
              aria-live="polite"
            >
              {isAutosaving ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  {draftSavedAt && <Check size={11} className="text-success" />}
                  <span>{formatSavedAt(draftSavedAt)}</span>
                </>
              )}
            </span>
            <Button variant="outline" onClick={() => { setExportFormat("csv"); setExportDialogOpen(true); }}>
              <Download size={14} /> CSV
            </Button>
            <Button variant="outline" onClick={() => { setExportFormat("pdf"); setExportDialogOpen(true); }}>
              <FileText size={14} /> PDF
            </Button>
            <Button variant="outline" onClick={saveDraftNow}>Save Draft</Button>
            <Button variant="outline" onClick={restoreDraft} disabled={!draftSavedAt}>
              Restore Draft
            </Button>
            <Dialog
              open={resetOpen}
              onOpenChange={(open) => {
                setResetOpen(open);
                if (!open) setResetConfirmed(false);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="destructive">Reset</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset everything?</DialogTitle>
                  <DialogDescription>
                    This clears all standard meals, custom meals, expenses, and member rows — and removes the saved draft. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <label
                  htmlFor="reset-confirm"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 cursor-pointer"
                >
                  <Checkbox
                    id="reset-confirm"
                    checked={resetConfirmed}
                    onCheckedChange={(c) => setResetConfirmed(c === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground">
                    I understand this will permanently delete all members, expenses, meal counts, and the saved draft.
                  </span>
                </label>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={reset}
                    disabled={!resetConfirmed}
                  >
                    Reset all
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Standard meals */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Utensils size={18} className="text-primary" /> Standard Meals
                    </CardTitle>
                    <CardDescription>Enter total counts; multipliers convert to meal-units.</CardDescription>
                  </div>
                  <label
                    htmlFor="lock-standard"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      lockStandard
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Lock size={13} />
                    <span className="text-xs font-semibold">Lock standard (0.5 / 1 / 1)</span>
                    <Switch
                      id="lock-standard"
                      checked={lockStandard}
                      onCheckedChange={setLockStandard}
                    />
                  </label>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fixed-price breakfast toggle */}
                <div className={`rounded-lg border p-3 transition-colors ${fixedBreakfast ? "border-primary/40 bg-primary/5" : "border-border/50 bg-muted/20"}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">🍳 Fixed-price breakfast</p>
                      <p className="text-[11px] text-muted-foreground">
                        Charge a flat amount per breakfast (e.g. 50). Breakfasts are billed separately and excluded from the shared per-meal cost.
                      </p>
                    </div>
                    <Switch
                      id="fixed-breakfast"
                      checked={fixedBreakfast}
                      onCheckedChange={setFixedBreakfast}
                    />
                  </div>
                  {fixedBreakfast && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-7 sm:col-span-5">
                          <Label className="text-xs">Price per breakfast (taka)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground pointer-events-none">৳</span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              value={fixedBreakfastPrice || ""}
                              onChange={(e) => setFixedBreakfastPrice(Number(e.target.value) || 0)}
                              placeholder="50"
                              className="pl-7"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Flat money amount per breakfast — not a meal-unit.
                          </p>
                        </div>
                        <div className="col-span-5 sm:col-span-3 text-right">
                          <Label className="text-xs">Breakfasts</Label>
                          <div className="h-10 flex items-center justify-end font-semibold text-foreground tabular-nums">
                            {totalBreakfastCount}
                          </div>
                        </div>
                        <div className="col-span-12 sm:col-span-4 text-right">
                          <Label className="text-xs">Breakfast revenue</Label>
                          <div className="h-10 flex items-center justify-end font-bold text-primary tabular-nums">
                            ৳{breakfastRevenue.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick set:</span>
                        {[20, 30, 40, 50, 60, 80, 100].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setFixedBreakfastPrice(amt)}
                            className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                              fixedBreakfastPrice === amt
                                ? "border-primary/50 bg-primary/15 text-primary font-semibold"
                                : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border"
                            }`}
                          >
                            ৳{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {[
                  { label: "Breakfast", count: breakfast, setCount: setBreakfast, mul: breakfastMul, setMul: setBreakfastMul },
                  { label: "Lunch", count: lunch, setCount: setLunch, mul: lunchMul, setMul: setLunchMul },
                  { label: "Dinner", count: dinner, setCount: setDinner, mul: dinnerMul, setMul: setDinnerMul },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 sm:col-span-6">
                      <Label className="text-xs">{row.label} count</Label>
                      <Input
                        type="number"
                        min={0}
                        value={row.count || ""}
                        onChange={(e) => row.setCount(Number(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-3">
                      <Label className="text-xs flex items-center gap-1">
                        Multiplier {lockStandard && <Lock size={10} className="text-primary" />}
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        value={row.mul}
                        disabled={lockStandard}
                        onChange={(e) => row.setMul(Number(e.target.value) || 0)}
                        className={lockStandard ? "bg-muted/40 cursor-not-allowed" : ""}
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3 text-right">
                      <Label className="text-xs">Units</Label>
                      <div className="h-10 flex items-center justify-end font-semibold text-primary">
                        {(row.count * row.mul).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Custom meals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Custom Meals</CardTitle>
                  <CardDescription>Add guest meals or any extra meal counts.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addCustomMeal}>
                  <Plus size={14} /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {customMeals.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No custom meals added.</p>
                )}
                {customMeals.map((m) => (
                  <div key={m.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={m.name}
                        onChange={(e) => updateCustomMeal(m.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <Label className="text-xs">Count</Label>
                      <Input
                        type="number"
                        min={0}
                        value={m.count || ""}
                        onChange={(e) => updateCustomMeal(m.id, { count: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs">Mul.</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={m.multiplier}
                        onChange={(e) => updateCustomMeal(m.id, { multiplier: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2 text-right font-semibold text-primary text-sm pr-1">
                      {(m.count * m.multiplier).toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button size="icon" variant="ghost" onClick={() => removeCustomMeal(m.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt size={18} className="text-primary" /> Expenses
                  </CardTitle>
                  <CardDescription>Add all spend lines to calculate total.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addExpense}>
                  <Plus size={14} /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {customExpenses.map((e) => (
                  <div key={e.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-7">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={e.name}
                        placeholder="e.g. Vegetables"
                        onChange={(ev) => updateExpense(e.id, { name: ev.target.value })}
                      />
                    </div>
                    <div className="col-span-10 sm:col-span-4">
                      <Label className="text-xs">Amount</Label>
                      <Input
                        type="number"
                        min={0}
                        value={e.amount || ""}
                        onChange={(ev) => updateExpense(e.id, { amount: Number(ev.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <Button size="icon" variant="ghost" onClick={() => removeExpense(e.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* By Member */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users size={18} className="text-primary" /> Expense by Member
                  </CardTitle>
                  <CardDescription>
                    Per-member meals + paid expense → auto cost & balance.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={members.length < 2}>
                        <Handshake size={14} /> Settle All
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Handshake size={18} className="text-primary" /> Settlement Plan
                        </DialogTitle>
                        <DialogDescription>
                          Optimal payments to balance everyone's books.
                        </DialogDescription>
                      </DialogHeader>
                      {settlements.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          🎉 Everyone is already settled!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {settlements.map((s, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/20"
                            >
                              <span className="font-semibold text-destructive truncate flex-1 text-right">
                                {s.from}
                              </span>
                              <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                              <span className="font-semibold text-success truncate flex-1">
                                {s.to}
                              </span>
                              <span className="font-bold tabular-nums text-primary ml-2">
                                {s.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <p className="text-[11px] text-muted-foreground text-center pt-2">
                            {settlements.length} payment{settlements.length === 1 ? "" : "s"} to settle all balances.
                          </p>
                        </div>
                      )}
                      <DialogFooter className="gap-2">
                        {settlements.length > 0 && (
                          <Button variant="outline" onClick={copySettlements}>
                            <Copy size={14} /> Copy
                          </Button>
                        )}
                        <Button onClick={() => setSettleOpen(false)}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" onClick={addMember}>
                    <Plus size={14} /> Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No members yet. Add a member to track their share.
                  </p>
                )}
                {members.map((m) => {
                  const units = memberUnits(m);
                  const poolUnits = memberPoolUnits(m);
                  const breakfastCount = memberBreakfastCount(m);
                  const breakfastFlatCost = fixedBreakfast ? round2(breakfastCount * fixedBreakfastPrice) : 0;
                  const cost = costOf(m);
                  const poolCost = round2(cost - breakfastFlatCost);
                  const balance = balanceOf(m);
                  const breakfastUnits = (Number(m.breakfast) || 0) * breakfastMul;
                  const lunchUnits = (Number(m.lunch) || 0) * lunchMul;
                  const dinnerUnits = (Number(m.dinner) || 0) * dinnerMul;
                  const customUnits = Number(m.custom) || 0;
                  return (
                    <div key={m.id} className="rounded-lg border border-border/50 p-3 space-y-3">
                      {/* Row 1: name + delete */}
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Member name</Label>
                          <Input
                            value={m.name}
                            maxLength={60}
                            onChange={(e) => updateMember(m.id, { name: e.target.value })}
                          />
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>

                      {/* Row 2: meal type counts */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: "breakfast" as const, label: "Breakfast", val: m.breakfast, mul: breakfastMul, units: breakfastUnits },
                          { key: "lunch" as const, label: "Lunch", val: m.lunch, mul: lunchMul, units: lunchUnits },
                          { key: "dinner" as const, label: "Night", val: m.dinner, mul: dinnerMul, units: dinnerUnits },
                          { key: "custom" as const, label: "Custom", val: m.custom, mul: 1, units: customUnits },
                        ].map((f) => (
                          <div key={f.key}>
                            <Label className="text-[10px] flex justify-between">
                              <span>{f.label}</span>
                              <span className="text-muted-foreground">×{f.mul}</span>
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={f.val || ""}
                              onChange={(e) => updateMember(m.id, { [f.key]: Number(e.target.value) || 0 } as Partial<MemberRow>)}
                            />
                            <p className="text-[10px] text-primary text-right mt-0.5 font-semibold">
                              {f.units.toFixed(2)} u
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Row 3: paid expense */}
                      <div>
                        <Label className="text-xs">Paid expense</Label>
                        <Input
                          type="number"
                          min={0}
                          value={m.expense || ""}
                          onChange={(e) => updateMember(m.id, { expense: Number(e.target.value) || 0 })}
                        />
                      </div>

                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-2 text-xs pt-2 border-t border-border/40">
                        <div>
                          <p className="text-muted-foreground">Total meals</p>
                          <p className="font-bold tabular-nums">{units.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Meal cost</p>
                          <p className="font-bold tabular-nums">{cost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid</p>
                          <p className="font-bold tabular-nums">{(Number(m.expense) || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p
                            className={`font-bold tabular-nums ${
                              balance > 0 ? "text-success" : balance < 0 ? "text-destructive" : ""
                            }`}
                          >
                            {balance >= 0 ? "+" : ""}
                            {balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {members.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-xs pt-3 mt-2 border-t border-border/60">
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider">Total meals</p>
                      <p className="font-bold text-primary tabular-nums">{memberMealTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider">Total paid</p>
                      <p className="font-bold text-primary tabular-nums">{memberExpenseTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider">Net balance</p>
                      <p className="font-bold tabular-nums">
                        {round2(members.reduce((s, mm) => s + balanceOf(mm), 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Inline settlement view */}
                {members.length >= 2 && (
                  <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Handshake size={13} /> Settlement Plan
                      </p>
                      {settlements.length > 0 && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={copySettlements}>
                          <Copy size={12} /> Copy
                        </Button>
                      )}
                    </div>
                    {settlements.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        🎉 Everyone is balanced — no payments needed.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {settlements.map((s, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs p-2 rounded-md bg-card/60 border border-border/40"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-destructive truncate flex-1 text-right">
                              {s.from}
                            </span>
                            <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
                            <span className="font-semibold text-success truncate flex-1">
                              {s.to}
                            </span>
                            <span className="font-bold tabular-nums text-primary ml-1">
                              {s.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                          {settlements.length} payment{settlements.length === 1 ? "" : "s"} to settle all balances.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground italic pt-1">
                  Per-meal counts use the same multipliers as Standard Meals. Member meals & expenses are added to the totals above. Balance = Paid − (Total Meals × Per-Meal Cost).
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column — result */}
          <div className="space-y-6">
            <SavedCalculations
              state={{
                breakfast, lunch, dinner,
                breakfastMul, lunchMul, dinnerMul,
                customMeals, customExpenses,
                totalMeals, totalExpense, perMealCost,
              }}
              onLoad={handleLoad}
            />

            {/* Meal Type Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 size={18} className="text-primary" /> Meal Mix — {monthLabel}
                </CardTitle>
                <CardDescription>Units & cost by meal type across all members</CardDescription>
              </CardHeader>
              <CardContent>
                {mealTypeChartData.every((d) => d.units === 0) ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Add member meals to see the breakdown.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-lg bg-muted/40 p-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Meals</p>
                        <p className="text-lg font-bold tabular-nums">{totalMeals.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-primary/80">Per Meal</p>
                        <p className="text-lg font-bold text-primary tabular-nums">{perMealCost.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="h-44 -ml-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mealTypeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={32}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(v: number, name: string) => [
                              v.toFixed(2),
                              name === "units" ? "Units" : "Cost",
                            ]}
                          />
                          <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                            {mealTypeChartData.map((d) => (
                              <Cell key={`u-${d.label}`} fill={d.color} />
                            ))}
                          </Bar>
                          <Bar dataKey="cost" radius={[6, 6, 0, 0]} opacity={0.55}>
                            {mealTypeChartData.map((d) => (
                              <Cell key={`c-${d.label}`} fill={d.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 mt-3 text-[11px]">
                      {mealTypeChartData.map((d) => {
                        const unitShare = totalMembersUnits > 0 ? (d.units / totalMembersUnits) * 100 : 0;
                        const costShare = totalMembersCost > 0 ? (d.cost / totalMembersCost) * 100 : 0;
                        return (
                          <div key={d.label} className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                              style={{ background: d.color }}
                            />
                            <span className="text-muted-foreground truncate w-16">{d.label}</span>
                            <span className="ml-auto font-semibold tabular-nums text-foreground">
                              {d.units.toFixed(1)}u <span className="text-muted-foreground font-normal">({unitShare.toFixed(0)}%)</span>
                            </span>
                            <span className="font-semibold tabular-nums text-primary w-24 text-right">
                              {d.cost.toFixed(2)} <span className="text-muted-foreground font-normal">({costShare.toFixed(0)}%)</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="sticky top-4 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp size={18} className="text-primary" /> Result
                </CardTitle>
                <CardDescription>Live calculation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Meals (units)</span>
                  <span className="font-semibold">{totalMeals.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Expense</span>
                  <span className="font-semibold">{totalExpense.toFixed(2)}</span>
                </div>

                {fixedBreakfast && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Breakfast revenue ({totalBreakfastCount} × {fixedBreakfastPrice})
                      </span>
                      <span className="font-semibold text-success">−{breakfastRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pool expense (lunch + night)</span>
                      <span className="font-semibold">{poolExpense.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pool meals (units)</span>
                      <span className="font-semibold">{poolMeals.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <Separator />

                {fixedBreakfast && (
                  <div className="rounded-xl bg-info/10 border border-info/20 p-3 text-center">
                    <p className="text-[11px] uppercase tracking-widest text-info/80 font-semibold">
                      Breakfast (flat)
                    </p>
                    <p className="text-xl font-bold text-info mt-0.5 tabular-nums">
                      {fixedBreakfastPrice.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ breakfast</span>
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-primary/80 font-semibold">
                    {fixedBreakfast ? "Per Meal (Lunch / Night / Custom)" : "Per Meal Cost"}
                  </p>
                  <p className="text-3xl font-black text-primary mt-1">
                    {perMealCost.toFixed(2)}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  {fixedBreakfast
                    ? "Per Meal = (Total Expense − Breakfast Revenue) ÷ Pool Meal Units"
                    : "Per Meal = Total Expense ÷ Total Meal Units"}
                </p>

                {fixedBreakfast && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs space-y-1">
                    <p className="font-semibold text-foreground mb-1">Combined cost example</p>
                    <div className="flex justify-between text-muted-foreground">
                      <span>1 breakfast + 1 lunch/night</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {(fixedBreakfastPrice + perMealCost).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>1 breakfast + 1 lunch + 1 night</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {(fixedBreakfastPrice + perMealCost * 2).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}


                <Separator />

                {/* Breakdown */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                    Meal Units Breakdown
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Breakfast", units: breakfast * breakfastMul },
                      { label: "Lunch", units: lunch * lunchMul },
                      { label: "Dinner", units: dinner * dinnerMul },
                      ...customMeals.map((m) => ({
                        label: m.name || "Custom",
                        units: m.count * m.multiplier,
                      })),
                    ].map((row, i) => {
                      const share = totalMeals > 0 ? (row.units / totalMeals) * 100 : 0;
                      return (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground truncate pr-2">{row.label}</span>
                            <span className="font-semibold tabular-nums">
                              {row.units.toFixed(2)}{" "}
                              <span className="text-muted-foreground font-normal">({share.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className="h-1 mt-0.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60" style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Expense → per-meal contribution */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                    Per-Meal Contribution
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Each expense ÷ total meal units
                  </p>
                  <div className="space-y-1.5">
                    {customExpenses.map((e) => {
                      const contribution = totalMeals > 0 ? (Number(e.amount) || 0) / totalMeals : 0;
                      const share = totalExpense > 0 ? ((Number(e.amount) || 0) / totalExpense) * 100 : 0;
                      return (
                        <div key={e.id} className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground truncate pr-2">
                              {e.name || "Untitled"}
                            </span>
                            <span className="font-semibold tabular-nums text-primary">
                              +{contribution.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Amount: {(Number(e.amount) || 0).toFixed(2)}</span>
                            <span>{share.toFixed(1)}% of total</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between pt-2 border-t border-border/50 text-xs font-bold">
                      <span>Sum / meal</span>
                      <span className="text-primary tabular-nums">{perMealCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Export options dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {exportFormat.toUpperCase()} report</DialogTitle>
            <DialogDescription>
              Choose what to include in your download.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
              <Checkbox
                checked={exportIncludeSettlement}
                onCheckedChange={(v) => setExportIncludeSettlement(v === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <div className="text-sm font-medium leading-none">Include Settlement Plan</div>
                <p className="text-xs text-muted-foreground">
                  Adds the who-pays-whom section at the end of the report.
                </p>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setExportDialogOpen(false);
                if (exportFormat === "csv") downloadReport(exportIncludeSettlement);
                else downloadPDF(exportIncludeSettlement);
              }}
            >
              {exportFormat === "csv" ? <Download size={14} /> : <FileText size={14} />}
              Download {exportFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
