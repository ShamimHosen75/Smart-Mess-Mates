import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History, Trash2, Upload, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMess } from "@/contexts/MessContext";
import { useMonth } from "@/contexts/MonthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface CalculatorState {
  breakfast: number;
  lunch: number;
  dinner: number;
  breakfastMul: number;
  lunchMul: number;
  dinnerMul: number;
  customMeals: { id: string; name: string; count: number; multiplier: number }[];
  customExpenses: { id: string; name: string; amount: number }[];
  totalMeals: number;
  totalExpense: number;
  perMealCost: number;
}

export interface SavedCalculation {
  id: string;
  name: string;
  month: string;
  notes: string | null;
  total_meals: number;
  total_expense: number;
  per_meal_cost: number;
  created_at: string;
  user_id: string;
  breakfast_count: number;
  lunch_count: number;
  dinner_count: number;
  breakfast_multiplier: number;
  lunch_multiplier: number;
  dinner_multiplier: number;
  custom_meals: any;
  custom_expenses: any;
}

interface Props {
  state: CalculatorState;
  onLoad: (calc: SavedCalculation) => void;
}

export default function SavedCalculations({ state, onLoad }: Props) {
  const { user } = useAuth();
  const { currentMess } = useMess();
  const { monthLabel, monthStart } = useMonth();

  const [items, setItems] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    if (!currentMess) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("meal_calculations")
      .select("*")
      .eq("mess_id", currentMess.id)
      .eq("month", monthStart)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Failed to load saved calculations");
      return;
    }
    setItems((data ?? []) as SavedCalculation[]);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMess?.id, monthStart]);

  const handleSave = async () => {
    if (!user || !currentMess) {
      toast.error("You must be in a mess to save");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a name");
      return;
    }
    if (trimmed.length > 100) {
      toast.error("Name must be under 100 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("meal_calculations").insert({
      mess_id: currentMess.id,
      user_id: user.id,
      name: trimmed,
      month: monthStart,
      notes: notes.trim().slice(0, 500) || null,
      breakfast_count: state.breakfast,
      lunch_count: state.lunch,
      dinner_count: state.dinner,
      breakfast_multiplier: state.breakfastMul,
      lunch_multiplier: state.lunchMul,
      dinner_multiplier: state.dinnerMul,
      custom_meals: state.customMeals as any,
      custom_expenses: state.customExpenses as any,
      total_meals: state.totalMeals,
      total_expense: state.totalExpense,
      per_meal_cost: state.perMealCost,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Calculation saved");
    setSaveOpen(false);
    setName("");
    setNotes("");
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meal_calculations").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History size={18} className="text-primary" /> Saved Calculations
          </CardTitle>
          <CardDescription className="truncate">For {monthLabel}</CardDescription>
        </div>
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Save size={14} /> Save
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save calculation</DialogTitle>
              <DialogDescription>
                Save current inputs and result for <strong>{monthLabel}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Mid-month estimate"
                />
              </div>
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Any context for this scenario…"
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground">Meals</p>
                  <p className="font-bold">{state.totalMeals.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expense</p>
                  <p className="font-bold">{state.totalExpense.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per Meal</p>
                  <p className="font-bold text-primary">{state.perMealCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No saved calculations for this month.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="group p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{it.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(it.created_at), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onLoad(it)} title="Load">
                      <Upload size={13} />
                    </Button>
                    {user?.id === it.user_id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleDelete(it.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Meals: </span>
                    <span className="font-semibold">{Number(it.total_meals).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exp: </span>
                    <span className="font-semibold">{Number(it.total_expense).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">/Meal: </span>
                    <span className="font-bold text-primary">{Number(it.per_meal_cost).toFixed(2)}</span>
                  </div>
                </div>
                {it.notes && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{it.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
