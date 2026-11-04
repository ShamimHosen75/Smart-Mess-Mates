import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Receipt, Plus, Upload, ImageIcon, X, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMess } from "@/contexts/MessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = ["Fish", "Meat", "Vegetables", "Rent", "Gas", "Others"] as const;
type ExpenseCategory = (typeof CATEGORIES)[number];

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  added_by_name: string | null;
  receipt_url: string | null;
}

export default function Expenses() {
  const { t } = useLanguage();
  const { currentMess } = useMess();
  const { user } = useAuth();
  const messId = currentMess?.id;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const defaultForm = { description: "", amount: "", category: "Others" as ExpenseCategory, date: format(new Date(), "yyyy-MM-dd") };
  const [form, setForm] = useState(defaultForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("All");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!messId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("id, description, amount, category, expense_date, added_by_name, receipt_url")
      .eq("mess_id", messId)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Failed to load expenses", error);
    } else {
      setExpenses((data ?? []).map((e) => ({
        ...e,
        amount: Number(e.amount),
      })) as Expense[]);
    }
    setLoading(false);
  }, [messId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Realtime
  useEffect(() => {
    if (!messId) return;
    const channel = supabase
      .channel(`expenses-${messId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `mess_id=eq.${messId}` }, () => {
        fetchExpenses();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [messId, fetchExpenses]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setForm({ description: exp.description, amount: exp.amount.toString(), category: exp.category as ExpenseCategory, date: exp.expense_date });
    setReceiptPreview(exp.receipt_url || null);
    setReceiptFile(null);
    setOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setReceiptPreview(null);
    setReceiptFile(null);
    setOpen(true);
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile || !messId) return receiptPreview; // keep existing URL if no new file
    const ext = receiptFile.name.split(".").pop();
    const path = `${messId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, receiptFile);
    if (error) { toast.error("Receipt upload failed"); return null; }
    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveExpense = async () => {
    if (!form.description.trim() || !form.amount || !messId || !user) return;
    setSaving(true);
    try {
      const receiptUrl = receiptFile ? await uploadReceipt() : receiptPreview;

      if (editingId) {
        const { error } = await supabase.from("expenses").update({
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          category: form.category as any,
          expense_date: form.date,
          receipt_url: receiptUrl,
        }).eq("id", editingId);
        if (error) throw error;
        toast.success("Expense updated");
      } else {
        const { error } = await supabase.from("expenses").insert({
          mess_id: messId,
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          category: form.category as any,
          expense_date: form.date,
          added_by: user.id,
          added_by_name: user.user_metadata?.full_name || user.email || "Unknown",
          receipt_url: receiptUrl,
        } as any);
        if (error) throw error;
        toast.success("Expense added");
      }
      setForm(defaultForm);
      setReceiptPreview(null);
      setReceiptFile(null);
      setEditingId(null);
      setOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("expenses").delete().eq("id", deleteId);
    if (error) { toast.error("Failed to delete"); } else { toast.success("Expense deleted"); }
    setDeleteId(null);
    fetchExpenses();
  };

  const filtered = filterCat === "All" ? expenses : expenses.filter((e) => e.category === filterCat);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  if (!messId) {
    return (
      <AppLayout title={t.expenses} icon={<Receipt className="text-primary" size={22} />}>
        <div className="flex items-center justify-center py-20 text-muted-foreground">No mess selected</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t.expenses} subtitle={`${expenses.length} records`} icon={<Receipt className="text-primary" size={22} />}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {[t.all, ...CATEGORIES].map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat === t.all ? "All" : cat)} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(cat === t.all ? filterCat === "All" : filterCat === cat) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{cat}</button>
            ))}
          </div>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto">
            <Plus size={16} /> {t.addExpense}
          </button>
        </div>

        <div className="stat-card">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.total} ({filterCat === "All" ? t.all : filterCat})</p>
          <p className="text-2xl font-bold text-foreground">৳{total.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{filtered.length} {t.records}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No expenses recorded yet</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="glass-card overflow-hidden hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="text-left p-4 font-medium">{t.date}</th>
                    <th className="text-left p-4 font-medium">{t.description}</th>
                    <th className="text-left p-4 font-medium">{t.category}</th>
                    <th className="text-left p-4 font-medium">{t.addedBy}</th>
                    <th className="text-center p-4 font-medium">{t.receipt}</th>
                    <th className="text-right p-4 font-medium">{t.amount}</th>
                    <th className="text-center p-4 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp) => (
                    <tr key={exp.id} onClick={() => openEdit(exp)} className="border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <td className="p-4 text-muted-foreground">{exp.expense_date}</td>
                      <td className="p-4 text-foreground font-medium">{exp.description}</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">{exp.category}</span></td>
                      <td className="p-4 text-muted-foreground">{exp.added_by_name || "—"}</td>
                      <td className="p-4 text-center">
                        {exp.receipt_url ? (
                          <button onClick={(e) => { e.stopPropagation(); setViewReceipt(exp.receipt_url!); }} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><ImageIcon size={14} /> {t.view}</button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4 text-right font-bold text-foreground">৳{exp.amount.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(exp.id); }} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((exp) => (
                <div key={exp.id} onClick={() => openEdit(exp)} className="glass-card p-4 cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">{exp.expense_date} · {exp.added_by_name || "—"}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground flex-shrink-0">৳{exp.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">{exp.category}</span>
                    <div className="flex items-center gap-2">
                      {exp.receipt_url && (
                        <button onClick={(e) => { e.stopPropagation(); setViewReceipt(exp.receipt_url!); }} className="text-xs text-primary"><ImageIcon size={14} /></button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(exp.id); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{editingId ? t.editExpense : t.addNewExpense}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{editingId ? t.updateExpenseDetails : t.recordNewExpense}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.description}</Label>
              <Input placeholder={t.whatWasPurchased} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border focus:border-primary" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.amount} (৳)</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.category}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.date}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.receiptExpenseSlip}</Label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {receiptPreview ? (
                <div className="relative inline-block">
                  <img src={receiptPreview} alt="Receipt" className="h-28 rounded-lg border border-border object-cover" />
                  <button onClick={() => { setReceiptPreview(null); setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X size={12} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg border border-dashed border-border bg-secondary/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm"><Upload size={16} /> {t.uploadReceiptImage}</button>
              )}
            </div>
            <Button onClick={saveExpense} disabled={saving} className="w-full mt-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? t.updateExpense : t.saveExpense}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt viewer */}
      <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{t.receipt}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{t.receiptExpenseSlip}</DialogDescription>
          </DialogHeader>
          {viewReceipt && <img src={viewReceipt} alt="Receipt" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{t.deleteExpense}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{t.deleteExpenseConfirm}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>{t.cancel}</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>{t.delete}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
