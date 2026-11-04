import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Coins, Plus, Trash2 } from "lucide-react";
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

interface AdvanceRow {
  id: string;
  member_id: string;
  amount: number;
  advance_date: string;
  note: string;
  member_name: string;
}

interface MemberOption {
  id: string;
  name: string;
}

export default function Advances() {
  const { t } = useLanguage();
  const { currentMess } = useMess();
  const { user } = useAuth();
  const messId = currentMess?.id ?? null;

  const [advances, setAdvances] = useState<AdvanceRow[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const defaultForm = { memberId: "", amount: "", note: "", date: today };
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    if (!messId) { setAdvances([]); setMembers([]); setLoading(false); return; }
    setLoading(true);

    const [advRes, memRes] = await Promise.all([
      supabase
        .from("advances")
        .select("id, member_id, amount, advance_date, note")
        .eq("mess_id", messId)
        .order("advance_date", { ascending: false }),
      supabase
        .from("members")
        .select("id, name")
        .eq("mess_id", messId)
        .eq("is_active", true)
        .eq("is_guest", false)
        .order("name"),
    ]);

    const memberList: MemberOption[] = (memRes.data ?? []).map((m) => ({ id: m.id, name: m.name }));
    setMembers(memberList);

    const memberMap = Object.fromEntries(memberList.map((m) => [m.id, m.name]));
    setAdvances(
      (advRes.data ?? []).map((a) => ({
        id: a.id,
        member_id: a.member_id,
        amount: Number(a.amount),
        advance_date: a.advance_date,
        note: a.note ?? "",
        member_name: memberMap[a.member_id] ?? "Unknown",
      }))
    );
    setLoading(false);
  }, [messId]);

  useEffect(() => {
    fetchData();
    if (!messId) return;
    const channel = supabase
      .channel(`advances-${messId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advances", filter: `mess_id=eq.${messId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [messId, fetchData]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...defaultForm, memberId: members[0]?.id ?? "" });
    setOpen(true);
  };

  const openEdit = (adv: AdvanceRow) => {
    setEditingId(adv.id);
    setForm({ memberId: adv.member_id, amount: adv.amount.toString(), note: adv.note, date: adv.advance_date });
    setOpen(true);
  };

  const saveAdvance = async () => {
    if (!form.amount || !messId) return;
    if (editingId) {
      const { error } = await supabase.from("advances").update({
        member_id: form.memberId,
        amount: parseFloat(form.amount),
        advance_date: form.date,
        note: form.note,
      }).eq("id", editingId);
      if (error) { toast.error("Failed to update advance"); return; }
      toast.success("Advance updated");
    } else {
      const { error } = await supabase.from("advances").insert({
        mess_id: messId,
        member_id: form.memberId,
        amount: parseFloat(form.amount),
        advance_date: form.date,
        note: form.note,
        added_by: user?.id,
      });
      if (error) { toast.error("Failed to add advance"); return; }
      toast.success("Advance recorded");
    }
    setOpen(false);
    setEditingId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("advances").delete().eq("id", deleteId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Advance deleted");
    setDeleteId(null);
  };

  const total = advances.reduce((s, a) => s + a.amount, 0);

  return (
    <AppLayout title={t.advances} subtitle={t.trackContributions} icon={<Coins className="text-primary" size={22} />}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="stat-card w-full sm:flex-1 sm:max-w-xs">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.totalAdvances}</p>
            <p className="text-2xl font-bold text-foreground">৳{total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{advances.length} {t.entries}</p>
          </div>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto">
            <Plus size={16} /> {t.recordAdvance}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : advances.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">No advances recorded yet</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="glass-card overflow-hidden hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="text-left p-4 font-medium">{t.date}</th>
                    <th className="text-left p-4 font-medium">{t.member}</th>
                    <th className="text-left p-4 font-medium">{t.note}</th>
                    <th className="text-right p-4 font-medium">{t.amount}</th>
                    <th className="text-center p-4 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((adv) => (
                    <tr key={adv.id} onClick={() => openEdit(adv)} className="border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <td className="p-4 text-muted-foreground">{adv.advance_date}</td>
                      <td className="p-4 text-foreground font-medium">{adv.member_name}</td>
                      <td className="p-4 text-muted-foreground">{adv.note || "—"}</td>
                      <td className="p-4 text-right font-bold text-primary">৳{adv.amount.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(adv.id); }} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {advances.map((adv) => (
                <div key={adv.id} onClick={() => openEdit(adv)} className="glass-card p-4 cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{adv.member_name}</p>
                      <p className="text-xs text-muted-foreground">{adv.advance_date}</p>
                    </div>
                    <p className="text-sm font-bold text-primary flex-shrink-0">৳{adv.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{adv.note || "—"}</p>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(adv.id); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{editingId ? t.editAdvance : t.recordAdvance}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{editingId ? t.updateAdvanceDetails : t.recordAdvancePayment}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.member}</Label>
                <Select value={form.memberId} onValueChange={(v) => setForm({ ...form, memberId: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.amount} (৳)</Label>
                <Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.date}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border focus:border-primary" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.note}</Label>
                <Input placeholder={t.optionalNote} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="bg-secondary border-border focus:border-primary" />
              </div>
            </div>
            <Button onClick={saveAdvance} className="w-full mt-2">{editingId ? t.updateAdvanceBtn : t.saveAdvance}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{t.deleteAdvance}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{t.deleteAdvanceConfirm}</DialogDescription>
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
