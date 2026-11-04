import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Users, Plus, Trash2, Loader2, Building2 } from "lucide-react";
import { useMess } from "@/contexts/MessContext";
import { PER_MEAL_COST } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DbMember {
  id: string;
  profile_id: string | null;
  name: string;
  role: string;
  is_guest: boolean;
  is_active: boolean;
  total_meals: number;
  day_meals: number;
  night_meals: number;
  personal_purchases: number;
  advance_contributed: number;
}

export default function Members() {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const { currentMess } = useMess();
  const [members, setMembers] = useState<DbMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const defaultForm = { name: "", role: "member", is_guest: false };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const isAdminOrManager = userRole === "admin" || userRole === "moderator";

  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load members");
      console.error(error);
    } else {
      setMembers((data || []) as unknown as DbMember[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (member: DbMember) => {
    if (!isAdminOrManager) return;
    setEditingId(member.id);
    setForm({ name: member.name, role: member.role, is_guest: member.is_guest });
    setOpen(true);
  };

  const saveMember = async () => {
    if (!form.name) return;
    setSaving(true);
    if (editingId) {
      const { error } = await supabase
        .from("members")
        .update({ name: form.name, role: form.role, is_guest: form.is_guest } as any)
        .eq("id", editingId);
      if (error) { toast.error("Failed to update member"); console.error(error); }
      else toast.success("Member updated");
    } else {
      const { error } = await supabase
        .from("members")
        .insert({ name: form.name, role: form.role, is_guest: form.is_guest } as any);
      if (error) { toast.error("Failed to add member"); console.error(error); }
      else toast.success("Member added");
    }
    setSaving(false);
    setForm(defaultForm);
    setEditingId(null);
    setOpen(false);
    fetchMembers();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("members").delete().eq("id", deleteId);
    if (error) { toast.error("Failed to delete member"); console.error(error); }
    else toast.success("Member removed");
    setDeleteId(null);
    fetchMembers();
  };

  const toggleActive = async (id: string) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const { error } = await supabase
      .from("members")
      .update({ is_active: !member.is_active } as any)
      .eq("id", id);
    if (error) { toast.error("Failed to update status"); console.error(error); }
    fetchMembers();
  };

  const getBalance = (m: DbMember) => {
    const mealCost = m.total_meals * PER_MEAL_COST;
    return +(mealCost + m.personal_purchases - m.advance_contributed).toFixed(2);
  };

  if (loading) {
    return (
      <AppLayout title={t.members} subtitle={t.manageMembers} icon={<Users className="text-primary" size={22} />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t.members} subtitle={t.manageMembers} icon={<Users className="text-primary" size={22} />}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {currentMess && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Building2 size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Managing:</span>
            <span className="text-sm text-primary font-semibold">{currentMess.name}</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-sm text-muted-foreground">{members.filter((m) => m.is_active).length} {t.activeMembers}</p>
          {isAdminOrManager && (
            <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto">
              <Plus size={16} /> {t.addMember}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {members.map((member) => {
            const balance = getBalance(member);
            return (
              <div key={member.id} onClick={() => openEdit(member)} className={`glass-card p-4 md:p-5 cursor-pointer hover:ring-1 hover:ring-primary/40 transition-all ${!member.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm md:text-base">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {member.name}
                      {member.is_guest && <span className="badge-guest ml-2">{t.guest}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.role === "admin" ? t.admin : member.role === "manager" ? t.manager : t.member}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isAdminOrManager && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); toggleActive(member.id); }} className={`text-xs px-2 py-1 rounded-full font-medium ${member.is_active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                          {member.is_active ? t.active : t.inactive}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(member.id); }} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {!isAdminOrManager && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.is_active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                        {member.is_active ? t.active : t.inactive}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.totalMeals}</span><span className="text-primary font-medium">{member.total_meals}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.personalPurchases}</span><span className="text-foreground">৳{member.personal_purchases}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.advance}</span><span className="text-foreground">৳{member.advance_contributed}</span></div>
                  <div className="flex justify-between border-t border-border/30 pt-1.5">
                    <span className="text-muted-foreground">{t.balance}</span>
                    <span className={`font-bold ${balance > 0 ? "text-success" : "text-destructive"}`}>{balance > 0 ? "+" : ""}৳{balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{editingId ? t.editMember : t.addNewMember}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{editingId ? t.updateMemberDetails : t.fillMemberDetails}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.fullName}</Label>
              <Input placeholder={t.enterMemberName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.role}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                  <SelectItem value="manager">{t.manager}</SelectItem>
                  <SelectItem value="member">{t.member}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="guest" checked={form.is_guest} onCheckedChange={(v) => setForm({ ...form, is_guest: !!v })} />
              <Label htmlFor="guest" className="text-sm text-muted-foreground cursor-pointer">{t.guestMember}</Label>
            </div>
            <Button onClick={saveMember} disabled={saving} className="w-full mt-2">
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {editingId ? t.updateMemberBtn : t.saveMember}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{t.deleteMember}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{t.deleteMemberConfirm}</DialogDescription>
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
