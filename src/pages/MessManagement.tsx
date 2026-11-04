import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Building2, Plus, Trash2, Loader2, Users, Shield, UserPlus, ArrowRightLeft, Eye, Power, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMess } from "@/contexts/MessContext";

interface DbMess {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  is_active: boolean;
}

interface MessAdmin {
  user_id: string;
  full_name: string | null;
  mess_id: string | null;
}

interface MemberRow {
  id: string;
  name: string;
  mess_id: string | null;
  is_active: boolean;
  profile_id: string | null;
}

export default function MessManagement() {
  const { userRole } = useAuth();
  const { switchMess } = useMess();
  const [messes, setMesses] = useState<DbMess[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [mealCounts, setMealCounts] = useState<Record<string, number>>({});

  // Assign admin state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMessId, setAssignMessId] = useState<string | null>(null);
  const [approvedUsers, setApprovedUsers] = useState<MessAdmin[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [messAdmins, setMessAdmins] = useState<Record<string, MessAdmin[]>>({});

  // Transfer member state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFromMessId, setTransferFromMessId] = useState<string | null>(null);
  const [transferMembers, setTransferMembers] = useState<MemberRow[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [targetMessId, setTargetMessId] = useState("");
  const [transferring, setTransferring] = useState(false);

  // View members state
  const [viewMessId, setViewMessId] = useState<string | null>(null);
  const [viewMembers, setViewMembers] = useState<MemberRow[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  const isSuperAdmin = userRole === "super_admin";

  const fetchMesses = useCallback(async () => {
    const { data, error } = await supabase
      .from("messes")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load messes");
    } else {
      setMesses((data || []) as DbMess[]);
      const { data: members } = await supabase.from("members").select("mess_id, total_meals, is_active");
      if (members) {
        const counts: Record<string, number> = {};
        const meals: Record<string, number> = {};
        members.forEach((m: any) => {
          if (m.mess_id) {
            if (m.is_active) counts[m.mess_id] = (counts[m.mess_id] || 0) + 1;
            meals[m.mess_id] = (meals[m.mess_id] || 0) + Number(m.total_meals);
          }
        });
        setMemberCounts(counts);
        setMealCounts(meals);
      }
    }
    setLoading(false);
  }, []);

  const fetchMessAdmins = useCallback(async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, mess_id")
        .in("user_id", userIds);

      const adminsByMess: Record<string, MessAdmin[]> = {};
      (profiles || []).forEach((p: any) => {
        if (p.mess_id) {
          if (!adminsByMess[p.mess_id]) adminsByMess[p.mess_id] = [];
          adminsByMess[p.mess_id].push(p);
        }
      });
      setMessAdmins(adminsByMess);
    }
  }, []);

  useEffect(() => {
    fetchMesses();
    if (isSuperAdmin) fetchMessAdmins();
  }, [fetchMesses, fetchMessAdmins, isSuperAdmin]);

  const openAdd = () => { setEditingId(null); setName(""); setOpen(true); };
  const openEdit = (mess: DbMess) => {
    if (!isSuperAdmin) return;
    setEditingId(mess.id);
    setName(mess.name);
    setOpen(true);
  };

  const saveMess = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (editingId) {
      const { error } = await supabase
        .from("messes")
        .update({ name: name.trim() } as any)
        .eq("id", editingId);
      if (error) toast.error("Failed to update");
      else toast.success("Mess updated");
    } else {
      const { error } = await supabase
        .from("messes")
        .insert({ name: name.trim() } as any);
      if (error) toast.error("Failed to create mess");
      else toast.success("Mess created");
    }
    setSaving(false);
    setName("");
    setEditingId(null);
    setOpen(false);
    fetchMesses();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("messes").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete mess");
    else toast.success("Mess deleted");
    setDeleteId(null);
    fetchMesses();
  };

  const toggleActive = async (mess: DbMess) => {
    const { error } = await supabase
      .from("messes")
      .update({ is_active: !mess.is_active } as any)
      .eq("id", mess.id);
    if (error) toast.error("Failed to update status");
    else toast.success(mess.is_active ? "Mess disabled" : "Mess enabled");
    fetchMesses();
  };

  const openAssignAdmin = async (messId: string) => {
    setAssignMessId(messId);
    setSelectedUserId("");
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, mess_id")
      .eq("is_approved", true);
    setApprovedUsers((profiles || []) as MessAdmin[]);
    setAssignOpen(true);
  };

  const assignAdmin = async () => {
    if (!selectedUserId || !assignMessId) return;
    setAssigning(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ mess_id: assignMessId } as any)
      .eq("user_id", selectedUserId);

    if (profileError) {
      toast.error("Failed to assign user to mess");
      setAssigning(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", selectedUserId)
      .maybeSingle();

    if (profile) {
      await supabase
        .from("members")
        .update({ mess_id: assignMessId } as any)
        .eq("profile_id", profile.id);
    }

    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", selectedUserId)
      .maybeSingle();

    if (existingRole) {
      await supabase
        .from("user_roles")
        .update({ role: "admin" } as any)
        .eq("user_id", selectedUserId);
    } else {
      await supabase
        .from("user_roles")
        .insert({ user_id: selectedUserId, role: "admin" } as any);
    }

    toast.success("Admin assigned to mess successfully");
    setAssigning(false);
    setAssignOpen(false);
    fetchMesses();
    fetchMessAdmins();
  };

  // Transfer member
  const openTransfer = async (messId: string) => {
    setTransferFromMessId(messId);
    setSelectedMemberId("");
    setTargetMessId("");
    const { data } = await supabase
      .from("members")
      .select("id, name, mess_id, is_active, profile_id")
      .eq("mess_id", messId)
      .eq("is_active", true)
      .order("name");
    setTransferMembers((data || []) as MemberRow[]);
    setTransferOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedMemberId || !targetMessId) return;
    setTransferring(true);

    const { error } = await supabase
      .from("members")
      .update({ mess_id: targetMessId } as any)
      .eq("id", selectedMemberId);

    if (error) {
      toast.error("Failed to transfer member");
    } else {
      // Also update profile's mess_id if linked
      const member = transferMembers.find(m => m.id === selectedMemberId);
      if (member?.profile_id) {
        await supabase
          .from("profiles")
          .update({ mess_id: targetMessId } as any)
          .eq("id", member.profile_id);
      }
      toast.success("Member transferred successfully");
    }

    setTransferring(false);
    setTransferOpen(false);
    fetchMesses();
  };

  // View members
  const openViewMembers = async (messId: string) => {
    setViewMessId(messId);
    setViewLoading(true);
    const { data } = await supabase
      .from("members")
      .select("id, name, mess_id, is_active, profile_id")
      .eq("mess_id", messId)
      .order("name");
    setViewMembers((data || []) as MemberRow[]);
    setViewLoading(false);
  };

  const handleSwitchToMess = (messId: string) => {
    switchMess(messId);
    toast.success("Switched active mess");
  };

  if (loading) {
    return (
      <AppLayout title="Mess Management" subtitle="Manage your messes" icon={<Building2 className="text-primary" size={22} />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mess Management" subtitle="Create and manage separate messes" icon={<Building2 className="text-primary" size={22} />}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-sm text-muted-foreground">{messes.length} mess(es) total</p>
          {isSuperAdmin && (
            <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto">
              <Plus size={16} /> Create New Mess
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {messes.map((mess) => (
            <div
              key={mess.id}
              className={`glass-card p-4 md:p-5 hover:ring-1 hover:ring-primary/40 transition-all ${!mess.is_active ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${mess.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {mess.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{mess.name}</p>
                    {!mess.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/15 text-destructive">Disabled</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(mess.created_at).toLocaleDateString()}
                  </p>
                </div>
                {isSuperAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(mess)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Edit"
                    >
                      <Building2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(mess)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title={mess.is_active ? "Disable" : "Enable"}
                    >
                      {mess.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(mess.id); }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {memberCounts[mess.id] || 0} members
                </span>
                <span>{mealCounts[mess.id]?.toFixed(1) || 0} total meals</span>
              </div>

              {/* Admin badges */}
              {messAdmins[mess.id] && messAdmins[mess.id].length > 0 && (
                <div className="mb-3 pb-3 border-b border-border/30">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Admin(s)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {messAdmins[mess.id].map((admin) => (
                      <span key={admin.user_id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                        <Shield size={10} />
                        {admin.full_name || "Unnamed"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {isSuperAdmin && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSwitchToMess(mess.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Eye size={12} /> View
                  </button>
                  <button
                    onClick={() => openAssignAdmin(mess.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-accent/50 text-accent-foreground hover:bg-accent transition-colors"
                  >
                    <Shield size={12} /> Assign Admin
                  </button>
                  <button
                    onClick={() => openTransfer(mess.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <ArrowRightLeft size={12} /> Transfer
                  </button>
                  <button
                    onClick={() => openViewMembers(mess.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Users size={12} /> Members
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Mess Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingId ? "Edit Mess" : "Create New Mess"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {editingId ? "Update the mess name" : "Enter a name for the new mess"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Mess Name</Label>
              <Input
                placeholder="e.g. Office Mess, Home Mess"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-border focus:border-primary"
              />
            </div>
            <Button onClick={saveMess} disabled={saving} className="w-full mt-2">
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {editingId ? "Update Mess" : "Create Mess"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Delete Mess</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              This will permanently delete this mess and all its members. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Admin Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserPlus size={20} />
              Assign Admin to Mess
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Select a user to assign as admin for this mess.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedUsers.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name || "Unnamed User"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assignAdmin} disabled={assigning || !selectedUserId} className="w-full">
              {assigning ? <Loader2 className="animate-spin mr-2" size={16} /> : <Shield className="mr-2" size={16} />}
              Assign as Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Member Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <ArrowRightLeft size={20} />
              Transfer Member
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Move a member from this mess to another mess.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Select Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {transferMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Target Mess</Label>
              <Select value={targetMessId} onValueChange={setTargetMessId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose target mess..." />
                </SelectTrigger>
                <SelectContent>
                  {messes.filter(m => m.id !== transferFromMessId).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTransfer} disabled={transferring || !selectedMemberId || !targetMessId} className="w-full">
              {transferring ? <Loader2 className="animate-spin mr-2" size={16} /> : <ArrowRightLeft className="mr-2" size={16} />}
              Transfer Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={!!viewMessId} onOpenChange={() => setViewMessId(null)}>
        <DialogContent className="glass-card-glow border-border/50 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users size={20} />
              Members — {messes.find(m => m.id === viewMessId)?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {viewMembers.length} member(s) in this mess.
            </DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : viewMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No members in this mess.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pt-2">
              {viewMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.is_active ? "Active" : "Inactive"}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${m.is_active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
